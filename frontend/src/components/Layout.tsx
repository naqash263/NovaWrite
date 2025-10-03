import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/admin" className="flex items-center text-xl font-bold text-gray-900">
                  Admin Panel
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/courses"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    Courses
                  </Link>
                  <Link
                    to="/admin/categories"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    Categories
                  </Link>
                  <Link
                    to="/admin/posts"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    Posts
                  </Link>
                  <Link
                    to="/admin/files"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    Files
                  </Link>
                  <Link
                    to="/admin/workflow-categories"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    Workflow Categories
                  </Link>
                  <Link
                    to="/admin/workflows"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                  >
                    Workflows
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                  View Site
                </Link>
                {user && (
                  <>
                    <span className="text-sm text-gray-600">{user.name}</span>
                    <button
                      onClick={logout}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
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
            <div className="flex items-center gap-4">
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
                    onClick={logout}
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
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Naqash Thaheem. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
