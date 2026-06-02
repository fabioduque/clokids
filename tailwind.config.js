/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ring: '#F59E0B',
        ink: '#92400E',
        ink24: '#FB923C',
        hourHand: '#EF4444',
        minHand: '#3B82F6',
        bg: '#FFF7ED',
      },
      fontFamily: {
        rounded: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
