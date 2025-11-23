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
  const { isEnabled, getSlot, settings, isLoading } = useAdSenseSettings();

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
  const clientId = getSlot('client_id');

  // Debug logging (only in development or if ads not showing)
  if (import.meta.env.DEV || (!isEnabled || !adSlot)) {
    console.log(`[AdPlacement:${position}]`, {
      isEnabled,
      isLoading,
      adSlot,
      clientId,
      hasClientId: !!clientId && clientId !== 'ca-pub-YOUR_PUBLISHER_ID',
      settings: settings,
    });
  }

  // In development mode, always show for layout testing
  const isDevelopment = import.meta.env.DEV;
  
  // In production, don't render if AdSense is disabled or no slot ID
  if (!isDevelopment && (!isEnabled || !adSlot)) {
    return null;
  }

  // Use real values if available (when admin activates), otherwise use test values for dev testing
  const displaySlot = adSlot || (isDevelopment ? `TEST-${position.toUpperCase()}` : '');
  const displayClientId = clientId || (isDevelopment ? 'ca-pub-TEST' : '');
  
  // Show in dev mode always, or in production if enabled with real config
  const shouldShow = isDevelopment || (isEnabled && adSlot);

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
  // Always show in dev mode, or if enabled in production
  if (!shouldShow) {
    return null;
  }

  return (
    <div className={`ad-placement ad-placement-${position} ${className}`}>
      <AdSense
        adSlot={displaySlot}
        adFormat={config.adFormat}
        fullWidthResponsive={config.fullWidthResponsive}
        style={config.style}
        className={className}
        dataAdClient={displayClientId}
      />
    </div>
  );
}
