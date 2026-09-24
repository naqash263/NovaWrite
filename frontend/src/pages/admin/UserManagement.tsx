import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Columns3,
  Eye,
  LayoutGrid,
  MailCheck,
  Pencil,
  RefreshCw,
  ShieldAlert,
  Table2,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users as UsersIcon,
  XCircle,
} from 'lucide-react';
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
  StatCard,
  TableShell,
  inputClass,
} from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSEO } from '../../utils/seo';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified_at: string | null;
  created_at?: string;
  updated_at?: string;
  two_factor_enabled?: boolean;
  avatar?: string | null;
}

interface UserStats {
  total_users?: number;
  verified_users?: number;
  unverified_users?: number;
  admin_users?: number;
  regular_users?: number;
  moderator_users?: number;
  recent_registrations?: number;
}

type SortKey = 'name' | 'role' | 'email_verified_at' | 'created_at';
type ColumnKey = 'email' | 'role' | 'verified' | 'created';
type BulkOperation = 'role' | 'verify';
type FieldErrors = Partial<Record<'name' | 'email' | 'role', string>>;

const PER_PAGE = 15;
const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
];
const COLUMN_LABELS: Record<ColumnKey, string> = { email: 'Email', role: 'Role', verified: 'Verified', created: 'Created' };

const fmt = (n: number | undefined) => (typeof n === 'number' ? n.toLocaleString() : '—');

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const roleTone = (role: string) => (role === 'admin' ? 'danger' : role === 'moderator' ? 'warning' : 'neutral');

function fieldErrorsFrom(error: unknown): FieldErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[] | string> } } })?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return {};
  const out: FieldErrors = {};
  for (const key of ['name', 'email', 'role'] as const) {
    const value = errors[key];
    if (value) out[key] = Array.isArray(value) ? value[0] : String(value);
  }
  return out;
}

function Avatar({ user }: { user: User }) {
  if (user.avatar) return <img className="h-9 w-9 flex-none rounded-full object-cover" src={user.avatar} alt="" />;
  return (
    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600" aria-hidden="true">
      {(user.name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

export default function UserManagement() {
  useSEO({ title: 'User Management | Admin', robots: 'noindex, nofollow' });
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const { user: currentUser } = useAuthContext();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showColumns, setShowColumns] = useState<Record<ColumnKey, boolean>>({ email: true, role: true, verified: true, created: true });
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user' });
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [confirmRoleChange, setConfirmRoleChange] = useState(false);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<BulkOperation>('role');
  const [bulkValue, setBulkValue] = useState('');

  const isSelf = (user: Pick<User, 'id'> | null | undefined) =>
    !!user && currentUser?.id !== undefined && currentUser?.id !== null && Number(user.id) === Number(currentUser.id);

  // Debounce the search box so every keystroke does not hit the API.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: ['admin-user-management', currentPage, searchTerm, roleFilter, verificationFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: String(PER_PAGE),
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
        ...(verificationFilter && { verification_status: verificationFilter }),
      });
      const response = await apiClient.get(`/admin/user-management?${params}`);
      const paginator = (response.data?.data ?? {}) as { last_page?: number; total?: number };
      return {
        users: asList<User>(response.data).filter((u) => u && typeof u === 'object' && 'id' in u),
        lastPage: typeof paginator.last_page === 'number' && paginator.last_page > 0 ? paginator.last_page : 1,
        total: typeof paginator.total === 'number' ? paginator.total : undefined,
      };
    },
    placeholderData: (previous) => previous,
  });

  const statsQuery = useQuery({
    queryKey: ['admin-user-management-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/user-management/stats');
      const data = response.data?.data ?? response.data;
      return (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as UserStats;
    },
  });

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data]);
  const totalPages = usersQuery.data?.lastPage ?? 1;
  const stats = statsQuery.data;

  const sortedUsers = useMemo(() => {
    const list = [...users];
    const dir = sortOrder === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const av = (a[sortBy] ?? '') as string;
      const bv = (b[sortBy] ?? '') as string;
      return av.localeCompare(bv) * dir;
    });
    return list;
  }, [users, sortBy, sortOrder]);

  const selectableIds = users.filter((u) => !isSelf(u)).map((u) => u.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedUsers.includes(id));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-user-management'] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-management-stats'] });
  };

  const verifyMutation = useMutation({
    mutationFn: async ({ user, verify }: { user: User; verify: boolean }) => {
      await apiClient.post(`/admin/user-management/${user.id}/${verify ? 'verify' : 'unverify'}`);
    },
    onSuccess: (_d, { user, verify }) => {
      addToast({ type: 'success', title: verify ? 'User verified' : 'Verification removed', description: `${user.name} is now ${verify ? 'verified' : 'unverified'}.` });
      refresh();
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not update verification', description: apiErrorMessage(error) }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (user: User) => {
      await apiClient.delete(`/admin/user-management/${user.id}`);
    },
    onSuccess: (_d, user) => {
      addToast({ type: 'success', title: 'User deleted', description: `${user.name} has been removed.` });
      setSelectedUsers((prev) => prev.filter((id) => id !== user.id));
      refresh();
    },
    onError: (error) => addToast({ type: 'error', title: 'Delete failed', description: apiErrorMessage(error) }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; name: string; email: string; role: string }) => {
      const response = await apiClient.put(`/admin/user-management/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'User updated', description: 'The user was saved successfully.' });
      closeEdit();
      refresh();
    },
    onError: (error) => {
      setConfirmRoleChange(false);
      setEditErrors(fieldErrorsFrom(error));
      addToast({ type: 'error', title: 'Update failed', description: apiErrorMessage(error) });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, operation, value }: { ids: number[]; operation: BulkOperation; value: string }) => {
      if (operation === 'role') {
        await apiClient.post('/admin/bulk/users/role', { ids, role: value });
      } else if (value === 'verify') {
        await apiClient.post('/admin/user-management/bulk-verify', { user_ids: ids });
      } else {
        // No bulk "unverify" endpoint exists: unverify each user individually.
        const results = await Promise.allSettled(ids.map((id) => apiClient.post(`/admin/user-management/${id}/unverify`)));
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed === ids.length) throw (results[0] as PromiseRejectedResult).reason;
      }
      return ids.length;
    },
    onSuccess: (count) => {
      addToast({ type: 'success', title: 'Bulk action complete', description: `${count} user${count === 1 ? '' : 's'} updated.` });
      setSelectedUsers([]);
      setBulkOpen(false);
      setBulkValue('');
      refresh();
    },
    onError: (error) => addToast({ type: 'error', title: 'Bulk action failed', description: apiErrorMessage(error) }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiClient.post('/admin/bulk/users/delete', { ids });
      return ids.length;
    },
    onSuccess: (count) => {
      addToast({ type: 'success', title: 'Users deleted', description: `${count} user${count === 1 ? '' : 's'} deleted.` });
      setSelectedUsers([]);
      refresh();
    },
    onError: (error) => addToast({ type: 'error', title: 'Delete failed', description: apiErrorMessage(error) }),
  });

  const handleDelete = async (user: User) => {
    if (isSelf(user)) {
      addToast({ type: 'warning', title: 'Not allowed', description: 'You cannot delete your own account.' });
      return;
    }
    const ok = await confirm({
      title: 'Delete user',
      message: `Delete ${user.name} (${user.email})? This permanently removes the account and cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete user',
    });
    if (ok) deleteMutation.mutate(user);
  };

  const handleBulkDelete = async () => {
    const ids = selectedUsers.filter((id) => id !== Number(currentUser?.id));
    if (!ids.length) return;
    const ok = await confirm({
      title: 'Delete users',
      message: `Delete ${ids.length} user${ids.length === 1 ? '' : 's'}? This cannot be undone.`,
      type: 'danger',
      confirmText: `Delete ${ids.length} user${ids.length === 1 ? '' : 's'}`,
    });
    if (ok) bulkDeleteMutation.mutate(ids);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name ?? '', email: user.email ?? '', role: user.role || 'user' });
    setEditErrors({});
    setConfirmRoleChange(false);
  };

  function closeEdit() {
    setEditingUser(null);
    setEditErrors({});
    setConfirmRoleChange(false);
  }

  const submitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const errors: FieldErrors = {};
    if (!editForm.name.trim()) errors.name = 'Name is required.';
    if (!editForm.email.trim()) errors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(editForm.email.trim())) errors.email = 'Enter a valid email address.';
    setEditErrors(errors);
    if (Object.keys(errors).length) return;

    // Admins can never change their own role from here.
    const role = isSelf(editingUser) ? editingUser.role : editForm.role;
    if (role !== editingUser.role && !confirmRoleChange) {
      setConfirmRoleChange(true);
      return;
    }
    updateMutation.mutate({ id: editingUser.id, name: editForm.name.trim(), email: editForm.email.trim(), role });
  };

  const applyBulk = () => {
    const ids = selectedUsers.filter((id) => id !== Number(currentUser?.id));
    if (!ids.length || !bulkValue) return;
    bulkMutation.mutate({ ids, operation: bulkOperation, value: bulkValue });
  };

  const handleSort = (field: SortKey) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleUserSelection = (userId: number) =>
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));

  const clearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setRoleFilter('');
    setVerificationFilter('');
    setCurrentPage(1);
  };

  const hasFilters = !!(searchTerm || roleFilter || verificationFilter);
  const editingSelf = isSelf(editingUser);

  const SortHeader = ({ field, label }: { field: SortKey; label: string }) => (
    <th aria-sort={sortBy === field ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => handleSort(field)} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-900">
        {label}
        {sortBy === field && (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" />)}
      </button>
    </th>
  );

  const rowActions = (user: User) => (
    <div className="flex items-center justify-end gap-1">
      <IconButton label={`View details for ${user.name}`} icon={Eye} onClick={() => setDetailsUser(user)} />
      <IconButton label={`Edit ${user.name}`} icon={Pencil} onClick={() => openEdit(user)} />
      {user.email_verified_at ? (
        <IconButton label={`Unverify ${user.name}`} icon={UserX} disabled={verifyMutation.isPending} onClick={() => verifyMutation.mutate({ user, verify: false })} />
      ) : (
        <IconButton label={`Verify ${user.name}`} icon={UserCheck} disabled={verifyMutation.isPending} onClick={() => verifyMutation.mutate({ user, verify: true })} />
      )}
      <IconButton
        label={isSelf(user) ? 'You cannot delete your own account' : `Delete ${user.name}`}
        icon={Trash2}
        tone="danger"
        disabled={isSelf(user) || deleteMutation.isPending}
        onClick={() => handleDelete(user)}
      />
    </div>
  );

  let content;
  if (usersQuery.isLoading) {
    content = <LoadingState label="Loading users…" />;
  } else if (usersQuery.isError) {
    content = <ErrorState title="Could not load users" message={apiErrorMessage(usersQuery.error)} onRetry={() => usersQuery.refetch()} />;
  } else if (users.length === 0) {
    content = (
      <EmptyState
        icon={UsersIcon}
        title={hasFilters ? 'No users match your filters' : 'No users yet'}
        description={hasFilters ? 'Try a different search or clear the filters.' : 'New registrations will appear here.'}
        action={
          hasFilters ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button size="sm" onClick={refresh} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
          )
        }
      />
    );
  } else if (viewMode === 'table') {
    content = (
      <TableShell caption="Users">
        <thead>
          <tr>
            <th className="w-10">
              <input
                type="checkbox"
                aria-label="Select all users on this page"
                checked={allSelected}
                onChange={() => setSelectedUsers(allSelected ? [] : selectableIds)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
            </th>
            <SortHeader field="name" label="User" />
            {showColumns.email && <th>Email</th>}
            {showColumns.role && <SortHeader field="role" label="Role" />}
            {showColumns.verified && <SortHeader field="email_verified_at" label="Verified" />}
            {showColumns.created && <SortHeader field="created_at" label="Created" />}
            <th className="text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedUsers.map((user) => (
            <tr key={user.id}>
              <td>
                <input
                  type="checkbox"
                  aria-label={isSelf(user) ? 'Your own account cannot be selected' : `Select ${user.name}`}
                  disabled={isSelf(user)}
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-40"
                />
              </td>
              <td>
                <div className="flex items-center gap-3">
                  <Avatar user={user} />
                  <div className="min-w-0">
                    <p className="whitespace-nowrap font-medium text-slate-900">
                      {user.name} {isSelf(user) && <Badge tone="info">You</Badge>}
                    </p>
                    <p className="text-xs text-slate-500">ID {user.id}</p>
                  </div>
                </div>
              </td>
              {showColumns.email && <td className="whitespace-nowrap">{user.email}</td>}
              {showColumns.role && (
                <td>
                  <Badge tone={roleTone(user.role)}>{user.role || 'user'}</Badge>
                </td>
              )}
              {showColumns.verified && (
                <td>{user.email_verified_at ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Unverified</Badge>}</td>
              )}
              {showColumns.created && <td className="whitespace-nowrap text-slate-500">{formatDate(user.created_at)}</td>}
              <td>{rowActions(user)}</td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    );
  } else {
    content = (
      <ul className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {sortedUsers.map((user) => (
          <li key={user.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label={isSelf(user) ? 'Your own account cannot be selected' : `Select ${user.name}`}
                disabled={isSelf(user)}
                checked={selectedUsers.includes(user.id)}
                onChange={() => toggleUserSelection(user.id)}
                className="mt-2.5 h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-40"
              />
              <Avatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={roleTone(user.role)}>{user.role || 'user'}</Badge>
              {user.email_verified_at ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Unverified</Badge>}
              {isSelf(user) && <Badge tone="info">You</Badge>}
            </div>
            <p className="mt-2 text-xs text-slate-500">Joined {formatDate(user.created_at)}</p>
            <div className="mt-3 border-t border-slate-100 pt-2">{rowActions(user)}</div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Manage accounts, roles and email verification."
        actions={
          <>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5" role="group" aria-label="View mode">
              <IconButton label="Table view" icon={Table2} aria-pressed={viewMode === 'table'} onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white' : ''} />
              <IconButton label="Grid view" icon={LayoutGrid} aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white' : ''} />
            </div>
            <div className="relative">
              <Button variant="ghost" size="sm" aria-expanded={columnsOpen} aria-controls="user-columns-menu" onClick={() => setColumnsOpen((v) => !v)} leftIcon={<Columns3 className="h-4 w-4" />}>
                Columns
              </Button>
              {columnsOpen && (
                <fieldset id="user-columns-menu" className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                  <legend className="sr-only">Visible columns</legend>
                  {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={showColumns[key]}
                        onChange={(e) => setShowColumns((prev) => ({ ...prev, [key]: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      {COLUMN_LABELS[key]}
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={refresh} disabled={usersQuery.isFetching} leftIcon={<RefreshCw className={`h-4 w-4 ${usersQuery.isFetching ? 'animate-spin' : ''}`} />}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="user-stats">
        <StatCard label="Total users" icon={UsersIcon} value={statsQuery.isLoading ? '…' : fmt(stats?.total_users)} hint={stats ? `${fmt(stats.admin_users)} admins · ${fmt(stats.moderator_users)} moderators` : undefined} />
        <StatCard label="Verified" icon={CheckCircle2} value={statsQuery.isLoading ? '…' : fmt(stats?.verified_users)} />
        <StatCard label="Unverified" icon={XCircle} value={statsQuery.isLoading ? '…' : fmt(stats?.unverified_users)} />
        <StatCard label="New this week" icon={UserPlus} value={statsQuery.isLoading ? '…' : fmt(stats?.recent_registrations)} />
      </div>
      {statsQuery.isError && (
        <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          User statistics could not be loaded. The list below is still up to date.
        </p>
      )}

      <AdminCard padded={false}>
        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_auto]">
          <SearchInput label="Search users" placeholder="Search by name or email" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <select aria-label="Filter by role" className={inputClass} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <select aria-label="Filter by verification status" className={inputClass} value={verificationFilter} onChange={(e) => { setVerificationFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">All statuses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={!hasFilters && !searchInput}>
            Clear filters
          </Button>
        </div>

        {selectedUsers.length > 0 && (
          <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-blue-900">
              {selectedUsers.length} user{selectedUsers.length === 1 ? '' : 's'} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => { setBulkOperation('verify'); setBulkValue('verify'); setBulkOpen(true); }} leftIcon={<MailCheck className="h-4 w-4" />}>
                Verify
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setBulkOperation('role'); setBulkValue(''); setBulkOpen(true); }} leftIcon={<ShieldAlert className="h-4 w-4" />}>
                Bulk actions
              </Button>
              <Button variant="danger" size="sm" onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending} leftIcon={<Trash2 className="h-4 w-4" />}>
                Delete selected
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])}>
                Clear selection
              </Button>
            </div>
          </div>
        )}

        {content}

        {totalPages > 1 && !usersQuery.isError && (
          <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
            <p className="text-slate-600">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
              {typeof usersQuery.data?.total === 'number' && <> · {usersQuery.data.total.toLocaleString()} users</>}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}>
                Next
              </Button>
            </div>
          </nav>
        )}
      </AdminCard>

      {/* Edit user */}
      <Modal
        open={!!editingUser}
        title="Edit user"
        description={editingUser ? editingUser.email : undefined}
        onClose={closeEdit}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={closeEdit}>
              Cancel
            </Button>
            <Button type="submit" form="edit-user-form" size="sm" variant={confirmRoleChange ? 'danger' : 'primary'} loading={updateMutation.isPending}>
              {confirmRoleChange ? 'Confirm role change' : 'Save changes'}
            </Button>
          </>
        }
      >
        <form id="edit-user-form" noValidate onSubmit={submitEdit} className="space-y-4">
          <Field label="Name" required error={editErrors.name}>
            {(p) => <input {...p} className={inputClass} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />}
          </Field>
          <Field label="Email" required error={editErrors.email}>
            {(p) => <input {...p} type="email" className={inputClass} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />}
          </Field>
          <Field label="Role" error={editErrors.role} hint={editingSelf ? 'You cannot change the role of your own account.' : 'Admins have full access to this admin panel.'}>
            {(p) => (
              <select
                {...p}
                className={inputClass}
                disabled={editingSelf}
                value={editForm.role}
                onChange={(e) => {
                  setEditForm({ ...editForm, role: e.target.value });
                  setConfirmRoleChange(false);
                }}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {confirmRoleChange && editingUser && (
            <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              You are changing <strong>{editingUser.name}</strong>'s role from <strong>{editingUser.role}</strong> to <strong>{editForm.role}</strong>.
              {editForm.role === 'admin' ? ' Admins get full access to every admin page.' : ' They will lose the permissions of their current role.'} Press
              “Confirm role change” to continue.
            </div>
          )}
        </form>
      </Modal>

      {/* User details */}
      <Modal
        open={!!detailsUser}
        title="User details"
        onClose={() => setDetailsUser(null)}
        footer={
          <Button variant="outline" size="sm" onClick={() => setDetailsUser(null)}>
            Close
          </Button>
        }
      >
        {detailsUser && (
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-slate-900">{detailsUser.name}</dd>
            <dt className="text-slate-500">Email</dt>
            <dd className="break-all text-slate-900">{detailsUser.email}</dd>
            <dt className="text-slate-500">Role</dt>
            <dd>
              <Badge tone={roleTone(detailsUser.role)}>{detailsUser.role || 'user'}</Badge>
            </dd>
            <dt className="text-slate-500">Email verified</dt>
            <dd className="text-slate-900">{detailsUser.email_verified_at ? `Yes, ${formatDate(detailsUser.email_verified_at)}` : 'No'}</dd>
            <dt className="text-slate-500">Two-factor auth</dt>
            <dd className="text-slate-900">{detailsUser.two_factor_enabled ? 'Enabled' : 'Disabled'}</dd>
            <dt className="text-slate-500">Created</dt>
            <dd className="text-slate-900">{formatDate(detailsUser.created_at)}</dd>
            <dt className="text-slate-500">Last updated</dt>
            <dd className="text-slate-900">{formatDate(detailsUser.updated_at)}</dd>
          </dl>
        )}
      </Modal>

      {/* Bulk operations */}
      <Modal
        open={bulkOpen}
        title="Bulk actions"
        description={`Applies to ${selectedUsers.length} selected user${selectedUsers.length === 1 ? '' : 's'}.`}
        onClose={() => setBulkOpen(false)}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant={bulkOperation === 'role' && bulkValue === 'admin' ? 'danger' : 'primary'} onClick={applyBulk} disabled={!bulkValue} loading={bulkMutation.isPending}>
              Apply to {selectedUsers.length} user{selectedUsers.length === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Action">
            {(p) => (
              <select
                {...p}
                className={inputClass}
                value={bulkOperation}
                onChange={(e) => {
                  setBulkOperation(e.target.value as BulkOperation);
                  setBulkValue('');
                }}
              >
                <option value="role">Change role</option>
                <option value="verify">Verify / unverify email</option>
              </select>
            )}
          </Field>
          <Field label={bulkOperation === 'role' ? 'New role' : 'Verification'} hint={bulkOperation === 'role' ? 'Bulk role changes support User and Admin.' : undefined}>
            {(p) => (
              <select {...p} className={inputClass} value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}>
                {bulkOperation === 'role' ? (
                  <>
                    <option value="">Select a role</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </>
                ) : (
                  <>
                    <option value="">Select an action</option>
                    <option value="verify">Verify email</option>
                    <option value="unverify">Unverify email</option>
                  </>
                )}
              </select>
            )}
          </Field>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            This changes {selectedUsers.length} account{selectedUsers.length === 1 ? '' : 's'} at once. Your own account is never included.
          </p>
        </div>
      </Modal>
    </div>
  );
}
