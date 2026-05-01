import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
    headers: {
      '*.wasm': { 'Content-Type': 'application/wasm' },
    },
  },
  assetsInclude: ['**/*.wasm'],
  define: {
    'import.meta.env.VITE_RECAPTCHA_SITE_KEY': JSON.stringify('6LcmPnMsAAAAAFv4ZE_GJlVZw5sBw7lYLbPy86MB'),
  },
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
})