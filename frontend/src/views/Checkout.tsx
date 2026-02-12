import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { useCart } from "../cart/CartContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/toast";
import { formatCurrencyBRL, formatPeso } from "../lib/format";
import { sanitizeCpf, isValidCpf, formatCpf } from "../lib/cpf";
import type { UsuarioPerfil } from "../types/user";
import { usePedidosConfig } from "../hooks/usePedidosConfig";
import { useUser } from "../auth/useUser";

type Empresa = {
  id: string;
  nome: string;
};

export default function Checkout() {
  const { items, totalValor, totalPesoKg, clear, anyBelowMinimum } = useCart();
  const pesoTotalFormatado = formatPeso(totalPesoKg, "kg", { unit: "kg" });
  const { limitKg: limiteMensalKg, loading: limiteLoading, error: limiteErro } = usePedidosConfig();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [empresasErro, setEmpresasErro] = useState<string | null>(null);
  const [perfilErro, setPerfilErro] = useState<string | null>(null);
  const [cpf, setCpf] = useState<string>("");
  const [cpfBloqueado, setCpfBloqueado] = useState(false);
  const [cpfErro, setCpfErro] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { profile } = useUser();
  const usuarioSemLimite = profile?.semLimite ?? false;
  const limiteMensalFormatado = usuarioSemLimite
    ? "Sem limite"
    : (limiteMensalKg > 0 ? formatPeso(limiteMensalKg, "kg", { unit: "kg" }) : "Não configurado");

  useEffect(() => {
    let alive = true;
    setLoadingEmpresas(true);
    setEmpresasErro(null);

    api.get<Empresa[]>("/empresas")
      .then(r => {
        if (!alive) return;
        setEmpresas(r.data || []);
      })
      .catch(e => {
        if (!alive) return;
        setEmpresasErro(e?.response?.data?.title ?? "Falha ao carregar empresas.");
      })
      .finally(() => { if (!alive) return; setLoadingEmpresas(false); });

    return () => { alive = false; };
  }, []);


  useEffect(() => {
    let alive = true;
    setLoadingPerfil(true);
    setPerfilErro(null);
    api.get<UsuarioPerfil>("/usuarios/me")
      .then(r => {
        if (!alive) return;
        const dados = r.data;
        const digits = sanitizeCpf(dados?.cpf ?? "");
        setCpf(digits);
        setCpfBloqueado(Boolean(digits));
      })
      .catch(e => {
        if (!alive) return;
        const msg = e?.response?.data?.detail || e?.message || "Não foi possível carregar seus dados.";
        setPerfilErro(msg);
        setCpfBloqueado(false);
      })
      .finally(() => { if (!alive) return; setLoadingPerfil(false); });

    return () => { alive = false; };
  }, []);

  const onCpfChange = (value: string) => {
    const digits = sanitizeCpf(value).slice(0, 11);
    setCpf(digits);
    if (cpfErro) setCpfErro(null);
  };

  const enviar = async () => {
    setErr(null);
    setCpfErro(null);

    if (!cpfBloqueado && !isValidCpf(cpf)) {
      setCpfErro("Informe um CPF válido.");
      return;
    }

    setLoading(true);
    try {
      const cpfDigits = sanitizeCpf(cpf);
      const dto = {
        empresaId,
        itens: items.map(i => ({ produtoCodigo: i.codigo, quantidade: i.quantidade })),
        cpf: cpfDigits || undefined,
      };
      const r = await api.post("/checkout", dto);

      // extrai um id legível
      const id = r?.data?.id ?? r?.data?.pedidoId ?? r?.data;
      const idStr = typeof id === "string" ? id : (typeof id === "number" ? String(id) : "");
      const idCurto = idStr.length > 8 ? idStr.slice(0, 8) + "…" : idStr;

      success("Pedido criado com sucesso!", idStr ? `Código: ${idCurto}` : undefined);

      clear();
      navigate("/");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.title || e?.message || "Erro ao finalizar pedido.";
      setErr(msg);
      if (msg?.toLowerCase().includes("cpf")) {
        setCpfErro(msg);
      }
      toastError("Não foi possível finalizar", msg);
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
        <p className="text-gray-600">Seu carrinho está vazio.</p>
      </div>
    );
  }

  const disableFinalize =
    loading ||
    loadingEmpresas ||
    loadingPerfil ||
    !empresaId ||
    anyBelowMinimum ||
    (!cpfBloqueado && !isValidCpf(cpf));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finalizar pedido</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="cpf-input">
                CPF
              </label>
              {loadingPerfil ? (
                <div className="text-sm text-gray-600">Carregando informações...</div>
              ) : (
                <>
                  <input
                    id="cpf-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={formatCpf(cpf)}
                    onChange={e => onCpfChange(e.target.value)}
                    disabled={cpfBloqueado}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {cpfBloqueado ? (
                    <p className="text-xs text-gray-500">
                      CPF já cadastrado. Entre em contato com o suporte para alterações.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Informe seu CPF para concluir o pedido.</p>
                  )}
                </>
              )}
            </div>

            {cpfErro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{cpfErro}</div>
            )}

            {perfilErro && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{perfilErro}</div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">Empresa</span>
              {loadingEmpresas ? (
                <div className="text-sm text-gray-600">Carregando empresas...</div>
              ) : empresasErro ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{empresasErro}</div>
              ) : empresas.length ? (
                <div className="grid gap-2">
                  {empresas.map(empresa => (
                    <label
                      key={empresa.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                    >
                      <input
                        type="radio"
                        name="empresa"
                        value={empresa.id}
                        checked={empresaId === empresa.id}
                        onChange={() => setEmpresaId(empresa.id)}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">{empresa.nome}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Nenhuma empresa disponível. Entre em contato com o suporte.
                </div>
              )}
            </div>

          </div>
        </section>

        <section className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-lg font-bold text-[20px]">Resumo do pedido</h2>

            <div className="flex flex-1 flex-col gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600">Limite mensal:</span>
                <span className="ml-auto font-semibold text-gray-900">
                  {limiteLoading ? "Carregando..." : limiteMensalFormatado}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600">Peso total:</span>
                <span className="ml-auto font-semibold text-gray-900">{pesoTotalFormatado}</span>
              </div>
              <div className="mt-auto space-y-3">
                <div className="border-t border-gray-200" aria-hidden="true" />
                <div className="flex items-center justify-between text-[20px]">
                  <span className="text-gray-900">Valor total:</span>
                  <span className="font-semibold text-gray-900">{formatCurrencyBRL(totalValor)}</span>
                </div>
              </div>
            </div>

            {anyBelowMinimum && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                Existem itens abaixo da quantidade mínima exigida. Ajuste as quantidades no carrinho.
              </div>
            )}

            {limiteErro && !limiteLoading && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{limiteErro}</div>
            )}

            {!usuarioSemLimite && limiteMensalKg > 0 && totalPesoKg > limiteMensalKg && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Atenção: seu carrinho tem {pesoTotalFormatado}. O limite mensal é {limiteMensalFormatado}.
              </div>
            )}

            {err && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
            )}
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={enviar}
          disabled={disableFinalize}
          className="inline-flex items-center justify-center rounded-full bg-[#FF6900] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#FF6900]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40 disabled:cursor-not-allowed disabled:opacity-60"
          title={anyBelowMinimum ? "Há itens abaixo da quantidade mínima." : ""}
        >
          {loading ? "Enviando..." : "Finalizar solicitação"}
        </button>
      </div>
    </div>
  );
}
