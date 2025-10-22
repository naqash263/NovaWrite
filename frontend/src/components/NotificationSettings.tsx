import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useToast } from '../hooks/use-toast';

interface NotificationSettingsProps {
  onClose?: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { addToast } = useToast();
  const {
    permission,
    isSupported,
    isSubscribed,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    console.log('handleSubscribe called');
    setIsLoading(true);
    try {
      console.log('Calling subscribe()...');
      await subscribe();
      console.log('Subscribe successful');
      addToast({
        type: 'success',
        title: 'Notifications Enabled',
        description: 'You will now receive push notifications for updates.'
      });
    } catch (error) {
      console.error('Subscribe error:', error);
      addToast({
        type: 'error',
        title: 'Subscription Failed',
        description: `Failed to enable notifications: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribe();
      addToast({
        type: 'success',
        title: 'Notifications Disabled',
        description: 'You will no longer receive push notifications.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Unsubscribe Failed',
        description: 'Failed to disable notifications. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
      addToast({
        type: 'success',
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update preferences. Please try again.'
      });
    }
  };

  const getPermissionStatus = () => {
    if (!isSupported) return 'not-supported';
    if (permission === 'granted') return 'granted';
    if (permission === 'denied') return 'denied';
    return 'default';
  };

  const permissionStatus = getPermissionStatus();

  // Debug: Log VAPID key status
  React.useEffect(() => {
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    console.log('NotificationSettings - VAPID Public Key:', vapidKey ? 'Present' : 'Missing');
    console.log('NotificationSettings - Environment variables:', import.meta.env);
    console.log('NotificationSettings - Permission:', permission);
    console.log('NotificationSettings - Is Supported:', isSupported);
    console.log('NotificationSettings - Is Subscribed:', isSubscribed);
  }, [permission, isSupported, isSubscribed]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {!isSupported ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Not Supported</h3>
          <p className="text-gray-600">
            Push notifications are not supported in this browser or device.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Permission Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Permission Status</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                permissionStatus === 'granted' ? 'bg-green-100 text-green-800' :
                permissionStatus === 'denied' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {permissionStatus === 'granted' ? 'Granted' :
                 permissionStatus === 'denied' ? 'Denied' :
                 'Not Requested'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {permissionStatus === 'granted' 
                ? 'You have granted permission for notifications.'
                : permissionStatus === 'denied'
                ? 'Notifications are blocked. Please enable them in your browser settings.'
                : 'Click the button below to enable notifications.'}
            </p>
          </div>

          {/* Subscription Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Subscription Status</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isSubscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {isSubscribed 
                ? 'You are subscribed to push notifications.'
                : 'Subscribe to receive push notifications on this device.'}
            </p>
            
            {permissionStatus === 'granted' ? (
              <button
                onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isSubscribed
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Processing...' : (isSubscribed ? 'Unsubscribe' : 'Subscribe')}
              </button>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Enable Notifications'}
              </button>
            )}
          </div>

          {/* Notification Preferences */}
          {isSubscribed && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Notification Types</h3>
              <p className="text-sm text-gray-600">
                Choose which types of notifications you want to receive.
              </p>
              
              <div className="space-y-3">
                {[
                  { key: 'blogPosts', label: 'Blog Posts', description: 'New blog posts and updates' },
                  { key: 'courses', label: 'Courses', description: 'New courses and course updates' },
                  { key: 'workflows', label: 'Workflows', description: 'New automation workflows' },
                  { key: 'careerTools', label: 'Career Tools', description: 'Updates to career tools and features' }
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{label}</div>
                      <div className="text-sm text-gray-600">{description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[key as keyof typeof preferences]}
                        onChange={(e) => handlePreferenceChange(key as keyof typeof preferences, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug Info - Remove in production */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Debug Info</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  VAPID Key: {import.meta.env.VITE_VAPID_PUBLIC_KEY ? '✅ Present' : '❌ Missing'}<br/>
                  Permission: {permission || 'null'}<br/>
                  Supported: {isSupported ? '✅ Yes' : '❌ No'}<br/>
                  Subscribed: {isSubscribed ? '✅ Yes' : '❌ No'}
                </p>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900">About Notifications</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Notifications will appear even when you're not actively using the website. 
                  You can change these settings anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;