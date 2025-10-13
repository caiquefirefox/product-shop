import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { useUser } from "./useUser";
import { InteractionStatus } from "@azure/msal-browser";

export default function Protected({
  children,
  requiredRole,
}: { children: ReactElement; requiredRole?: "Admin" | "Colaborador" }) {
  const { instance, inProgress } = useMsal();
  const isAuth = useIsAuthenticated();
  const { roles, isLoading } = useUser();
  const location = useLocation();
  const returnTo = location.pathname + (location.search || "") + (location.hash || "");

  const isInitializing =
    inProgress === InteractionStatus.Startup || inProgress === InteractionStatus.HandleRedirect;

  if (isInitializing) return null;

  const cachedAccounts = instance.getAllAccounts();
  const hasAnyAccount = isAuth || cachedAccounts.length > 0;

  if (!hasAnyAccount) {
    return <Navigate to="/login" replace state={{ returnTo }} />;
  }

  if (!instance.getActiveAccount() && cachedAccounts.length > 0) {
    instance.setActiveAccount(cachedAccounts[0]);
  }

  // Evita "flicker" de 403 enquanto ainda buscamos roles
  if (requiredRole && isLoading) return null; // ou um skeleton/spinner

  if (requiredRole && !roles.includes(requiredRole)) return <Navigate to="/" replace />;

  return children;
}
