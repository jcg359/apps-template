# access-manager

A React SPA for managing the access-controls API documented in [`docs/API.md`](./docs/API.md). Mounted under `/apps/access-manager/*` by the platform's public nginx; authenticates via MSAL.js using the shared single Entra registration (see the repo-level [`docs/architecture.md`](../../docs/architecture.md)).

## Purpose

Covers **every** endpoint in `docs/API.md` with screens. The mental model is "the active pending revision is the protagonist": all writes ride on a revision; nothing changes until applied. Read views show effective and pending side-by-side; write screens are gated on having a pending revision active.

## Aesthetic — read this before "improving" it

**Editorial-archival admin.** Think financial ledger meets legal redline. Don't substitute generic admin-template defaults.

- **Type**: Newsreader (display serif), IBM Plex Sans (body), IBM Plex Mono (codes/timestamps/numerics). Tabular numerals everywhere.
- **Palette**: deep ink + warm paper, restrained grays. **One** accent — desaturated ink-blue (`--accent-pending`, `#2f3f5e`) used *only* for the pending-revision state. Applied = muted slate. Discarded = gray + strikethrough. Impersonation = muted rust.
- **Layout**: narrow left rail with section numerals (§ 01…§ 08), wide main content, asymmetric 5/7 diff grids, hairline rules between sections (no card-in-card).
- **Motion**: CSS-only. Staggered fade-up on page load (`.reveal-1`…`.reveal-4`), pending column slides in from the right, impersonation ribbon drifts. No motion library.
- **Detail texture**: section numerals (§ 01·a) in tiny italic caps, italic timestamps in serif, faint dot-grid background.

Tokens live in `src/styles.css` (`:root`). Tailwind exposes them as `ink-*`, `paper`, `accent-*`, `status-*`.

## Repository layout

```
apps/access-manager/
├── docs/API.md                  # source of truth for the backend contract
├── index.html                   # Vite entry
├── package.json / vite.config.ts / tsconfig.json / tailwind.config.ts
└── src/
    ├── main.tsx                 # bootstraps React, mounts <App />
    ├── App.tsx                  # router + provider chain
    ├── Bootstrap.tsx            # gates app on /api/access/current-user (or mock)
    ├── env.ts / vite-env.d.ts   # typed env access
    ├── auth.ts                  # MSAL instance from @repo/auth + env
    ├── ui-providers.tsx         # <UIProvider> impl for @repo/ui
    ├── styles.css               # design tokens + Tailwind
    ├── api/                     # one module per resource + a tiny client
    │   ├── client.ts            # useApi + useFetch (bearer-injected, cached)
    │   ├── types.ts             # TS shapes for every API response
    │   ├── revisions.ts
    │   ├── subjects.ts
    │   ├── associations.ts
    │   ├── dated-access.ts
    │   ├── profile.ts
    │   └── api-usage.ts
    ├── lib/
    │   ├── active-revision.tsx  # sessionStorage-backed context: the "active" pending revision
    │   ├── permissions.tsx      # CurrentUserProvider + useIsAdmin + <AdminOnly>
    │   └── format.ts            # date / relative / ULID helpers
    ├── components/              # presentational primitives (see "Primitives" below)
    └── routes/                  # one file/dir per screen
        ├── Overview.tsx
        ├── revisions/{Index,Detail}.tsx
        ├── subjects/{Index,Lists,Detail,SubjectDrawer}.tsx
        ├── groups/Workspace.tsx
        ├── Impersonation.tsx
        ├── DatedAccess.tsx
        ├── Profiles.tsx
        └── ApiUsage.tsx
```

## How it boots

1. **`main.tsx`** mounts React under `<AuthProvider>` (`@repo/auth`) + `<AppUIProvider>` (`@repo/ui`).
2. **`App.tsx`** calls `useRequireAuth()` — if not authenticated, MSAL kicks off the redirect via the shell's `/auth-client-redirect` callback. On return, `App` mounts the rest.
3. **`<Bootstrap>`** fetches `/api/access-manager/v1/access/current-user` and seeds the `CurrentUserProvider`. In `VITE_MOCK_USER=1` mode it synthesizes an admin so the app is explorable standalone.
4. **`<ActiveRevisionProvider>`** restores any active revision id from `sessionStorage`. The `<ActiveRevisionPill>` in the top bar lets the user switch, create, or clear it.
5. **`<BrowserRouter basename="/apps/access-manager">`** + nested `<Routes>` mount each screen inside `<Layout>` (left rail + top bar + footer).

```
main.tsx
└── AuthProvider          (@repo/auth · MSAL)
    └── AppUIProvider     (@repo/ui · injects Link + pathname)
        └── App.tsx       (useRequireAuth gate)
            └── Bootstrap (resolves CurrentUser)
                └── ActiveRevisionProvider (sessionStorage-backed)
                    └── BrowserRouter / Routes
                        └── Layout (LeftRail + TopBar + <Outlet/> + footer)
                            └── <Screen />
```

## Key concepts

### Active revision (load-bearing)

A pending revision id is held in `sessionStorage` under `access-manager:active-revision`. Every write screen reads it via `useActiveRevision()`:

```tsx
const { revisionId } = useActiveRevision();
if (revisionId === null) return <RevisionRequiredBanner action="create a user" />;
// otherwise show the create/edit drawer with revisionId in the body
```

The top-bar pill (`ActiveRevisionPill`) is the only globally-visible affordance for switching. Its drawer (`RevisionSwitcher`) lists pending revisions and lets admins create a new one inline.

### Permissions

`Bootstrap` populates `CurrentUserProvider` from `/api/access/current-user`. Throughout the app:

```tsx
const isAdmin = useIsAdmin();          // boolean
<AdminOnly>…write controls…</AdminOnly> // declarative gate
```

Write-action buttons render only for admins; read-only users see the same screens with controls absent. This matches the API's `access_admin` / `access_role` split.

### Mock mode

`VITE_MOCK_USER=1 npm run dev -w apps/access-manager` bypasses MSAL and synthesizes an admin user inside `Bootstrap`. All API calls will still attempt `/api/access-manager/v1/...` and likely 401 — this mode is for **UI iteration** (component layout, styling, navigation), not full integration. Run it on the SPA's own Vite port (`5174` by default), not via nginx.

### API client pattern

Every request uses `useApi()` to inject the bearer token (acquired from MSAL via `acquireToken([env.apiScope])`). All client functions return typed promises. Components consume them with `useFetch(key, fetcher, deps)` — a 30-line SWR-ish hook that handles loading/error/reload.

```tsx
const api = useRevisionsApi();
const { data, error, isLoading, reload } = useFetch('pending', () => api.listPending());
```

Cache invalidation is manual — `reload()` after mutations. There's no global store.

### Backend assumption

The API client targets `/api/access-manager/v1`. The platform's nginx must be configured to route that prefix to the access-controls API backend (its container, internal Container App, etc.). See the repo-level [`docs/adding-a-sub-app.md`](../../docs/adding-a-sub-app.md) §8 for the convention.

## Screen map — every endpoint accounted for

| Route | Endpoints |
|---|---|
| `/` Overview | `GET /revisions/pending`, `/revisions/applied`, `/access/current-user`, `/access/profile`, `/api-usage/aggregation/requests-summary` |
| `/revisions` index | `GET /revisions/pending`, `/revisions/applied`; `POST /revisions` (drawer) |
| `/revisions/:id` detail | `GET /revisions/{id}`; `PATCH /revisions/{id}`; `POST .../apply`, `.../discard`; `GET /subjects/revisions?revision_id=`; `GET /associations/revision-details?revision_id=` |
| `/subjects` cross-entity | `GET /subjects/revisions` (`pending=true` \| `from_date+to_date` \| `revision_id=`) |
| `/subjects/users` list | `GET /subjects/users` |
| `/subjects/users/:id` detail | `GET /subjects/users/{id}` (effective + pending) |
| `/subjects/roles` & `/subjects/roles/:id` | `GET /subjects/roles[/{id}]` |
| `/subjects/groups` & `/groups` list | `GET /subjects/groups` |
| `/subjects/filters` & `/subjects/filters/:id` | `GET /subjects/filters[/{id}]` |
| `/subjects/selections` & `/subjects/selections/:id` | `GET /subjects/selections[/{id}]` |
| **Create/Edit drawer** (one component per subject type) | `POST` / `PATCH /subjects/{type}` for users, roles, groups, filters (with predicate editor), selections (with field selector) |
| `/groups/:id` workspace | `GET /subjects/groups/{id}`; four panels: `GET /associations/group-{users,roles,filters,selections}?group_id=`; `POST` upsert for add/revoke |
| `/impersonation` | `GET /associations/impersonation-grants` (filterable); `POST` for new grant (specific user or email pattern) |
| `/dated-access` (5 tabs) | `GET /dated-access/{group-users,user-roles,user-filters,user-selections,impersonation-grants}` with `effective_date` or `user_email` filter |
| `/profiles` | `GET /access/profile` (self or via `X-Impersonate` header for admins); `GET /access/profile/{email}` lookup |
| `/api-usage` | `GET /api-usage/aggregation/requests-summary?lookback_days=` (slider 1–365) |

## Primitives (in `src/components/`)

| Component | Purpose |
|---|---|
| `Layout` | LeftRail + TopBar + Outlet + footer |
| `LeftRail` | Numbered nav (§ 01…§ 08), two sections separated by hairline |
| `TopBar` | `ActiveRevisionPill` · user identity · role · sign out |
| `ActiveRevisionPill` + `RevisionSwitcher` | Top-bar pill + drawer; lists pending revisions, supports inline create |
| `PageHeader` | Numeral + eyebrow + display-serif title + description + actions row |
| `DiffPanel` | Asymmetric 5/7 effective-vs-pending grid; pending column slides in |
| `RevisionRequiredBanner` | Shown when a write screen needs an active revision |
| `ImpersonationRibbon` | Drifting striped banner when viewing as another user |
| `Table` + `THead`/`TBody`/`TR`/`TH`/`TD` | Ledger-style table; tabular numerics, hairline row separators |
| `Drawer` | Right-side slide-in modal for forms; ESC closes; backdrop click closes |
| `Button` | `primary` / `secondary` / `ghost` / `danger`; serif label tracking |
| `Field` (`Input` / `Select` / `Textarea` / `Checkbox` / `FieldGroup` / `Label`) | Monospace inputs; tiny-caps section-numeral labels |
| `StatusBadge` | Pending / Applied / Discarded — uses the one accent for pending |
| `ULID` | Click-to-copy ULID display in monospace, with shortening |
| `Timestamp` | `abs` / `rel` / `both` modes; serif italic for relative |
| `LoadingState` / `EmptyState` / `ErrorState` | Editorial blank/loading/error treatments |

## Adding a new screen

1. Drop a route file in `src/routes/<Group>/<Name>.tsx`. Export a component.
2. Add the route in `App.tsx` under the right path.
3. Add a `LeftRail` entry if it's a top-level destination.
4. Reach for the existing primitives — `PageHeader`, `Table`, `DiffPanel`, drawers, `useFetch`, `useActiveRevision`, `useIsAdmin`. Don't introduce a new style system.
5. If the screen needs a new API endpoint, add the typed function in the matching `src/api/*.ts` (and a type in `src/api/types.ts`) before consuming it.

## Local dev

```bash
# UI iteration, no backend, mock admin user
VITE_MOCK_USER=1 npm run dev -w apps/access-manager
# → http://localhost:5174/apps/access-manager/

# Integrated mode (requires nginx + real backend behind /api/access-manager/v1/*)
npm run dev -w apps/access-manager
# Then hit http://localhost:8080/apps/access-manager/ via the platform nginx
```

Required env vars (`.env`, see `.env.example`):

- `VITE_AUTH_CLIENT_ID`, `VITE_AUTH_TENANT_ID` — shared Entra app reg
- `VITE_AUTH_REDIRECT_URI` — defaults to `${origin}/auth-client-redirect`
- `VITE_AUTH_API_SCOPE` — set to the access-controls API scope (e.g. `api://<client-id>/apps.access`)
- `VITE_MOCK_USER=1` — optional, dev only

## Known gaps

- **Revision-conflict UX** — 409s surface as inline error text on the form. A richer "view the conflicting revision" affordance isn't built; do it when it becomes a real annoyance.
- **Filter / search on long lists** — current per-type lists render the full set. Add server-side or client-side filtering when row counts pass the eyeball threshold.
- **No optimistic updates** — every mutation triggers `reload()`. Fine for now; revisit if the latency feels sluggish.
- **No tests** — same as the rest of the repo (see top-level `docs/onboarding.md` §8).
