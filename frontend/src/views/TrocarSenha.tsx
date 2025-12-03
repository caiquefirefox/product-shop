import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import premierPetLogo from "../assets/images/premierpet-logo.png";
import api from "../lib/api";
import { sanitizeCpf } from "../lib/cpf";
import { hasLocalToken, setLocalToken } from "../auth/localAuth";

const PREMIERPET_LOGO_SRC =
  typeof import.meta.env.VITE_PREMIERPET_LOGO_URL === "string" &&
  import.meta.env.VITE_PREMIERPET_LOGO_URL.trim().length > 0
    ? import.meta.env.VITE_PREMIERPET_LOGO_URL
    : premierPetLogo;

type LocState = { cpf?: string; returnTo?: string; mensagem?: string } | null;

type LocalLoginResponse = { token: string };

export default function TrocarSenha() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocState) ?? null;
  const [cpf, setCpf] = useState(() => sanitizeCpf(state?.cpf ?? ""));
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(state?.mensagem ?? null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const returnTo = state?.returnTo || "/";

  useEffect(() => {
    if (hasLocalToken()) navigate(returnTo, { replace: true });
  }, [navigate, returnTo]);

  const doTrocaSenha = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    setMensagem(null);

    const sanitizedCpf = sanitizeCpf(cpf);

    if (sanitizedCpf.length !== 11) {
      setErro("CPF inválido.");
      return;
    }

    if (!senhaAtual.trim()) {
      setErro("Informe a senha atual.");
      return;
    }

    if (!novaSenha.trim()) {
      setErro("Informe a nova senha.");
      return;
    }

    if (novaSenha === senhaAtual) {
      setErro("A nova senha deve ser diferente da atual.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação da nova senha não confere.");
      return;
    }

    setSalvando(true);
    try {
      const { data } = await api.post<LocalLoginResponse>("/auth/alterar-senha", {
        cpf: sanitizedCpf,
        senhaAtual,
        novaSenha,
      });

      if (data?.token) {
        setLocalToken(data.token);
      }

      navigate(returnTo, { replace: true });
    } catch (error: any) {
      const detail = error?.response?.data?.detail as string | undefined;
      setErro(detail ?? "Não foi possível alterar a senha.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-3xl rounded-[32px] border border-gray-100 bg-white px-8 py-10 shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:px-12 sm:py-14">
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
          <img src={PREMIERPET_LOGO_SRC} alt="PremieRpet" className="h-14 w-auto" />

          <div className="mt-10 space-y-3">
            <h1 className="text-3xl font-semibold text-slate-900">Troque sua senha</h1>
            <p className="text-base text-slate-500">Para continuar, defina uma nova senha de acesso.</p>
          </div>

          {(mensagem || erro) && (
            <div className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm ${erro ? "border border-red-200 bg-red-50 text-red-700" : "border border-amber-200 bg-amber-50 text-amber-900"}`}>
              {erro ?? mensagem}
            </div>
          )}

          <div className="mt-10 flex w-full flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-left">
            <h2 className="text-lg font-semibold text-slate-900">Redefinir senha de primeiro acesso</h2>
            <form className="space-y-3" onSubmit={doTrocaSenha}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="cpf">CPF</label>
                <input
                  id="cpf"
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(sanitizeCpf(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-[#FF6900] focus:outline-none focus:ring-2 focus:ring-[#FF6900]/20"
                  placeholder="Digite seu CPF"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="senha-atual">Senha atual</label>
                <input
                  id="senha-atual"
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-[#FF6900] focus:outline-none focus:ring-2 focus:ring-[#FF6900]/20"
                  placeholder="Informe a senha temporária"
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="nova-senha">Nova senha</label>
                <input
                  id="nova-senha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-[#FF6900] focus:outline-none focus:ring-2 focus:ring-[#FF6900]/20"
                  placeholder="Digite a nova senha"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="confirmar-senha">Confirme a nova senha</label>
                <input
                  id="confirmar-senha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-[#FF6900] focus:outline-none focus:ring-2 focus:ring-[#FF6900]/20"
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate("/login", { replace: true })}
                  className="flex w-full items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-base font-semibold text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
                >
                  Voltar para o login
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-800/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar nova senha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
