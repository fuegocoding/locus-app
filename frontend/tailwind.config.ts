import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#080810',
        surface: '#0E0E1A',
        'surface-raised': '#161626',
        'surface-high': '#1E1E30',
        border: '#252540',
        'border-bright': '#3A3A5C',
        primary: '#7C6FFF',
        'primary-dim': '#5A50CC',
        'primary-glow': '#9D93FF',
        cyan: '#00E5FF',
        'cyan-dim': '#00AACC',
        proximity: '#00FF87',
        'proximity-dim': '#00CC6A',
        convoy: '#4488FF',
        'convoy-dim': '#2266DD',
        foreground: '#F0F0FF',
        muted: '#7070A0',
        'muted-bright': '#A0A0C8',
        error: '#FF4466',
        warning: '#FFAA00',
        success: '#00FF87',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(124, 111, 255, 0.5)',
        'neon-sm': '0 0 10px rgba(124, 111, 255, 0.4)',
        'neon-lg': '0 0 40px rgba(124, 111, 255, 0.6)',
        'neon-cyan': '0 0 20px rgba(0, 229, 255, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 135, 0.5)',
        'neon-blue': '0 0 20px rgba(68, 136, 255, 0.5)',
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(124, 111, 255, 0.2)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glow-cycle': 'glow-cycle 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        orbit: 'orbit 4s linear infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(124, 111, 255, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(124, 111, 255, 0.8)' },
        },
        'glow-cycle': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        orbit: {
          from: { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          to: { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        card: '14px',
        panel: '20px',
      },
    },
  },
  plugins: [],
}

export default config
