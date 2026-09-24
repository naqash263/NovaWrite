import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useSEO } from '../utils/seo';
import { inputClass } from '../components/admin/ui';
import { apiErrorMessage } from '../components/admin/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, logout, user, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const target = from && from.startsWith('/admin') && from !== '/admin/login' ? from : '/admin';

  useSEO({
    title: 'Admin Login | Naqash Thaheem',
    description: 'Sign in to the Naqash Thaheem site administration area. This page is for site administrators only and is not intended for public use.',
    robots: 'noindex, nofollow',
  });

  if (!loading && user?.role === 'admin') return <Navigate to={target} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(email.trim(), password);
      if (data?.user?.role !== 'admin') {
        logout();
        setError('This account does not have administrator access.');
        return;
      }
      navigate(target, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Sign-in failed. Check your email and password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Naqash Thaheem site administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="text-slate-500 hover:text-slate-900">
              Forgot password?
            </Link>
            <Link to="/" className="text-slate-500 hover:text-slate-900">
              Back to site
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
