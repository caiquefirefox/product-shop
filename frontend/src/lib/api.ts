import axios from "axios";
import { pca } from "../auth/msal";
import { clearLocalToken, getLocalToken } from "../auth/localAuth";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

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
    const detail = error?.response?.data?.detail as string | undefined;
    const message = detail ?? (error?.response?.data?.message as string | undefined);

    const isInactiveUser =
      status === 403 && typeof message === "string" && message.toLowerCase().includes("usuário inativo");

    if (isInactiveUser) {
      clearLocalToken();
      Object.keys(localStorage)
        .filter((key) => key.startsWith("premier:roles:v2"))
        .forEach((key) => localStorage.removeItem(key));

      try {
        if (pca.getActiveAccount() || pca.getAllAccounts().length) {
          await pca.logoutRedirect({ postLogoutRedirectUri: `${window.location.origin}/login` });
          return Promise.reject(error);
        }
      } catch {
        // continua para fallback abaixo
      }

      window.location.assign("/login");
    }

    return Promise.reject(error);
  }
);

export default api;
