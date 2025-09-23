import { useEffect, useState } from "react";
import api from "../lib/api";
import { useCart } from "../cart/CartContext";
import type { Produto } from "../cart/types";
import { ENV } from "../config/env";
import { minQtyFor } from "../cart/calc";

export default function Catalogo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const { addProduct } = useCart();

  useEffect(() => {
    api.get("/catalogo").then(r => setProdutos(r.data));
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {produtos.map(p => {
        const minimo = Math.max(ENV.QTD_MINIMA_PADRAO, p.quantidadeMinimaDeCompra || 0);
        return (
          <div key={p.codigo} className="bg-white p-4 rounded-xl shadow">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold pr-2">{p.descricao}</h3>
              {minimo > 1 && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border shrink-0">
                  mín: {minimo} un.
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{p.sabores}</p>
            <p className="mt-2">R$ {p.preco.toFixed(2)}</p>

            <button
              className="mt-3 px-3 py-1 border rounded-lg"
              onClick={() => addProduct(p, minQtyFor(p))} // começa direto no mínimo
            >
              Adicionar
            </button>
          </div>
        );
      })}
    </div>
  );
}
