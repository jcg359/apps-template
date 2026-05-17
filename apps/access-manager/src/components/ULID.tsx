import { useState } from 'react';
import { shortUlid } from '../lib/format';

export function ULID({ code, full }: { code: string; full?: boolean }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copied' : code}
      className="font-mono text-xs text-ink-700 hover:text-ink-900 transition-colors"
    >
      <span className="text-ink-300 select-none">⟨</span>
      <span>{full ? code : shortUlid(code)}</span>
      <span className="text-ink-300 select-none">⟩</span>
      {copied ? <span className="ml-1 text-status-applied">✓</span> : null}
    </button>
  );
}
