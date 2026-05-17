import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({
  children,
  onClick,
  muted,
}: {
  children: ReactNode;
  onClick?: () => void;
  muted?: boolean;
}) {
  return (
    <tr
      onClick={onClick}
      className={clsx(
        'border-b border-ink-200 ledger-row',
        onClick && 'cursor-pointer',
        muted && 'opacity-60',
      )}
    >
      {children}
    </tr>
  );
}

export function TH({
  children,
  align = 'left',
  width,
}: {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}) {
  return (
    <th
      style={width ? { width } : undefined}
      className={clsx(
        'section-numeral pb-2 pt-1 px-3 font-normal',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
      )}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  align = 'left',
  mono,
  numeric,
  className,
}: {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
  numeric?: boolean;
  className?: string;
}) {
  return (
    <td
      className={clsx(
        'py-3 px-3 align-top',
        mono && 'font-mono text-xs',
        numeric && 'tabnum',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  );
}
