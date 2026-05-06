import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#04040a',
        panel: '#0c0e18',
        panelSoft: '#121525',
        ink: '#eef2ff',
        muted: '#8b93ad',
        cyanAura: '#31d7ff',
        violetAura: '#9d7bff',
        hotAura: '#ff4d7d',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        aura: '0 0 60px rgba(49, 215, 255, 0.24)',
        panel: '0 24px 80px rgba(0, 0, 0, 0.36)',
      },
      backgroundImage: {
        'radial-grid': 'radial-gradient(circle at top left, rgba(49, 215, 255, 0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(157, 123, 255, 0.2), transparent 36%)',
      },
    },
  },
  plugins: [],
};

export default config;
