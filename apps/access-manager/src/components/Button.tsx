import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center gap-2 font-display tracking-tight transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        size === 'sm' ? 'h-7 px-3 text-xs' : 'h-9 px-4 text-sm',
        variant === 'primary' &&
          'bg-ink-900 text-paper hover:bg-ink-800 border border-ink-900',
        variant === 'secondary' &&
          'bg-paper-elevated text-ink-900 border border-ink-300 hover:border-ink-900',
        variant === 'ghost' &&
          'bg-transparent text-ink-700 hover:text-ink-900 hover:bg-ink-100',
        variant === 'danger' &&
          'bg-paper-elevated text-status-impersonation border border-status-impersonation hover:bg-status-impersonation-soft',
        className,
      )}
    >
      {children}
    </button>
  );
}
