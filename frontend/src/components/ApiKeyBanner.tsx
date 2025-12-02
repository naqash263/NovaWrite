import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function ApiKeyBanner() {
  const { isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Collapsed view (main message)
  const collapsedView = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div className="text-2xl flex-shrink-0">🔑</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">
            {isAuthenticated 
              ? 'Get Unlimited AI Access - Add Your Gemini API Key' 
              : 'Get Unlimited AI Access - Create Account & Add Your API Key'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isAuthenticated
              ? 'Add your Gemini API key for non-stop access to all AI tools (no rate limits)'
              : 'Create a free account and add your Gemini API key to get non-stop access to all AI tools'}
          </p>
        </div>
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-4 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex-shrink-0"
      >
        {isExpanded ? (
          <>
            <span className="hidden sm:inline">Hide Details</span>
            <span className="sm:hidden">Hide</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Show Steps</span>
            <span className="sm:hidden">Show</span>
          </>
        )}
      </button>
    </div>
  );

  // Expanded view (full details)
  const expandedView = (
    <div className="mt-4 pt-4 border-t border-blue-200 space-y-4">
      {!isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>1️⃣</span> Create Free Account
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              Sign up for a free account to start using AI tools with your own API key.
            </p>
            <Link
              to="/register"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Account →
            </Link>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>2️⃣</span> Get Gemini API Key
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              Get your free API key from Google AI Studio (takes 2 minutes).
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Get API Key →
            </a>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <h4 className="font-semibold text-gray-900 mb-3">
          {isAuthenticated ? 'Step 1:' : 'Step 3:'} Get Your Free Gemini API Key
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Google AI Studio</a></li>
          <li>Sign in with your Google account</li>
          <li>Click "Create API Key" or "Get API Key"</li>
          <li>Copy your API key (starts with "AIza...")</li>
        </ol>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get API Key →
        </a>
      </div>

      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <h4 className="font-semibold text-gray-900 mb-3">
          {isAuthenticated ? 'Step 2:' : 'Step 4:'} Add Your API Key
        </h4>
        <p className="text-sm text-gray-700 mb-3">
          {isAuthenticated 
            ? 'Click the "Add API Key" button in the API Stats section above, then paste your API key.'
            : 'After creating your account and logging in, click "Add API Key" button and paste your key.'}
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Your API key is encrypted and stored securely</li>
          <li>Get 100 daily requests (resets every 24 hours)</li>
          <li>Unlimited access when using your own key</li>
          <li>Your key is only used for your account</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2">✨ Benefits of Adding Your API Key</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
          <li><strong>Non-stop access:</strong> No rate limits when using your own key</li>
          <li><strong>Faster processing:</strong> Dedicated resources for your requests</li>
          <li><strong>100 daily requests:</strong> Free tier with daily reset</li>
          <li><strong>Secure:</strong> Your key is encrypted and never shared</li>
          <li><strong>Free forever:</strong> Google's Gemini API has a generous free tier (60 requests/minute)</li>
        </ul>
      </div>

      {!isAuthenticated && (
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/register"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Free Account
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Already have an account? Login
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      {collapsedView}
      {isExpanded && expandedView}
    </div>
  );
}

