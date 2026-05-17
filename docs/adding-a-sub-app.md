# Adding a sub-app

End-to-end recipe for adding the next sub-app to the suite. Uses `widget-manager` as the placeholder name — replace throughout.

> Read `architecture.md` §3–§4 first if you're unsure whether the sub-app should live in this monorepo, a separate repo, or be a route inside `apps/shell` instead.

## 1. Pick the name

Use **kebab-case** consistently. Same string appears in:

- Folder: `apps/widget-manager/`
- npm workspace name: `widget-manager` (in `apps/widget-manager/package.json`)
- URL prefix: `/apps/widget-manager/`
- Vite `base`: `/apps/widget-manager/`
- Docker folder: `docker/widget-manager/`
- nginx env var: `WIDGET_MANAGER_HOST`

## 2. Scaffold the SPA

Copy `apps/access-manager/` as the template:

```bash
cp -r apps/access-manager apps/widget-manager
```

Edit:

- **`apps/widget-manager/package.json`** — change `"name"` to `widget-manager`.
- **`apps/widget-manager/vite.config.ts`** — change `base: '/apps/widget-manager/'` and pick an unused dev port (e.g. `5175`).
- **`apps/widget-manager/index.html`** — update `<title>`.
- **`apps/widget-manager/src/App.tsx`** — replace the placeholder UI with the real app shell. Keep the `useRequireAuth()` pattern.
- **`apps/widget-manager/.env.example`** and `.env` — usually identical to access-manager (single Entra app reg is shared).

Install workspace deps:

```bash
npm install
```

Verify:

```bash
npm run dev -w apps/widget-manager
# open http://localhost:5175/apps/widget-manager/
```

## 3. Add to the launcher catalog

`apps/shell-api/app/apps_catalog.py`:

```python
CATALOG: list[AppDefinition] = [
    AppDefinition(
        id="access-manager",
        name="Access Manager",
        description="…",
        href="/apps/access-manager/",
    ),
    AppDefinition(
        id="widget-manager",
        name="Widget Manager",
        description="Manage widgets across the platform.",
        href="/apps/widget-manager/",
    ),
]
```

The shell and other SPAs pick this up automatically via `/api/apps`. No code change anywhere else.

## 4. Add the nginx route

`docker/nginx/templates/default.conf.template` — add a `location` block above `location /`:

```nginx
location /apps/widget-manager/ {
    proxy_pass http://${WIDGET_MANAGER_HOST};
}
```

`docker/nginx/Dockerfile` — extend the env filter:

```dockerfile
ENV NGINX_ENVSUBST_FILTER="SHELL_HOST|SHELL_API_HOST|ACCESS_MANAGER_HOST|WIDGET_MANAGER_HOST"
```

## 5. Add the Docker image

Copy `docker/access-manager/` as the template:

```bash
cp -r docker/access-manager docker/widget-manager
```

Edit:

- **`docker/widget-manager/Dockerfile`** — change `--filter=access-manager` → `--filter=widget-manager`, and the `COPY` source path.
- **`docker/widget-manager/Caddyfile`** — change `uri strip_prefix /apps/access-manager` → `/apps/widget-manager`.

Build:

```bash
docker build -f docker/widget-manager/Dockerfile -t apps-template-widget-manager .
```

## 6. Verify locally via integrated mode

Rebuild the nginx image (its config changed):

```bash
docker build -f docker/nginx/Dockerfile -t apps-template-nginx .
```

Run nginx with the new upstream:

```bash
docker run --rm -p 8080:80 \
  -e SHELL_HOST=host.docker.internal:5173 \
  -e SHELL_API_HOST=host.docker.internal:8000 \
  -e ACCESS_MANAGER_HOST=host.docker.internal:5174 \
  -e WIDGET_MANAGER_HOST=host.docker.internal:5175 \
  apps-template-nginx
```

Start `widget-manager`'s dev server (`npm run dev -w apps/widget-manager`).

Open `http://localhost:8080/` → launcher should show **Widget Manager** → clicking navigates to `/apps/widget-manager/` and renders the sub-app with the user already signed in (shared `sessionStorage`).

## 7. Deploy

Follow `docs/deployment.md` — push the new container image, create the Container App with internal ingress, set `WIDGET_MANAGER_HOST` on the nginx Container App, restart nginx.

## 8. (Optional) Sub-app backend at `/api/widget-manager/*`

If `widget-manager` needs its own backend:

1. Stand up the backend service in its own container. It validates the same Entra JWT against Entra's JWKS — same pattern as `apps/shell-api/app/auth.py`.
2. `docker/nginx/templates/default.conf.template` — add **above** the `/api/` catch-all (nginx is longest-prefix-match):

   ```nginx
   location /api/widget-manager/ {
       proxy_pass http://${WIDGET_MANAGER_API_HOST};
   }
   ```

3. Extend `NGINX_ENVSUBST_FILTER` in `docker/nginx/Dockerfile` with `WIDGET_MANAGER_API_HOST`.
4. Deploy the new backend; set `WIDGET_MANAGER_API_HOST` on the nginx Container App.

Frontend code calls `/api/widget-manager/whatever` with the bearer token — no shell hop.

## 9. (Optional) External-repo sub-app

If the sub-app must live in a separate repo (different team, release cadence, etc.):

- It consumes `packages/ui` and `packages/auth` via **git subtree** of `packages/ui/src/` and `packages/auth/src/` (see `architecture.md` §4).
- It still authenticates via MSAL.js with the same single redirect URI on the shell — no new Entra registration.
- nginx still routes its `/apps/<name>/*` prefix to wherever the SPA is hosted (could be a Container App, a static site, S3, anywhere reachable).
