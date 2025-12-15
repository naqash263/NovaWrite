import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useSEO } from '../../utils/seo';
import AdPlacement from '../../components/AdPlacement';

interface Issue {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
  priority: 'low' | 'medium' | 'high' | 'critical';
  upvotes_count: number;
  comments_count: number;
  views_count: number;
  is_upvoted?: boolean;
  is_pinned: boolean;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
  guest_name?: string;
  category?: {
    id: number;
    name: string;
    color: string;
  };
  assignee?: {
    id: number;
    name: string;
  };
  labels?: string[];
}

interface IssueCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
}

export default function Issues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category_id') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  useSEO({
    title: 'IT Community Forum - Ask Questions & Get Help | Naqash Thaheem',
    description: 'Join our IT community forum to ask technical questions, get programming help, discuss system administration, and connect with other IT professionals.',
    keywords: ['IT forum', 'programming help', 'technical support', 'IT community', 'tech questions', 'system administration', 'devops', 'cloud services'],
    url: '/community/issues'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
    fetchIssues();
  }, [search, statusFilter, priorityFilter, categoryFilter, sortBy]);

  useEffect(() => {
    fetchIssues();
  }, [currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/issue-categories');
      console.log('Categories API response:', response.data);
      
      // Handle different response formats
      if (response.data.success && response.data.data) {
        setCategories(response.data.data);
        console.log('Categories set:', response.data.data);
      } else if (Array.isArray(response.data)) {
        // Handle direct array response
        setCategories(response.data);
        console.log('Categories set (array):', response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
        console.log('Categories set (nested):', response.data.data);
      } else {
        console.warn('Unexpected categories response format:', response.data);
        setCategories([]);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      console.error('Error response:', error.response?.data);
      setCategories([]);
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        per_page: 15,
      };

      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category_id = categoryFilter;
      if (sortBy) {
        params.sort_by = sortBy;
        params.sort_order = 'desc';
      }
      params.page = currentPage;

      const response = await apiClient.get('/issues', { params });
      
      if (response.data.success) {
        setIssues(response.data.data || []);
        setPagination(response.data.pagination || pagination);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (issueId: number) => {
    try {
      const response = await apiClient.post(`/issues/${issueId}/upvote`);
      if (response.data.success) {
        // Update local state
        setIssues(issues.map(issue => 
          issue.id === issueId 
            ? { ...issue, is_upvoted: response.data.upvoted, upvotes_count: response.data.upvotes_count }
            : issue
        ));
      }
    } catch (error) {
      console.error('Error toggling upvote:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-gray-100 text-gray-800',
      closed: 'bg-gray-200 text-gray-700',
      duplicate: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
                
                {/* Status Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                      setSearchParams(prev => {
                        if (e.target.value) prev.set('status', e.target.value);
                        else prev.delete('status');
                        prev.delete('page');
                        return prev;
                      });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setCurrentPage(1);
                      setSearchParams(prev => {
                        if (e.target.value) prev.set('priority', e.target.value);
                        else prev.delete('priority');
                        prev.delete('page');
                        return prev;
                      });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                    {categories.length === 0 && (
                      <span className="text-xs text-gray-500 ml-2">(Loading...)</span>
                    )}
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                      setSearchParams(prev => {
                        if (e.target.value) prev.set('category_id', e.target.value);
                        else prev.delete('category_id');
                        prev.delete('page');
                        return prev;
                      });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    disabled={categories.length === 0}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {cat.issues_count !== undefined && `(${cat.issues_count})`}
                      </option>
                    ))}
                  </select>
                  
                  {/* Category Pills for Quick Filter */}
                  {categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            const newValue = categoryFilter === String(cat.id) ? '' : String(cat.id);
                            setCategoryFilter(newValue);
                            setCurrentPage(1);
                            setSearchParams(prev => {
                              if (newValue) prev.set('category_id', newValue);
                              else prev.delete('category_id');
                              prev.delete('page');
                              return prev;
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                            categoryFilter === String(cat.id)
                              ? 'text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          style={categoryFilter === String(cat.id) ? { backgroundColor: cat.color } : {}}
                        >
                          <span>{cat.name}</span>
                          {cat.issues_count !== undefined && (
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                              categoryFilter === String(cat.id)
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {cat.issues_count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort By */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                      setSearchParams(prev => {
                        prev.set('sort_by', e.target.value);
                        prev.delete('page');
                        return prev;
                      });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="created_at">Newest</option>
                    <option value="upvotes_count">Most Upvoted</option>
                    <option value="comments_count">Most Comments</option>
                    <option value="priority">Priority</option>
                    <option value="updated_at">Recently Updated</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {(statusFilter || priorityFilter || categoryFilter || search) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter('');
                      setPriorityFilter('');
                      setCategoryFilter('');
                      setSearch('');
                      setSortBy('created_at');
                      setCurrentPage(1);
                      setSearchParams({});
                    }}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>

              <AdPlacement position="sidebar" />
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">IT Community Forum</h1>
                  <p className="text-gray-600 mt-2 text-sm sm:text-base">Ask technical questions, get programming help, and connect with IT professionals</p>
                  {/* Total Issues Count */}
                  {!loading && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{pagination.total}</span>
                      <span>total {pagination.total === 1 ? 'question' : 'questions'}</span>
                    </div>
                  )}
                </div>
                <Link to="/community/issues/create" className="flex-shrink-0">
                  <Button className="w-full sm:w-auto">Ask a Question</Button>
                </Link>
              </div>

              {/* Search */}
              <Input
                placeholder="Search issues..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                  setSearchParams(prev => {
                    if (e.target.value) prev.set('search', e.target.value);
                    else prev.delete('search');
                    prev.delete('page');
                    return prev;
                  });
                }}
                leftIcon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>

            {/* Ad: Content Top */}
            <AdPlacement position="content-top" className="mb-6" />

            {/* Issues List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : issues.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 mb-4">No questions found. Be the first to ask a question!</p>
                <Link to="/community/issues/create">
                  <Button>Ask a Question</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {issues.map((issue, index) => (
                  <React.Fragment key={issue.id}>
                    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {issue.is_pinned && (
                              <span className="text-yellow-500">📌</span>
                            )}
                            <Link to={`/community/issues/${issue.slug || issue.id}`}>
                              <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                                {issue.title}
                              </h3>
                            </Link>
                          </div>
                          
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {issue.description.replace(/<[^>]+>/g, '').substring(0, 200)}...
                          </p>

                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(issue.status)}`}>
                              {issue.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColor(issue.priority)}`}>
                              {issue.priority.toUpperCase()}
                            </span>
                            {issue.category && (
                              <span 
                                className="px-3 py-1 rounded-full text-sm font-semibold text-white shadow-sm"
                                style={{ backgroundColor: issue.category.color }}
                              >
                                {issue.category.name}
                              </span>
                            )}
                            {issue.labels && issue.labels.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {issue.labels.slice(0, 3).map((label, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                  >
                                    {label}
                                  </span>
                                ))}
                                {issue.labels.length > 3 && (
                                  <span className="text-xs text-gray-500">+{issue.labels.length - 3}</span>
                                )}
                              </div>
                            )}
                            <span className="text-sm text-gray-500">
                              by {issue.user?.name || issue.guest_name || 'Anonymous'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(issue.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 ml-4">
                          <button
                            onClick={() => handleUpvote(issue.id)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                              issue.is_upvoted
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <svg className="w-5 h-5" fill={issue.is_upvoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            <span>{issue.upvotes_count}</span>
                          </button>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{issue.comments_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ad: Between Issues - Show after every 5 issues */}
                    {(index + 1) % 5 === 0 && (index + 1) < issues.length && (
                      <div className="my-6">
                        <AdPlacement position="between-posts" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Ad: Content Bottom */}
            <AdPlacement position="content-bottom" className="mt-6" />

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    setCurrentPage(newPage);
                    setSearchParams(prev => {
                      prev.set('page', String(newPage));
                      return prev;
                    });
                  }}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = Math.min(pagination.last_page, currentPage + 1);
                    setCurrentPage(newPage);
                    setSearchParams(prev => {
                      prev.set('page', String(newPage));
                      return prev;
                    });
                  }}
                  disabled={currentPage === pagination.last_page}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

