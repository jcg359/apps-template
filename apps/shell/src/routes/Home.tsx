import { useEffect, useState } from 'react';
import {
  AppCardGrid,
  AppLauncherButton,
  Header,
  type AppDefinition,
} from '@repo/ui';
import { useAuth } from '@repo/auth';
import { fetchApps } from '../api';

export function Home() {
  const { user, isAuthenticated, login, logout, acquireToken } = useAuth();
  const [apps, setApps] = useState<AppDefinition[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    acquireToken([])
      .then((token) => fetchApps(token))
      .then((list) => {
        if (!cancelled) setApps(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, acquireToken]);

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 p-10 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Apps Platform</h1>
        <p className="text-sm text-neutral-500">Sign in with your work account to continue.</p>
        <button
          type="button"
          onClick={() => login()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Sign in
        </button>
      </main>
    );
  }

  return (
    <>
      <Header
        title="Apps Platform"
        right={
          <>
            {apps ? <AppLauncherButton apps={apps} /> : null}
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              Sign out
            </button>
          </>
        }
      />
      <main className="mx-auto max-w-screen-2xl px-6 py-10">
        <section className="space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              App selector
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              {user ? `Hi, ${user.name.split(' ')[0] ?? user.name}` : 'Choose an app'}
            </h1>
            <p className="max-w-2xl text-sm text-neutral-500">
              Open one of the apps below, or use the{' '}
              <span className="font-medium text-neutral-700">+</span> button in the header to
              switch from anywhere.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-danger-500">Failed to load apps: {error}</p>
          ) : apps ? (
            <AppCardGrid apps={apps} />
          ) : (
            <p className="text-sm text-neutral-500">Loading apps…</p>
          )}
        </section>
      </main>
    </>
  );
}
