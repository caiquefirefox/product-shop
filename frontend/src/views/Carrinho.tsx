import { useCart } from "../cart/CartContext";
import { useNavigate } from "react-router-dom";
import { ENV } from "../config/env";
import { isBelowMin, itemSubtotal, itemPesoKg } from "../cart/calc";

export default function Carrinho() {
  const { items, totalUnidades, totalValor, totalPesoKg, setQuantity, remove, clear, anyBelowMinimum } = useCart();
  const navigate = useNavigate();
  const passouLimite = totalPesoKg > ENV.LIMIT_KG_MES;

  if (!items.length) {
    return (
      <div className="bg-white p-6 rounded-xl shadow text-center">
        <p className="text-gray-600">Seu carrinho está vazio.</p>
        <button className="mt-3 px-3 py-2 border rounded-lg" onClick={() => navigate("/")}>
          Ir ao Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow overflow-auto">
        <table className="min-w-[900px] w-full">
          <thead>
            <tr className="text-left">
              <th className="py-2">Produto</th>
              <th className="py-2">Preço (R$)</th>
              <th className="py-2">Peso (kg)</th>
              <th className="py-2">Qtd</th>
              <th className="py-2">Subtotal (R$)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map(i => {
              const below = isBelowMin(i);
              const min = i.minQty ?? ENV.QTD_MINIMA_PADRAO;
              return (
                <tr key={i.codigo} className="border-t align-middle">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{i.descricao}</div>
                      {below && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full border bg-red-50 text-red-700">
                          mínimo: {min} un.
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-4">{i.preco.toFixed(2)}</td>
                  <td className="py-2 pr-4">{i.pesoKg.toFixed(3)}</td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      min={1}
                      value={i.quantidade}
                      onChange={e => setQuantity(i.codigo, parseInt(e.target.value || "1"))}
                      className={`w-24 border rounded p-1 ${below ? "border-red-300 bg-red-50" : ""}`}
                      title={below ? `Mínimo para este produto: ${min} un.` : ""}
                    />
                  </td>
                  <td className="py-2 pr-4">{itemSubtotal(i).toFixed(2)}</td>
                  <td className="py-2">
                    <button className="px-3 py-1 border rounded-lg" onClick={() => remove(i.codigo)}>
                      Remover
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t font-semibold">
              <td className="py-2">Totais</td>
              <td />
              <td className="py-2">{totalPesoKg.toFixed(3)} kg</td>
              <td className="py-2">{totalUnidades}</td>
              <td className="py-2">R$ {totalValor.toFixed(2)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button className="px-3 py-2 border rounded-lg" onClick={() => clear()}>Limpar carrinho</button>
        <button className="px-3 py-2 border rounded-lg" onClick={() => navigate("/checkout")}>
          Continuar
        </button>
      </div>

      {anyBelowMinimum && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Existem itens abaixo da quantidade mínima exigida. Ajuste as quantidades (veja os rótulos "mínimo").
        </div>
      )}

      {passouLimite && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Atenção: seu carrinho tem {totalPesoKg.toFixed(3)} kg. O limite mensal é {ENV.LIMIT_KG_MES} kg por colaborador (validado no checkout).
        </div>
      )}
    </div>
  );
}
