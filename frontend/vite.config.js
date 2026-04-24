import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
    // Serve .wasm files with the correct MIME type so TensorFlow's WASM
    // backend can compile them. Without this Vite returns text/html (404 page)
    // and tf.js falls through all backends and crashes.
    headers: {
      '*.wasm': { 'Content-Type': 'application/wasm' },
    },
  },
  // Ensure .wasm files are served as assets, not processed by Vite
  assetsInclude: ['**/*.wasm'],
  define: {
    'import.meta.env.VITE_RECAPTCHA_SITE_KEY': JSON.stringify('6LcmPnMsAAAAAFv4ZE_GJlVZw5sBw7lYLbPy86MB'),
  },
})