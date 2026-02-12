import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, FilePenLine, Plus, Trash2 } from "lucide-react";
import Select, { MultiValue, StylesConfig } from "react-select";
import api from "../lib/api";
import ProductFilters, {
  type ProductFilterChangeHandler,
  type ProductFilterOptions,
  type ProductFilterSelectOption,
  type ProductFilterValues,
} from "../components/ProductFilters";

type Produto = {
  codigo: string;
  descricao: string;
  peso: number;
  tipoPeso: number;
  sabores: string;
  especieOpcaoId: string;
  especieNome: string;
  porteOpcaoIds: string[];
  porteNomes: string[];
  tipoProdutoOpcaoId: string;
  tipoProdutoNome: string;
  faixaEtariaOpcaoId: string;
  faixaEtariaNome: string;
  preco: number;
  quantidadeMinimaDeCompra: number;
  imagemUrl?: string | null;
  linkExterno?: string | null;
};

type ProdutoOpcao = {
  id: string;
  nome: string;
};

type ProdutosPagedResponse = {
  items?: Produto[] | null;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
};

type ProdutosListResponse = Produto[] | ProdutosPagedResponse;

type PorteSelectOption = {
  value: string;
  label: string;
};

const porteSelectStyles: StylesConfig<PorteSelectOption, true> = {
  menuPortal: base => ({
    ...base,
    zIndex: 9999,
  }),
  control: (base, state) => ({
    ...base,
    borderRadius: 12,
    borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(99, 102, 241, 0.12)" : "none",
    padding: "4px",
    minHeight: "44px",
    transition: "all 0.2s ease",
    backgroundColor: "#f9fafb",
    ":hover": {
      borderColor: "#6366f1",
    },
  }),
  valueContainer: base => ({
    ...base,
    gap: 4,
  }),
  multiValue: base => ({
    ...base,
    borderRadius: 9999,
    backgroundColor: "#eef2ff",
  }),
  multiValueLabel: base => ({
    ...base,
    color: "#4338ca",
    fontWeight: 500,
  }),
  multiValueRemove: base => ({
    ...base,
    color: "#4338ca",
    ":hover": {
      backgroundColor: "#c7d2fe",
      color: "#312e81",
    },
  }),
  menu: base => ({
    ...base,
    borderRadius: 16,
    overflow: "hidden",
    padding: 4,
    boxShadow:
      "0px 18px 36px rgba(15, 23, 42, 0.12), 0px 6px 12px rgba(15, 23, 42, 0.08)",
  }),
  menuList: base => ({
    ...base,
    borderRadius: 12,
    padding: 0,
    maxHeight: "unset",
    overflowY: "visible",
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: 10,
    margin: 4,
    backgroundColor: state.isSelected
      ? "#c7d2fe"
      : state.isFocused
        ? "#eef2ff"
        : "transparent",
    color: "#1f2937",
    fontWeight: state.isSelected ? 600 : 500,
    cursor: "pointer",
  }),
  placeholder: base => ({
    ...base,
    color: "#9ca3af",
  }),
  dropdownIndicator: base => ({
    ...base,
    color: "#6366f1",
    ":hover": {
      color: "#4f46e5",
    },
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
};

const classNames = (...classes: string[]) => classes.join(" ");

const baseInputClasses = classNames(
  "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700",
  "shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100",
);

const saveButtonClasses = classNames(
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6900] px-5 py-3 text-sm font-semibold text-white",
  "shadow-sm transition-colors duration-200 hover:bg-[#FF6900]/90",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40",
);

const addProductButtonClasses = classNames(
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6900] px-5 py-3 text-sm font-semibold text-white",
  "shadow-sm transition-colors duration-200 hover:bg-[#FF6900]/90",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40",
);

const uploadButtonClasses = classNames(
  "inline-flex items-center justify-center rounded-full bg-[#FF6900] px-5 py-3 text-sm font-semibold text-white",
  "shadow-sm transition-colors duration-200 hover:bg-[#FF6900]/90",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40",
);

const removeImageButtonClasses = classNames(
  "inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600",
  "bg-white transition hover:bg-gray-100",
  "focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-offset-1 focus:ring-offset-white",
);

const cancelButtonClasses = classNames(
  "inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-600",
  "bg-white transition hover:bg-gray-100",
  "focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-offset-1 focus:ring-offset-white",
);

const formDropdownButtonBaseClasses = classNames(
  "inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700",
  "shadow-sm transition hover:border-indigo-200 hover:text-indigo-600",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

const formDropdownButtonActiveClasses = "border-indigo-300 bg-indigo-50 text-indigo-600";

const formDropdownListClasses = classNames(
  "absolute left-0 top-full z-20 mt-2 w-full min-w-[200px] origin-top-left rounded-xl border border-slate-200 bg-white p-2",
  "shadow-xl",
);

const formDropdownOptionClasses = classNames(
  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700",
  "transition hover:bg-indigo-50 hover:text-indigo-600",
);

type FormDropdownOption = {
  value: string;
  label: string;
};

const tipoPesoDropdownOptions: FormDropdownOption[] = [
  { value: "0", label: "Grama" },
  { value: "1", label: "Quilo" },
];

type FormDropdownProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: FormDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  showPlaceholderOption?: boolean;
};

function FormDropdown({
  id,
  value,
  onChange,
  options,
  placeholder = "Selecione uma opção",
  disabled = false,
  loading = false,
  emptyMessage = "Nenhuma opção disponível",
  showPlaceholderOption = true,
}: FormDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const sanitizedOptions = useMemo(
    () =>
      options.map(option => {
        const value = option.value ?? "";
        const rawLabel = option.label?.trim() ?? "";
        return {
          value,
          label: rawLabel || value,
        };
      }),
    [options],
  );

  const optionsWithPlaceholder = useMemo(() => {
    if (!showPlaceholderOption) {
      return sanitizedOptions;
    }

    const hasPlaceholder = sanitizedOptions.some(option => option.value === "");
    if (hasPlaceholder) {
      return sanitizedOptions.map(option =>
        option.value === ""
          ? {
              ...option,
              label: option.label || placeholder,
            }
          : option,
      );
    }

    return [
      {
        value: "",
        label: placeholder,
      },
      ...sanitizedOptions,
    ];
  }, [placeholder, sanitizedOptions, showPlaceholderOption]);

  const selectedOption = useMemo(
    () => optionsWithPlaceholder.find(option => option.value === value) ?? null,
    [optionsWithPlaceholder, value],
  );

  const displayLabel = loading ? "Carregando..." : selectedOption?.label ?? placeholder;
  const hasSelection = !!selectedOption && selectedOption.value !== "";
  const isDisabled = disabled || loading;

  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isOpen]);

  useEffect(() => {
    if (isDisabled) {
      setIsOpen(false);
    }
  }, [isDisabled]);

  const handleToggle = () => {
    if (isDisabled) {
      return;
    }
    setIsOpen(previous => !previous);
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    closeMenu();
  };

  return (
    <div className="relative">
      <button
        type="button"
        id={id}
        ref={buttonRef}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
        disabled={isDisabled}
        className={classNames(
          formDropdownButtonBaseClasses,
          hasSelection ? formDropdownButtonActiveClasses : "",
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          id={`${id}-options`}
          className={formDropdownListClasses}
          role="listbox"
          aria-activedescendant={selectedOption?.value ?? ""}
        >
          <div className="max-h-64 overflow-y-auto">
            {optionsWithPlaceholder.length ? (
              optionsWithPlaceholder.map((option, index) => {
                const optionKey = option.value || `placeholder-${index}`;
                const isSelected = option.value === value;
                return (
                  <button
                    key={optionKey}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={classNames(
                      formDropdownOptionClasses,
                      isSelected ? "bg-indigo-50 text-indigo-600" : "",
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const productCardClasses = classNames(
  "flex flex-col gap-5 rounded-3xl border border-[#EDECE5] bg-white px-5 py-6 shadow-sm",
  "transition hover:shadow-md",
);

const productImageWrapperBaseClasses = classNames(
  "flex aspect-square w-full max-w-[132px] flex-none items-center justify-center overflow-hidden rounded-xl bg-white",
  "md:w-[132px] md:self-stretch",
);

const productImagePlaceholderClasses = "border border-slate-200";

const productTypeBadgeClasses = classNames(
  "inline-flex h-[23px] items-center rounded-full bg-indigo-600/10 px-2.5 py-0 text-[10px] font-bold uppercase tracking-wide",
  "leading-[23px] text-indigo-700",
);

const editButtonClasses = classNames(
  "inline-flex items-center gap-1.5 rounded-full border border-[#EDECE5] px-3 py-1.5 text-sm font-semibold text-[#FF6900]",
  "bg-white transition hover:bg-[#FFF2E8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/20",
);

const deleteButtonClasses = classNames(
  "inline-flex items-center gap-1.5 rounded-full border border-[#EDECE5] px-3 py-1.5 text-sm font-semibold text-[#DC2626]",
  "bg-white transition hover:bg-[#FDECEC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/20",
);

const minimumBadgeClasses = classNames(
  "inline-flex items-center justify-center rounded-full bg-[#EDECE5] px-3 py-1 text-sm font-semibold text-[#585858]",
);

const emptyStateClasses = classNames(
  "rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center",
  "text-sm text-gray-500",
);

const DEFAULT_PAGE_SIZE = 10;

export default function Produtos() {
  const [especies, setEspecies] = useState<ProdutoOpcao[]>([]);
  const [porteOpcoes, setPorteOpcoes] = useState<ProdutoOpcao[]>([]);
  const [tiposProduto, setTiposProduto] = useState<ProdutoOpcao[]>([]);
  const [faixasEtarias, setFaixasEtarias] = useState<ProdutoOpcao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaFiltro, setBuscaFiltro] = useState("");
  const [tipoProdutoFiltro, setTipoProdutoFiltro] = useState("");
  const [especieFiltro, setEspecieFiltro] = useState("");
  const [faixaEtariaFiltro, setFaixaEtariaFiltro] = useState("");
  const [porteFiltro, setPorteFiltro] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [produtosCarregando, setProdutosCarregando] = useState(false);
  const [reloadProdutosToken, setReloadProdutosToken] = useState(0);
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [peso, setPeso] = useState("1");
  const [tipoPeso, setTipoPeso] = useState(1);
  const [sabores, setSabores] = useState("");
  const [especieId, setEspecieId] = useState("");
  const [porteIds, setPorteIds] = useState<string[]>([]);
  const [tipoProdutoId, setTipoProdutoId] = useState("");
  const [faixaEtariaId, setFaixaEtariaId] = useState("");
  const [preco, setPreco] = useState("0");
  const [quantidadeMinimaDeCompra, setQuantidadeMinimaDeCompra] = useState("1");
  const [linkExterno, setLinkExterno] = useState("");
  const [opcoesCarregando, setOpcoesCarregando] = useState(true);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [imagemOriginalUrl, setImagemOriginalUrl] = useState<string | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemSelecionada, setImagemSelecionada] = useState<File | null>(null);
  const [removerImagem, setRemoverImagem] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const produtosRequestIdRef = useRef(0);
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToFormRef = useRef(false);

  const editando = produtoEmEdicao !== null;

  const pesoFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      }),
    [],
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    [],
  );

  const especieSelectOptions = useMemo(
    () => especies.map(opcao => ({ value: opcao.id, label: opcao.nome })),
    [especies],
  );

  const tipoProdutoSelectOptions = useMemo(
    () => tiposProduto.map(opcao => ({ value: opcao.id, label: opcao.nome })),
    [tiposProduto],
  );

  const faixaEtariaSelectOptions = useMemo(
    () => faixasEtarias.map(opcao => ({ value: opcao.id, label: opcao.nome })),
    [faixasEtarias],
  );

  const parseDecimalInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    if (trimmed.includes(",")) {
      const normalized = trimmed.replace(/\./g, "").replace(/,/g, ".");
      const parsed = Number.parseFloat(normalized);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    const parsed = Number.parseFloat(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const parseIntegerInput = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return 0;
    return parsed;
  };

  const formatDecimalForSubmission = (
    value: number,
    minimumFractionDigits: number,
    maximumFractionDigits: number,
  ) =>
    value.toLocaleString("pt-BR", {
      useGrouping: false,
      minimumFractionDigits,
      maximumFractionDigits,
    });

  const sanitizeDecimalInput = (value: string) => {
    const cleaned = value.replace(/[^0-9.,]/g, "");
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const separatorIndex = Math.max(lastComma, lastDot);
    if (separatorIndex === -1) return cleaned;
    const separator = cleaned.charAt(separatorIndex);
    const before = cleaned.slice(0, separatorIndex).replace(/[.,]/g, "");
    const after = cleaned.slice(separatorIndex + 1).replace(/[.,]/g, "");
    return `${before}${separator}${after}`;
  };

  const atualizarPreview = (value: string | null) => {
    setImagemPreview(prev => {
      if (prev && prev !== value && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return value;
    });
  };

  useEffect(() => {
    return () => {
      if (imagemPreview && imagemPreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagemPreview);
      }
    };
  }, [imagemPreview]);

  const scrollFormIntoView = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    formContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetImagemCampos = () => {
    setImagemSelecionada(null);
    setImagemOriginalUrl(null);
    setRemoverImagem(false);
    atualizarPreview(null);
  };

  const hasFiltros = useMemo(
    () =>
      Boolean(
        buscaFiltro.trim() ||
          tipoProdutoFiltro ||
          especieFiltro ||
          faixaEtariaFiltro ||
          porteFiltro,
      ),
    [buscaFiltro, tipoProdutoFiltro, especieFiltro, faixaEtariaFiltro, porteFiltro],
  );

  const tipoProdutoFiltroOptions = useMemo<ProductFilterSelectOption[]>(
    () =>
      tiposProduto.map(opcao => ({
        value: opcao.id,
        label: opcao.nome,
      })),
    [tiposProduto],
  );

  const especieFiltroOptions = useMemo<ProductFilterSelectOption[]>(
    () =>
      especies.map(opcao => ({
        value: opcao.id,
        label: opcao.nome,
      })),
    [especies],
  );

  const faixaEtariaFiltroOptions = useMemo<ProductFilterSelectOption[]>(
    () =>
      faixasEtarias.map(opcao => ({
        value: opcao.id,
        label: opcao.nome,
      })),
    [faixasEtarias],
  );

  const porteFiltroOptions = useMemo<ProductFilterSelectOption[]>(
    () =>
      porteOpcoes.map(opcao => ({
        value: opcao.id,
        label: opcao.nome,
      })),
    [porteOpcoes],
  );

  const filtroValores: ProductFilterValues = {
    query: buscaFiltro,
    tipoProduto: tipoProdutoFiltro,
    especie: especieFiltro,
    faixaEtaria: faixaEtariaFiltro,
    porte: porteFiltro,
  };

  const filtroOpcoes: ProductFilterOptions = {
    tiposProduto: tipoProdutoFiltroOptions,
    especies: especieFiltroOptions,
    faixasEtarias: faixaEtariaFiltroOptions,
    portes: porteFiltroOptions,
  };

  const handleFiltroChange: ProductFilterChangeHandler = (field, value) => {
    switch (field) {
      case "query":
        setBuscaFiltro(value);
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

  const clearFiltros = () => {
    setBuscaFiltro("");
    setTipoProdutoFiltro("");
    setEspecieFiltro("");
    setFaixaEtariaFiltro("");
    setPorteFiltro("");
    setPage(1);
  };
  const resetFormCampos = () => {
    setProdutoEmEdicao(null);
    setCodigo("");
    setDescricao("");
    setPeso("1");
    setTipoPeso(1);
    setSabores("");
    setEspecieId("");
    setPorteIds([]);
    setTipoProdutoId("");
    setFaixaEtariaId("");
    setPreco("0");
    setQuantidadeMinimaDeCompra("1");
    setLinkExterno("");
    setFormError(null);
    resetImagemCampos();
  };

  useEffect(() => {
    if (!formAberto || !shouldScrollToFormRef.current) {
      return;
    }

    shouldScrollToFormRef.current = false;

    if (typeof window === "undefined") {
      scrollFormIntoView();
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      scrollFormIntoView();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [formAberto]);

  const ensureFormVisible = () => {
    if (formAberto) {
      shouldScrollToFormRef.current = false;
      scrollFormIntoView();
      return;
    }

    shouldScrollToFormRef.current = true;
    setFormAberto(true);
  };

  const fecharFormulario = () => {
    resetFormCampos();
    setFormAberto(false);
  };

  const iniciarNovoProduto = () => {
    resetFormCampos();
    ensureFormVisible();
  };

  const iniciarEdicao = (produto: Produto) => {
    setFormError(null);
    setProdutoEmEdicao(produto);
    setCodigo(produto.codigo);
    setDescricao(produto.descricao);
    setPeso(pesoFormatter.format(produto.peso));
    setTipoPeso(produto.tipoPeso);
    setSabores(produto.sabores);
    setEspecieId(produto.especieOpcaoId);
    setPorteIds(produto.porteOpcaoIds);
    setTipoProdutoId(produto.tipoProdutoOpcaoId);
    setFaixaEtariaId(produto.faixaEtariaOpcaoId);
    setPreco(produto.preco.toFixed(2).replace(".", ","));
    setQuantidadeMinimaDeCompra(produto.quantidadeMinimaDeCompra.toString());
    setLinkExterno(produto.linkExterno ?? "");
    setImagemOriginalUrl(produto.imagemUrl ?? null);
    setImagemSelecionada(null);
    setRemoverImagem(false);
    atualizarPreview(produto.imagemUrl ?? null);
    ensureFormVisible();
  };

  const cancelarFormulario = () => {
    fecharFormulario();
  };
  const loadOpcoes = async () => {
    try {
      setOpcoesCarregando(true);
      const [especiesResp, portesResp, tiposResp, faixasResp] = await Promise.all([
        api.get<ProdutoOpcao[]>("/produtos/especies"),
        api.get<ProdutoOpcao[]>("/produtos/portes"),
        api.get<ProdutoOpcao[]>("/produtos/tipos-produto"),
        api.get<ProdutoOpcao[]>("/produtos/faixas-etarias"),
      ]);
      setEspecies(especiesResp.data);
      setPorteOpcoes(portesResp.data);
      setTiposProduto(tiposResp.data);
      setFaixasEtarias(faixasResp.data);
    } finally {
      setOpcoesCarregando(false);
    }
  };
  useEffect(() => {
    loadOpcoes();
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const params: Record<string, string> = {};
    const busca = buscaFiltro.trim();

    if (busca) params.q = busca;
    if (tipoProdutoFiltro) params.tipoProdutoOpcaoId = tipoProdutoFiltro;
    if (especieFiltro) params.especieOpcaoId = especieFiltro;
    if (faixaEtariaFiltro) params.faixaEtariaOpcaoId = faixaEtariaFiltro;
    if (porteFiltro) params.porteOpcaoId = porteFiltro;

    const targetPage = Math.max(page, 1);
    params.page = targetPage.toString();

    const requestId = ++produtosRequestIdRef.current;
    setProdutosCarregando(true);

    api
      .get<ProdutosListResponse>("/produtos", { params })
      .then(response => {
        if (!isSubscribed || produtosRequestIdRef.current !== requestId) return;

        const data = response.data;

        if (Array.isArray(data)) {
          setProdutos(data);
          const total = data.length;
          setPageSize(total > 0 ? total : DEFAULT_PAGE_SIZE);
          setTotalItems(total);
          setTotalPages(total > 0 ? 1 : 0);
          if (targetPage !== 1) {
            setPage(1);
          }
          return;
        }

        const items = Array.isArray(data?.items) ? data.items : [];
        const reportedPage = data?.page ?? targetPage;
        const reportedPageSize = data?.pageSize ?? DEFAULT_PAGE_SIZE;
        const reportedTotalItems = data?.totalItems ?? items.length;
        const reportedTotalPages = data?.totalPages ?? 0;

        const safePageSize = reportedPageSize > 0 ? reportedPageSize : DEFAULT_PAGE_SIZE;
        const safeTotalItems = Math.max(0, reportedTotalItems);
        const normalizedTotalPages =
          safeTotalItems > 0
            ? reportedTotalPages > 0
              ? reportedTotalPages
              : Math.max(Math.ceil(safeTotalItems / safePageSize), 1)
            : 0;
        const safePageFromResponse =
          normalizedTotalPages > 0
            ? Math.min(Math.max(reportedPage > 0 ? reportedPage : targetPage, 1), normalizedTotalPages)
            : 1;

        setProdutos(items);
        setPageSize(safePageSize);
        setTotalItems(safeTotalItems);
        setTotalPages(normalizedTotalPages);

        if (safePageFromResponse !== targetPage) {
          setPage(safePageFromResponse);
        }
      })
      .catch(error => {
        if (!isSubscribed || produtosRequestIdRef.current !== requestId) return;
        console.error("Não foi possível carregar os produtos", error);
      })
      .finally(() => {
        if (!isSubscribed || produtosRequestIdRef.current !== requestId) return;
        setProdutosCarregando(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [
    buscaFiltro,
    tipoProdutoFiltro,
    especieFiltro,
    faixaEtariaFiltro,
    porteFiltro,
    page,
    reloadProdutosToken,
  ]);

  useEffect(() => {
    setEspecieId(prev => {
      if (!especies.length) return "";
      if (!prev) return "";
      return especies.some(opcao => opcao.id === prev) ? prev : "";
    });
  }, [especies]);

  useEffect(() => {
    setTipoProdutoId(prev => {
      if (!tiposProduto.length) return "";
      if (!prev) return "";
      return tiposProduto.some(opcao => opcao.id === prev) ? prev : "";
    });
  }, [tiposProduto]);

  useEffect(() => {
    setFaixaEtariaId(prev => {
      if (!faixasEtarias.length) return "";
      if (!prev) return "";
      return faixasEtarias.some(opcao => opcao.id === prev) ? prev : "";
    });
  }, [faixasEtarias]);

  useEffect(() => {
    setPorteIds(prev => {
      if (!porteOpcoes.length) return [] as string[];
      const valid = new Set(porteOpcoes.map(opcao => opcao.id));
      return prev.filter(id => valid.has(id));
    });
  }, [porteOpcoes]);

  const porteSelectOptions = useMemo<PorteSelectOption[]>(
    () => porteOpcoes.map(opcao => ({ value: opcao.id, label: opcao.nome })),
    [porteOpcoes],
  );

  const selectedPorteOptions = useMemo(
    () => porteSelectOptions.filter(option => porteIds.includes(option.value)),
    [porteSelectOptions, porteIds],
  );

  const handlePorteChange = (values: MultiValue<PorteSelectOption>) => {
    setPorteIds(values.map(option => option.value));
  };

  const handleImagemChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setImagemSelecionada(file);
    setRemoverImagem(false);
    atualizarPreview(objectUrl);
    event.target.value = "";
  };

  const removerImagemAtual = () => {
    if (imagemSelecionada) {
      setImagemSelecionada(null);
      setRemoverImagem(false);
      atualizarPreview(imagemOriginalUrl);
      return;
    }

    if (imagemOriginalUrl) {
      if (removerImagem) {
        setRemoverImagem(false);
        atualizarPreview(imagemOriginalUrl);
      } else {
        setRemoverImagem(true);
        atualizarPreview(null);
      }
      return;
    }

    atualizarPreview(null);
  };

  const salvar = async () => {
    const especieSelecionada = (especieId ?? "").trim();
    const tipoSelecionado = (tipoProdutoId ?? "").trim();
    const faixaSelecionada = (faixaEtariaId ?? "").trim();
    const codigoNormalizado = codigo.trim();
    const descricaoNormalizada = descricao.trim();
    const pesoNormalizadoTexto = peso.trim();
    const saboresNormalizados = sabores.trim();
    const precoNormalizadoTexto = preco.trim();
    const quantidadeMinimaTexto = quantidadeMinimaDeCompra.trim();
    const tipoPesoValido = tipoPesoDropdownOptions.some(
      option => Number.parseInt(option.value, 10) === tipoPeso,
    );
    const precoNormalizadoNumero = parseDecimalInput(preco);
    const pesoNormalizadoNumero = parseDecimalInput(peso);
    const quantidadeNormalizadaNumero = parseIntegerInput(quantidadeMinimaDeCompra);

    const camposObrigatoriosFaltando: string[] = [];

    if (!editando && !codigoNormalizado) {
      camposObrigatoriosFaltando.push("Código");
    }
    if (!descricaoNormalizada) {
      camposObrigatoriosFaltando.push("Descrição");
    }
    if (!pesoNormalizadoTexto || pesoNormalizadoNumero <= 0) {
      camposObrigatoriosFaltando.push("Peso");
    }
    if (!tipoPesoValido) {
      camposObrigatoriosFaltando.push("Tipo de peso");
    }
    if (!quantidadeMinimaTexto || quantidadeNormalizadaNumero <= 0) {
      camposObrigatoriosFaltando.push("Qtd mínima (unidades)");
    }
    if (!saboresNormalizados) {
      camposObrigatoriosFaltando.push("Sabores");
    }
    if (porteIds.length === 0) {
      camposObrigatoriosFaltando.push("Porte");
    }
    if (!precoNormalizadoTexto || precoNormalizadoNumero <= 0) {
      camposObrigatoriosFaltando.push("Preço (R$)");
    }
    if (!especieSelecionada) {
      camposObrigatoriosFaltando.push("Espécie");
    }
    if (!tipoSelecionado) {
      camposObrigatoriosFaltando.push("Tipo do Produto");
    }
    if (!faixaSelecionada) {
      camposObrigatoriosFaltando.push("Faixa etária");
    }

    if (camposObrigatoriosFaltando.length > 0) {
      setFormError(
        `Preencha os campos obrigatórios: ${camposObrigatoriosFaltando.join(", ")}.`,
      );
      return;
    }

    const codigoParaSalvar = editando ? produtoEmEdicao!.codigo : codigoNormalizado;

    if (!codigoParaSalvar) {
      setFormError("Preencha os campos obrigatórios marcados com *.");
      return;
    }

    setFormError(null);

    const quantidadeNormalizada = Math.max(1, quantidadeNormalizadaNumero);

    const formData = new FormData();
    formData.append("Descricao", descricaoNormalizada);
    formData.append("Peso", formatDecimalForSubmission(pesoNormalizadoNumero, 0, 3));
    formData.append("TipoPeso", tipoPeso.toString());
    formData.append("Sabores", saboresNormalizados);
    formData.append("EspecieOpcaoId", especieSelecionada);
    porteIds.forEach(id => formData.append("PorteOpcaoIds", id));
    formData.append("TipoProdutoOpcaoId", tipoSelecionado);
    formData.append("FaixaEtariaOpcaoId", faixaSelecionada);
    formData.append("Preco", formatDecimalForSubmission(precoNormalizadoNumero, 2, 2));
    formData.append("QuantidadeMinimaDeCompra", quantidadeNormalizada.toString());
    formData.append("LinkExterno", linkExterno.trim());
    formData.append("ImagemUrl", imagemOriginalUrl ?? "");
    formData.append("RemoverImagem", removerImagem ? "true" : "false");
    if (imagemSelecionada) {
      formData.append("Imagem", imagemSelecionada);
    }

    if (editando) {
      await api.put(`/produtos/${codigoParaSalvar}`, formData);
    } else {
      await api.post(`/produtos/${codigoParaSalvar}`, formData);
    }
    setReloadProdutosToken(token => token + 1);
    fecharFormulario();
  };

  const remover = async (c: string) => {
    await api.delete(`/produtos/${c}`);
    setReloadProdutosToken(token => token + 1);
    if (produtoEmEdicao?.codigo === c) {
      fecharFormulario();
    }
  };

  const hasProdutos = produtos.length > 0;
  const safePageSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  const safeTotalItems = hasProdutos ? Math.max(totalItems, produtos.length) : totalItems;
  const normalizedTotalPages =
    safeTotalItems > 0
      ? totalPages > 0
        ? totalPages
        : Math.max(Math.ceil(safeTotalItems / safePageSize), 1)
      : 0;
  const safePageValue =
    normalizedTotalPages > 0 ? Math.min(Math.max(page, 1), normalizedTotalPages) : 1;
  const showingStart = hasProdutos ? (safePageValue - 1) * safePageSize + 1 : 0;
  const showingEnd = hasProdutos ? Math.min(showingStart + produtos.length - 1, safeTotalItems) : 0;
  const canGoPrev = hasProdutos && safePageValue > 1 && !produtosCarregando;
  const canGoNext =
    hasProdutos && normalizedTotalPages > 0 && safePageValue < normalizedTotalPages && !produtosCarregando;
  const displayTotalPages = normalizedTotalPages > 0 ? normalizedTotalPages : 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <button onClick={iniciarNovoProduto} className={addProductButtonClasses}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar produto
        </button>
      </div>

      {formAberto && (
        <div ref={formContainerRef} className="rounded-xl border border-gray-100 bg-white p-6 shadow">
          <div className="mb-6 space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {editando ? "Editar produto" : "Novo produto"}
            </h2>
            <p className="text-sm text-gray-500">
              {editando
                ? `Atualize os dados do produto ${produtoEmEdicao?.codigo} e salve as alterações.`
                : "Preencha os campos abaixo para cadastrar um novo item em seu catálogo."}
            </p>
            <p className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Campos obrigatórios.
            </p>
          </div>

          {formError && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[368px_minmax(0,1fr)] xl:grid-cols-[368px_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-gray-700">Imagem do produto</span>
              <div className="w-full max-w-[368px]">
                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-4">
                  <div className="flex aspect-[368/368] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white/70 shadow-sm">
                    {imagemPreview ? (
                      <img
                        src={imagemPreview}
                        alt={descricao ? `Imagem do produto ${descricao}` : "Imagem do produto"}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
                        Nenhuma imagem selecionada
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className={uploadButtonClasses}>
                      Selecionar imagem
                      <input type="file" accept="image/*" className="sr-only" onChange={handleImagemChange} />
                    </label>
                    {(imagemPreview || imagemOriginalUrl) && (
                      <button type="button" onClick={removerImagemAtual} className={removeImageButtonClasses}>
                        {removerImagem ? "Desfazer remoção" : "Remover imagem"}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Utilize imagens nos formatos JPG, PNG ou WEBP com até 5&nbsp;MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="codigo" className="text-sm font-medium text-gray-700">
                  Código
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  id="codigo"
                  placeholder="Ex: R128"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value)}
                  className={baseInputClasses}
                  disabled={editando}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
                <label htmlFor="descricao" className="text-sm font-medium text-gray-700">
                  Descrição
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  id="descricao"
                  placeholder="Nome do produto"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  className={baseInputClasses}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="peso" className="text-sm font-medium text-gray-700">
                  Peso
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  id="peso"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={peso}
                  onChange={e => setPeso(sanitizeDecimalInput(e.target.value))}
                  className={baseInputClasses}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="tipoPeso" className="text-sm font-medium text-gray-700">
                  Tipo de peso
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <FormDropdown
                  id="tipoPeso"
                  value={String(tipoPeso)}
                  onChange={nextValue => {
                    const parsed = Number.parseInt(nextValue, 10);
                    setTipoPeso(Number.isNaN(parsed) ? tipoPeso : parsed);
                  }}
                  options={tipoPesoDropdownOptions}
                  placeholder="Selecione o tipo de peso"
                  showPlaceholderOption={false}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="qtdMin" className="text-sm font-medium text-gray-700">
                  Qtd mínima (unidades)
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  id="qtdMin"
                  type="text"
                  inputMode="numeric"
                  placeholder="1"
                  value={quantidadeMinimaDeCompra}
                  onChange={e => setQuantidadeMinimaDeCompra(e.target.value.replace(/[^0-9]/g, ""))}
                  className={baseInputClasses}
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
                <label htmlFor="linkExterno" className="text-sm font-medium text-gray-700">
                  Link externo (mais detalhes)
                </label>
                <input
                  id="linkExterno"
                  type="url"
                  inputMode="url"
                  placeholder="https://exemplo.com/produto"
                  value={linkExterno}
                  onChange={e => setLinkExterno(e.target.value)}
                  className={baseInputClasses}
                />
                <span className="text-xs text-gray-500">
                  Este link aparecerá no catálogo para abrir detalhes do produto em uma nova aba.
                </span>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
                <label htmlFor="sabores" className="text-sm font-medium text-gray-700">
                  Sabores
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  id="sabores"
                  placeholder="Informe os sabores separados por vírgula"
                  value={sabores}
                  onChange={e => setSabores(e.target.value)}
                  className={baseInputClasses}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="especie" className="text-sm font-medium text-gray-700">
                  Espécie
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <FormDropdown
                  id="especie"
                  value={especieId}
                  onChange={setEspecieId}
                  options={especieSelectOptions}
                  placeholder={
                    opcoesCarregando && !especieSelectOptions.length
                      ? "Carregando..."
                      : "Selecione a espécie"
                  }
                  disabled={!especieSelectOptions.length}
                  loading={opcoesCarregando && !especieSelectOptions.length}
                  emptyMessage={
                    opcoesCarregando ? "Carregando..." : "Nenhuma espécie disponível"
                  }
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
                <label htmlFor="tipoProduto" className="text-sm font-medium text-gray-700">
                  Tipo do Produto
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <FormDropdown
                  id="tipoProduto"
                  value={tipoProdutoId}
                  onChange={setTipoProdutoId}
                  options={tipoProdutoSelectOptions}
                  placeholder={
                    opcoesCarregando && !tipoProdutoSelectOptions.length
                      ? "Carregando..."
                      : "Selecione o tipo do produto"
                  }
                  disabled={!tipoProdutoSelectOptions.length}
                  loading={opcoesCarregando && !tipoProdutoSelectOptions.length}
                  emptyMessage={
                    opcoesCarregando ? "Carregando..." : "Nenhum tipo de produto disponível"
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="faixaEtaria" className="text-sm font-medium text-gray-700">
                  Faixa etária
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <FormDropdown
                  id="faixaEtaria"
                  value={faixaEtariaId}
                  onChange={setFaixaEtariaId}
                  options={faixaEtariaSelectOptions}
                  placeholder={
                    opcoesCarregando && !faixaEtariaSelectOptions.length
                      ? "Carregando..."
                      : "Selecione a faixa etária"
                  }
                  disabled={!faixaEtariaSelectOptions.length}
                  loading={opcoesCarregando && !faixaEtariaSelectOptions.length}
                  emptyMessage={
                    opcoesCarregando ? "Carregando..." : "Nenhuma faixa etária disponível"
                  }
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
                <label htmlFor="portes" className="text-sm font-medium text-gray-700">
                  Porte
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <Select
                  inputId="portes"
                  isMulti
                  isDisabled={opcoesCarregando || !porteSelectOptions.length}
                  isLoading={opcoesCarregando}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  value={selectedPorteOptions}
                  onChange={handlePorteChange}
                  options={porteSelectOptions}
                  placeholder={opcoesCarregando ? "Carregando..." : "Selecione os portes"}
                  closeMenuOnSelect={false}
                  noOptionsMessage={() => (opcoesCarregando ? "Carregando..." : "Nenhuma opção disponível")}
                  className="text-sm"
                  styles={porteSelectStyles}
                />
                <span className="text-xs text-gray-500">Escolha um ou mais portes que melhor representam o produto.</span>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="preco" className="text-sm font-medium text-gray-700">
                  Preço (R$)
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  id="preco"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={preco}
                  onChange={e => setPreco(sanitizeDecimalInput(e.target.value))}
                  className={baseInputClasses}
                />
              </div>

              <div className="flex justify-end gap-3 md:col-span-2 xl:col-span-3">
                <button onClick={cancelarFormulario} className={cancelButtonClasses}>
                  {editando ? "Cancelar edição" : "Cancelar"}
                </button>
                <button
                  onClick={salvar}
                  className={saveButtonClasses}
                  disabled={!editando && !codigo.trim()}
                >
                  {editando ? "Salvar alterações" : "Salvar produto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-5 rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-sm">
          <ProductFilters
            idPrefix="produtos-filtro"
            title=""
            description=""
            values={filtroValores}
            options={filtroOpcoes}
            hasFilters={hasFiltros}
            onChange={handleFiltroChange}
            onClear={clearFiltros}
          />
        </div>

        {produtosCarregando && !hasProdutos ? (
          <div className={emptyStateClasses}>Carregando produtos cadastrados...</div>
        ) : hasProdutos ? (
          <div className="space-y-6">
            <div className="grid gap-3">
              {produtos.map(p => {
                const minimo = Math.max(1, p.quantidadeMinimaDeCompra);
                const tipoPesoAbreviacao = p.tipoPeso === 0 ? "g" : "kg";
                const pesoComUnidade = `${pesoFormatter.format(p.peso)} ${tipoPesoAbreviacao}`;
                const portesList = p.porteNomes.map(nome => nome.trim()).filter(Boolean);
                const saboresList = p.sabores
                  .split(",")
                  .map(sabor => sabor.trim())
                  .filter(Boolean);
                const formattedPortes = portesList.join(", ");
                const formattedSabores = saboresList.join(", ");
                const imageWrapperClasses = p.imagemUrl
                  ? productImageWrapperBaseClasses
                  : classNames(productImageWrapperBaseClasses, productImagePlaceholderClasses);

                return (
                  <div key={p.codigo} className={productCardClasses}>
                    <div className="flex flex-col gap-5 md:grid md:grid-cols-[auto,1fr] md:items-start md:gap-6">
                      <div className={imageWrapperClasses}>
                        {p.imagemUrl ? (
                          <img
                            src={p.imagemUrl}
                            alt={`Imagem do produto ${p.descricao}`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="px-3 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                            Sem imagem
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2 text-base font-semibold text-[#878787]">
                            <span>{p.codigo}</span>
                            <span className={productTypeBadgeClasses}>{p.tipoProdutoNome}</span>
                          </div>
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-xl font-bold text-slate-900">
                              {p.descricao}
                              <span className="text-xl font-bold">{` | ${pesoComUnidade}`}</span>
                            </p>
                            <div className="hidden items-center gap-2 md:flex">
                              <button onClick={() => iniciarEdicao(p)} className={editButtonClasses}>
                                <FilePenLine className="h-4 w-4" aria-hidden="true" />
                                Editar
                              </button>
                              <button onClick={() => remover(p.codigo)} className={deleteButtonClasses}>
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                Excluir
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-[#878787]">
                            {formattedSabores || "Nenhum sabor informado"}
                          </p>
                        </div>

                        <div className="px-1">
                          <div className="h-px w-full rounded-full bg-[#EDECE5]" />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(5,minmax(0,1fr))] md:items-start md:gap-x-4 md:gap-y-2">
                          <div className="flex flex-col gap-1 md:gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#878787]">Espécie</span>
                            <span className="text-sm font-medium text-[#585858]">{p.especieNome}</span>
                          </div>
                          <div className="flex flex-col gap-1 md:gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#878787]">Idade</span>
                            <span className="text-sm font-medium text-[#585858]">{p.faixaEtariaNome}</span>
                          </div>
                          <div className="flex flex-col gap-1 md:gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#878787]">Portes atendidos</span>
                            <span className="text-sm font-medium text-[#585858]">
                              {formattedPortes || "Sem porte definido"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 md:h-full md:items-center md:justify-center md:gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#878787]">Mínimo de unidades</span>
                            <span className={minimumBadgeClasses}>Mínimo {minimo} un.</span>
                          </div>
                          <div className="flex flex-col gap-1 md:items-end md:gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#878787] md:text-right">
                              Preço
                            </span>
                            <span className="text-xl font-bold text-slate-900 md:text-right">
                              {currencyFormatter.format(p.preco)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 md:hidden">
                          <button onClick={() => iniciarEdicao(p)} className={editButtonClasses}>
                            <FilePenLine className="h-4 w-4" aria-hidden="true" />
                            Editar
                          </button>
                          <button onClick={() => remover(p.codigo)} className={deleteButtonClasses}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <nav
              className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white/80 px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between"
              aria-label="Paginação dos produtos cadastrados"
            >
              <p className="text-sm text-gray-600">
                Mostrando
                {" "}
                <span className="font-semibold text-gray-900">
                  {showingStart}-{showingEnd}
                </span>
                {" "}
                de
                {" "}
                <span className="font-semibold text-gray-900">{safeTotalItems}</span>
                {" "}
                produtos
                {produtosCarregando && (
                  <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">Atualizando...</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(safePageValue - 1, 1))}
                  disabled={!canGoPrev}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                >
                  Anterior
                </button>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Página {safePageValue} de {displayTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(safePageValue + 1, displayTotalPages))}
                  disabled={!canGoNext}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                >
                  Próxima
                </button>
              </div>
            </nav>
          </div>
        ) : (
          <div className={emptyStateClasses}>
            {hasFiltros
              ? "Nenhum produto encontrado com os filtros selecionados. Ajuste os filtros ou limpe a busca para visualizar outros itens."
              : "Nenhum produto cadastrado por aqui ainda. Clique em \"Adicionar produto\" para cadastrar o primeiro item."}
          </div>
        )}
      </div>
    </div>
  );
}