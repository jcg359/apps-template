function required(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name];
  if (!v) throw new Error(`Missing required env var: ${String(name)}`);
  return v;
}

function defaultRedirectUri(): string {
  // Always points at the shell origin's /auth-client-redirect — same origin in prod via nginx.
  return `${window.location.origin}/auth-client-redirect`;
}

export const env = {
  clientId: required('VITE_AUTH_CLIENT_ID'),
  tenantId: required('VITE_AUTH_TENANT_ID'),
  redirectUri: import.meta.env.VITE_AUTH_REDIRECT_URI ?? defaultRedirectUri(),
  apiScope: import.meta.env.VITE_AUTH_API_SCOPE ?? 'User.Read',
  mockUser:
    import.meta.env.VITE_MOCK_USER === '1' || import.meta.env.VITE_MOCK_USER === 'true',
};
