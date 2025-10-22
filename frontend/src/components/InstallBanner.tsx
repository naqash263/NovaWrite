import React, { useEffect, useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const InstallBanner: React.FC = () => {
  const { showBanner, promptInstall, dismissPrompt } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showBanner) {
      // Small delay to ensure smooth animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [showBanner]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-start space-x-3">
              {/* App Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5">
                  <img 
                    src="/pwa-192x192.svg" 
                    alt="Naqash Thaheem Portfolio" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold">Install App</h3>
                <p className="text-xs text-blue-100 mt-0.5 leading-tight">
                  AI-powered career tools, faster loading, offline access
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={dismissPrompt}
                className="text-blue-200 hover:text-white transition-colors p-1 flex-shrink-0"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={dismissPrompt}
                className="flex-1 text-blue-200 hover:text-white transition-colors text-sm py-2 px-3 rounded-lg border border-blue-400/30"
              >
                Not now
              </button>
              <button
                onClick={promptInstall}
                className="flex-1 bg-white text-blue-600 py-2 px-3 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
              >
                Install
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* App Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2">
                    <img 
                      src="/pwa-192x192.svg" 
                      alt="Naqash Thaheem Portfolio" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Install App</h3>
                  <p className="text-sm text-blue-100">
                    Get instant access to AI-powered career tools, faster loading, and work offline
                  </p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-blue-200">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      CV Builder & Tools
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Push Notifications
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Faster Loading
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={dismissPrompt}
                  className="text-blue-200 hover:text-white transition-colors text-sm"
                >
                  Not now
                </button>
                <button
                  onClick={promptInstall}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
                >
                  Install
                </button>
                <button
                  onClick={dismissPrompt}
                  className="text-blue-200 hover:text-white transition-colors p-1"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
