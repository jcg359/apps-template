export { createMsalApp } from './msal';
export type { MsalConfig } from './msal';

export { login, logout, acquireToken, handleCallback } from './flow';
export type {
  LoginOptions,
  AcquireTokenOptions,
  CallbackResult,
} from './flow';

export { AuthProvider, useAuth, useRequireAuth } from './react';
export type { AuthProviderProps, AuthContextValue, MockUser } from './react';

export { NotAuthenticatedError, NotAuthorizedError } from './errors';
