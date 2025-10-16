import { useEffect, useState } from "react";
import api from "../lib/api";
import { useCart } from "../cart/CartContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/toast";
import { formatPeso } from "../lib/format";
import { sanitizeCpf, isValidCpf, formatCpf } from "../lib/cpf";
import type { UsuarioPerfil } from "../types/user";
import { useMonthlyLimit } from "../hooks/useMonthlyLimit";

type UnidadeEntrega = string;

export default function Checkout() {
  const { items, totalValor, totalPesoKg, clear, anyBelowMinimum } = useCart();
  const pesoTotalFormatado = formatPeso(totalPesoKg, "kg", { unit: "kg" });
  const { limitKg: limiteMensalKg, loading: limiteLoading, error: limiteErro } = useMonthlyLimit();
  const limiteMensalFormatado = limiteMensalKg > 0
    ? formatPeso(limiteMensalKg, "kg", { unit: "kg" })
    : "Não configurado";
  const [unidades, setUnidades] = useState<UnidadeEntrega[]>([]);
  const [unidade, setUnidade] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [perfilErro, setPerfilErro] = useState<string | null>(null);
  const [cpf, setCpf] = useState<string>("");
  const [cpfBloqueado, setCpfBloqueado] = useState(false);
  const [cpfErro, setCpfErro] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  // Busca unidades do backend
  useEffect(() => {
    let alive = true;
    setLoadingUnidades(true);
    api.get<string[]>("/unidades-entrega")
      .then(r => { if (!alive) return; setUnidades(r.data || []); setUnidade((r.data || [])[0] || ""); })
      .catch(e => { if (!alive) return; setErr(e?.response?.data?.title ?? "Falha ao carregar unidades de entrega."); })
      .finally(() => { if (!alive) return; setLoadingUnidades(false); });
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
        unidadeEntrega: unidade,
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
      <div className="bg-white p-6 rounded-xl shadow text-center">
        <p className="text-gray-600">Seu carrinho está vazio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-3">Dados cadastrais</h2>
        {loadingPerfil ? (
          <div className="text-gray-600 text-sm">Carregando informações...</div>
        ) : (
          <div className="space-y-2 max-w-md">
            <label className="text-sm text-gray-600" htmlFor="cpf-input">CPF</label>
            <input
              id="cpf-input"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={formatCpf(cpf)}
              onChange={(e) => onCpfChange(e.target.value)}
              disabled={cpfBloqueado}
              className="border rounded p-2 w-full disabled:opacity-60"
            />
            {cpfBloqueado ? (
              <p className="text-xs text-gray-500">CPF já cadastrado. Entre em contato com o suporte para alterações.</p>
            ) : (
              <p className="text-xs text-gray-500">Informe seu CPF para concluir o pedido.</p>
            )}
            {cpfErro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{cpfErro}</div>
            )}
            {perfilErro && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{perfilErro}</div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-3">Entrega</h2>

        {loadingUnidades ? (
          <div className="text-gray-600 text-sm">Carregando unidades...</div>
        ) : unidades.length ? (
          <select
            className="border rounded p-2"
            value={unidade}
            onChange={e => setUnidade(e.target.value)}
          >
            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Não foi possível carregar as unidades de entrega. Tente novamente mais tarde.
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-3">Resumo</h2>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="text-gray-600">Peso total</div>
          <div>{pesoTotalFormatado}</div>
          <div className="text-gray-600">Valor total</div>
          <div>R$ {totalValor.toFixed(2)}</div>
          <div className="text-gray-600">Limite mensal</div>
          <div>{limiteLoading ? "Carregando..." : limiteMensalFormatado}</div>
        </div>

        {anyBelowMinimum && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Existem itens abaixo da quantidade mínima exigida. Ajuste as quantidades no carrinho.
          </div>
        )}

        {limiteErro && !limiteLoading && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {limiteErro}
          </div>
        )}

        {limiteMensalKg > 0 && totalPesoKg > limiteMensalKg && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Atenção: seu carrinho tem {pesoTotalFormatado}. O limite mensal é {limiteMensalFormatado} (validado no backend).
          </div>
        )}

        {err && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <button
          onClick={enviar}
          disabled={loading || loadingUnidades || loadingPerfil || !unidade || anyBelowMinimum || (!cpfBloqueado && !isValidCpf(cpf))}
          className="mt-4 px-3 py-2 border rounded-lg disabled:opacity-60"
          title={anyBelowMinimum ? "Há itens abaixo da quantidade mínima." : ""}
        >
          {loading ? "Enviando..." : "Finalizar solicitação"}
        </button>
      </div>
    </div>
  );
}
