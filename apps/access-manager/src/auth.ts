import { createMsalApp } from '@repo/auth';
import { env } from './env';

export const msal = env.mockUser
  ? createMsalApp({
      clientId: 'mock',
      tenantId: 'mock',
      redirectUri: env.redirectUri,
    })
  : createMsalApp({
      clientId: env.clientId,
      tenantId: env.tenantId,
      redirectUri: env.redirectUri,
    });

export const loginScopes = [env.apiScope];

export const mockUser = env.mockUser ? { email: 'dev@example.com', name: 'Dev User' } : undefined;
