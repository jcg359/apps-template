import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRevisionsApi } from '../../api/revisions';
import { useSubjectsApi } from '../../api/subjects';
import { useAssociationsApi } from '../../api/associations';
import { useFetch, type ApiError } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/Button';
import { Input } from '../../components/Field';
import { ULID } from '../../components/ULID';
import { Timestamp } from '../../components/Timestamp';
import { StatusBadge } from '../../components/StatusBadge';
import { Table, THead, TBody, TR, TH, TD } from '../../components/Table';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { useActiveRevision } from '../../lib/active-revision';
import { useIsAdmin } from '../../lib/permissions';
import { revisionStatus } from '../../api/types';

export function RevisionDetail() {
  const { id } = useParams<{ id: string }>();
  const revId = Number(id);
  const nav = useNavigate();
  const isAdmin = useIsAdmin();
  const { revisionId: activeId, setRevisionId } = useActiveRevision();

  const revs = useRevisionsApi();
  const subjects = useSubjectsApi();
  const associations = useAssociationsApi();

  const rev = useFetch(`rev-${revId}`, () => revs.get(revId), [revId]);
  const subjectChanges = useFetch(
    `rev-${revId}-subjects`,
    () => subjects.listRevisions({ revision_id: revId }),
    [revId],
  );
  const assocChanges = useFetch(
    `rev-${revId}-assocs`,
    () => associations.listRevisionDetails({ revision_id: revId }),
    [revId],
  );

  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState('');
  const [editErr, setEditErr] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  if (rev.isLoading) return <LoadingState />;
  if (rev.error) return <ErrorState error={rev.error} />;
  if (!rev.data) return null;

  const status = revisionStatus(rev.data);
  const isPending = status === 'pending';
  const isActive = activeId === revId;

  async function saveDesc() {
    setEditErr(null);
    try {
      await revs.patch(revId, desc.trim());
      setEditing(false);
      rev.reload();
    } catch (e) {
      setEditErr((e as ApiError).message);
    }
  }

  async function apply() {
    setActionErr(null);
    try {
      await revs.apply(revId);
      rev.reload();
      subjectChanges.reload();
      assocChanges.reload();
    } catch (e) {
      setActionErr((e as ApiError).message);
    }
  }

  async function discard() {
    setActionErr(null);
    try {
      await revs.discard(revId);
      rev.reload();
      subjectChanges.reload();
      assocChanges.reload();
    } catch (e) {
      setActionErr((e as ApiError).message);
    }
  }

  return (
    <>
      <PageHeader
        numeral="§ 02"
        eyebrow={`revision ${rev.data.revision_id}`}
        title={rev.data.revision_description}
        description={
          <span className="inline-flex items-center gap-3 flex-wrap">
            <ULID code={rev.data.revision_code} full />
            <span className="text-ink-300">·</span>
            <StatusBadge status={status} size="md" />
          </span>
        }
        actions={
          <>
            {!isActive && isPending ? (
              <Button onClick={() => setRevisionId(revId)}>Activate</Button>
            ) : null}
            {isPending && isAdmin ? (
              <>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm('Discard this revision? Pending changes will roll back.'))
                      void discard();
                  }}
                >
                  Discard
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (window.confirm('Apply this revision now? This promotes all pending changes.'))
                      void apply();
                  }}
                >
                  Apply
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <ErrorState error={actionErr ? new Error(actionErr) : null} />

      {/* Timeline */}
      <section className="reveal reveal-2 grid grid-cols-1 md:grid-cols-3 gap-0 border-y border-ink-200 mb-12">
        <TimelineEvent
          label="Created"
          when={rev.data.revision_at}
          who={rev.data.revision_by}
        />
        <TimelineEvent
          label="Applied"
          when={rev.data.applied_at}
          who={rev.data.applied_by}
          accent="applied"
        />
        <TimelineEvent
          label="Discarded"
          when={rev.data.discarded_at}
          who={rev.data.discarded_by}
          accent="discarded"
        />
      </section>

      {/* Editable description (admin only, pending only) */}
      {isPending && isAdmin ? (
        <section className="mb-12 reveal reveal-3">
          <h2 className="section-numeral mb-2">description</h2>
          {editing ? (
            <div>
              <Input
                value={desc || rev.data.revision_description}
                onChange={(e) => setDesc(e.target.value)}
                autoFocus
              />
              {editErr ? (
                <p className="mt-1 text-xs text-status-impersonation">{editErr}</p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <Button variant="primary" size="sm" onClick={saveDesc}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-3">
              <p className="font-display text-lg text-ink-900">{rev.data.revision_description}</p>
              <button
                onClick={() => {
                  setDesc(rev.data!.revision_description);
                  setEditing(true);
                }}
                className="text-xs font-display italic text-accent-pending underline underline-offset-2"
              >
                Edit
              </button>
            </div>
          )}
        </section>
      ) : null}

      {/* Subject changes */}
      <section className="reveal reveal-3 mb-14">
        <h2 className="font-display text-2xl text-ink-900 flex items-baseline gap-3 mb-4">
          <span className="section-numeral">02·a</span> Subject changes
        </h2>
        {subjectChanges.isLoading ? <LoadingState /> : null}
        <ErrorState error={subjectChanges.error} />
        {subjectChanges.data?.length === 0 ? (
          <EmptyState
            title="No subject changes in this revision"
            description="Add or edit a user, role, group, filter, or selection while this revision is active."
          />
        ) : null}
        {subjectChanges.data && subjectChanges.data.length > 0 ? (
          <Table>
            <THead>
              <TR>
                <TH width="120px">Type</TH>
                <TH>Identifier</TH>
                <TH>Detail</TH>
                <TH width="140px">State</TH>
                <TH width="120px">Action</TH>
              </TR>
            </THead>
            <TBody>
              {subjectChanges.data.map((row) => {
                const action = row.is_effective ? 'effective' : 'pending';
                return (
                  <TR key={`${row.subject_type}-${row.id}-${action}`}>
                    <TD>
                      <span className="section-numeral text-ink-800">{row.subject_type}</span>
                    </TD>
                    <TD mono>{row.subject_value}</TD>
                    <TD>{row.subject_detail}</TD>
                    <TD>
                      {row.is_effective ? (
                        <StatusBadge status="applied" />
                      ) : (
                        <StatusBadge status="pending" />
                      )}
                    </TD>
                    <TD>
                      <Link
                        to={subjectLink(row.subject_type, row.id)}
                        className="text-xs font-display italic text-accent-pending underline underline-offset-2"
                      >
                        view →
                      </Link>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        ) : null}
      </section>

      {/* Association changes */}
      <section className="reveal reveal-4">
        <h2 className="font-display text-2xl text-ink-900 flex items-baseline gap-3 mb-4">
          <span className="section-numeral">02·b</span> Association changes
        </h2>
        {assocChanges.isLoading ? <LoadingState /> : null}
        <ErrorState error={assocChanges.error} />
        {assocChanges.data?.length === 0 ? (
          <EmptyState
            title="No association changes in this revision"
            description="Assign or revoke a group↔user, group↔role, group↔filter, group↔selection, or impersonation grant while this revision is active."
          />
        ) : null}
        {assocChanges.data && assocChanges.data.length > 0 ? (
          <Table>
            <THead>
              <TR>
                <TH width="160px">Kind</TH>
                <TH>From</TH>
                <TH>To</TH>
                <TH width="120px">Action</TH>
                <TH width="160px">Applied</TH>
              </TR>
            </THead>
            <TBody>
              {assocChanges.data.map((row) => {
                const isRevoke = row.revoked_by_revision_id === revId;
                const appliedAt = isRevoke ? row.revocation_applied_at : row.assignment_applied_at;
                return (
                  <TR key={`${row.association_type}-${row.association_id}-${isRevoke ? 'r' : 'a'}`}>
                    <TD>
                      <span className="section-numeral text-ink-800">{row.association_type}</span>
                    </TD>
                    <TD>
                      <p className="font-mono text-xs">{row.from_value}</p>
                      <p className="text-[11px] text-ink-500">{row.from_detail}</p>
                    </TD>
                    <TD>
                      <p className="font-mono text-xs">{row.to_value}</p>
                      <p className="text-[11px] text-ink-500">{row.to_detail}</p>
                    </TD>
                    <TD>
                      {isRevoke ? (
                        <span className="text-status-impersonation text-xs font-display italic">
                          revoke
                        </span>
                      ) : (
                        <span className="text-accent-pending text-xs font-display italic">
                          assign
                        </span>
                      )}
                    </TD>
                    <TD>
                      {appliedAt ? (
                        <Timestamp iso={appliedAt} mode="both" />
                      ) : (
                        <span className="text-ink-400">— pending —</span>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        ) : null}
      </section>

      <div className="mt-12">
        <button
          onClick={() => nav('/revisions')}
          className="text-xs font-display italic text-ink-500 hover:text-ink-900"
        >
          ← Back to revisions
        </button>
      </div>
    </>
  );
}

function TimelineEvent({
  label,
  when,
  who,
  accent,
}: {
  label: string;
  when: string | null;
  who: string | null;
  accent?: 'applied' | 'discarded';
}) {
  return (
    <div className="px-6 py-5 md:border-r last:border-r-0 border-ink-200">
      <p
        className={`section-numeral ${
          accent === 'applied'
            ? 'text-status-applied'
            : accent === 'discarded'
              ? 'text-status-discarded'
              : ''
        }`}
      >
        {label}
      </p>
      {when ? (
        <>
          <Timestamp iso={when} />
          <p className="mt-1 font-mono text-[11px] text-ink-500">{who}</p>
        </>
      ) : (
        <p className="font-display italic text-ink-400 mt-1">—</p>
      )}
    </div>
  );
}

function subjectLink(type: string, id: number): string {
  return `/subjects/${type}s/${id}`;
}
