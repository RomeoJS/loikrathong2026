/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        thai: {
          gold: '#f59e0b',
          'gold-light': '#fde68a',
          'gold-dark': '#b45309',
          navy: '#0f172a',
          'navy-light': '#1e293b',
          maroon: '#881337',
          lotus: '#e11d48'
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Sarabun', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
