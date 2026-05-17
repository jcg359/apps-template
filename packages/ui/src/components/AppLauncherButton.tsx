'use client';

import { useEffect, useRef, useState } from 'react';
import { AppCardGrid } from './AppCardGrid';
import type { AppDefinition } from './AppCard';
import { PlusIcon } from './icons';

export interface AppLauncherButtonProps {
  apps: AppDefinition[];
  label?: string;
}

export function AppLauncherButton({ apps, label = 'Switch app' }: AppLauncherButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-surface text-neutral-700 shadow-sm transition-colors hover:border-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
      >
        <PlusIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={label}
          onClick={() => setOpen(false)}
          className="absolute right-0 z-50 mt-2 w-[420px] rounded-xl border border-neutral-200 bg-surface p-4 shadow-lg"
        >
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-sm font-semibold text-neutral-900">{label}</p>
            <p className="text-xs text-neutral-500">{apps.length} apps</p>
          </div>
          <AppCardGrid apps={apps} density="compact" />
        </div>
      ) : null}
    </div>
  );
}
