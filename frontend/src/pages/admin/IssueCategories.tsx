import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Hash, Pencil, Plus, Trash2 } from 'lucide-react';
import apiClient from '../../api/axios';
import Button from '../../components/ui/Button';
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
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { useSEO } from '../../utils/seo';

interface IssueCategory {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  is_active: boolean;
  sort_order?: number;
  issues_count?: number;
}

interface CategoryForm {
  name: string;
  description: string;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

type FormErrors = Partial<Record<keyof CategoryForm, string>>;

const HEX = /^#[0-9A-Fa-f]{6}$/;
const emptyForm: CategoryForm = { name: '', description: '', color: '#64748B', icon: 'tag', is_active: true, sort_order: 99 };

function serverErrors(error: unknown): FormErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[] | string> } } })?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return {};
  const out: FormErrors = {};
  for (const key of Object.keys(emptyForm) as (keyof CategoryForm)[]) {
    const v = errors[key];
    if (v) out[key] = Array.isArray(v) ? v[0] : String(v);
  }
  return out;
}

export default function IssueCategories() {
  useSEO({ title: 'Issue Categories | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const categoriesQuery = useQuery({
    queryKey: ['admin-issue-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/issue-categories');
      return asList<IssueCategory>(response.data).filter((c) => c && typeof c === 'object' && 'id' in c);
    },
  });
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => `${c.name} ${c.description ?? ''} ${c.slug ?? ''}`.toLowerCase().includes(q));
  }, [categories, search]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-issue-categories'] });
    queryClient.invalidateQueries({ queryKey: ['issue-categories'] }); // public list used by the Issues pages
  };

  const categoryMutation = useMutation({
    mutationFn: async ({ id, ...data }: CategoryForm & { id?: number }) => {
      const response = id ? await apiClient.put(`/admin/issue-categories/${id}`, data) : await apiClient.post('/admin/issue-categories', data);
      return response.data;
    },
    onSuccess: (_d, vars) => {
      invalidate();
      addToast({ type: 'success', title: vars.id ? 'Category updated' : 'Category created', description: `“${vars.name}” was saved.` });
      closeModal();
    },
    onError: (error) => {
      setErrors(serverErrors(error));
      addToast({ type: 'error', title: 'Could not save category', description: apiErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (category: IssueCategory) => {
      await apiClient.delete(`/admin/issue-categories/${category.id}`);
    },
    onSuccess: (_d, category) => {
      invalidate();
      addToast({ type: 'success', title: 'Category deleted', description: `“${category.name}” was removed.` });
    },
    onError: (error) => addToast({ type: 'error', title: 'Delete failed', description: apiErrorMessage(error) }),
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (category: IssueCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name ?? '',
      description: category.description || '',
      color: category.color || '#64748B',
      icon: category.icon || 'tag',
      is_active: category.is_active !== false,
      sort_order: typeof category.sort_order === 'number' ? category.sort_order : 99,
    });
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
    if (!formData.name.trim()) next.name = 'Name is required.';
    if (formData.color && !HEX.test(formData.color)) next.color = 'Use a 6-digit hex colour such as #64748B.';
    if (!Number.isInteger(formData.sort_order) || formData.sort_order < 0) next.sort_order = 'Sort order must be 0 or higher.';
    setErrors(next);
    if (Object.keys(next).length) return;
    categoryMutation.mutate({ ...formData, name: formData.name.trim(), ...(editingId ? { id: editingId } : {}) });
  };

  const handleDelete = async (category: IssueCategory) => {
    if ((category.issues_count ?? 0) > 0) {
      addToast({ type: 'warning', title: 'Category in use', description: `Reassign or delete the ${category.issues_count} issue(s) in “${category.name}” first.` });
      return;
    }
    const ok = await confirm({
      title: 'Delete category',
      message: `Delete the category “${category.name}”? This cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete category',
    });
    if (ok) deleteMutation.mutate(category);
  };

  let content;
  if (categoriesQuery.isLoading) content = <LoadingState label="Loading categories…" />;
  else if (categoriesQuery.isError)
    content = <ErrorState title="Could not load categories" message={apiErrorMessage(categoriesQuery.error)} onRetry={() => categoriesQuery.refetch()} />;
  else if (categories.length === 0)
    content = (
      <EmptyState
        icon={Hash}
        title="No issue categories yet"
        description="Categories help the community file issues in the right place."
        action={
          <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Add category
          </Button>
        }
      />
    );
  else if (filtered.length === 0)
    content = (
      <EmptyState
        icon={Hash}
        title="No categories match your search"
        action={
          <Button variant="outline" size="sm" onClick={() => setSearch('')}>
            Clear search
          </Button>
        }
      />
    );
  else
    content = (
      <TableShell caption="Issue categories">
        <thead>
          <tr>
            <th>Category</th>
            <th>Colour</th>
            <th>Issues</th>
            <th>Status</th>
            <th>Sort order</th>
            <th className="text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.map((category) => (
            <tr key={category.id}>
              <td className="min-w-[14rem]">
                <p className="font-medium text-slate-900">{category.name}</p>
                {category.description && <p className="mt-0.5 text-slate-500">{category.description}</p>}
                {category.slug && <p className="mt-0.5 font-mono text-xs text-slate-400">/{category.slug}</p>}
              </td>
              <td>
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: category.color || '#64748B' }} aria-hidden="true" />
                  <span className="font-mono text-xs text-slate-500">{category.color || '#64748B'}</span>
                </span>
              </td>
              <td className="tabular-nums">{category.issues_count ?? 0}</td>
              <td>
                <Badge tone={category.is_active ? 'success' : 'neutral'}>{category.is_active ? 'Active' : 'Inactive'}</Badge>
              </td>
              <td className="tabular-nums text-slate-500">{category.sort_order ?? '—'}</td>
              <td>
                <div className="flex justify-end gap-1">
                  <IconButton label={`Edit ${category.name}`} icon={Pencil} onClick={() => openEdit(category)} />
                  <IconButton label={`Delete ${category.name}`} icon={Trash2} tone="danger" disabled={deleteMutation.isPending} onClick={() => handleDelete(category)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Issue Categories"
        description="Manage the categories people choose from when they report a community issue."
        actions={
          <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Add category
          </Button>
        }
      />

      <AdminCard padded={false}>
        {categories.length > 0 && (
          <div className="border-b border-slate-200 p-4">
            <div className="max-w-md">
              <SearchInput label="Search categories" placeholder="Search categories…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        )}
        {content}
      </AdminCard>

      <Modal
        open={modalOpen}
        title={editingId ? 'Edit category' : 'Create category'}
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" form="issue-category-form" size="sm" loading={categoryMutation.isPending}>
              {editingId ? 'Save changes' : 'Create category'}
            </Button>
          </>
        }
      >
        <form id="issue-category-form" noValidate onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Name" required error={errors.name}>
              {(p) => <input {...p} className={inputClass} placeholder="Category name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />}
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" error={errors.description}>
              {(p) => <textarea {...p} rows={3} className={inputClass} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />}
            </Field>
          </div>
          <Field label="Colour" error={errors.color}>
            {(p) => (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Pick colour"
                  value={HEX.test(formData.color) ? formData.color : '#64748B'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-12 flex-none cursor-pointer rounded-lg border border-slate-300"
                />
                <input {...p} className={inputClass} placeholder="#64748B" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
            )}
          </Field>
          <Field label="Icon" error={errors.icon} hint="e.g. tag, code, server">
            {(p) => <input {...p} className={inputClass} value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} />}
          </Field>
          <Field label="Sort order" error={errors.sort_order}>
            {(p) => (
              <input
                {...p}
                type="number"
                min={0}
                className={inputClass}
                value={Number.isNaN(formData.sort_order) ? '' : formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value === '' ? 99 : parseInt(e.target.value, 10) })}
              />
            )}
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Active
          </label>
        </form>
      </Modal>
    </div>
  );
}
