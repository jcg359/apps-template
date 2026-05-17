import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AccountInfo, PublicClientApplication } from '@azure/msal-browser';
import {
  acquireToken as acquireTokenFn,
  login as loginFn,
  logout as logoutFn,
} from './flow';

export interface MockUser {
  email: string;
  name: string;
}

export interface AuthContextValue {
  user: { email: string; name: string } | null;
  isAuthenticated: boolean;
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  acquireToken: (scopes: string[]) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  msal: PublicClientApplication;
  loginScopes: string[];
  /** Bypass MSAL entirely; useful for standalone dev (VITE_MOCK_USER=1). */
  mockUser?: MockUser;
  children: ReactNode;
}

function accountToUser(a: AccountInfo): { email: string; name: string } {
  return {
    email: a.username,
    name: a.name ?? a.username,
  };
}

export function AuthProvider({
  msal,
  loginScopes,
  mockUser,
  children,
}: AuthProviderProps) {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mockUser) {
      setReady(true);
      return;
    }
    let cancelled = false;
    msal.initialize().then(() => {
      const accounts = msal.getAllAccounts();
      const active = msal.getActiveAccount() ?? accounts[0] ?? null;
      if (active) msal.setActiveAccount(active);
      if (!cancelled) {
        setAccount(active);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [msal, mockUser]);

  const value = useMemo<AuthContextValue>(() => {
    if (mockUser) {
      return {
        user: mockUser,
        isAuthenticated: true,
        login: async () => undefined,
        logout: async () => undefined,
        acquireToken: async () => 'mock-token',
      };
    }
    return {
      user: account ? accountToUser(account) : null,
      isAuthenticated: account !== null,
      login: (returnTo) =>
        loginFn(msal, {
          scopes: loginScopes,
          returnTo: returnTo ?? window.location.href,
        }),
      logout: () => logoutFn(msal),
      acquireToken: (scopes) => acquireTokenFn(msal, { scopes }),
    };
  }, [msal, loginScopes, mockUser, account]);

  if (!ready) return null;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}

/**
 * Ensures the user is authenticated; redirects to login if not.
 * Use inside a route component that requires auth.
 */
export function useRequireAuth(): AuthContextValue {
  const auth = useAuth();
  const { isAuthenticated, login } = auth;
  const triggerLogin = useCallback(() => {
    void login();
  }, [login]);
  useEffect(() => {
    if (!isAuthenticated) triggerLogin();
  }, [isAuthenticated, triggerLogin]);
  return auth;
}
