import { useState } from 'react';
import { useRevisionsApi } from '../api/revisions';
import { useFetch } from '../api/client';
import { useActiveRevision } from '../lib/active-revision';
import { RevisionSwitcher } from './RevisionSwitcher';
import { shortUlid } from '../lib/format';

export function ActiveRevisionPill() {
  const [open, setOpen] = useState(false);
  const { revisionId } = useActiveRevision();
  const api = useRevisionsApi();

  const { data } = useFetch(
    revisionId !== null ? `revision-${revisionId}` : null,
    () => api.get(revisionId as number),
    [revisionId],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 px-3 h-9 border border-ink-300 hover:border-ink-900 transition-colors bg-paper-elevated"
      >
        <span
          aria-hidden
          className={
            revisionId !== null
              ? 'h-1.5 w-1.5 rounded-full bg-accent-pending'
              : 'h-1.5 w-1.5 rounded-full bg-ink-300'
          }
        />
        <span className="section-numeral text-ink-600 group-hover:text-ink-900">
          revision
        </span>
        <span className="font-mono text-xs text-ink-900">
          {data ? shortUlid(data.revision_code) : revisionId !== null ? `#${revisionId}` : 'none'}
        </span>
      </button>
      <RevisionSwitcher open={open} onClose={() => setOpen(false)} />
    </>
  );
}
