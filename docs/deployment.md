# Deployment (Azure Container Apps)

Ships every deployable as its own Azure Container App. Only the `nginx` container has public ingress; everything else is internal-only.

> This doc covers what to do once for the suite, then what to do per deploy. CI/CD is not wired in this repo — see `onboarding.md` §8 (Known gaps).

## 1. Prerequisites

- **Azure CLI** (`az`) authenticated to the target subscription
- A **Container Apps environment** (creates a shared VNet + Log Analytics workspace)
- A **container registry** (Azure Container Registry recommended) that the Container Apps environment can pull from
- The **custom domain** you'll use for the shell, with DNS control
- The **Entra app registration** from `onboarding.md` §3, with the production redirect URI added: `https://shell.example.com/auth-client-redirect`

One-time setup (resource names are illustrative):

```bash
RG=apps-platform
LOC=eastus2
ACR=appsplatformacr
ENV=apps-platform-env

az group create -n $RG -l $LOC
az acr create -g $RG -n $ACR --sku Basic --admin-enabled true
az containerapp env create -g $RG -n $ENV -l $LOC
```

## 2. Build and push images

All Dockerfiles build from the repo root.

```bash
TAG=$(git rev-parse --short HEAD)

for app in shell shell-api access-manager nginx; do
  az acr build -r $ACR -t apps-platform-$app:$TAG -f docker/$app/Dockerfile .
done
```

(`az acr build` runs the build in ACR — no local Docker needed. Or build locally and `az acr login && docker push`.)

## 3. Create the Container Apps

### Internal-only services

`shell`, `shell-api`, `access-manager` (and every future sub-app). All use **internal** ingress so nginx can reach them but they're not exposed to the internet.

```bash
# shell
az containerapp create -g $RG -n shell --environment $ENV \
  --image $ACR.azurecr.io/apps-platform-shell:$TAG \
  --ingress internal --target-port 80 --transport http \
  --min-replicas 1 --max-replicas 3

# access-manager
az containerapp create -g $RG -n access-manager --environment $ENV \
  --image $ACR.azurecr.io/apps-platform-access-manager:$TAG \
  --ingress internal --target-port 80 --transport http \
  --min-replicas 1 --max-replicas 3

# shell-api
az containerapp create -g $RG -n shell-api --environment $ENV \
  --image $ACR.azurecr.io/apps-platform-shell-api:$TAG \
  --ingress internal --target-port 8000 --transport http \
  --min-replicas 1 --max-replicas 3 \
  --env-vars \
    ENTRA_TENANT_ID=<tenant-id> \
    ENTRA_AUDIENCE=api://<client-id>
```

Capture each app's internal FQDN — `az containerapp show -n shell -g $RG --query properties.configuration.ingress.fqdn -o tsv` — these are the values you pass to nginx.

### Public nginx

```bash
SHELL_FQDN=$(az containerapp show -n shell -g $RG --query properties.configuration.ingress.fqdn -o tsv)
SHELL_API_FQDN=$(az containerapp show -n shell-api -g $RG --query properties.configuration.ingress.fqdn -o tsv)
ACCESS_MANAGER_FQDN=$(az containerapp show -n access-manager -g $RG --query properties.configuration.ingress.fqdn -o tsv)

az containerapp create -g $RG -n nginx --environment $ENV \
  --image $ACR.azurecr.io/apps-platform-nginx:$TAG \
  --ingress external --target-port 80 --transport http \
  --min-replicas 1 --max-replicas 5 \
  --env-vars \
    SHELL_HOST=$SHELL_FQDN \
    SHELL_API_HOST=$SHELL_API_FQDN \
    ACCESS_MANAGER_HOST=$ACCESS_MANAGER_FQDN
```

## 4. Custom domain + TLS

```bash
# Bind the domain
az containerapp hostname add -g $RG -n nginx --hostname shell.example.com

# Validate (CNAME / TXT records on your DNS provider per Azure's instructions)

# Issue a managed cert
az containerapp hostname bind -g $RG -n nginx --hostname shell.example.com \
  --environment $ENV --validation-method CNAME
```

Update the Entra app registration's redirect URI to use the custom hostname if you used a placeholder earlier.

## 5. Verify

```bash
curl -sf https://shell.example.com/api/health
# {"status":"ok"}

# In a browser: open https://shell.example.com/, sign in,
# click Access Manager, verify it loads without re-auth.
```

## 6. Subsequent deploys

Bump the tag, push, update each Container App. Per service:

```bash
TAG=$(git rev-parse --short HEAD)
az acr build -r $ACR -t apps-platform-shell:$TAG -f docker/shell/Dockerfile .
az containerapp update -g $RG -n shell --image $ACR.azurecr.io/apps-platform-shell:$TAG
```

Sub-app deploys are independent — pushing a new `access-manager` doesn't redeploy the shell or shell-api. Pushing `nginx` only matters when routing changes (added sub-app, added sub-app backend).

## 7. Adding a sub-app to an existing deployment

After completing the recipe in `adding-a-sub-app.md` and verifying locally:

1. `az acr build` and `az containerapp create --ingress internal` for the new sub-app.
2. `az acr build` the new nginx image (its config changed).
3. `az containerapp update` nginx with the new image, and add the new `*_HOST` env var:

   ```bash
   WIDGET_MANAGER_FQDN=$(az containerapp show -n widget-manager -g $RG --query properties.configuration.ingress.fqdn -o tsv)
   az containerapp update -g $RG -n nginx \
     --image $ACR.azurecr.io/apps-platform-nginx:$TAG \
     --set-env-vars WIDGET_MANAGER_HOST=$WIDGET_MANAGER_FQDN
   ```

No Entra change needed (single redirect URI).

## 8. Front Door / CDN (future)

If `nginx` becomes a bottleneck or you need geo-edge caching, slot Azure Front Door in front. Routing config translates directly — Front Door does path-based routing the same way. See `architecture.md` §10.
