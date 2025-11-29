import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (!tokenParam || !emailParam) {
      setError('Invalid or missing verification link.');
      return;
    }
    
    setToken(tokenParam);
    setEmail(emailParam);
    
    // Auto-verify if token and email are present
    handleVerification();
  }, [searchParams]);

  // Countdown timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [resendCooldown]);

  const handleVerification = async () => {
    if (!token || !email) return;
    
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL}`, {
        token: token,
        email: email,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        'Email verification failed. The link may have expired or is invalid.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setResendMessage('');
    setError('');

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION}`, {
        email: email,
      });

      setResendMessage(response.data.message);
      setResendCooldown(60); // Reset cooldown to 60 seconds
      
      // Show verification URL in development mode
      if (response.data.verification_url) {
        console.log('Verification URL:', response.data.verification_url);
        setResendMessage(prev => prev + '\n\nDevelopment Mode: Click this link to verify your email:\n' + response.data.verification_url);
      }
    } catch (err: any) {
      setResendMessage(
        err.response?.data?.message || 
        'Failed to resend verification email. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600">Your email has been successfully verified</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                You can now log in to your account and access all features.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                to="/login"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all inline-block"
              >
                Go to Login
              </Link>
              
              <Link
                to="/"
                className="block w-full text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Invalid Verification Link</h2>
            <p className="text-gray-600">This email verification link is invalid</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Please check your email for the correct verification link or request a new one.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                to="/login"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all inline-block"
              >
                Go to Login
              </Link>
              
              <Link
                to="/"
                className="block w-full text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
          <p className="text-gray-600">Verifying email for <strong>{email}</strong></p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {loading && (
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                  
                  {/* Resend functionality */}
                  <div className="mt-3">
                    {/* Resend Message */}
                    {resendMessage && (
                      <div className={`text-sm ${resendMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="whitespace-pre-line">{resendMessage}</div>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendCooldown > 0 || resendLoading}
                      className="text-sm font-medium text-red-800 hover:text-red-600 underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mt-2"
                    >
                      {resendLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                          Sending...
                        </>
                      ) : resendCooldown > 0 ? (
                        `Resend in ${resendCooldown}s`
                      ) : (
                        'Resend Verification Email'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-gray-700 mb-6">
              If verification failed, you can request a new verification email.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || resendLoading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>
              
              <Link
                to="/login"
                className="block w-full text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
