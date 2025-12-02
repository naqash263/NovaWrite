import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function ApiKeyBanner() {
  const { isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isAuthenticated) {
    // Show collapsed version for authenticated users
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔑</div>
            <div>
              <h3 className="font-semibold text-gray-900">Get Unlimited AI Access</h3>
              <p className="text-sm text-gray-600">Add your Gemini API key for non-stop access to all AI tools</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {isExpanded ? 'Hide Steps' : 'Show Steps'}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-3">Step 1: Get Your Free Gemini API Key</h4>
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
                <h4 className="font-semibold text-gray-900 mb-3">Step 2: Add Your API Key</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Click the "Add API Key" button in the API Stats section above, then paste your API key.
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
                  <li><strong>Free forever:</strong> Google's Gemini API has a generous free tier</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show full banner for non-authenticated users
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">🔑</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Get Unlimited AI Access - Create Account & Add Your API Key
          </h3>
          <p className="text-gray-700 mb-4">
            Create a free account and add your Gemini API key to get non-stop access to all AI tools. 
            No rate limits, faster processing, and 100 daily requests included!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-green-900 mb-2">✨ Why Add Your Own API Key?</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
              <li><strong>Non-stop access:</strong> No rate limits or waiting when using your own key</li>
              <li><strong>100 daily requests:</strong> Free tier with automatic daily reset</li>
              <li><strong>Faster processing:</strong> Dedicated resources for your requests</li>
              <li><strong>Secure & Private:</strong> Your API key is encrypted and only used for your account</li>
              <li><strong>Free forever:</strong> Google's Gemini API has a generous free tier (60 requests/minute)</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Quick Steps to Get Started:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li><strong>Create Account:</strong> <Link to="/register" className="text-blue-600 hover:underline font-medium">Sign up here</Link> (takes 30 seconds)</li>
              <li><strong>Get API Key:</strong> Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Google AI Studio</a>, sign in, and click "Create API Key"</li>
              <li><strong>Add Key:</strong> After logging in, click "Add API Key" button and paste your key</li>
              <li><strong>Start Using:</strong> Enjoy unlimited AI tool access with your own API key!</li>
            </ol>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
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
        </div>
      </div>
    </div>
  );
}

