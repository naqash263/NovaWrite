import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'notification-badge.png'],
      manifest: {
        name: 'Naqash Thaheem Portfolio',
        short_name: 'Naqash Portfolio',
        description: 'Professional portfolio showcasing automation workflows, AI solutions, and development expertise',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'business', 'education'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Exclude large vendor chunks from precaching (they'll be cached at runtime)
        globIgnores: [
          '**/vendor-*.js',
          '**/editor-*.js',
          '**/markdown-editor-*.js',
          '**/assets/js/vendor-*.js',
          '**/assets/js/editor-*.js',
          '**/assets/js/markdown-editor-*.js',
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 30, // Increased from 10 to 30 seconds
              cacheableResponse: {
                statuses: [0, 200] // Cache responses including network errors (0)
              }
            }
          },
          // Handle static assets with better error handling
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // Handle CSS and JS files - cache large vendor chunks at runtime
          {
            urlPattern: /assets\/js\/(vendor|editor|markdown-editor).*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'vendor-js-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          // Handle other JS and CSS files
          {
            urlPattern: /\.(?:css|js)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    }),
    // Bundle analyzer (only in analysis mode)
    ...(process.env.ANALYZE ? [visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })] : [])
  ],
  base: '/',
  define: {
    // Reduce bundle size by defining env variables at build time
    __DEV__: process.env.NODE_ENV === 'development',
    // Define global variables for CommonJS compatibility
    global: 'globalThis'
  },
  server: {
    host: '0.0.0.0',
    port: 3003,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      overlay: false,
      port: 3003,
      host: 'localhost'
    },
    proxy: {
        '/api': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
          secure: false
        }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000, // Increased to 1MB to reduce warnings
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        // Optimized chunk splitting for better caching and parallel loading
        manualChunks: (id) => {
          // Vendor chunks - split more aggressively to avoid large chunks
          if (id.includes('node_modules')) {
            // React core (CRITICAL - must load synchronously with entry)
            // Keep React and React-DOM in entry chunk for immediate availability
            // Returning undefined keeps it in the entry chunk
            if (id.includes('react') || id.includes('react-dom')) {
              // Keep React in entry chunk - don't split it
              return undefined;
            }
            // HTTP client (small) - no React dependency
            if (id.includes('axios')) {
              return 'http';
            }
            // React-related packages that might import React
            // Put ALL React-related packages in react-vendor to ensure React is available
            // But React itself stays in entry chunk (returned undefined above)
            if (id.includes('react-') || 
                id.includes('@react') || 
                id.includes('react-router') ||
                id.includes('@tanstack/react-query') ||
                id.includes('react-hook-form') ||
                id.includes('react-select') ||
                id.includes('react-markdown') ||
                id.includes('@uiw/react-md-editor')) {
              return 'react-vendor';
            }
            // Markdown editor dependencies (no React) - split separately
            if (id.includes('remark') || 
                id.includes('rehype') ||
                id.includes('unified') ||
                id.includes('micromark') ||
                id.includes('mdast')) {
              return 'markdown-editor';
            }
            // PDF libraries - keep together in single chunk to avoid circular deps
            // pdf-lib has internal circular dependencies, so keep it self-contained
            if (id.includes('pdf-lib')) {
              return 'pdf-lib'; // Single chunk for pdf-lib to avoid internal circular deps
            }
            if (id.includes('jspdf') || id.includes('@react-pdf')) {
              return 'pdf-libs';
            }
            // Large utility libraries (no React dependency)
            if (id.includes('lodash') || id.includes('date-fns') || id.includes('moment')) {
              return 'utils';
            }
            // Chart/visualization libraries (if any)
            if (id.includes('chart') || id.includes('d3') || id.includes('recharts')) {
              return 'charts';
            }
            // Split remaining vendor by first-level package name to avoid huge chunks
            const match = id.match(/node_modules\/(@[^/]+|[^/]+)/);
            if (match) {
              const packageName = match[1];
              // Scoped packages - group by scope to reduce chunk count
              if (packageName.startsWith('@')) {
                const scope = packageName.split('/')[0];
                // Large scoped packages get their own chunk
                if (scope === '@uiw' || scope === '@tanstack') {
                  return `vendor-${scope.substring(1)}`;
                }
                // Group smaller scoped packages by scope to reduce HTTP requests
                // Only split if package is known to have circular deps
                const problematicPackages = ['@heroicons'];
                if (problematicPackages.some(pkg => packageName.includes(pkg))) {
                  const fullPackage = packageName.replace('@', '').replace('/', '-');
                  return `vendor-${fullPackage}`;
                }
                // Group other scoped packages together to reduce chunk count
                return 'vendor-scoped';
              }
              // Individual packages - exclude React packages (already handled)
              const largePackages = ['react', 'react-dom', 'react-router', 'axios'];
              if (largePackages.some(pkg => packageName.includes(pkg))) {
                return 'vendor-core';
              }
              // Group smaller individual packages together to reduce chunk count
              // Only split large packages individually
              const largeIndividualPackages = ['pdf-lib', 'jspdf', 'lodash', 'date-fns'];
              if (largeIndividualPackages.some(pkg => packageName.includes(pkg))) {
                return `vendor-${packageName}`;
              }
            }
            // Default vendor chunk for smaller packages (no React dependency)
            return 'vendor';
          }
        },
        // Optimize asset naming for better caching
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || 'asset'
          const info = name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // Optimize CSS
    cssTarget: 'chrome80',
    assetsInlineLimit: 4096,
    // Preload optimization - preload React chunks to ensure they load first
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps) => {
        // Always preload React chunks for lazy-loaded components
        if (filename.includes('main') || filename.includes('index')) {
          return deps.filter(dep => 
            dep.includes('react-vendor') ||
            dep.includes('router')
          );
        }
        // For lazy chunks, preload React if not already loaded
        return deps.filter(dep => 
          dep.includes('react-vendor')
        );
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      '@uiw/react-md-editor'
    ]
  },
  // Enable better caching
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none'
  },
  appType: 'spa'
})
