import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0f0f10',
          soft: '#1c1c1e',
          muted: '#6b6b70',
          faint: '#a0a0a5'
        },
        paper: {
          DEFAULT: '#fafaf7',
          card: '#ffffff',
          hover: '#f2f2ee'
        },
        line: {
          DEFAULT: '#e6e5e0',
          strong: '#d2d1cb'
        },
        accent: {
          DEFAULT: '#0f766e',
          soft: '#e6f2f0'
        },
        warn: '#a16207',
        danger: '#b91c1c'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em' }]
      },
      borderRadius: {
        DEFAULT: '4px',
        lg: '6px'
      },
      boxShadow: {
        subtle: '0 1px 0 rgba(15, 15, 16, 0.04)'
      }
    }
  },
  plugins: []
};

export default config;
