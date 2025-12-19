import axios from "axios";
import { pca } from "../auth/msal";
import { clearLocalToken, getLocalToken } from "../auth/localAuth";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

const INACTIVE_USER_PROBLEM_TYPE = "https://pedido-interno.premierpet.com.br/problems/user-inactive";
const SESSION_EXPIRED_MARKERS = ["interaction_required", "aadsts160021"];
const ROLE_CACHE_PREFIX = "premier:roles:v2";

function clearRoleCache() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(ROLE_CACHE_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}

async function redirectToLogin() {
  clearLocalToken();
  clearRoleCache();

  try {
    if (pca.getActiveAccount() || pca.getAllAccounts().length) {
      await pca.logoutRedirect({ postLogoutRedirectUri: `${window.location.origin}/login` });
      return;
    }
  } catch {
    // continua para fallback abaixo
  }

  window.location.assign("/login");
}

function isSessionExpired(status: number | undefined, data: unknown, wwwAuthenticateHeader: string | undefined) {
  const matchesMarker = (value: string | undefined) =>
    typeof value === "string" &&
    SESSION_EXPIRED_MARKERS.some((marker) => value.toLowerCase().includes(marker));

  const messageFromData =
    typeof data === "string"
      ? data
      : typeof data === "object" && data !== null
        ? (data as Record<string, unknown>).detail ??
          (data as Record<string, unknown>).message ??
          (data as Record<string, unknown>).error_description ??
          (data as Record<string, unknown>).error
        : undefined;

  return (
    status === 401 &&
    (matchesMarker(wwwAuthenticateHeader) || matchesMarker(typeof messageFromData === "string" ? messageFromData : undefined))
  );
}

api.interceptors.request.use(async (config) => {
  const localToken = getLocalToken();
  if (localToken) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${localToken}`;
    return config;
  }

  const accounts = pca.getAllAccounts();
  if (accounts.length) {
    const result = await pca.acquireTokenSilent({
      account: accounts[0],
      scopes: [import.meta.env.VITE_API_SCOPE as string]
    });
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${result.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status as number | undefined;
    const problemType = error?.response?.data?.type as string | undefined;
    const wwwAuthenticateHeader = error?.response?.headers?.["www-authenticate"] as string | undefined;

    const isInactiveUser = status === 403 && problemType === INACTIVE_USER_PROBLEM_TYPE;
    const sessionExpired = isSessionExpired(status, error?.response?.data, wwwAuthenticateHeader);

    if (isInactiveUser || sessionExpired) {
      await redirectToLogin();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
