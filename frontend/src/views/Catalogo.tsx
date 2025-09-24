import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ShoppingCart } from "lucide-react";
import api from "../lib/api";
import { useCart } from "../cart/CartContext";
import type { Produto } from "../cart/types";
import { minQtyFor } from "../cart/calc";
import { formatCurrencyBRL, formatPeso } from "../lib/format";

const gradientClasses = [
  "from-indigo-200 via-indigo-100 to-white",
  "from-rose-200 via-rose-100 to-white",
  "from-emerald-200 via-emerald-100 to-white",
  "from-sky-200 via-sky-100 to-white",
  "from-amber-200 via-amber-100 to-white",
  "from-purple-200 via-purple-100 to-white",
];

type AddToCartFeedback = {
  descricao: string;
  quantidade: number;
  subtotal: number;
};

export default function Catalogo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const { addProduct } = useCart();
  const [feedback, setFeedback] = useState<AddToCartFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get("/catalogo").then(r => setProdutos(r.data));
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
      if (removeTimeout.current) window.clearTimeout(removeTimeout.current);
    };
  }, []);

  const handleAdd = (produto: Produto) => {
    const quantidade = minQtyFor(produto);
    addProduct(produto, quantidade);

    setFeedback({
      descricao: produto.descricao,
      quantidade,
      subtotal: produto.preco * quantidade,
    });
    setShowFeedback(true);

    if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
    if (removeTimeout.current) window.clearTimeout(removeTimeout.current);

    hideTimeout.current = window.setTimeout(() => {
      setShowFeedback(false);
      removeTimeout.current = window.setTimeout(() => setFeedback(null), 300);
    }, 2400);
  };

  return (
    <div className="space-y-12">
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center sm:top-8">
        {feedback && (
          <div
            className={`flex max-w-sm items-start gap-3 rounded-2xl bg-white/90 px-4 py-3 text-left shadow-2xl ring-1 ring-indigo-100 backdrop-blur transition-all duration-300 ${showFeedback ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
            aria-live="polite"
            role="status"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-inner">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">
                Adicionamos <span className="font-semibold">{feedback.quantidade}x</span> {feedback.descricao}
              </p>
              <p className="text-xs text-slate-600">
                Subtotal adicionado de {formatCurrencyBRL(feedback.subtotal)} ao carrinho
              </p>
            </div>
          </div>
        )}
      </div>

      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white px-8 py-12 text-center shadow-sm">
        <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Catálogo de produtos
        </span>
        <h1 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl">Descubra a linha completa da nossa loja</h1>
        <p className="mt-3 max-w-2xl mx-auto text-sm text-slate-600 sm:text-base">
          Visualize todos os detalhes de cada item antes de adicionar ao carrinho: indicações, sabores, peso e faixa etária em um só lugar.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {produtos.map((p, index) => {
          const minimo = minQtyFor(p);
          const gradient = gradientClasses[index % gradientClasses.length];
          const precoFormatado = formatCurrencyBRL(p.preco);
          const portes = p.porteNomes.length ? p.porteNomes.join(", ") : "Todos os portes";

          return (
            <article
              key={p.codigo}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} px-5 py-6`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                    {p.tipoProdutoNome}
                  </span>
                  {minimo > 1 && (
                    <span className="rounded-full bg-slate-900/10 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
                      Mínimo {minimo} un.
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{p.descricao}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-700">
                  <span className="font-medium uppercase tracking-wide text-slate-600">Sabor:</span>
                  <span>{p.sabores || "variedades"}</span>
                  <span className="inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700">
                    {p.especieNome}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-5">
                <span className="text-[11px] font-mono uppercase tracking-wide text-slate-400">SKU #{p.codigo}</span>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] text-slate-600">
                  <div className="space-y-0.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Peso</dt>
                    <dd className="text-sm text-slate-900">{formatPeso(p.peso, p.tipoPeso)}</dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Faixa etária</dt>
                    <dd className="text-sm text-slate-900">{p.faixaEtariaNome}</dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Sabores</dt>
                    <dd className="text-sm text-slate-900">{p.sabores || "Não informado"}</dd>
                  </div>
                  <div className="space-y-0.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Porte indicado</dt>
                    <dd className="text-sm text-slate-900">{portes}</dd>
                  </div>
                  <div className="col-span-2 space-y-0.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Categoria</dt>
                    <dd className="text-sm text-slate-900">{p.tipoProdutoNome}</dd>
                  </div>
                </dl>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Preço</span>
                    <p className="text-xl font-semibold text-slate-900">{precoFormatado}</p>
                  </div>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-colors duration-200 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    onClick={() => handleAdd(p)}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                    Adicionar
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
