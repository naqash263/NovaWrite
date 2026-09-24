import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import InstallBanner from './InstallBanner';
import NotificationSettings from './NotificationSettings';
import ServiceBookingModal from './ServiceBookingModal';
import SiteHeader from './site/SiteHeader';
import SiteFooter from './site/SiteFooter';
import AdminShell from './admin/AdminShell';
import analyticsService from '../services/analyticsService';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();

  // Custom install handler that tracks the source
  const handleInstall = async (source: string) => {
    try {
      await promptInstall();
      // Track install attempt (success/failure will be tracked in the hook)
      await analyticsService.trackInstall(source);
    } catch (error) {
      console.error('Install failed:', error);
    }
  };
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; serviceName: string }>({
    isOpen: false,
    serviceName: '',
  });
  const isAdmin = location.pathname.startsWith('/admin');
  const isLoginPage = location.pathname === '/admin/login';

  // Listen for notification settings modal events
  useEffect(() => {
    const handleOpenNotificationSettings = () => {
      setNotificationSettingsOpen(true);
    };

    window.addEventListener('openNotificationSettings', handleOpenNotificationSettings);
    return () => {
      window.removeEventListener('openNotificationSettings', handleOpenNotificationSettings);
    };
  }, []);

  // Allow access to login page without authentication
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (isAdmin && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Admin area: dedicated shell with grouped navigation and command palette
  if (isAdmin && user && user.role === 'admin') {
    return (
      <AdminShell key={`admin-${user.id}`} user={user} onLogout={() => logout('/')}>
        {children}
      </AdminShell>
    );
  }

  // Signed-out or non-admin visitors on /admin/*: render the route bare so ProtectedRoute can
  // redirect to /admin/login (keeping the return path) or /unauthorized.
  if (isAdmin) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>
      <SiteHeader
        user={user}
        onLogout={() => logout('/')}
        canInstall={canInstall}
        onInstall={handleInstall}
        onBook={() => setBookingModal({ isOpen: true, serviceName: 'Consultation' })}
      />

      <main id="main-content" className="flex-1">{children}</main>

      <SiteFooter />

      {/* Install Banner */}
      <InstallBanner />

      {/* Notification Settings Modal */}
      {notificationSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <NotificationSettings onClose={() => setNotificationSettingsOpen(false)} />
          </div>
        </div>
      )}

      {/* Service Booking Modal */}
      <ServiceBookingModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ isOpen: false, serviceName: '' })}
        serviceName={bookingModal.serviceName}
      />
    </div>
  );
}
