# syntax=docker/dockerfile:1.7

# ---------- prune ----------
FROM node:20-alpine AS pruner
WORKDIR /repo
RUN npm install -g turbo@^2.9.14
COPY . .
RUN turbo prune access-manager --docker

# ---------- install + build ----------
FROM node:20-alpine AS builder
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN npm ci
COPY --from=pruner /repo/out/full/ .
RUN npx turbo run build --filter=access-manager

# ---------- runtime ----------
FROM caddy:2-alpine
COPY docker/access-manager/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /repo/apps/access-manager/dist /srv
EXPOSE 80
