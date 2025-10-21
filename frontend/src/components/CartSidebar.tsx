import { useEffect } from "react";
import { X } from "lucide-react";
import { useCart } from "../cart/CartContext";
import { isBelowMin, itemSubtotal, resolveMinQty } from "../cart/calc";
import { formatCurrencyBRL, formatPeso } from "../lib/format";
import { usePedidosConfig } from "../hooks/usePedidosConfig";

export type CartSidebarProps = {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
};

export default function CartSidebar({ open, onClose, onCheckout }: CartSidebarProps) {
  const {
    items,
    totalValor,
    totalPesoKg,
    setQuantity,
    remove,
    clear,
    anyBelowMinimum,
  } = useCart();
  const { limitKg: limiteMensalKg, loading: limiteLoading, error: limiteErro, minQtyPadrao } = usePedidosConfig();
  const passouLimite = limiteMensalKg > 0 && totalPesoKg > limiteMensalKg;
  const totalPesoFormatado = formatPeso(totalPesoKg, "kg", {
    unit: "kg",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  const limiteMensalFormatado =
    limiteMensalKg > 0 ? formatPeso(limiteMensalKg, "kg", { unit: "kg" }) : "Não configurado";

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const body = document?.body;
    if (!body) return;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleCheckout = () => {
    if (!items.length) return;
    onCheckout();
  };

  const handleClear = () => {
    if (!items.length) return;
    clear();
  };

  return (
    <div
      className={`fixed inset-0 z-[70] transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-sidebar-title"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <h2 id="cart-sidebar-title" className="text-lg font-semibold text-gray-900">
            Meu carrinho
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fechar carrinho"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-end px-6 pt-4">
          <button
            type="button"
            onClick={handleClear}
            className={`text-sm font-medium text-[#FF6900] transition-opacity hover:opacity-80 ${
              items.length ? "" : "pointer-events-none opacity-40"
            }`}
          >
            Limpar carrinho
          </button>
        </div>

        <div className="mt-4 h-px bg-gray-200" />

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-500">
              <p>Seu carrinho está vazio.</p>
            </div>
          ) : (
            <div className="flex h-full flex-col gap-6">
              {items.map((item, index) => {
                const min = resolveMinQty(item.minQty, minQtyPadrao);
                const below = isBelowMin(item, minQtyPadrao);
                const sabor = item.sabores?.trim();
                const porte = item.porteNomes?.length ? item.porteNomes.join(", ") : "";
                const pesoProduto =
                  item.peso !== undefined && item.tipoPeso !== undefined
                    ? formatPeso(item.peso, item.tipoPeso === 0 ? "g" : "kg")
                    : formatPeso(item.pesoKg, "kg");
                const portePesoLabel = [porte, pesoProduto].filter(Boolean).join(" | ");

                return (
                  <div key={item.codigo} className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-[110px] w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {item.imagemUrl ? (
                          <img
                            src={item.imagemUrl}
                            alt={item.descricao}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            Sem imagem
                          </div>
                        )}
                      </div>

                      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                        <div className="flex min-w-0 flex-col text-sm text-gray-600">
                          <div className="min-w-0">
                            <div className="break-words text-[16px] font-bold leading-snug text-gray-900">
                              {item.descricao}
                            </div>
                            {sabor ? (
                              <div className="font-semibold leading-snug text-gray-700">{sabor}</div>
                            ) : null}
                            {portePesoLabel ? (
                              <div className="text-sm leading-snug text-gray-500">{portePesoLabel}</div>
                            ) : null}
                            {below ? (
                              <div className="text-xs text-red-600">Mínimo: {min} unidade(s).</div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex h-full max-w-[120px] shrink-0 flex-col items-end text-right">
                          <div className="break-words text-base font-semibold text-gray-900">
                            {formatCurrencyBRL(itemSubtotal(item))}
                          </div>
                        </div>

                        <div className="col-span-2 mt-1 flex w-full items-center gap-3 text-sm text-gray-500">
                          <label className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="sr-only">Quantidade</span>
                            <input
                              type="number"
                              min={min}
                              step={min}
                              value={item.quantidade}
                              onChange={event => setQuantity(item.codigo, Number(event.target.value))}
                              className={`w-[52px] rounded-lg border px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#FF6900]/40 ${
                                below ? "border-red-300 bg-red-50" : "border-gray-200"
                              }`}
                              title={`Informe múltiplos de ${min} unidade(s).`}
                            />
                          </label>
                          <span className="text-sm text-gray-500 tabular-nums whitespace-nowrap">
                            {formatCurrencyBRL(item.preco)} Un
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(item.codigo)}
                            className="ml-auto text-sm font-medium text-[#FF6900] transition-opacity hover:opacity-80"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                    {index < items.length - 1 && <div className="mx-2 h-px bg-gray-200" />}
                  </div>
                );
              })}

              {anyBelowMinimum && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  Existem itens abaixo da quantidade mínima exigida. Ajuste as quantidades (veja o aviso em cada item).
                </div>
              )}

              {limiteErro && !limiteLoading && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {limiteErro}
                </div>
              )}

            </div>
          )}
        </div>

        {passouLimite && (
          <div className="px-6 pb-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Atenção: seu carrinho tem {totalPesoFormatado}. O limite mensal é {limiteMensalFormatado} por colaborador.
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-auto border-t border-gray-200 px-6 py-5">
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] items-center gap-4">
              <div className="flex flex-col gap-1 pr-4 text-sm text-gray-500">
                <span>Peso total:</span>
                <span className="text-base font-semibold text-gray-900">{totalPesoFormatado}</span>
              </div>
              <div className="flex flex-col gap-1 border-l border-gray-200 px-4 text-sm text-gray-500">
                <span>Total</span>
                <span className="text-base font-semibold text-gray-900">{formatCurrencyBRL(totalValor)}</span>
              </div>
              <div className="row-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full rounded-full bg-[#FF6900] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#FF6900]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
