import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CheckCircle2, ShoppingCart, X } from "lucide-react";
import api from "../lib/api";
import { useCart } from "../cart/CartContext";
import type { Produto } from "../cart/types";
import { minQtyFor } from "../cart/calc";
import { formatCurrencyBRL, formatPeso } from "../lib/format";
import { usePedidosConfig } from "../hooks/usePedidosConfig";
import ProductFilters, {
  type ProductFilterChangeHandler,
  type ProductFilterOptions,
  type ProductFilterSelectOption,
  type ProductFilterValues,
} from "../components/ProductFilters";

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
  const { minQtyPadrao } = usePedidosConfig();
  const [feedback, setFeedback] = useState<AddToCartFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [expandedImage, setExpandedImage] = useState<
    { url: string; alt: string } | null
  >(null);
  const [zoomState, setZoomState] = useState({
    active: false,
    x: 50,
    y: 50,
  });
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [codigoFiltro, setCodigoFiltro] = useState("");
  const [descricaoFiltro, setDescricaoFiltro] = useState("");
  const [tipoProdutoFiltro, setTipoProdutoFiltro] = useState("");
  const [especieFiltro, setEspecieFiltro] = useState("");
  const [faixaEtariaFiltro, setFaixaEtariaFiltro] = useState("");
  const [porteFiltro, setPorteFiltro] = useState("");
  const [tipoProdutoOptions, setTipoProdutoOptions] = useState<
    ProductFilterSelectOption[]
  >([]);
  const [especieOptions, setEspecieOptions] = useState<
    ProductFilterSelectOption[]
  >([]);
  const [faixaEtariaOptions, setFaixaEtariaOptions] = useState<
    ProductFilterSelectOption[]
  >([]);
  const [porteOptions, setPorteOptions] = useState<
    ProductFilterSelectOption[]
  >([]);
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

  const filterValues: ProductFilterValues = {
    codigo: codigoFiltro,
    descricao: descricaoFiltro,
    tipoProduto: tipoProdutoFiltro,
    especie: especieFiltro,
    faixaEtaria: faixaEtariaFiltro,
    porte: porteFiltro,
  };

  const filterOptions: ProductFilterOptions = {
    tiposProduto: tipoProdutoOptions,
    especies: especieOptions,
    faixasEtarias: faixaEtariaOptions,
    portes: porteOptions,
  };

  const handleFilterChange: ProductFilterChangeHandler = (field, value) => {
    switch (field) {
      case "codigo":
        setCodigoFiltro(value);
        break;
      case "descricao":
        setDescricaoFiltro(value);
        break;
      case "tipoProduto":
        setTipoProdutoFiltro(value);
        break;
      case "especie":
        setEspecieFiltro(value);
        break;
      case "faixaEtaria":
        setFaixaEtariaFiltro(value);
        break;
      case "porte":
        setPorteFiltro(value);
        break;
      default:
        break;
    }

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

        const mapToOption = (
          opcao: ProdutoOpcao,
        ): ProductFilterSelectOption => ({
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

  useEffect(() => {
    if (!expandedImage) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpandedImage(null);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [expandedImage]);

  const handleExpandImage = (url: string, alt: string) => {
    setExpandedImage({ url, alt });
    setZoomState({ active: false, x: 50, y: 50 });
  };

  const handleCloseExpandedImage = () => {
    setExpandedImage(null);
  };

  const handleZoomMove = (event: ReactMouseEvent<HTMLImageElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = ((event.clientX - bounds.left) / bounds.width) * 100;
    const offsetY = ((event.clientY - bounds.top) / bounds.height) * 100;

    setZoomState({
      active: true,
      x: Math.min(100, Math.max(0, offsetX)),
      y: Math.min(100, Math.max(0, offsetY)),
    });
  };

  const handleZoomEnd = () => {
    setZoomState(prev => ({ ...prev, active: false }));
  };

  const handleAdd = (produto: Produto) => {
    const quantidade = minQtyFor(produto, minQtyPadrao);
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
    <div className="space-y-8">
      {expandedImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada da imagem do produto"
          onClick={handleCloseExpandedImage}
        >
          <div
            className="relative flex max-h-full w-full max-w-4xl items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-lg ring-1 ring-white/20 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={handleCloseExpandedImage}
              aria-label="Fechar visualização da imagem"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="relative z-10 flex max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <img
                src={expandedImage.url}
                alt={expandedImage.alt}
                className="max-h-[70vh] w-full object-contain transition-transform duration-200 ease-out"
                onMouseMove={handleZoomMove}
                onMouseLeave={handleZoomEnd}
                style={{
                  transformOrigin: `${zoomState.x}% ${zoomState.y}%`,
                  transform: zoomState.active ? "scale(1.75)" : "scale(1)",
                  cursor: "zoom-in",
                  willChange: "transform",
                }}
              />
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-4 transition-opacity duration-200 ${zoomState.active ? "opacity-0" : "opacity-100"}`}
              >
                <span className="inline-flex items-center justify-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white shadow-sm backdrop-blur">
                  Passe o mouse para dar zoom
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <header className="rounded-3xl border border-slate-200 bg-white/90 px-6 py-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-1 w-12 rounded-full bg-indigo-500" />
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Produtos</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Explore o catálogo completo e encontre o produto ideal para o seu cliente.
            </p>
          </div>
        </div>
      </header>

      <ProductFilters
        idPrefix="catalogo-filtro"
        title="Filtrar produtos"
        description="Refine o catálogo utilizando os campos abaixo."
        values={filterValues}
        options={filterOptions}
        hasFilters={hasFilters}
        onChange={handleFilterChange}
        onClear={clearFilters}
        className="rounded-3xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm"
      />

      {hasProdutos ? (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {produtos.map((p, index) => {
              const minimo = minQtyFor(p, minQtyPadrao);
              const gradient = gradientClasses[index % gradientClasses.length];
              const precoFormatado = formatCurrencyBRL(p.preco);
              const portes = p.porteNomes.length ? p.porteNomes.join(", ") : "Todos os portes";
              const imageUrl = p.imagemUrl;

              return (
                <article
                  key={p.codigo}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex flex-1 flex-col gap-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          {p.tipoProdutoNome}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                          {p.especieNome}
                        </span>
                        {p.faixaEtariaNome && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                            {p.faixaEtariaNome}
                          </span>
                        )}
                        {minimo > 1 && (
                          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                            Mín. {minimo} un.
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">SKU #{p.codigo}</span>
                    </div>

                    <div
                      className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br ${gradient} p-6`}
                    >
                      {imageUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleExpandImage(
                              imageUrl,
                              `Imagem ilustrativa do produto ${p.descricao}`,
                            )
                          }
                          className="group/image relative flex h-40 w-full items-center justify-center outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                          aria-label={`Ampliar imagem do produto ${p.descricao}`}
                        >
                          <img
                            src={imageUrl}
                            alt={`Imagem ilustrativa do produto ${p.descricao}`}
                            className="h-full w-full max-w-[140px] object-contain"
                            loading="lazy"
                          />
                          <span className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-center rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur transition group-hover/image:opacity-100">
                            Clique para ampliar
                          </span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sem imagem</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                        {p.descricao}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {p.sabores || "Variedade não informada"}
                      </p>
                    </div>

                    <dl className="grid gap-3 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Peso</dt>
                        <dd className="font-medium text-slate-900">{formatPeso(p.peso, p.tipoPeso)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Categoria</dt>
                        <dd className="font-medium text-slate-900">{p.tipoProdutoNome}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Porte indicado</dt>
                        <dd className="font-medium text-slate-900">{portes}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Preço unitário</span>
                      <span className="text-xl font-semibold text-orange-500 sm:text-2xl">{precoFormatado}</span>
                    </div>

                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-colors duration-200 hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                      onClick={() => handleAdd(p)}
                    >
                      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                      Adicionar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <nav
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
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
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
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
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
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
