import { PublicClientApplication, type Configuration } from '@azure/msal-browser';

export interface MsalConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  postLogoutRedirectUri?: string;
}

export function createMsalApp(config: MsalConfig): PublicClientApplication {
  const msalConfig: Configuration = {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      redirectUri: config.redirectUri,
      postLogoutRedirectUri: config.postLogoutRedirectUri ?? config.redirectUri,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  };
  return new PublicClientApplication(msalConfig);
}
