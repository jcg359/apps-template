import { useState } from 'react';
import { useDatedAccessApi } from '../api/dated-access';
import { useFetch } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Input } from '../components/Field';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { Timestamp } from '../components/Timestamp';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { todayISO } from '../lib/format';
import clsx from 'clsx';

type Tab = 'group-users' | 'user-roles' | 'user-filters' | 'user-selections' | 'impersonation-grants';

const TABS: { id: Tab; label: string; numeral: string }[] = [
  { id: 'group-users', label: 'Group members', numeral: '06·a' },
  { id: 'user-roles', label: 'User roles', numeral: '06·b' },
  { id: 'user-filters', label: 'User filters', numeral: '06·c' },
  { id: 'user-selections', label: 'User selections', numeral: '06·d' },
  { id: 'impersonation-grants', label: 'Impersonation grants', numeral: '06·e' },
];

export function DatedAccess() {
  const api = useDatedAccessApi();
  const [tab, setTab] = useState<Tab>('group-users');
  const [date, setDate] = useState(todayISO());
  const [email, setEmail] = useState('');

  const mode: 'date' | 'email' = email.trim() ? 'email' : 'date';
  const query = mode === 'email' ? { user_email: email.trim() } : { effective_date: date };

  const key = `dated-${tab}-${JSON.stringify(query)}`;
  const { data, error, isLoading } = useFetch<unknown[]>(
    key,
    async (): Promise<unknown[]> => {
      switch (tab) {
        case 'group-users': return api.groupUsers(query);
        case 'user-roles': return api.userRoles(query);
        case 'user-filters': return api.userFilters(query);
        case 'user-selections': return api.userSelections(query);
        case 'impersonation-grants': return api.impersonationGrants(query);
      }
    },
    [tab, JSON.stringify(query)],
  );

  return (
    <>
      <PageHeader
        numeral="§ 06"
        eyebrow="dated access"
        title="The audit lens"
        description="Point-in-time view of who has what. Pick a date to see active assignments, or search by email across all dates."
      />

      <div className="reveal reveal-2 mb-8 border-y border-ink-200 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end sticky top-0 bg-paper z-10">
        <div className="md:col-span-3">
          <p className="section-numeral mb-1.5">effective date</p>
          <Input
            type="date"
            value={date}
            disabled={mode === 'email'}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="md:col-span-5">
          <p className="section-numeral mb-1.5">— or — user email</p>
          <Input
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="md:col-span-4 text-xs text-ink-500 italic font-display pb-2">
          {mode === 'email' ? 'Date ignored when searching by email.' : 'Email empty: showing assignments active on the chosen date.'}
        </div>
      </div>

      <div className="reveal reveal-3 mb-6 flex border border-ink-300 divide-x divide-ink-300 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-4 h-9 text-xs section-numeral whitespace-nowrap flex items-center gap-2',
              t.id === tab ? 'bg-ink-900 text-paper' : 'bg-paper-elevated text-ink-700 hover:text-ink-900',
            )}
          >
            <span className="opacity-60">{t.numeral}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />
      {data && data.length === 0 ? (
        <EmptyState title="No active rows for this filter" description="Try a different date or a different email." />
      ) : null}

      {data && data.length > 0 ? renderTab(tab, data) : null}
    </>
  );
}

function renderTab(tab: Tab, data: unknown[]): React.ReactNode {
  if (tab === 'group-users') return <GroupUsersTable rows={data as Array<Record<string, unknown>>} />;
  if (tab === 'user-roles') return <UserRolesTable rows={data as Array<Record<string, unknown>>} />;
  if (tab === 'user-filters') return <UserFiltersTable rows={data as Array<Record<string, unknown>>} />;
  if (tab === 'user-selections') return <UserSelectionsTable rows={data as Array<Record<string, unknown>>} />;
  return <ImpersonationGrantsTable rows={data as Array<Record<string, unknown>>} />;
}

function GroupUsersTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>User</TH>
          <TH>Group</TH>
          <TH width="160px">Assigned</TH>
          <TH width="160px">By</TH>
          <TH width="160px">Revoked</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r, i) => (
          <TR key={i}>
            <TD mono>{String(r.user_email)}</TD>
            <TD>
              <p className="font-mono text-xs">{String(r.group_code)}</p>
              <p className="text-[11px] text-ink-500">{String(r.group_name)}</p>
            </TD>
            <TD><Timestamp iso={r.assigned_at as string} /></TD>
            <TD mono className="text-[11px] text-ink-600">{String(r.assigned_by)}</TD>
            <TD><Timestamp iso={r.revoked_at as string | null} /></TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

function UserRolesTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>User</TH>
          <TH>Role</TH>
          <TH>Via group</TH>
          <TH width="140px">Joined group</TH>
          <TH width="140px">Removed from group</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r, i) => (
          <TR key={i}>
            <TD mono>{String(r.user_email)}</TD>
            <TD>
              <p className="font-mono text-xs">{String(r.role_code)}</p>
              <p className="text-[11px] text-ink-500">{String(r.role_name)}</p>
            </TD>
            <TD mono>{String(r.group_code)}</TD>
            <TD><Timestamp iso={r.user_included_at as string} /></TD>
            <TD><Timestamp iso={r.user_removed_at as string | null} /></TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

function UserFiltersTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>User</TH>
          <TH>Filter</TH>
          <TH>Dataset</TH>
          <TH>Via group</TH>
          <TH width="140px">Joined group</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r, i) => (
          <TR key={i}>
            <TD mono>{String(r.user_email)}</TD>
            <TD>
              <p className="font-mono text-xs">{String(r.filter_code)}</p>
              <p className="text-[11px] text-ink-500">{String(r.filter_name)}</p>
            </TD>
            <TD mono>{String(r.filter_dataset_name)}</TD>
            <TD mono>{String(r.group_code)}</TD>
            <TD><Timestamp iso={r.user_included_at as string} /></TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

function UserSelectionsTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>User</TH>
          <TH>Selection</TH>
          <TH>Dataset</TH>
          <TH>Via group</TH>
          <TH width="140px">Joined group</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r, i) => (
          <TR key={i}>
            <TD mono>{String(r.user_email)}</TD>
            <TD>
              <p className="font-mono text-xs">{String(r.selection_code)}</p>
              <p className="text-[11px] text-ink-500">{String(r.selection_name)}</p>
            </TD>
            <TD mono>{String(r.selection_dataset_name)}</TD>
            <TD mono>{String(r.group_code)}</TD>
            <TD><Timestamp iso={r.user_included_at as string} /></TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

function ImpersonationGrantsTable({ rows }: { rows: Array<Record<string, unknown>> }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Grantee</TH>
          <TH>Can impersonate</TH>
          <TH width="160px">Assigned</TH>
          <TH width="160px">By</TH>
          <TH width="160px">Revoked</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r, i) => (
          <TR key={i}>
            <TD mono>{String(r.grant_to_user_email)}</TD>
            <TD mono>
              {r.can_impersonate_user_email ? String(r.can_impersonate_user_email) :
                <span className="italic font-display">pattern: {String(r.can_impersonate_email_pattern)}</span>}
            </TD>
            <TD><Timestamp iso={r.assigned_at as string} /></TD>
            <TD mono className="text-[11px] text-ink-600">{String(r.assigned_by)}</TD>
            <TD><Timestamp iso={r.revoked_at as string | null} /></TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
