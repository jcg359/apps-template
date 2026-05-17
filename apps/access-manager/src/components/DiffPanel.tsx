import type { ReactNode } from 'react';
import clsx from 'clsx';

export interface DiffPanelProps {
  effective: ReactNode | null;
  pending: ReactNode | null;
  effectiveLabel?: string;
  pendingLabel?: string;
}

/**
 * Side-by-side render of an entity's effective state vs its pending revision
 * change. Both sides nullable. Asymmetric grid (5 / 7) keeps the eye on pending.
 */
export function DiffPanel({
  effective,
  pending,
  effectiveLabel = 'Effective',
  pendingLabel = 'Pending',
}: DiffPanelProps) {
  const showBoth = effective && pending;

  return (
    <div
      className={clsx(
        'grid gap-0 border-y border-ink-200',
        showBoth ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1',
      )}
    >
      <section
        className={clsx(
          'p-6',
          showBoth && 'lg:col-span-5 border-b lg:border-b-0 lg:border-r border-ink-200',
        )}
      >
        <p className="section-numeral mb-3">{effectiveLabel}</p>
        {effective ?? <EmptySide label="No effective revision yet" />}
      </section>
      {pending ? (
        <section
          className={clsx(
            'p-6 bg-accent-pending-soft/40 slide-in-right',
            showBoth ? 'lg:col-span-7' : '',
          )}
        >
          <p className="section-numeral mb-3 text-accent-pending">{pendingLabel}</p>
          {pending}
        </section>
      ) : null}
    </div>
  );
}

function EmptySide({ label }: { label: string }) {
  return <p className="font-display italic text-ink-400">{label}</p>;
}
