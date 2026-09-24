import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
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
import { useAuthContext } from '../../contexts/AuthContext';
import { useSEO } from '../../utils/seo';

interface UserGroup {
  id: number;
  name: string;
  color?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | string;
  created_at?: string;
  updated_at?: string;
  groups?: UserGroup[];
}

interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'user';
  password: string;
}

type FormErrors = Partial<Record<keyof UserFormData, string>>;

const emptyForm: UserFormData = { name: '', email: '', role: 'user', password: '' };

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

function serverErrors(error: unknown): FormErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[] | string> } } })?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return {};
  const out: FormErrors = {};
  for (const key of ['name', 'email', 'role', 'password'] as const) {
    const v = errors[key];
    if (v) out[key] = Array.isArray(v) ? v[0] : String(v);
  }
  return out;
}

/** Legacy user list (/admin/users). The newer /admin/user-management page adds verification, stats and bulk actions. */
export default function Users() {
  useSEO({ title: 'Users | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const { user: currentUser } = useAuthContext();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmRoleChange, setConfirmRoleChange] = useState(false);

  const isSelf = (user: User | null) => !!user && currentUser?.id != null && Number(user.id) === Number(currentUser.id);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: ['admin-users', search, selectedRole],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRole) params.append('role', selectedRole);
      const response = await apiClient.get(`/admin/users?${params.toString()}`);
      return asList<User>(response.data).filter((u) => u && typeof u === 'object' && 'id' in u);
    },
    staleTime: 2 * 60 * 1000,
  });
  const users = usersQuery.data ?? [];

  const userMutation = useMutation({
    mutationFn: async ({ id, ...userData }: UserFormData & { id?: number }) => {
      const payload: Partial<UserFormData> = { ...userData };
      if (id && !payload.password) delete payload.password;
      const response = id ? await apiClient.put(`/admin/users/${id}`, payload) : await apiClient.post('/admin/users', payload);
      return response.data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      addToast({ type: 'success', title: vars.id ? 'User updated' : 'User created', description: `${vars.name} was saved.` });
      closeModal();
    },
    onError: (error) => {
      setConfirmRoleChange(false);
      setErrors(serverErrors(error));
      addToast({ type: 'error', title: 'Could not save user', description: apiErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (user: User) => {
      await apiClient.delete(`/admin/users/${user.id}`);
    },
    onSuccess: (_d, user) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      addToast({ type: 'success', title: 'User deleted', description: `${user.name} has been removed.` });
    },
    onError: (error) => addToast({ type: 'error', title: 'Delete failed', description: apiErrorMessage(error) }),
  });

  const openCreate = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setErrors({});
    setConfirmRoleChange(false);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name ?? '', email: user.email ?? '', role: user.role === 'admin' ? 'admin' : 'user', password: '' });
    setErrors({});
    setConfirmRoleChange(false);
    setModalOpen(true);
  };

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
    setErrors({});
    setConfirmRoleChange(false);
  }

  const handleDelete = async (user: User) => {
    if (isSelf(user)) return;
    const ok = await confirm({
      title: 'Delete user',
      message: `Delete ${user.name} (${user.email})? This cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete user',
    });
    if (ok) deleteMutation.mutate(user);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!formData.name.trim()) next.name = 'Name is required.';
    if (!formData.email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) next.email = 'Enter a valid email address.';
    if (!editingUser && !formData.password) next.password = 'Password is required.';
    else if (formData.password && formData.password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const role = editingUser && isSelf(editingUser) ? (editingUser.role as UserFormData['role']) : formData.role;
    if (editingUser && role !== editingUser.role && !confirmRoleChange) {
      setConfirmRoleChange(true);
      return;
    }
    userMutation.mutate({ ...formData, name: formData.name.trim(), email: formData.email.trim(), role, id: editingUser?.id });
  };

  const hasFilters = !!(search || selectedRole);
  const editingSelf = isSelf(editingUser);

  let content;
  if (usersQuery.isLoading) content = <LoadingState label="Loading users…" />;
  else if (usersQuery.isError) content = <ErrorState title="Could not load users" message={apiErrorMessage(usersQuery.error)} onRetry={() => usersQuery.refetch()} />;
  else if (users.length === 0)
    content = (
      <EmptyState
        icon={UsersIcon}
        title={hasFilters ? 'No users match your filters' : 'No users yet'}
        description={hasFilters ? 'Try another search term or role.' : 'Create the first account to get started.'}
        action={
          hasFilters ? (
            <Button variant="outline" size="sm" onClick={() => { setSearchInput(''); setSearch(''); setSelectedRole(''); }}>
              Clear filters
            </Button>
          ) : (
            <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
              Add user
            </Button>
          )
        }
      />
    );
  else
    content = (
      <TableShell caption="Users">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Groups</th>
            <th>Created</th>
            <th className="text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600" aria-hidden="true">
                    {(user.name || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="whitespace-nowrap font-medium text-slate-900">
                      {user.name} {isSelf(user) && <Badge tone="info">You</Badge>}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
              </td>
              <td>
                <Badge tone={user.role === 'admin' ? 'danger' : 'neutral'}>{user.role || 'user'}</Badge>
              </td>
              <td>
                {user.groups?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {user.groups.map((group) => (
                      <span key={group.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color || '#64748b' }} aria-hidden="true" />
                        {group.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="whitespace-nowrap text-slate-500">{formatDate(user.created_at)}</td>
              <td>
                <div className="flex justify-end gap-1">
                  <IconButton label={`Edit ${user.name}`} icon={Pencil} onClick={() => openEdit(user)} />
                  <IconButton
                    label={isSelf(user) ? 'You cannot delete your own account' : `Delete ${user.name}`}
                    icon={Trash2}
                    tone="danger"
                    disabled={isSelf(user) || deleteMutation.isPending}
                    onClick={() => handleDelete(user)}
                  />
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
        title="Users"
        description="Create accounts and manage roles. For verification, statistics and bulk actions use User Management."
        actions={
          <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Add user
          </Button>
        }
      />

      <p className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-900">
        This is the legacy user list.
        <Link to="/admin/user-management" className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline">
          Open User Management <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </p>

      <AdminCard padded={false}>
        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-[1fr_12rem]">
          <SearchInput label="Search users" placeholder="Search by name or email" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <select aria-label="Filter by role" className={inputClass} value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        {content}
      </AdminCard>

      <Modal
        open={modalOpen}
        title={editingUser ? 'Edit user' : 'Create user'}
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" form="legacy-user-form" size="sm" variant={confirmRoleChange ? 'danger' : 'primary'} loading={userMutation.isPending}>
              {confirmRoleChange ? 'Confirm role change' : editingUser ? 'Save changes' : 'Create user'}
            </Button>
          </>
        }
      >
        <form id="legacy-user-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name" required error={errors.name}>
            {(p) => <input {...p} className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />}
          </Field>
          <Field label="Email" required error={errors.email}>
            {(p) => <input {...p} type="email" className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />}
          </Field>
          <Field label="Role" required error={errors.role} hint={editingSelf ? 'You cannot change the role of your own account.' : undefined}>
            {(p) => (
              <select
                {...p}
                className={inputClass}
                disabled={editingSelf}
                value={formData.role}
                onChange={(e) => {
                  setFormData({ ...formData, role: e.target.value as UserFormData['role'] });
                  setConfirmRoleChange(false);
                }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            )}
          </Field>
          <Field
            label={editingUser ? 'New password' : 'Password'}
            required={!editingUser}
            error={errors.password}
            hint={editingUser ? 'Leave blank to keep the current password.' : 'At least 6 characters.'}
          >
            {(p) => (
              <input
                {...p}
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            )}
          </Field>
          {confirmRoleChange && editingUser && (
            <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              You are changing <strong>{editingUser.name}</strong>'s role from <strong>{editingUser.role}</strong> to <strong>{formData.role}</strong>. Press “Confirm role
              change” to continue.
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
