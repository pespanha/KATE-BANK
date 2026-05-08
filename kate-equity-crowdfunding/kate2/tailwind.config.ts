import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kate: {
          yellow:    '#FCA310',
          'dark-blue': '#14213C',
          'light-gray': '#CBD1D3',
          'dark-gray': '#747C7C',
          dark:      '#050609',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-in-out',
        'slide-up':  'slideUp 0.3s ease-out',
        'pulse-glow':'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow:{ '0%, 100%': { boxShadow: '0 0 0 0 rgba(252, 163, 16, 0.4)' }, '50%': { boxShadow: '0 0 20px 8px rgba(252, 163, 16, 0.15)' } },
      },
      backgroundImage: {
        'kate-gradient': 'linear-gradient(135deg, #14213C 0%, #0d162a 100%)',
        'kate-card':     'linear-gradient(135deg, #14213C 0%, #1a2a4a 100%)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

export default config
