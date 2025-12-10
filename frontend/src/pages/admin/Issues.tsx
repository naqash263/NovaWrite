import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';

interface Issue {
  id: number;
  title: string;
  slug: string;
  description: string;
  user_id?: number;
  guest_name?: string;
  guest_email?: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
    color?: string;
  };
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: number;
  assignee?: {
    id: number;
    name: string;
    email: string;
  };
  labels?: string[];
  views_count: number;
  upvotes_count: number;
  comments_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: number;
  resolver?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface IssueCategory {
  id: number;
  name: string;
  color?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Issues() {
  useSEO({ title: 'Manage Issues | Admin' });
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category_id: '',
    assigned_to: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: 'open' as Issue['status'],
    resolution_notes: '',
  });
  const [assignForm, setAssignForm] = useState({
    user_id: '',
    notes: '',
  });
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium' as Issue['priority'],
    labels: [] as string[],
  });
  const [labelInput, setLabelInput] = useState('');

  // Fetch issues
  const { data: issuesData, isLoading } = useQuery({
    queryKey: ['admin-issues', currentPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
      });
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
      
      const response = await apiClient.get(`/issues?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<IssueCategory[]>({
    queryKey: ['issue-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/issue-categories');
      return response.data.data || [];
    },
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users');
      return response.data || [];
    },
    enabled: showAssignModal,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; status: string; resolution_notes?: string }) => {
      const response = await apiClient.post(`/issues/${id}/status`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issues'] });
      setShowStatusModal(false);
      setSelectedIssue(null);
    },
  });

  // Assign issue mutation
  const assignMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; user_id: number; notes?: string }) => {
      const response = await apiClient.post(`/issues/${id}/assign`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issues'] });
      setShowAssignModal(false);
      setSelectedIssue(null);
    },
  });

  // Update issue mutation
  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; title: string; description: string; category_id?: number; priority: string; labels?: string[] }) => {
      const response = await apiClient.put(`/issues/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issues'] });
      setShowEditModal(false);
      setSelectedIssue(null);
    },
  });

  // Delete issue mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/issues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issues'] });
    },
  });

  const handleUpdateStatus = (issue: Issue) => {
    setSelectedIssue(issue);
    setStatusForm({
      status: issue.status,
      resolution_notes: issue.resolution_notes || '',
    });
    setShowStatusModal(true);
  };

  const handleEdit = (issue: Issue) => {
    setSelectedIssue(issue);
    setEditForm({
      title: issue.title,
      description: issue.description,
      category_id: issue.category_id?.toString() || '',
      priority: issue.priority,
      labels: issue.labels || [],
    });
    setLabelInput('');
    setShowEditModal(true);
  };

  const handleAssign = (issue: Issue) => {
    setSelectedIssue(issue);
    setAssignForm({
      user_id: issue.assigned_to?.toString() || '',
      notes: '',
    });
    setShowAssignModal(true);
  };

  const addLabel = () => {
    if (labelInput.trim() && !editForm.labels.includes(labelInput.trim())) {
      setEditForm({
        ...editForm,
        labels: [...editForm.labels, labelInput.trim()],
      });
      setLabelInput('');
    }
  };

  const removeLabel = (label: string) => {
    setEditForm({
      ...editForm,
      labels: editForm.labels.filter(l => l !== label),
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: Issue['status']) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      duplicate: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority: Issue['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.medium;
  };

  const issues = issuesData?.data || [];
  const pagination = issuesData?.pagination || {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issue Management</h1>
          <p className="text-gray-600">Manage community issues and questions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search issues..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </div>
          <div>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <select
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={() => setFilters({ search: '', status: '', priority: '', category_id: '', assigned_to: '' })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No issues found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {issues.map((issue: Issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {issue.is_pinned && <span className="text-yellow-500 mr-1">📌</span>}
                            {issue.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            by {issue.user_id ? (issue.assignee?.name || 'User') : (issue.guest_name || 'Guest')}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(issue.priority)}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {issue.category ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {issue.category.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {issue.assignee ? (
                          <span className="text-sm text-gray-900">{issue.assignee.name}</span>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500">
                          <div>👁️ {issue.views_count}</div>
                          <div>👍 {issue.upvotes_count}</div>
                          <div>💬 {issue.comments_count}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(issue)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(issue)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Status
                          </button>
                          <button
                            onClick={() => handleAssign(issue)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => handleDelete(issue.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} issues
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Update Issue Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as Issue['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="duplicate">Duplicate</option>
                </select>
              </div>
              {(statusForm.status === 'resolved' || statusForm.status === 'closed') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes
                  </label>
                  <textarea
                    value={statusForm.resolution_notes}
                    onChange={(e) => setStatusForm({ ...statusForm, resolution_notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How was this issue resolved?"
                  />
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    updateStatusMutation.mutate({
                      id: selectedIssue.id,
                      status: statusForm.status,
                      resolution_notes: statusForm.resolution_notes || undefined,
                    });
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedIssue(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Assign Issue</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <select
                  value={assignForm.user_id}
                  onChange={(e) => setAssignForm({ ...assignForm, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassign</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add assignment notes..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (assignForm.user_id) {
                      assignMutation.mutate({
                        id: selectedIssue.id,
                        user_id: parseInt(assignForm.user_id),
                        notes: assignForm.notes || undefined,
                      });
                    }
                  }}
                  disabled={assignMutation.isPending || !assignForm.user_id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedIssue(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Issue</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={editForm.category_id}
                    onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Issue['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labels
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLabel();
                      }
                    }}
                    placeholder="Add a label and press Enter"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addLabel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                {editForm.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editForm.labels.map((label, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => removeLabel(label)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    updateIssueMutation.mutate({
                      id: selectedIssue.id,
                      title: editForm.title,
                      description: editForm.description,
                      category_id: editForm.category_id ? parseInt(editForm.category_id) : undefined,
                      priority: editForm.priority,
                      labels: editForm.labels.length > 0 ? editForm.labels : undefined,
                    });
                  }}
                  disabled={updateIssueMutation.isPending || !editForm.title.trim() || !editForm.description.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {updateIssueMutation.isPending ? 'Updating...' : 'Update Issue'}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedIssue(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

