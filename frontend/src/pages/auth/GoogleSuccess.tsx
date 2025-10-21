import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../api/axios';

const GoogleSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setTokenState } = useAuth();

  useEffect(() => {
    const handleGoogleSuccess = () => {
      try {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');

        if (!token || !userParam) {
          throw new Error('Missing authentication data');
        }

        const user = JSON.parse(userParam);

        // Store the token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Update auth context
        setUser(user);
        setTokenState(token);

        // Update API client with new token
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Show success message and redirect
        setTimeout(() => {
          navigate('/');
          window.location.reload(); // Refresh to update UI
        }, 1000);

      } catch (err: any) {
        console.error('Google OAuth success error:', err);
        setError(err.message || 'Authentication failed');
        setLoading(false);
      }
    };

    handleGoogleSuccess();
  }, [navigate, searchParams, setUser, setTokenState]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-600 border-t-transparent mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Google Sign In Successful!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we complete your authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Authentication Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleSuccess;
