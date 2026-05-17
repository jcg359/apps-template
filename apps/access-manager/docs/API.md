# Access Controls API

FastAPI service managing the access control configuration for the access management platform. All endpoints are under `/v1` and require an Azure AD bearer token with the `apps.access` scope.

## Auth model

Two roles gate write vs. read access. Both are evaluated against the calling user's email via the controls store.

| Role | Can do |
|---|---|
| `access_admin` | All write operations (create, update, apply, discard, upsert) |
| `access_role` | All read operations; also satisfies `access_admin` check |

Impersonation is supported on `/access/profile` — an admin can pass an `X-Impersonate` header to read another user's profile as if they were that user.

---

## Revisions (`/v1/revisions`)

A **revision** is a named change-set (ULID code, human description). Subjects and associations are attached to a revision when created or updated. Nothing takes effect until the revision is applied.

### Lifecycle

```
pending → applied  (subjects promoted, associations activated)
        → discarded (pending changes rolled back, pending revocations cleared)
```

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/revisions/pending` | access_role | Pending revisions in date range. Defaults to last 7 days. |
| `GET` | `/revisions/applied` | access_role | Applied revisions in date range. Defaults to last 7 days. |
| `GET` | `/revisions/{revision_id}` | access_role | Single revision by ID. |
| `POST` | `/revisions` | access_admin | Create a new pending revision. `revision_code` is a server-generated ULID. |
| `PATCH` | `/revisions/{revision_id}` | access_admin | Update description of a pending revision. |
| `POST` | `/revisions/{revision_id}/apply` | access_admin | Apply revision: promotes all pending subjects and activates all pending association assignments. |
| `POST` | `/revisions/{revision_id}/discard` | access_admin | Discard revision: rolls back pending subject changes and nulls any pending association revocations that referenced this revision. |

#### Date range filtering

The `from_date` / `to_date` query params are calendar dates. Internally, filtering is done by mapping each date to its ULID boundary (since `revision_code` is a ULID whose timestamp encodes creation time).

#### Create request body

```json
{ "revision_description": "string" }
```

#### Response shape

```json
{
  "revision_id": 1,
  "revision_code": "01JVBQ...",
  "revision_description": "string",
  "revision_at": "2026-05-16T10:00:00",
  "revision_by": "user@example.com",
  "applied_at": null,
  "applied_by": null,
  "discarded_at": null,
  "discarded_by": null
}
```

List endpoints wrap results in `{ "from_date": "...", "to_date": "...", "revisions": [...] }`.

---

## Subjects (`/v1/subjects`)

Subjects are the named entities that can be assigned to groups and used in access control. Each subject type has a stable `subject_id`; changes to its attributes travel through the revision system as **pending** revisions before becoming **effective**.

Each GET-by-ID returns both the current effective state and any pending state:

```json
{
  "effective": { ... } | null,
  "pending":   { ... } | null
}
```

Collection GETs return flat rows (one row per revision record). An optional `?revision_id=` filter restricts results to subjects whose pending or effective revision matches.

All writes require a `revision_id` in the body pointing to an existing **pending** revision. A subject can only have one pending revision at a time — attempting to assign a second pending revision returns `409`.

### Users (`/v1/subjects/users`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/subjects/users` | access_role | List all user revision rows. Optional `?revision_id=`. |
| `GET` | `/subjects/users/{subject_id}` | access_role | Effective + pending state for one user. |
| `POST` | `/subjects/users` | access_admin | Create new user subject under a revision. |
| `PATCH` | `/subjects/users/{subject_id}` | access_admin | Update existing user subject under a revision. |

Request body: `{ "revision_id": int, "user_email": "string", "user_is_active": bool }`

### Roles (`/v1/subjects/roles`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/subjects/roles` | access_role | List all role revision rows. Optional `?revision_id=`. |
| `GET` | `/subjects/roles/{subject_id}` | access_role | Effective + pending state for one role. |
| `POST` | `/subjects/roles` | access_admin | Create new role subject. |
| `PATCH` | `/subjects/roles/{subject_id}` | access_admin | Update existing role subject. |

Request body: `{ "revision_id": int, "role_code": "string", "role_name": "string" }`

### Groups (`/v1/subjects/groups`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/subjects/groups` | access_role | List all group revision rows. Optional `?revision_id=`. |
| `GET` | `/subjects/groups/{subject_id}` | access_role | Effective + pending state for one group. |
| `POST` | `/subjects/groups` | access_admin | Create new group subject. |
| `PATCH` | `/subjects/groups/{subject_id}` | access_admin | Update existing group subject. |

Request body: `{ "revision_id": int, "group_code": "string", "group_name": "string" }`

### Filters (`/v1/subjects/filters`)

Filters control what rows a group can see in a given dataset by specifying include/exclude predicates per field.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/subjects/filters` | access_role | List all filter revision rows. Optional `?revision_id=`. |
| `GET` | `/subjects/filters/{subject_id}` | access_role | Effective + pending state for one filter. |
| `POST` | `/subjects/filters` | access_admin | Create new filter subject. |
| `PATCH` | `/subjects/filters/{subject_id}` | access_admin | Update existing filter subject. |

Request body:

```json
{
  "revision_id": 1,
  "filter_code": "string",
  "filter_name": "string",
  "filter_dataset_name": "string",
  "filter_definition": {
    "filters": [
      { "key": "field_name", "values": ["a", "b"], "deny": false }
    ]
  }
}
```

`key` and `values` are nullable. `deny: true` inverts the filter to an exclusion list. `filters` itself may be null (pass-all).

### Selections (`/v1/subjects/selections`)

Selections control which fields a group can see in a dataset.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/subjects/selections` | access_role | List all selection revision rows. Optional `?revision_id=`. |
| `GET` | `/subjects/selections/{subject_id}` | access_role | Effective + pending state for one selection. |
| `POST` | `/subjects/selections` | access_admin | Create new selection subject. |
| `PATCH` | `/subjects/selections/{subject_id}` | access_admin | Update existing selection subject. |

Request body:

```json
{
  "revision_id": 1,
  "selection_code": "string",
  "selection_name": "string",
  "selection_dataset_name": "string",
  "selection_definition": {
    "visible_fields": ["col_a", "col_b"],
    "denied_fields": null
  }
}
```

Both `visible_fields` and `denied_fields` are nullable.

#### Subject write semantics

- On **create** (`POST`): a new `access_subject` record is created immediately with the provided subject key (email/code). The entity revision row is inserted as pending.
- On **update** (`PATCH`): the subject key in `access_subject` is **not** updated until the revision is applied. Until then only the pending revision row is updated.
- On **apply**: the subject key in `access_subject` is synced from the pending entity revision, and the pending revision becomes the effective revision.
- On **discard**: the pending revision row is abandoned; `access_subject.pending_revision_id` is cleared; the subject key is unchanged.

#### Subject write errors

| Status | Condition |
|---|---|
| `404` | `subject_id` not found (PATCH only) |
| `409` | Subject already has a different pending revision |
| `409` | `revision_id` is not pending |
| `409` | Subject exists under a different entity type |

### Subject revisions view (`/v1/subjects/revisions`)

Cross-entity view of all subject revision states. Returns one row per revision record (effective or pending) across all 5 entity types. Exactly one of three modes must be specified:

| Query param | Behaviour |
|---|---|
| `revision_id=N` | Rows where `effective_revision_id = N` OR `pending_revision_id = N` |
| `from_date` + `to_date` | Effective rows (`is_effective=1`) where the revision's `applied_at` date falls in the range |
| `pending=true` | Pending rows only (`is_effective=0`) |

Response fields: `id` (subject_id), `subject_type` (user/role/group/filter/selection), `subject_value` (email/code), `subject_detail` (name/dataset/active label), `is_effective`, `pending_exists`, `effective_revision_id`, `effective_at`, `pending_revision_id`.

---

## Associations (`/v1/associations`)

Associations link subjects to each other (group → user, group → role, group → filter, group → selection, user → impersonation grant). Each link is attached to an `assigned_by_revision_id`. Revocation is done by setting `revoked_by_revision_id`.

### Read endpoints

All read endpoints require at least one filter and return `422` if none are supplied. `revision_id` matches either `assigned_by_revision_id` or `revoked_by_revision_id`.

| Method | Path | Filters | Auth |
|---|---|---|---|
| `GET` | `/associations/group-selections` | `group_id`, `selection_id`, `revision_id` | access_role |
| `GET` | `/associations/group-filters` | `group_id`, `filter_id`, `revision_id` | access_role |
| `GET` | `/associations/group-users` | `group_id`, `user_id`, `revision_id` | access_role |
| `GET` | `/associations/group-roles` | `group_id`, `role_id`, `revision_id` | access_role |
| `GET` | `/associations/impersonation-grants` | `grant_to_user_id`, `can_impersonate_user_id`, `revision_id` | access_role |

Each returns a list of fully-joined detail objects that include the entity codes/names/revision states from both sides of the link (e.g. `group_code`, `selection_code`, `selection_definition`, pending revision flags).

#### Normalized union view

`GET /associations/revision-details` returns all association types in a single normalized list. Exactly one of the three modes must be specified:

| Query param | Behaviour |
|---|---|
| `revision_id=N` | Rows where `assigned_by_revision_id = N` OR `revoked_by_revision_id = N` |
| `from_date` + `to_date` | Rows where assignment or revocation applied date falls in the calendar range |
| `pending=true` | Rows where both applied dates are null (no revision has been applied yet) |

Response fields: `association_type`, `association_id`, `type_from`, `id_from`, `type_to`, `to_id`, `from_value`, `from_detail`, `to_value`, `to_detail`, `assigned_by_revision_id`, `revoked_by_revision_id`, `assignment_applied_at`, `revocation_applied_at`.

### Write endpoints (upsert)

Each POST endpoint handles both **assign** (insert) and **revoke** (update) in one call, discriminated by `revoked_by_revision_id`:

- `revoked_by_revision_id: null` → **insert** a new assignment
- `revoked_by_revision_id: <id>` → **revoke** an existing applied assignment

| Method | Path | Auth |
|---|---|---|
| `POST` | `/associations/group-selections` | access_admin |
| `POST` | `/associations/group-filters` | access_admin |
| `POST` | `/associations/group-users` | access_admin |
| `POST` | `/associations/group-roles` | access_admin |
| `POST` | `/associations/impersonation-grants` | access_admin |

All POST endpoints return the full detail object for the affected row (same shape as the corresponding GET).

#### Insert rules

1. `assigned_by_revision_id` must be a **pending** revision (not applied, not discarded).
2. No active pairing may exist for the same entity IDs. An existing pairing is considered active if `revoked_by_revision_id IS NULL` or the referenced revocation revision is not yet applied.

#### Revoke rules

1. `revoked_by_revision_id` must be a **pending** revision.
2. An existing row must exist for the same entity IDs where `assigned_by_revision_id` has been **applied** and `revoked_by_revision_id IS NULL`.

#### Discard side-effect

When a revision is discarded, any `revoked_by_revision_id` references to that revision across all junction tables are cleared (set to NULL). This effectively restores those associations to an unrevoked state.

#### Group-* request bodies

```json
{
  "group_id": 1,
  "<entity>_id": 2,
  "assigned_by_revision_id": 10,
  "revoked_by_revision_id": null
}
```

Where `<entity>` is `selection`, `filter`, `user`, or `role`.

#### Impersonation grant request body

```json
{
  "grant_to_user_id": 1,
  "can_impersonate_user_id": 2,
  "can_impersonate_email_pattern": null,
  "assigned_by_revision_id": 10,
  "revoked_by_revision_id": null
}
```

Exactly one of `can_impersonate_user_id` or `can_impersonate_email_pattern` must be non-null (`422` if both null or both non-null).

#### Association write errors

| Status | Condition |
|---|---|
| `404` | Revision not found |
| `404` | No active applied association found to revoke |
| `409` | Revision is not pending |
| `409` | Active association already exists for these entities (insert path) |

---

## Dated access (`/v1/dated-access`)

Read-only views of access pairings that have been applied (i.e. `assigned_at` is not null). These represent the access state at a given point in time rather than the pending/effective revision state.

All endpoints require `access_role` and accept the same two query parameters:

| Parameter | Behaviour |
|---|---|
| `effective_date` (date, default: today) | Return rows active on that date: `effective_date >= assigned_at AND (revoked_at IS NULL OR effective_date < revoked_at)`. For views with user membership dates, the same bounds also apply to `user_included_at` / `user_removed_at`. |
| `user_email` (string) | Bypass date filtering; search across all dates by email. Input is trimmed and lowercased. If no `@` is present, `@marinercapital.com` is appended. Matches on `LOWER(user_email)` (or `LOWER(grant_to_user_email)` for impersonation grants). |

When `user_email` is supplied, `effective_date` is ignored.

| Method | Path | View | User membership date filter |
|---|---|---|---|
| `GET` | `/dated-access/group-users` | `vw_access_dated_group_users` | No |
| `GET` | `/dated-access/user-roles` | `vw_access_dated_user_roles` | Yes |
| `GET` | `/dated-access/user-filters` | `vw_access_dated_user_filters` | Yes |
| `GET` | `/dated-access/user-selections` | `vw_access_dated_user_selections` | Yes |
| `GET` | `/dated-access/impersonation-grants` | `vw_access_dated_impersonation_grants` | No |

#### Response fields by endpoint

**`/dated-access/group-users`** — `user_subject_id`, `user_email`, `user_is_active`, `group_subject_id`, `group_code`, `group_name`, `assigned_at`, `assigned_by`, `revoked_at`, `revoked_by`

**`/dated-access/user-roles`** — all group-user fields plus `user_included_at`, `user_included_by`, `user_removed_at`, `user_removed_by`, `role_subject_id`, `role_code`, `role_name`

**`/dated-access/user-filters`** — all group-user fields plus user membership dates, `filter_code`, `filter_name`, `filter_dataset_name`, `filter_definition` (dict)

**`/dated-access/user-selections`** — all group-user fields plus user membership dates, `selection_subject_id`, `selection_code`, `selection_name`, `selection_dataset_name`, `selection_definition` (dict)

**`/dated-access/impersonation-grants`** — `grant_to_user_id`, `grant_to_user_email`, `can_impersonate_email_pattern`, `can_impersonate_user_id`, `can_impersonate_user_email`, `assigned_at`, `assigned_by`, `revoked_at`, `revoked_by`

---

## Access profile (`/v1/access`)

Read-only. Returns the resolved access configuration for a user — their groups, roles, filters, and selections — assembled from the effective state of all subjects.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/access/profile` | any valid token | Caller's own profile. Supports impersonation via `X-Impersonate: email` header (admin only). |
| `GET` | `/access/profile/{email}` | access_role | Profile for an arbitrary email. |
| `GET` | `/access/current-user` | any valid token | Caller identity + env metadata. |

---

## API usage (`/v1/api-usage`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api-usage/aggregation/requests-summary` | access_role | Recent API request activity. `?lookback_days=15` (1–365). Returns per-user last-active timestamps and per-date request counts. |

---

## Common status codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created (POST write operations) |
| `404` | Entity not found |
| `409` | Conflict — revision not pending, duplicate, or type mismatch |
| `422` | Validation error — missing required filter, invalid body |
| `403` | Insufficient role |
| `500` | Unhandled server error |
