import { useApi } from './client';
import type { Revision, RevisionListResponse } from './types';

export function useRevisionsApi() {
  const api = useApi();
  return {
    listPending: (from_date?: string, to_date?: string) =>
      api<RevisionListResponse>('/revisions/pending', { query: { from_date, to_date } }),
    listApplied: (from_date?: string, to_date?: string) =>
      api<RevisionListResponse>('/revisions/applied', { query: { from_date, to_date } }),
    get: (id: number) => api<Revision>(`/revisions/${id}`),
    create: (revision_description: string) =>
      api<Revision>('/revisions', { method: 'POST', body: { revision_description } }),
    patch: (id: number, revision_description: string) =>
      api<Revision>(`/revisions/${id}`, { method: 'PATCH', body: { revision_description } }),
    apply: (id: number) =>
      api<Revision>(`/revisions/${id}/apply`, { method: 'POST' }),
    discard: (id: number) =>
      api<Revision>(`/revisions/${id}/discard`, { method: 'POST' }),
  };
}
