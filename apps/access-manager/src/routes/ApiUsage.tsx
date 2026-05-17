import { useState } from 'react';
import { useApiUsageApi } from '../api/api-usage';
import { useFetch } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { Timestamp } from '../components/Timestamp';
import { LoadingState, ErrorState } from '../components/States';

export function ApiUsage() {
  const api = useApiUsageApi();
  const [lookback, setLookback] = useState(15);

  const { data, error, isLoading } = useFetch(
    `usage-${lookback}`,
    () => api.summary(lookback),
    [lookback],
  );

  return (
    <>
      <PageHeader
        numeral="§ 08"
        eyebrow="api usage"
        title="Activity"
        description="Request counts per date and per user across the access-controls API. Useful for spotting unfamiliar traffic or quiet integrations."
        actions={
          <div className="flex items-center gap-2">
            <span className="section-numeral">lookback · days</span>
            <input
              type="range"
              min="1"
              max="365"
              value={lookback}
              onChange={(e) => setLookback(Number(e.target.value))}
              className="accent-ink-900"
            />
            <span className="font-mono text-sm tabnum w-10 text-right">{lookback}</span>
          </div>
        }
      />

      {isLoading ? <LoadingState /> : null}
      <ErrorState error={error} />

      {data ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <section className="lg:col-span-7 reveal reveal-2">
            <h2 className="section-numeral mb-3">08·a · requests per date</h2>
            <BarChart points={data.per_date} />
          </section>

          <section className="lg:col-span-5 reveal reveal-3">
            <h2 className="section-numeral mb-3">08·b · per-user activity</h2>
            <Table>
              <THead>
                <TR>
                  <TH>User</TH>
                  <TH width="120px" align="right">Requests</TH>
                  <TH width="160px">Last active</TH>
                </TR>
              </THead>
              <TBody>
                {[...data.per_user]
                  .sort((a, b) => b.request_count - a.request_count)
                  .map((u) => (
                    <TR key={u.user_email}>
                      <TD mono>{u.user_email}</TD>
                      <TD align="right" numeric mono>{u.request_count.toLocaleString()}</TD>
                      <TD><Timestamp iso={u.last_active_at} mode="rel" /></TD>
                    </TR>
                  ))}
              </TBody>
            </Table>
          </section>
        </div>
      ) : null}
    </>
  );
}

function BarChart({ points }: { points: { request_date: string; request_count: number }[] }) {
  if (points.length === 0) {
    return <p className="font-display italic text-ink-400 py-8">No activity in range.</p>;
  }
  const W = 720;
  const H = 240;
  const PADDING = { top: 16, right: 8, bottom: 28, left: 36 };
  const innerW = W - PADDING.left - PADDING.right;
  const innerH = H - PADDING.top - PADDING.bottom;
  const max = Math.max(...points.map((p) => p.request_count), 1);
  const barW = innerW / points.length;

  return (
    <div className="border border-ink-200 bg-paper-elevated p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* y-axis ticks */}
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={PADDING.left}
              x2={W - PADDING.right}
              y1={PADDING.top + innerH * (1 - t)}
              y2={PADDING.top + innerH * (1 - t)}
              stroke="var(--ink-200)"
              strokeWidth="0.5"
            />
            <text
              x={PADDING.left - 6}
              y={PADDING.top + innerH * (1 - t) + 4}
              fontSize="9"
              textAnchor="end"
              fill="var(--ink-400)"
              fontFamily="var(--font-mono-am)"
            >
              {Math.round(max * t).toLocaleString()}
            </text>
          </g>
        ))}
        {/* bars */}
        {points.map((p, i) => {
          const h = (p.request_count / max) * innerH;
          return (
            <g key={p.request_date}>
              <rect
                x={PADDING.left + i * barW + barW * 0.15}
                y={PADDING.top + innerH - h}
                width={barW * 0.7}
                height={h}
                fill="var(--accent-pending)"
                opacity="0.85"
              />
            </g>
          );
        })}
        {/* x-axis: first, mid, last labels */}
        {points.length > 0 ? (
          <>
            <Tick i={0} count={points.length} barW={barW} PADDING={PADDING} innerH={innerH} label={points[0]?.request_date ?? ''} />
            {points.length > 4 ? (
              <Tick
                i={Math.floor(points.length / 2)}
                count={points.length}
                barW={barW}
                PADDING={PADDING}
                innerH={innerH}
                label={points[Math.floor(points.length / 2)]?.request_date ?? ''}
              />
            ) : null}
            {points.length > 1 ? (
              <Tick
                i={points.length - 1}
                count={points.length}
                barW={barW}
                PADDING={PADDING}
                innerH={innerH}
                label={points[points.length - 1]?.request_date ?? ''}
              />
            ) : null}
          </>
        ) : null}
      </svg>
    </div>
  );
}

function Tick({
  i,
  count,
  barW,
  PADDING,
  innerH,
  label,
}: {
  i: number;
  count: number;
  barW: number;
  PADDING: { left: number; top: number };
  innerH: number;
  label: string;
}) {
  void count;
  return (
    <text
      x={PADDING.left + i * barW + barW / 2}
      y={PADDING.top + innerH + 18}
      fontSize="9"
      textAnchor="middle"
      fill="var(--ink-500)"
      fontFamily="var(--font-mono-am)"
    >
      {label}
    </text>
  );
}
