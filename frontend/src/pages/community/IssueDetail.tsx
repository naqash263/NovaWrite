import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import CommentSection from '../../components/comments/CommentSection';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
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
  labels?: string[];
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
  };
  guest_name?: string;
  guest_email?: string;
  category?: {
    id: number;
    name: string;
    color: string;
  };
  assignee?: {
    id: number;
    name: string;
  };
  resolver?: {
    id: number;
    name: string;
  };
}

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [solution, setSolution] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState<string | null>(null);

  useSEO({
    title: issue ? `${issue.title} - Community Issue | Naqash Thaheem` : 'Issue Detail',
    description: issue ? issue.description.replace(/<[^>]+>/g, '').substring(0, 160) : 'View issue details',
    url: `/community/issues/${id}`
  });

  useEffect(() => {
    if (id) {
      fetchIssue();
    }
  }, [id]);

  const fetchIssue = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/issues/${id}`);
      if (response.data.success) {
        setIssue(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!issue || upvoting) return;

    setUpvoting(true);
    try {
      const response = await apiClient.post(`/issues/${issue.id}/upvote`);
      if (response.data.success) {
        setIssue({
          ...issue,
          is_upvoted: response.data.upvoted,
          upvotes_count: response.data.upvotes_count
        });
      }
    } catch (error) {
      console.error('Error toggling upvote:', error);
    } finally {
      setUpvoting(false);
    }
  };

  const handleMarkAsSolved = async () => {
    if (!issue || !solution.trim() || solution.trim().length < 10) {
      setSolutionError('Solution must be at least 10 characters long');
      return;
    }

    // For guest-created issues, require email
    if (!isAuthenticated && issue?.guest_email && !guestEmail.trim()) {
      setSolutionError('Email is required to verify ownership');
      return;
    }

    setSubmittingSolution(true);
    setSolutionError(null);

    try {
      const payload: any = {
        solution: solution.trim()
      };

      // Include guest email if not authenticated and issue was created by guest
      if (!isAuthenticated && issue?.guest_email) {
        payload.guest_email = guestEmail.trim();
      }

      const response = await apiClient.post(`/issues/${issue.id}/mark-solved`, payload);

      if (response.data.success) {
        setIssue(response.data.data);
        setShowSolutionModal(false);
        setSolution('');
        setGuestEmail('');
      }
    } catch (error: any) {
      console.error('Error marking as solved:', error);
      setSolutionError(error.response?.data?.message || 'Failed to mark issue as solved');
    } finally {
      setSubmittingSolution(false);
    }
  };

  // Check if current user is the issue creator
  const isIssueCreator = (isAuthenticated && user && issue?.user?.id === user.id) || 
                         (!isAuthenticated && issue?.guest_email); // Guest can mark if they provide email

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Issue Not Found</h1>
          <p className="text-gray-600 mb-8">The issue you're looking for does not exist.</p>
          <Link to="/community/issues">
            <Button>Back to Issues</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-4">
              <AdPlacement position="sidebar" />
            </div>
          </aside>

          <div className="lg:col-span-3">
            {/* Breadcrumb */}
            <nav className="mb-6">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <Link to="/community/issues" className="hover:text-gray-900">
                    Issues
                  </Link>
                </li>
                <li>/</li>
                <li className="text-gray-900">{issue.title}</li>
              </ol>
            </nav>

            {/* Issue Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      {issue.is_pinned && (
                        <span className="text-yellow-500 text-xl">📌</span>
                      )}
                      <h1 className="text-3xl font-bold text-gray-900">{issue.title}</h1>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap mb-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                      {issue.category && (
                        <span 
                          className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                          style={{ backgroundColor: issue.category.color }}
                        >
                          {issue.category.name}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 mb-4">
                      Created by <span className="font-semibold">{issue.user?.name || issue.guest_name || 'Anonymous'}</span> on{' '}
                      {new Date(issue.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {issue.assignee && (
                        <> • Assigned to <span className="font-semibold">{issue.assignee.name}</span></>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={handleUpvote}
                      disabled={upvoting}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        issue.is_upvoted
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill={issue.is_upvoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span className="font-semibold">{issue.upvotes_count}</span>
                    </button>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{issue.comments_count} comments</span>
                    </div>
                  </div>
                </div>

                <AdPlacement position="content-top" className="my-6" />

                {/* Description */}
                <div className="prose max-w-none mb-6">
                  <div dangerouslySetInnerHTML={{ __html: issue.description }} />
                </div>

                {/* Labels */}
                {issue.labels && issue.labels.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Labels</h3>
                    <div className="flex flex-wrap gap-2">
                      {issue.labels.map((label, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mark as Solved Button - Only for issue creator when not resolved */}
                {isIssueCreator && issue.status !== 'resolved' && issue.status !== 'closed' && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Found a Solution?</h3>
                    <p className="text-blue-800 text-sm mb-4">
                      If you've found a solution to this issue, you can mark it as solved and share how you resolved it.
                    </p>
                    <Button onClick={() => setShowSolutionModal(true)}>
                      Mark as Solved
                    </Button>
                  </div>
                )}

                {/* Resolution Notes */}
                {issue.status === 'resolved' && issue.resolution_notes && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Solution</h3>
                    <p className="text-green-800 whitespace-pre-wrap">{issue.resolution_notes}</p>
                    {issue.resolver && (
                      <p className="text-sm text-green-700 mt-2">
                        Marked as solved by {issue.resolver.name} on {issue.resolved_at ? new Date(issue.resolved_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : ''}
                      </p>
                    )}
                  </div>
                )}

                <AdPlacement position="content-bottom" className="my-6" />
              </div>
            </div>

            {/* Ad: Before Comments */}
            <AdPlacement position="content-middle" className="my-6" />

            {/* Comments Section */}
            <CommentSection
              commentableType="Issue"
              commentableId={issue.id}
              title="Discussion"
              showTitle={true}
            />

            {/* Ad: After Comments */}
            <AdPlacement position="content-bottom" className="my-6" />

            {/* Back Button */}
            <div className="mt-8">
              <Link to="/community/issues">
                <Button variant="outline">
                  ← Back to All Issues
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Modal */}
      {showSolutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Mark Issue as Solved</h2>
                <button
                  onClick={() => {
                    setShowSolutionModal(false);
                    setSolution('');
                    setGuestEmail('');
                    setSolutionError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Please share how you solved this issue. This will help others who face the same problem.
              </p>

              {solutionError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {solutionError}
                </div>
              )}

              <Textarea
                label="Solution"
                value={solution}
                onChange={(e) => {
                  setSolution(e.target.value);
                  setSolutionError(null);
                }}
                placeholder="Describe how you solved this issue. Include steps, code snippets, or any relevant information that would help others."
                rows={8}
                minLength={10}
                maxLength={2000}
                disabled={submittingSolution}
                helperText={`${solution.length}/2000 characters (minimum 10)`}
              />

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSolutionModal(false);
                    setSolution('');
                    setGuestEmail('');
                    setSolutionError(null);
                  }}
                  disabled={submittingSolution}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkAsSolved}
                  loading={submittingSolution}
                  disabled={submittingSolution || solution.trim().length < 10 || (!isAuthenticated && issue?.guest_email ? !guestEmail.trim() : false)}
                >
                  Mark as Solved
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

