/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_CLIENT_ID: string;
  readonly VITE_AUTH_TENANT_ID: string;
  readonly VITE_AUTH_REDIRECT_URI?: string;
  readonly VITE_AUTH_API_SCOPE?: string;
  readonly VITE_MOCK_USER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
