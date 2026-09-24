import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, FileText, ImageOff, Pencil, Plus, SlidersHorizontal, Trash2, X } from 'lucide-react';
import apiClient from '../../api/axios';
import Pagination from '../../components/Pagination';
import EnhancedImageUpload from '../../components/EnhancedImageUpload';
import RichTextEditor from '../../components/RichTextEditor';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { AdminCard, AdminPageHeader, Badge, EmptyState, ErrorState, Field, IconButton, LoadingState, Modal, SearchInput, TableShell, inputClass } from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'draft';

interface Tag {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
}

interface Category {
  id: number;
  name: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  content?: string | null;
  excerpt?: string | null;
  featured_image?: string | null;
  is_published: boolean;
  category_id: number | null;
  category?: Category | null;
  tags?: Tag[] | null;
  created_at?: string;
  updated_at?: string;
  approval_status?: ApprovalStatus | null;
  rejection_reason?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
}

interface PostsPage {
  posts: Post[];
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
}

const PER_PAGE = 10;
const MAX_CONTENT_LENGTH = 1000000;

const emptyForm = {
  title: '',
  content: '',
  excerpt: '',
  featured_image: '',
  category_id: '',
  is_published: false,
  meta_description: '',
  meta_keywords: '',
  tags: [] as number[],
};

const emptyFilters = { search: '', category: '', status: '', approval_status: '', tags: [] as string[], dateFrom: '', dateTo: '' };

type FormState = typeof emptyForm;
type FormErrors = Partial<Record<keyof FormState, string>>;

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60';
const dangerBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const approvalTone: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { approved: 'success', pending: 'warning', rejected: 'danger', draft: 'neutral' };

/** Converts editor line breaks to HTML (the public blog renders post content as HTML). */
function processContent(input: string) {
  if (!input) return '';
  let content = input;
  if (content.length > MAX_CONTENT_LENGTH) {
    content = `${content.substring(0, MAX_CONTENT_LENGTH)}... [Content truncated due to size]`;
  }
  let processed = content.replace(/\n/g, '<br>');
  if (!processed.includes('<p>') && !processed.includes('<div>')) processed = `<p>${processed}</p>`;
  return processed;
}

function serverErrors(error: unknown): FormErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors ?? {};
  const result: FormErrors = {};
  for (const [key, messages] of Object.entries(errors)) {
    const field = key.split('.')[0] as keyof FormState;
    if (!result[field]) result[field] = messages?.[0];
  }
  return result;
}

function saveErrorMessage(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 413 || status === 414) return 'The post is too large. Please reduce the content size and try again.';
  return apiErrorMessage(error, 'An error occurred while saving the post. Please try again.');
}

async function fetchPosts(page: number): Promise<PostsPage> {
  const { data } = await apiClient.get(`/admin/posts?page=${page}&per_page=${PER_PAGE}`);
  const meta = (data?.meta ?? data ?? {}) as { current_page?: number; last_page?: number; total?: number; per_page?: number };
  const posts = asList<Post>(data);
  return {
    posts,
    currentPage: Number(meta.current_page) || page,
    lastPage: Number(meta.last_page) || 1,
    total: Number(meta.total) || posts.length,
    perPage: Number(meta.per_page) || PER_PAGE,
  };
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

export default function Posts() {
  useSEO({ title: 'Manage Posts | Admin', robots: 'noindex, nofollow' });
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(emptyFilters);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [rejecting, setRejecting] = useState<Post | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setFormData((prev) => ({ ...prev, [key]: value }));

  const postsQuery = useQuery({ queryKey: ['admin-posts', page], queryFn: () => fetchPosts(page), placeholderData: (prev) => prev });
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => asList<Category>((await apiClient.get('/categories')).data),
  });
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => asList<Tag>((await apiClient.get('/tags')).data),
  });

  const posts = useMemo(() => postsQuery.data?.posts ?? [], [postsQuery.data]);
  const categoryName = (post: Post) => post.category?.name ?? categories.find((c) => c.id === post.category_id)?.name;

  const filtersActive = Boolean(filters.search || filters.category || filters.status || filters.approval_status || filters.tags.length || filters.dateFrom || filters.dateTo);

  const filteredPosts = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return posts.filter((post) => {
      if (term && ![post.title, post.content, post.excerpt].some((v) => typeof v === 'string' && v.toLowerCase().includes(term))) return false;
      if (filters.category && String(post.category_id ?? '') !== filters.category) return false;
      if (filters.status && (filters.status === 'published') !== Boolean(post.is_published)) return false;
      if (filters.approval_status && post.approval_status !== filters.approval_status) return false;
      if (filters.tags.length && !asList<Tag>(post.tags).some((tag) => filters.tags.includes(String(tag.id)))) return false;
      const date = new Date(post.created_at || post.updated_at || '');
      if (filters.dateFrom && !(date >= new Date(filters.dateFrom))) return false;
      if (filters.dateTo && !(date <= new Date(`${filters.dateTo}T23:59:59`))) return false;
      return true;
    });
  }, [posts, filters]);

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      (editingId ? await apiClient.put(`/admin/posts/${editingId}`, data) : await apiClient.post('/admin/posts', data)).data,
    onSuccess: () => {
      addToast({ type: 'success', title: editingId ? 'Post updated' : 'Post created' });
      invalidatePosts();
      closeModal();
    },
    onError: (err) => {
      setErrors(serverErrors(err));
      addToast({ type: 'error', title: 'Could not save post', description: saveErrorMessage(err) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/posts/${id}`),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Post deleted' });
      invalidatePosts();
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not delete post', description: apiErrorMessage(err) }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ post, approve, reason }: { post: Post; approve: boolean; reason?: string }) =>
      apiClient.put(`/posts/${post.id}`, {
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        featured_image: post.featured_image,
        category_id: post.category_id,
        is_published: post.is_published,
        ...(approve
          ? { approval_status: 'approved', approved_by: user?.id || 1, approved_at: new Date().toISOString() }
          : { approval_status: 'rejected', rejection_reason: reason ?? '' }),
        meta_description: post.meta_description || '',
        meta_keywords: post.meta_keywords || '',
      }),
    onSuccess: (_data, { approve }) => {
      addToast({ type: 'success', title: approve ? 'Post approved' : 'Post rejected' });
      setRejecting(null);
      setRejectReason('');
      invalidatePosts();
    },
    onError: (err) => addToast({ type: 'error', title: 'Could not update approval', description: apiErrorMessage(err) }),
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (post: Post) => {
    setFormData({
      title: post.title ?? '',
      content: post.content ?? '',
      excerpt: post.excerpt ?? '',
      featured_image: post.featured_image ?? '',
      category_id: post.category_id ? String(post.category_id) : '',
      is_published: Boolean(post.is_published),
      meta_description: post.meta_description ?? '',
      meta_keywords: post.meta_keywords ?? '',
      tags: asList<Tag>(post.tags).map((tag) => tag.id),
    });
    setEditingId(post.id);
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
    if (!formData.title.trim()) next.title = 'Title is required.';
    if (!formData.category_id) next.category_id = 'Select a category.';
    if (!formData.content.trim()) next.content = 'Content is required.';
    if (formData.meta_keywords.length > 255) next.meta_keywords = 'Meta keywords must be 255 characters or fewer.';
    setErrors(next);
    if (Object.keys(next).length) return;
    saveMutation.mutate({
      ...formData,
      title: formData.title.trim(),
      category_id: Number(formData.category_id),
      content: processContent(formData.content),
    });
  };

  const handleDelete = async (post: Post) => {
    const ok = await confirm({ title: 'Delete post', message: `Delete "${post.title}"? This cannot be undone.`, confirmText: 'Delete', type: 'danger' });
    if (ok) deleteMutation.mutate(post.id);
  };

  const handleApprove = async (post: Post) => {
    const ok = await confirm({ title: 'Approve post', message: `Approve "${post.title}"?`, confirmText: 'Approve', type: 'info' });
    if (ok) reviewMutation.mutate({ post, approve: true });
  };

  const toggleTag = (id: number, checked: boolean) =>
    setFormData((prev) => ({ ...prev, tags: checked ? [...prev.tags, id] : prev.tags.filter((t) => t !== id) }));

  const toggleTagFilter = (id: string, checked: boolean) =>
    setFilters((prev) => ({ ...prev, tags: checked ? [...prev.tags, id] : prev.tags.filter((t) => t !== id) }));

  const pageInfo = postsQuery.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Posts"
        description="Write, edit, publish and review blog articles."
        actions={
          <button type="button" className={primaryBtn} onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" /> New post
          </button>
        }
      />

      <AdminCard padded={false}>
        <div className="space-y-3 border-b border-slate-200 p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="lg:w-72">
              <SearchInput label="Search posts" placeholder="Search posts…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex">
              <select aria-label="Filter by category" className={`${inputClass} lg:w-44`} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select aria-label="Filter by status" className={`${inputClass} lg:w-36`} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <select
                aria-label="Filter by approval"
                className={`${inputClass} lg:w-40`}
                value={filters.approval_status}
                onChange={(e) => setFilters({ ...filters, approval_status: e.target.value })}
              >
                <option value="">All approvals</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="flex gap-2 lg:ml-auto">
              <button type="button" className={secondaryBtn} aria-expanded={showMoreFilters} onClick={() => setShowMoreFilters((v) => !v)}>
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> More filters
              </button>
              {filtersActive && (
                <button type="button" className={secondaryBtn} onClick={() => setFilters(emptyFilters)}>
                  Clear
                </button>
              )}
            </div>
          </div>
          {showMoreFilters && (
            <div className="grid gap-4 rounded-lg bg-slate-50 p-3 md:grid-cols-[2fr_1fr_1fr]">
              <fieldset>
                <legend className="mb-1 text-sm font-medium text-slate-700">Tags</legend>
                {tags.length ? (
                  <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
                        <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" checked={filters.tags.includes(String(tag.id))} onChange={(e) => toggleTagFilter(String(tag.id), e.target.checked)} />
                        {tag.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No tags available.</p>
                )}
              </fieldset>
              <Field label="From date">
                {(props) => <input {...props} type="date" className={inputClass} value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />}
              </Field>
              <Field label="To date">
                {(props) => <input {...props} type="date" className={inputClass} value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />}
              </Field>
            </div>
          )}
          {filtersActive && !postsQuery.isLoading && (
            <p className="text-xs text-slate-500" role="status">
              {filteredPosts.length} of {posts.length} posts on this page match the filters.
            </p>
          )}
        </div>

        {postsQuery.isLoading ? (
          <LoadingState label="Loading posts…" />
        ) : postsQuery.isError ? (
          <ErrorState message={apiErrorMessage(postsQuery.error)} onRetry={() => postsQuery.refetch()} />
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={filtersActive ? 'No posts match your filters' : 'No posts yet'}
            description={filtersActive ? 'Try adjusting your filters to see more posts.' : 'Get started by creating your first blog post.'}
            action={
              filtersActive ? (
                <button type="button" className={secondaryBtn} onClick={() => setFilters(emptyFilters)}>
                  Clear filters
                </button>
              ) : (
                <button type="button" className={primaryBtn} onClick={openCreate}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Create first post
                </button>
              )
            }
          />
        ) : (
          <TableShell caption="Blog posts">
            <thead>
              <tr>
                <th scope="col">Post</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Approval</th>
                <th scope="col">Created</th>
                <th scope="col" className="!text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPosts.map((post) => {
                const approval = post.approval_status || 'draft';
                return (
                  <tr key={post.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {post.featured_image ? (
                          <img src={post.featured_image} alt="" loading="lazy" className="h-10 w-14 flex-none rounded-md border border-slate-200 object-cover" />
                        ) : (
                          <span className="flex h-10 w-14 flex-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
                            <ImageOff className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="max-w-xs truncate font-medium text-slate-900" title={post.title}>
                            {post.title}
                          </p>
                          <p className="font-mono text-xs text-slate-400">#{post.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{categoryName(post) ?? <span className="text-slate-400">—</span>}</td>
                    <td>
                      <Badge tone={post.is_published ? 'success' : 'neutral'}>{post.is_published ? 'Published' : 'Draft'}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Badge tone={approvalTone[approval] ?? 'neutral'}>{approval.charAt(0).toUpperCase() + approval.slice(1)}</Badge>
                        {approval === 'pending' && (
                          <>
                            <IconButton label={`Approve ${post.title}`} icon={Check} disabled={reviewMutation.isPending} onClick={() => handleApprove(post)} />
                            <IconButton
                              label={`Reject ${post.title}`}
                              icon={X}
                              tone="danger"
                              disabled={reviewMutation.isPending}
                              onClick={() => {
                                setRejecting(post);
                                setRejectReason('');
                              }}
                            />
                          </>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{formatDate(post.created_at)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <IconButton label={`Edit ${post.title}`} icon={Pencil} onClick={() => openEdit(post)} />
                        <IconButton
                          label={`Delete ${post.title}`}
                          icon={Trash2}
                          tone="danger"
                          disabled={deleteMutation.isPending && deleteMutation.variables === post.id}
                          onClick={() => handleDelete(post)}
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

      {pageInfo && pageInfo.lastPage > 1 && (
        <Pagination
          currentPage={pageInfo.currentPage}
          lastPage={pageInfo.lastPage}
          total={pageInfo.total}
          perPage={pageInfo.perPage}
          onPageChange={setPage}
          loading={postsQuery.isFetching}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="xl"
        title={editingId ? 'Edit post' : 'New post'}
        description="Fields marked * are required."
        footer={
          <>
            <button type="button" className={secondaryBtn} onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" form="post-form" className={primaryBtn} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editingId ? 'Update post' : 'Create post'}
            </button>
          </>
        }
      >
        <form id="post-form" onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <Field label="Title" required error={errors.title}>
              {(props) => <input {...props} type="text" maxLength={255} className={inputClass} value={formData.title} onChange={(e) => update('title', e.target.value)} />}
            </Field>
            <Field label="Category" required error={errors.category_id}>
              {(props) => (
                <select {...props} className={inputClass} value={formData.category_id} onChange={(e) => update('category_id', e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">Tags</legend>
            {tags.length ? (
              <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex cursor-pointer items-center gap-1.5 rounded-full py-0.5 pl-1 pr-2 text-xs ring-1 ring-slate-200 hover:bg-slate-50">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" checked={formData.tags.includes(tag.id)} onChange={(e) => toggleTag(tag.id, e.target.checked)} />
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || '#64748b' }} aria-hidden="true" />
                    {tag.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No tags yet. Create tags on the Tags page.</p>
            )}
            {errors.tags && <p className="mt-1 text-xs text-red-600">{errors.tags}</p>}
          </fieldset>

          <Field label="Excerpt" error={errors.excerpt}>
            {(props) => <textarea {...props} rows={3} className={inputClass} value={formData.excerpt} onChange={(e) => update('excerpt', e.target.value)} />}
          </Field>

          <div>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">
                Content <span className="text-red-600" aria-hidden="true">*</span>
              </p>
              <p className={`text-xs ${formData.content.length > 500000 ? 'text-amber-700' : 'text-slate-500'}`}>
                {formData.content.length.toLocaleString()} characters
                {formData.content.length > 500000 && ' · large post, consider splitting it'}
              </p>
            </div>
            <p className="mb-2 hidden text-xs text-slate-500 sm:block">
              Supports Markdown and HTML, e.g. <code className="rounded bg-slate-100 px-1">&lt;img src="URL" alt="description" /&gt;</code>. Line breaks are saved as HTML.
            </p>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => update('content', value)}
              placeholder="Write your content here... You can use Markdown or HTML"
              height={typeof window !== 'undefined' && window.innerWidth < 640 ? 300 : 400}
            />
            {errors.content && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.content}
              </p>
            )}
          </div>

          <EnhancedImageUpload onImageUploaded={(imageUrl) => update('featured_image', imageUrl)} currentImage={formData.featured_image} label="Featured Image" maxSize={5} />

          <section className="space-y-4 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">SEO settings</h3>
            <Field label="Meta description" hint={`${formData.meta_description.length} characters · aim for 150–160`} error={errors.meta_description}>
              {(props) => (
                <textarea
                  {...props}
                  rows={2}
                  className={inputClass}
                  placeholder="Brief description for search engines"
                  value={formData.meta_description}
                  onChange={(e) => update('meta_description', e.target.value)}
                />
              )}
            </Field>
            <Field label="Meta keywords" hint="Comma-separated, max 255 characters" error={errors.meta_keywords}>
              {(props) => (
                <input {...props} type="text" className={inputClass} placeholder="keyword1, keyword2, keyword3" value={formData.meta_keywords} onChange={(e) => update('meta_keywords', e.target.value)} />
              )}
            </Field>
          </section>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600" checked={formData.is_published} onChange={(e) => update('is_published', e.target.checked)} />
            Published
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        size="sm"
        title="Reject post"
        description={rejecting ? `"${rejecting.title}" will be marked as rejected.` : undefined}
        footer={
          <>
            <button type="button" className={secondaryBtn} onClick={() => setRejecting(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={dangerBtn}
              disabled={reviewMutation.isPending}
              onClick={() => rejecting && reviewMutation.mutate({ post: rejecting, approve: false, reason: rejectReason })}
            >
              {reviewMutation.isPending ? 'Rejecting…' : 'Reject post'}
            </button>
          </>
        }
      >
        <Field label="Reason for rejection" hint="Shared with the author.">
          {(props) => <textarea {...props} rows={3} className={inputClass} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />}
        </Field>
      </Modal>
    </div>
  );
}
