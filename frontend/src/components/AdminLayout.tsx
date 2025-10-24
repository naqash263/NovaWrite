import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useApiStats } from '../hooks/useApiStats';
import ApiKeyManager from './ApiKeyManager';
import InstallBanner from './InstallBanner';
import NotificationSettings from './NotificationSettings';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { canInstall } = useInstallPrompt();
  const { apiStats, loading: apiStatsLoading } = useApiStats();


  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);

  // Pages that use Gemini API - only show API stats on these pages
  const geminiApiPages = [
    '/resources/cv-builder',
    '/resources/linkedin-optimizer',
    '/resources/salary-negotiation',
    '/resources/interview-prep',
    '/resources/career-path-planner',
    '/resources/job-search-optimizer',
    '/resources/skills-assessment',
    '/resources/cover-letter-generator',
    '/admin/gemini-api'
  ];
  const shouldShowApiStats = geminiApiPages.some(page => location.pathname.startsWith(page));

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-user-dropdown]')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Main content management navigation - only essential items
  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/posts', label: 'Posts', icon: '📝' },
    { path: '/admin/workflows', label: 'Workflows', icon: '⚡' },
    { path: '/admin/courses', label: 'Courses', icon: '📚' },
    { path: '/admin/files', label: 'Files', icon: '📁' },
  ];

  // Analytics and monitoring section
  const analyticsNavItems = [
    { path: '/admin/analytics', label: 'Analytics', icon: '📊' },
    { path: '/admin/monitoring', label: 'Monitoring', icon: '🏥' },
    { path: '/admin/push-notifications', label: 'Push Notifications', icon: '🔔' },
  ];

  // Email management section
  const emailNavItems = [
    { path: '/admin/email-templates', label: 'Email Templates', icon: '📧' },
    { path: '/admin/email-service', label: 'Email Service', icon: '📤' },
    { path: '/admin/system-email-settings', label: 'System Email Settings', icon: '⚙️' },
  ];

  // Settings dropdown menu items (moved from main navigation)
  const settingsMenuItems = [
    // Content Settings
    { path: '/admin/categories', label: 'Categories', icon: '🏷️', category: 'Content' },
    { path: '/admin/tags', label: 'Tags', icon: '🔖', category: 'Content' },
    { path: '/admin/home-settings', label: 'Home Settings', icon: '🏠', category: 'Content' },
    
    // Email Settings
    { path: '/admin/email-templates', label: 'Email Templates', icon: '📧', category: 'Email' },
    { path: '/admin/smtp-configurations', label: 'SMTP Settings', icon: '⚙️', category: 'Email' },
    
    // User Management
    { path: '/admin/user-management', label: 'User Management', icon: '👥', category: 'Users' },
    { path: '/admin/user-activities', label: 'User Activities', icon: '📊', category: 'Users' },
    { path: '/admin/user-groups', label: 'User Groups', icon: '👨‍👩‍👧‍👦', category: 'Users' },
    
    // System Settings
    { path: '/admin/api-tokens', label: 'API Tokens', icon: '🔑', category: 'System' },
    { path: '/admin/api-docs', label: 'API Documentation', icon: '📖', category: 'System' },
    { path: '/admin/gemini-api', label: 'Gemini API', icon: '🤖', category: 'System' },
    { path: '/admin/cv-templates', label: 'CV Templates', icon: '📄', category: 'System' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link to="/admin" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </span>
            </Link>
          </div>
          
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {/* Main Navigation */}
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Content Management
                </div>
                <div className="space-y-1">
                  {adminNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Analytics & Monitoring */}
              <div className="mt-6">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Analytics & Monitoring
                </div>
                <div className="space-y-1">
                  {analyticsNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Email Management */}
              <div className="mt-6">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email Management
                </div>
                <div className="space-y-1">
                  {emailNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* System Settings */}
              <div className="mt-6">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  System Settings
                </div>
                <div className="space-y-1">
                  {settingsMenuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="lg:hidden">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {mobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                </div>
                <div className="lg:hidden ml-4">
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Admin
                  </span>
                </div>
              </div>
              
              {/* Right side of nav */}
              <div className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="hidden sm:inline">View Site</span>
                </Link>
                
                {/* User Dropdown Menu */}
                {user && (
                  <div className="relative" data-user-dropdown>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                        {user.name?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                      <span className="ml-2 text-gray-700 font-medium hidden sm:block">{user.name}</span>
                      <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                              {user.name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                              {apiStats.isAuthenticated && !apiStatsLoading && (
                                <div className="mt-1 flex items-center space-x-2">
                                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  <span className="text-xs text-gray-500">
                                    {apiStats.usedRequests} / {apiStats.totalRequests} API calls
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                            </svg>
                            Go to Dashboard
                          </Link>
                          
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              setNotificationSettingsOpen(true);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Notification Settings
                          </button>
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              logout('/');
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile navigation menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden border-t border-gray-200 py-4 max-h-screen overflow-y-auto">
                <div className="space-y-4">
                  {/* Main Navigation */}
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Content Management
                    </div>
                    <div className="space-y-1">
                      {adminNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Analytics & Monitoring */}
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Analytics & Monitoring
                    </div>
                    <div className="space-y-1">
                      {analyticsNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Email Management */}
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email Management
                    </div>
                    <div className="space-y-1">
                      {emailNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Settings */}
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      System Settings
                    </div>
                    <div className="space-y-1">
                      {settingsMenuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* API Key Manager - only show on relevant pages */}
      {shouldShowApiStats && <ApiKeyManager />}

      {/* Install Banner */}
      {canInstall && <InstallBanner />}

      {/* Notification Settings Modal */}
      {notificationSettingsOpen && (
        <NotificationSettings
          onClose={() => setNotificationSettingsOpen(false)}
        />
      )}
    </div>
  );
}
