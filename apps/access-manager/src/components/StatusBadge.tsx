import clsx from 'clsx';
import type { RevisionStatus } from '../api/types';

export function StatusBadge({
  status,
  size = 'sm',
}: {
  status: RevisionStatus;
  size?: 'sm' | 'md';
}) {
  const label =
    status === 'pending' ? 'Pending' : status === 'applied' ? 'Applied' : 'Discarded';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-display italic',
        size === 'sm' ? 'text-[11px]' : 'text-xs',
      )}
    >
      <Dot status={status} />
      <span
        className={clsx(
          status === 'pending' && 'text-accent-pending',
          status === 'applied' && 'text-status-applied',
          status === 'discarded' && 'text-status-discarded line-through',
        )}
      >
        {label}
      </span>
    </span>
  );
}

function Dot({ status }: { status: RevisionStatus }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-block h-1.5 w-1.5 rounded-full',
        status === 'pending' && 'bg-accent-pending',
        status === 'applied' && 'bg-status-applied',
        status === 'discarded' && 'bg-status-discarded',
      )}
    />
  );
}
