import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import apiClient from '../../api/axios';
import ImageUpload from '../../components/ImageUpload';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, SearchInput, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface Workflow {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  tools?: string[] | null;
  benefits?: string[] | null;
  status: string;
  is_featured?: boolean;
  workflow_category_id: number | null;
  image_url?: string | null;
  category?: { id: number; name: string } | null;
  created_at?: string;
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
  // Raw comma-separated text while typing; parsed into arrays on submit.
  tools: '',
  benefits: '',
  status: 'draft',
  is_featured: false,
  image_url: '',
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

function serverErrors(error: unknown): FormErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors ?? {};
  const result: FormErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const field = key.split('.')[0] as keyof FormState;
    if (!result[field]) result[field] = messages?.[0];
  }
  return result;
}

/**
 * Lightweight workflow editor used to test the workflow API end to end.
 * Lists workflows from the public endpoint (published only); writes go to the admin API.
 */
export default function TestWorkflows() {
  useSEO({ title: 'Test Workflows | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setFormData((prev) => ({ ...prev, [key]: value }));

  const { data: workflows = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['test-workflows'],
    queryFn: async () => asList<Workflow>((await apiClient.get('/workflows')).data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['workflow-categories'],
    queryFn: async () => asList<WorkflowCategory>((await apiClient.get('/workflow-categories')).data),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return workflows;
    return workflows.filter((w) => [w.title, w.summary, w.category?.name].some((v) => v?.toLowerCase().includes(term)));
  }, [workflows, search]);

  const saveMutation = useMutation({
    // The public API is read-only; create/update/delete live under /admin/workflows.
    mutationFn: async (data: Record<string, unknown>) =>
      (editingId ? await apiClient.put(`/admin/workflows/${editingId}`, data) : await apiClient.post('/admin/workflows', data)).data,
    onSuccess: () => {
      addToast({ type: 'success', title: editingId ? 'Workflow updated' : 'Workflow created' });
      queryClient.invalidateQueries({ queryKey: ['test-workflows'] });
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
      queryClient.invalidateQueries({ queryKey: ['test-workflows'] });
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not delete workflow', description: apiErrorMessage(err) }),
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (workflow: Workflow) => {
    setFormData({
      workflow_category_id: workflow.workflow_category_id ? String(workflow.workflow_category_id) : '',
      title: workflow.title ?? '',
      summary: workflow.summary ?? '',
      description: workflow.description ?? '',
      tools: Array.isArray(workflow.tools) ? workflow.tools.join(', ') : '',
      benefits: Array.isArray(workflow.benefits) ? workflow.benefits.join(', ') : '',
      status: workflow.status || 'draft',
      is_featured: Boolean(workflow.is_featured),
      image_url: workflow.image_url ?? '',
    });
    setEditingId(workflow.id);
    setErrors({});
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
      workflow_category_id: parseInt(formData.workflow_category_id, 10),
    });
  };

  const handleDelete = async (workflow: Workflow) => {
    const ok = await confirm({ title: 'Delete workflow', message: `Delete "${workflow.title}"? This cannot be undone.`, confirmText: 'Delete', type: 'danger' });
    if (ok) deleteMutation.mutate(workflow.id);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Test Workflows"
        description="A lightweight editor for checking the workflow API. The list shows published workflows from the public API."
        actions={
          <button type="button" className={primaryBtn} onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add workflow
          </button>
        }
      />

      <AdminCard
        padded={false}
        title="Published workflows"
        description={isLoading || isError ? undefined : `${workflows.length} total`}
        actions={
          <div className="w-full sm:w-64">
            <SearchInput label="Search workflows" placeholder="Search workflows…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
      >
        {isLoading ? (
          <LoadingState label="Loading workflows…" />
        ) : isError ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : workflows.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No workflows yet"
            description="Create a workflow to test the API."
            action={
              <button type="button" className={primaryBtn} onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add workflow
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching workflows" description={`Nothing matches "${search}".`} />
        ) : (
          <TableShell caption="Workflows">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col" className="!text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((workflow) => (
                <tr key={workflow.id}>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-900">{workflow.title}</span>
                      {workflow.is_featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-label="Featured" />}
                    </div>
                    {workflow.summary && <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-slate-500">{workflow.summary}</p>}
                  </td>
                  <td className="whitespace-nowrap">{workflow.category?.name || <span className="text-slate-400">No category</span>}</td>
                  <td>
                    <Badge tone={workflow.status === 'published' ? 'success' : 'warning'}>{workflow.status === 'published' ? 'Published' : 'Draft'}</Badge>
                  </td>
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
        size="lg"
        title={editingId ? 'Edit workflow' : 'New workflow'}
        footer={
          <>
            <button type="button" className={secondaryBtn} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="test-workflow-form" className={primaryBtn} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save workflow'}
            </button>
          </>
        }
      >
        <form id="test-workflow-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" required error={errors.workflow_category_id}>
              {(props) => (
                <select {...props} className={inputClass} value={formData.workflow_category_id} onChange={(e) => update('workflow_category_id', e.target.value)}>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
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
          <Field label="Title" required error={errors.title}>
            {(props) => <input {...props} type="text" maxLength={255} className={inputClass} value={formData.title} onChange={(e) => update('title', e.target.value)} />}
          </Field>
          <Field label="Summary" error={errors.summary}>
            {(props) => <input {...props} type="text" className={inputClass} value={formData.summary} onChange={(e) => update('summary', e.target.value)} />}
          </Field>
          <Field label="Description" required error={errors.description}>
            {(props) => <textarea {...props} rows={5} className={inputClass} value={formData.description} onChange={(e) => update('description', e.target.value)} />}
          </Field>
          <ImageUpload onImageUploaded={(imageUrl) => update('image_url', imageUrl)} currentImage={formData.image_url} label="Workflow Image" maxSize={5} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tools used" hint="Separate with commas" error={errors.tools}>
              {(props) => <input {...props} type="text" className={inputClass} placeholder="n8n, Google Sheets, Slack" value={formData.tools} onChange={(e) => update('tools', e.target.value)} />}
            </Field>
            <Field label="Key benefits" hint="Separate with commas" error={errors.benefits}>
              {(props) => (
                <input {...props} type="text" className={inputClass} placeholder="Faster processing, Cost savings" value={formData.benefits} onChange={(e) => update('benefits', e.target.value)} />
              )}
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={formData.is_featured} onChange={(e) => update('is_featured', e.target.checked)} />
            Featured workflow
          </label>
        </form>
      </Modal>
    </div>
  );
}
