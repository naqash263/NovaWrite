import React from 'react';

// Skeleton loading components for better perceived performance
export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className={`animate-pulse bg-gray-200 rounded h-4 ${
          i === lines - 1 ? 'w-3/4' : 'w-full'
        }`} 
      />
    ))}
  </div>
);

export const BlogPostSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <SkeletonBox className="w-full h-64 mb-8" />
    <SkeletonBox className="w-3/4 h-8 mb-4" />
    <SkeletonBox className="w-1/2 h-4 mb-8" />
    <SkeletonText lines={6} className="mb-6" />
    <SkeletonText lines={4} className="mb-6" />
    <SkeletonText lines={3} />
  </div>
);

export const BlogListSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
        <SkeletonBox className="w-full h-48" />
        <div className="p-6">
          <SkeletonBox className="w-full h-6 mb-3" />
          <SkeletonText lines={3} className="mb-4" />
          <SkeletonBox className="w-24 h-4" />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow">
          <SkeletonBox className="w-12 h-12 mb-4" />
          <SkeletonBox className="w-16 h-8 mb-2" />
          <SkeletonBox className="w-20 h-4" />
        </div>
      ))}
    </div>
    
    {/* Chart skeleton */}
    <div className="bg-white p-6 rounded-lg shadow">
      <SkeletonBox className="w-48 h-6 mb-4" />
      <SkeletonBox className="w-full h-64" />
    </div>
    
    {/* Table skeleton */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <SkeletonBox className="w-32 h-6 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <SkeletonBox className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <SkeletonBox className="w-32 h-4 mb-2" />
                <SkeletonBox className="w-48 h-3" />
              </div>
              <SkeletonBox className="w-16 h-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const WorkflowListSkeleton: React.FC = () => (
  <div className="space-y-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <SkeletonBox className="w-64 h-6 mb-2" />
            <SkeletonBox className="w-32 h-4 mb-3" />
          </div>
          <SkeletonBox className="w-20 h-8" />
        </div>
        <SkeletonText lines={2} className="mb-4" />
        <div className="flex items-center space-x-4">
          <SkeletonBox className="w-16 h-6" />
          <SkeletonBox className="w-16 h-6" />
          <SkeletonBox className="w-20 h-6" />
        </div>
      </div>
    ))}
  </div>
);

// Enhanced page loader with better UX
export const PageLoader: React.FC<{ 
  message?: string;
  showProgress?: boolean;
  fullPage?: boolean;
}> = ({ 
  message = 'Loading...', 
  showProgress = false,
  fullPage = true 
}) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!showProgress) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [showProgress]);

  const containerClass = fullPage 
    ? "min-h-screen flex items-center justify-center bg-gray-50" 
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClass}>
      <div className="text-center max-w-sm mx-auto">
        {/* Animated logo/spinner */}
        <div className="relative mb-6">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          {showProgress && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Loading message */}
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{message}</h2>
        <p className="text-gray-600 text-sm">Please wait while we load your content</p>
        
        {/* Progress bar */}
        {showProgress && (
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {/* Pulse animation for engagement */}
        <div className="flex justify-center mt-6 space-x-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Error boundary fallback with retry
export const ErrorFallback: React.FC<{ 
  error: Error; 
  resetError: () => void;
  message?: string;
}> = ({ error, resetError, message = "Something went wrong" }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="text-center max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-red-100 rounded-full">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{message}</h2>
      <p className="text-gray-600 mb-6">
        We apologize for the inconvenience. An unexpected error occurred while loading this page.
      </p>
      {import.meta.env.DEV && (
        <details className="text-left bg-gray-100 p-4 rounded-lg mb-6">
          <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
            Error Details
          </summary>
          <pre className="text-sm text-red-600 whitespace-pre-wrap">
            {error.message}
          </pre>
        </details>
      )}
      <div className="space-y-4">
        <button
          onClick={resetError}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  </div>
);