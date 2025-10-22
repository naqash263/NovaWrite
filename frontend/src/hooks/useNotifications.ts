import { useState, useEffect } from 'react';

interface NotificationPreferences {
  blogPosts: boolean;
  courses: boolean;
  workflows: boolean;
  careerTools: boolean;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    blogPosts: true,
    courses: true,
    workflows: true,
    careerTools: true
  });

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    // Check if user is already subscribed
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
        
        // Get user preferences from backend
        await fetchUserPreferences();
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        throw new Error('Notification permission denied');
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
      });

      setSubscription(subscription);
      setIsSubscribed(true);

      // Send subscription to backend
      await sendSubscriptionToBackend(subscription);

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) {
      return true;
    }

    try {
      const success = await subscription.unsubscribe();
      
      if (success) {
        setSubscription(null);
        setIsSubscribed(false);
        
        // Remove subscription from backend
        await removeSubscriptionFromBackend();
      }

      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  };

  const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
              auth: arrayBufferToBase64(subscription.getKey('auth'))
            }
          },
          preferences
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to backend');
      }
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
      throw error;
    }
  };

  const removeSubscriptionFromBackend = async () => {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.error('Error removing subscription from backend:', error);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      const response = await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPreferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/push/status');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer | null): string => {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  return {
    permission,
    isSupported,
    isSubscribed,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    requestPermission
  };
};