import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, type SVGProps } from "react";
import premierPetLogo from "../assets/images/premierpet-logo.png";

const PREMIERPET_LOGO_SRC =
  typeof import.meta.env.VITE_PREMIERPET_LOGO_URL === "string" &&
  import.meta.env.VITE_PREMIERPET_LOGO_URL.trim().length > 0
    ? import.meta.env.VITE_PREMIERPET_LOGO_URL
    : premierPetLogo;

const MicrosoftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <rect x="1" y="1" width="10" height="10" fill="#F35325" />
    <rect x="13" y="1" width="10" height="10" fill="#81BC06" />
    <rect x="1" y="13" width="10" height="10" fill="#05A6F0" />
    <rect x="13" y="13" width="10" height="10" fill="#FFBA08" />
  </svg>
);

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
      const result = await instance.loginPopup(scopes);
      if (result?.account) {
        instance.setActiveAccount(result.account);
      }
      navigate(returnTo, { replace: true });
    } catch (error: unknown) {
      const { errorCode, message } = asAuthError(error);
      const fallbackMessage = message ?? "Falha no login";

      if (errorCode === "hash_empty_error") {
        setErr(fallbackMessage);
        try {
          await instance.loginRedirect(scopes);
          return;
        } catch (redirectErr: unknown) {
          const { message: redirectMessage } = asAuthError(redirectErr);
          setErr(redirectMessage ?? fallbackMessage);
        }
      } else {
        setErr(fallbackMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#FFF3E5] to-[#FFE3CC]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-hidden rounded-none bg-white shadow-none lg:my-16 lg:flex-row lg:rounded-3xl lg:shadow-2xl">
        <div className="relative hidden w-full max-w-xl flex-1 flex-col justify-between bg-[#FF6900] px-12 py-12 text-white lg:flex">
          <img
            src={PREMIERPET_LOGO_SRC}
            alt="PremieRpet"
            className="h-14 w-auto"
          />
          <div className="mt-16 space-y-6">
            <h1 className="text-4xl font-semibold leading-tight">
              Tudo o que você precisa para gerir seu catálogo em um único lugar.
            </h1>
            <p className="text-base text-white/90">
              Acesse o sistema para acompanhar pedidos, gerenciar produtos e visualizar relatórios personalizados.
            </p>
          </div>
          <div className="mt-auto text-sm text-white/80">
            <p>Compatível com dispositivos desktop e mobile.</p>
            <p>Suporte dedicado PremieRpet.</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-4 lg:hidden">
              <img src={PREMIERPET_LOGO_SRC} alt="PremieRpet" className="h-12 w-auto" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Bem-vindo</h1>
                <p className="text-sm text-gray-500">Entre com sua conta Microsoft para continuar</p>
              </div>
            </div>

            <div className="hidden lg:block">
              <h2 className="text-3xl font-semibold text-gray-900">Entrar no sistema</h2>
              <p className="mt-2 text-base text-gray-500">Use sua conta Microsoft corporativa para acessar as funcionalidades do portal.</p>
            </div>

            {err && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}

            <button
              onClick={doLogin}
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-[#FF6900] px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#e65f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span>Entrando...</span>
              ) : (
                <>
                  <MicrosoftIcon className="h-5 w-5" />
                  <span>Entrar com Microsoft</span>
                </>
              )}
            </button>

            <p className="mt-6 text-center text-sm text-gray-400">
              Ao acessar, você concorda com os termos de uso e política de privacidade do portal PremieRpet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
