import type { AppDefinition } from '@repo/ui';

async function authedGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchApps(token: string): Promise<AppDefinition[]> {
  const data = await authedGet<{ apps: AppDefinition[] }>('/api/apps', token);
  return data.apps;
}
