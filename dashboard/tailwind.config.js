/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'void': '#09090b',
        'abyss': '#18181b',
        'slate-deep': '#27272a',
        
        // Status Colors
        'optimal': '#22c55e',
        'caution': '#f59e0b',
        'critical': '#ef4444',
        'dormant': '#6b7280',
        
        // Accents
        'neon-green': '#4ade80',
        'neon-amber': '#fbbf24',
        'ice-blue': '#38bdf8',
        'leaf-green': '#84cc16',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(74, 222, 128, 0.3)',
        'glow-amber': '0 0 20px rgba(251, 191, 36, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-blue': '0 0 20px rgba(56, 189, 248, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(74, 222, 128, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
