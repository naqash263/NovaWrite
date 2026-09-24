import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Tags as TagsIcon, Trash2 } from 'lucide-react';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, SearchInput, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  posts_count?: number;
  created_at?: string;
  updated_at?: string;
}

type FormErrors = Partial<Record<'name' | 'description' | 'color', string>>;

const DEFAULT_COLOR = '#3B82F6';
const HEX = /^#[0-9A-Fa-f]{6}$/;

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60';

function serverErrors(error: unknown): FormErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors ?? {};
  return { name: errors.name?.[0], description: errors.description?.[0], color: errors.color?.[0] };
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

export default function Tags() {
  useSEO({ title: 'Tags Management | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: DEFAULT_COLOR });
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: tags = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => asList<Tag>((await apiClient.get('/tags')).data),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tags;
    return tags.filter((t) => [t.name, t.slug, t.description].some((v) => v?.toLowerCase().includes(term)));
  }, [tags, search]);

  const saveMutation = useMutation({
    mutationFn: (payload: typeof formData) => (editingTag ? apiClient.put(`/tags/${editingTag.id}`, payload) : apiClient.post('/tags', payload)),
    onSuccess: () => {
      addToast({ type: 'success', title: editingTag ? 'Tag updated' : 'Tag created' });
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err) => {
      setErrors(serverErrors(err));
      addToast({ type: 'error', title: 'Could not save tag', description: apiErrorMessage(err) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/tags/${id}`),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Tag deleted' });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not delete tag', description: apiErrorMessage(err) }),
  });

  const openCreate = () => {
    setEditingTag(null);
    setFormData({ name: '', description: '', color: DEFAULT_COLOR });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name ?? '', description: tag.description ?? '', color: tag.color || DEFAULT_COLOR });
    setErrors({});
    setModalOpen(true);
  };

  function closeModal() {
    setModalOpen(false);
    setEditingTag(null);
    setErrors({});
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!formData.name.trim()) next.name = 'Tag name is required.';
    if (formData.color && !HEX.test(formData.color)) next.color = 'Use a hex colour such as #3B82F6.';
    setErrors(next);
    if (Object.keys(next).length) return;
    saveMutation.mutate({ ...formData, name: formData.name.trim() });
  };

  const handleDelete = async (tag: Tag) => {
    const ok = await confirm({ title: 'Delete tag', message: `Delete the tag "${tag.name}"? It will be removed from all posts.`, confirmText: 'Delete', type: 'danger' });
    if (ok) deleteMutation.mutate(tag.id);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tags"
        description="Label posts with tags so readers can find related content."
        actions={
          <button type="button" className={primaryBtn} onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add tag
          </button>
        }
      />

      <AdminCard
        padded={false}
        title="All tags"
        description={isLoading ? undefined : `${tags.length} total`}
        actions={
          <div className="w-full sm:w-64">
            <SearchInput label="Search tags" placeholder="Search tags…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
      >
        {isLoading ? (
          <LoadingState label="Loading tags…" />
        ) : isError ? (
          <ErrorState message={apiErrorMessage(error)} onRetry={() => refetch()} />
        ) : tags.length === 0 ? (
          <EmptyState
            icon={TagsIcon}
            title="No tags yet"
            description="Create your first tag to get started."
            action={
              <button type="button" className={primaryBtn} onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add tag
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching tags" description={`Nothing matches "${search}".`} />
        ) : (
          <TableShell caption="Tags">
            <thead>
              <tr>
                <th scope="col">Tag</th>
                <th scope="col">Slug</th>
                <th scope="col">Posts</th>
                <th scope="col">Created</th>
                <th scope="col" className="!text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tag) => (
                <tr key={tag.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 flex-none rounded-full ring-1 ring-black/10" style={{ backgroundColor: tag.color || DEFAULT_COLOR }} aria-hidden="true" />
                      <span className="font-medium text-slate-900">{tag.name}</span>
                    </div>
                    {tag.description && <p className="mt-0.5 line-clamp-1 max-w-md pl-5 text-xs text-slate-500">{tag.description}</p>}
                  </td>
                  <td className="whitespace-nowrap font-mono text-xs text-slate-500">{tag.slug}</td>
                  <td>
                    <Badge tone={tag.posts_count ? 'info' : 'neutral'}>{tag.posts_count ?? 0}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-slate-500">{formatDate(tag.created_at)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <IconButton label={`Edit ${tag.name}`} icon={Pencil} onClick={() => openEdit(tag)} />
                      <IconButton
                        label={`Delete ${tag.name}`}
                        icon={Trash2}
                        tone="danger"
                        disabled={deleteMutation.isPending && deleteMutation.variables === tag.id}
                        onClick={() => handleDelete(tag)}
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
        title={editingTag ? 'Edit tag' : 'New tag'}
        footer={
          <>
            <button type="button" className={secondaryBtn} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="tag-form" className={primaryBtn} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editingTag ? 'Save changes' : 'Create tag'}
            </button>
          </>
        }
      >
        <form id="tag-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Tag name" required error={errors.name}>
            {(props) => (
              <input {...props} type="text" maxLength={255} className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            )}
          </Field>
          <Field label="Description" error={errors.description}>
            {(props) => (
              <textarea {...props} rows={3} className={inputClass} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            )}
          </Field>
          <Field label="Colour" hint="Hex value, e.g. #3B82F6" error={errors.color}>
            {(props) => (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Pick colour"
                  value={HEX.test(formData.color) ? formData.color : DEFAULT_COLOR}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-12 flex-none cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                />
                <input {...props} type="text" className={inputClass} value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
            )}
          </Field>
        </form>
      </Modal>
    </div>
  );
}
