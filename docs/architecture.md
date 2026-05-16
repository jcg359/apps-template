# Composite app architecture

This document captures the architectural decisions behind this monorepo that aren't directly visible from the code. Read this before making changes that touch cross-app navigation, auth, or how external apps consume `@repo/*` packages.

## 1. The composite app pattern

The shell (`apps/shell`) owns:

- The user's URL space (`shell.example.com/*`)
- Authentication — the only thing that talks to Microsoft Entra ID
- Navigation chrome (header, app launcher, app-selector landing page)
- Routing decisions (which path prefix goes to which sub-app)

Sub-apps mount under path prefixes via shell rewrites in `apps/shell/next.config.ts`. **From the browser's perspective everything is one origin** — the shell domain. Cross-app routing is a server-side rewrite.

### Why same-origin matters (the load-bearing property)

The NextAuth session cookie is scoped to an origin, not to the OAuth client. Same-origin means the cookie is automatically sent on every cross-app navigation — **no re-auth round-trips, no SSO redirect on "back" navigation.** This is the constraint that drove the entire architecture.

The Microsoft Entra app registration being shared across apps is an ergonomic convenience (one set of redirect URIs to manage), **not** what enables SSO. Cookie scope is.

## 2. Auth model

- **Single Entra app registration** for the platform. Only the shell needs a redirect URI registered.
- **Shell is the only thing that talks to Entra.** Sub-apps never initiate OAuth flows.
- **Shell sets the session cookie** via NextAuth v5 (`apps/shell/src/auth.ts`). Encrypted with `AUTH_SECRET`.
- **Two ways sub-apps validate that cookie**:
  1. **Shared `AUTH_SECRET`** (Next.js sub-apps) — decrypt the JWT directly. Zero network hop.
  2. **BFF call** (React SPAs and other non-Next sub-apps) — `fetch('/api/session')` against the shell. Same-origin from the browser's POV because of shell rewrites, so the cookie is attached automatically.

### Dev bypass

`SKIP_AUTH=1` in dev disables the proxy entirely so the UI can be previewed without Entra credentials. Hard-gated to `NODE_ENV !== 'production'` in `apps/shell/src/proxy.ts` — the flag is inert in production builds even if someone sets it.

## 3. Sub-app distribution — three live paths, one future path

| Sub-app shape | Where it lives | How it gets `@repo/*` | Auth |
|---|---|---|---|
| Next.js | This monorepo as `apps/<name>/` | Workspace dep, imports source | Shared `AUTH_SECRET` |
| Next.js, separate repo *(future, if needed)* | External | npm install from git URL (`"@repo/ui": "github:org/apps-template#sha"`) | Shared `AUTH_SECRET` |
| React SPA, separate repo | External | **Git subtree** of `packages/ui/src/` | BFF — fetch `/api/session` |
| Non-React *(future, when a consumer appears)* | External | **Web Components** from `packages/ui-elements/` (not yet built) | BFF — WC fetches `/api/session` itself |

### The cross-repo decision: subtree now, Web Components later

For sharing UI components with apps in separate repos, the chosen approach is to support two delivery paths from the same source:

- **Today**: React SPAs in separate repos consume `packages/ui/src/` via `git subtree pull`. They compile the source in their own build. Pinned to whatever commit they pulled. Updates are manual (a scheduled CI PR is a reasonable enhancement).
- **When a non-React or zero-coupling consumer appears**: build `packages/ui-elements/` — a thin wrapper that takes the same React components and exposes them as custom elements (`customElements.define`). Builds to a single static JS bundle served by the shell at a stable URL. Consumers add one `<script>` tag and use HTML tags.

Both paths share the same `packages/ui` source. A bug fix flows to both. The Web Components path is **not built yet** and shouldn't be built speculatively — the cost is real (extra workspace, bundle target, hosting, runtime failure modes) and only justified by a real consumer.

#### How components get user / app-identity context in each path

Components occasionally need to know "who is the user" and "what app is rendering me."

| Concern | Subtree path | Web Component path |
|---|---|---|
| User identity | Consumer passes via prop or React context | Component fetches `/api/session` itself on mount (cookie attached automatically because same-origin via shell rewrite) |
| App identity | Prop | HTML attribute |
| Sharing React context with consumer | ✅ yes | ❌ no — props only |
| Passing JSX children | ✅ yes | ❌ no (or via slots, awkward) |

Subtree is the more ergonomic match when the launcher needs to read consumer state. Web Components are the more decoupled match for truly independent embedding.

### Prerequisite for both paths

`packages/ui` currently imports `next/link` and `next/navigation` directly. Non-Next React consumers can't use these as-is. **The pending refactor is to inject `Link` and `usePathname` via a `<UIProvider>` context** — Next apps pass Next's versions, SPAs pass `react-router`'s. After this lands, subtree is immediately viable; the Web Components path becomes feasible at any time.

### What was explicitly ruled out

| Approach | Why not |
|---|---|
| npm registry publishing | No registry infrastructure to maintain; no version-pinning ergonomics needed for this use case |
| Module Federation (Webpack or Vite) | Operational complexity, version-skew failure modes, runtime fragility; also incompatible with Next 16's Turbopack |
| `file:` dep / `npm link` for dev, build artifact for prod | Fragile in CI, requires sibling-checkout discipline |
| Iframes per sub-app | Layout/focus/scroll issues, auth-context isolation, UX feel |
| Moving the existing sub-app into this monorepo | The sub-app already lives in its own repo; cannot be moved |
| A shared `@repo/config` package for the apps list | Apps list is provided by the caller (see §4). A shared package would lock callers into one source of truth, which is the wrong direction given the database-backed future. |

## 4. The apps list (launcher catalog)

The list of apps shown in the launcher popover and on the app-selector landing page is **provided by the consuming app**. There is no `@repo/config` package and there will not be one.

- **Today**: each app passes its own `AppDefinition[]` as a prop to `AppLauncherButton` and `AppCardGrid`. The shell's list lives in `apps/shell/src/config/apps.ts`.
- **Eventually**: this list will come from a database. The component contract (caller provides the list) was designed specifically to make that swap a one-place change in each consumer — no shared package to update, no version bump to propagate.

## 5. Cross-app navigation behavior

Clicking a card in the launcher triggers a top-level browser navigation (`<Link href="/dashboard">`, etc.). Because everything is same-origin via shell rewrites, the navigation is a regular page load with the auth cookie attached. **No Entra round-trip, no sign-in page** — the user perceives "click and you're there."

It is still a full page load. Two separate Next instances cannot share a React tree; state doesn't carry across. This is acceptable — cookie-warm page load is sub-100ms in practice. True zero-reload navigation would require module federation, which is explicitly off the table (§3).

## 6. Visual language

White background, grayscale palette, no bold colors. The Tailwind preset in `packages/design-tokens/src/tailwind-preset.js` still defines a `primary` color scale for future use, but components in `packages/ui` deliberately default to the neutral scale. Components are designed to look intentional in pure black/white/gray.

## 7. Workspace boundaries (why each package is shaped the way it is)

- **`@repo/auth`** — stack-agnostic. No React dependency. Importable by future backend services as well as Next apps. The Entra provider config (`entra.ts`) is real and consumed by the shell; `session.ts` and `middleware.ts` are typed placeholders intended to grow into real cross-service helpers when needed.
- **`@repo/design-tokens`** — fully stack-agnostic. CSS custom properties + a Tailwind preset. No React. This is what lets a future non-React sub-app stay visually consistent.
- **`@repo/ui`** — React + Tailwind. Currently Next-coupled via `next/link` and `next/navigation`; pending `UIProvider` refactor to remove that coupling (see §3).
- **`@repo/tsconfig`** — shared TypeScript presets only.

## 8. Next.js 16 specifics worth knowing

These caught us during scaffolding and aren't obvious from the code:

- `middleware.ts` was renamed to `proxy.ts`. The export must be named `proxy` (or default).
- `experimental.typedRoutes` moved to top-level `typedRoutes` in `next.config.ts`.
- `next lint` was removed in Next 16. Use `eslint` directly. `eslint-config-next` requires ESLint 9 with flat config (`eslint.config.mjs`).
- NextAuth's `auth/handlers/signIn/signOut` re-exports require explicit type annotation (`NextAuthResult[...]`) to avoid "type not portable" errors during Next's stricter type-check pass. See `apps/shell/src/auth.ts`.
- Turbopack is the default builder. Module Federation tooling does not currently support it — another reason MFE is off the table for Next sub-apps.

## 9. Containerization

Both a root `Dockerfile` (monorepo-aware, parameterized by `APP` build-arg, uses `turbo prune --docker`) and a per-app `apps/shell/Dockerfile` (same pattern hard-coded to `shell`) exist. Day-to-day dev runs `npm run dev` directly — Docker is only for production-build validation and deployment. `docker-compose.yml` wires the shell up for local container smoke tests.

## 10. Forward-looking decisions (when to revisit)

- **Build `packages/ui-elements`** when a non-React consumer or a zero-coupling consumer appears. Not before.
- **Move the apps list to a DB-backed source** when the catalog grows beyond what makes sense to hand-edit, or when per-tenant/per-user filtering becomes a real need.
- **Implement real `validateSession` and `withAuth`** in `@repo/auth` when a sub-app or non-Next service first needs them. Today the shell uses `auth()` directly from NextAuth in its API routes.
- **Add a CI job in the dashboard repo** (or whatever the first subtree consumer is) that opens a PR when this repo updates the components. Cadence policy is TBD.
