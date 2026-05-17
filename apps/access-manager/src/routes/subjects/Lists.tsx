import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubjectsApi } from '../../api/subjects';
import { useFetch } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/Button';
import { Table, THead, TBody, TR, TH, TD } from '../../components/Table';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { StatusBadge } from '../../components/StatusBadge';
import { useIsAdmin } from '../../lib/permissions';
import { useActiveRevision } from '../../lib/active-revision';
import { RevisionRequiredBanner } from '../../components/RevisionRequiredBanner';
import { SubjectDrawer } from './SubjectDrawer';
import type {
  FilterSubject,
  GroupSubject,
  RoleSubject,
  SelectionSubject,
  SubjectType,
  UserSubject,
} from '../../api/types';

function PageShell({
  numeral,
  eyebrow,
  title,
  description,
  subjectType,
  newDrawer,
  children,
}: {
  numeral: string;
  eyebrow: string;
  title: string;
  description: string;
  subjectType: SubjectType;
  newDrawer: () => void;
  children: React.ReactNode;
}) {
  const isAdmin = useIsAdmin();
  return (
    <>
      <PageHeader
        numeral={numeral}
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          isAdmin ? (
            <Button variant="primary" onClick={newDrawer}>
              + New {subjectType}
            </Button>
          ) : undefined
        }
      />
      {children}
    </>
  );
}

// ─── Users ───────────────────────────────────────────────────────────────

export function UsersList() {
  const api = useSubjectsApi();
  const { revisionId } = useActiveRevision();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data, error, isLoading, reload } = useFetch('users-list', () => api.listUsers());

  // Reduce to one row per subject_id, preferring effective + flag pending
  const grouped = groupBy(data ?? [], (u: UserSubject) => u.subject_id);

  return (
    <PageShell
      numeral="§ 03"
      eyebrow="users · subjects"
      title="Users"
      description="People in the access model. Created or modified under a revision; effective once applied."
      subjectType="user"
      newDrawer={() => setDrawerOpen(true)}
    >
      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />
      {data && data.length === 0 ? (
        <EmptyState title="No users yet" description="Add the first user under a pending revision." />
      ) : null}
      {data && data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH width="80px">ID</TH>
              <TH>Email</TH>
              <TH width="120px">Active</TH>
              <TH width="140px">State</TH>
            </TR>
          </THead>
          <TBody>
            {[...grouped.values()].map((rows) => {
              const eff = rows.find((r: UserSubject) => r.is_effective);
              const pend = rows.find((r: UserSubject) => !r.is_effective);
              const show = (eff ?? pend) as UserSubject;
              return (
                <TR key={show.subject_id}>
                  <TD mono>{show.subject_id}</TD>
                  <TD mono>
                    <Link to={`/subjects/users/${show.subject_id}`} className="text-ink-900 hover:underline underline-offset-2">
                      {show.user_email}
                    </Link>
                  </TD>
                  <TD>{show.user_is_active ? '✓' : <span className="text-ink-400">—</span>}</TD>
                  <TD>
                    {eff ? <StatusBadge status="applied" /> : null}
                    {pend ? <span className="ml-1"><StatusBadge status="pending" /></span> : null}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      ) : null}

      {drawerOpen && revisionId === null ? (
        <RevisionRequiredBanner action="create a user" />
      ) : drawerOpen ? (
        <SubjectDrawer
          open
          onClose={() => setDrawerOpen(false)}
          onSaved={reload}
          revisionId={revisionId as number}
          subjectType="user"
        />
      ) : null}
    </PageShell>
  );
}

// ─── Roles ───────────────────────────────────────────────────────────────

export function RolesList() {
  const api = useSubjectsApi();
  const { revisionId } = useActiveRevision();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data, error, isLoading, reload } = useFetch('roles-list', () => api.listRoles());

  const grouped = groupBy(data ?? [], (r: RoleSubject) => r.subject_id);

  return (
    <PageShell
      numeral="§ 03"
      eyebrow="roles · subjects"
      title="Roles"
      description="Capability identifiers that a user can hold through a group membership."
      subjectType="role"
      newDrawer={() => setDrawerOpen(true)}
    >
      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />
      {data && data.length === 0 ? <EmptyState title="No roles yet" /> : null}
      {data && data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH width="80px">ID</TH>
              <TH width="200px">Code</TH>
              <TH>Name</TH>
              <TH width="140px">State</TH>
            </TR>
          </THead>
          <TBody>
            {[...grouped.values()].map((rows) => {
              const eff = rows.find((r: RoleSubject) => r.is_effective);
              const pend = rows.find((r: RoleSubject) => !r.is_effective);
              const show = (eff ?? pend) as RoleSubject;
              return (
                <TR key={show.subject_id}>
                  <TD mono>{show.subject_id}</TD>
                  <TD mono>
                    <Link to={`/subjects/roles/${show.subject_id}`} className="text-ink-900 hover:underline underline-offset-2">
                      {show.role_code}
                    </Link>
                  </TD>
                  <TD>{show.role_name}</TD>
                  <TD>
                    {eff ? <StatusBadge status="applied" /> : null}
                    {pend ? <span className="ml-1"><StatusBadge status="pending" /></span> : null}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      ) : null}
      {drawerOpen && revisionId === null ? (
        <RevisionRequiredBanner action="create a role" />
      ) : drawerOpen ? (
        <SubjectDrawer
          open
          onClose={() => setDrawerOpen(false)}
          onSaved={reload}
          revisionId={revisionId as number}
          subjectType="role"
        />
      ) : null}
    </PageShell>
  );
}

// ─── Groups ──────────────────────────────────────────────────────────────

export function GroupsList() {
  const api = useSubjectsApi();
  const { revisionId } = useActiveRevision();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data, error, isLoading, reload } = useFetch('groups-list', () => api.listGroups());

  const grouped = groupBy(data ?? [], (g: GroupSubject) => g.subject_id);

  return (
    <PageShell
      numeral="§ 04"
      eyebrow="groups · subjects"
      title="Groups"
      description="Groups bundle members + roles + filters + selections. Click any group to open its workspace."
      subjectType="group"
      newDrawer={() => setDrawerOpen(true)}
    >
      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />
      {data && data.length === 0 ? <EmptyState title="No groups yet" /> : null}
      {data && data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH width="80px">ID</TH>
              <TH width="200px">Code</TH>
              <TH>Name</TH>
              <TH width="140px">State</TH>
            </TR>
          </THead>
          <TBody>
            {[...grouped.values()].map((rows) => {
              const eff = rows.find((r: GroupSubject) => r.is_effective);
              const pend = rows.find((r: GroupSubject) => !r.is_effective);
              const show = (eff ?? pend) as GroupSubject;
              return (
                <TR key={show.subject_id}>
                  <TD mono>{show.subject_id}</TD>
                  <TD mono>
                    <Link to={`/groups/${show.subject_id}`} className="text-ink-900 hover:underline underline-offset-2">
                      {show.group_code}
                    </Link>
                  </TD>
                  <TD>{show.group_name}</TD>
                  <TD>
                    {eff ? <StatusBadge status="applied" /> : null}
                    {pend ? <span className="ml-1"><StatusBadge status="pending" /></span> : null}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      ) : null}
      {drawerOpen && revisionId === null ? (
        <RevisionRequiredBanner action="create a group" />
      ) : drawerOpen ? (
        <SubjectDrawer
          open
          onClose={() => setDrawerOpen(false)}
          onSaved={reload}
          revisionId={revisionId as number}
          subjectType="group"
        />
      ) : null}
    </PageShell>
  );
}

// ─── Filters ─────────────────────────────────────────────────────────────

export function FiltersList() {
  const api = useSubjectsApi();
  const { revisionId } = useActiveRevision();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data, error, isLoading, reload } = useFetch('filters-list', () => api.listFilters());

  const grouped = groupBy(data ?? [], (f: FilterSubject) => f.subject_id);

  return (
    <PageShell
      numeral="§ 03"
      eyebrow="filters · subjects"
      title="Filters"
      description="Per-dataset row predicates. Include or exclude rows by field/value."
      subjectType="filter"
      newDrawer={() => setDrawerOpen(true)}
    >
      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />
      {data && data.length === 0 ? <EmptyState title="No filters yet" /> : null}
      {data && data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH width="80px">ID</TH>
              <TH width="200px">Code</TH>
              <TH>Name</TH>
              <TH width="200px">Dataset</TH>
              <TH width="140px">State</TH>
            </TR>
          </THead>
          <TBody>
            {[...grouped.values()].map((rows) => {
              const eff = rows.find((r: FilterSubject) => r.is_effective);
              const pend = rows.find((r: FilterSubject) => !r.is_effective);
              const show = (eff ?? pend) as FilterSubject;
              return (
                <TR key={show.subject_id}>
                  <TD mono>{show.subject_id}</TD>
                  <TD mono>
                    <Link to={`/subjects/filters/${show.subject_id}`} className="text-ink-900 hover:underline underline-offset-2">
                      {show.filter_code}
                    </Link>
                  </TD>
                  <TD>{show.filter_name}</TD>
                  <TD mono>{show.filter_dataset_name}</TD>
                  <TD>
                    {eff ? <StatusBadge status="applied" /> : null}
                    {pend ? <span className="ml-1"><StatusBadge status="pending" /></span> : null}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      ) : null}
      {drawerOpen && revisionId === null ? (
        <RevisionRequiredBanner action="create a filter" />
      ) : drawerOpen ? (
        <SubjectDrawer
          open
          onClose={() => setDrawerOpen(false)}
          onSaved={reload}
          revisionId={revisionId as number}
          subjectType="filter"
        />
      ) : null}
    </PageShell>
  );
}

// ─── Selections ──────────────────────────────────────────────────────────

export function SelectionsList() {
  const api = useSubjectsApi();
  const { revisionId } = useActiveRevision();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data, error, isLoading, reload } = useFetch('selections-list', () => api.listSelections());

  const grouped = groupBy(data ?? [], (s: SelectionSubject) => s.subject_id);

  return (
    <PageShell
      numeral="§ 03"
      eyebrow="selections · subjects"
      title="Selections"
      description="Per-dataset field visibility. Limit which columns a group can see."
      subjectType="selection"
      newDrawer={() => setDrawerOpen(true)}
    >
      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />
      {data && data.length === 0 ? <EmptyState title="No selections yet" /> : null}
      {data && data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH width="80px">ID</TH>
              <TH width="200px">Code</TH>
              <TH>Name</TH>
              <TH width="200px">Dataset</TH>
              <TH width="140px">State</TH>
            </TR>
          </THead>
          <TBody>
            {[...grouped.values()].map((rows) => {
              const eff = rows.find((r: SelectionSubject) => r.is_effective);
              const pend = rows.find((r: SelectionSubject) => !r.is_effective);
              const show = (eff ?? pend) as SelectionSubject;
              return (
                <TR key={show.subject_id}>
                  <TD mono>{show.subject_id}</TD>
                  <TD mono>
                    <Link to={`/subjects/selections/${show.subject_id}`} className="text-ink-900 hover:underline underline-offset-2">
                      {show.selection_code}
                    </Link>
                  </TD>
                  <TD>{show.selection_name}</TD>
                  <TD mono>{show.selection_dataset_name}</TD>
                  <TD>
                    {eff ? <StatusBadge status="applied" /> : null}
                    {pend ? <span className="ml-1"><StatusBadge status="pending" /></span> : null}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      ) : null}
      {drawerOpen && revisionId === null ? (
        <RevisionRequiredBanner action="create a selection" />
      ) : drawerOpen ? (
        <SubjectDrawer
          open
          onClose={() => setDrawerOpen(false)}
          onSaved={reload}
          revisionId={revisionId as number}
          subjectType="selection"
        />
      ) : null}
    </PageShell>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────

function groupBy<T, K>(arr: T[], key: (x: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const x of arr) {
    const k = key(x);
    const list = m.get(k);
    if (list) list.push(x);
    else m.set(k, [x]);
  }
  return m;
}
