# syntax=docker/dockerfile:1.7
# Per-app Dockerfile for the shell. Same multi-stage pattern as the root
# Dockerfile but hard-coded to "shell" — convenient when shipping just this app.
#
# Must still be built from the REPO ROOT so the build context contains the
# workspace packages and turbo.json:
#   docker build -f apps/shell/Dockerfile -t apps-template/shell .

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS pruner
WORKDIR /repo
RUN apk add --no-cache libc6-compat
COPY . .
RUN npx -y turbo@^2.9.14 prune shell --docker

FROM node:${NODE_VERSION} AS deps
WORKDIR /repo
RUN apk add --no-cache libc6-compat
COPY --from=pruner /repo/out/json/ ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:${NODE_VERSION} AS builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo
COPY --from=deps /repo/ ./
COPY --from=pruner /repo/out/full/ ./
RUN npx turbo run build --filter=shell

FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/shell/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/shell/.next/static ./apps/shell/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/shell/public ./apps/shell/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/shell/server.js"]
