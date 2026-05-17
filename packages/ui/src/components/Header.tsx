import type { ReactNode } from 'react';

export interface HeaderProps {
  title: string;
  nav?: ReactNode;
  right?: ReactNode;
}

export function Header({ title, nav, right }: HeaderProps) {
  return (
    <header className="border-b border-neutral-200 bg-surface">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-8 px-6">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-sm font-bold text-white"
          >
            {title.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            {title}
          </span>
        </div>
        {nav ? <div className="flex-1">{nav}</div> : <div className="flex-1" />}
        {right ? <div className="flex items-center gap-3">{right}</div> : null}
      </div>
    </header>
  );
}
