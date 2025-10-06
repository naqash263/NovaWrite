import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../api/axios';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(error);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Send the authorization code to our backend
        const response = await apiClient.post('/auth/google/callback', { code });
        const { access_token, user } = response.data;

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_OAUTH_SUCCESS',
            access_token,
            user
          }, window.location.origin);
          
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          
          // Close the popup after a short delay
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          // If not in popup, redirect manually
          localStorage.setItem('token', access_token);
          localStorage.setItem('user', JSON.stringify(user));
          
          if (user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/courses';
          }
        }

      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: error.message || 'Authentication failed'
          }, window.location.origin);
          
          // Close the popup after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authenticating...</h2>
              <p className="text-gray-600">Please wait while we process your Google login.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => window.close()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close Window
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}