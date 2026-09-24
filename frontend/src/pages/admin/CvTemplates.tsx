import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileBadge, Pencil, Plus, Power, PowerOff, Star, Trash2 } from 'lucide-react';
import apiClient from '../../api/axios';
import { API_CONFIG } from '../../config/api';
import Pagination from '../../components/Pagination';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, SearchInput, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface CvTemplate {
  id: number;
  name: string;
  description: string | null;
  thumbnail: string | null;
  category: string;
  ats_score: number;
  is_active: boolean;
  is_default: boolean;
  customizable_options: string[] | null;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  creator?: { id: number; name: string; email?: string } | null;
}

interface CvTemplateFormData {
  name: string;
  description: string;
  category: string;
  ats_score: number;
  html_content: string;
  json_config: Record<string, unknown>;
  customizable_options: string[];
  thumbnail: File | null;
  field_mappings: Record<string, string>;
}

type FormErrors = Partial<Record<keyof CvTemplateFormData, string>>;

const CATEGORIES = ['general', 'executive', 'tech', 'creative', 'minimal', 'professional'];
const DEFAULT_OPTIONS = ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'];
const DEFAULT_JSON_CONFIG = { layout: 'single-column', sections: ['header', 'summary', 'experience', 'education', 'skills'], features: ['ATS-optimized', 'Clean layout'] };

const PLACEHOLDER_GROUPS: { title: string; fields: [string, string][] }[] = [
  {
    title: 'Personal information',
    fields: [
      ['fullName', 'Full name'],
      ['jobTitle', 'Job title'],
      ['email', 'Email'],
      ['phoneNumber', 'Phone'],
      ['address', 'Address'],
    ],
  },
  {
    title: 'Professional content',
    fields: [
      ['professionalSummary', 'Summary'],
      ['workExperience', 'Work experience'],
      ['education', 'Education'],
      ['skills', 'Skills'],
      ['projects', 'Projects'],
    ],
  },
  {
    title: 'Additional fields',
    fields: [
      ['certificates', 'Certificates'],
      ['languages', 'Languages'],
      ['interests', 'Interests'],
      ['references', 'References'],
    ],
  },
  {
    title: 'Styling variables',
    fields: [
      ['primaryColor', 'Primary colour'],
      ['secondaryColor', 'Secondary colour'],
      ['fontFamily', 'Font family'],
      ['fontSize', 'Font size'],
    ],
  },
];

const DEFAULT_FIELD_MAPPINGS: Record<string, string> = Object.fromEntries(PLACEHOLDER_GROUPS.flatMap((g) => g.fields.map(([key]) => [`{{${key}}}`, key])));

const emptyForm: CvTemplateFormData = {
  name: '',
  description: '',
  category: 'general',
  ats_score: 8,
  html_content: '',
  json_config: {},
  customizable_options: DEFAULT_OPTIONS,
  thumbnail: null,
  field_mappings: DEFAULT_FIELD_MAPPINGS,
};

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60';

const capitalise = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);
const thumbnailUrl = (thumbnail: string) => (thumbnail.startsWith('http') ? thumbnail : API_CONFIG.getStorageUrl(thumbnail));
const isEmptyObject = (value: unknown) => !value || (typeof value === 'object' && Object.keys(value as object).length === 0);

function serverErrors(error: unknown): FormErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors ?? {};
  const result: FormErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const field = key.split('.')[0] as keyof CvTemplateFormData;
    if (!result[field]) result[field] = Array.isArray(messages) ? messages[0] : String(messages);
  }
  return result;
}

/** Throws when the API answers 200 with `success: false`, so mutations surface the message. */
function ensureSuccess<T extends { success?: boolean; message?: string }>(data: T, fallback: string): T {
  if (data && data.success === false) throw new Error(data.message || fallback);
  return data;
}

export default function CvTemplates() {
  useSEO({ title: 'CV Templates | Admin', robots: 'noindex, nofollow' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editingTemplate, setEditingTemplate] = useState<CvTemplate | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CvTemplateFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  // Debounce the search box so we do not fire a request per keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const templatesQuery = useQuery({
    queryKey: ['admin-cv-templates', searchTerm, categoryFilter, activeFilter, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (activeFilter !== 'all') params.append('is_active', activeFilter === 'active' ? 'true' : 'false');
      if (page > 1) params.append('page', String(page));
      const { data } = await apiClient.get(`/admin/cv-templates?${params}`);
      if (data?.success === false) throw new Error(data.message || 'Failed to load templates');
      const paginator = (data?.data ?? {}) as { current_page?: number; last_page?: number; total?: number; per_page?: number };
      const templates = asList<CvTemplate>(data?.data ?? data);
      return {
        templates,
        currentPage: Number(paginator.current_page) || page,
        lastPage: Number(paginator.last_page) || 1,
        total: Number(paginator.total) || templates.length,
        perPage: Number(paginator.per_page) || 10,
      };
    },
  });

  const templates = templatesQuery.data?.templates ?? [];
  const filtersActive = Boolean(searchTerm || categoryFilter !== 'all' || activeFilter !== 'all');
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-cv-templates'] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editingTemplate) throw new Error('No template selected');
      const body = new FormData();
      body.append('name', formData.name.trim());
      body.append('description', formData.description || '');
      body.append('category', formData.category.trim());
      body.append('ats_score', String(formData.ats_score));
      body.append('html_content', formData.html_content.trim());
      // The API requires a non-empty json_config; fall back to the default layout config.
      body.append('json_config', JSON.stringify(isEmptyObject(formData.json_config) ? DEFAULT_JSON_CONFIG : formData.json_config));
      body.append('customizable_options', JSON.stringify(formData.customizable_options || []));
      body.append('field_mappings', JSON.stringify(formData.field_mappings || {}));
      if (formData.thumbnail instanceof File) body.append('thumbnail', formData.thumbnail);
      // Laravel does not parse multipart bodies on PUT, so spoof the method.
      body.append('_method', 'PUT');
      const { data } = await apiClient.post(`/admin/cv-templates/${editingTemplate.id}`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      return ensureSuccess(data, 'Failed to save template');
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Template updated' });
      closeModal();
      invalidate();
    },
    onError: (err) => {
      setErrors(serverErrors(err));
      addToast({ type: 'error', title: 'Could not save template', description: apiErrorMessage(err) });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'toggle' | 'set-default' | 'delete' }) => {
      const response = action === 'delete' ? await apiClient.delete(`/admin/cv-templates/${id}`) : await apiClient.post(`/admin/cv-templates/${id}/${action}`);
      return ensureSuccess(response.data, 'The action failed');
    },
    onSuccess: (_data, { action }) => {
      const titles = { toggle: 'Template status updated', 'set-default': 'Default template updated', delete: 'Template deleted' };
      addToast({ type: 'success', title: titles[action] });
      invalidate();
    },
    onError: (err) => addToast({ type: 'error', title: 'Action failed', description: apiErrorMessage(err) }),
  });

  const handleEdit = async (template: CvTemplate) => {
    setLoadingEditId(template.id);
    setErrors({});
    try {
      const { data } = await apiClient.get(`/admin/cv-templates/${template.id}`);
      const full = data?.success ? data.data : null;
      setFormData({
        name: full?.name ?? template.name ?? '',
        description: full?.description ?? template.description ?? '',
        category: full?.category ?? template.category ?? 'general',
        ats_score: Number(full?.ats_score ?? template.ats_score) || 8,
        html_content: full?.html_content ?? '',
        json_config: full?.json_config && typeof full.json_config === 'object' ? full.json_config : {},
        customizable_options: full?.customizable_options ?? template.customizable_options ?? DEFAULT_OPTIONS,
        thumbnail: null,
        field_mappings: full?.field_mappings && typeof full.field_mappings === 'object' ? full.field_mappings : DEFAULT_FIELD_MAPPINGS,
      });
      if (!full) addToast({ type: 'warning', title: 'Template details incomplete', description: 'The HTML content could not be loaded.' });
      setEditingTemplate(template);
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to load template details', description: apiErrorMessage(err) });
    } finally {
      setLoadingEditId(null);
    }
  };

  function closeModal() {
    setEditingTemplate(null);
    setFormData(emptyForm);
    setErrors({});
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!formData.name.trim()) next.name = 'Template name is required.';
    if (!formData.category.trim()) next.category = 'Category is required.';
    if (!Number.isInteger(formData.ats_score) || formData.ats_score < 1 || formData.ats_score > 10) next.ats_score = 'ATS score must be a whole number from 1 to 10.';
    if (!formData.html_content.trim()) next.html_content = 'HTML content is required.';
    setErrors(next);
    if (Object.keys(next).length) return;
    saveMutation.mutate();
  };

  const handleDelete = async (template: CvTemplate) => {
    if (template.is_default) {
      addToast({ type: 'warning', title: 'Cannot delete the default template', description: 'Set another template as default first.' });
      return;
    }
    const ok = await confirm({ title: 'Delete template', message: `Delete "${template.name}"? Users will no longer be able to pick it.`, confirmText: 'Delete', type: 'danger' });
    if (ok) actionMutation.mutate({ id: template.id, action: 'delete' });
  };

  const handleSetDefault = async (template: CvTemplate) => {
    const ok = await confirm({ title: 'Set default template', message: `Make "${template.name}" the default CV template for new users?`, confirmText: 'Set as default', type: 'info' });
    if (ok) actionMutation.mutate({ id: template.id, action: 'set-default' });
  };

  const pageInfo = templatesQuery.data;
  const busy = (id: number) => actionMutation.isPending && actionMutation.variables?.id === id;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="CV Templates"
        description="Templates offered in the CV builder. Only active templates are visible to users."
        actions={
          <button type="button" className={primaryBtn} onClick={() => navigate('/admin/cv-templates/create')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New template
          </button>
        }
      />

      <AdminCard padded={false}>
        <div className="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row">
          <div className="sm:w-72">
            <SearchInput label="Search templates" placeholder="Search templates…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <select
            aria-label="Filter by category"
            className={`${inputClass} sm:w-44`}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {capitalise(cat)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            className={`${inputClass} sm:w-36`}
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {templatesQuery.isLoading ? (
          <LoadingState label="Loading CV templates…" />
        ) : templatesQuery.isError ? (
          <ErrorState message={apiErrorMessage(templatesQuery.error)} onRetry={() => templatesQuery.refetch()} />
        ) : templates.length === 0 ? (
          <EmptyState
            icon={FileBadge}
            title={filtersActive ? 'No templates match your filters' : 'No CV templates yet'}
            description={filtersActive ? 'Try adjusting your search filters.' : 'Get started by creating a new template.'}
            action={
              filtersActive ? undefined : (
                <button type="button" className={primaryBtn} onClick={() => navigate('/admin/cv-templates/create')}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> New template
                </button>
              )
            }
          />
        ) : (
          <TableShell caption="CV templates">
            <thead>
              <tr>
                <th scope="col">Template</th>
                <th scope="col">Category</th>
                <th scope="col">ATS score</th>
                <th scope="col">Status</th>
                <th scope="col">Created by</th>
                <th scope="col" className="!text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.map((template) => (
                <tr key={template.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {template.thumbnail ? (
                        <img className="h-10 w-10 flex-none rounded-lg border border-slate-200 object-cover" src={thumbnailUrl(template.thumbnail)} alt="" loading="lazy" />
                      ) : (
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <FileBadge className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium text-slate-900">
                          {template.name}
                          {template.is_default && <Badge tone="info">Default</Badge>}
                        </p>
                        {template.description && <p className="line-clamp-1 max-w-xs text-xs text-slate-500">{template.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{capitalise(template.category)}</td>
                  <td>
                    <Badge tone={template.ats_score >= 8 ? 'success' : template.ats_score >= 5 ? 'warning' : 'danger'}>{template.ats_score}/10</Badge>
                  </td>
                  <td>
                    <Badge tone={template.is_active ? 'success' : 'neutral'}>{template.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-slate-500">{template.creator?.name || 'Unknown'}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton label={`Edit ${template.name}`} icon={Pencil} disabled={loadingEditId === template.id} onClick={() => handleEdit(template)} />
                      <IconButton
                        label={template.is_active ? `Deactivate ${template.name}` : `Activate ${template.name}`}
                        icon={template.is_active ? PowerOff : Power}
                        disabled={busy(template.id)}
                        onClick={() => actionMutation.mutate({ id: template.id, action: 'toggle' })}
                      />
                      {!template.is_default && (
                        <IconButton label={`Set ${template.name} as default`} icon={Star} disabled={busy(template.id)} onClick={() => handleSetDefault(template)} />
                      )}
                      <IconButton label={`Delete ${template.name}`} icon={Trash2} tone="danger" disabled={busy(template.id)} onClick={() => handleDelete(template)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </AdminCard>

      {pageInfo && pageInfo.lastPage > 1 && (
        <Pagination currentPage={pageInfo.currentPage} lastPage={pageInfo.lastPage} total={pageInfo.total} perPage={pageInfo.perPage} onPageChange={setPage} loading={templatesQuery.isFetching} />
      )}

      <Modal
        open={Boolean(editingTemplate)}
        onClose={closeModal}
        size="xl"
        title="Edit template"
        description={editingTemplate?.name}
        footer={
          <>
            <button type="button" className={secondaryBtn} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="cv-template-form" className={primaryBtn} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Update template'}
            </button>
          </>
        }
      >
        <form id="cv-template-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Template name" required error={errors.name}>
              {(props) => <input {...props} type="text" maxLength={255} className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />}
            </Field>
            <Field label="Category" required error={errors.category}>
              {(props) => (
                <select {...props} className={inputClass} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {capitalise(cat)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <Field label="Description" error={errors.description}>
            {(props) => <textarea {...props} rows={3} className={inputClass} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />}
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="ATS score (1–10)" required error={errors.ats_score}>
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min={1}
                  max={10}
                  className={inputClass}
                  value={Number.isNaN(formData.ats_score) ? '' : formData.ats_score}
                  onChange={(e) => setFormData({ ...formData, ats_score: parseInt(e.target.value, 10) })}
                />
              )}
            </Field>
            <Field label="Thumbnail" hint="JPG, PNG or GIF up to 2MB. Leave empty to keep the current image." error={errors.thumbnail}>
              {(props) => (
                <div className="flex items-center gap-3">
                  {editingTemplate?.thumbnail && <img src={thumbnailUrl(editingTemplate.thumbnail)} alt="Current thumbnail" className="h-12 w-12 flex-none rounded-lg border border-slate-200 object-cover" />}
                  <input
                    {...props}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files?.[0] || null })}
                  />
                </div>
              )}
            </Field>
          </div>
          <Field label="HTML content" required error={errors.html_content} hint="HTML with inline <style>. Use the placeholders below for CV data.">
            {(props) => (
              <textarea
                {...props}
                rows={12}
                spellCheck={false}
                className={`${inputClass} font-mono text-xs`}
                placeholder="Enter HTML/CSS template code..."
                value={formData.html_content}
                onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              />
            )}
          </Field>

          <details className="rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-800">Available placeholders</summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {PLACEHOLDER_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{group.title}</p>
                  <dl className="space-y-1">
                    {group.fields.map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <dt>
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{`{{${key}}}`}</code>
                        </dt>
                        <dd className="text-slate-600">{label}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </details>
        </form>
      </Modal>
    </div>
  );
}
