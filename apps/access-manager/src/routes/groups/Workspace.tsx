import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useSubjectsApi } from '../../api/subjects';
import { useAssociationsApi } from '../../api/associations';
import { useFetch, type ApiError } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/Button';
import { Drawer } from '../../components/Drawer';
import { FieldGroup, Input, Select } from '../../components/Field';
import { Table, THead, TBody, TR, TH, TD } from '../../components/Table';
import { StatusBadge } from '../../components/StatusBadge';
import { Timestamp } from '../../components/Timestamp';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { useActiveRevision } from '../../lib/active-revision';
import { useIsAdmin } from '../../lib/permissions';
import { RevisionRequiredBanner } from '../../components/RevisionRequiredBanner';
import { SubjectDrawer } from '../subjects/SubjectDrawer';
import type {
  GroupSubject,
  GroupFilterAssociation,
  GroupRoleAssociation,
  GroupSelectionAssociation,
  GroupUserAssociation,
} from '../../api/types';

type AssocKind = 'users' | 'roles' | 'filters' | 'selections';

export function GroupWorkspace() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const isAdmin = useIsAdmin();
  const { revisionId } = useActiveRevision();
  const subjects = useSubjectsApi();
  const assocs = useAssociationsApi();
  const [editingGroup, setEditingGroup] = useState(false);

  const group = useFetch(`group-${groupId}`, () => subjects.getGroup(groupId), [groupId]);
  const usersA = useFetch(`group-${groupId}-users`, () => assocs.listGroupUsers({ group_id: groupId }), [groupId]);
  const rolesA = useFetch(`group-${groupId}-roles`, () => assocs.listGroupRoles({ group_id: groupId }), [groupId]);
  const filtersA = useFetch(`group-${groupId}-filters`, () => assocs.listGroupFilters({ group_id: groupId }), [groupId]);
  const selectionsA = useFetch(`group-${groupId}-selections`, () => assocs.listGroupSelections({ group_id: groupId }), [groupId]);

  const [addKind, setAddKind] = useState<AssocKind | null>(null);

  if (Number.isNaN(groupId)) return <Navigate to="/groups" />;
  if (group.isLoading) return <LoadingState />;
  if (group.error) return <ErrorState error={group.error} />;
  if (!group.data) return null;

  const g = (group.data.effective ?? group.data.pending) as GroupSubject | null;
  if (!g) return <ErrorState error={new Error('Group not found')} />;

  return (
    <>
      <PageHeader
        numeral="§ 04"
        eyebrow="group workspace"
        title={g.group_name}
        description={
          <span className="inline-flex items-center gap-3">
            <span className="font-mono text-sm text-ink-700">{g.group_code}</span>
            {group.data.effective ? <StatusBadge status="applied" size="md" /> : null}
            {group.data.pending ? <StatusBadge status="pending" size="md" /> : null}
          </span>
        }
        actions={
          isAdmin ? (
            <Button onClick={() => setEditingGroup(true)}>Edit group</Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-12">
        <AssocPanel
          numeral="04·a"
          title="Members"
          subtitle="Users in this group."
          rows={usersA.data}
          isLoading={usersA.isLoading}
          error={usersA.error}
          onAdd={() => setAddKind('users')}
          isAdmin={isAdmin}
          renderRow={(row) => (
            <>
              <TD mono>
                <Link to={`/subjects/users/${row.user_id}`} className="hover:underline underline-offset-2">
                  {row.user_email}
                </Link>
              </TD>
              <TD>{row.user_is_active ? '✓' : <span className="text-ink-400">—</span>}</TD>
            </>
          )}
          headers={['Email', 'Active']}
          revisionId={revisionId}
          reload={usersA.reload}
          revoker={(rev) =>
            assocs.upsertGroupUser({
              group_id: groupId,
              user_id: 0, // not used by the call - signature requires it
              assigned_by_revision_id: rev.assigned_by_revision_id,
              revoked_by_revision_id: rev.revoked_by_revision_id,
            })
          }
        />
        <AssocPanel
          numeral="04·b"
          title="Roles"
          subtitle="Roles granted to members of this group."
          rows={rolesA.data}
          isLoading={rolesA.isLoading}
          error={rolesA.error}
          onAdd={() => setAddKind('roles')}
          isAdmin={isAdmin}
          renderRow={(row) => (
            <>
              <TD mono>
                <Link to={`/subjects/roles/${row.role_id}`} className="hover:underline underline-offset-2">
                  {row.role_code}
                </Link>
              </TD>
              <TD>{row.role_name}</TD>
            </>
          )}
          headers={['Code', 'Name']}
          revisionId={revisionId}
          reload={rolesA.reload}
          revoker={async () => undefined}
        />
        <AssocPanel
          numeral="04·c"
          title="Filters"
          subtitle="Row predicates attached to this group."
          rows={filtersA.data}
          isLoading={filtersA.isLoading}
          error={filtersA.error}
          onAdd={() => setAddKind('filters')}
          isAdmin={isAdmin}
          renderRow={(row) => (
            <>
              <TD mono>
                <Link to={`/subjects/filters/${row.filter_id}`} className="hover:underline underline-offset-2">
                  {row.filter_code}
                </Link>
              </TD>
              <TD>{row.filter_name}</TD>
              <TD mono>{row.filter_dataset_name}</TD>
            </>
          )}
          headers={['Code', 'Name', 'Dataset']}
          revisionId={revisionId}
          reload={filtersA.reload}
          revoker={async () => undefined}
        />
        <AssocPanel
          numeral="04·d"
          title="Selections"
          subtitle="Field visibility attached to this group."
          rows={selectionsA.data}
          isLoading={selectionsA.isLoading}
          error={selectionsA.error}
          onAdd={() => setAddKind('selections')}
          isAdmin={isAdmin}
          renderRow={(row) => (
            <>
              <TD mono>
                <Link to={`/subjects/selections/${row.selection_id}`} className="hover:underline underline-offset-2">
                  {row.selection_code}
                </Link>
              </TD>
              <TD>{row.selection_name}</TD>
              <TD mono>{row.selection_dataset_name}</TD>
            </>
          )}
          headers={['Code', 'Name', 'Dataset']}
          revisionId={revisionId}
          reload={selectionsA.reload}
          revoker={async () => undefined}
        />
      </div>

      {editingGroup && revisionId === null ? (
        <div className="mt-6">
          <RevisionRequiredBanner action="edit this group" />
        </div>
      ) : null}
      {editingGroup && revisionId !== null ? (
        <SubjectDrawer
          open
          onClose={() => setEditingGroup(false)}
          onSaved={group.reload}
          revisionId={revisionId}
          subjectType="group"
          subjectId={groupId}
          existing={g}
        />
      ) : null}

      {addKind ? (
        <AddAssocDrawer
          kind={addKind}
          groupId={groupId}
          onClose={() => setAddKind(null)}
          onAdded={() => {
            setAddKind(null);
            usersA.reload();
            rolesA.reload();
            filtersA.reload();
            selectionsA.reload();
          }}
        />
      ) : null}
    </>
  );
}

interface AssocPanelProps<T extends { association_id: number; assigned_by_revision_id: number; revoked_by_revision_id: number | null; assignment_applied_at: string | null; revocation_applied_at: string | null }> {
  numeral: string;
  title: string;
  subtitle: string;
  rows: T[] | undefined;
  isLoading: boolean;
  error: ApiError | null;
  onAdd: () => void;
  isAdmin: boolean;
  renderRow: (row: T) => React.ReactNode;
  headers: string[];
  revisionId: number | null;
  reload: () => void;
  revoker: (row: T) => Promise<unknown>;
}

function AssocPanel<T extends { association_id: number; assigned_by_revision_id: number; revoked_by_revision_id: number | null; assignment_applied_at: string | null; revocation_applied_at: string | null }>(
  props: AssocPanelProps<T>,
) {
  const { numeral, title, subtitle, rows, isLoading, error, onAdd, isAdmin, renderRow, headers } = props;

  return (
    <section className="reveal reveal-2">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="section-numeral">{numeral}</p>
          <h2 className="font-display text-xl text-ink-900 leading-tight mt-0.5">{title}</h2>
          <p className="text-xs text-ink-500 mt-1">{subtitle}</p>
        </div>
        {isAdmin ? (
          <Button size="sm" variant="secondary" onClick={onAdd}>
            + Add
          </Button>
        ) : null}
      </div>

      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />
      {rows && rows.length === 0 ? (
        <p className="font-display italic text-ink-400 border-y border-ink-200 py-6 text-center text-sm">
          No assignments.
        </p>
      ) : null}
      {rows && rows.length > 0 ? (
        <Table>
          <THead>
            <TR>
              {headers.map((h) => <TH key={h}>{h}</TH>)}
              <TH width="140px">Status</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((r) => {
              const revoked = r.revoked_by_revision_id !== null;
              const pendingAssign = r.assignment_applied_at === null;
              const pendingRevoke = revoked && r.revocation_applied_at === null;
              return (
                <TR key={r.association_id} muted={revoked && !pendingRevoke}>
                  {renderRow(r)}
                  <TD>
                    {pendingAssign ? <StatusBadge status="pending" /> :
                      revoked ? (
                        pendingRevoke ? (
                          <span className="text-xs font-display italic text-accent-pending">revoke pending</span>
                        ) : (
                          <StatusBadge status="discarded" />
                        )
                      ) : <StatusBadge status="applied" />
                    }
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      ) : null}
    </section>
  );
}

// ─── Add-association drawer ──────────────────────────────────────────────

function AddAssocDrawer({
  kind,
  groupId,
  onClose,
  onAdded,
}: {
  kind: AssocKind;
  groupId: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { revisionId } = useActiveRevision();
  const subjects = useSubjectsApi();
  const assocs = useAssociationsApi();

  // Load candidate subjects — union return type
  type Candidate = { subject_id: number; is_effective: boolean } & Record<string, unknown>;
  const candidates = useFetch<Candidate[]>(
    `candidates-${kind}`,
    async (): Promise<Candidate[]> => {
      switch (kind) {
        case 'users': return (await subjects.listUsers()) as unknown as Candidate[];
        case 'roles': return (await subjects.listRoles()) as unknown as Candidate[];
        case 'filters': return (await subjects.listFilters()) as unknown as Candidate[];
        case 'selections': return (await subjects.listSelections()) as unknown as Candidate[];
      }
    },
    [kind],
  );

  const [targetId, setTargetId] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (revisionId === null) {
    return (
      <Drawer open onClose={onClose} eyebrow="§ add" title={`Add ${kind.slice(0, -1)}`}>
        <RevisionRequiredBanner action={`add a ${kind.slice(0, -1)} to this group`} />
      </Drawer>
    );
  }

  async function submit() {
    if (!targetId) return;
    setErr(null);
    setBusy(true);
    try {
      const tid = Number(targetId);
      const baseBody = {
        group_id: groupId,
        assigned_by_revision_id: revisionId as number,
        revoked_by_revision_id: null,
      };
      switch (kind) {
        case 'users': await assocs.upsertGroupUser({ ...baseBody, user_id: tid }); break;
        case 'roles': await assocs.upsertGroupRole({ ...baseBody, role_id: tid }); break;
        case 'filters': await assocs.upsertGroupFilter({ ...baseBody, filter_id: tid }); break;
        case 'selections': await assocs.upsertGroupSelection({ ...baseBody, selection_id: tid }); break;
      }
      onAdded();
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
      eyebrow={`§ add to revision`}
      title={`Add ${kind.slice(0, -1)} to group`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !targetId}>
            {busy ? 'Adding…' : 'Add'}
          </Button>
        </>
      }
    >
      {candidates.isLoading ? <LoadingState /> : null}
      <ErrorState error={candidates.error} />
      <FieldGroup
        label={`Pick a ${kind.slice(0, -1)}`}
        required
        error={err}
        hint="Effective subjects only. Pending subjects appear after their revision is applied."
      >
        <Select value={targetId} onChange={(v) => setTargetId(v.target.value)}>
          <option value="">— select —</option>
          {candidates.data?.filter((c) => 'is_effective' in c && c.is_effective).map((c) => (
            <option key={c.subject_id} value={c.subject_id}>
              {candidateLabel(kind, c)}
            </option>
          ))}
        </Select>
      </FieldGroup>
    </Drawer>
  );
}

function candidateLabel(kind: AssocKind, c: unknown): string {
  if (kind === 'users') return (c as { user_email: string }).user_email;
  if (kind === 'roles') {
    const r = c as { role_code: string; role_name: string };
    return `${r.role_code} — ${r.role_name}`;
  }
  if (kind === 'filters') {
    const f = c as { filter_code: string; filter_dataset_name: string };
    return `${f.filter_code} (${f.filter_dataset_name})`;
  }
  const s = c as { selection_code: string; selection_dataset_name: string };
  return `${s.selection_code} (${s.selection_dataset_name})`;
}
