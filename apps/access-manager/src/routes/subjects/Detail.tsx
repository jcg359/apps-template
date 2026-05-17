import { useState, type ReactNode } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useSubjectsApi } from '../../api/subjects';
import { useFetch } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { DiffPanel } from '../../components/DiffPanel';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState, ErrorState } from '../../components/States';
import { useActiveRevision } from '../../lib/active-revision';
import { useIsAdmin } from '../../lib/permissions';
import { RevisionRequiredBanner } from '../../components/RevisionRequiredBanner';
import { SubjectDrawer } from './SubjectDrawer';
import type {
  FilterSubject,
  RoleSubject,
  SelectionSubject,
  SubjectState,
  SubjectType,
  UserSubject,
} from '../../api/types';

type DetailType = Exclude<SubjectType, 'group'>;
type AnySubject = UserSubject | RoleSubject | FilterSubject | SelectionSubject;

export function SubjectDetail({ type }: { type: DetailType }) {
  const { id } = useParams<{ id: string }>();
  const subjectId = Number(id);
  const api = useSubjectsApi();
  const isAdmin = useIsAdmin();
  const { revisionId } = useActiveRevision();
  const [editing, setEditing] = useState(false);

  const key = `subject-${type}-${subjectId}`;
  const { data, error, isLoading, reload } = useFetch<SubjectState<AnySubject>>(
    key,
    async (): Promise<SubjectState<AnySubject>> => {
      switch (type) {
        case 'user': return (await api.getUser(subjectId)) as SubjectState<AnySubject>;
        case 'role': return (await api.getRole(subjectId)) as SubjectState<AnySubject>;
        case 'filter': return (await api.getFilter(subjectId)) as SubjectState<AnySubject>;
        case 'selection': return (await api.getSelection(subjectId)) as SubjectState<AnySubject>;
      }
    },
    [subjectId, type],
  );

  if (Number.isNaN(subjectId)) return <Navigate to="/subjects" />;
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  const eff = data.effective;
  const pend = data.pending;
  const show = pend ?? eff;
  const title = show ? subjectTitle(type, show) : `Subject ${subjectId}`;

  return (
    <>
      <PageHeader
        numeral={`§ 03 · ${type}`}
        eyebrow="subject detail"
        title={title}
        description={
          <span className="inline-flex items-center gap-3">
            {eff ? <StatusBadge status="applied" size="md" /> : null}
            {pend ? <StatusBadge status="pending" size="md" /> : null}
          </span>
        }
        actions={
          isAdmin ? (
            <Button variant="primary" onClick={() => setEditing(true)}>
              Edit under revision
            </Button>
          ) : undefined
        }
      />

      <DiffPanel
        effective={eff ? <SubjectFields type={type} value={eff} /> : null}
        pending={pend ? <SubjectFields type={type} value={pend} /> : null}
      />

      {editing && revisionId === null ? (
        <div className="mt-6">
          <RevisionRequiredBanner action={`edit this ${type}`} />
          <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      ) : null}
      {editing && revisionId !== null ? (
        <SubjectDrawer
          open
          onClose={() => setEditing(false)}
          onSaved={reload}
          revisionId={revisionId}
          subjectType={type}
          subjectId={subjectId}
          existing={show ?? undefined}
        />
      ) : null}
    </>
  );
}

function subjectTitle(type: DetailType, v: NonNullable<unknown>): string {
  switch (type) {
    case 'user': return (v as UserSubject).user_email;
    case 'role': return (v as RoleSubject).role_name;
    case 'filter': return (v as FilterSubject).filter_name;
    case 'selection': return (v as SelectionSubject).selection_name;
  }
}

function SubjectFields({ type, value }: { type: DetailType; value: NonNullable<unknown> }) {
  switch (type) {
    case 'user': return <UserFields v={value as UserSubject} />;
    case 'role': return <RoleFields v={value as RoleSubject} />;
    case 'filter': return <FilterFields v={value as FilterSubject} />;
    case 'selection': return <SelectionFields v={value as SelectionSubject} />;
  }
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-2 border-b border-ink-200 last:border-b-0 grid grid-cols-3 gap-4">
      <dt className="section-numeral">{label}</dt>
      <dd className="col-span-2">{children}</dd>
    </div>
  );
}

function UserFields({ v }: { v: UserSubject }) {
  return (
    <dl>
      <Row label="email"><span className="font-mono text-sm">{v.user_email}</span></Row>
      <Row label="active">{v.user_is_active ? '✓ active' : '✗ inactive'}</Row>
      <Row label="revision"><span className="font-mono text-xs tabnum">#{v.revision_id}</span></Row>
    </dl>
  );
}

function RoleFields({ v }: { v: RoleSubject }) {
  return (
    <dl>
      <Row label="code"><span className="font-mono text-sm">{v.role_code}</span></Row>
      <Row label="name">{v.role_name}</Row>
      <Row label="revision"><span className="font-mono text-xs tabnum">#{v.revision_id}</span></Row>
    </dl>
  );
}

function FilterFields({ v }: { v: FilterSubject }) {
  const preds = v.filter_definition.filters;
  return (
    <dl>
      <Row label="code"><span className="font-mono text-sm">{v.filter_code}</span></Row>
      <Row label="name">{v.filter_name}</Row>
      <Row label="dataset"><span className="font-mono text-sm">{v.filter_dataset_name}</span></Row>
      <Row label="predicates">
        {preds === null ? (
          <span className="font-display italic text-ink-500">Pass-all</span>
        ) : preds.length === 0 ? (
          <span className="font-display italic text-ink-500">Empty</span>
        ) : (
          <ul className="space-y-1">
            {preds.map((p, i) => (
              <li key={i} className="font-mono text-xs">
                <span className={p.deny ? 'text-status-impersonation' : 'text-accent-pending'}>
                  {p.deny ? 'deny' : 'allow'}
                </span>{' '}
                <span className="text-ink-700">{p.key ?? '∅'}</span>{' '}
                <span className="text-ink-400">∈</span>{' '}
                {p.values ? `[${p.values.join(', ')}]` : '∅'}
              </li>
            ))}
          </ul>
        )}
      </Row>
      <Row label="revision"><span className="font-mono text-xs tabnum">#{v.revision_id}</span></Row>
    </dl>
  );
}

function SelectionFields({ v }: { v: SelectionSubject }) {
  return (
    <dl>
      <Row label="code"><span className="font-mono text-sm">{v.selection_code}</span></Row>
      <Row label="name">{v.selection_name}</Row>
      <Row label="dataset"><span className="font-mono text-sm">{v.selection_dataset_name}</span></Row>
      <Row label="visible">
        {v.selection_definition.visible_fields === null ? (
          <span className="font-display italic text-ink-500">null (all fields)</span>
        ) : (
          <FieldChips fields={v.selection_definition.visible_fields} variant="visible" />
        )}
      </Row>
      <Row label="denied">
        {v.selection_definition.denied_fields === null ? (
          <span className="font-display italic text-ink-500">null</span>
        ) : (
          <FieldChips fields={v.selection_definition.denied_fields} variant="denied" />
        )}
      </Row>
      <Row label="revision"><span className="font-mono text-xs tabnum">#{v.revision_id}</span></Row>
    </dl>
  );
}

function FieldChips({ fields, variant }: { fields: string[]; variant: 'visible' | 'denied' }) {
  if (fields.length === 0) return <span className="text-ink-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {fields.map((f) => (
        <span
          key={f}
          className={`font-mono text-[11px] px-1.5 py-0.5 border ${
            variant === 'visible' ? 'border-accent-pending-line text-accent-pending' : 'border-ink-300 text-ink-600 line-through'
          }`}
        >
          {f}
        </span>
      ))}
    </div>
  );
}
