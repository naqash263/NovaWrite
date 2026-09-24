import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Eye, FileText, Lock, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import {
  AdminCard,
  AdminPageHeader,
  Badge,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  LoadingState,
  Modal,
  SearchInput,
  TableShell,
  inputClass,
} from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: string;
  category: string;
  variables?: string[] | null;
  description?: string | null;
  is_active: boolean;
  is_system?: boolean;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

interface TemplateForm {
  name: string;
  subject: string;
  body: string;
  description: string;
  category: string;
  type: string;
  language: string;
  is_active: boolean;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type Errors = Partial<Record<keyof TemplateForm, string>>;

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'user', label: 'User management' },
  { value: 'course', label: 'Course related' },
  { value: 'workflow', label: 'Workflow related' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'system', label: 'System notifications' },
];
const TYPES = [
  { value: 'html', label: 'HTML' },
  { value: 'markdown', label: 'Markdown' },
];
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
];

const EMPTY_FORM: TemplateForm = { name: '', subject: '', body: '', description: '', category: 'user', type: 'html', language: 'en', is_active: true };
const PER_PAGE = 20;

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60';

const labelOf = (list: { value: string; label: string }[], value: string) => list.find((x) => x.value === value)?.label ?? value;
const detectVariables = (text: string) => [...new Set([...text.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)].map((m) => m[1]))].sort();

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function serverErrors(error: unknown): Errors {
  const bag = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
  return bag ? (Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, v?.[0]])) as Errors) : {};
}

/** Renders untrusted template HTML in a sandboxed frame so scripts and styles can't touch the admin app. */
function EmailBodyPreview({ body, type }: { body: string; type: string }) {
  if (type !== 'html') return <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">{body}</pre>;
  return <iframe title="Email body preview" sandbox="" srcDoc={body} className="h-96 w-full rounded-lg border border-slate-200 bg-white" />;
}

export default function EmailTemplates() {
  useSEO({ title: 'Email Templates | Admin', description: 'Manage email templates for the application', robots: 'noindex, nofollow' });
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({ category: 'all', type: 'all', language: 'all', status: 'all' });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [previewing, setPreviewing] = useState<EmailTemplate | null>(null);

  useEffect(() => setPage(1), [filters, debouncedSearch]);

  const listQuery = useQuery({
    queryKey: ['email-templates', filters, debouncedSearch, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: PER_PAGE };
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.language !== 'all') params.language = filters.language;
      if (filters.status !== 'all') params.is_active = filters.status === 'active' ? 'true' : 'false';
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const payload = (await apiClient.get('/admin/email-templates', { params })).data;
      const items = asList<EmailTemplate>(payload);
      const meta: Meta = { current_page: 1, last_page: 1, per_page: PER_PAGE, total: items.length, ...(payload?.meta ?? {}) };
      return { items, meta };
    },
  });
  const templates = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const hasFilters = filters.category !== 'all' || filters.type !== 'all' || filters.language !== 'all' || filters.status !== 'all' || !!debouncedSearch.trim();

  const previewQuery = useQuery({
    queryKey: ['email-template-preview', previewing?.id],
    enabled: !!previewing,
    queryFn: async () => {
      const data = (await apiClient.get(`/admin/email-templates/${previewing!.id}/preview`)).data?.data;
      return (data?.preview ?? null) as { subject?: string; body?: string } | null;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['email-templates'] });

  const saveMutation = useMutation({
    mutationFn: async (payload: TemplateForm) =>
      editing ? (await apiClient.put(`/admin/email-templates/${editing.id}`, payload)).data : (await apiClient.post('/admin/email-templates', payload)).data,
    onSuccess: () => {
      addToast({ type: 'success', title: editing ? 'Template updated' : 'Template created' });
      setFormOpen(false);
      invalidate();
    },
    onError: (error) => {
      setErrors(serverErrors(error));
      addToast({ type: 'error', title: 'Could not save template', description: apiErrorMessage(error) });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (t: EmailTemplate) => (await apiClient.patch(`/admin/email-templates/${t.id}/toggle-active`)).data,
    onSuccess: (_d, t) => {
      addToast({ type: 'success', title: t.is_active ? 'Template deactivated' : 'Template activated' });
      invalidate();
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not change status', description: apiErrorMessage(error) }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (t: EmailTemplate) => apiClient.delete(`/admin/email-templates/${t.id}`),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Template deleted' });
      invalidate();
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not delete template', description: apiErrorMessage(error) }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    setForm({
      name: t.name ?? '',
      subject: t.subject ?? '',
      body: t.body ?? '',
      description: t.description ?? '',
      category: t.category || 'user',
      type: t.type || 'html',
      language: t.language || 'en',
      is_active: !!t.is_active,
    });
    setErrors({});
    setFormOpen(true);
  };

  const set = <K extends keyof TemplateForm>(key: K, value: TemplateForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!form.name.trim()) next.name = 'Template name is required.';
    else if (!/^[a-z0-9_.-]+$/i.test(form.name.trim())) next.name = 'Use letters, numbers, dots, dashes or underscores only.';
    if (!form.subject.trim()) next.subject = 'Subject is required.';
    if (!form.body.trim()) next.body = 'Email body is required.';
    setErrors(next);
    if (Object.keys(next).length) return;
    saveMutation.mutate({ ...form, name: form.name.trim(), subject: form.subject.trim() });
  };

  const handleDelete = async (t: EmailTemplate) => {
    const ok = await confirm({ title: 'Delete template', message: `Delete the "${t.name}" template? Emails that use it will fail to send.`, confirmText: 'Delete', type: 'danger' });
    if (ok) deleteMutation.mutate(t);
  };

  const detected = useMemo(() => detectVariables(`${form.subject} ${form.body}`), [form.subject, form.body]);

  const filterSelect = (key: keyof typeof filters, label: string, options: { value: string; label: string }[]) => (
    <Field label={label}>
      {(props) => (
        <select {...props} className={inputClass} value={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}>
          <option value="all">All</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Email Templates"
        description="Subjects and bodies for transactional and marketing emails. Use {{variable}} placeholders for dynamic content."
        actions={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New template
          </button>
        }
      />

      <AdminCard>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <Field label="Search">{(props) => <SearchInput {...props} label="Search templates" placeholder="Name or subject" value={search} onChange={(e) => setSearch(e.target.value)} />}</Field>
          </div>
          {filterSelect('category', 'Category', CATEGORIES)}
          {filterSelect('type', 'Type', TYPES)}
          {filterSelect('language', 'Language', LANGUAGES)}
          {filterSelect('status', 'Status', [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ])}
        </div>
      </AdminCard>

      <AdminCard padded={false} title="Templates" description={meta ? `${meta.total} template${meta.total === 1 ? '' : 's'}` : undefined}>
        {listQuery.isLoading ? (
          <LoadingState label="Loading templates…" />
        ) : listQuery.isError ? (
          <ErrorState message={apiErrorMessage(listQuery.error)} onRetry={() => listQuery.refetch()} />
        ) : templates.length === 0 ? (
          hasFilters ? (
            <EmptyState title="No templates match your filters" description="Try a different search or clear the filters." />
          ) : (
            <EmptyState
              icon={FileText}
              title="No email templates yet"
              description="Create a template to reuse subjects and bodies across the emails the site sends."
              action={
                <button type="button" className={btnPrimary} onClick={openCreate}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  New template
                </button>
              }
            />
          )
        ) : (
          <>
            <TableShell caption="Email templates">
              <thead>
                <tr>
                  <th scope="col">Template</th>
                  <th scope="col">Category</th>
                  <th scope="col">Type</th>
                  <th scope="col">Variables</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="relative">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map((t) => {
                  const vars = Array.isArray(t.variables) ? t.variables : [];
                  return (
                    <tr key={t.id}>
                      <td className="min-w-[14rem]">
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          {t.name}
                          {t.is_system && (
                            <Badge tone="warning">
                              <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
                              System
                            </Badge>
                          )}
                        </div>
                        <div className="max-w-md truncate text-xs text-slate-500">{t.subject}</div>
                      </td>
                      <td>
                        <Badge tone="info">{labelOf(CATEGORIES, t.category)}</Badge>
                      </td>
                      <td className="whitespace-nowrap">
                        {labelOf(TYPES, t.type)}
                        {t.language ? <span className="text-slate-400"> · {t.language.toUpperCase()}</span> : null}
                      </td>
                      <td>
                        <span className="flex max-w-xs flex-wrap gap-1">
                          {vars.slice(0, 3).map((v) => (
                            <code key={v} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{`{{${v}}}`}</code>
                          ))}
                          {vars.length > 3 && <span className="text-xs text-slate-500">+{vars.length - 3} more</span>}
                          {vars.length === 0 && <span className="text-xs text-slate-400">None</span>}
                        </span>
                      </td>
                      <td>
                        <Badge tone={t.is_active ? 'success' : 'neutral'}>{t.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <IconButton label={`Preview ${t.name}`} icon={Eye} onClick={() => setPreviewing(t)} />
                          {!t.is_system && (
                            <>
                              <IconButton label={`Edit ${t.name}`} icon={Pencil} onClick={() => openEdit(t)} />
                              <IconButton
                                label={`${t.is_active ? 'Deactivate' : 'Activate'} ${t.name}`}
                                icon={Power}
                                disabled={toggleMutation.isPending && toggleMutation.variables?.id === t.id}
                                onClick={() => toggleMutation.mutate(t)}
                              />
                              <IconButton label={`Delete ${t.name}`} icon={Trash2} tone="danger" onClick={() => handleDelete(t)} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
            {meta && meta.last_page > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
                <span>
                  Page {meta.current_page} of {meta.last_page}
                </span>
                <span className="flex gap-1">
                  <IconButton label="Previous page" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
                  <IconButton label="Next page" icon={ChevronRight} disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} />
                </span>
              </nav>
            )}
          </>
        )}
      </AdminCard>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="xl"
        title={editing ? `Edit template: ${editing.name}` : 'New email template'}
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="email-template-form" className={btnPrimary} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create template'}
            </button>
          </>
        }
      >
        <form id="email-template-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Template name" required error={errors.name} hint={editing ? 'The name is used by the code and cannot be changed.' : 'e.g. welcome_email, password_reset'}>
              {(props) => <input {...props} className={`${inputClass} font-mono`} value={form.name} disabled={!!editing} onChange={(e) => set('name', e.target.value)} />}
            </Field>
            <Field label="Subject" required error={errors.subject}>
              {(props) => <input {...props} className={inputClass} placeholder="Welcome to {{app_name}}!" value={form.subject} onChange={(e) => set('subject', e.target.value)} />}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category" error={errors.category}>
              {(props) => (
                <select {...props} className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Type" error={errors.type}>
              {(props) => (
                <select {...props} className={inputClass} value={form.type} onChange={(e) => set('type', e.target.value)}>
                  {TYPES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Language" error={errors.language}>
              {(props) => (
                <select {...props} className={inputClass} value={form.language} onChange={(e) => set('language', e.target.value)}>
                  {LANGUAGES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <Field label="Description" error={errors.description}>
            {(props) => <textarea {...props} rows={2} className={inputClass} placeholder="What this template is for" value={form.description} onChange={(e) => set('description', e.target.value)} />}
          </Field>
          <Field label="Email body" required error={errors.body} hint={form.type === 'html' ? 'HTML is allowed. Wrap variables in double braces, e.g. {{user_name}}.' : 'Markdown. Wrap variables in double braces, e.g. {{user_name}}.'}>
            {(props) => <textarea {...props} rows={10} className={`${inputClass} font-mono text-xs`} value={form.body} onChange={(e) => set('body', e.target.value)} />}
          </Field>
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Detected variables</p>
            <div className="flex min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-slate-300 p-2" aria-live="polite">
              {detected.length ? (
                detected.map((v) => <code key={v} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-800">{`{{${v}}}`}</code>)
              ) : (
                <span className="text-xs text-slate-500">No variables yet.</span>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            Active
          </label>
        </form>
      </Modal>

      <Modal open={!!previewing} onClose={() => setPreviewing(null)} size="xl" title={previewing ? `Preview: ${previewing.name}` : 'Preview'} description="Rendered with sample data.">
        {previewing &&
          (previewQuery.isLoading ? (
            <LoadingState label="Rendering preview…" />
          ) : (
            <div className="space-y-4">
              {previewQuery.isError && (
                <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Could not render with sample data ({apiErrorMessage(previewQuery.error)}). Showing the raw template.
                </p>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</p>
                <p className="mt-1 text-sm text-slate-900">{previewQuery.data?.subject ?? previewing.subject}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Body</p>
                <EmailBodyPreview body={previewQuery.data?.body ?? previewing.body ?? ''} type={previewing.type} />
              </div>
            </div>
          ))}
      </Modal>
    </div>
  );
}
