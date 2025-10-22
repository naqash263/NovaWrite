import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import ApiKeyManager from './ApiKeyManager';
import InstallBanner from './InstallBanner';
import NotificationSettings from './NotificationSettings';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const isAdmin = location.pathname.startsWith('/admin');
  const isLoginPage = location.pathname === '/admin/login';
  
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

  // Close dropdowns when user changes (login/logout)
  useEffect(() => {
    setUserDropdownOpen(false);
    setSettingsDropdownOpen(false);
    setMoreDropdownOpen(false);
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (userDropdownOpen && !target.closest('[data-user-dropdown]')) {
        setUserDropdownOpen(false);
      }
      
      if (settingsDropdownOpen && !target.closest('[data-settings-dropdown]')) {
        setSettingsDropdownOpen(false);
      }
      
      if (moreDropdownOpen && !target.closest('[data-more-dropdown]')) {
        setMoreDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen, settingsDropdownOpen, moreDropdownOpen]);

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
    // Main content management navigation
    const adminNavItems = [
      { path: '/admin', label: 'Dashboard', icon: '📊' },
      { path: '/admin/posts', label: 'Posts', icon: '📝' },
      { path: '/admin/workflows', label: 'Workflows', icon: '⚡' },
      { path: '/admin/courses', label: 'Courses', icon: '📚' },
      { path: '/admin/files', label: 'Files', icon: '📁' },
      { path: '/admin/monitoring', label: 'Monitoring', icon: '🏥' },
      { path: '/admin/push-notifications', label: 'Push Notifications', icon: '🔔' },
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
      <div key={`admin-${user?.id || 'no-user'}`} className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/admin" className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Admin
                    </span>
                  </div>
                </Link>
                <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
                  {adminNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <span className="mr-2 text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
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
                  View Site
                </Link>
                
                {/* User Dropdown Menu */}
                {user && (
                  <div className="relative" data-user-dropdown>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden sm:block">{user.name}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        
                        {/* Settings Dropdown */}
                        <div className="relative" data-settings-dropdown>
                          <button
                            onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                            className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                              settingsMenuItems.some(item => location.pathname === item.path)
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span className="mr-3 text-base">⚙️</span>
                            Settings
                            <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Settings Submenu */}
                          {settingsDropdownOpen && (
                            <div className="absolute left-full top-0 ml-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                              {/* Group settings by category */}
                              {['Content', 'Email', 'Users', 'System'].map((category) => {
                                const categoryItems = settingsMenuItems.filter(item => item.category === category);
                                if (categoryItems.length === 0) return null;
                                
                                return (
                                  <div key={category}>
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                      {category}
                                    </div>
                                    {categoryItems.map((item) => {
                                      const isActive = location.pathname === item.path;
                                      return (
                                        <Link
                                          key={item.path}
                                          to={item.path}
                                          onClick={() => {
                                            setUserDropdownOpen(false);
                                            setSettingsDropdownOpen(false);
                                          }}
                                          className={`flex items-center px-4 py-2 text-sm transition-colors ${
                                            isActive
                                              ? 'bg-blue-50 text-blue-700'
                                              : 'text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          <span className="mr-3 text-base">{item.icon}</span>
                                          {item.label}
                                        </Link>
                                      );
                                    })}
                                    {category !== 'System' && <div className="border-t border-gray-100 my-1"></div>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                    </div>
                        
                        <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              logout('/');
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Mobile menu button */}
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
              </div>
            </div>
            
            {/* Mobile navigation menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden border-t border-gray-200 py-4">
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

                  {/* Settings */}
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Settings
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
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
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
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center text-xl font-bold text-gray-900">
                Naqash Thaheem
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
                {/* Primary Navigation - Most Important Items */}
                <Link
                  to="/"
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === '/'
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </Link>
                
                <Link
                  to="/courses"
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname.startsWith('/courses')
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Courses
                </Link>
                
                <Link
                  to="/workflows"
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname.startsWith('/workflows')
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Workflows
                </Link>
                
                {/* Resources Dropdown */}
                <div className="relative" data-more-dropdown>
                  <button
                    onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      location.pathname.startsWith('/resources') || location.pathname.startsWith('/blog') || location.pathname.startsWith('/about') || location.pathname.startsWith('/contact')
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Resources
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Resources Dropdown Menu */}
                  {moreDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tools & Resources
                      </div>
                      <Link
                        to="/resources"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        All Resources
                      </Link>
                      
                      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                        Career Tools
                      </div>
                      <Link
                        to="/resources/cv-builder"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="mr-3 text-base">📄</span>
                        CV Builder
                      </Link>
                      <Link
                        to="/resources/linkedin-optimizer"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="mr-3 text-base">💼</span>
                        LinkedIn Optimizer
                      </Link>
                      <Link
                        to="/resources/salary-negotiation"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="mr-3 text-base">💰</span>
                        Salary Negotiation
                      </Link>
                      <Link
                        to="/resources/interview-prep"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="mr-3 text-base">🎯</span>
                        Interview Prep
                      </Link>
                      <Link
                        to="/resources/career-path-planner"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="mr-3 text-base">🗺️</span>
                        Career Path Planner
                      </Link>
                      <Link
                        to="/resources/job-search-optimizer"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="mr-3 text-base">🔍</span>
                        Job Search Optimizer
                      </Link>
                      <Link
                        to="/resources/skills-assessment"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="mr-3 text-base">📊</span>
                        Skills Assessment
                      </Link>
                      <Link
                        to="/resources/cover-letter-generator"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="mr-3 text-base">✉️</span>
                        Cover Letter Generator
                      </Link>
                      
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Information
                      </div>
                      <Link
                        to="/blog"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        Blog
                </Link>
                <Link
                  to="/about"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                  About
                </Link>
                <Link
                  to="/contact"
                        onClick={() => setMoreDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                  Contact
                </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Desktop Auth Menu */}
            <div className="hidden sm:flex items-center gap-3">
              {/* API Key Status - Only show on Gemini API pages */}
              {shouldShowApiStats && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs">
                  <ApiKeyManager />
                </div>
              )}

              {/* Install App Button */}
              {canInstall && (
                <button
                  onClick={promptInstall}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden md:block">Install App</span>
                </button>
              )}
              
              
              {user ? (
                <>
                  
                  {/* User Dropdown */}
                  <div className="relative" data-user-dropdown>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden md:block">{user.name}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* User Dropdown Menu */}
                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        
                  <Link
                    to="/my-courses"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                          <span className="mr-3">📚</span>
                    My Courses
                  </Link>
                        
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            // Open notification settings modal
                            const event = new CustomEvent('openNotificationSettings');
                            window.dispatchEvent(event);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span className="mr-3">🔔</span>
                          Notification Settings
                        </button>
                        
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="mr-3">⚙️</span>
                            Admin Dashboard
                          </Link>
                        )}
                        
                        <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              logout('/');
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                    Logout
                  </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2"
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
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200 py-4">
              <div className="space-y-4">
                {/* Primary Navigation */}
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Main Navigation
                  </div>
              <div className="space-y-1">
                <Link
                  to="/"
                      className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                        location.pathname === '/'
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                  Home
                </Link>
                <Link
                  to="/courses"
                      className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                        location.pathname.startsWith('/courses')
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                  Courses
                </Link>
                    <Link
                      to="/workflows"
                      className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                        location.pathname.startsWith('/workflows')
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Workflows
                    </Link>
                  </div>
                </div>

                {/* Notification Settings Button */}
                <button
                  onClick={() => {
                    const event = new CustomEvent('openNotificationSettings');
                    window.dispatchEvent(event);
                  }}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Notification Settings"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5v-5a10 10 0 1 1 20 0v5z" />
                  </svg>
                  <span>Notifications</span>
                </button>

                {/* Resources Section */}
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tools & Resources
                  </div>
                  <div className="space-y-1">
                    <Link
                      to="/resources"
                      className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                        location.pathname.startsWith('/resources')
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      All Resources
                    </Link>
                    
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Career Tools
                    </div>
                    <Link
                      to="/resources/cv-builder"
                      className="flex items-center px-6 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="mr-3 text-base">📄</span>
                      CV Builder
                    </Link>
                    <Link
                      to="/resources/linkedin-optimizer"
                      className="flex items-center px-6 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="mr-3 text-base">💼</span>
                      LinkedIn Optimizer
                    </Link>
                    <Link
                      to="/resources/salary-negotiation"
                      className="flex items-center px-6 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="mr-3 text-base">💰</span>
                      Salary Negotiation
                    </Link>
                    <Link
                      to="/resources/interview-prep"
                      className="flex items-center px-6 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="mr-3 text-base">🎯</span>
                      Interview Prep
                    </Link>
                    <Link
                      to="/resources/career-path-planner"
                      className="flex items-center px-6 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="mr-3 text-base">🗺️</span>
                      Career Path Planner
                    </Link>
                    <Link
                      to="/resources/job-search-optimizer"
                      className="flex items-center px-6 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="mr-3 text-base">🔍</span>
                      Job Search Optimizer
                    </Link>
                    <Link
                      to="/resources/skills-assessment"
                      className="flex items-center px-6 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="mr-3 text-base">📊</span>
                      Skills Assessment
                    </Link>
                    <Link
                      to="/resources/cover-letter-generator"
                      className="flex items-center px-6 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="mr-3 text-base">✉️</span>
                      Cover Letter Generator
                    </Link>
                  </div>
                </div>

                {/* Information Section */}
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Information
                  </div>
                  <div className="space-y-1">
                <Link
                  to="/blog"
                      className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                        location.pathname.startsWith('/blog')
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                  Blog
                </Link>
                <Link
                  to="/about"
                      className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                        location.pathname.startsWith('/about')
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  About
                </Link>
                <Link
                  to="/contact"
                      className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                        location.pathname.startsWith('/contact')
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                  Contact
                </Link>
                  </div>
                </div>
                
                {/* User Section */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  {/* API Key Status - Only show on Gemini API pages */}
                  {shouldShowApiStats && (
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                        <ApiKeyManager />
                      </div>
                    </div>
                  )}

                  {/* Install App Button - Mobile */}
                  {canInstall && (
                    <button
                      onClick={promptInstall}
                      className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md w-full"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Install App
                    </button>
                  )}
                  
                  {user ? (
                    <>
                      
                      <Link
                        to="/my-courses"
                        className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                      >
                        <span className="mr-3">📚</span>
                        My Courses
                      </Link>
                      
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                        >
                          <span className="mr-3">⚙️</span>
                          Admin Dashboard
                        </Link>
                      )}
                      
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Signed in as {user.name}
                      </div>
                      
                      <button
                        onClick={() => logout('/')}
                        className="flex items-center w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                      >
                        <span className="mr-3">🚪</span>
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block px-3 py-2 text-base font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md mx-3 text-center"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link to="/workflows" className="text-gray-400 hover:text-white transition-colors">Workflows</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/resources" className="text-gray-400 hover:text-white transition-colors">Resources</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><span className="text-gray-400">AI Automation</span></li>
                <li><span className="text-gray-400">CRM Integration</span></li>
                <li><span className="text-gray-400">Power BI Dashboards</span></li>
                <li><span className="text-gray-400">Web Development</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/cookie-policy" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Naqash Thaheem. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

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
    </div>
  );
}