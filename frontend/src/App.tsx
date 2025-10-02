import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import Categories from './pages/admin/Categories';
import Posts from './pages/admin/Posts';
import Files from './pages/admin/Files';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:id" element={<BlogPost />} />
              <Route path="login" element={<Login />} />
              <Route path="admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="admin/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
              <Route path="admin/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
              <Route path="admin/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
