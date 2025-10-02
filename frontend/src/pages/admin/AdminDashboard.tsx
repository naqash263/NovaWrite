import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <nav className="admin-nav">
        <Link to="/admin/categories">Categories</Link>
        <Link to="/admin/posts">Posts</Link>
        <Link to="/admin/files">Files</Link>
        <Link to="/">View Site</Link>
      </nav>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Manage Categories</h3>
          <p>Create and organize blog categories</p>
          <Link to="/admin/categories">Go to Categories</Link>
        </div>
        <div className="stat-card">
          <h3>Manage Posts</h3>
          <p>Create, edit, and publish blog posts</p>
          <Link to="/admin/posts">Go to Posts</Link>
        </div>
        <div className="stat-card">
          <h3>Manage Files</h3>
          <p>Upload and manage files</p>
          <Link to="/admin/files">Go to Files</Link>
        </div>
      </div>
    </div>
  );
}
