import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/axios';

interface ApiStats {
  availableRequests: number;
  totalRequests: number;
}

const ApiKeyManager: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [apiStats, setApiStats] = useState<ApiStats>({ availableRequests: 0, totalRequests: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load API stats on mount
  useEffect(() => {
    loadApiStats();
  }, [isAuthenticated]);

  const loadApiStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // User not logged in, use public stats
        const response = await fetch('/api/cv-ai/stats');
        const data = await response.json();
        if (data.success) {
          setApiStats({
            availableRequests: data.data.available_requests,
            totalRequests: data.data.total_requests
          });
        }
        return;
      }

      // User is logged in, try to get user-specific stats
      try {
        const response = await apiClient.get('/user-api-keys/stats');
        const data = response.data;
        if (data.success) {
          setApiStats({
            availableRequests: data.data.available_requests,
            totalRequests: data.data.total_requests
          });
        }
      } catch (authError) {
        // If user-specific stats fail, show default values (no API key added yet)
        console.warn('Failed to load user-specific API stats:', authError);
        setApiStats({
          availableRequests: 0,
          totalRequests: 0
        });
      }
    } catch (error) {
      console.error('Failed to load API stats:', error);
    }
  };

  const handleAddApiKey = async () => {
    if (!userApiKey.trim()) {
      setMessage('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await apiClient.post('/user-api-keys', {
        api_key: userApiKey,
        name: 'My API Key'
      });

      const result = response.data;

      if (result.success) {
        setMessage('API key added successfully!');
        setUserApiKey('');
        setShowApiKeyModal(false);
        loadApiStats(); // Refresh stats
      } else {
        setMessage(result.message || 'Failed to add API key');
      }
    } catch (error: any) {
      console.error('API key addition error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add API key. Please try again.';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* API Stats Display */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2 sm:gap-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <span className="text-gray-600 whitespace-nowrap">AI Requests:</span>
          <span className={`font-semibold whitespace-nowrap ${apiStats.availableRequests > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {apiStats.availableRequests}
          </span>
          <span className="text-gray-500 whitespace-nowrap">/ {apiStats.totalRequests || 100}</span>
          {!isAuthenticated && (
            <span className="text-xs text-gray-400 hidden sm:inline">(Public API)</span>
          )}
          {isAuthenticated && apiStats.totalRequests === 0 && (
            <span className="text-xs text-gray-400 hidden sm:inline">(Add API key for 100 daily requests)</span>
          )}
        </div>
        
        {isAuthenticated && (
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 active:bg-green-300 transition-colors duration-200 whitespace-nowrap"
          >
            <span className="mr-1">🔑</span>
            <span className="hidden xs:inline">Add API Key</span>
            <span className="xs:hidden">Add Key</span>
          </button>
        )}
        
        {!isAuthenticated && (
          <button
            onClick={() => window.location.href = '/login'}
            className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 active:bg-blue-300 transition-colors duration-200 whitespace-nowrap"
          >
            <span className="mr-1">🔑</span>
            <span className="hidden xs:inline">Login for More</span>
            <span className="xs:hidden">Login</span>
          </button>
        )}
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Add Your API Key</h3>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="text-gray-400 hover:text-gray-600 active:text-gray-800"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-green-900 mb-1.5 sm:mb-2 text-sm sm:text-base">🚀 100 Daily AI Requests</h4>
                  <ul className="text-xs sm:text-sm text-green-800 space-y-0.5 sm:space-y-1">
                    <li>• Get 100 AI requests per day (resets daily)</li>
                    <li>• Faster processing with dedicated resources</li>
                    <li>• Free CV processing and tailoring</li>
                    <li>• Your key is only used for your account</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-blue-900 mb-1.5 sm:mb-2 text-sm sm:text-base">🔒 Your Data is Secure</h4>
                  <ul className="text-xs sm:text-sm text-blue-800 space-y-0.5 sm:space-y-1">
                    <li>• All API keys are encrypted and stored securely</li>
                    <li>• Your data is processed locally and not stored</li>
                    <li>• We use enterprise-grade security measures</li>
                    <li>• Your information is never shared with third parties</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Google AI Studio</a>
                  </p>
                </div>

                {message && (
                  <div className={`p-2.5 sm:p-3 rounded-md text-xs sm:text-sm ${
                    message.includes('successfully') 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-3 sm:space-y-0">
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddApiKey}
                    disabled={isLoading || !userApiKey.trim()}
                    className={`w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ${
                      isLoading || !userApiKey.trim()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                    }`}
                  >
                    {isLoading ? 'Adding...' : 'Add API Key'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiKeyManager;
