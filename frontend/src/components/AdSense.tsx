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
      return;
    }

    // Load AdSense script only once
    if (!scriptLoaded.current && !window.adsbygoogle) {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-ad-client', dataAdClient);
      document.head.appendChild(script);
      scriptLoaded.current = true;
    }

    // Initialize ad after script loads
    const initializeAd = () => {
      if (adRef.current && window.adsbygoogle && !adRef.current.hasChildNodes()) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }
    };

    // Wait for script to load
    if (window.adsbygoogle) {
      initializeAd();
    } else {
      const checkInterval = setInterval(() => {
        if (window.adsbygoogle) {
          initializeAd();
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
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
