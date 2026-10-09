/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#1e222a',
          100: '#181b20',
          200: '#14171c',
          300: '#0f1216',
          400: '#0a0c0f',
        },
        brand: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#60a5fa',
          glow: 'rgba(59, 130, 246, 0.15)',
        },
        verdict: {
          ac: '#22c55e',
          wa: '#ef4444',
          tle: '#f59e0b',
          mle: '#8b5cf6',
          ce: '#06b6d4',
          rte: '#ec4899',
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
};
