import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRevisionsApi } from '../../api/revisions';
import { useFetch, type ApiError } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/Button';
import { Drawer } from '../../components/Drawer';
import { FieldGroup, Input } from '../../components/Field';
import { Table, THead, TBody, TR, TH, TD } from '../../components/Table';
import { ULID } from '../../components/ULID';
import { Timestamp } from '../../components/Timestamp';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { useActiveRevision } from '../../lib/active-revision';
import { useIsAdmin } from '../../lib/permissions';
import { daysAgoISO, todayISO } from '../../lib/format';
import { revisionStatus } from '../../api/types';

type Segment = 'pending' | 'applied';

export function RevisionsIndex() {
  const api = useRevisionsApi();
  const nav = useNavigate();
  const isAdmin = useIsAdmin();
  const { setRevisionId } = useActiveRevision();

  const [seg, setSeg] = useState<Segment>('pending');
  const [from, setFrom] = useState(daysAgoISO(7));
  const [to, setTo] = useState(todayISO());

  const [creating, setCreating] = useState(false);

  const { data, error, isLoading, reload } = useFetch(
    `${seg}-${from}-${to}`,
    () => (seg === 'pending' ? api.listPending(from, to) : api.listApplied(from, to)),
    [seg, from, to],
  );

  return (
    <>
      <PageHeader
        numeral="§ 02"
        eyebrow="revisions"
        title="Change-set ledger"
        description="Every change to subjects or associations rides on a revision. Nothing takes effect until applied."
        actions={
          isAdmin ? (
            <Button variant="primary" onClick={() => setCreating(true)}>
              + New revision
            </Button>
          ) : undefined
        }
      />

      <div className="reveal reveal-2 mb-6 flex items-center justify-between gap-4">
        <div className="flex border border-ink-300 divide-x divide-ink-300">
          <SegBtn active={seg === 'pending'} onClick={() => setSeg('pending')}>
            Pending
          </SegBtn>
          <SegBtn active={seg === 'applied'} onClick={() => setSeg('applied')}>
            Applied
          </SegBtn>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="section-numeral">range</span>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="!w-auto !py-1 !px-2"
          />
          <span className="text-ink-400">→</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="!w-auto !py-1 !px-2"
          />
        </div>
      </div>

      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />

      {!isLoading && data?.revisions.length === 0 ? (
        <EmptyState
          title={seg === 'pending' ? 'No pending revisions' : 'No applied revisions'}
          description="Adjust the date range, or start a new change-set."
        />
      ) : null}

      {data && data.revisions.length > 0 ? (
        <div className="reveal reveal-3 border-t-strong border-ink-700">
          <Table>
            <THead>
              <TR>
                <TH width="200px">Code</TH>
                <TH>Description</TH>
                <TH width="180px">Created</TH>
                <TH width="180px">
                  {seg === 'pending' ? 'Discarded?' : 'Applied'}
                </TH>
                <TH width="120px">Status</TH>
              </TR>
            </THead>
            <TBody>
              {data.revisions.map((r) => (
                <TR key={r.revision_id} onClick={() => nav(`/revisions/${r.revision_id}`)}>
                  <TD>
                    <ULID code={r.revision_code} />
                  </TD>
                  <TD>
                    <p className="text-ink-900">{r.revision_description}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRevisionId(r.revision_id);
                      }}
                      className="mt-1 text-[11px] font-display italic text-accent-pending underline underline-offset-2"
                    >
                      Activate
                    </button>
                  </TD>
                  <TD>
                    <Timestamp iso={r.revision_at} mode="both" />
                    <p className="mt-0.5 font-mono text-[11px] text-ink-500">{r.revision_by}</p>
                  </TD>
                  <TD>
                    {seg === 'pending' ? (
                      r.discarded_at ? (
                        <Timestamp iso={r.discarded_at} mode="both" />
                      ) : (
                        <span className="text-ink-400">—</span>
                      )
                    ) : (
                      <>
                        <Timestamp iso={r.applied_at} mode="both" />
                        <p className="mt-0.5 font-mono text-[11px] text-ink-500">{r.applied_by}</p>
                      </>
                    )}
                  </TD>
                  <TD>
                    <StatusBadge status={revisionStatus(r)} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      ) : null}

      {creating ? (
        <NewRevisionDrawer
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            reload();
            nav(`/revisions/${id}`);
          }}
        />
      ) : null}
    </>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 h-8 text-xs section-numeral transition-colors ${
        active ? 'bg-ink-900 text-paper' : 'bg-paper-elevated text-ink-700 hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  );
}

function NewRevisionDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const api = useRevisionsApi();
  const { setRevisionId } = useActiveRevision();
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!desc.trim()) return;
    setErr(null);
    setBusy(true);
    try {
      const r = await api.create(desc.trim());
      setRevisionId(r.revision_id);
      onCreated(r.revision_id);
    } catch (e) {
      setErr((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow="§ new revision"
      title="Open a change-set"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || !desc.trim()}>
            {busy ? 'Creating…' : 'Create & activate'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600 mb-6">
        A revision groups subject and association edits so they apply atomically. The new
        revision will become your active context.
      </p>
      <FieldGroup
        label="Description"
        required
        hint="A short note, e.g. 'Add analyst group + onboard Q2 hires'."
        error={err}
      >
        <Input
          autoFocus
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What is this change-set for?"
        />
      </FieldGroup>
    </Drawer>
  );
}
