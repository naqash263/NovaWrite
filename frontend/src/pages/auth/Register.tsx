import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLoginButton } from '../../components/GoogleLoginButton';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const navigate = useNavigate();

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

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setResendMessage('');
    setError('');

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/resend-verification`, {
        email: verificationEmail,
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
    // Show success popup for all users - no automatic redirects
    setSuccess(true);
    setVerificationEmail(user.email);
    setTimeout(() => {
      window.location.reload(); // Refresh to show user name
    }, 2000);
  };

  const handleGoogleError = (error: string) => {
    setError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      const { user, email_verification_required } = response.data;
      
      if (email_verification_required) {
        setSuccess(true);
        setVerificationEmail(email);
        setResendCooldown(60); // Start 60-second cooldown
        setError('');
      } else {
        // Legacy flow for backward compatibility
        const { token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.error ||
        'Registration failed. Please try again.';
      
      setError(errorMessage);
      
      // If it's an unverified user resend case, show success message
      if (err.response?.data?.resend_verification) {
        setSuccess(true);
        setVerificationEmail(email);
        setResendCooldown(60);
        setError(''); // Clear error since we're showing success
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Join to access free workflows and premium resources</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-green-800">
                      Registration Successful!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>We've sent a verification email to <strong>{verificationEmail}</strong></p>
                      <p className="mt-1">Please check your email and click the verification link to activate your account.</p>
                    </div>
                    
                    {/* Resend Message */}
                    {resendMessage && (
                      <div className={`mt-3 text-sm ${resendMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                        {resendMessage}
                      </div>
                    )}
                    
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendCooldown > 0 || resendLoading}
                        className="text-sm font-medium text-green-800 hover:text-green-600 underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {resendLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                            Sending...
                          </>
                        ) : resendCooldown > 0 ? (
                          `Resend in ${resendCooldown}s`
                        ) : (
                          'Resend Verification Email'
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-sm font-medium text-green-800 hover:text-green-600 underline"
                      >
                        Go to Login
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            <div>
              <label htmlFor="passwordConfirmation" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
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
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Login
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
