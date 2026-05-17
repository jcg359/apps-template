import { useState, useEffect } from 'react';
import { useSubjectsApi } from '../../api/subjects';
import { Drawer } from '../../components/Drawer';
import { Button } from '../../components/Button';
import { FieldGroup, Input, Checkbox } from '../../components/Field';
import type { ApiError } from '../../api/client';
import type {
  FilterDefinition,
  FilterPredicate,
  FilterSubject,
  GroupSubject,
  RoleSubject,
  SelectionDefinition,
  SelectionSubject,
  SubjectType,
  UserSubject,
} from '../../api/types';

export interface SubjectDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  revisionId: number;
  subjectType: SubjectType;
  // when editing
  existing?: UserSubject | RoleSubject | GroupSubject | FilterSubject | SelectionSubject;
  subjectId?: number;
}

export function SubjectDrawer(props: SubjectDrawerProps) {
  const { subjectType } = props;
  return (
    <Drawer
      open={props.open}
      onClose={props.onClose}
      eyebrow={`§ ${props.subjectId ? 'edit' : 'new'} ${subjectType}`}
      title={
        props.subjectId
          ? `Edit ${subjectType}`
          : `New ${subjectType}`
      }
      width={subjectType === 'filter' || subjectType === 'selection' ? 720 : 540}
      footer={null}
    >
      {subjectType === 'user' ? <UserForm {...props} /> : null}
      {subjectType === 'role' ? <RoleForm {...props} /> : null}
      {subjectType === 'group' ? <GroupForm {...props} /> : null}
      {subjectType === 'filter' ? <FilterForm {...props} /> : null}
      {subjectType === 'selection' ? <SelectionForm {...props} /> : null}
    </Drawer>
  );
}

function FormFooter({
  onCancel,
  onSubmit,
  busy,
  canSubmit,
  isEdit,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  busy: boolean;
  canSubmit: boolean;
  isEdit: boolean;
}) {
  return (
    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-ink-200">
      <Button variant="ghost" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onSubmit} disabled={busy || !canSubmit}>
        {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add to revision'}
      </Button>
    </div>
  );
}

function useErr() {
  return useState<string | null>(null);
}

// ─── User ────────────────────────────────────────────────────────────────

function UserForm({ onClose, onSaved, revisionId, subjectId, existing }: SubjectDrawerProps) {
  const api = useSubjectsApi();
  const e = existing as UserSubject | undefined;
  const [email, setEmail] = useState(e?.user_email ?? '');
  const [active, setActive] = useState(e?.user_is_active ?? true);
  const [err, setErr] = useErr();
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const body = { revision_id: revisionId, user_email: email.trim(), user_is_active: active };
      if (subjectId) await api.patchUser(subjectId, body);
      else await api.createUser(body);
      onSaved();
      onClose();
    } catch (ex) {
      setErr((ex as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FieldGroup label="Email" required error={err}>
        <Input value={email} onChange={(v) => setEmail(v.target.value)} placeholder="name@example.com" autoFocus />
      </FieldGroup>
      <FieldGroup label="Status">
        <Checkbox label="Active" checked={active} onChange={(v) => setActive(v.target.checked)} />
      </FieldGroup>
      <FormFooter onCancel={onClose} onSubmit={submit} busy={busy} canSubmit={!!email.trim()} isEdit={!!subjectId} />
    </>
  );
}

// ─── Role ────────────────────────────────────────────────────────────────

function RoleForm({ onClose, onSaved, revisionId, subjectId, existing }: SubjectDrawerProps) {
  const api = useSubjectsApi();
  const e = existing as RoleSubject | undefined;
  const [code, setCode] = useState(e?.role_code ?? '');
  const [name, setName] = useState(e?.role_name ?? '');
  const [err, setErr] = useErr();
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const body = { revision_id: revisionId, role_code: code.trim(), role_name: name.trim() };
      if (subjectId) await api.patchRole(subjectId, body);
      else await api.createRole(body);
      onSaved();
      onClose();
    } catch (ex) {
      setErr((ex as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FieldGroup label="Code" required hint="Stable identifier, e.g. 'analyst' or 'admin'.">
        <Input value={code} onChange={(v) => setCode(v.target.value)} autoFocus />
      </FieldGroup>
      <FieldGroup label="Display name" required error={err}>
        <Input value={name} onChange={(v) => setName(v.target.value)} />
      </FieldGroup>
      <FormFooter onCancel={onClose} onSubmit={submit} busy={busy} canSubmit={!!code.trim() && !!name.trim()} isEdit={!!subjectId} />
    </>
  );
}

// ─── Group ───────────────────────────────────────────────────────────────

function GroupForm({ onClose, onSaved, revisionId, subjectId, existing }: SubjectDrawerProps) {
  const api = useSubjectsApi();
  const e = existing as GroupSubject | undefined;
  const [code, setCode] = useState(e?.group_code ?? '');
  const [name, setName] = useState(e?.group_name ?? '');
  const [err, setErr] = useErr();
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const body = { revision_id: revisionId, group_code: code.trim(), group_name: name.trim() };
      if (subjectId) await api.patchGroup(subjectId, body);
      else await api.createGroup(body);
      onSaved();
      onClose();
    } catch (ex) {
      setErr((ex as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FieldGroup label="Code" required>
        <Input value={code} onChange={(v) => setCode(v.target.value)} autoFocus />
      </FieldGroup>
      <FieldGroup label="Display name" required error={err}>
        <Input value={name} onChange={(v) => setName(v.target.value)} />
      </FieldGroup>
      <FormFooter onCancel={onClose} onSubmit={submit} busy={busy} canSubmit={!!code.trim() && !!name.trim()} isEdit={!!subjectId} />
    </>
  );
}

// ─── Filter ──────────────────────────────────────────────────────────────

function FilterForm({ onClose, onSaved, revisionId, subjectId, existing }: SubjectDrawerProps) {
  const api = useSubjectsApi();
  const e = existing as FilterSubject | undefined;
  const [code, setCode] = useState(e?.filter_code ?? '');
  const [name, setName] = useState(e?.filter_name ?? '');
  const [dataset, setDataset] = useState(e?.filter_dataset_name ?? '');
  const [passAll, setPassAll] = useState((e?.filter_definition.filters ?? null) === null);
  const [predicates, setPredicates] = useState<FilterPredicate[]>(
    e?.filter_definition.filters ?? [{ key: '', values: [], deny: false }],
  );
  const [err, setErr] = useErr();
  const [busy, setBusy] = useState(false);

  function update(idx: number, patch: Partial<FilterPredicate>) {
    setPredicates((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }
  function addPredicate() {
    setPredicates((prev) => [...prev, { key: '', values: [], deny: false }]);
  }
  function removePredicate(idx: number) {
    setPredicates((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const def: FilterDefinition = {
        filters: passAll ? null : predicates.map((p) => ({
          key: p.key?.trim() || null,
          values: (p.values ?? []).filter((v) => v.length > 0),
          deny: p.deny,
        })),
      };
      const body = {
        revision_id: revisionId,
        filter_code: code.trim(),
        filter_name: name.trim(),
        filter_dataset_name: dataset.trim(),
        filter_definition: def,
      };
      if (subjectId) await api.patchFilter(subjectId, body);
      else await api.createFilter(body);
      onSaved();
      onClose();
    } catch (ex) {
      setErr((ex as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Code" required>
          <Input value={code} onChange={(v) => setCode(v.target.value)} autoFocus />
        </FieldGroup>
        <FieldGroup label="Dataset" required>
          <Input value={dataset} onChange={(v) => setDataset(v.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup label="Display name" required error={err}>
        <Input value={name} onChange={(v) => setName(v.target.value)} />
      </FieldGroup>

      <div className="my-6 border-t border-ink-200 pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="section-numeral">predicates</p>
          <Checkbox label="Pass-all (no predicates)" checked={passAll} onChange={(v) => setPassAll(v.target.checked)} />
        </div>

        {!passAll ? (
          <div className="space-y-2">
            {predicates.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-3">
                  <Input
                    placeholder="field"
                    value={p.key ?? ''}
                    onChange={(v) => update(i, { key: v.target.value })}
                  />
                </div>
                <div className="col-span-7">
                  <Input
                    placeholder="values, comma-separated"
                    value={(p.values ?? []).join(', ')}
                    onChange={(v) =>
                      update(i, {
                        values: v.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
                <div className="col-span-1">
                  <Checkbox
                    label="deny"
                    checked={p.deny}
                    onChange={(v) => update(i, { deny: v.target.checked })}
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removePredicate(i)}
                    className="text-ink-400 hover:text-status-impersonation"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addPredicate}
              className="section-numeral mt-2 text-accent-pending hover:underline underline-offset-2"
            >
              + add predicate
            </button>
          </div>
        ) : (
          <p className="text-xs text-ink-500 italic font-display">
            Pass-all: every row in the dataset passes (no filtering).
          </p>
        )}
      </div>

      <FormFooter
        onCancel={onClose}
        onSubmit={submit}
        busy={busy}
        canSubmit={!!code.trim() && !!name.trim() && !!dataset.trim()}
        isEdit={!!subjectId}
      />
    </>
  );
}

// ─── Selection ───────────────────────────────────────────────────────────

function SelectionForm({ onClose, onSaved, revisionId, subjectId, existing }: SubjectDrawerProps) {
  const api = useSubjectsApi();
  const e = existing as SelectionSubject | undefined;
  const [code, setCode] = useState(e?.selection_code ?? '');
  const [name, setName] = useState(e?.selection_name ?? '');
  const [dataset, setDataset] = useState(e?.selection_dataset_name ?? '');
  const [visibleStr, setVisibleStr] = useState((e?.selection_definition.visible_fields ?? []).join(', '));
  const [deniedStr, setDeniedStr] = useState((e?.selection_definition.denied_fields ?? []).join(', '));
  const [visibleNull, setVisibleNull] = useState(e?.selection_definition.visible_fields === null);
  const [deniedNull, setDeniedNull] = useState((e?.selection_definition.denied_fields ?? null) === null);
  const [err, setErr] = useErr();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visibleNull && visibleStr.trim() === '' && !e) setVisibleStr('');
  }, [visibleNull, e, visibleStr]);

  function csvOrNull(s: string, asNull: boolean): string[] | null {
    if (asNull) return null;
    const arr = s.split(',').map((x) => x.trim()).filter(Boolean);
    return arr.length === 0 ? null : arr;
  }

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const def: SelectionDefinition = {
        visible_fields: csvOrNull(visibleStr, visibleNull),
        denied_fields: csvOrNull(deniedStr, deniedNull),
      };
      const body = {
        revision_id: revisionId,
        selection_code: code.trim(),
        selection_name: name.trim(),
        selection_dataset_name: dataset.trim(),
        selection_definition: def,
      };
      if (subjectId) await api.patchSelection(subjectId, body);
      else await api.createSelection(body);
      onSaved();
      onClose();
    } catch (ex) {
      setErr((ex as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Code" required>
          <Input value={code} onChange={(v) => setCode(v.target.value)} autoFocus />
        </FieldGroup>
        <FieldGroup label="Dataset" required>
          <Input value={dataset} onChange={(v) => setDataset(v.target.value)} />
        </FieldGroup>
      </div>
      <FieldGroup label="Display name" required error={err}>
        <Input value={name} onChange={(v) => setName(v.target.value)} />
      </FieldGroup>

      <div className="my-6 border-t border-ink-200 pt-5 grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="section-numeral">visible fields</p>
            <Checkbox label="null" checked={visibleNull} onChange={(v) => setVisibleNull(v.target.checked)} />
          </div>
          <Input
            disabled={visibleNull}
            value={visibleStr}
            onChange={(v) => setVisibleStr(v.target.value)}
            placeholder="col_a, col_b, col_c"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="section-numeral">denied fields</p>
            <Checkbox label="null" checked={deniedNull} onChange={(v) => setDeniedNull(v.target.checked)} />
          </div>
          <Input
            disabled={deniedNull}
            value={deniedStr}
            onChange={(v) => setDeniedStr(v.target.value)}
            placeholder="col_private"
          />
        </div>
      </div>

      <FormFooter
        onCancel={onClose}
        onSubmit={submit}
        busy={busy}
        canSubmit={!!code.trim() && !!name.trim() && !!dataset.trim()}
        isEdit={!!subjectId}
      />
    </>
  );
}
