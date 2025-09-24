import { ENV } from "../config/env";
import type { CartItem, Produto, TipoPesoCodigo } from "./types";

/** Converte peso informado para kg (0=grama, 1=quilo) */
export function toKg(peso: number, tipoPeso: TipoPesoCodigo) {
  return tipoPeso === 0 ? peso / 1000 : peso;
}

/** Mínimo efetivo para um produto (campo + fallback do .env, mínimo 1) */
export function minQtyFor(prod: Pick<Produto, "quantidadeMinimaDeCompra">) {
  return Math.max(1, ENV.QTD_MINIMA_PADRAO, prod.quantidadeMinimaDeCompra || 0);
}

/** Subtotal R$ do item */
export function itemSubtotal(i: CartItem) {
  return i.preco * i.quantidade;
}

/** Peso total (kg) do item */
export function itemPesoKg(i: CartItem) {
  return i.pesoKg * i.quantidade;
}

/** Item está abaixo do mínimo? */
export function isBelowMin(i: CartItem) {
  const min = i.minQty && i.minQty > 0 ? i.minQty : Math.max(1, ENV.QTD_MINIMA_PADRAO);
  return i.quantidade < min;
}

/** Totais do carrinho + flag se existe item abaixo do mínimo */
export function cartTotals(items: CartItem[]) {
  const totalUnidades = items.reduce((s, i) => s + i.quantidade, 0);
  const totalValor = items.reduce((s, i) => s + itemSubtotal(i), 0);
  const totalPesoKg = items.reduce((s, i) => s + itemPesoKg(i), 0);
  const anyBelowMinimum = items.some(isBelowMin);
  return { totalUnidades, totalValor, totalPesoKg, anyBelowMinimum };
}
