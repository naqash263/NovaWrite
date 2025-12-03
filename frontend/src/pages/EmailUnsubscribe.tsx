import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import Button from '../components/ui/Button';
import { useSEO } from '../utils/seo';

export default function EmailUnsubscribe() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [unsubscribedTypes, setUnsubscribedTypes] = useState<string[]>([]);
  const [unsubscribeAll, setUnsubscribeAll] = useState(false);

  useSEO({
    title: 'Unsubscribe from Email Notifications | Naqash Thaheem',
    description: 'Manage your email notification preferences',
    url: '/email/unsubscribe'
  });

  useEffect(() => {
    if (token) {
      handleUnsubscribeByToken();
    }
  }, [token]);

  const handleUnsubscribeByToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const types = searchParams.getAll('types[]');
      const all = searchParams.get('all') === 'true';

      const response = await apiClient.get(`/email/unsubscribe/${token}`, {
        params: {
          types: types.length > 0 ? types : undefined,
          all: all || undefined,
        }
      });

      if (response.data.success) {
        setSuccess(true);
        setEmail(response.data.email);
        setUnsubscribedTypes(response.data.unsubscribed_types || []);
        setUnsubscribeAll(response.data.unsubscribed_all || false);
      }
    } catch (err: any) {
      console.error('Error unsubscribing:', err);
      setError(err.response?.data?.message || 'Failed to unsubscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualUnsubscribe = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/email/unsubscribe', {
        email: email.trim(),
        types: unsubscribedTypes,
        all: unsubscribeAll,
      });

      if (response.data.success) {
        setSuccess(true);
        setUnsubscribedTypes(response.data.unsubscribed_types || []);
        setUnsubscribeAll(response.data.unsubscribed_all || false);
      }
    } catch (err: any) {
      console.error('Error unsubscribing:', err);
      setError(err.response?.data?.message || 'Failed to unsubscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEmailTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'new_comment': 'New Comments',
      'comment_reply': 'Comment Replies',
      'issue_created': 'Issue Created',
      'issue_solved': 'Issue Solved',
      'issue_status_changed': 'Issue Status Updates',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Processing unsubscribe request...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Successfully Unsubscribed</h1>
          <p className="text-gray-600 mb-6">
            {email && `You have been unsubscribed from email notifications for ${email}.`}
            {!email && 'You have been successfully unsubscribed from email notifications.'}
          </p>
          
          {unsubscribeAll ? (
            <p className="text-sm text-gray-500 mb-6">You will no longer receive any email notifications.</p>
          ) : unsubscribedTypes.length > 0 ? (
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Unsubscribed from:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {unsubscribedTypes.map(type => (
                  <li key={type}>• {getEmailTypeLabel(type)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-3">
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSuccess(false);
                setEmail('');
                setError(null);
              }}
              className="w-full"
            >
              Manage Preferences
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Unsubscribe from Email Notifications</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!token && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Unsubscribe from:
              </label>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={unsubscribeAll}
                    onChange={(e) => {
                      setUnsubscribeAll(e.target.checked);
                      if (e.target.checked) {
                        setUnsubscribedTypes([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">All email notifications</span>
                </label>

                {!unsubscribeAll && (
                  <>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={unsubscribedTypes.includes('new_comment')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUnsubscribedTypes([...unsubscribedTypes, 'new_comment']);
                          } else {
                            setUnsubscribedTypes(unsubscribedTypes.filter(t => t !== 'new_comment'));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">New Comments</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={unsubscribedTypes.includes('comment_reply')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUnsubscribedTypes([...unsubscribedTypes, 'comment_reply']);
                          } else {
                            setUnsubscribedTypes(unsubscribedTypes.filter(t => t !== 'comment_reply'));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Comment Replies</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={unsubscribedTypes.includes('issue_created')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUnsubscribedTypes([...unsubscribedTypes, 'issue_created']);
                          } else {
                            setUnsubscribedTypes(unsubscribedTypes.filter(t => t !== 'issue_created'));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Issue Created</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={unsubscribedTypes.includes('issue_solved')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUnsubscribedTypes([...unsubscribedTypes, 'issue_solved']);
                          } else {
                            setUnsubscribedTypes(unsubscribedTypes.filter(t => t !== 'issue_solved'));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Issue Solved</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={unsubscribedTypes.includes('issue_status_changed')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUnsubscribedTypes([...unsubscribedTypes, 'issue_status_changed']);
                          } else {
                            setUnsubscribedTypes(unsubscribedTypes.filter(t => t !== 'issue_status_changed'));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Issue Status Updates</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            <Button 
              onClick={handleManualUnsubscribe}
              loading={loading}
              disabled={loading || (!unsubscribeAll && unsubscribedTypes.length === 0)}
              className="w-full"
            >
              Unsubscribe
            </Button>
          </div>
        )}

        {token && !success && (
          <div className="text-center">
            <p className="text-gray-600">Processing your unsubscribe request...</p>
          </div>
        )}
      </div>
    </div>
  );
}

