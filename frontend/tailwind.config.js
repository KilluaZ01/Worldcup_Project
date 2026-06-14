/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#1e293b',
        ink: '#f8fafc',
        arik: '#3b82f6',
        jiten: '#ef4444',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(148,163,184,0.12), 0 10px 30px rgba(15,23,42,0.35)',
      },
    },
  },
  plugins: [],
}
