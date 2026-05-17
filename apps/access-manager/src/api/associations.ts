import { useApi } from './client';
import type {
  AssociationRevisionDetail,
  GroupFilterAssociation,
  GroupRoleAssociation,
  GroupSelectionAssociation,
  GroupUserAssociation,
  ImpersonationGrantAssociation,
} from './types';

interface RevisionDetailsQuery {
  revision_id?: number;
  from_date?: string;
  to_date?: string;
  pending?: boolean;
}

interface GroupRelFilter {
  group_id?: number;
  selection_id?: number;
  filter_id?: number;
  user_id?: number;
  role_id?: number;
  revision_id?: number;
}

interface ImpGrantFilter {
  grant_to_user_id?: number;
  can_impersonate_user_id?: number;
  revision_id?: number;
}

interface GroupUpsertBody {
  group_id: number;
  selection_id?: number;
  filter_id?: number;
  user_id?: number;
  role_id?: number;
  assigned_by_revision_id: number;
  revoked_by_revision_id: number | null;
}

interface ImpGrantUpsertBody {
  grant_to_user_id: number;
  can_impersonate_user_id: number | null;
  can_impersonate_email_pattern: string | null;
  assigned_by_revision_id: number;
  revoked_by_revision_id: number | null;
}

export function useAssociationsApi() {
  const api = useApi();
  return {
    listRevisionDetails: (q: RevisionDetailsQuery) =>
      api<AssociationRevisionDetail[]>('/associations/revision-details', { query: q }),

    listGroupUsers: (q: GroupRelFilter) =>
      api<GroupUserAssociation[]>('/associations/group-users', { query: q }),
    upsertGroupUser: (b: GroupUpsertBody) =>
      api<GroupUserAssociation>('/associations/group-users', { method: 'POST', body: b }),

    listGroupRoles: (q: GroupRelFilter) =>
      api<GroupRoleAssociation[]>('/associations/group-roles', { query: q }),
    upsertGroupRole: (b: GroupUpsertBody) =>
      api<GroupRoleAssociation>('/associations/group-roles', { method: 'POST', body: b }),

    listGroupFilters: (q: GroupRelFilter) =>
      api<GroupFilterAssociation[]>('/associations/group-filters', { query: q }),
    upsertGroupFilter: (b: GroupUpsertBody) =>
      api<GroupFilterAssociation>('/associations/group-filters', { method: 'POST', body: b }),

    listGroupSelections: (q: GroupRelFilter) =>
      api<GroupSelectionAssociation[]>('/associations/group-selections', { query: q }),
    upsertGroupSelection: (b: GroupUpsertBody) =>
      api<GroupSelectionAssociation>('/associations/group-selections', { method: 'POST', body: b }),

    listImpersonationGrants: (q: ImpGrantFilter) =>
      api<ImpersonationGrantAssociation[]>('/associations/impersonation-grants', { query: q }),
    upsertImpersonationGrant: (b: ImpGrantUpsertBody) =>
      api<ImpersonationGrantAssociation>('/associations/impersonation-grants', {
        method: 'POST',
        body: b,
      }),
  };
}
