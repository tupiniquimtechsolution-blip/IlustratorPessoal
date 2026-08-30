/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#111318',
        panel: '#1a1d24',
        line: '#2a2f3a',
        accent: '#7c5cff',
        cyan: '#4ed5df',
      },
      boxShadow: { glow: '0 0 32px rgba(124, 92, 255, 0.18)' },
    },
  },
  plugins: [],
};
