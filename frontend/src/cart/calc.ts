import type { CartItem, Produto, TipoPesoCodigo } from "./types";

/** Converte peso informado para kg (0=grama, 1=quilo) */
export function toKg(peso: number, tipoPeso: TipoPesoCodigo) {
  return tipoPeso === 0 ? peso / 1000 : peso;
}

function normalizeFallback(fallback: number): number {
  if (!Number.isFinite(fallback)) return 1;
  const floored = Math.floor(fallback);
  return floored > 0 ? floored : 1;
}

function normalizeProductMin(min?: number | null): number {
  if (!Number.isFinite(min)) return 0;
  const floored = Math.floor(min as number);
  return floored > 0 ? floored : 0;
}

/** Mínimo efetivo para um produto (campo + fallback do backend, mínimo 1) */
export function minQtyFor(prod: Pick<Produto, "quantidadeMinimaDeCompra">, fallbackMinQty: number) {
  const normalizedFallback = normalizeFallback(fallbackMinQty);
  const productMin = normalizeProductMin(prod.quantidadeMinimaDeCompra);
  return Math.max(normalizedFallback, productMin);
}

/** Retorna o mínimo efetivo armazenado no item ou o padrão da aplicação */
export function resolveMinQty(minQty: number | undefined, fallbackMinQty: number) {
  const normalizedFallback = normalizeFallback(fallbackMinQty);
  const normalizedMin = normalizeProductMin(minQty);
  if (normalizedMin > 0) {
    return Math.max(normalizedFallback, normalizedMin);
  }
  return normalizedFallback;
}

/**
 * Normaliza uma quantidade para o múltiplo válido mais próximo que não fique abaixo do mínimo.
 * Sempre arredonda para cima para evitar pedidos abaixo da expectativa do usuário.
 */
export function normalizeQuantityToMultiple(quantity: number, min: number, fallback: number) {
  const minimo = Math.max(1, min);
  if (!Number.isFinite(quantity)) return fallback;
  const sanitized = Math.floor(quantity);
  if (sanitized <= 0) return minimo;
  const steps = Math.ceil(sanitized / minimo);
  return Math.max(minimo, steps * minimo);
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
export function isBelowMin(i: CartItem, fallbackMinQty: number) {
  const min = resolveMinQty(i.minQty, fallbackMinQty);
  return i.quantidade < min || i.quantidade % min !== 0;
}

/** Totais do carrinho + flag se existe item abaixo do mínimo */
export function cartTotals(items: CartItem[], fallbackMinQty: number) {
  const totalUnidades = items.reduce((s, i) => s + i.quantidade, 0);
  const totalValor = items.reduce((s, i) => s + itemSubtotal(i), 0);
  const totalPesoKg = items.reduce((s, i) => s + itemPesoKg(i), 0);
  const anyBelowMinimum = items.some((item) => isBelowMin(item, fallbackMinQty));
  return { totalUnidades, totalValor, totalPesoKg, anyBelowMinimum };
}
