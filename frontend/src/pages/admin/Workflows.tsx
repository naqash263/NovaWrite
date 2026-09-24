import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileJson, ImageOff, Pencil, Plus, Trash2, Upload, Workflow as WorkflowIcon } from 'lucide-react';
import apiClient from '../../api/axios';
import EnhancedImageUpload from '../../components/EnhancedImageUpload';
import RichTextEditor from '../../components/RichTextEditor';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, SearchInput, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface WorkflowFile {
  id: number;
  file_id?: number;
  display_name?: string | null;
  description?: string | null;
  file?: { id: number; original_name?: string; name?: string } | null;
}

interface Workflow {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  product_description?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | string[] | null;
  seo_title?: string | null;
  tools?: string[] | null;
  benefits?: string[] | null;
  tags?: string[] | null;
  instructions?: string | null;
  estimated_time?: string | null;
  difficulty?: string | null;
  status: string;
  is_premium: boolean;
  workflow_category_id: number | null;
  image_url?: string | null;
  category?: { id: number; name: string } | null;
  created_at?: string;
  files?: WorkflowFile[] | null;
}

interface WorkflowCategory {
  id: number;
  name: string;
}

const emptyForm = {
  workflow_category_id: '',
  title: '',
  summary: '',
  description: '',
  product_description: '',
  meta_description: '',
  meta_keywords: '',
  seo_title: '',
  // Raw comma-separated text while typing; parsed into arrays on submit.
  tools: '',
  benefits: '',
  status: 'draft',
  is_premium: false,
  image_url: '',
  estimated_time: '',
  difficulty: 'intermediate',
  tags: '',
  instructions: '',
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

const joinList = (value: unknown) => (Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : '');

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

function serverErrors(error: unknown): FormErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors ?? {};
  const result: FormErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const field = key.split('.')[0] as keyof FormState;
    if (!result[field]) result[field] = messages?.[0];
  }
  return result;
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900">{children}</h3>;
}

export default function Workflows() {
  useSEO({ title: 'Manage Workflows | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setFormData((prev) => ({ ...prev, [key]: value }));

  const { data: workflows = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['workflows-admin'],
    queryFn: async () => asList<Workflow>((await apiClient.get('/admin/workflows')).data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-workflow-categories'],
    queryFn: async () => asList<WorkflowCategory>((await apiClient.get('/admin/workflow-categories')).data),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return workflows.filter((w) => {
      if (statusFilter === 'premium' ? !w.is_premium : statusFilter && w.status !== statusFilter) return false;
      if (!term) return true;
      return [w.title, w.summary, w.slug, w.category?.name].some((v) => typeof v === 'string' && v.toLowerCase().includes(term));
    });
  }, [workflows, search, statusFilter]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['workflows-admin'] });

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      (editingId ? await apiClient.put(`/admin/workflows/${editingId}`, data) : await apiClient.post('/admin/workflows', data)).data,
    onSuccess: () => {
      addToast({ type: 'success', title: editingId ? 'Workflow updated' : 'Workflow created' });
      invalidate();
      closeModal();
    },
    onError: (err) => {
      setErrors(serverErrors(err));
      addToast({ type: 'error', title: 'Could not save workflow', description: apiErrorMessage(err) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/workflows/${id}`),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Workflow deleted' });
      invalidate();
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not delete workflow', description: apiErrorMessage(err) }),
  });

  const uploadFileMutation = useMutation({
    mutationFn: async ({ workflowId, file, description }: { workflowId: number; file: File; description: string }) => {
      // Step 1: upload to the file library.
      const body = new FormData();
      body.append('file', file);
      const uploadResponse = await apiClient.post('/files', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      const fileId = uploadResponse.data?.file?.id;
      if (!fileId) throw new Error('The upload did not return a file id.');
      // Step 2: attach it to the workflow.
      const response = await apiClient.post(`/admin/workflows/${workflowId}/files`, {
        file_id: fileId,
        display_name: file.name,
        description: description || '',
        sort_order: 0,
      });
      return response.data;
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'File attached' });
      setUploadFile(null);
      setFileDescription('');
      setFileInputKey((k) => k + 1);
      invalidate();
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not upload file', description: apiErrorMessage(err) }),
  });

  const deleteFileMutation = useMutation({
    mutationFn: ({ workflowId, fileId }: { workflowId: number; fileId: number }) => apiClient.delete(`/admin/workflows/${workflowId}/files/${fileId}`),
    onSuccess: () => {
      addToast({ type: 'success', title: 'File removed' });
      invalidate();
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not remove file', description: apiErrorMessage(err) }),
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setUploadFile(null);
    setFileDescription('');
    setModalOpen(true);
  };

  const openEdit = (workflow: Workflow) => {
    setFormData({
      workflow_category_id: workflow.workflow_category_id ? String(workflow.workflow_category_id) : '',
      title: workflow.title ?? '',
      summary: workflow.summary ?? '',
      description: workflow.description ?? '',
      product_description: workflow.product_description ?? '',
      meta_description: workflow.meta_description ?? '',
      meta_keywords: joinList(workflow.meta_keywords),
      seo_title: workflow.seo_title ?? '',
      tools: joinList(workflow.tools),
      benefits: joinList(workflow.benefits),
      status: workflow.status || 'draft',
      is_premium: Boolean(workflow.is_premium),
      image_url: workflow.image_url ?? '',
      estimated_time: workflow.estimated_time ?? '',
      difficulty: workflow.difficulty || 'intermediate',
      tags: joinList(workflow.tags),
      instructions: workflow.instructions ?? '',
    });
    setEditingId(workflow.id);
    setErrors({});
    setUploadFile(null);
    setFileDescription('');
    setModalOpen(true);
  };

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setErrors({});
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!formData.workflow_category_id) next.workflow_category_id = 'Select a category.';
    if (!formData.title.trim()) next.title = 'Title is required.';
    if (!formData.description.trim()) next.description = 'Description is required.';
    setErrors(next);
    if (Object.keys(next).length) return;
    saveMutation.mutate({
      ...formData,
      title: formData.title.trim(),
      tools: splitList(formData.tools),
      benefits: splitList(formData.benefits),
      tags: splitList(formData.tags),
      workflow_category_id: Number(formData.workflow_category_id),
    });
  };

  const handleDelete = async (workflow: Workflow) => {
    const ok = await confirm({ title: 'Delete workflow', message: `Delete "${workflow.title}" and its attached files? This cannot be undone.`, confirmText: 'Delete', type: 'danger' });
    if (ok) deleteMutation.mutate(workflow.id);
  };

  const handleDeleteFile = async (workflowId: number, file: WorkflowFile) => {
    const ok = await confirm({ title: 'Remove file', message: `Remove "${fileLabel(file)}" from this workflow?`, confirmText: 'Remove', type: 'danger' });
    if (ok) deleteFileMutation.mutate({ workflowId, fileId: file.id });
  };

  const currentWorkflow = workflows.find((w) => w.id === editingId);
  const currentFiles = asList<WorkflowFile>(currentWorkflow?.files);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Workflows"
        description="Automation workflow templates, their SEO metadata and downloadable files."
        actions={
          <button type="button" className={primaryBtn} onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New workflow
          </button>
        }
      />

      <AdminCard
        padded={false}
        title="All workflows"
        description={
          isLoading || isError
            ? undefined
            : `${workflows.length} total · ${workflows.filter((w) => w.status === 'published').length} published · ${workflows.filter((w) => w.is_premium).length} premium`
        }
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="sm:w-60">
              <SearchInput label="Search workflows" placeholder="Search workflows…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select aria-label="Filter workflows" className={`${inputClass} sm:w-40`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All workflows</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        }
      >
        {isLoading ? (
          <LoadingState label="Loading workflows…" />
        ) : isError ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : workflows.length === 0 ? (
          <EmptyState
            icon={WorkflowIcon}
            title="No workflows yet"
            description="Create your first workflow template."
            action={
              <button type="button" className={primaryBtn} onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New workflow
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching workflows" description="Try a different search or filter." />
        ) : (
          <TableShell caption="Workflows">
            <thead>
              <tr>
                <th scope="col">Workflow</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Files</th>
                <th scope="col">Created</th>
                <th scope="col" className="!text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((workflow) => (
                <tr key={workflow.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {workflow.image_url ? (
                        <img src={workflow.image_url} alt="" className="h-10 w-10 flex-none rounded-lg border border-slate-200 object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
                          <ImageOff className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{workflow.title}</p>
                        {workflow.summary && <p className="line-clamp-1 max-w-xs text-xs text-slate-500">{workflow.summary}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{workflow.category?.name || <span className="text-slate-400">—</span>}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={workflow.status === 'published' ? 'success' : 'neutral'}>{workflow.status === 'published' ? 'Published' : 'Draft'}</Badge>
                      {workflow.is_premium && <Badge tone="info">Premium</Badge>}
                    </div>
                  </td>
                  <td className="tabular-nums text-slate-500">{asList(workflow.files).length}</td>
                  <td className="whitespace-nowrap text-slate-500">{formatDate(workflow.created_at)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton label={`Edit ${workflow.title}`} icon={Pencil} onClick={() => openEdit(workflow)} />
                      <IconButton
                        label={`Delete ${workflow.title}`}
                        icon={Trash2}
                        tone="danger"
                        disabled={deleteMutation.isPending && deleteMutation.variables === workflow.id}
                        onClick={() => handleDelete(workflow)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </AdminCard>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="xl"
        title={editingId ? 'Edit workflow' : 'New workflow'}
        description="Fields marked * are required."
        footer={
          <>
            <button type="button" className={secondaryBtn} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="workflow-form" className={primaryBtn} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editingId ? 'Update workflow' : 'Create workflow'}
            </button>
          </>
        }
      >
        <form id="workflow-form" onSubmit={handleSubmit} noValidate className="space-y-6">
          <section className="space-y-4">
            <SectionTitle>Basics</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Category" required error={errors.workflow_category_id}>
                {(props) => (
                  <select {...props} className={inputClass} value={formData.workflow_category_id} onChange={(e) => update('workflow_category_id', e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Title" required error={errors.title}>
                {(props) => <input {...props} type="text" maxLength={255} className={inputClass} value={formData.title} onChange={(e) => update('title', e.target.value)} />}
              </Field>
            </div>
            <Field label="Summary" error={errors.summary}>
              {(props) => <input {...props} type="text" className={inputClass} value={formData.summary} onChange={(e) => update('summary', e.target.value)} />}
            </Field>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">
                Description <span className="text-red-600" aria-hidden="true">*</span>
              </p>
              <RichTextEditor value={formData.description} onChange={(description) => update('description', description)} placeholder="Enter workflow description..." height={280} />
              {errors.description && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.description}
                </p>
              )}
            </div>
            <EnhancedImageUpload onImageUploaded={(imageUrl) => update('image_url', imageUrl)} currentImage={formData.image_url} label="Workflow Image" maxSize={5} />
          </section>

          <section className="space-y-4">
            <SectionTitle>Details</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tools used" hint="Separate with commas" error={errors.tools}>
                {(props) => <input {...props} type="text" className={inputClass} placeholder="n8n, OpenAI, Slack" value={formData.tools} onChange={(e) => update('tools', e.target.value)} />}
              </Field>
              <Field label="Key benefits" hint="Separate with commas" error={errors.benefits}>
                {(props) => (
                  <input {...props} type="text" className={inputClass} placeholder="Faster processing, Cost savings" value={formData.benefits} onChange={(e) => update('benefits', e.target.value)} />
                )}
              </Field>
              <Field label="Estimated time" error={errors.estimated_time}>
                {(props) => (
                  <input {...props} type="text" className={inputClass} placeholder="e.g., 30 minutes" value={formData.estimated_time} onChange={(e) => update('estimated_time', e.target.value)} />
                )}
              </Field>
              <Field label="Difficulty" error={errors.difficulty}>
                {(props) => (
                  <select {...props} className={inputClass} value={formData.difficulty} onChange={(e) => update('difficulty', e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                )}
              </Field>
              <Field label="Tags" hint="Separate with commas" error={errors.tags}>
                {(props) => <input {...props} type="text" className={inputClass} placeholder="automation, n8n, productivity" value={formData.tags} onChange={(e) => update('tags', e.target.value)} />}
              </Field>
              <Field label="Status" error={errors.status}>
                {(props) => (
                  <select {...props} className={inputClass} value={formData.status} onChange={(e) => update('status', e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                )}
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={formData.is_premium} onChange={(e) => update('is_premium', e.target.checked)} />
              Premium workflow
            </label>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Instructions</p>
              <RichTextEditor value={formData.instructions} onChange={(instructions) => update('instructions', instructions)} placeholder="Enter step-by-step instructions for this workflow..." height={220} />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>SEO</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="SEO title" hint="Defaults to the workflow title. Recommended 50–60 characters." error={errors.seo_title}>
                {(props) => <input {...props} type="text" maxLength={70} className={inputClass} value={formData.seo_title} onChange={(e) => update('seo_title', e.target.value)} />}
              </Field>
              <Field label="Meta keywords" hint="Comma-separated" error={errors.meta_keywords}>
                {(props) => <input {...props} type="text" className={inputClass} value={formData.meta_keywords} onChange={(e) => update('meta_keywords', e.target.value)} />}
              </Field>
            </div>
            <Field label="Meta description" hint={`${formData.meta_description.length}/160 characters`} error={errors.meta_description}>
              {(props) => (
                <textarea {...props} rows={2} maxLength={160} className={inputClass} value={formData.meta_description} onChange={(e) => update('meta_description', e.target.value)} />
              )}
            </Field>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Product description (AI &amp; SEO friendly)</p>
              <RichTextEditor
                value={formData.product_description}
                onChange={(product_description) => update('product_description', product_description)}
                placeholder="Enter detailed product description optimized for AI and search engines..."
                height={220}
              />
            </div>
          </section>
        </form>

        {editingId && (
          <section className="mt-6 space-y-4" aria-label="Attached files">
            <SectionTitle>Attached files</SectionTitle>
            {currentFiles.length > 0 ? (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {currentFiles.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileJson className="h-4 w-4 flex-none text-slate-400" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{fileLabel(file)}</p>
                        {file.description && <p className="truncate text-xs text-slate-500">{file.description}</p>}
                      </div>
                    </div>
                    <IconButton label={`Remove ${fileLabel(file)}`} icon={Trash2} tone="danger" onClick={() => handleDeleteFile(editingId, file)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No files attached yet.</p>
            )}
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <Field label="Upload file (JSON)">
                {(props) => (
                  <input
                    {...props}
                    key={fileInputKey}
                    type="file"
                    accept=".json"
                    className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                )}
              </Field>
              <Field label="File description">
                {(props) => (
                  <input {...props} type="text" className={inputClass} placeholder="Optional" value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} />
                )}
              </Field>
              <button
                type="button"
                className={secondaryBtn}
                disabled={uploadFileMutation.isPending || !uploadFile}
                onClick={() => uploadFile && uploadFileMutation.mutate({ workflowId: editingId, file: uploadFile, description: fileDescription })}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {uploadFileMutation.isPending ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </section>
        )}
      </Modal>
    </div>
  );
}

function fileLabel(file: WorkflowFile) {
  return file.display_name || file.file?.original_name || file.file?.name || `File #${file.id}`;
}
