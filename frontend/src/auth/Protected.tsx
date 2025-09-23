import { useIsAuthenticated } from "@azure/msal-react";
import { Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { useUser } from "./useUser";

export default function Protected({
  children,
  requiredRole,
}: { children: ReactElement; requiredRole?: "Admin" | "Colaborador" }) {
  const isAuth = useIsAuthenticated();
  const { roles, isLoading } = useUser();
  const location = useLocation();
  const returnTo = location.pathname + (location.search || "") + (location.hash || "");

  if (!isAuth) return <Navigate to="/login" replace state={{ returnTo }} />;

  // Evita "flicker" de 403 enquanto ainda buscamos roles
  if (requiredRole && isLoading) return null; // ou um skeleton/spinner

  if (requiredRole && !roles.includes(requiredRole)) return <Navigate to="/" replace />;

  return children;
}
