import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@repo/auth';
import { env } from '../env';

const BASE = '/api/access-manager/v1';

export interface ApiError extends Error {
  status: number;
  body: unknown;
}

function makeError(status: number, body: unknown): ApiError {
  const err = new Error(
    typeof body === 'object' && body && 'detail' in body
      ? String((body as { detail: unknown }).detail)
      : `Request failed: ${status}`,
  ) as ApiError;
  err.status = status;
  err.body = body;
  return err;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: object;
  body?: unknown;
  impersonate?: string | null;
}

function buildUrl(path: string, query?: object): string {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query as Record<string, unknown>)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.pathname + url.search;
}

export function useApi() {
  const { acquireToken } = useAuth();

  return useCallback(
    async <T>(path: string, opts: RequestOptions = {}): Promise<T> => {
      const token = await acquireToken([env.apiScope]);
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };
      if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
      if (opts.impersonate) headers['X-Impersonate'] = opts.impersonate;

      const res = await fetch(buildUrl(path, opts.query), {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });

      const text = await res.text();
      let parsed: unknown = null;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }
      if (!res.ok) throw makeError(res.status, parsed);
      return parsed as T;
    },
    [acquireToken],
  );
}

// ─── Tiny SWR-ish cache hook ───────────────────────────────────────────────

interface FetchState<T> {
  data: T | undefined;
  error: ApiError | null;
  isLoading: boolean;
  reload: () => void;
}

export function useFetch<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): FetchState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(key !== null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (key === null) {
      setIsLoading(false);
      setData(undefined);
      setError(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        if (cancelled) return;
        setData(d);
      })
      .catch((e: ApiError) => {
        if (cancelled) return;
        setError(e);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, ...deps]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, isLoading, reload };
}
