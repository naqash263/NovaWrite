import apiClient from '../api/axios';

export interface DeviceInfo {
  platform: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenResolution: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface AnalyticsEvent {
  eventType: 'install' | 'uninstall' | 'launch' | 'background';
  installSource?: string;
  uninstallReason?: string;
  appVersion?: string;
  sessionDuration?: number;
  pageViews?: number;
  customData?: Record<string, any>;
}

class AnalyticsService {
  private deviceId: string;
  private sessionId: string;
  private sessionStartTime: number;
  private pageViewCount: number = 0;

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.trackPageView();
  }

  /**
   * Track app installation.
   */
  async trackInstall(installSource: string = 'unknown'): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();
      const locationInfo = await this.getLocationInfo();
      
      await apiClient.post('/analytics/track/install', {
        install_source: installSource,
        app_version: this.getAppVersion(),
        session_duration: this.getSessionDuration(),
        page_views: this.pageViewCount,
        custom_data: {
          device_info: deviceInfo,
          location_info: locationInfo,
          timestamp: new Date().toISOString(),
        }
      });

      console.log('✅ App install tracked successfully');
    } catch (error) {
      console.error('❌ Failed to track app install:', error);
    }
  }

  /**
   * Track app uninstallation.
   */
  async trackUninstall(uninstallReason: string = 'user_action'): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();
      const locationInfo = await this.getLocationInfo();
      
      await apiClient.post('/analytics/track/uninstall', {
        uninstall_reason: uninstallReason,
        session_duration: this.getSessionDuration(),
        page_views: this.pageViewCount,
        custom_data: {
          device_info: deviceInfo,
          location_info: locationInfo,
          timestamp: new Date().toISOString(),
        }
      });

      console.log('✅ App uninstall tracked successfully');
    } catch (error) {
      console.error('❌ Failed to track app uninstall:', error);
    }
  }

  /**
   * Track app launch.
   */
  async trackLaunch(): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();
      const locationInfo = await this.getLocationInfo();
      
      await apiClient.post('/analytics/track/launch', {
        app_version: this.getAppVersion(),
        session_duration: this.getSessionDuration(),
        page_views: this.pageViewCount,
        custom_data: {
          device_info: deviceInfo,
          location_info: locationInfo,
          timestamp: new Date().toISOString(),
        }
      });

      console.log('✅ App launch tracked successfully');
    } catch (error) {
      console.error('❌ Failed to track app launch:', error);
    }
  }

  /**
   * Track background app activity.
   */
  async trackBackground(): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();
      const locationInfo = await this.getLocationInfo();
      
      await apiClient.post('/analytics/track/background', {
        app_version: this.getAppVersion(),
        session_duration: this.getSessionDuration(),
        page_views: this.pageViewCount,
        custom_data: {
          device_info: deviceInfo,
          location_info: locationInfo,
          timestamp: new Date().toISOString(),
        }
      });

      console.log('✅ Background activity tracked successfully');
    } catch (error) {
      console.error('❌ Failed to track background activity:', error);
    }
  }

  /**
   * Track page view.
   */
  trackPageView(): void {
    this.pageViewCount++;
    console.log(`📊 Page view tracked: ${this.pageViewCount}`);
  }

  /**
   * Get device information.
   */
  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    // Detect mobile/tablet/desktop
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android.*Tablet|Kindle|Silk/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    // Detect platform
    let platform = 'unknown';
    if (/iPhone|iPad|iPod|Macintosh/i.test(userAgent)) {
      platform = 'ios';
    } else if (/Android/i.test(userAgent)) {
      platform = 'android';
    } else if (/Windows/i.test(userAgent)) {
      platform = 'windows';
    } else if (/Macintosh/i.test(userAgent)) {
      platform = 'macos';
    } else if (/Linux/i.test(userAgent)) {
      platform = 'linux';
    }

    // Detect browser
    let browser = 'unknown';
    let browserVersion = '';
    if (/Chrome\/(\d+\.\d+)/i.test(userAgent)) {
      browser = 'chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/i)?.[1] || '';
    } else if (/Firefox\/(\d+\.\d+)/i.test(userAgent)) {
      browser = 'firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/i)?.[1] || '';
    } else if (/Safari\/(\d+\.\d+)/i.test(userAgent)) {
      browser = 'safari';
      browserVersion = userAgent.match(/Safari\/(\d+\.\d+)/i)?.[1] || '';
    } else if (/Edge\/(\d+\.\d+)/i.test(userAgent)) {
      browser = 'edge';
      browserVersion = userAgent.match(/Edge\/(\d+\.\d+)/i)?.[1] || '';
    }

    // Detect OS
    let os = 'unknown';
    let osVersion = '';
    if (/Windows NT (\d+\.\d+)/i.test(userAgent)) {
      os = 'windows';
      osVersion = userAgent.match(/Windows NT (\d+\.\d+)/i)?.[1] || '';
    } else if (/Mac OS X (\d+[._]\d+)/i.test(userAgent)) {
      os = 'macos';
      osVersion = userAgent.match(/Mac OS X (\d+[._]\d+)/i)?.[1]?.replace('_', '.') || '';
    } else if (/Android (\d+\.\d+)/i.test(userAgent)) {
      os = 'android';
      osVersion = userAgent.match(/Android (\d+\.\d+)/i)?.[1] || '';
    } else if (/iPhone OS (\d+[._]\d+)/i.test(userAgent)) {
      os = 'ios';
      osVersion = userAgent.match(/iPhone OS (\d+[._]\d+)/i)?.[1]?.replace('_', '.') || '';
    }

    // Determine device type
    let deviceType = 'desktop';
    if (isMobile) {
      deviceType = 'mobile';
    } else if (isTablet) {
      deviceType = 'tablet';
    }

    return {
      platform,
      browser,
      browserVersion,
      os,
      osVersion,
      deviceType,
      isMobile,
      isTablet,
      isDesktop,
      screenResolution: `${screen.width}x${screen.height}`,
    };
  }

  /**
   * Get location information.
   */
  private async getLocationInfo(): Promise<LocationInfo> {
    try {
      // Try to get location from browser geolocation API
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              });
            },
            () => {
              // Fallback to timezone only
              resolve({
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              });
            },
            { timeout: 5000 }
          );
        });
      }
    } catch (error) {
      console.warn('Could not get location info:', error);
    }

    // Fallback
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Get or create device ID.
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Get or create session ID.
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get app version.
   */
  private getAppVersion(): string {
    return import.meta.env.VITE_APP_VERSION || '1.0.0';
  }

  /**
   * Get session duration in seconds.
   */
  private getSessionDuration(): number {
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }

  /**
   * Get device ID.
   */
  getDeviceId(): string {
    return this.deviceId;
  }

  /**
   * Get session ID.
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
