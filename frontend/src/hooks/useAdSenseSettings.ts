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
  const isEnabled = settings.enabled === 'true';
  const hasClientId = settings.client_id && settings.client_id !== '' && settings.client_id !== 'ca-pub-YOUR_PUBLISHER_ID';

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
