# Claude Code project notes

This is a Turborepo monorepo for a composite SPA app suite. Everything serves from a single origin (`shell.example.com`) behind a public **nginx** container; all user-facing apps are React SPAs (Vite) and authenticate via **MSAL.js** against Microsoft Entra ID. There is no Node process in the request path. Cross-cutting server logic lives in a small **Python FastAPI** service (`apps/shell-api/`).

## Where to look — read the relevant doc before acting

| If you're about to… | Read |
|---|---|
| Touch auth, routing, the URL space, sub-app distribution, or anything labelled "load-bearing" | **[`docs/architecture.md`](./docs/architecture.md)** — §1–§4 cover the load-bearing parts; §9 lists what was ruled out and why |
| Set up the project for the first time, run it locally, or troubleshoot Entra/MSAL/Vite issues | **[`docs/onboarding.md`](./docs/onboarding.md)** — prerequisites, Entra walkthrough, three local-dev modes, common issues |
| Add a new sub-app or sub-app backend | **[`docs/adding-a-sub-app.md`](./docs/adding-a-sub-app.md)** — end-to-end recipe: scaffold → catalog → nginx → Docker → verify → deploy |
| Push to Azure Container Apps, change ingress, wire env vars, attach a custom domain | **[`docs/deployment.md`](./docs/deployment.md)** — one-time setup, per-deploy commands, adding a sub-app to a live deployment |
| Just need the per-container build commands or runtime topology | **[`docker/README.md`](./docker/README.md)** — quick cheat-sheet |
| Work on the access-manager sub-app (screens, components, data flow, aesthetic conventions) | **[`apps/access-manager/README.md`](./apps/access-manager/README.md)** — what's built, boot flow, the active-revision concept, screen-to-endpoint map, primitives, how to add a new screen. The API contract it implements is in **[`apps/access-manager/docs/API.md`](./apps/access-manager/docs/API.md)** |

**Adding a sub-app, changing auth, or touching routing is cross-cutting** — review `architecture.md` §1–§4 before scaffolding anything, even if the recipe in `adding-a-sub-app.md` looks self-contained.

## Quick map

- `apps/shell/` — Vite + React SPA. Owns the launcher, nav chrome, and `/auth-client-redirect`.
- `apps/shell-api/` — Python FastAPI. Owns `/api/whoami`, `/api/apps`, `/api/health`. JWT validation against Entra JWKS.
- `apps/<sub-app>/` — Vite + React SPA per sub-app (e.g. `apps/access-manager/`). Mounted at `/apps/<name>/*` by nginx.
- `packages/ui/` — React components consumed by every SPA. Framework-neutral via `<UIProvider>` (consumer injects `Link` and `usePathname`).
- `packages/auth/` — MSAL.js wrapper, shared config, login/logout helpers, `<AuthProvider>` + `useAuth`/`useRequireAuth` hooks.
- `packages/design-tokens/` — CSS custom properties + Tailwind preset. Stack-agnostic.
- `packages/tsconfig/` — shared TypeScript presets (`base.json`, `react.json`).
- `docker/<name>/` — one Dockerfile per deployable: `nginx`, `shell`, `shell-api`, and each sub-app.
- `scripts/local/start.bat` — Windows convenience: opens each dev service in its own cmd window.

## Conventions (the short version — see `architecture.md` for the why)

- **Single origin (`shell.example.com`) is load-bearing.** No per-app subdomains.
- **URL space**: `/` = shell SPA; `/auth-client-redirect` = shell SPA (MSAL handler); `/apps/<name>/*` = sub-app SPAs; `/api/*` = shell-api; `/api/<name>/*` = that sub-app's backend if it has one.
- **Auth**: MSAL.js per SPA via `@repo/auth`. Single Entra **SPA-platform** registration with one redirect URI. Tokens in `sessionStorage`. Every backend validates the JWT against Entra JWKS — never call the shell to validate a token.
- **Apps list**: served by `/api/apps`. No hand-coded list in the shell; no `@repo/config` package.
- **Visual style**: white background, grayscale palette, no bold colors in components.
- **No npm publishing**: shared code reaches separate-repo consumers via git subtree (today) or a runtime SDK + Web Components (later, when a consumer needs them).
- **Lint/format**: ESLint 9 flat config, Prettier, `--max-warnings=0`. `turbo run lint` must pass.

## Common commands

```bash
npm install                                    # at repo root
npx turbo run dev                              # all SPAs + shell-api in parallel
npx turbo run build                            # production builds (vite build per SPA)
npx turbo run lint                             # eslint everywhere
npx turbo run typecheck                        # tsc --noEmit everywhere (+ mypy if installed)
VITE_MOCK_USER=1 npm run dev -w apps/<name>    # standalone SPA without MSAL/Entra
```

For Windows convenience: `scripts\local\start.bat`. For the integrated local experience (everything behind nginx at `localhost:8080`), see `docs/onboarding.md` §4 Mode C.

## Things that aren't load-bearing yet

- `packages/ui-elements/` (Web Components target) does not exist. Build only when a non-React or zero-coupling consumer appears.
- Runtime auth SDK (`shell.example.com/auth-sdk.js`) does not exist. Build when a zero-coupling external consumer needs auth without compiling `@repo/auth`.
- `/api/apps` is in-memory (`apps/shell-api/app/apps_catalog.py`). Promote to DB-backed when the catalog stops being hand-editable.
- No CI/CD pipeline in this repo — `turbo run lint`/`build`/`typecheck` must pass but nothing enforces it automatically yet.
- No automated tests scaffolded.

See `docs/architecture.md` §10 for the "when to revisit" notes and `docs/onboarding.md` §8 for the full handoff gap list.
