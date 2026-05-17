import { useState } from 'react';
import { useAssociationsApi } from '../api/associations';
import { useFetch, type ApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Drawer } from '../components/Drawer';
import { FieldGroup, Input } from '../components/Field';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { StatusBadge } from '../components/StatusBadge';
import { Timestamp } from '../components/Timestamp';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { useActiveRevision } from '../lib/active-revision';
import { useIsAdmin } from '../lib/permissions';
import { RevisionRequiredBanner } from '../components/RevisionRequiredBanner';
import type { ImpersonationGrantAssociation } from '../api/types';

export function Impersonation() {
  const api = useAssociationsApi();
  const isAdmin = useIsAdmin();
  const { revisionId } = useActiveRevision();
  const [adding, setAdding] = useState(false);

  // Default view: pass a non-restrictive revision filter (1=any pending). API requires at least one filter.
  // We'll use revision_id=null isn't valid; instead use grant_to_user_id=0 to fetch nothing then prompt.
  // Better: list pending under any active revision context, or fetch by impersonator search.
  const [searchEmail, setSearchEmail] = useState('');
  const [searchId, setSearchId] = useState<number | null>(null);

  const { data, error, isLoading, reload } = useFetch(
    searchId !== null ? `imp-grant-by-${searchId}` : revisionId ? `imp-grant-rev-${revisionId}` : null,
    () => {
      if (searchId !== null) return api.listImpersonationGrants({ grant_to_user_id: searchId });
      if (revisionId !== null) return api.listImpersonationGrants({ revision_id: revisionId });
      return Promise.resolve([] as ImpersonationGrantAssociation[]);
    },
    [searchId, revisionId],
  );

  return (
    <>
      <PageHeader
        numeral="§ 05"
        eyebrow="impersonation"
        title="Grants"
        description="Allow specific users to view the platform as another user (by user ID, or by email pattern). Used sparingly: every impersonation is auditable on the profile page."
        actions={
          isAdmin ? (
            <Button variant="primary" onClick={() => setAdding(true)}>
              + New grant
            </Button>
          ) : undefined
        }
      />

      <div className="reveal reveal-2 mb-6 flex items-end gap-4">
        <div className="flex-1 max-w-xs">
          <p className="section-numeral mb-1.5">filter by grant_to_user_id</p>
          <Input
            type="number"
            placeholder="user id…"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => setSearchId(Number(searchEmail) || null)}
        >
          Apply
        </Button>
        {searchId !== null ? (
          <Button variant="ghost" onClick={() => { setSearchId(null); setSearchEmail(''); }}>
            Clear
          </Button>
        ) : null}
      </div>

      {searchId === null && revisionId === null ? (
        <div className="border border-ink-200 bg-paper-elevated p-6 text-center">
          <p className="section-numeral">filter required</p>
          <p className="text-sm text-ink-600 mt-2">
            Filter by user ID, or set an active revision to see grants tied to it.
          </p>
        </div>
      ) : null}

      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />
      {data && data.length === 0 ? <EmptyState title="No matching grants" /> : null}

      {data && data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Grantee</TH>
              <TH>Impersonates</TH>
              <TH width="140px">Status</TH>
              <TH width="180px">Assigned</TH>
              <TH width="180px">Revoked</TH>
            </TR>
          </THead>
          <TBody>
            {data.map((g) => {
              const revoked = g.revoked_by_revision_id !== null;
              return (
                <TR key={g.association_id} muted={revoked && g.revocation_applied_at !== null}>
                  <TD mono>{g.grant_to_user_email}</TD>
                  <TD mono>
                    {g.can_impersonate_user_email ?? (
                      <span className="italic font-display text-ink-600">
                        pattern: {g.can_impersonate_email_pattern}
                      </span>
                    )}
                  </TD>
                  <TD>
                    {g.assignment_applied_at === null ? (
                      <StatusBadge status="pending" />
                    ) : revoked ? (
                      g.revocation_applied_at === null ? (
                        <span className="text-xs font-display italic text-accent-pending">revoke pending</span>
                      ) : (
                        <StatusBadge status="discarded" />
                      )
                    ) : (
                      <StatusBadge status="applied" />
                    )}
                  </TD>
                  <TD>
                    <Timestamp iso={g.assignment_applied_at} mode="both" />
                  </TD>
                  <TD>
                    <Timestamp iso={g.revocation_applied_at} mode="both" />
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      ) : null}

      {adding ? (
        revisionId === null ? (
          <div className="mt-6">
            <RevisionRequiredBanner action="create an impersonation grant" />
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        ) : (
          <NewGrantDrawer
            onClose={() => setAdding(false)}
            onAdded={() => { setAdding(false); reload(); }}
            revisionId={revisionId}
          />
        )
      ) : null}
    </>
  );
}

function NewGrantDrawer({
  onClose,
  onAdded,
  revisionId,
}: {
  onClose: () => void;
  onAdded: () => void;
  revisionId: number;
}) {
  const api = useAssociationsApi();
  const [granteeId, setGranteeId] = useState('');
  const [targetMode, setTargetMode] = useState<'user' | 'pattern'>('user');
  const [targetId, setTargetId] = useState('');
  const [pattern, setPattern] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      await api.upsertImpersonationGrant({
        grant_to_user_id: Number(granteeId),
        can_impersonate_user_id: targetMode === 'user' ? Number(targetId) : null,
        can_impersonate_email_pattern: targetMode === 'pattern' ? pattern.trim() : null,
        assigned_by_revision_id: revisionId,
        revoked_by_revision_id: null,
      });
      onAdded();
    } catch (e) {
      setErr((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = !!granteeId && (targetMode === 'user' ? !!targetId : !!pattern.trim());

  return (
    <Drawer
      open
      onClose={onClose}
      eyebrow="§ new grant"
      title="Grant impersonation"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!canSubmit || busy}>
            {busy ? 'Adding…' : 'Add to revision'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600 mb-6">
        The grantee will be able to view the platform as the target. Choose either a specific
        user or an email pattern (e.g. <span className="font-mono">*@partners.example.com</span>).
      </p>

      <FieldGroup label="Grant to (user subject ID)" required>
        <Input
          type="number"
          value={granteeId}
          onChange={(e) => setGranteeId(e.target.value)}
          autoFocus
        />
      </FieldGroup>

      <FieldGroup label="Can impersonate">
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setTargetMode('user')}
            className={`section-numeral px-3 h-7 border ${targetMode === 'user' ? 'bg-ink-900 text-paper border-ink-900' : 'border-ink-300 text-ink-700'}`}
          >
            specific user
          </button>
          <button
            type="button"
            onClick={() => setTargetMode('pattern')}
            className={`section-numeral px-3 h-7 border ${targetMode === 'pattern' ? 'bg-ink-900 text-paper border-ink-900' : 'border-ink-300 text-ink-700'}`}
          >
            email pattern
          </button>
        </div>
        {targetMode === 'user' ? (
          <Input
            type="number"
            placeholder="user subject ID"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          />
        ) : (
          <Input
            placeholder="*@example.com"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          />
        )}
      </FieldGroup>

      {err ? <p className="mt-1 text-xs text-status-impersonation">{err}</p> : null}
    </Drawer>
  );
}
