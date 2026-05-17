# Composite SPA architecture

This document captures the architectural decisions behind this monorepo that aren't directly visible from the code. Read this before making changes that touch routing, auth, or how external apps consume `@repo/*` packages.

> **Note:** an earlier iteration of this architecture used a Next.js shell with NextAuth/BFF mediation. That model was replaced wholesale before any production use. Git history holds the previous version; nothing in the current code or this document refers back to it.

## 1. The pattern

Everything is served from a single origin (`shell.example.com`) by a public **nginx** container. nginx fans out path-based:

- `/` and other shell routes → shell SPA
- `/auth-client-redirect` → shell SPA (MSAL redirect handler)
- `/apps/<name>/*` → that sub-app SPA
- `/api/whoami`, `/api/apps`, `/api/health` → Python shell-api
- `/api/<name>/*` → that sub-app's backend (when one exists)

**No Node process in the request path. No SSR. No middleware tier.** The shell is just another SPA — its specialness is that it owns the launcher chrome and `/auth-client-redirect`.

### Why single origin matters (the load-bearing property)

All SPAs run on the same browser origin. That means:

- `sessionStorage` is shared across SPAs in the same tab — once one app authenticates, the others read the tokens for free
- Same-origin fetch on `/api/*` and `/apps/<name>/*` "just works" — no CORS plumbing
- One Entra redirect URI covers the entire suite

If sub-apps moved to per-app subdomains, all of this regresses. **Don't.**

## 2. Auth model

**MSAL.js (`@azure/msal-browser`)** runs in every SPA. Wrapped by a thin library in `packages/auth` so all SPAs use identical config (clientId, authority, redirect URI, cache type).

### Entra registration

- Platform: **SPA** (not Web — no client secret, PKCE in the browser)
- Single redirect URI: `https://shell.example.com/auth-client-redirect` (one entry, all sub-apps share)
- Scopes registered for the first-party APIs the suite calls
- Dev redirect URI: whatever the local nginx exposes (e.g. `http://localhost:8080/auth-client-redirect`)

### Flow

1. Sub-app boots, calls `auth.acquireTokenSilent({ scopes })`.
2. Cache hit (same tab) or silent SSO via Entra's session cookie (hidden iframe, fast, invisible) → token in hand, sub-app proceeds.
3. Silent fails (no Entra session, MFA, consent prompt) → sub-app calls `auth.login({ returnTo: window.location.href })`. Library puts `returnTo` into MSAL's `state` param and triggers redirect.
4. Entra → `shell.example.com/auth-client-redirect?code=...&state=...`.
5. Shell SPA's callback route runs `msal.handleRedirectPromise()`. MSAL exchanges the code for tokens, writes them to `sessionStorage`.
6. Callback reads `returnTo` from state, calls `window.location.replace(returnTo)`.
7. Sub-app reloads. MSAL cache (same origin, same tab) has the tokens. Sub-app reads them, proceeds.

### Token storage

`sessionStorage`. Per-tab. Shared across all SPAs on this origin within that tab. Fresh tabs do their own silent SSO on boot (cheap, invisible if Entra session is live).

This is an internal app suite; in-browser token storage is an accepted tradeoff in exchange for keeping the shell out of every API call's hot path. See §9.

### Token usage

Every SPA attaches `Authorization: Bearer <token>` to its API calls. Every backend validates the JWT signature against Entra's JWKS (shared FastAPI dependency for Python services, equivalent helper for other languages). **No backend calls the shell to validate a token.**

### Shell-mediated callback (why the redirect is single-URI)

The single `/auth-client-redirect` page on the shell:

- Lets Entra hold **one** redirect URI for the whole suite — adding a sub-app needs no Entra change.
- Lets sub-apps stay thin — they never see MSAL's redirect plumbing directly; they call `auth.login(...)` from `@repo/auth` and get bounced back to where they came from via the `returnTo` state.

## 3. URL space

| Path | Owned by | Notes |
|---|---|---|
| `/` | shell SPA | landing, launcher, nav chrome |
| `/auth-client-redirect` | shell SPA | MSAL redirect handler, reads state, bounces to `returnTo` |
| `/api/whoami` | shell-api | enriched user info (claims + Graph lookups as needed) |
| `/api/apps` | shell-api | app catalog for the launcher (source of truth for what shows up) |
| `/api/health` | shell-api | liveness/readiness |
| `/apps/<name>/*` | that sub-app SPA | the sub-app's frontend |
| `/api/<name>/*` | that sub-app's backend | the sub-app's API, if it has one |

## 4. Sub-app distribution

| Sub-app shape | Where it lives | How it gets `@repo/*` | Auth |
|---|---|---|---|
| React SPA, in monorepo | `apps/<name>/` (Vite) | Workspace dep | MSAL.js via `@repo/auth` |
| React SPA, separate repo | External | Git subtree of `packages/ui/src/` and `packages/auth/src/` | MSAL.js via the subtree-pulled copy |
| Non-React or zero-coupling *(future)* | External | Web Components from `packages/ui-elements/` (not built); runtime auth SDK from `shell.example.com/auth-sdk.js` (not built) | MSAL.js via the shell-hosted SDK |

Both subtree-today and SDK-later paths share the same source. Don't build the runtime SDK or the Web Components target speculatively — same posture as before. See §10.

## 5. Repository layout

- `apps/shell/` — Vite + React SPA. Renders launcher/nav, hosts `/auth-client-redirect`, app-selector landing.
- `apps/shell-api/` — Python FastAPI. Owns `/api/whoami`, `/api/apps`, `/api/health`.
- `apps/<sub-app>/` — Vite + React SPA. e.g. `apps/access-manager/`.
- `packages/ui/` — React components consumed by every SPA. **UIProvider refactor required day 1** — Next-specific imports (`next/link`, `next/navigation`) must be removed since the shell is no longer Next.
- `packages/auth/` — MSAL.js wrapper, shared config, login/logout helpers, token cache reader.
- `packages/design-tokens/` — CSS custom properties + Tailwind preset. Stack-agnostic.
- `packages/tsconfig/` — shared TypeScript presets.
- `docker/<name>/` — Dockerfile per deployable. One subfolder per `nginx`, `shell`, `shell-api`, and each `<sub-app>`.

## 6. Production hosting (Azure Container Apps)

- **nginx** container: the only public ingress. Holds the routing config, terminates TLS, gzips, can cache static assets at the edge.
- **shell, shell-api, every sub-app SPA**: internal ingress only. Reachable from nginx within the Container Apps environment via the environment's internal DNS.
- Per-container Dockerfiles in `docker/<name>/`. Static SPA containers use **Caddy** for `try_files {path} /index.html` (SPA fallback) and asset serving.
- No docker-compose in prod. Each container is its own Container App.

### Local dev

Two modes:

- **Standalone SPA** — run a single SPA's Vite dev server on its own port. Set `VITE_MOCK_USER=1` to bypass MSAL and return a stub user. Best for UI iteration; no nginx, no shell-api, no Entra round-trip.
- **Integrated** — run nginx locally (host install or a one-off container) with the prod routing config pointed at local ports; run the Vite dev servers and the FastAPI dev server. Hit `http://localhost:8080/` and the whole composite behaves like prod. Use this when wiring real auth or cross-app navigation.

### Vite `base` and Caddy

Each SPA's Vite config sets `base: '/apps/<name>/'` so the built `index.html` references assets at the correct prefix. Caddy serves them from `/` inside the container; nginx routes `/apps/<name>/*` to the container, preserving the prefix. SPA client-side routes fall back to `index.html` via Caddy's `try_files`.

## 7. Python shell-api

Day 1 surface:

- `GET /api/whoami` — validates bearer, returns enriched user info
- `GET /api/apps` — returns the app catalog for the launcher
- `GET /api/health` — liveness/readiness

Shared FastAPI dependency `Depends(verify_bearer)` validates the JWT signature against Entra's cached JWKS and returns claims. Used by every protected route.

The app catalog being served from `/api/apps` (instead of a hand-coded list in the shell SPA) is **day-1 work**, not a forward-looking aspiration — the architecture doesn't have a hand-coded fallback.

## 8. Component sharing

`packages/ui` is React + Tailwind. Day-1 prerequisite: the **UIProvider refactor** — inject `Link` and any router/navigation hooks via a `<UIProvider>` context so the components are framework-neutral. One consumer profile (React SPA), not two.

After that lands, the subtree path for external SPAs is immediately viable; the future Web Components target (`packages/ui-elements/`) becomes feasible at any time when a non-React consumer materializes.

## 9. What was explicitly ruled out

| Approach | Why not |
|---|---|
| Next.js for the shell | Not using SSR, RSC, App Router, or middleware — paying for the framework without its value prop. Static SPA + nginx is the simpler match. |
| NextAuth as the auth model | Builds a server-side session-cookie tier this architecture doesn't need. MSAL.js in the browser is the direct fit for SPA-only stacks. |
| BFF proxy as default for API calls | Permanent Node passthrough in the hot path of every API call. JWKS validation per API is the standard pattern and removes the shell from the request path. |
| Tokens hidden server-side (HTTP-only cookie, no browser exposure) | Considered. Internal-suite threat model accepts in-memory `sessionStorage` tokens in exchange for shell out of the API hot path. Revisit if threat model changes. |
| Module Federation | Operational complexity, version-skew failure modes, Vite/Turbopack incompatibility — not the problem we have. |
| `file:` deps / `npm link` / module-fed for dev | Fragile in CI, requires sibling-checkout discipline. |
| Iframes per sub-app | Layout/focus/scroll, UX feel. |
| npm registry publishing | No registry infrastructure to maintain; subtree handles cross-repo cases. |
| `packages/config` for a shared apps list | The apps list comes from `/api/apps`; no shared package needed. |
| Per-app subdomains | Breaks shared `sessionStorage` cross-app, breaks single-redirect-URI ergonomics, adds CORS overhead. Single origin is load-bearing (§1). |
| MSAL only in the shell, sub-apps delegating via postMessage / iframes | Reinvents what MSAL already does at the browser level. Sub-apps use `@repo/auth` (which wraps MSAL) directly; the "shell-mediated" part is just the callback URI. |
| docker-compose in production | Each deployable is its own Container App. Compose is for one-off local integration testing only. |

## 10. Forward-looking decisions (when to revisit)

- **Build `packages/ui-elements`** when a non-React consumer appears. Not before.
- **Build the runtime auth SDK** (`shell.example.com/auth-sdk.js`) when a zero-coupling consumer needs auth without compiling `packages/auth`. Not before.
- **Add an external subtree consumer** when the first separate-repo SPA materializes. Then revisit whether subtree-update cadence needs automation.
- **Promote `/api/apps` from in-memory to DB-backed** when the catalog grows beyond what makes sense to hand-edit, or when per-tenant/per-user filtering becomes a real need.
- **Add a Front Door / edge CDN tier** if `nginx` becomes a single-instance bottleneck or global latency starts to matter. The routing config maps directly; nothing about the architecture forces a change.
