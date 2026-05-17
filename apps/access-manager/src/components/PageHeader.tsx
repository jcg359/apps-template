import type { ReactNode } from 'react';

export interface PageHeaderProps {
  numeral: string; // e.g. "§ 02"
  eyebrow: string; // tiny caps label
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  numeral,
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="reveal reveal-1 pb-8 border-b border-ink-200 mb-8">
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1 min-w-0">
          <p className="section-numeral">
            {numeral} · {eyebrow}
          </p>
          <h1 className="font-display text-[2.75rem] leading-[1.04] mt-2 text-ink-900 tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-600">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 pt-3">{actions}</div> : null}
      </div>
    </header>
  );
}
