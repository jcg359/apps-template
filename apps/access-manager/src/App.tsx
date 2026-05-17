import { useEffect, useState } from 'react';
import {
  AppLauncherButton,
  Header,
  type AppDefinition,
} from '@repo/ui';
import { useRequireAuth } from '@repo/auth';
import { fetchApps } from './api';

export function App() {
  const { user, logout, acquireToken } = useRequireAuth();
  const [apps, setApps] = useState<AppDefinition[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    acquireToken([])
      .then((token) => fetchApps(token))
      .then((list) => {
        if (!cancelled) setApps(list);
      })
      .catch(() => {
        // launcher just won't render — non-fatal
      });
    return () => {
      cancelled = true;
    };
  }, [acquireToken]);

  if (!user) return null;

  return (
    <>
      <Header
        title="Access Manager"
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
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Access manager
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Users &amp; roles
          </h1>
          <p className="max-w-2xl text-sm text-neutral-500">
            Signed in as <span className="font-medium text-neutral-700">{user.name}</span>{' '}
            ({user.email}). This is a scaffold — drop real content in
            <code className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs">src/App.tsx</code>.
          </p>
        </div>
      </main>
    </>
  );
}
