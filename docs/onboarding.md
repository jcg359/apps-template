# Onboarding

Get the suite running locally end-to-end. Read `architecture.md` first if you want to understand *why* things are shaped this way — this doc only covers *how* to stand it up.

## 1. Prerequisites

- **Node.js** ≥ 20.9 (matches `engines.node` in root `package.json`)
- **npm** ≥ 10 (ships with Node 20)
- **Python** ≥ 3.12 (for `apps/shell-api`)
- **Docker** (for the nginx container in integrated local dev, and all production builds)
- Optional: **Azure CLI** (`az`) for deployment work

Check:

```bash
node --version    # >= v20.9
python --version  # >= 3.12
docker --version
```

## 2. Repo setup

```bash
git clone <this repo>
cd apps-template
npm install
```

For the Python service, install editable + dev tools (gives you `uvicorn`, `mypy`, `ruff`):

```bash
cd apps/shell-api
pip install -e ".[dev]"
cd ../..
```

Copy `.env.example` files and fill the values from step 3:

```bash
cp apps/shell/.env.example          apps/shell/.env
cp apps/access-manager/.env.example apps/access-manager/.env
cp apps/shell-api/.env.example      apps/shell-api/.env
```

## 3. Entra app registration

The suite uses **one** Entra app registration shared across all SPAs (single redirect URI). Steps in the Azure Portal:

1. **Azure Portal → Microsoft Entra ID → App registrations → New registration**
   - Name: e.g. `apps-platform`
   - Supported account types: pick what matches your tenant policy (usually "Accounts in this organizational directory only")
   - **Redirect URI**: choose platform **Single-page application (SPA)**, value `https://shell.example.com/auth-client-redirect` (use your real shell hostname).

2. **Authentication** tab — add the rest of the SPA redirect URIs you need:
   - `http://localhost:8080/auth-client-redirect` — for the integrated local-dev experience behind nginx
   - `http://localhost:5173/auth-client-redirect` — only if you plan to hit the shell's Vite dev server directly without nginx
   - Leave all "Web" / "Public client" platforms empty. **Do not add a Web platform** — see `architecture.md` §9.

3. **Expose an API** tab (for shell-api):
   - Set the Application ID URI (default `api://<client-id>` is fine, or use a custom URI).
   - Add a scope, e.g. `Apps.Read`. Admin/user consent as appropriate.
   - The full scope string is `api://<client-id>/Apps.Read` — this is what SPAs request when calling shell-api.

4. **API permissions** tab — under "Microsoft Graph" the default `User.Read` is fine. If `/api/whoami` needs group claims, add `GroupMember.Read.All` (delegated) or use the optional `groups` claim.

5. **Overview** tab — copy:
   - **Application (client) ID** → `VITE_AUTH_CLIENT_ID` in both SPAs' `.env`
   - **Directory (tenant) ID** → `VITE_AUTH_TENANT_ID` in both SPAs' `.env`, and `ENTRA_TENANT_ID` in `apps/shell-api/.env`
   - The Application ID URI → `ENTRA_AUDIENCE` in `apps/shell-api/.env`, and `VITE_AUTH_API_SCOPE` in both SPAs' `.env` (full scope string with `/Apps.Read`)

6. **Token configuration** tab — optional but recommended: add the `groups` optional claim if you want `/api/whoami` to populate groups without a separate Graph call.

## 4. Local dev — three modes

### Mode A: Standalone SPA (UI iteration, no auth)

Skip MSAL entirely. Best for component work, layout, no Entra round-trip:

```bash
VITE_MOCK_USER=1 npm run dev -w apps/shell
# or
VITE_MOCK_USER=1 npm run dev -w apps/access-manager
```

Open the URL Vite prints (default `http://localhost:5173` for shell, `http://localhost:5174/apps/access-manager/` for access-manager). `useAuth().user` returns a stub.

### Mode B: Each service direct (backend work)

Run individual services without nginx:

```bash
# shell-api (FastAPI on :8000) — needs real Entra env, or SKIP_AUTH=1
cd apps/shell-api && uvicorn app.main:app --reload --port 8000

# shell SPA (Vite on :5173)
npm run dev -w apps/shell

# access-manager SPA (Vite on :5174)
npm run dev -w apps/access-manager
```

Or all at once via Turbo:

```bash
npx turbo run dev
```

Or on Windows: `scripts\local\start.bat` opens each in its own cmd window.

Useful for hitting `http://localhost:8000/api/health` and debugging shell-api in isolation.

### Mode C: Integrated via nginx (production-like)

Mirrors prod topology. Start the three services as in Mode B, then run nginx as a one-off Docker container:

```bash
# One-time
docker build -f docker/nginx/Dockerfile -t apps-template-nginx .

# Each session
docker run --rm -p 8080:80 \
  -e SHELL_HOST=host.docker.internal:5173 \
  -e SHELL_API_HOST=host.docker.internal:8000 \
  -e ACCESS_MANAGER_HOST=host.docker.internal:5174 \
  apps-template-nginx
```

Open `http://localhost:8080/`. The full composite (shell, sub-apps, API) works as it will in production. Use this when wiring real auth flows or testing cross-app navigation.

> On Linux without Docker Desktop, replace `host.docker.internal` with your host IP (or run with `--network=host`).

## 5. Verifying

| URL | Expect |
|---|---|
| `http://localhost:8000/api/health` | `{"status":"ok"}` |
| `http://localhost:5173/` (shell, Vite direct) | "Sign in" landing (or stub user if `VITE_MOCK_USER=1`) |
| `http://localhost:8080/` (integrated) | shell landing; click app → `/apps/access-manager/` loads via rewrite |
| `http://localhost:8080/api/apps` | `401` without bearer, `{"apps":[…]}` with one |

## 6. Common issues

- **"Missing required env var: VITE_AUTH_CLIENT_ID"** — `.env` file not present or not filled. Each Vite app reads its own `.env`. Restart Vite after editing.
- **MSAL "InteractionRequiredAuthError" loops** — your Entra redirect URI doesn't exactly match the one MSAL is sending (port, path, scheme). Update the registration. Trailing slashes matter.
- **`/api/apps` returns 401 in integrated mode but works in browser** — bearer token isn't being attached. Confirm the SPA was loaded *via nginx* (`localhost:8080`, not directly via Vite). Sub-apps fetch with same-origin, which only works under the single origin.
- **Caddy 404 for sub-app assets** — Vite `base` doesn't match the nginx route + Caddy `uri strip_prefix`. All three must agree on the prefix (e.g. `/apps/access-manager`).
- **`ImportError` in shell-api** — you skipped `pip install -e ".[dev]"`. Re-run from `apps/shell-api/`.

## 7. What you'll do next

- Add a sub-app → `docs/adding-a-sub-app.md`
- Ship to Azure → `docs/deployment.md`
- Touch auth/routing/distribution → re-read `docs/architecture.md` first

## 8. Known gaps (handoff items)

These are intentionally not built yet but you should know about them:

- **No CI/CD** — `turbo run lint`/`build`/`typecheck` must pass, but there's no GitHub Actions / Azure DevOps pipeline in this repo. Wire one when first deploying.
- **No tests** — no unit or integration test scaffolding. Add as features grow.
- **`/api/whoami` group enrichment** — currently returns claims as-is. If you need Graph-derived groups or richer profiles, extend `apps/shell-api/app/auth.py` and `apps/shell-api/app/main.py`.
- **`/api/apps` is in-memory** — `apps/shell-api/app/apps_catalog.py` is the source. Move to DB when the catalog stops being hand-editable (see `architecture.md` §10).
- **No runtime auth SDK / Web Components target** — `packages/ui-elements` and `shell.example.com/auth-sdk.js` are documented but not built (`architecture.md` §10). Build when an external consumer needs them.
