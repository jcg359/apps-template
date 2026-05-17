import { useState } from 'react';
import { useRevisionsApi } from '../api/revisions';
import { useFetch } from '../api/client';
import { useActiveRevision } from '../lib/active-revision';
import { useIsAdmin } from '../lib/permissions';
import { Button } from './Button';
import { Drawer } from './Drawer';
import { FieldGroup, Input } from './Field';
import { ULID } from './ULID';
import { Timestamp } from './Timestamp';
import { ErrorState, LoadingState } from './States';
import type { ApiError } from '../api/client';

export function RevisionSwitcher({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const isAdmin = useIsAdmin();
  const api = useRevisionsApi();
  const { revisionId, setRevisionId, clear } = useActiveRevision();

  const { data, error, isLoading, reload } = useFetch(
    open ? 'pending-revisions' : null,
    () => api.listPending(),
  );

  const [creating, setCreating] = useState(false);
  const [desc, setDesc] = useState('');
  const [createErr, setCreateErr] = useState<string | null>(null);

  async function createNew() {
    if (!desc.trim()) return;
    setCreateErr(null);
    try {
      const r = await api.create(desc.trim());
      setRevisionId(r.revision_id);
      setCreating(false);
      setDesc('');
      reload();
      onClose();
    } catch (e) {
      setCreateErr((e as ApiError).message);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="§ active revision"
      title="Switch revision context"
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={() => { clear(); onClose(); }}>
            Clear context
          </Button>
          {isAdmin ? (
            creating ? (
              <Button variant="primary" onClick={createNew}>
                Create &amp; activate
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setCreating(true)}>
                + New revision
              </Button>
            )
          ) : null}
        </>
      }
    >
      {creating ? (
        <div className="reveal">
          <FieldGroup
            label="Revision description"
            hint="A short note explaining the intent of this change-set."
            error={createErr}
          >
            <Input
              autoFocus
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Add new analyst group"
            />
          </FieldGroup>
          <Button variant="ghost" onClick={() => setCreating(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-600 mb-4">
            Pick a pending revision. All subject and association edits will land on this
            change-set until applied or discarded.
          </p>
          {isLoading ? <LoadingState /> : null}
          <ErrorState error={error} />
          {data?.revisions.length === 0 ? (
            <div className="border-y border-ink-200 py-10 text-center text-sm text-ink-500 italic font-display">
              No pending revisions in the last 7 days.
            </div>
          ) : null}
          <ul className="divide-y divide-ink-200 border-y border-ink-200">
            {data?.revisions.map((r) => {
              const active = r.revision_id === revisionId;
              return (
                <li key={r.revision_id}>
                  <button
                    type="button"
                    onClick={() => {
                      setRevisionId(r.revision_id);
                      onClose();
                    }}
                    className={`w-full text-left py-3 px-1 hover:bg-ink-50 ${active ? 'bg-accent-pending-soft/50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-ink-900 truncate">{r.revision_description}</p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-500">
                          <ULID code={r.revision_code} />
                          <span>·</span>
                          <Timestamp iso={r.revision_at} mode="rel" />
                          <span>·</span>
                          <span className="font-mono">{r.revision_by}</span>
                        </div>
                      </div>
                      {active ? (
                        <span className="text-accent-pending text-xs font-display italic">active</span>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Drawer>
  );
}
