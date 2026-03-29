/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pure black & white design system
        bg: {
          primary: '#000000',
          secondary: '#0a0a0a',
          tertiary: '#111111',
          card: '#141414',
          hover: '#1a1a1a',
          elevated: '#1f1f1f',
        },
        border: {
          subtle: '#1e1e1e',
          DEFAULT: '#2a2a2a',
          strong: '#3a3a3a',
          focus: '#555555',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          muted: '#555555',
          disabled: '#333333',
        },
        // Accent — single accent color: white glow
        accent: {
          white: '#ffffff',
          green: '#00ff88',
          red: '#ff3b3b',
          yellow: '#ffd60a',
          blue: '#4cc9f0',
          purple: '#b5179e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(255,255,255,0.06)',
        'glow': '0 0 20px rgba(255,255,255,0.04)',
        'glow-green': '0 0 20px rgba(0,255,136,0.15)',
        'glow-red': '0 0 20px rgba(255,59,59,0.15)',
        'card': '0 1px 0 rgba(255,255,255,0.03), 0 4px 16px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grid': 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
        'slide-in': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'ticker': 'ticker 30s linear infinite',
      },
    },
  },
  plugins: [],
}

