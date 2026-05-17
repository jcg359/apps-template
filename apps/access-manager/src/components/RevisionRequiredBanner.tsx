import { useState } from 'react';
import { useActiveRevision } from '../lib/active-revision';
import { RevisionSwitcher } from './RevisionSwitcher';

export function RevisionRequiredBanner({ action }: { action: string }) {
  const { revisionId } = useActiveRevision();
  const [open, setOpen] = useState(false);

  if (revisionId !== null) return null;

  return (
    <>
      <div className="border border-accent-pending-line bg-accent-pending-soft/60 p-4 mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="section-numeral text-accent-pending">no active revision</p>
          <p className="text-sm text-ink-800 mt-1">
            To {action}, choose or create a pending revision first.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-display text-accent-pending underline underline-offset-2 hover:no-underline"
        >
          Open revision switcher →
        </button>
      </div>
      <RevisionSwitcher open={open} onClose={() => setOpen(false)} />
    </>
  );
}
