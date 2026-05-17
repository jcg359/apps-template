// Types mirror the shapes documented in apps/access-manager/docs/API.md.
// Keep this file as the single source of truth; per-resource modules reference these.

// ─── Revisions ──────────────────────────────────────────────────────────────

export interface Revision {
  revision_id: number;
  revision_code: string;
  revision_description: string;
  revision_at: string;
  revision_by: string;
  applied_at: string | null;
  applied_by: string | null;
  discarded_at: string | null;
  discarded_by: string | null;
}

export type RevisionStatus = 'pending' | 'applied' | 'discarded';

export function revisionStatus(r: Revision): RevisionStatus {
  if (r.applied_at) return 'applied';
  if (r.discarded_at) return 'discarded';
  return 'pending';
}

export interface RevisionListResponse {
  from_date: string;
  to_date: string;
  revisions: Revision[];
}

// ─── Subjects ───────────────────────────────────────────────────────────────

export type SubjectType = 'user' | 'role' | 'group' | 'filter' | 'selection';

export interface UserSubject {
  subject_id: number;
  user_email: string;
  user_is_active: boolean;
  revision_id: number;
  is_effective: boolean;
}

export interface RoleSubject {
  subject_id: number;
  role_code: string;
  role_name: string;
  revision_id: number;
  is_effective: boolean;
}

export interface GroupSubject {
  subject_id: number;
  group_code: string;
  group_name: string;
  revision_id: number;
  is_effective: boolean;
}

export interface FilterPredicate {
  key: string | null;
  values: string[] | null;
  deny: boolean;
}

export interface FilterDefinition {
  filters: FilterPredicate[] | null;
}

export interface FilterSubject {
  subject_id: number;
  filter_code: string;
  filter_name: string;
  filter_dataset_name: string;
  filter_definition: FilterDefinition;
  revision_id: number;
  is_effective: boolean;
}

export interface SelectionDefinition {
  visible_fields: string[] | null;
  denied_fields: string[] | null;
}

export interface SelectionSubject {
  subject_id: number;
  selection_code: string;
  selection_name: string;
  selection_dataset_name: string;
  selection_definition: SelectionDefinition;
  revision_id: number;
  is_effective: boolean;
}

export interface SubjectState<T> {
  effective: T | null;
  pending: T | null;
}

export interface SubjectRevisionRow {
  id: number;
  subject_type: SubjectType;
  subject_value: string;
  subject_detail: string;
  is_effective: boolean;
  pending_exists: boolean;
  effective_revision_id: number | null;
  effective_at: string | null;
  pending_revision_id: number | null;
}

// ─── Associations ───────────────────────────────────────────────────────────

export type AssociationType =
  | 'group-users'
  | 'group-roles'
  | 'group-filters'
  | 'group-selections'
  | 'impersonation-grants';

interface AssociationCommon {
  association_id: number;
  assigned_by_revision_id: number;
  revoked_by_revision_id: number | null;
  assignment_applied_at: string | null;
  revocation_applied_at: string | null;
}

export interface GroupUserAssociation extends AssociationCommon {
  group_id: number;
  group_code: string;
  group_name: string;
  user_id: number;
  user_email: string;
  user_is_active: boolean;
  user_pending_exists?: boolean;
  group_pending_exists?: boolean;
}

export interface GroupRoleAssociation extends AssociationCommon {
  group_id: number;
  group_code: string;
  group_name: string;
  role_id: number;
  role_code: string;
  role_name: string;
}

export interface GroupFilterAssociation extends AssociationCommon {
  group_id: number;
  group_code: string;
  group_name: string;
  filter_id: number;
  filter_code: string;
  filter_name: string;
  filter_dataset_name: string;
  filter_definition: FilterDefinition;
}

export interface GroupSelectionAssociation extends AssociationCommon {
  group_id: number;
  group_code: string;
  group_name: string;
  selection_id: number;
  selection_code: string;
  selection_name: string;
  selection_dataset_name: string;
  selection_definition: SelectionDefinition;
}

export interface ImpersonationGrantAssociation extends AssociationCommon {
  grant_to_user_id: number;
  grant_to_user_email: string;
  can_impersonate_user_id: number | null;
  can_impersonate_user_email: string | null;
  can_impersonate_email_pattern: string | null;
}

export interface AssociationRevisionDetail {
  association_type: AssociationType;
  association_id: number;
  type_from: SubjectType;
  id_from: number;
  type_to: SubjectType | 'pattern';
  to_id: number | null;
  from_value: string;
  from_detail: string;
  to_value: string;
  to_detail: string;
  assigned_by_revision_id: number;
  revoked_by_revision_id: number | null;
  assignment_applied_at: string | null;
  revocation_applied_at: string | null;
}

// ─── Dated access ───────────────────────────────────────────────────────────

export interface DatedAccessCommon {
  user_subject_id: number;
  user_email: string;
  user_is_active: boolean;
  group_subject_id: number;
  group_code: string;
  group_name: string;
  assigned_at: string;
  assigned_by: string;
  revoked_at: string | null;
  revoked_by: string | null;
}

export interface DatedAccessWithMembership extends DatedAccessCommon {
  user_included_at: string;
  user_included_by: string;
  user_removed_at: string | null;
  user_removed_by: string | null;
}

export type DatedGroupUser = DatedAccessCommon;

export interface DatedUserRole extends DatedAccessWithMembership {
  role_subject_id: number;
  role_code: string;
  role_name: string;
}

export interface DatedUserFilter extends DatedAccessWithMembership {
  filter_code: string;
  filter_name: string;
  filter_dataset_name: string;
  filter_definition: FilterDefinition;
}

export interface DatedUserSelection extends DatedAccessWithMembership {
  selection_subject_id: number;
  selection_code: string;
  selection_name: string;
  selection_dataset_name: string;
  selection_definition: SelectionDefinition;
}

export interface DatedImpersonationGrant {
  grant_to_user_id: number;
  grant_to_user_email: string;
  can_impersonate_email_pattern: string | null;
  can_impersonate_user_id: number | null;
  can_impersonate_user_email: string | null;
  assigned_at: string;
  assigned_by: string;
  revoked_at: string | null;
  revoked_by: string | null;
}

// ─── Access profile ─────────────────────────────────────────────────────────

export interface AccessProfileGroup {
  group_subject_id: number;
  group_code: string;
  group_name: string;
}

export interface AccessProfileRole {
  role_subject_id: number;
  role_code: string;
  role_name: string;
  via_group_code: string;
}

export interface AccessProfileFilter {
  filter_code: string;
  filter_name: string;
  filter_dataset_name: string;
  filter_definition: FilterDefinition;
  via_group_code: string;
}

export interface AccessProfileSelection {
  selection_code: string;
  selection_name: string;
  selection_dataset_name: string;
  selection_definition: SelectionDefinition;
  via_group_code: string;
}

export interface AccessProfile {
  user_email: string;
  groups: AccessProfileGroup[];
  roles: AccessProfileRole[];
  filters: AccessProfileFilter[];
  selections: AccessProfileSelection[];
}

export interface CurrentUser {
  email: string;
  name?: string;
  is_admin: boolean;
  is_read_role: boolean;
  environment?: string;
}

// ─── API usage ──────────────────────────────────────────────────────────────

export interface ApiUsageUserActivity {
  user_email: string;
  last_active_at: string;
  request_count: number;
}

export interface ApiUsageDateBucket {
  request_date: string;
  request_count: number;
}

export interface ApiUsageSummary {
  lookback_days: number;
  per_user: ApiUsageUserActivity[];
  per_date: ApiUsageDateBucket[];
}
