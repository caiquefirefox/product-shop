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

const DEFAULT_PAGE_SIZE = 10;

type AddToCartFeedback = {
  descricao: string;
  quantidade: number;
  subtotal: number;
};

type ProdutoOpcao = {
  id: string;
  nome: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type CatalogoResponse = {
  items: Produto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export default function Catalogo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const { addProduct } = useCart();
  const [feedback, setFeedback] = useState<AddToCartFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [codigoFiltro, setCodigoFiltro] = useState("");
  const [descricaoFiltro, setDescricaoFiltro] = useState("");
  const [tipoProdutoFiltro, setTipoProdutoFiltro] = useState("");
  const [especieFiltro, setEspecieFiltro] = useState("");
  const [faixaEtariaFiltro, setFaixaEtariaFiltro] = useState("");
  const [porteFiltro, setPorteFiltro] = useState("");
  const [tipoProdutoOptions, setTipoProdutoOptions] = useState<SelectOption[]>([]);
  const [especieOptions, setEspecieOptions] = useState<SelectOption[]>([]);
  const [faixaEtariaOptions, setFaixaEtariaOptions] = useState<SelectOption[]>([]);
  const [porteOptions, setPorteOptions] = useState<SelectOption[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const catalogoRequestIdRef = useRef(0);

  const hasFilters = Boolean(
    codigoFiltro.trim() ||
      descricaoFiltro.trim() ||
      tipoProdutoFiltro ||
      especieFiltro ||
      faixaEtariaFiltro ||
      porteFiltro,
  );

  const clearFilters = () => {
    setCodigoFiltro("");
    setDescricaoFiltro("");
    setTipoProdutoFiltro("");
    setEspecieFiltro("");
    setFaixaEtariaFiltro("");
    setPorteFiltro("");
    setPage(1);
  };

  useEffect(() => {
    let isSubscribed = true;

    const loadOptions = async () => {
      try {
        const [tiposResp, especiesResp, faixasResp, portesResp] = await Promise.all([
          api.get<ProdutoOpcao[]>("/produtos/tipos-produto"),
          api.get<ProdutoOpcao[]>("/produtos/especies"),
          api.get<ProdutoOpcao[]>("/produtos/faixas-etarias"),
          api.get<ProdutoOpcao[]>("/produtos/portes"),
        ]);

        if (!isSubscribed) return;

        const mapToOption = (opcao: ProdutoOpcao): SelectOption => ({
          value: opcao.id,
          label: opcao.nome,
        });

        setTipoProdutoOptions(tiposResp.data.map(mapToOption));
        setEspecieOptions(especiesResp.data.map(mapToOption));
        setFaixaEtariaOptions(faixasResp.data.map(mapToOption));
        setPorteOptions(portesResp.data.map(mapToOption));
      } catch (error) {
        if (!isSubscribed) return;
        console.error("Não foi possível carregar as opções de filtro do catálogo", error);
      }
    };

    loadOptions();

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    const codigo = codigoFiltro.trim();
    const descricao = descricaoFiltro.trim();

    if (codigo) params.codigo = codigo;
    if (descricao) params.descricao = descricao;
    if (tipoProdutoFiltro) params.tipoProdutoOpcaoId = tipoProdutoFiltro;
    if (especieFiltro) params.especieOpcaoId = especieFiltro;
    if (faixaEtariaFiltro) params.faixaEtariaOpcaoId = faixaEtariaFiltro;
    if (porteFiltro) params.porteOpcaoId = porteFiltro;
    params.page = Math.max(page, 1).toString();

    const requestId = ++catalogoRequestIdRef.current;
    let isSubscribed = true;

    api
      .get<CatalogoResponse>("/catalogo", { params })
      .then(response => {
        if (!isSubscribed || catalogoRequestIdRef.current !== requestId) return;
        const {
          items,
          page: currentPage,
          pageSize: currentPageSize,
          totalItems: currentTotal,
          totalPages: currentTotalPages,
        } = response.data;

        const safePageSize = currentPageSize > 0 ? currentPageSize : DEFAULT_PAGE_SIZE;
        const safePage = currentPage > 0 ? currentPage : 1;

        setProdutos(items);
        setPageSize(safePageSize);
        setTotalItems(Math.max(0, currentTotal));
        setTotalPages(Math.max(0, currentTotalPages));

        if (safePage !== page) {
          setPage(safePage);
        }
      })
      .catch(error => {
        if (!isSubscribed || catalogoRequestIdRef.current !== requestId) return;
        console.error("Não foi possível carregar os produtos do catálogo", error);
      });

    return () => {
      isSubscribed = false;
    };
  }, [
    codigoFiltro,
    descricaoFiltro,
    tipoProdutoFiltro,
    especieFiltro,
    faixaEtariaFiltro,
    porteFiltro,
    page,
  ]);

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
      removeTimeout.current = window.setTimeout(() => setFeedback(null), 5000);
    }, 5000);
  };

  const hasProdutos = produtos.length > 0;
  const safePageSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  const safeTotalItems = hasProdutos ? Math.max(totalItems, produtos.length) : totalItems;
  const normalizedTotalPages = safeTotalItems > 0
    ? (totalPages > 0 ? totalPages : Math.max(Math.ceil(safeTotalItems / safePageSize), 1))
    : 0;
  const safePage = normalizedTotalPages > 0
    ? Math.min(Math.max(page, 1), normalizedTotalPages)
    : 1;
  const showingStart = hasProdutos ? (safePage - 1) * safePageSize + 1 : 0;
  const showingEnd = hasProdutos ? Math.min(showingStart + produtos.length - 1, safeTotalItems) : 0;
  const canGoPrev = hasProdutos && safePage > 1;
  const canGoNext = hasProdutos && normalizedTotalPages > 0 && safePage < normalizedTotalPages;
  const displayTotalPages = normalizedTotalPages > 0 ? normalizedTotalPages : 1;

  return (
    <div className="space-y-4">
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center sm:top-8">
        {feedback && (
          <div
            className={`flex max-w-sm items-start gap-3 rounded-2xl bg-white/90 px-4 py-3 text-left shadow-2xl ring-1 ring-indigo-100 backdrop-blur transition-all duration-300 ${showFeedback ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
            aria-live="polite"
            role="status"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/90 text-white shadow-inner">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">
                <span className="font-semibold">{feedback.quantidade}x</span> {feedback.descricao}
              </p>
              <p className="text-xs text-slate-600">
                Subtotal adicionado de {formatCurrencyBRL(feedback.subtotal)} ao carrinho
              </p>
            </div>
          </div>
        )}
      </div>

      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white px-8 py-12 text-center shadow-sm">
        <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Catálogo de produtos</h1>
        <p className="mt-3 max-w-2xl mx-auto text-sm text-slate-600 sm:text-base">
          Visualize todos os detalhes de cada item antes de adicionar ao carrinho: indicações, sabores, peso e faixa etária em um só lugar.
        </p>
      </section>

      <section className="rounded-3xl border border-indigo-100 bg-white/80 px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-left">
              <h2 className="text-lg font-semibold text-slate-900">Filtrar produtos</h2>
              <p className="text-sm text-slate-500">Refine o catálogo utilizando os campos abaixo.</p>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="catalogo-filtro-codigo"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Código
              </label>
              <input
                id="catalogo-filtro-codigo"
                type="text"
                value={codigoFiltro}
                onChange={event => {
                  setCodigoFiltro(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por código"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="catalogo-filtro-descricao"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Descrição
              </label>
              <input
                id="catalogo-filtro-descricao"
                type="text"
                value={descricaoFiltro}
                onChange={event => {
                  setDescricaoFiltro(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por descrição"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="catalogo-filtro-tipo-produto"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Tipo do produto
              </label>
              <select
                id="catalogo-filtro-tipo-produto"
                value={tipoProdutoFiltro}
                onChange={event => {
                  setTipoProdutoFiltro(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Todos os tipos</option>
                {tipoProdutoOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="catalogo-filtro-especie"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Espécie
              </label>
              <select
                id="catalogo-filtro-especie"
                value={especieFiltro}
                onChange={event => {
                  setEspecieFiltro(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Todas as espécies</option>
                {especieOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="catalogo-filtro-faixa-etaria"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Faixa etária
              </label>
              <select
                id="catalogo-filtro-faixa-etaria"
                value={faixaEtariaFiltro}
                onChange={event => {
                  setFaixaEtariaFiltro(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Todas as faixas</option>
                {faixaEtariaOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label
                htmlFor="catalogo-filtro-porte"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Porte
              </label>
              <select
                id="catalogo-filtro-porte"
                value={porteFiltro}
                onChange={event => {
                  setPorteFiltro(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Todos os portes</option>
                {porteOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {hasProdutos ? (
        <div className="space-y-6">
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

          <nav
            className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white/80 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            aria-label="Paginação do catálogo"
          >
            <p className="text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-semibold text-slate-900">
                {showingStart}-{showingEnd}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-900">{safeTotalItems}</span>{" "}
              produtos
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(safePage - 1, 1))}
                disabled={!canGoPrev}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                Anterior
              </button>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Página {safePage} de {displayTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(safePage + 1, displayTotalPages))}
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                Próxima
              </button>
            </div>
          </nav>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center text-slate-500 shadow-sm">
          Nenhum produto encontrado com os filtros selecionados.
        </div>
      )}
    </div>
  );
}
