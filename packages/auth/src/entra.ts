import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

/**
 * Microsoft Entra ID (formerly Azure AD) provider config for NextAuth v5.
 *
 * Lives in @repo/auth so every app in the monorepo wires Entra ID the same way.
 * Apps consume this from their NextAuth setup, e.g.:
 *
 *   import NextAuth from 'next-auth';
 *   import { entraProvider } from '@repo/auth/entra';
 *   export const { handlers, auth, signIn, signOut } = NextAuth({
 *     providers: [entraProvider()],
 *   });
 *
 * Required env vars (Auth.js convention):
 *   AUTH_MICROSOFT_ENTRA_ID_ID     — Application (client) ID
 *   AUTH_MICROSOFT_ENTRA_ID_SECRET — Client secret value
 *   AUTH_MICROSOFT_ENTRA_ID_ISSUER — e.g. https://login.microsoftonline.com/<tenant-id>/v2.0
 *   AUTH_SECRET                    — Used to encrypt session JWTs
 */
export interface EntraProviderOptions {
  clientId?: string;
  clientSecret?: string;
  issuer?: string;
}

export function entraProvider(options: EntraProviderOptions = {}) {
  return MicrosoftEntraID({
    clientId: options.clientId ?? process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
    clientSecret: options.clientSecret ?? process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
    issuer: options.issuer ?? process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
  });
}

export type EntraProvider = ReturnType<typeof entraProvider>;
