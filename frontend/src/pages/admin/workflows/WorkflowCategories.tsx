import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import apiClient from '../../../api/axios';
import { useSEO } from '../../../utils/seo';
import { useToast } from '../../../hooks/use-toast';
import { useConfirm } from '../../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, SearchInput, TableShell, inputClass } from '../../../components/admin/ui';
import { apiErrorMessage, asList } from '../../../components/admin/utils';

interface WorkflowCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  workflows_count?: number;
  created_at?: string;
}

type FormErrors = Partial<Record<'name' | 'description', string>>;

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60';

function serverErrors(error: unknown): FormErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors ?? {};
  return { name: errors.name?.[0], description: errors.description?.[0] };
}

export default function WorkflowCategories() {
  useSEO({ title: 'Workflow Categories | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkflowCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: categories = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-workflow-categories'],
    queryFn: async () => asList<WorkflowCategory>((await apiClient.get('/admin/workflow-categories')).data),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => [c.name, c.slug, c.description].some((v) => v?.toLowerCase().includes(term)));
  }, [categories, search]);

  const saveMutation = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      editing ? apiClient.put(`/admin/workflow-categories/${editing.id}`, payload) : apiClient.post('/admin/workflow-categories', payload),
    onSuccess: () => {
      addToast({ type: 'success', title: editing ? 'Category updated' : 'Category created' });
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['admin-workflow-categories'] });
    },
    onError: (err) => {
      setErrors(serverErrors(err));
      addToast({ type: 'error', title: 'Could not save category', description: apiErrorMessage(err) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/workflow-categories/${id}`),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Category deleted' });
      queryClient.invalidateQueries({ queryKey: ['admin-workflow-categories'] });
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not delete category', description: apiErrorMessage(err) }),
  });

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', description: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (category: WorkflowCategory) => {
    setEditing(category);
    setFormData({ name: category.name ?? '', description: category.description ?? '' });
    setErrors({});
    setModalOpen(true);
  };

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setErrors({});
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      setErrors({ name: 'Name is required.' });
      return;
    }
    setErrors({});
    saveMutation.mutate({ name, description: formData.description });
  };

  const handleDelete = async (category: WorkflowCategory) => {
    const ok = await confirm({
      title: 'Delete category',
      message: `Delete "${category.name}"? Categories that still contain workflows cannot be deleted.`,
      confirmText: 'Delete',
      type: 'danger',
    });
    if (ok) deleteMutation.mutate(category.id);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Workflow Categories"
        description="Group automation workflows so visitors can browse them by topic."
        actions={
          <button type="button" className={primaryBtn} onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add category
          </button>
        }
      />

      <AdminCard
        padded={false}
        title="All categories"
        description={isLoading ? undefined : `${categories.length} total`}
        actions={
          <div className="w-full sm:w-64">
            <SearchInput label="Search categories" placeholder="Search categories…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
      >
        {isLoading ? (
          <LoadingState label="Loading categories…" />
        ) : isError ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            description="Create your first category to start organising workflows."
            action={
              <button type="button" className={primaryBtn} onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add category
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching categories" description={`Nothing matches "${search}".`} />
        ) : (
          <TableShell caption="Workflow categories">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Slug</th>
                <th scope="col">Workflows</th>
                <th scope="col" className="!text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((category) => (
                <tr key={category.id}>
                  <td>
                    <p className="font-medium text-slate-900">{category.name}</p>
                    {category.description && <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-slate-500">{category.description}</p>}
                  </td>
                  <td className="whitespace-nowrap font-mono text-xs text-slate-500">{category.slug}</td>
                  <td>
                    <Badge tone={category.workflows_count ? 'info' : 'neutral'}>{category.workflows_count ?? 0}</Badge>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton label={`Edit ${category.name}`} icon={Pencil} onClick={() => openEdit(category)} />
                      <IconButton
                        label={`Delete ${category.name}`}
                        icon={Trash2}
                        tone="danger"
                        disabled={deleteMutation.isPending && deleteMutation.variables === category.id}
                        onClick={() => handleDelete(category)}
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
        title={editing ? 'Edit workflow category' : 'New workflow category'}
        description="The slug is generated from the name."
        footer={
          <>
            <button type="button" className={secondaryBtn} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="workflow-category-form" className={primaryBtn} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
            </button>
          </>
        }
      >
        <form id="workflow-category-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Name" required error={errors.name}>
            {(props) => (
              <input
                {...props}
                type="text"
                className={inputClass}
                value={formData.name}
                maxLength={255}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Description" error={errors.description}>
            {(props) => (
              <textarea
                {...props}
                rows={3}
                className={inputClass}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            )}
          </Field>
        </form>
      </Modal>
    </div>
  );
}
