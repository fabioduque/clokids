/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ring: '#F59E0B', // amber clock ring + primary accent
        ink: '#5B3415', // deep cocoa text — reads on cream cards over any sky
        ink24: '#C2620E', // 24h secondary numerals / labels
        hourHand: '#EF4444', // RED = horas (pedagogical, do not change)
        minHand: '#2563EB', // BLUE = minutos (pedagogical, do not change)
        bg: '#FFF7ED', // cream fallback behind the sky
        card: '#FFFBF4', // frosted panel surface
        cardline: '#EAD8BD', // hairline border on panels
        sun: '#FBBF24', // sun-gold for primary buttons
      },
      fontFamily: {
        // Body copy: clean, friendly rounded sans.
        rounded: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
        // Display: chunky rounded — headings, the big readout, clock numerals.
        display: ['"Baloo 2"', 'Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 12px 30px -12px rgba(60,30,8,0.35), 0 2px 6px -2px rgba(60,30,8,0.18)',
        sun: '0 8px 0 0 #D97706, 0 14px 22px -6px rgba(217,119,6,0.5)',
        soft: '0 6px 0 0 rgba(234,216,189,0.9), 0 10px 18px -8px rgba(60,30,8,0.25)',
      },
    },
  },
  plugins: [],
}
