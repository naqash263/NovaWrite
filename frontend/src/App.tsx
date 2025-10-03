import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Workflows from './pages/Workflows';
import UserLogin from './pages/auth/Login';
import Register from './pages/auth/Register';
import Courses from './pages/courses/Courses';
import CourseDetail from './pages/courses/CourseDetail';
import MyCourses from './pages/courses/MyCourses';
import AdminLogin from './pages/Login';
import NotFound from './pages/NotFound';
import Dashboard from './pages/admin/Dashboard';
import AdminCourses from './pages/admin/Courses';
import Categories from './pages/admin/Categories';
import Posts from './pages/admin/Posts';
import Files from './pages/admin/Files';
import WorkflowCategories from './pages/admin/WorkflowCategories';
import AdminWorkflows from './pages/admin/Workflows';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
            <Route path="/admin/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
            <Route path="/admin/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
            <Route path="/admin/workflow-categories" element={<ProtectedRoute><WorkflowCategories /></ProtectedRoute>} />
            <Route path="/admin/workflows" element={<ProtectedRoute><AdminWorkflows /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
