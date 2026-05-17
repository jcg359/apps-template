import type { Config } from 'tailwindcss';
import designTokensPreset from '@repo/design-tokens/tailwind-preset';

const config: Config = {
  presets: [designTokensPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
