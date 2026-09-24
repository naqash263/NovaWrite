import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AI_STUDIO_URL = 'https://aistudio.google.com/app/apikey';

/** Explains the shared AI quota and how to use your own Gemini API key. */
export default function ApiKeyBanner() {
  const { isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const panelId = useId();

  const steps = isAuthenticated
    ? [
        <>
          Open{' '}
          <a href={AI_STUDIO_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline">
            Google AI Studio
          </a>{' '}
          and sign in with your Google account.
        </>,
        <>Click “Create API key” and copy the key (it starts with “AIza”).</>,
        <>Click “Add API key” below and paste the key.</>,
      ]
    : [
        <>
          <Link to="/register" className="font-medium text-blue-700 underline">
            Create a free account
          </Link>{' '}
          or{' '}
          <Link to="/login" className="font-medium text-blue-700 underline">
            log in
          </Link>
          .
        </>,
        <>
          Open{' '}
          <a href={AI_STUDIO_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline">
            Google AI Studio
          </a>
          , sign in and click “Create API key”.
        </>,
        <>Back here, click “Add API key” and paste the key (it starts with “AIza”).</>,
      ];

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4" data-testid="api-key-banner">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex-shrink-0 text-xl" aria-hidden="true">
            🔑
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">Free AI requests use a shared, limited quota</h2>
            <p className="mt-1 text-sm text-gray-600">
              {isAuthenticated
                ? 'If the shared quota runs out, add your own free Gemini API key to keep using the AI tools.'
                : 'If the shared quota runs out, log in and add your own free Gemini API key to keep using the AI tools.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className="flex-shrink-0 self-start rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:self-center"
        >
          {isExpanded ? 'Hide steps' : 'Show steps'}
        </button>
      </div>

      {isExpanded && (
        <div id={panelId} className="mt-4 space-y-3 border-t border-blue-200 pt-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Your key is stored encrypted and is only used for requests you make while logged in.</li>
            <li>Requests made with your key count against your own Google Gemini quota and this site&apos;s per-key daily allowance.</li>
            <li>Google sets the free-tier limits for Gemini API keys and may change them.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
