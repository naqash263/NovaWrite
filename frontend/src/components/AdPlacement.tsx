import AdSense from './AdSense';

interface AdPlacementProps {
  position: 'header' | 'sidebar' | 'content-top' | 'content-middle' | 'content-bottom' | 'footer' | 'between-posts';
  className?: string;
}

/**
 * Pre-configured AdSense placements with optimal positioning
 */
export default function AdPlacement({ position, className = '' }: AdPlacementProps) {
  // Get ad slots from environment or use defaults
  // You'll replace these with your actual ad slot IDs from Google AdSense
  const AD_SLOTS = {
    header: import.meta.env.VITE_ADSENSE_SLOT_HEADER || 'HEADER_SLOT_ID',
    sidebar: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR || 'SIDEBAR_SLOT_ID',
    'content-top': import.meta.env.VITE_ADSENSE_SLOT_CONTENT_TOP || 'CONTENT_TOP_SLOT_ID',
    'content-middle': import.meta.env.VITE_ADSENSE_SLOT_CONTENT_MIDDLE || 'CONTENT_MIDDLE_SLOT_ID',
    'content-bottom': import.meta.env.VITE_ADSENSE_SLOT_CONTENT_BOTTOM || 'CONTENT_BOTTOM_SLOT_ID',
    footer: import.meta.env.VITE_ADSENSE_SLOT_FOOTER || 'FOOTER_SLOT_ID',
    'between-posts': import.meta.env.VITE_ADSENSE_SLOT_BETWEEN_POSTS || 'BETWEEN_POSTS_SLOT_ID'
  };

  const adSlot = AD_SLOTS[position];

  // Different ad formats for different positions
  const getAdConfig = () => {
    switch (position) {
      case 'sidebar':
        return {
          adFormat: 'vertical' as const,
          fullWidthResponsive: true,
          style: { minHeight: '600px' }
        };
      case 'header':
      case 'footer':
        return {
          adFormat: 'horizontal' as const,
          fullWidthResponsive: true,
          style: { minHeight: '90px' }
        };
      case 'between-posts':
        return {
          adFormat: 'rectangle' as const,
          fullWidthResponsive: true,
          style: { minHeight: '280px', margin: '20px 0' }
        };
      default:
        return {
          adFormat: 'auto' as const,
          fullWidthResponsive: true,
          style: {}
        };
    }
  };

  const config = getAdConfig();

  // Wrap in container with proper styling
  return (
    <div className={`ad-placement ad-placement-${position} ${className}`}>
      <AdSense
        adSlot={adSlot}
        adFormat={config.adFormat}
        fullWidthResponsive={config.fullWidthResponsive}
        style={config.style}
        className={className}
      />
    </div>
  );
}
