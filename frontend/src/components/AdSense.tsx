import { useEffect, useRef } from 'react';

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
  dataAdClient?: string; // Optional - will be fetched from API if not provided
}

/**
 * Google AdSense Component
 * 
 * Usage:
 * <AdSense 
 *   adSlot="1234567890"
 *   adFormat="auto"
 *   fullWidthResponsive={true}
 * />
 */
export default function AdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  style,
  className = '',
  dataAdClient
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Only load AdSense if not in development and client ID is set
    const isProduction = import.meta.env.PROD;
    const hasClientId = dataAdClient && dataAdClient !== '' && dataAdClient !== 'ca-pub-YOUR_PUBLISHER_ID';

    if (!isProduction || !hasClientId || !dataAdClient) {
      console.log('[AdSense] Skipping ad load:', { isProduction, hasClientId, dataAdClient });
      return;
    }

    // Load AdSense script only once globally
    if (!scriptLoaded.current && !window.adsbygoogle) {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(dataAdClient);
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-ad-client', dataAdClient);
      
      script.onload = () => {
        console.log('[AdSense] Script loaded successfully');
      };
      
      script.onerror = (error) => {
        console.error('[AdSense] Script failed to load:', error);
      };
      
      document.head.appendChild(script);
      scriptLoaded.current = true;
      window.adsbygoogle = window.adsbygoogle || [];
    }

    // Initialize ad after script loads and element is ready
    const initializeAd = () => {
      if (!adRef.current) {
        console.log('[AdSense] Ad ref not ready');
        return;
      }

      // Check if ad is already initialized (has children)
      if (adRef.current.hasChildNodes()) {
        console.log('[AdSense] Ad already initialized');
        return;
      }

      if (window.adsbygoogle) {
        try {
          console.log('[AdSense] Initializing ad:', { adSlot, dataAdClient });
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error('[AdSense] Error initializing ad:', e);
        }
      } else {
        console.log('[AdSense] adsbygoogle not available yet');
      }
    };

    // Wait for script to load
    if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
      // Small delay to ensure DOM is ready
      setTimeout(initializeAd, 100);
    } else {
      const checkInterval = setInterval(() => {
        if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
          initializeAd();
          clearInterval(checkInterval);
        }
      }, 100);

      // Cleanup after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('[AdSense] Timeout waiting for script to load');
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [adSlot, dataAdClient]);

  // Don't render in development or if no client ID
  const isProduction = import.meta.env.PROD;
  const hasClientId = dataAdClient && dataAdClient !== '' && dataAdClient !== 'ca-pub-YOUR_PUBLISHER_ID';

  if (!isProduction || !hasClientId || !dataAdClient) {
    return null;
  }

  return (
    <div
      className={`adsense-container ${className}`}
      style={{
        minHeight: '100px',
        minWidth: '320px',
        display: 'block',
        ...style
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          ...(fullWidthResponsive ? {} : { width: '100%' })
        }}
        data-ad-client={dataAdClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  );
}

// Declare global types for TypeScript
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
