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
    // Load AdSense if client ID is valid (works in both dev and production)
    const isProduction = import.meta.env.PROD;
    const hasClientId = dataAdClient && dataAdClient !== '' && dataAdClient !== 'ca-pub-YOUR_PUBLISHER_ID' && dataAdClient !== 'ca-pub-TEST';

    // Skip if no valid client ID
    if (!hasClientId || !dataAdClient) {
      console.log('[AdSense] Skipping ad load (no valid client ID):', { isProduction, hasClientId, dataAdClient });
      return;
    }

    console.log('[AdSense] Loading AdSense script:', { isProduction, hasClientId, dataAdClient, adSlot });

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
        return false;
      }

      // Check if ad is already initialized (has children or data-ad-status attribute)
      if (adRef.current.hasChildNodes() || adRef.current.getAttribute('data-ad-status')) {
        console.log('[AdSense] Ad already initialized');
        return true;
      }

      if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
        try {
          console.log('[AdSense] Initializing ad:', { adSlot, dataAdClient, adFormat });
          // Push empty object to initialize the ad (Google reads data attributes from ins element)
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          return true;
        } catch (e) {
          console.error('[AdSense] Error initializing ad:', e);
          return false;
        }
      } else {
        console.log('[AdSense] adsbygoogle not available yet');
        return false;
      }
    };

    // Wait for script to load and DOM to be ready
    const tryInitialize = () => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            if (!initializeAd()) {
              // Retry after a short delay if initialization failed
              setTimeout(tryInitialize, 500);
            }
          }, 200);
        });
      } else {
        setTimeout(() => {
          if (!initializeAd()) {
            // Retry after a short delay if initialization failed
            setTimeout(tryInitialize, 500);
          }
        }, 200);
      }
    };

    // Start initialization process
    if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
      tryInitialize();
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
          clearInterval(checkInterval);
          tryInitialize();
        }
      }, 100);

      // Cleanup after 15 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('[AdSense] Timeout waiting for script to load');
      }, 15000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [adSlot, dataAdClient]);

  // Determine if we should show real AdSense or test placeholder
  const isProduction = import.meta.env.PROD;
  const hasClientId = dataAdClient && dataAdClient !== '' && dataAdClient !== 'ca-pub-YOUR_PUBLISHER_ID' && dataAdClient !== 'ca-pub-TEST';
  const hasValidSlot = adSlot && adSlot !== '' && !adSlot.startsWith('TEST-');

  // Show real AdSense if we have valid client ID and slot (works in both dev and production)
  // Show test placeholder only if missing config or test values
  const shouldShowRealAd = hasClientId && hasValidSlot;

  // Show test placeholder if no valid config (or test values detected)
  if (!shouldShowRealAd) {
    // Return test ad placeholder for local testing
    const getTestAdSize = () => {
      switch (adFormat) {
        case 'vertical':
          return { width: '160px', height: '600px' };
        case 'horizontal':
          return { width: '728px', height: '90px' };
        case 'rectangle':
          return { width: '300px', height: '250px' };
        default:
          return { width: '320px', height: '100px' };
      }
    };

    const testSize = getTestAdSize();
    
    return (
      <div
        className={`adsense-container adsense-test-placeholder ${className}`}
        style={{
          minHeight: style?.minHeight || testSize.height,
          minWidth: style?.minWidth || testSize.width,
          display: 'block',
          border: '2px dashed #4285f4',
          backgroundColor: '#f0f7ff',
          borderRadius: '4px',
          padding: '10px',
          margin: '10px 0',
          textAlign: 'center',
          color: '#4285f4',
          fontSize: '12px',
          ...style
        }}
        title="Test Ad Placeholder (Development Mode)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: testSize.height }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>📢 Ad Placeholder</div>
          <div style={{ fontSize: '11px', opacity: 0.8 }}>Slot: {adSlot || 'N/A'}</div>
          <div style={{ fontSize: '11px', opacity: 0.8 }}>Format: {adFormat}</div>
          <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '8px' }}>
            {isProduction 
              ? 'This is a test ad. Configure AdSense in admin to show real ads.' 
              : 'Test placeholder. Activate AdSense in admin with real Client ID & Slot IDs to test real ads locally.'}
          </div>
        </div>
      </div>
    );
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
