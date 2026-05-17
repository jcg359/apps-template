import type { ReactNode } from 'react';
import type { ApiError } from '../api/client';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-12 text-ink-500">
      <span className="inline-block h-2 w-2 rounded-full bg-ink-300 animate-pulse" />
      <span className="font-display italic text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-16 px-6 text-center border-t border-ink-200">
      <p className="section-numeral mb-2">no records</p>
      <h3 className="font-display text-2xl text-ink-800">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md mx-auto text-sm text-ink-500">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error }: { error: ApiError | Error | null }) {
  if (!error) return null;
  const status = 'status' in error ? (error as ApiError).status : null;
  return (
    <div className="my-6 border-l-2 border-status-impersonation bg-status-impersonation-soft px-4 py-3">
      <p className="section-numeral">error{status ? ` · ${status}` : ''}</p>
      <p className="mt-1 text-sm text-ink-800">{error.message}</p>
    </div>
  );
}
