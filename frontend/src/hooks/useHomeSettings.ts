import { useState, useEffect } from 'react';
import apiClient from '../api/axios';

interface HomeSetting {
  key: string;
  type: string;
  value: string;
  image_url?: string;
}

interface HomeSettings {
  settings: HomeSetting[];
  grouped: {
    text: HomeSetting[];
    image: HomeSetting[];
    boolean: HomeSetting[];
  };
}

export function useHomeSettings() {
  const [homeSettings, setHomeSettings] = useState<HomeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeSettings();
  }, []);

  const fetchHomeSettings = async () => {
    try {
      const response = await apiClient.get('/home-settings');
      setHomeSettings(response.data);
    } catch (error) {
      console.error('Error fetching home settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get setting value
  const getSettingValue = (key: string, defaultValue: string = '') => {
    if (!homeSettings) return defaultValue;
    const setting = homeSettings.settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  // Helper function to check boolean setting
  const getBooleanSetting = (key: string, defaultValue: boolean = false) => {
    if (!homeSettings) return defaultValue;
    const setting = homeSettings.settings.find(s => s.key === key);
    return setting ? setting.value === '1' : defaultValue;
  };

  // Helper function to get image URL
  const getImageUrl = (key: string, defaultValue: string = '') => {
    if (!homeSettings) return defaultValue;
    const setting = homeSettings.settings.find(s => s.key === key);
    if (!setting || setting.type !== 'image') return defaultValue;
    
    // Use image_url from API if available (backend generates correct URL)
    if (setting.image_url) {
      return setting.image_url;
    }
    
    // Fallback: construct URL using environment variable
    if (setting.value) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      // Remove /api from base URL if present
      const storageBaseUrl = baseUrl.replace('/api', '');
      return `${storageBaseUrl}/api/storage/${setting.value}`;
    }
    
    return defaultValue;
  };

  return {
    homeSettings,
    loading,
    getSettingValue,
    getBooleanSetting,
    getImageUrl,
  };
}

