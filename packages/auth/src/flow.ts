import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type PublicClientApplication,
} from '@azure/msal-browser';
import { NotAuthenticatedError } from './errors';
import { popReturnTo, stashReturnTo } from './state';

export interface LoginOptions {
  scopes: string[];
  returnTo?: string;
}

export async function login(
  msal: PublicClientApplication,
  { scopes, returnTo }: LoginOptions,
): Promise<void> {
  await msal.initialize();
  if (returnTo) stashReturnTo(returnTo);
  await msal.loginRedirect({ scopes });
}

export async function logout(msal: PublicClientApplication): Promise<void> {
  await msal.initialize();
  await msal.logoutRedirect();
}

export interface CallbackResult {
  returnTo: string;
  account: AccountInfo | null;
}

/**
 * Runs handleRedirectPromise, sets the active account, and resolves the
 * returnTo target stashed before the redirect. Call from the shell's
 * /auth-client-redirect page; sub-apps don't invoke this directly.
 */
export async function handleCallback(
  msal: PublicClientApplication,
  fallback = '/',
): Promise<CallbackResult> {
  await msal.initialize();
  const result = await msal.handleRedirectPromise();
  const account = result?.account ?? null;
  if (account) msal.setActiveAccount(account);
  return { returnTo: popReturnTo() ?? fallback, account };
}

export interface AcquireTokenOptions {
  scopes: string[];
  /** If true, will redirect when silent acquisition fails. Default: true. */
  interactive?: boolean;
}

export async function acquireToken(
  msal: PublicClientApplication,
  { scopes, interactive = true }: AcquireTokenOptions,
): Promise<string> {
  await msal.initialize();
  const accounts = msal.getAllAccounts();
  const account = msal.getActiveAccount() ?? accounts[0] ?? null;
  if (!account) {
    throw new NotAuthenticatedError('No active account; call login() first.');
  }
  try {
    const result = await msal.acquireTokenSilent({ scopes, account });
    return result.accessToken;
  } catch (err) {
    if (interactive && err instanceof InteractionRequiredAuthError) {
      stashReturnTo(window.location.href);
      await msal.acquireTokenRedirect({ scopes, account });
      throw new NotAuthenticatedError('Interaction required; redirecting…');
    }
    throw err;
  }
}
