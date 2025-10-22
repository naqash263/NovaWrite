import { useState, useEffect } from 'react';
import apiClient from '../api/axios';

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
      console.log('Push notifications not supported: Missing required APIs');
      setIsSupported(false);
      return;
    }

    // Check if we're on HTTPS (required for push notifications)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.log('Push notifications require HTTPS. Current protocol:', location.protocol);
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    // Debug: Log VAPID key status
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    console.log('VAPID Public Key:', vapidKey ? 'Present' : 'Missing');
    console.log('Environment variables:', import.meta.env);
    console.log('Current protocol:', location.protocol);
    console.log('Current hostname:', location.hostname);

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
    console.log('requestPermission() called - isSupported:', isSupported);
    
    if (!isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    try {
      console.log('Calling Notification.requestPermission()...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    console.log('subscribe() called - isSupported:', isSupported, 'permission:', permission);
    
    if (!isSupported || permission !== 'granted') {
      console.log('Requesting permission...');
      const granted = await requestPermission();
      console.log('Permission granted:', granted);
      if (!granted) {
        throw new Error('Notification permission denied');
      }
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    console.log('VAPID key:', vapidPublicKey ? 'Present' : 'Missing');
    if (!vapidPublicKey) {
      throw new Error('VAPID public key is not configured. Please check your environment variables.');
    }

    try {
      console.log('Getting service worker registration...');
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready, creating subscription...');
      
      // Convert VAPID key to proper format for PushManager
      console.log('Original VAPID key:', vapidPublicKey.substring(0, 20) + '...');
      
      // Convert base64 to base64url
      const base64urlKey = vapidPublicKey
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      console.log('Base64url key:', base64urlKey.substring(0, 20) + '...');
      
      // Use the base64url key directly (most browsers accept this format)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64urlKey
      });

      console.log('Push subscription created:', subscription);
      setSubscription(subscription);
      setIsSubscribed(true);

      // Send subscription to backend
      console.log('Sending subscription to backend...');
      await sendSubscriptionToBackend(subscription);
      console.log('Subscription sent to backend successfully');

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