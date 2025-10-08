import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout for local database
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle different types of errors
    if (!response) {
      // Network error
      console.error('Network error:', error.message);
      error.message = 'Network error. Please check your internet connection and try again.';
    } else {
      // HTTP error
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          if (window.location.pathname !== '/admin/login' && window.location.pathname !== '/login') {
            localStorage.removeItem('token');
            window.location.href = '/admin/login';
          }
          break;
          
        case 403:
          error.message = 'Access denied. You do not have permission to perform this action.';
          break;
          
        case 404:
          error.message = 'The requested resource was not found.';
          break;
          
        case 422:
          // Validation errors - these will be handled by individual components
          break;
          
        case 429:
          error.message = 'Too many requests. Please wait a moment and try again.';
          break;
          
        case 500:
          error.message = 'Server error. Please try again later.';
          break;
          
        case 503:
          error.message = 'Service temporarily unavailable. Please try again later.';
          break;
          
        default:
          error.message = data?.message || `An error occurred (${status}). Please try again.`;
      }
      
      console.error(`API Error ${status}:`, data);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
