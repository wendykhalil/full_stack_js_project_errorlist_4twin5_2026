/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // This is important - must be 'class' not 'media'
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom icon gradient colors
        icon: {
          available: {
            light: '#10b981',
            DEFAULT: '#059669',
            dark: '#34d399',
          },
          busy: {
            light: '#f59e0b',
            DEFAULT: '#d97706',
            dark: '#fbbf24',
          },
          booked: {
            light: '#ef4444',
            DEFAULT: '#dc2626',
            dark: '#f87171',
          },
          primary: {
            light: '#3b82f6',
            DEFAULT: '#2563eb',
            dark: '#60a5fa',
          },
          secondary: {
            light: '#8b5cf6',
            DEFAULT: '#7c3aed',
            dark: '#a78bfa',
          },
        },
      },
      boxShadow: {
        'glow-available': '0 0 12px rgba(16, 185, 129, 0.4), 0 0 24px rgba(16, 185, 129, 0.2)',
        'glow-busy': '0 0 12px rgba(245, 158, 11, 0.4), 0 0 24px rgba(245, 158, 11, 0.2)',
        'glow-booked': '0 0 12px rgba(239, 68, 68, 0.4), 0 0 24px rgba(239, 68, 68, 0.2)',
        'glow-primary': '0 0 12px rgba(59, 130, 246, 0.4), 0 0 24px rgba(59, 130, 246, 0.2)',
        'glow-secondary': '0 0 12px rgba(139, 92, 246, 0.4), 0 0 24px rgba(139, 92, 246, 0.2)',
      },
      animation: {
        'icon-pulse': 'icon-pulse 2s ease-in-out infinite',
        'icon-bounce': 'icon-bounce 0.5s ease-out',
      },
      keyframes: {
        'icon-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.9' },
        },
        'icon-bounce': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
