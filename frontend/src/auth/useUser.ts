import { useCallback, useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { pca } from "./msal";
import api from "../lib/api";
import type { UsuarioPerfil } from "../types/user";

const LS_KEY = "premier:roles:v2";

export function useUser() {
  const { accounts } = useMsal();
  const account = accounts[0] ?? pca.getActiveAccount() ?? pca.getAllAccounts()[0];

  const cachedRoles = useMemo<string[]>(
    () => JSON.parse(localStorage.getItem(LS_KEY) || "[]"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account?.homeAccountId]
  );

  const [roles, setRoles] = useState<string[]>(cachedRoles);
  const [profile, setProfile] = useState<UsuarioPerfil | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    if (!account) {
      setProfile(null);
      setRoles([]);
      localStorage.removeItem(LS_KEY);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.get<UsuarioPerfil>("/usuarios/me");
      const uniqueRoles = Array.from(new Set(data.roles ?? []));
      setProfile(data);
      setRoles(uniqueRoles);
      localStorage.setItem(LS_KEY, JSON.stringify(uniqueRoles));
    } catch {
      // mantém o cache atual, mas remove o perfil até nova tentativa
      setProfile(null);
      if (cachedRoles.length === 0) {
        setRoles([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [account?.homeAccountId, cachedRoles]);

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
    clearRolesCache: () => localStorage.removeItem(LS_KEY),
  };
}
