/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        magenta: {
          DEFAULT: '#E91E8C',
          dark: '#C41876',
          light: '#F472B6',
        },
        purple: {
          DEFAULT: '#2D1B69',
          light: '#4B2D8F',
          dark: '#1A0F3D',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
