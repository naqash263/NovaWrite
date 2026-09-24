import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FolderKanban, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import apiClient from '../../api/axios';
import EnhancedImageUpload from '../../components/EnhancedImageUpload';
import RichTextEditor from '../../components/RichTextEditor';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, SearchInput, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface Project {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  product_description?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | string[] | null;
  seo_title?: string | null;
  image_url?: string | null;
  project_url?: string | null;
  github_url?: string | null;
  technologies?: string[] | null;
  features?: string[] | null;
  status: string;
  is_published: boolean;
  is_featured: boolean;
  order: number;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

const STATUSES = [
  { value: 'draft', label: 'Draft', tone: 'info' },
  { value: 'in_progress', label: 'In progress', tone: 'warning' },
  { value: 'completed', label: 'Completed', tone: 'success' },
  { value: 'archived', label: 'Archived', tone: 'neutral' },
] as const;

const emptyForm = {
  title: '',
  summary: '',
  description: '',
  product_description: '',
  meta_description: '',
  meta_keywords: '',
  seo_title: '',
  image_url: '',
  project_url: '',
  github_url: '',
  // Kept as raw text while typing (so commas can be typed); parsed into arrays on submit.
  technologies: '',
  features: '',
  status: 'draft',
  is_published: false,
  is_featured: false,
  order: 0,
  start_date: '',
  end_date: '',
};

type FormState = typeof emptyForm;
type FormErrors = Partial<Record<keyof FormState, string>>;

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60';

const splitList = (value: string) =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const isUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const dateInput = (value?: string | null) => (value ? String(value).slice(0, 10) : '');

function serverErrors(error: unknown): FormErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors ?? {};
  const result: FormErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const field = key.split('.')[0] as keyof FormState;
    if (!result[field]) result[field] = messages?.[0];
  }
  return result;
}

const statusMeta = (status: string) => STATUSES.find((s) => s.value === status) ?? { value: status, label: status || 'Unknown', tone: 'neutral' as const };

export default function Projects() {
  useSEO({ title: 'Manage Projects | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setFormData((prev) => ({ ...prev, [key]: value }));

  const { data: projects = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects-admin'],
    queryFn: async () => asList<Project>((await apiClient.get('/admin/projects')).data),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (!term) return true;
      return [p.title, p.summary, p.slug, ...(Array.isArray(p.technologies) ? p.technologies : [])].some((v) => typeof v === 'string' && v.toLowerCase().includes(term));
    });
  }, [projects, search, statusFilter]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      (editingId ? await apiClient.put(`/admin/projects/${editingId}`, data) : await apiClient.post('/admin/projects', data)).data,
    onSuccess: () => {
      addToast({ type: 'success', title: editingId ? 'Project updated' : 'Project created' });
      queryClient.invalidateQueries({ queryKey: ['projects-admin'] });
      closeModal();
    },
    onError: (err) => {
      setErrors(serverErrors(err));
      addToast({ type: 'error', title: 'Could not save project', description: apiErrorMessage(err) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/projects/${id}`),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Project deleted' });
      queryClient.invalidateQueries({ queryKey: ['projects-admin'] });
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not delete project', description: apiErrorMessage(err) }),
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setFormData({
      title: project.title ?? '',
      summary: project.summary ?? '',
      description: project.description ?? '',
      product_description: project.product_description ?? '',
      meta_description: project.meta_description ?? '',
      meta_keywords: Array.isArray(project.meta_keywords) ? project.meta_keywords.join(', ') : (project.meta_keywords ?? ''),
      seo_title: project.seo_title ?? '',
      image_url: project.image_url ?? '',
      project_url: project.project_url ?? '',
      github_url: project.github_url ?? '',
      technologies: Array.isArray(project.technologies) ? project.technologies.join(', ') : '',
      features: Array.isArray(project.features) ? project.features.join(', ') : '',
      status: project.status || 'draft',
      is_published: Boolean(project.is_published),
      is_featured: Boolean(project.is_featured),
      order: Number(project.order) || 0,
      start_date: dateInput(project.start_date),
      end_date: dateInput(project.end_date),
    });
    setEditingId(project.id);
    setErrors({});
    setModalOpen(true);
  };

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setErrors({});
  }

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!formData.title.trim()) next.title = 'Title is required.';
    if (!formData.description.trim()) next.description = 'Description is required.';
    if (formData.project_url && !isUrl(formData.project_url)) next.project_url = 'Enter a full URL starting with https://';
    if (formData.github_url && !isUrl(formData.github_url)) next.github_url = 'Enter a full URL starting with https://';
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) next.end_date = 'End date must be on or after the start date.';
    return next;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    saveMutation.mutate({
      ...formData,
      title: formData.title.trim(),
      technologies: splitList(formData.technologies),
      features: splitList(formData.features),
      order: Number(formData.order) || 0,
      // Empty optional fields are sent as null.
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      project_url: formData.project_url || null,
      github_url: formData.github_url || null,
      image_url: formData.image_url?.trim() || null,
    });
  };

  const handleDelete = async (project: Project) => {
    const ok = await confirm({ title: 'Delete project', message: `Delete "${project.title}"? This cannot be undone.`, confirmText: 'Delete', type: 'danger' });
    if (ok) deleteMutation.mutate(project.id);
  };

  const stats = {
    total: projects.length,
    published: projects.filter((p) => p.is_published).length,
    featured: projects.filter((p) => p.is_featured).length,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projects"
        description="Portfolio projects shown on the public site."
        actions={
          <button type="button" className={primaryBtn} onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New project
          </button>
        }
      />

      <AdminCard
        padded={false}
        title="All projects"
        description={isLoading || isError ? undefined : `${stats.total} total · ${stats.published} published · ${stats.featured} featured`}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="sm:w-60">
              <SearchInput label="Search projects" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select aria-label="Filter by status" className={`${inputClass} sm:w-40`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {isLoading ? (
          <LoadingState label="Loading projects…" />
        ) : isError ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Add your first portfolio project."
            action={
              <button type="button" className={primaryBtn} onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New project
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching projects" description="Try a different search or status filter." />
        ) : (
          <TableShell caption="Projects">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Visibility</th>
                <th scope="col">Order</th>
                <th scope="col" className="!text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((project) => {
                const status = statusMeta(project.status);
                return (
                  <tr key={project.id}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-900">{project.title}</span>
                        {project.is_featured && <Star className="h-3.5 w-3.5 flex-none fill-amber-400 text-amber-500" aria-label="Featured" />}
                      </div>
                      {project.summary && <p className="mt-0.5 line-clamp-1 max-w-sm text-xs text-slate-500">{project.summary}</p>}
                    </td>
                    <td>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={project.is_published ? 'success' : 'neutral'}>{project.is_published ? 'Published' : 'Hidden'}</Badge>
                        {project.is_featured && <Badge tone="warning">Featured</Badge>}
                      </div>
                    </td>
                    <td className="tabular-nums text-slate-500">{project.order ?? 0}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {project.project_url && (
                          <a
                            href={project.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${project.title} website`}
                            title="Open project URL"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        )}
                        <IconButton label={`Edit ${project.title}`} icon={Pencil} onClick={() => openEdit(project)} />
                        <IconButton
                          label={`Delete ${project.title}`}
                          icon={Trash2}
                          tone="danger"
                          disabled={deleteMutation.isPending && deleteMutation.variables === project.id}
                          onClick={() => handleDelete(project)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </AdminCard>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="xl"
        title={editingId ? 'Edit project' : 'New project'}
        description="Fields marked * are required."
        footer={
          <>
            <button type="button" className={secondaryBtn} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="project-form" className={primaryBtn} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editingId ? 'Update project' : 'Create project'}
            </button>
          </>
        }
      >
        <form id="project-form" onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" required error={errors.title}>
              {(props) => <input {...props} type="text" maxLength={255} className={inputClass} value={formData.title} onChange={(e) => update('title', e.target.value)} />}
            </Field>
            <Field label="Summary" error={errors.summary}>
              {(props) => (
                <input {...props} type="text" className={inputClass} placeholder="Brief summary of the project" value={formData.summary} onChange={(e) => update('summary', e.target.value)} />
              )}
            </Field>
          </div>

          <div>
            <p className="mb-1 block text-sm font-medium text-slate-700">
              Description <span className="text-red-600" aria-hidden="true">*</span>
            </p>
            <RichTextEditor value={formData.description} onChange={(description) => update('description', description)} placeholder="Enter project description..." height={280} />
            {errors.description && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <p className="mb-1 block text-sm font-medium text-slate-700">Product description (AI &amp; SEO friendly)</p>
            <RichTextEditor
              value={formData.product_description}
              onChange={(product_description) => update('product_description', product_description)}
              placeholder="Enter detailed product description optimized for AI and search engines..."
              height={220}
            />
            <p className="mt-1 text-xs text-slate-500">Used for SEO and AI search optimisation.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SEO title" hint="Recommended: 50–60 characters" error={errors.seo_title}>
              {(props) => (
                <input {...props} type="text" maxLength={70} className={inputClass} placeholder="e.g., Best AI Automation Project" value={formData.seo_title} onChange={(e) => update('seo_title', e.target.value)} />
              )}
            </Field>
            <Field label="Meta keywords" hint="Comma-separated" error={errors.meta_keywords}>
              {(props) => (
                <input {...props} type="text" className={inputClass} placeholder="AI automation, web development" value={formData.meta_keywords} onChange={(e) => update('meta_keywords', e.target.value)} />
              )}
            </Field>
          </div>
          <Field label="Meta description" hint={`${formData.meta_description.length}/160 characters`} error={errors.meta_description}>
            {(props) => (
              <textarea
                {...props}
                rows={2}
                maxLength={160}
                className={inputClass}
                placeholder="Brief description for search engine results..."
                value={formData.meta_description}
                onChange={(e) => update('meta_description', e.target.value)}
              />
            )}
          </Field>

          <EnhancedImageUpload onImageUploaded={(imageUrl) => update('image_url', imageUrl)} currentImage={formData.image_url} label="Project Image" maxSize={5} />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Project URL" error={errors.project_url}>
              {(props) => <input {...props} type="url" className={inputClass} placeholder="https://example.com" value={formData.project_url} onChange={(e) => update('project_url', e.target.value)} />}
            </Field>
            <Field label="GitHub URL" error={errors.github_url}>
              {(props) => (
                <input {...props} type="url" className={inputClass} placeholder="https://github.com/username/repo" value={formData.github_url} onChange={(e) => update('github_url', e.target.value)} />
              )}
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Technologies used" hint="Separate with commas" error={errors.technologies}>
              {(props) => (
                <input {...props} type="text" className={inputClass} placeholder="React, Node.js, PostgreSQL" value={formData.technologies} onChange={(e) => update('technologies', e.target.value)} />
              )}
            </Field>
            <Field label="Key features" hint="Separate with commas" error={errors.features}>
              {(props) => (
                <input {...props} type="text" className={inputClass} placeholder="Real-time updates, API integration" value={formData.features} onChange={(e) => update('features', e.target.value)} />
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Field label="Status" error={errors.status}>
              {(props) => (
                <select {...props} className={inputClass} value={formData.status} onChange={(e) => update('status', e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Order" hint="Lower numbers appear first" error={errors.order}>
              {(props) => <input {...props} type="number" min={0} className={inputClass} value={formData.order} onChange={(e) => update('order', parseInt(e.target.value, 10) || 0)} />}
            </Field>
            <Field label="Start date" error={errors.start_date}>
              {(props) => <input {...props} type="date" className={inputClass} value={formData.start_date} onChange={(e) => update('start_date', e.target.value)} />}
            </Field>
            <Field label="End date" error={errors.end_date}>
              {(props) => <input {...props} type="date" className={inputClass} value={formData.end_date} onChange={(e) => update('end_date', e.target.value)} />}
            </Field>
          </div>

          <fieldset className="flex flex-wrap gap-6">
            <legend className="sr-only">Visibility</legend>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={formData.is_published} onChange={(e) => update('is_published', e.target.checked)} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={formData.is_featured} onChange={(e) => update('is_featured', e.target.checked)} />
              Featured
            </label>
          </fieldset>
        </form>
      </Modal>
    </div>
  );
}
