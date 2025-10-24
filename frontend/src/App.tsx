import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { PerformanceOptimizer } from './components/PerformanceOptimizer';
import { PageLoader } from './components/LoadingComponents';
import { ToastContainer } from './hooks/use-toast';
import { ConfirmDialog } from './hooks/use-confirm';

// Lazy load components for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Workflows = lazy(() => import('./pages/Workflows'));
const UserLogin = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
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
const WorkflowCategories = lazy(() => import('./pages/admin/workflows/WorkflowCategories'));
const AdminWorkflows = lazy(() => import('./pages/admin/Workflows'));
const TestWorkflows = lazy(() => import('./pages/admin/TestWorkflows'));
const Users = lazy(() => import('./pages/admin/Users'));
const UserGroups = lazy(() => import('./pages/admin/UserGroups'));
const ApiTokens = lazy(() => import('./pages/admin/ApiTokens'));
const ApiDocs = lazy(() => import('./pages/admin/ApiDocs'));
const ApiDocumentation = lazy(() => import('./pages/admin/ApiDocumentation'));
const EmailTemplates = lazy(() => import('./pages/admin/EmailTemplates'));
const EmailService = lazy(() => import('./pages/admin/EmailService'));
const Tags = lazy(() => import('./pages/admin/Tags'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const SmtpConfigurations = lazy(() => import('./pages/admin/SmtpConfigurations'));
const SystemEmailSettings = lazy(() => import('./pages/admin/SystemEmailSettings'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const UserActivities = lazy(() => import('./pages/admin/UserActivities'));
const HomeSettings = lazy(() => import('./pages/admin/HomeSettings'));
const GeminiApiManagement = lazy(() => import('./pages/admin/GeminiApiManagement'));
const Monitoring = lazy(() => import('./pages/admin/Monitoring'));
const CvTemplates = lazy(() => import('./pages/admin/CvTemplates'));
const CvTemplateCreate = lazy(() => import('./pages/admin/CvTemplateCreate'));
const PushNotifications = lazy(() => import('./pages/admin/PushNotifications'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const GoogleCallback = lazy(() => import('./pages/auth/GoogleCallback'));
const GoogleSuccess = lazy(() => import('./pages/auth/GoogleSuccess'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const Resources = lazy(() => import('./pages/Resources'));
const CVBuilder = lazy(() => import('./pages/resources/CVBuilder'));
const LinkedInOptimizer = lazy(() => import('./pages/resources/LinkedInOptimizer'));
const SalaryNegotiation = lazy(() => import('./pages/resources/SalaryNegotiation'));
const InterviewPrep = lazy(() => import('./pages/resources/InterviewPrep'));
const CareerPathPlanner = lazy(() => import('./pages/resources/CareerPathPlanner'));
const JobSearchOptimizer = lazy(() => import('./pages/resources/JobSearchOptimizer'));
const SkillsAssessment = lazy(() => import('./pages/resources/SkillsAssessment'));
const CoverLetterGenerator = lazy(() => import('./pages/resources/CoverLetterGenerator'));

// Enhanced loading with performance optimizations

function App() {
  return (
    <ErrorBoundary>
      <PerformanceOptimizer />
      <AuthProvider>
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
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/auth/google/success" element={<GoogleSuccess />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:slug" element={<CourseDetail />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/courses" element={<ProtectedRoute requireAdmin><AdminCourses /></ProtectedRoute>} />
              <Route path="/admin/courses/:courseId/lessons" element={<ProtectedRoute requireAdmin><AdminLessons /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><Categories /></ProtectedRoute>} />
              <Route path="/admin/posts" element={<ProtectedRoute requireAdmin><Posts /></ProtectedRoute>} />
              <Route path="/admin/files" element={<ProtectedRoute requireAdmin><Files /></ProtectedRoute>} />
              <Route path="/admin/workflow-categories" element={<ProtectedRoute requireAdmin><WorkflowCategories /></ProtectedRoute>} />
              <Route path="/admin/workflows/categories" element={<ProtectedRoute requireAdmin><WorkflowCategories /></ProtectedRoute>} />
              <Route path="/admin/workflows" element={<ProtectedRoute requireAdmin><AdminWorkflows /></ProtectedRoute>} />
              <Route path="/admin/test-workflows" element={<ProtectedRoute requireAdmin><TestWorkflows /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><Users /></ProtectedRoute>} />
              <Route path="/admin/user-groups" element={<ProtectedRoute requireAdmin><UserGroups /></ProtectedRoute>} />
              <Route path="/admin/api-tokens" element={<ProtectedRoute requireAdmin><ApiTokens /></ProtectedRoute>} />
              <Route path="/admin/api-docs" element={<ProtectedRoute requireAdmin><ApiDocs /></ProtectedRoute>} />
              <Route path="/admin/api-documentation" element={<ProtectedRoute requireAdmin><ApiDocumentation /></ProtectedRoute>} />
            <Route path="/admin/email-templates" element={<ProtectedRoute requireAdmin><EmailTemplates /></ProtectedRoute>} />
              <Route path="/admin/email-service" element={<ProtectedRoute requireAdmin><EmailService /></ProtectedRoute>} />
              <Route path="/admin/tags" element={<ProtectedRoute requireAdmin><Tags /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><Settings /></ProtectedRoute>} />
              <Route path="/admin/smtp-configurations" element={<ProtectedRoute requireAdmin><SmtpConfigurations /></ProtectedRoute>} />
              <Route path="/admin/system-email-settings" element={<ProtectedRoute requireAdmin><SystemEmailSettings /></ProtectedRoute>} />
              <Route path="/admin/user-management" element={<ProtectedRoute requireAdmin><UserManagement /></ProtectedRoute>} />
              <Route path="/admin/user-activities" element={<ProtectedRoute requireAdmin><UserActivities /></ProtectedRoute>} />
              <Route path="/admin/home-settings" element={<ProtectedRoute requireAdmin><HomeSettings /></ProtectedRoute>} />
              <Route path="/admin/gemini-api" element={<ProtectedRoute requireAdmin><GeminiApiManagement /></ProtectedRoute>} />
              <Route path="/admin/monitoring" element={<ProtectedRoute requireAdmin><Monitoring /></ProtectedRoute>} />
              <Route path="/admin/cv-templates" element={<ProtectedRoute requireAdmin><CvTemplates /></ProtectedRoute>} />
              <Route path="/admin/cv-templates/create" element={<ProtectedRoute requireAdmin><CvTemplateCreate /></ProtectedRoute>} />
              <Route path="/admin/push-notifications" element={<ProtectedRoute requireAdmin><PushNotifications /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><Analytics /></ProtectedRoute>} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/cv-builder" element={<CVBuilder />} />
        <Route path="/resources/linkedin-optimizer" element={<LinkedInOptimizer />} />
        <Route path="/resources/salary-negotiation" element={<SalaryNegotiation />} />
        <Route path="/resources/interview-prep" element={<InterviewPrep />} />
        <Route path="/resources/career-path-planner" element={<CareerPathPlanner />} />
        <Route path="/resources/job-search-optimizer" element={<JobSearchOptimizer />} />
        <Route path="/resources/skills-assessment" element={<SkillsAssessment />} />
        <Route path="/resources/cover-letter-generator" element={<CoverLetterGenerator />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Layout>
          {/* Global Toast and Confirm Dialogs */}
          <ToastContainer />
          <ConfirmDialog />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
