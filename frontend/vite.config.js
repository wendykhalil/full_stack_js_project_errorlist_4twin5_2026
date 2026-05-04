import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'

export default defineConfig({
  plugins: [react(), viteCommonjs()],
  
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
      output: {
        // Disabled manual chunks — caused React singleton issues (useLayoutEffect undefined)
        // Let Vite handle splitting automatically
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
      'socket.io-client',
      'lodash',
      'lodash/get',
      'lodash/set',
      'lodash/merge',
      'lodash/cloneDeep',
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
