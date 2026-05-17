import { createContext, useContext, type ReactNode } from 'react';
import type { CurrentUser } from '../api/types';

const Ctx = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: CurrentUser;
  children: ReactNode;
}) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}

export function useCurrentUser(): CurrentUser {
  const u = useContext(Ctx);
  if (!u) throw new Error('useCurrentUser must be used within CurrentUserProvider');
  return u;
}

export function useIsAdmin(): boolean {
  return useCurrentUser().is_admin;
}

export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return useIsAdmin() ? <>{children}</> : <>{fallback}</>;
}
