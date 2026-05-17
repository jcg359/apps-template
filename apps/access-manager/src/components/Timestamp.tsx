import { fmtDateTime, fmtRelative } from '../lib/format';

export function Timestamp({
  iso,
  mode = 'abs',
}: {
  iso: string | null | undefined;
  mode?: 'abs' | 'rel' | 'both';
}) {
  if (!iso) return <span className="text-ink-400">—</span>;
  const abs = fmtDateTime(iso);
  const rel = fmtRelative(iso);

  if (mode === 'rel') {
    return (
      <span title={abs} className="text-ink-600 italic font-display">
        {rel}
      </span>
    );
  }
  if (mode === 'both') {
    return (
      <span className="inline-flex flex-col leading-tight">
        <span className="font-mono text-xs tabnum text-ink-800">{abs}</span>
        <span className="text-[10px] italic text-ink-400 font-display">{rel}</span>
      </span>
    );
  }
  return (
    <span title={rel} className="font-mono text-xs tabnum text-ink-800">
      {abs}
    </span>
  );
}
