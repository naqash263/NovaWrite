import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import apiClient from '../api/axios';
import { updateAdSenseMetaTag } from '../utils/adsenseMeta';

interface AdSenseSettings {
  client_id?: string;
  slot_header?: string;
  slot_sidebar?: string;
  slot_content_top?: string;
  slot_content_middle?: string;
  slot_content_bottom?: string;
  slot_footer?: string;
  slot_between_posts?: string;
  enabled?: string;
}

export function useAdSenseSettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adsense-settings-active'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/adsense-settings/active');
        return response.data.data as AdSenseSettings;
      } catch (error) {
        // Return empty settings if API fails (site not approved yet, etc.)
        return {};
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const settings = data || {};
  // If enabled is explicitly 'false', disable ads. Otherwise, if we have client_id and slots, enable ads
  const enabledValue = settings.enabled;
  const hasClientId = settings.client_id && settings.client_id !== '' && settings.client_id !== 'ca-pub-YOUR_PUBLISHER_ID';
  const hasSlots = settings.slot_header || settings.slot_sidebar || settings.slot_content_top || settings.slot_content_middle || settings.slot_content_bottom || settings.slot_footer || settings.slot_between_posts;
  
  // Enable ads if:
  // 1. enabled is explicitly 'true', OR
  // 2. enabled is missing/undefined but we have client_id and at least one slot (backward compatibility)
  const isEnabled = enabledValue === 'true' || (enabledValue === undefined && hasClientId && hasSlots);

  // Debug logging (only in development or if ads not showing)
  useEffect(() => {
    if (import.meta.env.DEV || !isEnabled || !hasClientId) {
      console.log('[useAdSenseSettings] Settings loaded:', {
        enabled: settings.enabled,
        isEnabled,
        hasClientId,
        clientId: settings.client_id,
        slots: {
          header: settings.slot_header,
          sidebar: settings.slot_sidebar,
          content_top: settings.slot_content_top,
        },
        allSettings: settings,
      });
    }
  }, [settings, isEnabled, hasClientId]);

  // Update AdSense meta tag when settings are loaded
  useEffect(() => {
    if (settings.client_id && hasClientId) {
      updateAdSenseMetaTag(settings.client_id);
    }
  }, [settings.client_id, hasClientId]);

  return {
    settings,
    isLoading,
    error,
    isEnabled: isEnabled && hasClientId,
    getSlot: (key: string) => settings[key as keyof AdSenseSettings] || '',
  };
}
