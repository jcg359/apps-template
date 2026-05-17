import { useEffect, useState } from 'react';
import { handleCallback } from '@repo/auth';
import { msal } from '../auth';

export function Callback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback(msal, '/')
      .then(({ returnTo }) => {
        window.location.replace(returnTo);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return (
    <main className="mx-auto max-w-md p-10 text-sm text-neutral-600">
      {error ? (
        <>
          <h1 className="mb-2 text-lg font-semibold text-neutral-900">Sign-in failed</h1>
          <p className="text-neutral-500">{error}</p>
          <a
            href="/"
            className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Back to home
          </a>
        </>
      ) : (
        <p>Completing sign-in…</p>
      )}
    </main>
  );
}
