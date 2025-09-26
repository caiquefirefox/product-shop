import {
  PublicClientApplication,
  EventType,
  type Configuration,
  type EventMessage,
  type AuthenticationResult,
} from "@azure/msal-browser";

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Config faltando: ${name}`);
  return value;
}

const TENANT = requireEnv('VITE_AAD_TENANT_ID', import.meta.env.VITE_AAD_TENANT_ID);
const CLIENT = requireEnv('VITE_AAD_CLIENT_ID', import.meta.env.VITE_AAD_CLIENT_ID);
const REDIRECT = requireEnv('VITE_REDIRECT_URI', import.meta.env.VITE_REDIRECT_URI);
const SCOPE = requireEnv('VITE_API_SCOPE', import.meta.env.VITE_API_SCOPE);

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT,
    authority: `https://login.microsoftonline.com/${TENANT}`,
    redirectUri: REDIRECT,
    postLogoutRedirectUri: REDIRECT,
  }
};

export const pca = new PublicClientApplication(msalConfig);

function setActiveAccountFromEvent(event: EventMessage) {
  const account = (event.payload as AuthenticationResult | undefined)?.account;
  if (account) {
    pca.setActiveAccount(account);
  }
}

pca.addEventCallback((event) => {
  switch (event.eventType) {
    case EventType.LOGIN_SUCCESS:
    case EventType.ACQUIRE_TOKEN_SUCCESS:
      setActiveAccountFromEvent(event);
      break;
    default:
      break;
  }
});

export function ensureActiveAccount() {
  if (!pca.getActiveAccount()) {
    const [firstAccount] = pca.getAllAccounts();
    if (firstAccount) {
      pca.setActiveAccount(firstAccount);
    }
  }
}
