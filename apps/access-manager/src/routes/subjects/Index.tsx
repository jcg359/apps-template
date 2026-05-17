import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubjectsApi } from '../../api/subjects';
import { useFetch } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../../components/Table';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { Timestamp } from '../../components/Timestamp';
import { StatusBadge } from '../../components/StatusBadge';
import { Input } from '../../components/Field';
import { daysAgoISO, todayISO } from '../../lib/format';
import type { SubjectType } from '../../api/types';

type Mode = 'pending' | 'date' | 'revision';

export function SubjectsIndex() {
  const api = useSubjectsApi();
  const [mode, setMode] = useState<Mode>('pending');
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [revId, setRevId] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | SubjectType>('all');

  const query =
    mode === 'pending'
      ? { pending: true }
      : mode === 'date'
        ? { from_date: from, to_date: to }
        : { revision_id: Number(revId) || undefined };

  const enabled = mode !== 'revision' || (mode === 'revision' && !!revId);

  const { data, error, isLoading } = useFetch(
    enabled ? `subjects-rev-${JSON.stringify(query)}` : null,
    () => api.listRevisions(query),
    [JSON.stringify(query)],
  );

  const filtered = data?.filter((r) => typeFilter === 'all' || r.subject_type === typeFilter);

  return (
    <>
      <PageHeader
        numeral="§ 03"
        eyebrow="subjects"
        title="The catalog"
        description="Users, roles, groups, filters, and selections — the named entities of the access model. Every row shown is either currently effective or pending under an open revision."
      />

      <div className="reveal reveal-2 mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-5">
          <p className="section-numeral mb-1.5">view mode</p>
          <div className="flex border border-ink-300 divide-x divide-ink-300">
            <ModeBtn active={mode === 'pending'} onClick={() => setMode('pending')}>Pending only</ModeBtn>
            <ModeBtn active={mode === 'date'} onClick={() => setMode('date')}>Date range</ModeBtn>
            <ModeBtn active={mode === 'revision'} onClick={() => setMode('revision')}>By revision</ModeBtn>
          </div>
        </div>

        {mode === 'date' ? (
          <div className="md:col-span-4 flex items-center gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="!py-1 !px-2" />
            <span className="text-ink-400">→</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="!py-1 !px-2" />
          </div>
        ) : null}
        {mode === 'revision' ? (
          <div className="md:col-span-4">
            <Input
              type="number"
              placeholder="Revision ID…"
              value={revId}
              onChange={(e) => setRevId(e.target.value)}
              className="!py-1.5"
            />
          </div>
        ) : null}

        <div className="md:col-span-3">
          <p className="section-numeral mb-1.5">type</p>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'user', 'role', 'group', 'filter', 'selection'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-[11px] section-numeral px-2 py-1 border ${
                  typeFilter === t
                    ? 'bg-ink-900 text-paper border-ink-900'
                    : 'border-ink-300 text-ink-600 hover:border-ink-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />

      {filtered && filtered.length === 0 ? (
        <EmptyState title="No matching subject rows" description="Try a wider date range or different mode." />
      ) : null}

      {filtered && filtered.length > 0 ? (
        <div className="reveal reveal-3">
          <Table>
            <THead>
              <TR>
                <TH width="110px">Type</TH>
                <TH width="240px">Identifier</TH>
                <TH>Detail</TH>
                <TH width="120px">Effective</TH>
                <TH width="120px">Pending</TH>
                <TH width="180px">Applied at</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((row) => (
                <TR key={`${row.subject_type}-${row.id}-${row.is_effective ? 'e' : 'p'}`}>
                  <TD>
                    <span className="section-numeral text-ink-800">{row.subject_type}</span>
                  </TD>
                  <TD mono>
                    <Link
                      to={row.subject_type === 'group' ? `/groups/${row.id}` : `/subjects/${row.subject_type}s/${row.id}`}
                      className="text-ink-900 hover:underline underline-offset-2"
                    >
                      {row.subject_value}
                    </Link>
                  </TD>
                  <TD>{row.subject_detail}</TD>
                  <TD>
                    {row.is_effective ? (
                      <StatusBadge status="applied" />
                    ) : (
                      <span className="text-ink-400 text-xs">—</span>
                    )}
                  </TD>
                  <TD>
                    {row.pending_exists ? (
                      <StatusBadge status="pending" />
                    ) : (
                      <span className="text-ink-400 text-xs">—</span>
                    )}
                  </TD>
                  <TD>
                    {row.is_effective && row.effective_at ? (
                      <Timestamp iso={row.effective_at} mode="both" />
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      ) : null}
    </>
  );
}

function ModeBtn({
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
      className={`px-3 h-8 text-xs section-numeral transition-colors ${
        active ? 'bg-ink-900 text-paper' : 'bg-paper-elevated text-ink-700 hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  );
}
