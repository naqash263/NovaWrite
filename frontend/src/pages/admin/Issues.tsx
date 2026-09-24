import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bug, CircleDot, Eye, GitMerge, Link2, MessageSquare, Pencil, Pin, ScanSearch, ThumbsUp, Trash2, UserPlus, X } from 'lucide-react';
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

type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

interface IssueSummary {
  id: number;
  title: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  category?: { id: number; name: string; color?: string } | null;
  comments_count?: number;
  upvotes_count?: number;
}

interface Issue extends IssueSummary {
  slug?: string;
  description?: string;
  user_id?: number | null;
  user?: { id: number; name: string } | null;
  guest_name?: string | null;
  category_id?: number | null;
  assigned_to?: number | null;
  assignee?: { id: number; name: string; email?: string } | null;
  labels?: string[] | null;
  views_count?: number;
  is_pinned?: boolean;
  resolution_notes?: string | null;
  merged_into?: number | null;
  merged_issues?: IssueSummary[] | null;
  created_at?: string;
}

interface DuplicateGroup {
  main_issue: IssueSummary;
  duplicates: Array<IssueSummary & { similarity?: number }>;
  total_count?: number;
}

interface IssueCategory {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

type EditErrors = Partial<Record<'title' | 'description' | 'category_id' | 'priority' | 'labels', string>>;

const STATUSES: { value: IssueStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'duplicate', label: 'Duplicate' },
];
const PRIORITIES: { value: IssuePriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];
const emptyFilters = { search: '', status: '', priority: '', category_id: '', assigned_to: '' };

const statusTone = (s?: string) => (s === 'open' ? 'info' : s === 'in_progress' ? 'warning' : s === 'resolved' ? 'success' : 'neutral');
const priorityTone = (p?: string) => (p === 'critical' ? 'danger' : p === 'high' ? 'warning' : p === 'medium' ? 'info' : 'neutral');
const statusLabel = (s?: string) => STATUSES.find((x) => x.value === s)?.label ?? (s ? s.replace(/_/g, ' ') : 'unknown');
const formatDate = (v?: string) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

function serverErrors(error: unknown): EditErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[] | string> } } })?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return {};
  const out: EditErrors = {};
  for (const key of ['title', 'description', 'category_id', 'priority', 'labels'] as const) {
    const v = errors[key];
    if (v) out[key] = Array.isArray(v) ? v[0] : String(v);
  }
  return out;
}

export default function Issues() {
  useSEO({ title: 'Issues | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [filters, setFilters] = useState(emptyFilters);
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [statusIssue, setStatusIssue] = useState<Issue | null>(null);
  const [statusForm, setStatusForm] = useState({ status: 'open' as IssueStatus, resolution_notes: '' });
  const [assignIssue, setAssignIssue] = useState<Issue | null>(null);
  const [assignForm, setAssignForm] = useState({ user_id: '', notes: '' });
  const [assignError, setAssignError] = useState<string | undefined>();
  const [editIssue, setEditIssue] = useState<Issue | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category_id: '', priority: 'medium' as IssuePriority, labels: [] as string[] });
  const [editErrors, setEditErrors] = useState<EditErrors>({});
  const [labelInput, setLabelInput] = useState('');
  const [mergeTarget, setMergeTarget] = useState<IssueSummary | null>(null);
  const [selectedDuplicates, setSelectedDuplicates] = useState<number[]>([]);
  const [confirmMerge, setConfirmMerge] = useState(false);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [similarityThreshold, setSimilarityThreshold] = useState(70);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput.trim() ? prev : { ...prev, search: searchInput.trim() }));
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const issuesQuery = useQuery({
    queryKey: ['admin-issues', currentPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ page: currentPage.toString(), per_page: '20' });
      (Object.keys(filters) as (keyof typeof filters)[]).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await apiClient.get(`/issues?${params.toString()}`);
      const pagination = (response.data?.pagination ?? {}) as { current_page?: number; last_page?: number; per_page?: number; total?: number };
      return {
        issues: asList<Issue>(response.data).filter((i) => i && typeof i === 'object' && 'id' in i),
        pagination: {
          current_page: pagination.current_page ?? currentPage,
          last_page: pagination.last_page && pagination.last_page > 0 ? pagination.last_page : 1,
          per_page: pagination.per_page ?? 20,
          total: pagination.total ?? 0,
        },
      };
    },
    placeholderData: (prev) => prev,
  });
  const issues = issuesQuery.data?.issues ?? [];
  const pagination = issuesQuery.data?.pagination ?? { current_page: 1, last_page: 1, per_page: 20, total: 0 };

  const categoriesQuery = useQuery({
    queryKey: ['issue-categories'],
    queryFn: async () => asList<IssueCategory>((await apiClient.get('/issue-categories')).data),
  });
  const categories = categoriesQuery.data ?? [];

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => asList<User>((await apiClient.get('/admin/users')).data),
    enabled: !!assignIssue,
  });
  const users = usersQuery.data ?? [];

  const invalidateIssues = () => queryClient.invalidateQueries({ queryKey: ['admin-issues'] });
  const onError = (title: string) => (error: unknown) => addToast({ type: 'error', title, description: apiErrorMessage(error) });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; status: string; resolution_notes?: string }) => (await apiClient.post(`/issues/${id}/status`, data)).data,
    onSuccess: (_d, vars) => {
      invalidateIssues();
      setStatusIssue(null);
      addToast({ type: 'success', title: 'Status updated', description: `Issue #${vars.id} is now ${statusLabel(vars.status).toLowerCase()}.` });
    },
    onError: onError('Could not update status'),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; user_id: number; notes?: string }) => (await apiClient.post(`/issues/${id}/assign`, data)).data,
    onSuccess: (_d, vars) => {
      invalidateIssues();
      setAssignIssue(null);
      addToast({ type: 'success', title: 'Issue assigned', description: `Issue #${vars.id} was assigned.` });
    },
    onError: (error) => {
      setAssignError(apiErrorMessage(error));
      onError('Could not assign issue')(error);
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; title: string; description: string; category_id?: number; priority: string; labels?: string[] }) =>
      (await apiClient.put(`/issues/${id}`, data)).data,
    onSuccess: (_d, vars) => {
      invalidateIssues();
      setEditIssue(null);
      addToast({ type: 'success', title: 'Issue updated', description: `Issue #${vars.id} was saved.` });
    },
    onError: (error) => {
      setEditErrors(serverErrors(error));
      onError('Could not update issue')(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (issue: Issue) => {
      await apiClient.delete(`/issues/${issue.id}`);
    },
    onSuccess: (_d, issue) => {
      invalidateIssues();
      addToast({ type: 'success', title: 'Issue deleted', description: `Issue #${issue.id} was removed.` });
    },
    onError: onError('Delete failed'),
  });

  const mergeMutation = useMutation({
    mutationFn: async ({ mainId, duplicateIds }: { mainId: number; duplicateIds: number[] }) =>
      (await apiClient.post(`/issues/${mainId}/merge`, { duplicate_ids: duplicateIds })).data,
    onSuccess: (_d, vars) => {
      invalidateIssues();
      closeMerge();
      setDuplicatesOpen(false);
      findDuplicatesMutation.reset();
      addToast({ type: 'success', title: 'Issues merged', description: `${vars.duplicateIds.length} issue(s) merged into #${vars.mainId}.` });
    },
    onError: (error) => {
      setConfirmMerge(false);
      onError('Merge failed')(error);
    },
  });

  const findDuplicatesMutation = useMutation({
    mutationFn: async (threshold: number) => {
      const response = await apiClient.get(`/issues/duplicates?threshold=${threshold}`);
      const groups = response.data?.data?.duplicate_groups;
      return (Array.isArray(groups) ? groups : []).filter((g: DuplicateGroup) => g?.main_issue && Array.isArray(g.duplicates)) as DuplicateGroup[];
    },
    onError: onError('Could not search for duplicates'),
  });
  const duplicateGroups = findDuplicatesMutation.data ?? [];

  const openStatus = (issue: Issue) => {
    setStatusIssue(issue);
    setStatusForm({ status: issue.status ?? 'open', resolution_notes: issue.resolution_notes || '' });
  };

  const openAssign = (issue: Issue) => {
    setAssignIssue(issue);
    setAssignForm({ user_id: issue.assigned_to ? String(issue.assigned_to) : '', notes: '' });
    setAssignError(undefined);
  };

  const openEdit = (issue: Issue) => {
    setEditIssue(issue);
    setEditForm({
      title: issue.title ?? '',
      description: issue.description ?? '',
      category_id: issue.category_id ? String(issue.category_id) : '',
      priority: issue.priority ?? 'medium',
      labels: Array.isArray(issue.labels) ? issue.labels : [],
    });
    setLabelInput('');
    setEditErrors({});
  };

  const openMerge = (issue: IssueSummary, preselected: number[] = []) => {
    setMergeTarget(issue);
    setSelectedDuplicates(preselected);
    setConfirmMerge(false);
  };

  function closeMerge() {
    setMergeTarget(null);
    setSelectedDuplicates([]);
    setConfirmMerge(false);
  }

  const addLabel = () => {
    const label = labelInput.trim();
    if (label && !editForm.labels.includes(label)) setEditForm({ ...editForm, labels: [...editForm.labels, label] });
    setLabelInput('');
  };

  const handleDelete = async (issue: Issue) => {
    const ok = await confirm({
      title: 'Delete issue',
      message: `Delete issue #${issue.id} “${issue.title}”? Its comments and votes are removed too. This cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete issue',
    });
    if (ok) deleteMutation.mutate(issue);
  };

  const submitStatus = (e: FormEvent) => {
    e.preventDefault();
    if (!statusIssue) return;
    updateStatusMutation.mutate({ id: statusIssue.id, status: statusForm.status, resolution_notes: statusForm.resolution_notes || undefined });
  };

  const submitAssign = (e: FormEvent) => {
    e.preventDefault();
    if (!assignIssue) return;
    if (!assignForm.user_id) return setAssignError('Select a user to assign this issue to.');
    setAssignError(undefined);
    assignMutation.mutate({ id: assignIssue.id, user_id: parseInt(assignForm.user_id, 10), notes: assignForm.notes || undefined });
  };

  const submitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editIssue) return;
    const next: EditErrors = {};
    if (!editForm.title.trim()) next.title = 'Title is required.';
    else if (editForm.title.trim().length < 5) next.title = 'Title must be at least 5 characters.';
    if (!editForm.description.trim()) next.description = 'Description is required.';
    else if (editForm.description.trim().length < 10) next.description = 'Description must be at least 10 characters.';
    setEditErrors(next);
    if (Object.keys(next).length) return;
    updateIssueMutation.mutate({
      id: editIssue.id,
      title: editForm.title.trim(),
      description: editForm.description,
      category_id: editForm.category_id ? parseInt(editForm.category_id, 10) : undefined,
      priority: editForm.priority,
      labels: editForm.labels.length > 0 ? editForm.labels : undefined,
    });
  };

  const submitMerge = () => {
    if (!mergeTarget || selectedDuplicates.length === 0) return;
    if (!confirmMerge) return setConfirmMerge(true);
    mergeMutation.mutate({ mainId: mergeTarget.id, duplicateIds: selectedDuplicates });
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const mergeCandidates = mergeTarget ? issues.filter((i) => i.id !== mergeTarget.id && i.status !== 'duplicate' && !i.merged_into) : [];
  // Keep pre-selected duplicates (from the "find duplicates" dialog) visible even if they are not on this page.
  const preselectedOffPage = mergeTarget ? selectedDuplicates.filter((id) => !mergeCandidates.some((c) => c.id === id)) : [];

  let content;
  if (issuesQuery.isLoading) content = <LoadingState label="Loading issues…" />;
  else if (issuesQuery.isError) content = <ErrorState title="Could not load issues" message={apiErrorMessage(issuesQuery.error)} onRetry={() => issuesQuery.refetch()} />;
  else if (issues.length === 0)
    content = (
      <EmptyState
        icon={Bug}
        title={hasFilters ? 'No issues match your filters' : 'No issues reported yet'}
        description={hasFilters ? 'Try a different search or clear the filters.' : 'Community issues and questions will appear here.'}
        action={
          hasFilters ? (
            <Button variant="outline" size="sm" onClick={() => { setFilters(emptyFilters); setSearchInput(''); }}>
              Clear filters
            </Button>
          ) : undefined
        }
      />
    );
  else
    content = (
      <TableShell caption="Issues">
        <thead>
          <tr>
            <th>Issue</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Category</th>
            <th>Assigned to</th>
            <th>Stats</th>
            <th className="text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {issues.map((issue) => {
            const mergeDisabled = issue.status === 'duplicate' || !!issue.merged_into;
            return (
              <tr key={issue.id}>
                <td className="min-w-[16rem]">
                  <p className="flex items-start gap-1.5 font-medium text-slate-900">
                    {issue.is_pinned && <Pin className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-500" aria-label="Pinned" />}
                    {issue.merged_into && <Link2 className="mt-0.5 h-3.5 w-3.5 flex-none text-violet-500" aria-label={`Merged into issue #${issue.merged_into}`} />}
                    <span>
                      <span className="text-slate-400">#{issue.id}</span> {issue.title}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    by {issue.user?.name ?? (issue.user_id ? 'Registered user' : issue.guest_name || 'Guest')} · {formatDate(issue.created_at)}
                  </p>
                  {issue.merged_into && <p className="mt-0.5 text-xs text-violet-700">Merged into issue #{issue.merged_into}</p>}
                  {Array.isArray(issue.merged_issues) && issue.merged_issues.length > 0 && (
                    <p className="mt-0.5 text-xs text-amber-700">{issue.merged_issues.length} issue(s) merged into this</p>
                  )}
                </td>
                <td>
                  <Badge tone={statusTone(issue.status)}>{statusLabel(issue.status)}</Badge>
                </td>
                <td>
                  <Badge tone={priorityTone(issue.priority)}>{issue.priority ?? '—'}</Badge>
                </td>
                <td>{issue.category ? <Badge>{issue.category.name}</Badge> : <span className="text-slate-400">—</span>}</td>
                <td className="whitespace-nowrap">{issue.assignee ? issue.assignee.name : <span className="text-slate-400">Unassigned</span>}</td>
                <td>
                  <div className="flex gap-3 whitespace-nowrap text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1" title="Views">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">Views:</span>
                      {issue.views_count ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Upvotes">
                      <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">Upvotes:</span>
                      {issue.upvotes_count ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1" title="Comments">
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">Comments:</span>
                      {issue.comments_count ?? 0}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <IconButton label={`Edit issue #${issue.id}`} icon={Pencil} onClick={() => openEdit(issue)} />
                    <IconButton label={`Change status of issue #${issue.id}`} icon={CircleDot} onClick={() => openStatus(issue)} />
                    <IconButton label={`Assign issue #${issue.id}`} icon={UserPlus} onClick={() => openAssign(issue)} />
                    <IconButton
                      label={mergeDisabled ? `Issue #${issue.id} is already merged` : `Merge duplicates into issue #${issue.id}`}
                      icon={GitMerge}
                      disabled={mergeDisabled}
                      onClick={() => openMerge(issue)}
                    />
                    <IconButton label={`Delete issue #${issue.id}`} icon={Trash2} tone="danger" disabled={deleteMutation.isPending} onClick={() => handleDelete(issue)} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>
    );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Issues"
        description="Triage community issues and questions: update status, assign, edit and merge duplicates."
        actions={
          <Button variant="outline" size="sm" onClick={() => setDuplicatesOpen(true)} leftIcon={<ScanSearch className="h-4 w-4" />}>
            Find duplicates
          </Button>
        }
      />

      <AdminCard padded={false}>
        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_10rem_10rem_12rem_auto]">
          <SearchInput label="Search issues" placeholder="Search issues…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <select aria-label="Filter by status" className={inputClass} value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setCurrentPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select aria-label="Filter by priority" className={inputClass} value={filters.priority} onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setCurrentPage(1); }}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select aria-label="Filter by category" className={inputClass} value={filters.category_id} onChange={(e) => { setFilters({ ...filters, category_id: e.target.value }); setCurrentPage(1); }}>
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="sm" disabled={!hasFilters && !searchInput} onClick={() => { setFilters(emptyFilters); setSearchInput(''); setCurrentPage(1); }}>
            Clear filters
          </Button>
        </div>
        {content}
        {pagination.last_page > 1 && !issuesQuery.isError && (
          <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
            <p className="text-slate-600">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} issues
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagination.current_page <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={pagination.current_page >= pagination.last_page} onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}>
                Next
              </Button>
            </div>
          </nav>
        )}
      </AdminCard>

      {/* Status */}
      <Modal
        open={!!statusIssue}
        size="sm"
        title="Update issue status"
        description={statusIssue ? `#${statusIssue.id} ${statusIssue.title}` : undefined}
        onClose={() => setStatusIssue(null)}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStatusIssue(null)}>
              Cancel
            </Button>
            <Button type="submit" form="issue-status-form" size="sm" loading={updateStatusMutation.isPending}>
              Update status
            </Button>
          </>
        }
      >
        <form id="issue-status-form" onSubmit={submitStatus} className="space-y-4">
          <Field label="Status">
            {(p) => (
              <select {...p} className={inputClass} value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as IssueStatus })}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {(statusForm.status === 'resolved' || statusForm.status === 'closed') && (
            <Field label="Resolution notes" hint="Shown to the reporter. Saved when the status is Resolved.">
              {(p) => (
                <textarea
                  {...p}
                  rows={4}
                  className={inputClass}
                  placeholder="How was this issue resolved?"
                  value={statusForm.resolution_notes}
                  onChange={(e) => setStatusForm({ ...statusForm, resolution_notes: e.target.value })}
                />
              )}
            </Field>
          )}
        </form>
      </Modal>

      {/* Assign */}
      <Modal
        open={!!assignIssue}
        size="sm"
        title="Assign issue"
        description={assignIssue ? `#${assignIssue.id} ${assignIssue.title}` : undefined}
        onClose={() => setAssignIssue(null)}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAssignIssue(null)}>
              Cancel
            </Button>
            <Button type="submit" form="issue-assign-form" size="sm" loading={assignMutation.isPending}>
              Assign
            </Button>
          </>
        }
      >
        <form id="issue-assign-form" noValidate onSubmit={submitAssign} className="space-y-4">
          <Field label="Assign to" required error={assignError}>
            {(p) => (
              <select {...p} className={inputClass} value={assignForm.user_id} disabled={usersQuery.isLoading} onChange={(e) => setAssignForm({ ...assignForm, user_id: e.target.value })}>
                <option value="">{usersQuery.isLoading ? 'Loading users…' : 'Select a user…'}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Notes" hint="Optional, up to 500 characters.">
            {(p) => <textarea {...p} rows={3} maxLength={500} className={inputClass} value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })} />}
          </Field>
        </form>
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editIssue}
        size="lg"
        title="Edit issue"
        description={editIssue ? `#${editIssue.id}` : undefined}
        onClose={() => setEditIssue(null)}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditIssue(null)}>
              Cancel
            </Button>
            <Button type="submit" form="issue-edit-form" size="sm" loading={updateIssueMutation.isPending}>
              Save changes
            </Button>
          </>
        }
      >
        <form id="issue-edit-form" noValidate onSubmit={submitEdit} className="space-y-4">
          <Field label="Title" required error={editErrors.title}>
            {(p) => <input {...p} className={inputClass} value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />}
          </Field>
          <Field label="Description" required error={editErrors.description}>
            {(p) => <textarea {...p} rows={6} className={inputClass} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={editErrors.category_id}>
              {(p) => (
                <select {...p} className={inputClass} value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}>
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Priority" error={editErrors.priority}>
              {(p) => (
                <select {...p} className={inputClass} value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as IssuePriority })}>
                  {PRIORITIES.map((pr) => (
                    <option key={pr.value} value={pr.value}>
                      {pr.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <Field label="Labels" error={editErrors.labels} hint="Press Enter to add a label.">
            {(p) => (
              <div className="flex gap-2">
                <input
                  {...p}
                  className={inputClass}
                  value={labelInput}
                  placeholder="Add a label"
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLabel();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addLabel}>
                  Add
                </Button>
              </div>
            )}
          </Field>
          {editForm.labels.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Labels">
              {editForm.labels.map((label) => (
                <li key={label} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-3 pr-1 text-sm text-slate-700">
                  {label}
                  <button
                    type="button"
                    aria-label={`Remove label ${label}`}
                    onClick={() => setEditForm({ ...editForm, labels: editForm.labels.filter((l) => l !== label) })}
                    className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      </Modal>

      {/* Merge */}
      <Modal
        open={!!mergeTarget}
        size="xl"
        title="Merge duplicate issues"
        description={mergeTarget ? `Into #${mergeTarget.id} ${mergeTarget.title}` : undefined}
        onClose={closeMerge}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={closeMerge}>
              Cancel
            </Button>
            <Button size="sm" variant={confirmMerge ? 'danger' : 'primary'} disabled={selectedDuplicates.length === 0} loading={mergeMutation.isPending} onClick={submitMerge}>
              {confirmMerge ? `Confirm merge of ${selectedDuplicates.length} issue(s)` : `Merge ${selectedDuplicates.length} issue(s)`}
            </Button>
          </>
        }
      >
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Select duplicate issues ({selectedDuplicates.length} selected)</legend>
          {preselectedOffPage.length > 0 && (
            <p className="mb-2 text-sm text-slate-600">Pre-selected from duplicate search: {preselectedOffPage.map((id) => `#${id}`).join(', ')}</p>
          )}
          {mergeCandidates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No other issues on this page can be merged.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {mergeCandidates.map((issue) => (
                <li key={issue.id}>
                  <label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                      checked={selectedDuplicates.includes(issue.id)}
                      onChange={() => {
                        setConfirmMerge(false);
                        setSelectedDuplicates((prev) => (prev.includes(issue.id) ? prev.filter((id) => id !== issue.id) : [...prev, issue.id]));
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-slate-900">
                          #{issue.id} {issue.title}
                        </span>
                        <Badge tone={statusTone(issue.status)}>{statusLabel(issue.status)}</Badge>
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {issue.category?.name ? `${issue.category.name} · ` : ''}
                        {issue.comments_count ?? 0} comments · {issue.upvotes_count ?? 0} upvotes
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        {selectedDuplicates.length > 0 && (
          <div role={confirmMerge ? 'alert' : undefined} className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Merging will:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
              <li>
                Move all comments from {selectedDuplicates.length} issue(s) to #{mergeTarget?.id}
              </li>
              <li>Move upvotes and combine view counts</li>
              <li>Merge labels</li>
              <li>Mark the duplicates as “duplicate” and lock them</li>
            </ul>
            {confirmMerge && <p className="mt-2 font-medium">This cannot be undone. Press “Confirm merge” to continue.</p>}
          </div>
        )}
      </Modal>

      {/* Find duplicates */}
      <Modal open={duplicatesOpen} size="xl" title="Find duplicate issues" onClose={() => setDuplicatesOpen(false)}>
        <form
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            findDuplicatesMutation.mutate(similarityThreshold);
          }}
        >
          <Field label={`Similarity threshold: ${similarityThreshold}%`} hint="Only pairs above this similarity are shown. Higher values find closer matches.">
            {(p) => (
              <input
                {...p}
                type="range"
                min={50}
                max={100}
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
            )}
          </Field>
          <Button type="submit" size="sm" className="mt-3" loading={findDuplicatesMutation.isPending} leftIcon={<ScanSearch className="h-4 w-4" />}>
            Find duplicates
          </Button>
        </form>

        <div className="mt-4" aria-live="polite">
          {findDuplicatesMutation.isPending ? (
            <LoadingState label="Searching for duplicates…" />
          ) : findDuplicatesMutation.isError ? (
            <ErrorState title="Search failed" message={apiErrorMessage(findDuplicatesMutation.error)} onRetry={() => findDuplicatesMutation.mutate(similarityThreshold)} />
          ) : findDuplicatesMutation.isSuccess && duplicateGroups.length === 0 ? (
            <EmptyState icon={ScanSearch} title="No duplicates found" description={`Nothing is at least ${similarityThreshold}% similar. Try lowering the threshold.`} />
          ) : (
            duplicateGroups.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Found <strong>{duplicateGroups.length}</strong> group(s) of potential duplicates.
                </p>
                {duplicateGroups.map((group, index) => (
                  <section key={`${group.main_issue.id}-${index}`} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Group {index + 1} ({group.total_count ?? group.duplicates.length + 1} issues)
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDuplicatesOpen(false);
                          openMerge(group.main_issue, group.duplicates.map((d) => d.id));
                        }}
                      >
                        Merge all
                      </Button>
                    </div>
                    <div className="mt-3 rounded-md border-l-4 border-blue-500 bg-blue-50 p-3 text-sm">
                      <span className="font-medium text-blue-900">Main: #{group.main_issue.id}</span> {group.main_issue.title}{' '}
                      <Badge tone={statusTone(group.main_issue.status)}>{statusLabel(group.main_issue.status)}</Badge>
                    </div>
                    <ul className="mt-2 space-y-2">
                      {group.duplicates.map((dup) => (
                        <li key={dup.id} className="flex items-start justify-between gap-3 rounded-md border-l-4 border-amber-400 bg-slate-50 p-3 text-sm">
                          <span>
                            #{dup.id} {dup.title}{' '}
                            {typeof dup.similarity === 'number' && <span className="text-xs font-medium text-amber-700">{dup.similarity}% similar</span>}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setDuplicatesOpen(false);
                              openMerge(group.main_issue, [dup.id]);
                            }}
                          >
                            Merge
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )
          )}
        </div>
      </Modal>
    </div>
  );
}
