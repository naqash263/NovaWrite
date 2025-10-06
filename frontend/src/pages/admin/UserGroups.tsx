import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import { Button, Input, Textarea, Select } from '../../components/ui';

interface UserGroup {
  id: number;
  name: string;
  description?: string;
  color: string;
  default_permissions?: string[];
  is_active: boolean;
  members_count: number;
  created_at: string;
  members?: GroupMember[];
}

interface GroupMember {
  id: number;
  name: string;
  email: string;
  role: string;
  pivot: {
    added_by: number;
    joined_at: string;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function UserGroups() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true
  });

  const queryClient = useQueryClient();

  // Fetch user groups
  const { data: groups, isLoading } = useQuery({
    queryKey: ['admin-user-groups', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      const response = await apiClient.get(`/admin/user-groups?${params.toString()}`);
      return response.data;
    }
  });

  // Fetch all users for member selection
  const { data: users } = useQuery({
    queryKey: ['admin-users-for-groups'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users');
      return response.data;
    }
  });

  // Create/Update group mutation
  const groupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      if (editingGroup) {
        const response = await apiClient.put(`/admin/user-groups/${editingGroup.id}`, groupData);
        return response.data;
      } else {
        const response = await apiClient.post('/admin/user-groups', groupData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-groups'] });
      setShowModal(false);
      setEditingGroup(null);
      resetForm();
    }
  });

  // Delete group mutation
  const deleteMutation = useMutation({
    mutationFn: async (groupId: number) => {
      await apiClient.delete(`/admin/user-groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-groups'] });
    }
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }) => {
      const response = await apiClient.post(`/admin/user-groups/${groupId}/members`, { user_id: userId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-groups'] });
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-group', selectedGroup.id] });
      }
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }) => {
      await apiClient.delete(`/admin/user-groups/${groupId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-groups'] });
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-group', selectedGroup.id] });
      }
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      is_active: true
    });
  };

  const handleEdit = (group: UserGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color,
      is_active: group.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    groupMutation.mutate(formData);
  };

  const handleDelete = (group: UserGroup) => {
    if (confirm(`Are you sure you want to delete the group "${group.name}"? This will remove all members from the group.`)) {
      deleteMutation.mutate(group.id);
    }
  };

  const showMembers = async (group: UserGroup) => {
    setSelectedGroup(group);
    // Fetch detailed group info with members
    try {
      const response = await apiClient.get(`/admin/user-groups/${group.id}`);
      setSelectedGroup(response.data);
      setShowMembersModal(true);
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const filteredUsers = users?.filter((user: User) => 
    !selectedGroup?.members?.some(member => member.id === user.id)
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Groups & Access Control</h1>
          <p className="text-gray-600">Manage user groups and permissions</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          Create Group
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          type="text"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups?.map((group: UserGroup) => (
          <div key={group.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: group.color }}
                ></div>
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(group)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(group)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {group.description && (
              <p className="text-gray-600 text-sm mb-4">{group.description}</p>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {group.members_count} member{group.members_count !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  group.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {group.is_active ? 'Active' : 'Inactive'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showMembers(group)}
                >
                  View Members
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingGroup ? 'Edit Group' : 'Create Group'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Group Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded-md"
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active Group
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingGroup(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={groupMutation.isPending}
                >
                  {groupMutation.isPending ? 'Saving...' : editingGroup ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedGroup.name} Members
                </h2>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Add Member Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Member</h3>
                <div className="flex space-x-3">
                  <Select
                    placeholder="Select a user to add..."
                    options={filteredUsers.map((user: User) => ({
                      value: user.id,
                      label: `${user.name} (${user.email})`
                    }))}
                    onChange={(e) => {
                      const userId = parseInt(e.target.value);
                      if (userId) {
                        addMemberMutation.mutate({ groupId: selectedGroup.id, userId });
                      }
                    }}
                    value=""
                  />
                </div>
              </div>

              {/* Current Members */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Current Members ({selectedGroup.members?.length || 0})
                </h3>
                <div className="space-y-3">
                  {selectedGroup.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                        <div className="text-xs text-gray-400">
                          Role: {member.role} • Joined: {new Date(member.pivot.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate({ 
                          groupId: selectedGroup.id, 
                          userId: member.id 
                        })}
                        disabled={removeMemberMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No members yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}