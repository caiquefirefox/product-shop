import axios from "axios";
import { pca } from "../auth/msal";
import { getLocalToken } from "../auth/localAuth";

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

export default api;
