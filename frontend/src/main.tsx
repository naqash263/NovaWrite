import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

// Register service worker for PWA functionality (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Defer service worker registration to avoid initialization conflicts
  window.addEventListener('load', () => {
    // Add a small delay to ensure the main app is fully initialized
    setTimeout(() => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }, 100);
  });
}

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  // Specifically handle DB initialization errors
  if (event.error && event.error.message && event.error.message.includes('Cannot access \'DB\' before initialization')) {
    console.warn('DB initialization error caught and handled:', event.error);
    event.preventDefault(); // Prevent the error from crashing the app
    return;
  }
  console.error('Unhandled error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Specifically handle DB initialization errors
  if (event.reason && event.reason.message && event.reason.message.includes('Cannot access \'DB\' before initialization')) {
    console.warn('DB initialization promise rejection caught and handled:', event.reason);
    event.preventDefault(); // Prevent the error from crashing the app
    return;
  }
  console.error('Unhandled promise rejection:', event.reason);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      refetchOnReconnect: 'always',
      refetchIntervalInBackground: false,
      // Enable background refetch for critical data
      refetchInterval: false,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

