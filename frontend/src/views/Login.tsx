import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

type LocState = { returnTo?: string } | null;

export default function Login() {

  function requireEnv(name: string, value: string | undefined) {
    if (!value) throw new Error(`Config faltando: ${name}`);
    return value;
  }

  const { instance } = useMsal();
  const isAuth = useIsAuthenticated();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocState) ?? null;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const SCOPE = requireEnv('VITE_API_SCOPE', import.meta.env.VITE_API_SCOPE);

  const returnTo = state?.returnTo || "/"; // padrão: catálogo

  // se já estiver autenticado e entrou em /login, redireciona
  useEffect(() => {
    if (isAuth) navigate(returnTo, { replace: true });
  }, [isAuth, navigate, returnTo]);

  const asAuthError = (error: unknown): { errorCode?: string; message?: string } => {
    if (error && typeof error === "object") {
      const maybeError = error as { errorCode?: string; message?: string };
      return {
        errorCode: maybeError.errorCode,
        message: maybeError.message
      };
    }

    return {};
  };

  const doLogin = async () => {
    setErr(null);
    setLoading(true);

    const scopes = { scopes: [SCOPE] };

    try {
      await instance.loginPopup(scopes);
      navigate(returnTo, { replace: true });
    } catch (error: unknown) {
      const { errorCode, message } = asAuthError(error);

      if (errorCode === "hash_empty_error") {
        try {
          await instance.loginRedirect(scopes);
          return;
        } catch (redirectErr: unknown) {
          const { message: redirectMessage } = asAuthError(redirectErr);
          setErr(redirectMessage ?? "Falha no login");
        }
      } else {
        setErr(message ?? "Falha no login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Bem-vindo</h1>
          <p className="text-gray-600">Acesse com sua conta Microsoft</p>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <button
          onClick={doLogin}
          disabled={loading}
          className="w-full rounded-xl border px-4 py-2 text-center font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar com Microsoft"}
        </button>

      </div>
    </div>
  );
}
