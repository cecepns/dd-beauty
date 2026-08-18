/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beauty: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        gold: {
          50: '#fdfbf7',
          100: '#f9f4ea',
          200: '#f1e6cd',
          300: '#e5d1a7',
          400: '#d5b77c',
          500: '#c59d53',
          600: '#b08341',
          700: '#8f6534',
          800: '#75512e',
          900: '#63442a',
        },
        champagne: {
          light: '#FFF8F0',
          base: '#F5E6D3',
          dark: '#E0C9A6',
        }
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
