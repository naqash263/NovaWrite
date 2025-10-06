import React, { useEffect } from 'react';

// Type declarations for performance APIs
declare global {
  interface Window {
    tinymce?: any;
  }
}

interface FIDEntry extends PerformanceEntry {
  processingStart: number;
}

interface CLSEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

// Preload critical resources
const preloadCriticalResources = () => {
  // Preload critical CSS
  const criticalStyles = [
    '/src/index.css'
  ];

  criticalStyles.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  });

  // Preload critical fonts
  const criticalFonts = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  ];

  criticalFonts.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
    
    // Also add the actual stylesheet
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = href;
    styleLink.media = 'print';
    styleLink.onload = function() { 
      if (styleLink.media) {
        styleLink.media = 'all'; 
      }
    };
    document.head.appendChild(styleLink);
  });
};

// Lazy load non-critical resources
const lazyLoadResources = () => {
  // Lazy load MD Editor when needed
  if (document.querySelector('[data-needs-editor]')) {
    import('@uiw/react-md-editor').catch(console.error);
  }

  // Preconnect to external domains
  const externalDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://www.google-analytics.com'
  ];

  externalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Add performance observer for monitoring
const addPerformanceMonitoring = () => {
  if ('PerformanceObserver' in window) {
    // Monitor Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('LCP:', entry.startTime);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Monitor First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as FIDEntry;
        console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Monitor Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let cls = 0;
      for (const entry of list.getEntries()) {
        const clsEntry = entry as CLSEntry;
        if (!clsEntry.hadRecentInput) {
          cls += clsEntry.value;
        }
      }
      console.log('CLS:', cls);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
};

// Service Worker registration for caching
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

export const PerformanceOptimizer: React.FC = () => {
  useEffect(() => {
    // Run performance optimizations
    preloadCriticalResources();
    lazyLoadResources();
    
    if (import.meta.env.DEV) {
      addPerformanceMonitoring();
    }
    
    registerServiceWorker();

    // Cleanup on unmount
    return () => {
      // Remove performance observers if needed
      if ('PerformanceObserver' in window) {
        // Observers will be garbage collected
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

// Image optimization component
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDYwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo='
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  useEffect(() => {
    if (priority) {
      // Preload high-priority images
      const img = new Image();
      img.src = src;
    }
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {!isLoaded && (
        <img
          src={placeholder}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${className}`}
          style={{ width, height }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
};