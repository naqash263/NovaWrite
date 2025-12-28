import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

interface WorkflowDownloadModalProps {
  workflowFile: {
    id: number;
    name: string;
  };
  workflowName: string;
  isOpen: boolean;
  onClose: () => void;
  isPremium?: boolean;
}

export default function WorkflowDownloadModal({ 
  workflowFile, 
  workflowName, 
  isOpen, 
  onClose,
  isPremium = false
}: WorkflowDownloadModalProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [isOpen]);
  const [wantUpdates, setWantUpdates] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresAuth, setRequiresAuth] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For premium workflows, don't ask for email - user is already logged in
      const requestData: any = {
        workflow_file_id: workflowFile.id,
      };
      
      // Only include email and marketing_opt_in for normal (non-premium) workflows
      if (!isPremium) {
        requestData.email = email || undefined;
        requestData.marketing_opt_in = wantUpdates && email ? true : false;
      }

      const response = await apiClient.post('/workflow-downloads', requestData);

      const downloadUrl = response.data.download_url;
      
      window.location.href = downloadUrl;
      
      setTimeout(() => {
        onClose();
        setEmail('');
        setWantUpdates(null);
      }, 1000);
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.message || 'Failed to process download. Please try again.');
      if (errorData?.requires_auth) {
        setRequiresAuth(true);
        // Store current path for redirect after login
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        // Automatically redirect to login after 2 seconds
        setTimeout(() => {
          onClose();
          navigate('/login');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    // Store current path for redirect after login
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Download Workflow</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Download <strong>{workflowFile.name}</strong> from <strong>{workflowName}</strong>
        </p>

        {error && (
          <div className={`border px-4 py-3 rounded mb-4 ${
            requiresAuth 
              ? 'bg-purple-50 border-purple-200 text-purple-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="font-semibold mb-2">{error}</p>
            {requiresAuth && (
              <button
                onClick={handleLoginRedirect}
                className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
              >
                Login or Register
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* For premium workflows or logged-in users, skip email opt-in completely */}
          {!isPremium && !isLoggedIn && (
            <>
              {wantUpdates === null ? (
                <div className="mb-6">
                  <p className="text-gray-700 mb-4 font-medium">
                    Would you like to receive updates about new workflows and automation tips?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setWantUpdates(true)}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      disabled={loading}
                    >
                      Yes, I'd like updates
                    </button>
                    <button
                      type="button"
                      onClick={() => setWantUpdates(false)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                      disabled={loading}
                    >
                      No, just download
                    </button>
                  </div>
                </div>
              ) : wantUpdates ? (
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    We'll send you updates about new workflows and automation tips.
                  </p>
                </div>
              ) : null}
            </>
          )}

          <div className="flex gap-3">
            {!isPremium && !isLoggedIn && wantUpdates !== null && (
              <button
                type="button"
                onClick={() => {
                  setWantUpdates(null);
                  setEmail('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className={`${!isPremium && !isLoggedIn && wantUpdates !== null ? 'flex-1' : 'w-full'} px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
