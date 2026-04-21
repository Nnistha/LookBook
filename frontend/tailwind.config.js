/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          900: '#4A111A',
          800: '#5C1520',
          700: '#6E1F2A', // Primary Burgundy
          600: '#8A2735',
          500: '#A33041',
        },
        blush: {
          400: '#D5A8AA',
          500: '#E8C7C8', // Secondary Muted blush pink
          600: '#F1D9DA',
        },
        cream: {
          400: '#E6DDD9',
          500: '#F5EDEB', // Accent Soft nude/cream
          600: '#FAF5F3',
        },
        offwhite: '#F8F5F4',
        dark: '#1A1818',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'sans-serif'],
        serif: ['Playfair Display', 'Bodoni Moda', 'serif'],
      },
      letterSpacing: {
        widest: '.2em',
        widestest: '.3em',
      }
    },
  },
  plugins: [],
}
