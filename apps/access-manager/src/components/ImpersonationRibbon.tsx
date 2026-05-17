export function ImpersonationRibbon({
  email,
  onExit,
}: {
  email: string;
  onExit: () => void;
}) {
  return (
    <div className="impersonation-ribbon border-b border-status-impersonation/30">
      <div className="max-w-screen-2xl mx-auto px-6 py-2 flex items-center justify-between gap-4">
        <p className="text-xs text-status-impersonation tracking-wide">
          <span className="section-numeral mr-2">viewing as</span>
          <span className="font-mono font-medium">{email}</span>
        </p>
        <button
          type="button"
          onClick={onExit}
          className="text-xs text-status-impersonation underline underline-offset-2 hover:no-underline"
        >
          Stop impersonating
        </button>
      </div>
    </div>
  );
}
