import { PublicClientApplication, EventType, type Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AAD_CLIENT_ID as string, // CLIENT ID da SPA
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AAD_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI as string,
    postLogoutRedirectUri: import.meta.env.VITE_REDIRECT_URI as string,
  }
};

export const pca = new PublicClientApplication(msalConfig);

pca.addEventCallback((e) => {
  if (e.eventType === EventType.LOGIN_SUCCESS) {
    // noop
  }
});
