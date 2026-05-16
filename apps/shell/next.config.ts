import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for monorepo: Next must transpile workspace packages it consumes.
  transpilePackages: ['@repo/ui', '@repo/auth', '@repo/design-tokens'],

  // Standalone output bundles only what's needed for production — used by the
  // Dockerfiles for a small runtime image.
  output: 'standalone',

  typedRoutes: true,

  async rewrites() {
    // Future sub-apps mount under route prefixes. When a sub-app exists, point
    // its prefix at the running sub-app origin (or a CDN/static origin in prod).
    // Pattern: <prefix>/:path* → <sub-app-origin>/<prefix>/:path*
    //
    // Leave these commented until each sub-app exists; uncommenting an entry
    // before the destination is reachable will produce 502s in dev.
    return [
      // {
      //   source: '/analytics/:path*',
      //   destination: 'http://localhost:3001/analytics/:path*', // analytics sub-app
      // },
      // {
      //   source: '/admin/:path*',
      //   destination: 'http://localhost:3002/admin/:path*', // admin sub-app
      // },
    ];
  },
};

export default nextConfig;
