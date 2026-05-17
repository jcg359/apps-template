import { useApi } from './client';
import type { AccessProfile, CurrentUser } from './types';

export function useProfileApi() {
  const api = useApi();
  return {
    currentUser: () => api<CurrentUser>('/access/current-user'),
    myProfile: (impersonate?: string | null) =>
      api<AccessProfile>('/access/profile', { impersonate }),
    profileFor: (email: string) =>
      api<AccessProfile>(`/access/profile/${encodeURIComponent(email)}`),
  };
}
