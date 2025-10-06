import React, { useState } from 'react';
import apiClient from '../api/axios';

interface GoogleLoginButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      // Get the Google OAuth redirect URL
      const response = await apiClient.get('/auth/google/redirect');
      const { redirect_url } = response.data;

      // Open Google OAuth in a popup window
      const popup = window.open(
        redirect_url,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for the OAuth callback
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setLoading(false);
        }
      }, 1000);

      // Listen for messages from the popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          const { access_token, user } = event.data;
          
          // Store the token and user data
          localStorage.setItem('token', access_token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update API client with new token
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          
          popup.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setLoading(false);
          
          if (onSuccess) {
            onSuccess(user);
          }
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          popup.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setLoading(false);
          
          if (onError) {
            onError(event.data.error || 'Google login failed');
          }
        }
      };

      window.addEventListener('message', messageListener);

    } catch (error: any) {
      setLoading(false);
      if (onError) {
        onError(error.message || 'Failed to initialize Google login');
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-3"></div>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </>
      )}
    </button>
  );
};