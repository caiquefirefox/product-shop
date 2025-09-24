import { useEffect, useState } from "react";
import api from "../lib/api";
import { useCart } from "../cart/CartContext";
import { useNavigate } from "react-router-dom";
import { ENV } from "../config/env";
import { useToast } from "../ui/toast";
import { formatPeso } from "../lib/format";

type UnidadeEntrega = string;

export default function Checkout() {
  const { items, totalValor, totalPesoKg, clear, anyBelowMinimum } = useCart();
  const pesoTotalFormatado = formatPeso(totalPesoKg, "kg", { unit: "kg" });
  const limiteMensalFormatado = formatPeso(ENV.LIMIT_KG_MES, "kg");
  const [unidades, setUnidades] = useState<UnidadeEntrega[]>([]);
  const [unidade, setUnidade] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
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

  const enviar = async () => {
    setErr(null);
    setLoading(true);
    try {
      const dto = {
        unidadeEntrega: unidade,
        itens: items.map(i => ({ produtoCodigo: i.codigo, quantidade: i.quantidade }))
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
          <div>{limiteMensalFormatado}</div>
        </div>

        {anyBelowMinimum && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Existem itens abaixo da quantidade mínima exigida. Ajuste as quantidades no carrinho.
          </div>
        )}

        {totalPesoKg > ENV.LIMIT_KG_MES && (
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
          disabled={loading || loadingUnidades || !unidade || anyBelowMinimum}
          className="mt-4 px-3 py-2 border rounded-lg disabled:opacity-60"
          title={anyBelowMinimum ? "Há itens abaixo da quantidade mínima." : ""}
        >
          {loading ? "Enviando..." : "Finalizar solicitação"}
        </button>
      </div>
    </div>
  );
}
