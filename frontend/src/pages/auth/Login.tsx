import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLoginButton } from '../../components/GoogleLoginButton';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  // Countdown timer effect
  useEffect(() => {
    let interval: number;
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

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setResendMessage('');
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/resend-verification`, {
        email: email,
      });

      setResendMessage(response.data.message);
      setResendCooldown(60); // Reset cooldown to 60 seconds
    } catch (err: any) {
      setResendMessage(
        err.response?.data?.message || 
        'Failed to resend verification email. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSuccess = (user: any) => {
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      // Show success popup for regular users
      setShowSuccess(true);
      setTimeout(() => {
        window.location.reload(); // Refresh to show user name
      }, 2000);
    }
  };

  const handleGoogleError = (error: string) => {
    setError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      const { user } = response;
      
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        // Show success popup for regular users
        setShowSuccess(true);
        setTimeout(() => {
          window.location.reload(); // Refresh to show user name
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      const isEmailNotVerified = err.response?.data?.email_verification_required;
      
      if (isEmailNotVerified) {
        setEmailNotVerified(true);
        setResendCooldown(60); // Start 60-second cooldown
        setError('Please verify your email address before logging in. Check your email for a verification link.');
      } else {
        setEmailNotVerified(false);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Login Successful!</h3>
            <p className="text-gray-600 mb-4">
              Welcome back! You can now enjoy our courses and workflows.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Refreshing page...</p>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Login to access courses and premium content</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-red-700">{error}</p>
                    
                    {/* Resend functionality for email verification */}
                    {emailNotVerified && (
                      <div className="mt-3">
                        {/* Resend Message */}
                        {resendMessage && (
                          <div className={`text-sm ${resendMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                            {resendMessage}
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
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Login Button */}
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            className="mb-6"
          />

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
