import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Produto } from "./types";
import { useMsal } from "@azure/msal-react";
import { cartTotals, minQtyFor, normalizeQuantityToMultiple, resolveMinQty, toKg } from "./calc";
import { usePedidosConfig } from "../hooks/usePedidosConfig";

type CartState = ReturnType<typeof cartTotals> & { items: CartItem[] };
type CartActions = {
  addProduct: (p: Produto, quantidade?: number) => void;
  setQuantity: (codigo: string, quantidade: number) => void;
  remove: (codigo: string) => void;
  clear: () => void;
};
type CartContext = CartState & CartActions;

const Ctx = createContext<CartContext | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { accounts } = useMsal();
  const account = accounts[0];
  const { minQtyPadrao } = usePedidosConfig();
  const fallbackMinQty = minQtyPadrao > 0 ? minQtyPadrao : 1;
  const storeKey = useMemo(
    () => `premier:cart:${account?.homeAccountId ?? "anon"}`,
    [account?.homeAccountId]
  );

  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(storeKey) || "[]"); }
    catch { return []; }
  });

  useEffect(() => { localStorage.setItem(storeKey, JSON.stringify(items)); }, [items, storeKey]);

  useEffect(() => {
    setItems((prev) => {
      let changed = false;
      const updated = prev.map((item) => {
        const min = resolveMinQty(item.minQty, fallbackMinQty);
        if (item.minQty === min) {
          return item;
        }
        changed = true;
        return {
          ...item,
          minQty: min,
          quantidade: normalizeQuantityToMultiple(item.quantidade, min, item.quantidade),
        };
      });
      return changed ? updated : prev;
    });
  }, [fallbackMinQty]);

  const totals = useMemo(() => cartTotals(items, fallbackMinQty), [items, fallbackMinQty]);

  const addProduct: CartActions["addProduct"] = (p, q) => {
    const min = minQtyFor(p, fallbackMinQty);
    const qty = normalizeQuantityToMultiple(q ?? min, min, min);
    setItems(prev => {
      const idx = prev.findIndex(x => x.codigo === p.codigo);
      if (idx === -1) {
        return [...prev, {
          codigo: p.codigo,
          descricao: p.descricao,
          preco: p.preco,
          pesoKg: toKg(p.peso, p.tipoPeso),
          quantidade: qty,
          minQty: min, // guarda o mínimo vigente para o item
        }];
      } else {
        const copy = [...prev];
        const current = copy[idx];
        const effectiveMin = resolveMinQty(current.minQty, fallbackMinQty);
        const combined = current.quantidade + qty;
        copy[idx] = {
          ...current,
          quantidade: normalizeQuantityToMultiple(combined, effectiveMin, current.quantidade),
          minQty: effectiveMin,
        };
        return copy;
      }
    });
  };

  const setQuantity: CartActions["setQuantity"] = (codigo, quantidade) => {
    setItems(prev =>
      prev.map(i => {
        if (i.codigo !== codigo) return i;
        const min = resolveMinQty(i.minQty, fallbackMinQty);
        return {
          ...i,
          quantidade: normalizeQuantityToMultiple(quantidade, min, i.quantidade),
          minQty: min,
        };
      })
    );
  };

  const remove: CartActions["remove"] = (codigo) => {
    setItems(prev => prev.filter(i => i.codigo !== codigo));
  };

  const clear: CartActions["clear"] = () => setItems([]);

  const value: CartContext = { items, ...totals, addProduct, setQuantity, remove, clear };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
