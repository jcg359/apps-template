// Re-export anything consumers may want at build time.
// The CSS tokens themselves are imported via "@repo/design-tokens/tokens.css".
// The Tailwind preset is consumed via "@repo/design-tokens/tailwind-preset".

export const tokensCssPath = '@repo/design-tokens/tokens.css';
export const tailwindPresetPath = '@repo/design-tokens/tailwind-preset';
