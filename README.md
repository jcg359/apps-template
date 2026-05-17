# apps-template

A Turborepo monorepo for a composite SPA app suite. Everything serves from a single origin (`shell.example.com`) behind a public **nginx** container; all user-facing apps are React SPAs (Vite + MSAL.js against Microsoft Entra ID). Cross-cutting server logic lives in a small Python FastAPI service (`apps/shell-api`).

## Where to find what

- **[`docs/architecture.md`](./docs/architecture.md)** — the load-bearing decisions: single origin, MSAL.js per SPA, JWKS-validated tokens per backend, URL conventions, what was explicitly ruled out. Read this before any cross-cutting change.
- **[`docs/onboarding.md`](./docs/onboarding.md)** — first-time setup: prerequisites, Entra app registration walkthrough, the three local-dev modes, common issues.
- **[`docs/adding-a-sub-app.md`](./docs/adding-a-sub-app.md)** — recipe for adding the next sub-app end-to-end: scaffold, catalog, nginx route, Docker, deploy.
- **[`docs/deployment.md`](./docs/deployment.md)** — shipping to Azure Container Apps: registry, ingress, env wiring, custom domain.
- **[`docker/README.md`](./docker/README.md)** — per-container build commands and runtime topology cheat-sheet.
- **[`CLAUDE.md`](./CLAUDE.md)** — index for Claude Code sessions.

## Quick start

```bash
npm install
cp apps/shell/.env.example apps/shell/.env
cp apps/access-manager/.env.example apps/access-manager/.env
cp apps/shell-api/.env.example apps/shell-api/.env
# fill in Entra clientId/tenantId (see docs/onboarding.md §Entra)
npx turbo run dev
```

On Windows: `scripts\local\start.bat` opens each dev service in its own window.
