/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // This is important - must be 'class' not 'media'
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
