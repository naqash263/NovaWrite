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
  
  // Use real values if available (when admin activates), otherwise use test values for dev testing
  const displaySlot = adSlot || (isDevelopment ? `TEST-${position.toUpperCase()}` : '');
  const displayClientId = clientId || (isDevelopment ? 'ca-pub-TEST' : '');
  
  // Determine if we should show the ad
  // In dev: always show (for testing)
  // In production: show if enabled AND has valid client ID AND has slot ID
  const hasValidClientId = displayClientId && displayClientId !== '' && displayClientId !== 'ca-pub-YOUR_PUBLISHER_ID' && displayClientId !== 'ca-pub-TEST';
  const hasValidSlotId = displaySlot && displaySlot !== '' && !displaySlot.startsWith('TEST-');
  
  const shouldShow = isDevelopment || (isEnabled && hasValidClientId && hasValidSlotId);
  
  // In production, don't render if not enabled or missing required config
  // But log the reason for debugging
  if (!isDevelopment && (!isEnabled || !hasValidClientId || !hasValidSlotId)) {
    // Log why ads aren't showing in production
    if (!isEnabled) {
      console.warn(`[AdPlacement:${position}] AdSense is disabled in admin settings. enabled=${settings.enabled}, isEnabled=${isEnabled}`);
    } else if (!hasValidClientId) {
      console.warn(`[AdPlacement:${position}] Missing or invalid Client ID. clientId="${clientId}", displayClientId="${displayClientId}"`);
    } else if (!hasValidSlotId) {
      console.warn(`[AdPlacement:${position}] Missing or invalid Slot ID. adSlot="${adSlot}", displaySlot="${displaySlot}"`);
    }
    return null;
  }
  
  // Log successful rendering
  if (import.meta.env.DEV || (isEnabled && hasValidClientId && hasValidSlotId)) {
    console.log(`[AdPlacement:${position}] Rendering ad:`, {
      isEnabled,
      hasValidClientId,
      hasValidSlotId,
      displaySlot,
      displayClientId: displayClientId ? `${displayClientId.substring(0, 15)}...` : 'none',
    });
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
