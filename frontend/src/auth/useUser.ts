import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { pca } from "./msal";

const LS_KEY = "premier:roles:v1";

function decodeJwt<T = any>(jwt: string): T {
  const base64Url = jwt.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(json) as T;
}

export function useUser() {
  const { accounts } = useMsal();
  const account = accounts[0];

  // 1) carrega do cache p/ evitar "flash" após F5
  const cached = useMemo<string[]>(
    () => JSON.parse(localStorage.getItem(LS_KEY) || "[]"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account?.homeAccountId] // se trocar de conta, o efeito abaixo atualiza
  );

  const [roles, setRoles] = useState<string[]>(cached);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  async function refreshRoles() {
    if (!account) {
      setRoles([]);
      localStorage.removeItem(LS_KEY);
      setIsLoading(false);
      return;
    }

    // roles do ID token (se a SPA tiver roles próprias)
    const idRoles = ((account.idTokenClaims as any)?.roles ?? []) as string[];

    try {
      const res = await pca.acquireTokenSilent({
        account,
        scopes: [import.meta.env.VITE_API_SCOPE as string],
      });
      const access = decodeJwt<any>(res.accessToken);
      const apiRoles = (access?.roles ?? []) as string[];
      const merged = Array.from(new Set([...idRoles, ...apiRoles]));
      setRoles(merged);
      localStorage.setItem(LS_KEY, JSON.stringify(merged));
    } catch {
      // sem access token: usa o que tiver (ID token / cache)
      const merged = Array.from(new Set([...idRoles, ...cached]));
      setRoles(merged);
      localStorage.setItem(LS_KEY, JSON.stringify(merged));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    refreshRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.homeAccountId]);

  return {
    account,
    roles,
    isAdmin: roles.includes("Admin"),
    isLoading,
    refreshRoles,
    clearRolesCache: () => localStorage.removeItem(LS_KEY),
  };
}
