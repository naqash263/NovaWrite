import AdSense from './AdSense';
import { useAdSenseSettings } from '../hooks/useAdSenseSettings';

interface AdPlacementProps {
  position: 'header' | 'sidebar' | 'content-top' | 'content-middle' | 'content-bottom' | 'footer' | 'between-posts';
  className?: string;
}

/**
 * Pre-configured AdSense placements with optimal positioning
 */
export default function AdPlacement({ position, className = '' }: AdPlacementProps) {
  const { isEnabled, getSlot } = useAdSenseSettings();

  // Map position to setting key
  const settingKeyMap: Record<string, string> = {
    header: 'slot_header',
    sidebar: 'slot_sidebar',
    'content-top': 'slot_content_top',
    'content-middle': 'slot_content_middle',
    'content-bottom': 'slot_content_bottom',
    footer: 'slot_footer',
    'between-posts': 'slot_between_posts',
  };

  const adSlot = getSlot(settingKeyMap[position]);

  // Don't render if AdSense is disabled or no slot ID
  if (!isEnabled || !adSlot) {
    return null;
  }

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
        dataAdClient={getSlot('client_id')}
      />
    </div>
  );
}
