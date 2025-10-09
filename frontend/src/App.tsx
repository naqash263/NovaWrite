import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { PerformanceOptimizer } from './components/PerformanceOptimizer';
import { PageLoader } from './components/LoadingComponents';

// Lazy load components for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Workflows = lazy(() => import('./pages/Workflows'));
const UserLogin = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const EmailVerification = lazy(() => import('./pages/EmailVerification'));
const Courses = lazy(() => import('./pages/courses/Courses'));
const CourseDetail = lazy(() => import('./pages/courses/CourseDetail'));
const MyCourses = lazy(() => import('./pages/courses/MyCourses'));
const AdminLogin = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminCourses = lazy(() => import('./pages/admin/Courses'));
const AdminLessons = lazy(() => import('./pages/admin/Lessons'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const Posts = lazy(() => import('./pages/admin/Posts'));
const Files = lazy(() => import('./pages/admin/Files'));
const WorkflowCategories = lazy(() => import('./pages/admin/WorkflowCategories'));
const AdminWorkflows = lazy(() => import('./pages/admin/Workflows'));
const TestWorkflows = lazy(() => import('./pages/admin/TestWorkflows'));
const Users = lazy(() => import('./pages/admin/Users'));
const UserGroups = lazy(() => import('./pages/admin/UserGroups'));
const ApiTokens = lazy(() => import('./pages/admin/ApiTokens'));
const ApiDocs = lazy(() => import('./pages/admin/ApiDocs'));
const Tags = lazy(() => import('./pages/admin/Tags'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const EmailTemplates = lazy(() => import('./pages/admin/EmailTemplates'));
const SmtpConfigurations = lazy(() => import('./pages/admin/SmtpConfigurations'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const HomeSettings = lazy(() => import('./pages/admin/HomeSettings'));
const GoogleCallback = lazy(() => import('./pages/auth/GoogleCallback'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const Resources = lazy(() => import('./pages/Resources'));

// Enhanced loading with performance optimizations

function App() {
  return (
    <ErrorBoundary>
      <PerformanceOptimizer />
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/login" element={<UserLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:slug" element={<CourseDetail />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/courses" element={<ProtectedRoute><AdminCourses /></ProtectedRoute>} />
              <Route path="/admin/courses/:courseId/lessons" element={<ProtectedRoute><AdminLessons /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
              <Route path="/admin/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
              <Route path="/admin/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
              <Route path="/admin/workflow-categories" element={<ProtectedRoute><WorkflowCategories /></ProtectedRoute>} />
              <Route path="/admin/workflows" element={<ProtectedRoute><AdminWorkflows /></ProtectedRoute>} />
              <Route path="/admin/test-workflows" element={<ProtectedRoute><TestWorkflows /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/admin/user-groups" element={<ProtectedRoute><UserGroups /></ProtectedRoute>} />
              <Route path="/admin/api-tokens" element={<ProtectedRoute><ApiTokens /></ProtectedRoute>} />
              <Route path="/admin/api-docs" element={<ProtectedRoute><ApiDocs /></ProtectedRoute>} />
              <Route path="/admin/tags" element={<ProtectedRoute><Tags /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/admin/email-templates" element={<ProtectedRoute><EmailTemplates /></ProtectedRoute>} />
              <Route path="/admin/smtp-configurations" element={<ProtectedRoute><SmtpConfigurations /></ProtectedRoute>} />
              <Route path="/admin/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
              <Route path="/admin/home-settings" element={<ProtectedRoute><HomeSettings /></ProtectedRoute>} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
