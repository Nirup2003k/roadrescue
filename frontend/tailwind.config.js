/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#14181F', 800: '#1B2029', 700: '#262C36' },
        beacon: { DEFAULT: '#F5A524', 50: '#FEF6E8', 100: '#FDECC7', 400: '#F7B84D', 500: '#F5A524', 600: '#D98A0F', 700: '#B06F0C' },
        route: { DEFAULT: '#2F6FA8', 50: '#EAF2F8', 100: '#CFE1EF', 500: '#2F6FA8', 600: '#265A87', 700: '#1E4869' },
        cloud: '#F7F8FA',
        slate: { 50: '#F5F6F8', 100: '#E9EBEF', 200: '#D4D8DF', 400: '#8B93A1', 500: '#5B6472', 600: '#454D59', 700: '#333941' },
        success: { 50: '#EAF7F1', 500: '#2E9E6D', 700: '#227A54' },
        danger: { 50: '#FCEBEA', 500: '#D6483D', 700: '#AD3128' },
      },
      fontFamily: { display: ['"Archivo"', 'sans-serif'], sans: ['"Inter"', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(20, 24, 31, 0.06), 0 1px 3px rgba(20, 24, 31, 0.08)' },
      backgroundImage: { 'lane-dashed': 'repeating-linear-gradient(90deg, currentColor 0 14px, transparent 14px 26px)' },
    },
  },
  plugins: [],
};
