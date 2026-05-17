import { useApi } from './client';
import type {
  DatedGroupUser,
  DatedImpersonationGrant,
  DatedUserFilter,
  DatedUserRole,
  DatedUserSelection,
} from './types';

interface DatedQuery {
  effective_date?: string;
  user_email?: string;
}

export function useDatedAccessApi() {
  const api = useApi();
  return {
    groupUsers: (q: DatedQuery) =>
      api<DatedGroupUser[]>('/dated-access/group-users', { query: q }),
    userRoles: (q: DatedQuery) =>
      api<DatedUserRole[]>('/dated-access/user-roles', { query: q }),
    userFilters: (q: DatedQuery) =>
      api<DatedUserFilter[]>('/dated-access/user-filters', { query: q }),
    userSelections: (q: DatedQuery) =>
      api<DatedUserSelection[]>('/dated-access/user-selections', { query: q }),
    impersonationGrants: (q: DatedQuery) =>
      api<DatedImpersonationGrant[]>('/dated-access/impersonation-grants', { query: q }),
  };
}
