/**
 * Tailwind preset that maps the CSS custom properties from tokens.css into
 * Tailwind's theme. Components and apps that consume this preset get utility
 * classes (e.g. `bg-primary-500`, `text-md`, `p-4`) backed by the token values.
 *
 * Consumers must also ensure tokens.css is loaded at runtime (e.g. imported
 * into their global stylesheet) so the CSS variables resolve in the browser.
 *
 * @type {import('tailwindcss').Config}
 */
const preset = {
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      primary: {
        50: 'var(--color-primary-50)',
        100: 'var(--color-primary-100)',
        200: 'var(--color-primary-200)',
        300: 'var(--color-primary-300)',
        400: 'var(--color-primary-400)',
        500: 'var(--color-primary-500)',
        600: 'var(--color-primary-600)',
        700: 'var(--color-primary-700)',
        800: 'var(--color-primary-800)',
        900: 'var(--color-primary-900)',
      },
      neutral: {
        50: 'var(--color-neutral-50)',
        100: 'var(--color-neutral-100)',
        200: 'var(--color-neutral-200)',
        300: 'var(--color-neutral-300)',
        400: 'var(--color-neutral-400)',
        500: 'var(--color-neutral-500)',
        600: 'var(--color-neutral-600)',
        700: 'var(--color-neutral-700)',
        800: 'var(--color-neutral-800)',
        900: 'var(--color-neutral-900)',
      },
      success: { 500: 'var(--color-success-500)' },
      warning: { 500: 'var(--color-warning-500)' },
      danger: { 500: 'var(--color-danger-500)' },
      surface: {
        DEFAULT: 'var(--color-surface-default)',
        muted: 'var(--color-surface-muted)',
        elevated: 'var(--color-surface-elevated)',
      },
      text: {
        DEFAULT: 'var(--color-text-primary)',
        muted: 'var(--color-text-muted)',
        inverse: 'var(--color-text-inverse)',
      },
      border: {
        DEFAULT: 'var(--color-border-default)',
      },
    },
    fontFamily: {
      sans: 'var(--font-family-sans)',
      mono: 'var(--font-family-mono)',
    },
    fontSize: {
      xs: ['var(--font-size-xs)', { lineHeight: 'var(--line-height-normal)' }],
      sm: ['var(--font-size-sm)', { lineHeight: 'var(--line-height-normal)' }],
      md: ['var(--font-size-md)', { lineHeight: 'var(--line-height-normal)' }],
      lg: ['var(--font-size-lg)', { lineHeight: 'var(--line-height-normal)' }],
      xl: ['var(--font-size-xl)', { lineHeight: 'var(--line-height-tight)' }],
      '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-tight)' }],
      '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)' }],
      '4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
      '5xl': ['var(--font-size-5xl)', { lineHeight: 'var(--line-height-tight)' }],
    },
    fontWeight: {
      regular: 'var(--font-weight-regular)',
      medium: 'var(--font-weight-medium)',
      semibold: 'var(--font-weight-semibold)',
      bold: 'var(--font-weight-bold)',
    },
    spacing: {
      0: 'var(--space-0)',
      1: 'var(--space-1)',
      2: 'var(--space-2)',
      3: 'var(--space-3)',
      4: 'var(--space-4)',
      5: 'var(--space-5)',
      6: 'var(--space-6)',
      8: 'var(--space-8)',
      10: 'var(--space-10)',
      12: 'var(--space-12)',
      16: 'var(--space-16)',
      20: 'var(--space-20)',
      24: 'var(--space-24)',
    },
    borderRadius: {
      none: 'var(--radius-none)',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
      '2xl': 'var(--radius-2xl)',
      full: 'var(--radius-full)',
    },
    boxShadow: {
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
      none: 'none',
    },
    extend: {},
  },
  plugins: [],
};

module.exports = preset;
