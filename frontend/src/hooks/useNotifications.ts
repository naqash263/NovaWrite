import { useState, useEffect } from 'react';
import apiClient from '../api/axios';

interface NotificationPreferences {
  blogPosts: boolean;
  issues: boolean;
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
    issues: true,
    workflows: true,
    careerTools: true
  });

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }

    // Check if we're on HTTPS (required for push notifications)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
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

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error('VAPID public key is not configured. Please check your environment variables.');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Convert VAPID key to proper format for PushManager
      // Function to convert base64url to Uint8Array
      const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
        // Convert base64url to base64
        const base64 = base64String
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        
        // Add padding if needed
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        
        // Decode base64 to binary string
        const binaryString = atob(padded);
        
        // Convert to Uint8Array
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        return bytes;
      };
      
      // Convert VAPID key to base64url if it's not already
      let base64urlKey = vapidPublicKey;
      if (vapidPublicKey.includes('+') || vapidPublicKey.includes('/') || vapidPublicKey.includes('=')) {
        base64urlKey = vapidPublicKey
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      }
      
      // Convert to Uint8Array
      const keyArray = urlBase64ToUint8Array(base64urlKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray.buffer as ArrayBuffer
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
      await apiClient.post('/push/subscribe', {
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth'))
          }
        },
        preferences
      });
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
      throw error;
    }
  };

  const removeSubscriptionFromBackend = async () => {
    try {
      await apiClient.post('/push/unsubscribe');
    } catch (error) {
      console.error('Error removing subscription from backend:', error);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      await apiClient.put('/push/preferences', updatedPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await apiClient.get('/push/status');
      if (response.data.preferences) {
        setPreferences(response.data.preferences);
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