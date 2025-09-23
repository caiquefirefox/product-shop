import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Produto } from "./types";
import { useMsal } from "@azure/msal-react";
import { cartTotals, minQtyFor, toKg } from "./calc";

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
  const storeKey = useMemo(
    () => `premier:cart:${account?.homeAccountId ?? "anon"}`,
    [account?.homeAccountId]
  );

  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(storeKey) || "[]"); }
    catch { return []; }
  });

  useEffect(() => { localStorage.setItem(storeKey, JSON.stringify(items)); }, [items, storeKey]);

  const totals = useMemo(() => cartTotals(items), [items]);

  const addProduct: CartActions["addProduct"] = (p, q) => {
    const min = minQtyFor(p);
    const qty = Math.max(min, q ?? min);
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
        copy[idx] = { ...copy[idx], quantidade: copy[idx].quantidade + qty, minQty: copy[idx].minQty ?? min };
        return copy;
      }
    });
  };

  const setQuantity: CartActions["setQuantity"] = (codigo, quantidade) => {
    const q = Math.max(1, quantidade);
    setItems(prev => prev.map(i => i.codigo === codigo ? { ...i, quantidade: q } : i));
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
