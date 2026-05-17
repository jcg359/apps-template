# Claude Code project notes

This is a Turborepo monorepo for a composite/microfrontend app platform. The shell (`apps/shell`) is a Next.js 16 App Router app that owns routing, auth (Microsoft Entra ID via NextAuth v5), and navigation chrome. Sub-apps mount under path prefixes.

## Before changing anything cross-cutting, read

**[`docs/architecture.md`](./docs/architecture.md)** — the decisions and constraints behind the composite app pattern, the auth model, **when to split into a sub-app at all vs. just adding routes to the shell** (§3), the four live sub-app shapes including in-monorepo SPA, hosting options for in-monorepo SPAs (§9), the concrete shape of the BFF `/api/session` endpoint (§2), the subtree + Web Components plan, and what was explicitly ruled out. These aren't visible from the code alone.

**Adding a new sub-app is a cross-cutting decision** — review §3 (shape) and §9 (hosting, if SPA) before scaffolding anything.

## Quick map

- `apps/shell/` — Next.js 16 shell, NextAuth v5 + Entra ID, App Router
- `packages/ui/` — React components (Header, Nav, AppCard, AppCardGrid, AppLauncherButton). Currently uses `next/link` directly; pending refactor to inject Link/usePathname via `UIProvider` so SPAs can use it too.
- `packages/auth/` — Entra provider config + typed placeholder utilities. Stack-agnostic (no React).
- `packages/design-tokens/` — CSS custom properties + Tailwind preset. No React, no JS framework.
- `packages/tsconfig/` — shared TypeScript presets.

## Conventions

- **Visual style**: white background, grayscale palette, no bold colors in components.
- **Apps list**: callers pass it as a prop. **Do not create a `packages/config` package** — this was explicitly decided against.
- **No npm publishing**: shared code reaches separate-repo consumers via git subtree (React SPAs) and, in the future, Web Components.
- **Auth**: shell is the only thing that talks to Entra. Sub-apps either share `AUTH_SECRET` (Next.js) or call `/api/session` (SPAs / non-Next).
- **Lint/format**: ESLint 9 flat config, Prettier, `--max-warnings=0`. `turbo run lint` must pass.
- **NextAuth re-exports** in `apps/shell/src/auth.ts` need explicit `NextAuthResult[...]` annotations to avoid Next 16's non-portable-type error. Same for `apps/shell/src/proxy.ts`.

## Common commands

```bash
npm install                              # at repo root
npx turbo run dev                        # all apps in parallel
npx turbo run build                      # production builds
npx turbo run lint                       # eslint everywhere
SKIP_AUTH=1 npx turbo run dev            # bypass the auth proxy in dev only (hard-gated to non-prod)
```

## Things that aren't load-bearing yet

- `@repo/auth/session.ts` and `@repo/auth/middleware.ts` are typed placeholders. Build real implementations only when a sub-app or non-Next service first needs them.
- Sub-app rewrites in `apps/shell/next.config.ts` are commented stubs. Uncomment per sub-app when its destination is reachable.
- `packages/ui-elements/` (the Web Components target) does not exist. Build only when a non-React or zero-coupling consumer appears — see `docs/architecture.md` §3.
- The `UIProvider` refactor on `packages/ui` is pending and is the prerequisite for both the subtree and Web Components consumer paths.
