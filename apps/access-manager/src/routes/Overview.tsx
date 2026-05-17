import { Link } from 'react-router-dom';
import { useRevisionsApi } from '../api/revisions';
import { useProfileApi } from '../api/profile';
import { useApiUsageApi } from '../api/api-usage';
import { useFetch } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { ULID } from '../components/ULID';
import { Timestamp } from '../components/Timestamp';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState, ErrorState } from '../components/States';
import { useCurrentUser } from '../lib/permissions';

export function Overview() {
  const user = useCurrentUser();
  const revs = useRevisionsApi();
  const prof = useProfileApi();
  const usage = useApiUsageApi();

  const pending = useFetch('pending', () => revs.listPending());
  const applied = useFetch('applied', () => revs.listApplied());
  const profile = useFetch('myprofile', () => prof.myProfile());
  const summary = useFetch('usage-15', () => usage.summary(15));

  return (
    <>
      <PageHeader
        numeral="§ 01"
        eyebrow="overview"
        title={greeting(user.email)}
        description="The state of the ledger. Pending revisions in flight, your effective access, recent activity across the platform."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-7 reveal reveal-2">
          <SectionHeading numeral="01·a">Pending revisions</SectionHeading>
          {pending.isLoading ? (
            <LoadingState />
          ) : (
            <ErrorState error={pending.error} />
          )}
          {pending.data?.revisions.length === 0 ? (
            <p className="font-display italic text-ink-400 py-6">No pending revisions in the last 7 days.</p>
          ) : (
            <ul className="divide-y divide-ink-200 border-y border-ink-200">
              {pending.data?.revisions.map((r) => (
                <li key={r.revision_id}>
                  <Link
                    to={`/revisions/${r.revision_id}`}
                    className="flex items-center justify-between py-3 px-1 hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink-900 truncate">{r.revision_description}</p>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-500">
                        <ULID code={r.revision_code} />
                        <span>·</span>
                        <Timestamp iso={r.revision_at} mode="rel" />
                        <span>·</span>
                        <span className="font-mono">{r.revision_by}</span>
                      </div>
                    </div>
                    <StatusBadge status="pending" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <SectionHeading numeral="01·b" className="mt-12">Recently applied</SectionHeading>
          {applied.isLoading ? <LoadingState /> : null}
          <ErrorState error={applied.error} />
          {applied.data?.revisions.length === 0 ? (
            <p className="font-display italic text-ink-400 py-6">No revisions applied in the last 7 days.</p>
          ) : (
            <ul className="divide-y divide-ink-200 border-y border-ink-200">
              {applied.data?.revisions.slice(0, 6).map((r) => (
                <li key={r.revision_id}>
                  <Link
                    to={`/revisions/${r.revision_id}`}
                    className="flex items-center justify-between py-3 px-1 hover:bg-ink-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink-700 truncate">{r.revision_description}</p>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-500">
                        <ULID code={r.revision_code} />
                        <span>·</span>
                        <Timestamp iso={r.applied_at} mode="rel" />
                        <span>·</span>
                        <span className="font-mono">{r.applied_by}</span>
                      </div>
                    </div>
                    <StatusBadge status="applied" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="lg:col-span-5 reveal reveal-3 space-y-10">
          <div>
            <SectionHeading numeral="01·c">Your profile</SectionHeading>
            {profile.isLoading ? <LoadingState /> : null}
            <ErrorState error={profile.error} />
            {profile.data ? (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 mt-4">
                <Stat label="Groups" value={profile.data.groups.length} />
                <Stat label="Roles" value={profile.data.roles.length} />
                <Stat label="Filters" value={profile.data.filters.length} />
                <Stat label="Selections" value={profile.data.selections.length} />
              </dl>
            ) : null}
            <div className="mt-4">
              <Link
                to="/profiles"
                className="text-xs font-display italic text-accent-pending underline underline-offset-2"
              >
                Open full profile →
              </Link>
            </div>
          </div>

          <div>
            <SectionHeading numeral="01·d">API activity · 15d</SectionHeading>
            {summary.isLoading ? <LoadingState /> : null}
            <ErrorState error={summary.error} />
            {summary.data ? (
              <>
                <Sparkline points={summary.data.per_date.map((b) => b.request_count)} />
                <div className="mt-3 flex justify-between text-[11px] text-ink-500">
                  <span className="font-mono tabnum">
                    {summary.data.per_date[0]?.request_date ?? '—'}
                  </span>
                  <span className="font-mono tabnum">
                    {summary.data.per_date.at(-1)?.request_date ?? '—'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-6">
                  <Stat
                    label="Total requests"
                    value={summary.data.per_date.reduce((a, b) => a + b.request_count, 0)}
                  />
                  <Stat label="Active users" value={summary.data.per_user.length} />
                </div>
              </>
            ) : null}
            <Link
              to="/api-usage"
              className="mt-4 inline-block text-xs font-display italic text-accent-pending underline underline-offset-2"
            >
              Open full activity →
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

function greeting(email: string): string {
  const hour = new Date().getHours();
  const part = hour < 5 ? 'late' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const name = email.split('@')[0]?.split('.')[0] ?? 'there';
  return `Good ${part}, ${name[0]?.toUpperCase() ?? ''}${name.slice(1)}.`;
}

function SectionHeading({
  numeral,
  className = '',
  children,
}: {
  numeral: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className={`${className} flex items-baseline gap-3 mb-4`}>
      <span className="section-numeral">{numeral}</span>
      <span className="font-display text-xl text-ink-800">{children}</span>
    </h2>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-t border-ink-200 pt-3">
      <dt className="section-numeral">{label}</dt>
      <dd className="font-display text-4xl tabnum text-ink-900 leading-none mt-1">{value}</dd>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length === 0) return <div className="h-16" />;
  const W = 320;
  const H = 56;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? W / (points.length - 1) : 0;
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(H - (p / max) * H).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
      <path d={d} fill="none" stroke="var(--accent-pending)" strokeWidth="1.2" />
      <path
        d={`${d} L${W},${H} L0,${H} Z`}
        fill="var(--accent-pending)"
        opacity="0.08"
      />
    </svg>
  );
}
