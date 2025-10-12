// Centralized API configuration
export const API_CONFIG = {
  // Base API URL - can be overridden by environment variables
  BASE_URL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api',
  
  // Storage URL for file uploads and static assets
  STORAGE_URL: import.meta.env.VITE_API_URL?.replace('/api', '') || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8001',
  
  // Full storage URL for file paths
  getStorageUrl: (filePath: string) => {
    const baseUrl = API_CONFIG.STORAGE_URL;
    return `${baseUrl}/storage/${filePath}`;
  },
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      ME: '/auth/me',
      VERIFY_EMAIL: '/auth/verify-email',
      RESEND_VERIFICATION: '/auth/resend-verification',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
    },
    ADMIN: {
      CV_TEMPLATES: '/admin/cv-templates',
      USERS: '/admin/users',
      FILES: '/admin/files',
      POSTS: '/admin/posts',
      COURSES: '/admin/courses',
    },
    PUBLIC: {
      CV_TEMPLATES: '/cv-templates',
      POSTS: '/posts',
      COURSES: '/courses',
      CONTACT: '/contact',
    }
  }
};

export default API_CONFIG;

