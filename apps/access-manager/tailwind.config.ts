import type { Config } from 'tailwindcss';
import designTokensPreset from '@repo/design-tokens/tailwind-preset';

const config: Config = {
  presets: [designTokensPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: 'var(--ink-50)',
          100: 'var(--ink-100)',
          200: 'var(--ink-200)',
          300: 'var(--ink-300)',
          400: 'var(--ink-400)',
          500: 'var(--ink-500)',
          600: 'var(--ink-600)',
          700: 'var(--ink-700)',
          800: 'var(--ink-800)',
          900: 'var(--ink-900)',
        },
        paper: {
          DEFAULT: 'var(--paper)',
          elevated: 'var(--paper-elevated)',
        },
        accent: {
          pending: 'var(--accent-pending)',
          'pending-soft': 'var(--accent-pending-soft)',
          'pending-line': 'var(--accent-pending-line)',
        },
        status: {
          applied: 'var(--status-applied)',
          discarded: 'var(--status-discarded)',
          impersonation: 'var(--status-impersonation)',
          'impersonation-soft': 'var(--status-impersonation-soft)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans-am)',
        mono: 'var(--font-mono-am)',
      },
    },
  },
};

export default config;
