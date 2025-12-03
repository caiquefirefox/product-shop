import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, type SVGProps, FormEvent } from "react";
import premierPetLogo from "../assets/images/premierpet-logo.png";
import api from "../lib/api";
import { sanitizeCpf } from "../lib/cpf";
import { hasLocalToken, setLocalToken } from "../auth/localAuth";

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
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const SCOPE = requireEnv('VITE_API_SCOPE', import.meta.env.VITE_API_SCOPE);
  const isLocalAuth = hasLocalToken();

  const returnTo = state?.returnTo || "/"; // padrão: catálogo

  // se já estiver autenticado e entrou em /login, redireciona
  useEffect(() => {
    if (isAuth || isLocalAuth) navigate(returnTo, { replace: true });
  }, [isAuth, isLocalAuth, navigate, returnTo]);

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

  const PASSWORD_CHANGE_REQUIRED_TYPE = "https://pedido-interno.premierpet.com.br/problems/password-change-required";

  type LocalLoginResponse = { token: string };

  const doLocalLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLocalErr(null);
    const sanitizedCpf = sanitizeCpf(cpf);

    if (sanitizedCpf.length !== 11) {
      setLocalErr("CPF inválido.");
      return;
    }

    if (!senha.trim()) {
      setLocalErr("Informe a senha.");
      return;
    }

    setLocalLoading(true);
    try {
      const { data } = await api.post<LocalLoginResponse>("/auth/login", {
        cpf: sanitizedCpf,
        senha,
      });

      if (data?.token) {
        setLocalToken(data.token);
      }

      navigate(returnTo, { replace: true });
    } catch (error: any) {
      const detail = error?.response?.data?.detail as string | undefined;
      const type = error?.response?.data?.type as string | undefined;

      if (type === PASSWORD_CHANGE_REQUIRED_TYPE) {
        navigate("/trocar-senha", {
          replace: true,
          state: {
            cpf: sanitizedCpf,
            returnTo,
            mensagem: detail ?? "Você precisa trocar a senha antes de continuar.",
          },
        });
        return;
      }

      setLocalErr(detail ?? "Não foi possível entrar com CPF e senha.");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-3xl rounded-[32px] border border-gray-100 bg-white px-8 py-10 shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:px-12 sm:py-14">
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
          <img src={PREMIERPET_LOGO_SRC} alt="PremieRpet" className="h-14 w-auto" />

          <div className="mt-10 space-y-3">
            <h1 className="text-3xl font-semibold text-slate-900">Bem-vindo ao portal de pedidos internos da PremieRpet®</h1>
            <p className="text-base text-slate-500">Escolha como deseja acessar o sistema.</p>
          </div>

          {err && (
            <div className="mt-6 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="mt-10 flex w-full flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-left">
            <h2 className="text-lg font-semibold text-slate-900">Acesse com CPF e senha</h2>
            <form className="space-y-3" onSubmit={doLocalLogin}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="login-cpf">CPF</label>
                <input
                  id="login-cpf"
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(sanitizeCpf(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-[#FF6900] focus:outline-none focus:ring-2 focus:ring-[#FF6900]/20"
                  placeholder="Digite seu CPF"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="login-senha">Senha</label>
                <input
                  id="login-senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-[#FF6900] focus:outline-none focus:ring-2 focus:ring-[#FF6900]/20"
                  placeholder="Senha"
                  autoComplete="current-password"
                />
              </div>

              {localErr && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {localErr}
                </div>
              )}

              <button
                type="submit"
                disabled={localLoading}
                className="flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-800/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {localLoading ? "Entrando..." : "Entrar com CPF"}
              </button>
            </form>
          </div>

          <button
            onClick={doLogin}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#FF6900] px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#e65f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40 disabled:cursor-not-allowed disabled:opacity-60"
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

          <p className="mt-6 text-sm text-slate-400">
            Ao acessar, você concorda com os <a href="https://premierpet.com.br/privacidade/"  target="_blank">termos de uso</a> e <a href="https://premierpet.com.br/privacidade/" target="_blank">política de privacidade</a> do portal PremieRpet.
          </p>
        </div>
      </div>
    </div>
  );
}
