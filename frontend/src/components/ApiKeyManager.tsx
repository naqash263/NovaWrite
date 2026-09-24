import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/axios';
import { API_CONFIG } from '../config/api';

interface ApiStats {
  availableRequests: number;
  totalRequests: number;
}

const readStats = (data: unknown): ApiStats | null => {
  const d = data as { success?: boolean; data?: { available_requests?: unknown; total_requests?: unknown } } | null;
  if (!d?.success || !d.data) return null;
  const available = Number(d.data.available_requests);
  const total = Number(d.data.total_requests);
  if (!Number.isFinite(available) || !Number.isFinite(total)) return null;
  return { availableRequests: available, totalRequests: total };
};

/** Shows the remaining AI requests and lets logged-in users add their own Gemini API key. */
const ApiKeyManager: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  // null = unknown (not loaded or failed): nothing misleading is shown.
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const titleId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const loadApiStats = useCallback(async () => {
    try {
      let token: string | null = null;
      try {
        token = localStorage.getItem('token');
      } catch {
        token = null;
      }
      if (!token) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/cv-ai/stats`, { headers: { Accept: 'application/json' } });
        setApiStats(response.ok ? readStats(await response.json()) : null);
        return;
      }
      const response = await apiClient.get('/user-api-keys/stats');
      setApiStats(readStats(response.data));
    } catch {
      setApiStats(null);
    }
  }, []);

  useEffect(() => {
    void loadApiStats();
  }, [isAuthenticated, loadApiStats]);

  const closeModal = useCallback(() => {
    setShowApiKeyModal(false);
    setMessage(null);
  }, []);

  useEffect(() => {
    if (!showApiKeyModal) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showApiKeyModal, closeModal]);

  const handleAddApiKey = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const key = userApiKey.trim();
    if (!key) {
      setMessage({ text: 'Please paste your Gemini API key.', ok: false });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const response = await apiClient.post('/user-api-keys', { api_key: key, name: 'My API Key' });
      const result = response.data;
      if (result?.success) {
        setMessage({ text: 'API key added successfully.', ok: true });
        setUserApiKey('');
        setShowApiKeyModal(false);
        void loadApiStats();
      } else {
        setMessage({ text: result?.message || 'Failed to add the API key. Please try again.', ok: false });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ text: err.response?.data?.message || 'Failed to add the API key. Please try again.', ok: false });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex w-full flex-wrap items-center justify-between gap-2" data-testid="api-key-manager">
        <p className="text-xs text-gray-600 sm:text-sm">
          {apiStats ? (
            <>
              {isAuthenticated ? 'Your AI requests left today: ' : 'Shared AI requests left today: '}
              <span className={`font-semibold ${apiStats.availableRequests > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {apiStats.availableRequests.toLocaleString()}
              </span>
              {apiStats.totalRequests > 0 && <span className="text-gray-500"> of {apiStats.totalRequests.toLocaleString()}</span>}
            </>
          ) : isAuthenticated ? (
            'Add your own Gemini API key for a personal daily allowance.'
          ) : (
            'AI tools are free to use while the shared quota lasts.'
          )}
        </p>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setShowApiKeyModal(true)}
            className="inline-flex items-center whitespace-nowrap rounded-md border border-green-300 bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <span className="mr-1" aria-hidden="true">
              🔑
            </span>
            Add API key
          </button>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center whitespace-nowrap rounded-md border border-blue-300 bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="mr-1" aria-hidden="true">
              🔑
            </span>
            Log in to use your own key
          </Link>
        )}
      </div>

      {message?.ok && !showApiKeyModal && (
        <p className="mt-2 text-sm text-green-700" role="status">
          {message.text}
        </p>
      )}

      {showApiKeyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl">
            <form className="space-y-4 p-4 sm:p-6" onSubmit={handleAddApiKey}>
              <div className="flex items-center justify-between">
                <h2 id={titleId} className="text-base font-semibold text-gray-900 sm:text-lg">
                  Add your Gemini API key
                </h2>
                <button type="button" onClick={closeModal} aria-label="Close" className="rounded text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <ul className="list-disc space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-3 pl-7 text-xs text-blue-900 sm:text-sm">
                <li>Your key is stored encrypted and used only for AI requests you make while logged in.</li>
                <li>Requests then count against your own Gemini quota instead of the shared one.</li>
                <li>Text you submit is sent to Google Gemini to generate results.</li>
              </ul>

              <div>
                <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700">
                  Gemini API key
                </label>
                <input
                  ref={inputRef}
                  id={inputId}
                  type="password"
                  autoComplete="off"
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  placeholder="AIza…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-green-500 focus:ring-2 focus:ring-green-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get a free key from{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-medium text-green-700 underline">
                    Google AI Studio
                  </a>
                  : sign in, click “Create API key”, then copy and paste it here.
                </p>
              </div>

              {message && !message.ok && (
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {message.text}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !userApiKey.trim()}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 sm:w-auto"
                >
                  {isLoading ? 'Adding…' : 'Add API key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiKeyManager;
