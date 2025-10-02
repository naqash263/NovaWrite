import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="app">
      <nav className="main-nav">
        <div className="nav-container">
          <Link to="/" className="logo">Blog</Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/blog">Blog</Link>
            {user ? (
              <Link to="/admin">Admin</Link>
            ) : (
              <Link to="/login">Login</Link>
            )}
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>&copy; 2025 Blog. All rights reserved.</p>
      </footer>
    </div>
  );
}
