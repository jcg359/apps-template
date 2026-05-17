import { useApi } from './client';
import type {
  FilterDefinition,
  FilterSubject,
  GroupSubject,
  RoleSubject,
  SelectionDefinition,
  SelectionSubject,
  SubjectRevisionRow,
  SubjectState,
  UserSubject,
} from './types';

export type UserWriteBody = { revision_id: number; user_email: string; user_is_active: boolean };
export type RoleWriteBody = { revision_id: number; role_code: string; role_name: string };
export type GroupWriteBody = { revision_id: number; group_code: string; group_name: string };
export type FilterWriteBody = {
  revision_id: number;
  filter_code: string;
  filter_name: string;
  filter_dataset_name: string;
  filter_definition: FilterDefinition;
};
export type SelectionWriteBody = {
  revision_id: number;
  selection_code: string;
  selection_name: string;
  selection_dataset_name: string;
  selection_definition: SelectionDefinition;
};

interface SubjectsRevisionsQuery {
  revision_id?: number;
  from_date?: string;
  to_date?: string;
  pending?: boolean;
}

export function useSubjectsApi() {
  const api = useApi();

  return {
    // Cross-entity view
    listRevisions: (q: SubjectsRevisionsQuery) =>
      api<SubjectRevisionRow[]>('/subjects/revisions', { query: q }),

    // Users
    listUsers: (revision_id?: number) =>
      api<UserSubject[]>('/subjects/users', { query: { revision_id } }),
    getUser: (subject_id: number) =>
      api<SubjectState<UserSubject>>(`/subjects/users/${subject_id}`),
    createUser: (body: UserWriteBody) =>
      api<UserSubject>('/subjects/users', { method: 'POST', body }),
    patchUser: (subject_id: number, body: UserWriteBody) =>
      api<UserSubject>(`/subjects/users/${subject_id}`, { method: 'PATCH', body }),

    // Roles
    listRoles: (revision_id?: number) =>
      api<RoleSubject[]>('/subjects/roles', { query: { revision_id } }),
    getRole: (subject_id: number) =>
      api<SubjectState<RoleSubject>>(`/subjects/roles/${subject_id}`),
    createRole: (body: RoleWriteBody) =>
      api<RoleSubject>('/subjects/roles', { method: 'POST', body }),
    patchRole: (subject_id: number, body: RoleWriteBody) =>
      api<RoleSubject>(`/subjects/roles/${subject_id}`, { method: 'PATCH', body }),

    // Groups
    listGroups: (revision_id?: number) =>
      api<GroupSubject[]>('/subjects/groups', { query: { revision_id } }),
    getGroup: (subject_id: number) =>
      api<SubjectState<GroupSubject>>(`/subjects/groups/${subject_id}`),
    createGroup: (body: GroupWriteBody) =>
      api<GroupSubject>('/subjects/groups', { method: 'POST', body }),
    patchGroup: (subject_id: number, body: GroupWriteBody) =>
      api<GroupSubject>(`/subjects/groups/${subject_id}`, { method: 'PATCH', body }),

    // Filters
    listFilters: (revision_id?: number) =>
      api<FilterSubject[]>('/subjects/filters', { query: { revision_id } }),
    getFilter: (subject_id: number) =>
      api<SubjectState<FilterSubject>>(`/subjects/filters/${subject_id}`),
    createFilter: (body: FilterWriteBody) =>
      api<FilterSubject>('/subjects/filters', { method: 'POST', body }),
    patchFilter: (subject_id: number, body: FilterWriteBody) =>
      api<FilterSubject>(`/subjects/filters/${subject_id}`, { method: 'PATCH', body }),

    // Selections
    listSelections: (revision_id?: number) =>
      api<SelectionSubject[]>('/subjects/selections', { query: { revision_id } }),
    getSelection: (subject_id: number) =>
      api<SubjectState<SelectionSubject>>(`/subjects/selections/${subject_id}`),
    createSelection: (body: SelectionWriteBody) =>
      api<SelectionSubject>('/subjects/selections', { method: 'POST', body }),
    patchSelection: (subject_id: number, body: SelectionWriteBody) =>
      api<SelectionSubject>(`/subjects/selections/${subject_id}`, { method: 'PATCH', body }),
  };
}
