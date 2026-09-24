import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, UserMinus, UsersRound } from 'lucide-react';
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
  inputClass,
} from '../../components/admin/ui';
import { apiErrorMessage, asList } from '../../components/admin/utils';
import { useToast } from '../../hooks/use-toast';
import { useConfirm } from '../../hooks/use-confirm';
import { useSEO } from '../../utils/seo';

interface GroupMember {
  id: number;
  name: string;
  email: string;
  role?: string;
  pivot?: { added_by?: number | null; joined_at?: string | null };
}

interface UserGroup {
  id: number;
  name: string;
  description?: string | null;
  color?: string | null;
  default_permissions?: string[] | null;
  is_active: boolean;
  members_count?: number;
  created_at?: string;
  members?: GroupMember[];
}

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface GroupForm {
  name: string;
  description: string;
  color: string;
  is_active: boolean;
}

type FormErrors = Partial<Record<keyof GroupForm, string>>;

const HEX = /^#[0-9A-Fa-f]{6}$/;
const emptyForm: GroupForm = { name: '', description: '', color: '#3B82F6', is_active: true };

function serverErrors(error: unknown): FormErrors {
  const errors = (error as { response?: { data?: { errors?: Record<string, string[] | string> } } })?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return {};
  const out: FormErrors = {};
  for (const key of ['name', 'description', 'color', 'is_active'] as const) {
    const v = errors[key];
    if (v) out[key] = Array.isArray(v) ? v[0] : String(v);
  }
  return out;
}

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

export default function UserGroups() {
  useSEO({ title: 'User Groups | Admin', robots: 'noindex, nofollow' });
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [formData, setFormData] = useState<GroupForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [membersGroupId, setMembersGroupId] = useState<number | null>(null);
  const [memberToAdd, setMemberToAdd] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const groupsQuery = useQuery({
    queryKey: ['admin-user-groups', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      const response = await apiClient.get(`/admin/user-groups?${params.toString()}`);
      return asList<UserGroup>(response.data).filter((g) => g && typeof g === 'object' && 'id' in g);
    },
  });
  const groups = groupsQuery.data ?? [];

  // Users for the "add member" picker (only needed while the members dialog is open).
  const usersQuery = useQuery({
    queryKey: ['admin-users-for-groups'],
    queryFn: async () => asList<User>((await apiClient.get('/admin/users')).data),
    enabled: membersGroupId !== null,
  });

  const groupDetailQuery = useQuery({
    queryKey: ['admin-user-group', membersGroupId],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/user-groups/${membersGroupId}`);
      const data = response.data?.data && !Array.isArray(response.data.data) ? response.data.data : response.data;
      return (data && typeof data === 'object' ? data : {}) as UserGroup;
    },
    enabled: membersGroupId !== null,
  });
  const selectedGroup = groupDetailQuery.data;
  const members = Array.isArray(selectedGroup?.members) ? selectedGroup.members : [];
  const availableUsers = (usersQuery.data ?? []).filter((u) => !members.some((m) => m.id === u.id));

  const invalidateGroups = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-user-groups'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const groupMutation = useMutation({
    mutationFn: async ({ id, ...data }: GroupForm & { id?: number }) => {
      const response = id ? await apiClient.put(`/admin/user-groups/${id}`, data) : await apiClient.post('/admin/user-groups', data);
      return response.data;
    },
    onSuccess: (_d, vars) => {
      invalidateGroups();
      addToast({ type: 'success', title: vars.id ? 'Group updated' : 'Group created', description: `“${vars.name}” was saved.` });
      closeModal();
    },
    onError: (error) => {
      setErrors(serverErrors(error));
      addToast({ type: 'error', title: 'Could not save group', description: apiErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (group: UserGroup) => {
      await apiClient.delete(`/admin/user-groups/${group.id}`);
    },
    onSuccess: (_d, group) => {
      invalidateGroups();
      addToast({ type: 'success', title: 'Group deleted', description: `“${group.name}” was removed.` });
    },
    onError: (error) => addToast({ type: 'error', title: 'Delete failed', description: apiErrorMessage(error) }),
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }) => {
      const response = await apiClient.post(`/admin/user-groups/${groupId}/members`, { user_id: userId });
      return response.data;
    },
    onSuccess: () => {
      setMemberToAdd('');
      invalidateGroups();
      queryClient.invalidateQueries({ queryKey: ['admin-user-group', membersGroupId] });
      addToast({ type: 'success', title: 'Member added' });
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not add member', description: apiErrorMessage(error) }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }) => {
      await apiClient.delete(`/admin/user-groups/${groupId}/members/${userId}`);
    },
    onSuccess: () => {
      invalidateGroups();
      queryClient.invalidateQueries({ queryKey: ['admin-user-group', membersGroupId] });
      addToast({ type: 'success', title: 'Member removed' });
    },
    onError: (error) => addToast({ type: 'error', title: 'Could not remove member', description: apiErrorMessage(error) }),
  });

  const openCreate = () => {
    setEditingGroup(null);
    setFormData(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (group: UserGroup) => {
    setEditingGroup(group);
    setFormData({ name: group.name ?? '', description: group.description || '', color: group.color || '#3B82F6', is_active: group.is_active !== false });
    setErrors({});
    setModalOpen(true);
  };

  function closeModal() {
    setModalOpen(false);
    setEditingGroup(null);
    setErrors({});
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (!formData.name.trim()) next.name = 'Group name is required.';
    if (formData.color && !HEX.test(formData.color)) next.color = 'Use a 6-digit hex colour such as #3B82F6.';
    setErrors(next);
    if (Object.keys(next).length) return;
    groupMutation.mutate({ ...formData, name: formData.name.trim(), id: editingGroup?.id });
  };

  const handleDelete = async (group: UserGroup) => {
    const ok = await confirm({
      title: 'Delete group',
      message: `Delete the group “${group.name}”? All ${group.members_count ?? 0} member(s) will be removed from it. User accounts are not deleted.`,
      type: 'danger',
      confirmText: 'Delete group',
    });
    if (ok) deleteMutation.mutate(group);
  };

  const handleRemoveMember = (member: GroupMember) => {
    if (membersGroupId === null) return;
    removeMemberMutation.mutate({ groupId: membersGroupId, userId: member.id });
  };

  let content;
  if (groupsQuery.isLoading) content = <LoadingState label="Loading groups…" />;
  else if (groupsQuery.isError)
    content = (
      <AdminCard>
        <ErrorState title="Could not load user groups" message={apiErrorMessage(groupsQuery.error)} onRetry={() => groupsQuery.refetch()} />
      </AdminCard>
    );
  else if (groups.length === 0)
    content = (
      <AdminCard>
        <EmptyState
          icon={UsersRound}
          title={searchTerm ? 'No groups match your search' : 'No user groups yet'}
          description={searchTerm ? 'Try another name or description.' : 'Groups let you organise users and grant access in bulk.'}
          action={
            searchTerm ? (
              <Button variant="outline" size="sm" onClick={() => { setSearchInput(''); setSearchTerm(''); }}>
                Clear search
              </Button>
            ) : (
              <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
                Create group
              </Button>
            )
          }
        />
      </AdminCard>
    );
  else
    content = (
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="User groups">
        {groups.map((group) => (
          <li key={group.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: group.color || '#64748b' }} aria-hidden="true" />
                <h2 className="truncate font-semibold text-slate-900">{group.name}</h2>
              </div>
              <div className="flex flex-none gap-1">
                <IconButton label={`Edit ${group.name}`} icon={Pencil} onClick={() => openEdit(group)} />
                <IconButton label={`Delete ${group.name}`} icon={Trash2} tone="danger" disabled={deleteMutation.isPending} onClick={() => handleDelete(group)} />
              </div>
            </div>
            {group.description && <p className="mt-2 text-sm text-slate-600">{group.description}</p>}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-sm">
              <span className="text-slate-500">
                {group.members_count ?? 0} member{group.members_count === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-2">
                <Badge tone={group.is_active ? 'success' : 'neutral'}>{group.is_active ? 'Active' : 'Inactive'}</Badge>
                <Button variant="outline" size="sm" onClick={() => { setMemberToAdd(''); setMembersGroupId(group.id); }}>
                  Members
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Groups"
        description="Organise users into groups and manage group membership."
        actions={
          <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Create group
          </Button>
        }
      />

      <div className="max-w-md">
        <SearchInput label="Search groups" placeholder="Search groups…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
      </div>

      {content}

      <Modal
        open={modalOpen}
        title={editingGroup ? 'Edit group' : 'Create group'}
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" form="user-group-form" size="sm" loading={groupMutation.isPending}>
              {editingGroup ? 'Save changes' : 'Create group'}
            </Button>
          </>
        }
      >
        <form id="user-group-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          <Field label="Group name" required error={errors.name}>
            {(p) => <input {...p} className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />}
          </Field>
          <Field label="Description" error={errors.description}>
            {(p) => <textarea {...p} rows={3} className={inputClass} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />}
          </Field>
          <Field label="Colour" error={errors.color} hint="Hex colour used for badges.">
            {(p) => (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Pick colour"
                  value={HEX.test(formData.color) ? formData.color : '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-12 flex-none cursor-pointer rounded-lg border border-slate-300"
                />
                <input {...p} className={inputClass} value={formData.color} placeholder="#3B82F6" onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
            )}
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
            Active group
          </label>
        </form>
      </Modal>

      <Modal
        open={membersGroupId !== null}
        size="lg"
        title={selectedGroup?.name ? `${selectedGroup.name} members` : 'Group members'}
        onClose={() => setMembersGroupId(null)}
      >
        {groupDetailQuery.isLoading ? (
          <LoadingState label="Loading members…" />
        ) : groupDetailQuery.isError ? (
          <ErrorState title="Could not load members" message={apiErrorMessage(groupDetailQuery.error)} onRetry={() => groupDetailQuery.refetch()} />
        ) : (
          <div className="space-y-6">
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (memberToAdd && membersGroupId !== null) addMemberMutation.mutate({ groupId: membersGroupId, userId: Number(memberToAdd) });
              }}
            >
              <div className="flex-1">
                <Field label="Add member" hint={usersQuery.isError ? 'Users could not be loaded.' : undefined}>
                  {(p) => (
                    <select {...p} className={inputClass} value={memberToAdd} onChange={(e) => setMemberToAdd(e.target.value)} disabled={usersQuery.isLoading}>
                      <option value="">{usersQuery.isLoading ? 'Loading users…' : 'Select a user…'}</option>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>
              <Button type="submit" size="sm" disabled={!memberToAdd} loading={addMemberMutation.isPending} leftIcon={<Plus className="h-4 w-4" />}>
                Add
              </Button>
            </form>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Current members ({members.length})</h3>
              {members.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No members yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {members.map((member) => (
                    <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{member.name}</p>
                        <p className="truncate text-sm text-slate-500">{member.email}</p>
                        <p className="text-xs text-slate-400">
                          {member.role ? `${member.role} · ` : ''}Joined {formatDate(member.pivot?.joined_at)}
                        </p>
                      </div>
                      <IconButton
                        label={`Remove ${member.name} from group`}
                        icon={UserMinus}
                        tone="danger"
                        disabled={removeMemberMutation.isPending}
                        onClick={() => handleRemoveMember(member)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
