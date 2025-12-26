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
            // React core (CRITICAL - must load first) - keep together and ensure it's in entry
            // Don't split React - it must be available synchronously
            if (id.includes('react') && !id.includes('react-dom')) {
              return 'react-core';
            }
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            // Router (medium size)
            if (id.includes('react-router')) {
              return 'router';
            }
            // Query library (medium size)
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            // HTTP client (small)
            if (id.includes('axios')) {
              return 'http';
            }
            // Markdown editor and related (large - split separately)
            if (id.includes('@uiw/react-md-editor') || 
                id.includes('react-markdown') || 
                id.includes('remark') || 
                id.includes('rehype') ||
                id.includes('unified') ||
                id.includes('micromark') ||
                id.includes('mdast')) {
              return 'markdown-editor';
            }
            // Large utility libraries
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
              // Scoped packages - group by scope
              if (packageName.startsWith('@')) {
                const scope = packageName.split('/')[0];
                // Large scoped packages get their own chunk
                if (scope === '@uiw' || scope === '@tanstack') {
                  return `vendor-${scope.substring(1)}`;
                }
                // Other scoped packages grouped by scope
                return `vendor-scoped`;
              }
              // Individual packages - large ones get their own chunk
              const largePackages = ['react', 'react-dom', 'react-router', 'axios'];
              if (largePackages.some(pkg => packageName.includes(pkg))) {
                return 'vendor-core';
              }
            }
            // Default vendor chunk for smaller packages
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
    // Preload optimization - only preload critical chunks
    modulePreload: {
      polyfill: false,
      resolveDependencies: (filename, deps) => {
        // Only preload critical entry chunks
        if (filename.includes('main') || filename.includes('index')) {
          return deps.filter(dep => dep.includes('react-vendor') || dep.includes('router'));
        }
        return [];
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
