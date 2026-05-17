# Docker images

One subfolder per deployable. All Dockerfiles are built from the **repo root**:

```bash
docker build -f docker/shell/Dockerfile           -t apps-template-shell           .
docker build -f docker/access-manager/Dockerfile  -t apps-template-access-manager  .
docker build -f docker/shell-api/Dockerfile       -t apps-template-shell-api       .
docker build -f docker/nginx/Dockerfile           -t apps-template-nginx           .
```

## Runtime topology

- `nginx` is the only public ingress. It routes path-based to the others.
- `shell`, `access-manager`, `shell-api` should have **internal-only** ingress
  in Azure Container Apps.
- `nginx` reads upstream hostnames from env at startup:
  - `SHELL_HOST` — e.g. `shell.internal.<env>.<region>.azurecontainerapps.io`
  - `SHELL_API_HOST` — likewise
  - `ACCESS_MANAGER_HOST` — likewise

## Adding a new sub-app

1. Add `docker/<name>/Dockerfile` + `docker/<name>/Caddyfile` (copy `access-manager/` as a template; update `uri strip_prefix` to match the new Vite `base`).
2. Add a `location /apps/<name>/ { proxy_pass http://${<NAME>_HOST}; }` block to `docker/nginx/templates/default.conf.template`.
3. Extend `NGINX_ENVSUBST_FILTER` in `docker/nginx/Dockerfile` with the new host var.

## Adding a sub-app backend

1. Build/deploy the backend container; give it internal-only ingress.
2. Add a `location /api/<name>/ { proxy_pass http://${<NAME>_API_HOST}; }` block to the nginx template **above** the `/api/` catch-all (nginx uses longest-prefix match).
3. Extend `NGINX_ENVSUBST_FILTER` with the new host var.
