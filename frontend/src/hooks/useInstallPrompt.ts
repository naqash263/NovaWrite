import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptState {
  canInstall: boolean;
  promptInstall: () => Promise<void>;
  dismissPrompt: () => void;
  isInstalled: boolean;
  visitCount: number;
  showBanner: boolean;
}

export const useInstallPrompt = (): InstallPromptState => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Check if already installed
    if (checkIfInstalled()) {
      return;
    }

    // Get visit count from localStorage
    const storedVisitCount = localStorage.getItem('pwa_visit_count');
    const currentVisitCount = storedVisitCount ? parseInt(storedVisitCount, 10) : 0;
    const newVisitCount = currentVisitCount + 1;
    
    setVisitCount(newVisitCount);
    localStorage.setItem('pwa_visit_count', newVisitCount.toString());

    // Check if banner was previously dismissed
    const bannerDismissed = localStorage.getItem('pwa_install_dismissed') === 'true';
    
    // Show banner if: visits >= 1 AND not dismissed AND not installed
    if (newVisitCount >= 1 && !bannerDismissed && !checkIfInstalled()) {
      setShowBanner(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa_install_dismissed');
    };

    // Listen for visibility change to detect if app was installed
    const handleVisibilityChange = () => {
      if (document.hidden) return;
      checkIfInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const promptInstall = async (): Promise<void> => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowBanner(false);
        localStorage.removeItem('pwa_install_dismissed');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const dismissPrompt = (): void => {
    setShowBanner(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    promptInstall,
    dismissPrompt,
    isInstalled,
    visitCount,
    showBanner: showBanner && !isInstalled
  };
};
