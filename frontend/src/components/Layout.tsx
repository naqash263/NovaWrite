import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import InstallBanner from './InstallBanner';
import NotificationSettings from './NotificationSettings';
import ServiceBookingModal from './ServiceBookingModal';
import SiteHeader from './site/SiteHeader';
import SiteFooter from './site/SiteFooter';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; serviceName: string }>({
    isOpen: false,
    serviceName: '',
  });
  const isAdmin = location.pathname.startsWith('/admin');
  const isLoginPage = location.pathname === '/admin/login';

  // Close the admin sidebar when location changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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

  // Close the admin sidebar when user changes (login/logout)
  useEffect(() => {
    setSidebarOpen(false);
  }, [user]);

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

  // Show admin layout if user is on admin route and is authenticated
  if (isAdmin && user && user.role === 'admin') {

    // Sidebar navigation items organized by sections
    const sidebarSections = [
      {
        title: 'Overview',
        items: [
          { path: '/admin', label: 'Dashboard', icon: '📊' },
          { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
          { path: '/admin/monitoring', label: 'System Monitoring', icon: '🏥' },
        ]
      },
      {
        title: 'Content Management',
        items: [
          { path: '/admin/posts', label: 'Posts', icon: '📝' },
          { path: '/admin/workflows', label: 'Workflows', icon: '⚡' },
      { path: '/admin/projects', label: 'My Projects', icon: '📁' },
      { path: '/admin/issues', label: 'Issues', icon: '🐛' },
      { path: '/admin/issue-categories', label: 'Issue Categories', icon: '📂' },
          { path: '/admin/files', label: 'Files', icon: '📁' },
          { path: '/admin/cv-templates', label: 'CV Templates', icon: '📄' },
          { path: '/admin/categories', label: 'Categories', icon: '🏷️' },
          { path: '/admin/tags', label: 'Tags', icon: '🔖' },
        ]
      },
      {
        title: 'User Management',
        items: [
          { path: '/admin/user-management', label: 'User Management', icon: '👥' },
          { path: '/admin/user-activities', label: 'User Activities', icon: '👤' },
          { path: '/admin/user-groups', label: 'User Groups', icon: '👨‍👩‍👧‍👦' },
        ]
      },
      {
        title: 'Communication',
        items: [
          { path: '/admin/push-notifications', label: 'Push Notifications', icon: '🔔' },
          { path: '/admin/email-templates', label: 'Email Templates', icon: '📧' },
          { path: '/admin/email-service', label: 'Email Service', icon: '📤' },
          { path: '/admin/smtp-configurations', label: 'SMTP Settings', icon: '⚙️' },
        ]
      },
      {
        title: 'Email System',
        items: [
          { path: '/admin/n8n-configurations', label: 'N8n Configuration', icon: '🔗' },
          { path: '/admin/email-queue', label: 'Email Queue', icon: '📬' },
          { path: '/admin/email-logs', label: 'Email Logs', icon: '📋' },
        ]
      },
      {
        title: 'System & API',
        items: [
          { path: '/admin/api-tokens', label: 'API Tokens', icon: '🔑' },
          { path: '/admin/gemini-api', label: 'Gemini API', icon: '🤖' },
          { path: '/admin/api-documentation', label: 'API Documentation', icon: '📖' },
          { path: '/admin/home-settings', label: 'Home Settings', icon: '🏠' },
          { path: '/admin/adsense-settings', label: 'AdSense Settings', icon: '💰' },
        ]
      }
    ];

    return (
      <div key={`admin-${user?.id || 'no-user'}`} className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link to="/admin" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
            {sidebarSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 shadow-sm border-r-2 border-blue-600'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <span className="mr-3 text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to="/"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                View Site
              </Link>
              <button
                onClick={() => logout('/')}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {sidebarSections
                  .flatMap(section => section.items)
                  .find(item => item.path === location.pathname)?.label || 'Admin Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-3">
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // If user is on admin route but not authenticated or not admin, show login prompt
  if (isAdmin && (!user || user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need admin privileges to access this page.</p>
          <Link
            to="/admin/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
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
