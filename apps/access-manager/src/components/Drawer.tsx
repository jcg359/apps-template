import { useEffect, type ReactNode } from 'react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  width = 560,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="flex-1 bg-ink-900/40 backdrop-blur-[1px]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width }}
        className="flex flex-col h-full bg-paper-elevated shadow-2xl border-l border-ink-200 slide-in-right"
      >
        <header className="px-6 py-5 border-b border-ink-200 flex items-start justify-between gap-4">
          <div>
            {eyebrow ? <p className="section-numeral">{eyebrow}</p> : null}
            <h2 className="font-display text-2xl text-ink-900 mt-1">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-400 hover:text-ink-900 transition-colors"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? (
          <footer className="px-6 py-4 border-t border-ink-200 flex justify-end gap-3 bg-paper">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
