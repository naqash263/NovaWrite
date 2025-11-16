import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import { useSEO } from '../../utils/seo';
import { useToast } from '../../hooks/use-toast';

interface AdSenseSetting {
  id: number;
  key: string;
  value: string;
  title: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdSenseSettings() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  useSEO({ title: 'AdSense Settings | Admin' });

  // Fetch settings
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['adsense-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/adsense-settings');
      return res.data;
    },
  });

  const settings = response?.data || [];

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (settingsToSave: AdSenseSetting[]) => {
      const res = await apiClient.post('/admin/adsense-settings', {
        settings: settingsToSave,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adsense-settings'] });
      queryClient.invalidateQueries({ queryKey: ['adsense-settings-active'] });
      addToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'AdSense settings saved successfully!',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save settings',
        duration: 5000,
      });
    },
  });

  // Reset to defaults mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/admin/adsense-settings/reset');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adsense-settings'] });
      queryClient.invalidateQueries({ queryKey: ['adsense-settings-active'] });
      addToast({
        type: 'success',
        title: 'Settings Reset',
        description: 'AdSense settings reset to defaults!',
        duration: 5000,
      });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (setting: AdSenseSetting) => {
      const res = await apiClient.post(
        `/admin/adsense-settings/${setting.id}/toggle-active`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adsense-settings'] });
      queryClient.invalidateQueries({ queryKey: ['adsense-settings-active'] });
    },
  });

  const [localSettings, setLocalSettings] = useState<AdSenseSetting[]>([]);

  useEffect(() => {
    if (settings.length > 0) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setLocalSettings((prev) =>
      prev.map((setting) =>
        setting.key === key ? { ...setting, value } : setting
      )
    );
  };

  const handleToggleActive = (setting: AdSenseSetting) => {
    toggleActiveMutation.mutate(setting);
  };

  const handleSave = () => {
    // Ensure settings with values are marked as active
    const settingsToSave = localSettings.map(setting => ({
      ...setting,
      // Mark as active if it has a value (except for 'enabled' which is controlled separately)
      is_active: setting.key === 'enabled' 
        ? setting.is_active 
        : (setting.value && setting.value.trim() !== '') ? true : setting.is_active
    }));
    saveMutation.mutate(settingsToSave);
  };

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset all AdSense settings to defaults? This will delete all current values.'
      )
    ) {
      resetMutation.mutate();
    }
  };

  // Get enable/disable setting
  const enabledSetting = localSettings.find((s) => s.key === 'enabled');
  const isEnabled = enabledSetting?.value === 'true';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          Error loading settings. Please try again later.
        </p>
      </div>
    );
  }

  // Filter out the enabled setting and sort
  const displaySettings = localSettings
    .filter((s) => s.key !== 'enabled')
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AdSense Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure Google AdSense integration for your site
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {resetMutation.isPending ? 'Resetting...' : 'Reset to Defaults'}
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Master Enable Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Enable AdSense
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Master switch to enable/disable all AdSense ads across the site
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => {
                handleChange('enabled', e.target.checked ? 'true' : 'false');
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          AdSense Configuration
        </h2>

        <div className="space-y-6">
          {/* Publisher ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publisher ID (ca-pub-XXXXXXXXXX) *
            </label>
            <input
              type="text"
              value={
                localSettings.find((s) => s.key === 'client_id')?.value || ''
              }
              onChange={(e) => handleChange('client_id', e.target.value)}
              placeholder="ca-pub-XXXXXXXXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Your Google AdSense Publisher ID. Get it from your AdSense
              account dashboard.
            </p>
          </div>

          {/* Ad Slots */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ad Unit Slots
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create ad units in your AdSense dashboard and enter their slot IDs
              here. Leave empty to disable ads in that position.
            </p>

            <div className="space-y-4">
              {displaySettings
                .filter((s) => s.key.startsWith('slot_'))
                .map((setting) => (
                  <div key={setting.id}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {setting.title}
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.is_active}
                          onChange={() => handleToggleActive(setting)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={setting.value}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      placeholder={`Enter ${setting.title} ID`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {setting.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {setting.description}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📋 Setup Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>
            Sign up for Google AdSense at{' '}
            <a
              href="https://www.google.com/adsense"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              google.com/adsense
            </a>
          </li>
          <li>
            Add the AdSense meta tag to your site (already added to index.html):{' '}
            <code className="bg-blue-100 px-1 rounded text-xs">
              &lt;meta name="google-adsense-account" content="ca-pub-XXXXXXXXXX"&gt;
            </code>
          </li>
          <li>Submit your site for approval (24-48 hours)</li>
          <li>
            Once approved, get your Publisher ID from the AdSense dashboard
          </li>
          <li>
            Create ad units in AdSense dashboard for each position you want
          </li>
          <li>Enter the Publisher ID and ad slot IDs above</li>
          <li>
            The meta tag will automatically update when you save your Publisher ID
          </li>
          <li>
            <strong>ads.txt file</strong> is automatically generated and served at{' '}
            <code className="bg-blue-100 px-1 rounded">/ads.txt</code> from your database settings.
            Google will verify this file automatically. No manual file upload needed!
          </li>
          <li>Toggle "Enable AdSense" to activate ads</li>
          <li>
            Add the auto-ads script to <code className="bg-blue-100 px-1 rounded">index.html</code> if using auto ads
          </li>
        </ol>
      </div>
    </div>
  );
}

