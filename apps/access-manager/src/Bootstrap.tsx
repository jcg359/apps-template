import { type ReactNode } from 'react';
import { useProfileApi } from './api/profile';
import { useFetch } from './api/client';
import { CurrentUserProvider } from './lib/permissions';
import { env } from './env';
import { useAuth } from '@repo/auth';

/**
 * Resolves the calling user's identity + role flags from /api/access/current-user
 * before rendering the app shell. In mock mode we synthesize a stub so screens
 * don't hit the backend.
 */
export function Bootstrap({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const api = useProfileApi();

  // In mock mode, synthesize a CurrentUser with admin rights so UI is explorable.
  if (env.mockUser) {
    return (
      <CurrentUserProvider
        user={{
          email: user?.email ?? 'dev@example.com',
          name: user?.name ?? 'Dev User',
          is_admin: true,
          is_read_role: true,
          environment: 'mock',
        }}
      >
        {children}
      </CurrentUserProvider>
    );
  }

  const { data, error, isLoading } = useFetch('current-user', () => api.currentUser());

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-500 font-display italic">
        Loading session…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-700 px-6">
        <div className="max-w-md text-center">
          <p className="section-numeral text-status-impersonation">unable to load session</p>
          <p className="mt-2 font-display text-xl">{error?.message ?? 'No current user'}</p>
          <p className="mt-2 text-sm text-ink-500">
            The access-controls API didn't return your identity. Check that you have the
            <span className="font-mono mx-1">apps.access</span>
            scope on your token.
          </p>
        </div>
      </div>
    );
  }

  return <CurrentUserProvider user={data}>{children}</CurrentUserProvider>;
}
