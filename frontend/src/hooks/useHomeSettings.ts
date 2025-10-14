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
    // If setting has value, construct correct URL with port 8001
    if (setting.value) {
      return `http://localhost:8001/storage/${setting.value}`;
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

