import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const isAdmin = location.pathname.startsWith('/admin');
  const isLoginPage = location.pathname === '/admin/login';

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close dropdowns when user changes (login/logout)
  useEffect(() => {
    setUserDropdownOpen(false);
    setSettingsDropdownOpen(false);
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen, settingsDropdownOpen]);

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
    ];

    // Settings dropdown menu items (moved from main navigation)
    const settingsMenuItems = [
      // Content Settings
      { path: '/admin/categories', label: 'Categories', icon: '🏷️', category: 'Content' },
      { path: '/admin/tags', label: 'Tags', icon: '🔖', category: 'Content' },
      
      // Email Settings
      { path: '/admin/email-templates', label: 'Email Templates', icon: '📧', category: 'Email' },
      { path: '/admin/smtp-configurations', label: 'SMTP Settings', icon: '⚙️', category: 'Email' },
      
      // User Management
      { path: '/admin/user-management', label: 'User Management', icon: '👥', category: 'Users' },
      { path: '/admin/user-groups', label: 'User Groups', icon: '👨‍👩‍👧‍👦', category: 'Users' },
      
      // System Settings
      { path: '/admin/api-tokens', label: 'API Tokens', icon: '🔑', category: 'System' },
      { path: '/admin/api-docs', label: 'API Documentation', icon: '📖', category: 'System' },
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
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Home
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Courses
                </Link>
                <Link
                  to="/blog"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Blog
                </Link>
                <Link
                  to="/workflows"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Workflows
                </Link>
                <Link
                  to="/resources"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Resources
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  Contact
                </Link>
              </div>
            </div>
            
            {/* Desktop Auth Menu */}
            <div className="hidden sm:flex items-center gap-4">
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/my-courses"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    My Courses
                  </Link>
                  <span className="text-sm text-gray-600">{user.name}</span>
                  <button
                    onClick={() => logout('/')}
                    className="text-sm text-gray-600 hover:text-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
              <div className="space-y-1">
                <Link
                  to="/"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  Home
                </Link>
                <Link
                  to="/courses"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  Courses
                </Link>
                <Link
                  to="/blog"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  Blog
                </Link>
                <Link
                  to="/workflows"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  Workflows
                </Link>
                <Link
                  to="/resources"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  Resources
                </Link>
                <Link
                  to="/about"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  Contact
                </Link>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  {user ? (
                    <>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/my-courses"
                        className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                      >
                        My Courses
                      </Link>
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Signed in as {user.name}
                      </div>
                      <button
                        onClick={() => logout('/')}
                        className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                      >
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
    </div>
  );
}