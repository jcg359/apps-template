import NextAuth, { type NextAuthConfig, type NextAuthResult } from 'next-auth';
import type {} from 'next-auth/jwt';
import { entraProvider } from '@repo/auth/entra';

export const authConfig: NextAuthConfig = {
  providers: [entraProvider()],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.tenantId =
          (profile as { tid?: string } | undefined)?.tid ?? token.tenantId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.tenantId = (token.tenantId as string | null | undefined) ?? null;
      }
      return session;
    },
  },
};

// Annotate every NextAuth re-export with NextAuthResult[...] so the inferred
// types do not reference internal next-auth/lib paths — Next 16's stricter
// type emit rejects those as non-portable.
const result: NextAuthResult = NextAuth(authConfig);

export const handlers: NextAuthResult['handlers'] = result.handlers;
export const auth: NextAuthResult['auth'] = result.auth;
export const signIn: NextAuthResult['signIn'] = result.signIn;
export const signOut: NextAuthResult['signOut'] = result.signOut;

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tenantId: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    tenantId?: string | null;
  }
}
