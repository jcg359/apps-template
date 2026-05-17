import { useState } from 'react';
import { useProfileApi } from '../api/profile';
import { useFetch, type ApiError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Input } from '../components/Field';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { useIsAdmin, useCurrentUser } from '../lib/permissions';
import type { AccessProfile } from '../api/types';

export function Profiles() {
  const isAdmin = useIsAdmin();
  const me = useCurrentUser();
  const api = useProfileApi();

  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupTarget, setLookupTarget] = useState<string | null>(null);

  const mine = useFetch(`profile-mine-${impersonating ?? 'self'}`, () => api.myProfile(impersonating), [impersonating]);
  const lookup = useFetch(
    lookupTarget ? `profile-lookup-${lookupTarget}` : null,
    () => api.profileFor(lookupTarget as string),
    [lookupTarget],
  );

  return (
    <>
      <PageHeader
        numeral="§ 07"
        eyebrow="profiles"
        title="Who has what"
        description="Resolved access for a user — the union of groups they belong to, the roles those groups carry, and the filters and selections that gate the datasets they reach."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* My profile */}
        <section className="lg:col-span-7 reveal reveal-2">
          <h2 className="flex items-baseline gap-3 mb-3">
            <span className="section-numeral">07·a</span>
            <span className="font-display text-2xl text-ink-900">
              {impersonating ? `Viewing as ${impersonating}` : 'My profile'}
            </span>
          </h2>

          {isAdmin ? (
            <ImpersonationControls
              currentUser={me.email}
              impersonating={impersonating}
              onStart={(email) => setImpersonating(email)}
              onStop={() => setImpersonating(null)}
            />
          ) : null}

          {mine.isLoading ? <LoadingState /> : null}
          <ErrorState error={mine.error} />
          {mine.data ? <ProfileBody profile={mine.data} /> : null}
        </section>

        {/* Lookup */}
        {isAdmin ? (
          <section className="lg:col-span-5 reveal reveal-3">
            <h2 className="flex items-baseline gap-3 mb-3">
              <span className="section-numeral">07·b</span>
              <span className="font-display text-2xl text-ink-900">Lookup another user</span>
            </h2>
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="email@example.com"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
              />
              <Button variant="primary" onClick={() => setLookupTarget(lookupEmail.trim() || null)}>
                Look up
              </Button>
            </div>
            {lookup.isLoading ? <LoadingState /> : null}
            <ErrorState error={lookup.error} />
            {lookup.data ? <ProfileBody profile={lookup.data} compact /> : null}
          </section>
        ) : null}
      </div>
    </>
  );
}

function ImpersonationControls({
  currentUser,
  impersonating,
  onStart,
  onStop,
}: {
  currentUser: string;
  impersonating: string | null;
  onStart: (email: string) => void;
  onStop: () => void;
}) {
  const [input, setInput] = useState('');
  return (
    <div className="mb-6 border border-status-impersonation/30 bg-status-impersonation-soft/50 p-4">
      <p className="section-numeral text-status-impersonation mb-2">impersonation</p>
      {impersonating ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm">
            Viewing as <span className="font-mono">{impersonating}</span>. Your real identity is{' '}
            <span className="font-mono">{currentUser}</span>.
          </p>
          <Button variant="ghost" onClick={onStop}>Stop</Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="email to impersonate…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="!py-1.5"
          />
          <Button variant="secondary" onClick={() => input.trim() && onStart(input.trim())}>
            View as
          </Button>
        </div>
      )}
    </div>
  );
}

function ProfileBody({ profile, compact }: { profile: AccessProfile; compact?: boolean }) {
  const empty =
    profile.groups.length === 0 &&
    profile.roles.length === 0 &&
    profile.filters.length === 0 &&
    profile.selections.length === 0;

  if (empty) return <EmptyState title="No access configured" description="This user belongs to no groups." />;

  return (
    <div className="space-y-8">
      <ProfileSection
        numeral="i"
        title="Groups"
        items={profile.groups.map((g) => ({
          primary: g.group_code,
          secondary: g.group_name,
          aside: null,
        }))}
        compact={compact}
      />
      <ProfileSection
        numeral="ii"
        title="Roles"
        items={profile.roles.map((r) => ({
          primary: r.role_code,
          secondary: r.role_name,
          aside: `via ${r.via_group_code}`,
        }))}
        compact={compact}
      />
      <ProfileSection
        numeral="iii"
        title="Filters"
        items={profile.filters.map((f) => ({
          primary: f.filter_code,
          secondary: f.filter_name,
          aside: `${f.filter_dataset_name} · via ${f.via_group_code}`,
          extra: f.filter_definition.filters === null
            ? 'pass-all'
            : f.filter_definition.filters.map((p) => `${p.deny ? '¬' : ''}${p.key ?? '∅'}∈[${(p.values ?? []).join(',')}]`).join('; '),
        }))}
        compact={compact}
      />
      <ProfileSection
        numeral="iv"
        title="Selections"
        items={profile.selections.map((s) => ({
          primary: s.selection_code,
          secondary: s.selection_name,
          aside: `${s.selection_dataset_name} · via ${s.via_group_code}`,
          extra: [
            s.selection_definition.visible_fields ? `visible: ${s.selection_definition.visible_fields.join(', ')}` : null,
            s.selection_definition.denied_fields ? `denied: ${s.selection_definition.denied_fields.join(', ')}` : null,
          ].filter(Boolean).join(' · '),
        }))}
        compact={compact}
      />
    </div>
  );
}

interface SectionItem {
  primary: string;
  secondary: string;
  aside: string | null;
  extra?: string;
}

function ProfileSection({
  numeral,
  title,
  items,
  compact,
}: {
  numeral: string;
  title: string;
  items: SectionItem[];
  compact?: boolean;
}) {
  return (
    <div>
      <h3 className="flex items-baseline gap-3 mb-2">
        <span className="section-numeral">{numeral}</span>
        <span className="font-display text-lg text-ink-900">{title}</span>
        <span className="font-mono text-[11px] text-ink-400 tabnum">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="font-display italic text-ink-400 border-y border-ink-200 py-3 text-sm">
          None.
        </p>
      ) : (
        <ul className="border-y border-ink-200 divide-y divide-ink-200">
          {items.map((item, i) => (
            <li key={i} className={compact ? 'py-2' : 'py-3'}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-ink-900">{item.primary}</p>
                  <p className="text-xs text-ink-500">{item.secondary}</p>
                </div>
                {item.aside ? (
                  <p className="font-display italic text-[11px] text-ink-500 whitespace-nowrap">
                    {item.aside}
                  </p>
                ) : null}
              </div>
              {item.extra ? (
                <p className="mt-1 font-mono text-[11px] text-ink-600 whitespace-pre-wrap break-words">
                  {item.extra}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
