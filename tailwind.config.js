/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#009AC7',
          600: '#009AC7',
          700: '#007B9F',
          800: '#005d7a',
          900: '#004054',
        }
      }
    },
  },
  plugins: [],
}
