import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

interface RailItem {
  numeral: string;
  label: string;
  to: string;
}

const PRIMARY: RailItem[] = [
  { numeral: '§ 01', label: 'Overview', to: '/' },
  { numeral: '§ 02', label: 'Revisions', to: '/revisions' },
  { numeral: '§ 03', label: 'Subjects', to: '/subjects' },
  { numeral: '§ 04', label: 'Groups', to: '/groups' },
  { numeral: '§ 05', label: 'Impersonation', to: '/impersonation' },
];

const SECONDARY: RailItem[] = [
  { numeral: '§ 06', label: 'Dated access', to: '/dated-access' },
  { numeral: '§ 07', label: 'Profiles', to: '/profiles' },
  { numeral: '§ 08', label: 'API usage', to: '/api-usage' },
];

export function LeftRail() {
  return (
    <nav className="w-56 shrink-0 border-r border-ink-200 bg-paper py-8 px-5 flex flex-col gap-8 sticky top-0 h-screen">
      <div>
        <p className="font-display italic text-xs text-ink-400 mb-1">access</p>
        <p className="font-display text-xl text-ink-900 tracking-tight leading-tight">Ledger</p>
      </div>

      <ul className="flex flex-col gap-0.5">
        {PRIMARY.map((item) => (
          <RailLink key={item.to} {...item} />
        ))}
      </ul>

      <div className="h-px bg-ink-200 -mx-5" />

      <ul className="flex flex-col gap-0.5">
        {SECONDARY.map((item) => (
          <RailLink key={item.to} {...item} />
        ))}
      </ul>

      <div className="mt-auto pt-4 border-t border-ink-200">
        <p className="text-[10px] uppercase tracking-widest text-ink-400">v1 · ledger</p>
      </div>
    </nav>
  );
}

function RailLink({ numeral, label, to }: RailItem) {
  return (
    <li>
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          clsx(
            'flex items-baseline gap-2 py-1.5 px-2 -mx-2 transition-colors',
            isActive
              ? 'bg-ink-900 text-paper'
              : 'text-ink-700 hover:text-ink-900 hover:bg-ink-100',
          )
        }
      >
        <span
          className={clsx(
            'font-display italic text-[10px] tracking-wider',
            'opacity-60',
          )}
        >
          {numeral}
        </span>
        <span className="text-sm">{label}</span>
      </NavLink>
    </li>
  );
}
