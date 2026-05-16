# syntax=docker/dockerfile:1.7
# Monorepo-aware Dockerfile. Builds the "shell" app using turbo prune so the
# image only contains the workspace packages shell actually depends on.
#
# Build from the repo root:
#   docker build -t apps-template/shell .
# Or target a different app once it exists:
#   docker build --build-arg APP=other -t apps-template/other .

ARG NODE_VERSION=22-alpine
ARG APP=shell

# ---------- 1. Prune the workspace to just the target app + its deps ----------
FROM node:${NODE_VERSION} AS pruner
ARG APP
WORKDIR /repo
RUN apk add --no-cache libc6-compat
COPY . .
RUN npx -y turbo@^2.9.14 prune ${APP} --docker

# ---------- 2. Install deps using the pruned lockfile ----------
FROM node:${NODE_VERSION} AS deps
WORKDIR /repo
RUN apk add --no-cache libc6-compat
COPY --from=pruner /repo/out/json/ ./
# package-lock.json may or may not exist; ci falls back to install if absent.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---------- 3. Build ----------
FROM node:${NODE_VERSION} AS builder
ARG APP
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo
COPY --from=deps /repo/ ./
COPY --from=pruner /repo/out/full/ ./
RUN npx turbo run build --filter=${APP}

# ---------- 4. Runtime ----------
FROM node:${NODE_VERSION} AS runner
ARG APP
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output bundles a minimal node_modules and a server.js entry.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/public ./apps/${APP}/public

USER nextjs
EXPOSE 3000

# Standalone server entry lives at apps/<app>/server.js inside the bundle.
CMD ["node", "apps/shell/server.js"]
