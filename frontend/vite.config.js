import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  // ============================================================================
  // RESOLVE CONFIGURATION - Fix ESM/CommonJS compatibility issues
  // ============================================================================
  resolve: {
    alias: {
      // Fix debug module ESM/CommonJS compatibility issue
      // socket.io-client uses debug which has mixed module exports
      'debug': path.resolve(__dirname, 'node_modules/debug/src/browser.js'),
      
      // Add path alias for cleaner imports
      '@': path.resolve(__dirname, './src'),
    },
    
    // Ensure proper module resolution
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  
  // ============================================================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================================================
  build: {
    // ✅ Fix CommonJS module handling
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true, // Handle mixed ESM/CommonJS modules
    },
    
    // Enable code splitting and chunking
    rollupOptions: {
      output: {
        // ✅ AGGRESSIVE MANUAL CHUNK SPLITTING
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          
          // React Router
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'react-router';
          }
          
          // Redux & State Management
          if (id.includes('node_modules/@reduxjs/') || id.includes('node_modules/react-redux/') || id.includes('node_modules/redux')) {
            return 'redux';
          }
          
          // ✅ HEAVY LIBRARIES - Separate chunks for lazy loading
          // Charts library (recharts ~1.1MB)
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-')) {
            return 'charts';
          }
          
          // Excel library (xlsx ~850KB)
          if (id.includes('node_modules/xlsx/')) {
            return 'xlsx';
          }
          
          // PDF library (jspdf ~670KB)
          if (id.includes('node_modules/jspdf/') || id.includes('node_modules/html2canvas/')) {
            return 'pdf';
          }
          
          // Icons library (lucide-react ~900KB) - split by usage
          if (id.includes('node_modules/lucide-react/')) {
            return 'icons';
          }
          
          // TensorFlow & Face Recognition (very heavy)
          if (id.includes('node_modules/@tensorflow/') || id.includes('node_modules/@vladmandic/face-api')) {
            return 'tensorflow';
          }
          
          // Stripe SDK
          if (id.includes('node_modules/@stripe/')) {
            return 'stripe';
          }
          
          // i18n libraries
          if (id.includes('node_modules/i18next/') || id.includes('node_modules/react-i18next/')) {
            return 'i18n';
          }
          
          // Socket.io
          if (id.includes('node_modules/socket.io-client/')) {
            return 'socket';
          }
          
          // Axios & HTTP
          if (id.includes('node_modules/axios/')) {
            return 'http';
          }
          
          // UI Libraries
          if (id.includes('node_modules/clsx/') || id.includes('node_modules/tailwind')) {
            return 'ui-utils';
          }
          
          // Other vendor libraries
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[ext]/[name]-[hash].${ext}`;
        },
      },
    },
    
    // Increase chunk size warning limit (we're using code splitting)
    chunkSizeWarningLimit: 1000,
    
    // ✅ AGGRESSIVE MINIFICATION
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,        // Remove console.logs
        drop_debugger: true,        // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2,                  // Multiple passes for better compression
      },
      mangle: {
        safari10: true,             // Safari 10 compatibility
      },
      format: {
        comments: false,            // Remove all comments
      },
    },
    
    // Disable source maps in production for smaller bundle
    sourcemap: false,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Optimize asset inlining threshold
    assetsInlineLimit: 4096, // 4kb - inline small assets as base64
    
    // Report compressed size
    reportCompressedSize: true,
  },
  
  // ============================================================================
  // DEPENDENCY OPTIMIZATION
  // ============================================================================
  optimizeDeps: {
    // ✅ PRE-BUNDLE COMMON DEPENDENCIES
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'clsx',
      'socket.io-client', // Include socket.io-client to fix debug module issue
    ],
    
    // ✅ EXCLUDE HEAVY LIBRARIES FROM PRE-BUNDLING
    // These will be loaded on-demand
    exclude: [
      '@tensorflow/tfjs',
      '@vladmandic/face-api',
      '@stripe/stripe-js',
      'recharts',
      'xlsx',
      'jspdf',
      'html2canvas',
    ],
    
    // Force optimization even if cached
    force: false,
    
    // ✅ Fix CommonJS/ESM compatibility
    esbuildOptions: {
      // Treat debug module as ESM
      mainFields: ['module', 'main'],
    },
  },
  
  // ============================================================================
  // SERVER CONFIGURATION
  // ============================================================================
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
    headers: {
      '*.wasm': { 'Content-Type': 'application/wasm' },
    },
    // Enable HTTP/2 for better performance
    https: false,
  },
  
  // ============================================================================
  // ASSET HANDLING
  // ============================================================================
  assetsInclude: ['**/*.wasm'],
  
  // ============================================================================
  // ENVIRONMENT VARIABLES
  // ============================================================================
  define: {
    'import.meta.env.VITE_RECAPTCHA_SITE_KEY': JSON.stringify('6LcmPnMsAAAAAFv4ZE_GJlVZw5sBw7lYLbPy86MB'),
  },
  
  // ============================================================================
  // TESTING CONFIGURATION
  // ============================================================================
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: './junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/assets/**',
        '**/*.config.*',
        '**/main.jsx',
      ],
    },
    exclude: ['node_modules', 'dist'],
  },
  
  // ============================================================================
  // PREVIEW SERVER (for production build testing)
  // ============================================================================
  preview: {
    port: 4173,
    strictPort: false,
    open: true,
  },
})
