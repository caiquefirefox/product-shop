import { useCallback, useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { pca } from "./msal";
import api from "../lib/api";
import type { UsuarioPerfil } from "../types/user";
import { hasLocalToken } from "./localAuth";

const LS_KEY = "premier:roles:v2";

export function useUser() {
  const { accounts } = useMsal();
  const account = accounts[0] ?? pca.getActiveAccount() ?? pca.getAllAccounts()[0];
  const localAuth = hasLocalToken();
  const cacheKey = account?.homeAccountId
    ? `${LS_KEY}:${account.homeAccountId}`
    : localAuth
      ? `${LS_KEY}:local`
      : LS_KEY;

  const cachedRoles = useMemo<string[]>(
    () => JSON.parse(localStorage.getItem(cacheKey) || "[]"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey]
  );

  const [roles, setRoles] = useState<string[]>(cachedRoles);
  const [profile, setProfile] = useState<UsuarioPerfil | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    if (!account && !localAuth) {
      setProfile(null);
      setRoles([]);
      localStorage.removeItem(cacheKey);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.get<UsuarioPerfil>("/usuarios/me");
      const uniqueRoles = Array.from(new Set(data.roles ?? []));
      setProfile(data);
      setRoles(uniqueRoles);
      localStorage.setItem(cacheKey, JSON.stringify(uniqueRoles));
    } catch {
      setProfile(null);
      setRoles([]);
      localStorage.removeItem(cacheKey);
    } finally {
      setIsLoading(false);
    }
  }, [account?.homeAccountId, cachedRoles, cacheKey, localAuth]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return {
    account,
    roles,
    profile,
    isAdmin: roles.includes("Admin"),
    isLoading,
    refreshRoles: refreshProfile,
    clearRolesCache: () => localStorage.removeItem(cacheKey),
  };
}
