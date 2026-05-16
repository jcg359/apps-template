import type { NextAuthResult } from 'next-auth';
import { NextResponse } from 'next/server';
import { auth } from './auth';

// SKIP_AUTH=1 bypasses the auth proxy so the UI can be previewed without Entra
// credentials. Hard-gated to non-production so the flag is inert in real builds.
const skipAuth =
  process.env.SKIP_AUTH === '1' && process.env.NODE_ENV !== 'production';

if (skipAuth) {
  console.warn(
    '[proxy] SKIP_AUTH=1 — auth bypassed for dev. This flag is ignored when NODE_ENV=production.',
  );
}

export const proxy: NextAuthResult['auth'] = skipAuth
  ? ((() => NextResponse.next()) as unknown as NextAuthResult['auth'])
  : auth;

// Matcher excludes Next internals, static assets, and the auth route itself so
// the NextAuth handler can run unauthenticated.
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
