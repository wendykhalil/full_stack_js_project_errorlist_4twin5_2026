import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import { compression } from 'vite-plugin-compression2'

export default defineConfig({
  plugins: [
    react(),
    viteCommonjs(),
    // Gzip + Brotli compression for all JS/CSS assets
    compression({
      algorithms: ['gzip', 'brotliCompress'],
      exclude: [/\.(png|jpe?g|gif|webp|svg|ico|woff2?)$/i],
    }),
  ],
  
  // ============================================================================
  // RESOLVE CONFIGURATION - Fix ESM/CommonJS compatibility issues
  // ============================================================================
  resolve: {
    alias: {
      // Fix debug module ESM/CommonJS compatibility issue
      'debug': path.resolve(__dirname, 'node_modules/debug/src/browser.js'),
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
      // ✅ Externalize missing peer deps that are excluded from the bundle
      external: (id) => {
        // TensorFlow peer deps — these are loaded separately or not at all in browser
        if (id === '@tensorflow/tfjs-core') return true;
        if (id === '@tensorflow/tfjs-layers') return true;
        if (id === '@tensorflow/tfjs-converter') return true;
        return false;
      },
      output: {
        // ✅ Manual chunk splitting — keeps React in one chunk to avoid singleton issues
        // Each vendor group is loaded only when a page that needs it is visited
        manualChunks(id) {
          // React core — always needed, keep together
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // Router — needed on first navigation
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run/')) {
            return 'vendor-router';
          }
          // Socket.io — only needed after login
          if (id.includes('node_modules/socket.io-client') || id.includes('node_modules/engine.io-client')) {
            return 'vendor-socket';
          }
          // Stripe — only on subscription page
          if (id.includes('node_modules/@stripe/')) {
            return 'vendor-stripe';
          }
          // Charts — only on dashboard/analytics pages
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) {
            return 'vendor-charts';
          }
          // i18n — needed early but can be split
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n';
          }
          // Heavy export libs — loaded on demand via lazyImports.js
          if (id.includes('node_modules/xlsx') || id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'vendor-exports';
          }
          // TensorFlow / Face-API — only on FaceId pages
          if (id.includes('node_modules/@tensorflow') || id.includes('node_modules/@vladmandic')) {
            return 'vendor-ml';
          }
          // Lucide icons — tree-shaken but still group them
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // All other node_modules
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
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
    
    // Increase chunk size warning limit — vendor-ml (TensorFlow) is intentionally large
    // and only loaded on the FaceId page
    chunkSizeWarningLimit: 1500,
    
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
    // ✅ PRE-BUNDLE COMMON DEPENDENCIES (speeds up dev server cold start)
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'socket.io-client',
      'i18next',
      'react-i18next',
    ],
    
    // ✅ EXCLUDE HEAVY LIBRARIES FROM PRE-BUNDLING
    // These will be loaded on-demand via dynamic import()
    exclude: [
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-backend-cpu',
      '@vladmandic/face-api',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
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
