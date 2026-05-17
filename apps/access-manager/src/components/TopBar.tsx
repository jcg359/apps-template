import { useAuth } from '@repo/auth';
import { useCurrentUser } from '../lib/permissions';
import { ActiveRevisionPill } from './ActiveRevisionPill';

export function TopBar() {
  const user = useCurrentUser();
  const { logout } = useAuth();

  return (
    <header className="h-14 border-b border-ink-200 bg-paper-elevated/60 backdrop-blur-sm">
      <div className="h-full px-6 flex items-center justify-end gap-3">
        <ActiveRevisionPill />
        <div className="h-6 w-px bg-ink-200 mx-1" />
        <div className="text-right">
          <p className="text-xs text-ink-800 font-mono">{user.email}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-400">
            {user.is_admin ? 'access_admin' : user.is_read_role ? 'access_role' : 'guest'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="ml-2 text-[11px] section-numeral hover:text-ink-900"
        >
          sign out
        </button>
      </div>
    </header>
  );
}
