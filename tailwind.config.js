/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: '#050507',
          deep: '#030304',
          surface: '#0B0B10',
          glass: '#111116',
          border: 'rgba(255, 255, 255, 0.08)'
        },
        cyan: {
          glow: '#06B6D4',
          accent: '#22D3EE'
        },
        violet: {
          glow: '#8B5CF6',
          accent: '#A78BFA'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ]
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite alternate',
      },
      keyframes: {
        wave: {
          '0%, 100%': { height: '6px' },
          '50%': { height: '24px' },
        },
        glowPulse: {
          '0%': { opacity: '0.4', transform: 'scale(0.98)' },
          '100%': { opacity: '0.8', transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
