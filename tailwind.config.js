/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/renderer/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        zen: {
          bg: '#111113',
          surface: '#18181B',
          card: '#1F1F23',
          border: '#2A2A2F',
          text: '#ECECEF',
          muted: '#71717A',
          sage: '#7DD3A8',
          amber: '#F5C16C',
          coral: '#F07A7A',
          blue: '#7AACF0',
          purple: '#A78BF6',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'breathe-slow': 'breathe 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      }
    },
  },
  plugins: [],
}
