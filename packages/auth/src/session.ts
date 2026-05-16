import { NotAuthenticatedError } from './errors';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  tenantId: string | null;
}

export interface Session {
  user: SessionUser;
  expiresAt: Date;
  issuedAt: Date;
}

/**
 * Placeholder session validator. Real implementation will verify the token
 * signature, check expiry, and load user/tenant info. For now it only
 * shape-checks the input and throws if absent.
 */
export async function validateSession(token: string): Promise<Session> {
  if (!token) {
    throw new NotAuthenticatedError('Missing session token');
  }
  // Stubbed: real implementation will decode/verify the token against
  // the auth provider (Entra ID) and load user state from the session store.
  throw new NotAuthenticatedError('validateSession not implemented');
}
