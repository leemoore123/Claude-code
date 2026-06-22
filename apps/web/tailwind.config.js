/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens carried over from the QST / Fincantieri portals
        navy: { DEFAULT: '#0d1b2e', 800: '#152540', 700: '#1e3356' },
        brand: { DEFAULT: '#185FA5', light: '#E6F1FB', mid: '#378ADD', dark: '#0C447C' },
        accent: '#0ea5e9',
        teal: '#0d9488',
        ink: '#0d1b2e',
        muted: '#64748b',
        line: '#e2e8f0',
        ok: '#10b981',
        warn: '#f59e0b',
        danger: '#ef4444',
        purple: '#7c3aed',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: { card: '12px' },
    },
  },
  plugins: [],
};
