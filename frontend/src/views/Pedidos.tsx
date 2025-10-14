import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";
import { formatCurrencyBRL, formatPeso, startOfDayISO_BR, endOfDayISO_BR, formatDateBR } from "../lib/format";
import { DateUserFilters, type SimpleOption } from "../components/DateUserFilters";
import { ProductFilters, type ProductFilterChangeHandler, type ProductFilterOptions, type ProductFilterSelectOption, type ProductFilterValues } from "../components/ProductFilters";
import type { Produto } from "../cart/types";
import { minQtyFor, normalizeQuantityToMultiple, toKg } from "../cart/calc";
import { ENV } from "../config/env";
const STATUS_SOLICITADO = 1;
const STATUS_APROVADO = 2;
const STATUS_CANCELADO = 3;
const EDIT_WINDOW_OPENING_DAY = ENV.PEDIDOS_EDIT_WINDOW_OPENING_DAY;
const EDIT_WINDOW_CLOSING_DAY = ENV.PEDIDOS_EDIT_WINDOW_CLOSING_DAY;

import type {
  PedidoDetalhe,
  PedidoDetalheCompleto,
  PedidoHistorico,
  PedidoHistoricoAlteracao,
  PedidoPaginadoResponse,
  PedidoResumoMensal,
} from "../types/pedidos";
import { useToast } from "../ui/toast";
import { useUser } from "../auth/useUser";

type EditorItem = {
  codigo: string;
  descricao: string;
  preco: number;
  quantidade: number;
  pesoKg: number;
  minQty?: number;
};

type CatalogoResponse = {
  items: Produto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

function formatDateTimePtBr(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Pedidos() {
  const { isAdmin } = useUser();
  const { success, error: toastError } = useToast();

  const defaultRange = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      de: formatDateBR(thirtyDaysAgo),
      ate: formatDateBR(now),
    };
  }, []);
  const { de: defaultDe, ate: defaultAte } = defaultRange;

  const [de, setDe] = useState(defaultDe);
  const [ate, setAte] = useState(defaultAte);
  const [appliedDe, setAppliedDe] = useState(defaultDe);
  const [appliedAte, setAppliedAte] = useState(defaultAte);
  const [usuarioFiltro, setUsuarioFiltro] = useState("");
  const [appliedUsuarioFiltro, setAppliedUsuarioFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [appliedStatusFiltro, setAppliedStatusFiltro] = useState("");
  const [statusOptions, setStatusOptions] = useState<SimpleOption[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [pedidos, setPedidos] = useState<PedidoDetalhe[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [resumo, setResumo] = useState<PedidoResumoMensal | null>(null);
  const [resumoLoading, setResumoLoading] = useState(false);
  const [resumoError, setResumoError] = useState<string | null>(null);
  const [resumoUsuarioId, setResumoUsuarioId] = useState<string | null>(null);
  const resumoRequestIdRef = useRef(0);

  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<PedidoDetalheCompleto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingPedidoId, setLoadingPedidoId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [editorItens, setEditorItens] = useState<EditorItem[]>([]);
  const [unidadeEntrega, setUnidadeEntrega] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [unidadesEntrega, setUnidadesEntrega] = useState<string[]>([]);
  const [unidadesLoading, setUnidadesLoading] = useState(false);

  const [catalogProducts, setCatalogProducts] = useState<Produto[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogPageSize = 6;
  const [catalogTotalPages, setCatalogTotalPages] = useState(0);
  const [catalogTotalItems, setCatalogTotalItems] = useState(0);
  const catalogRequestId = useRef(0);

  const [codigoFiltro, setCodigoFiltro] = useState("");
  const [descricaoFiltro, setDescricaoFiltro] = useState("");
  const [tipoProdutoFiltro, setTipoProdutoFiltro] = useState("");
  const [especieFiltro, setEspecieFiltro] = useState("");
  const [faixaEtariaFiltro, setFaixaEtariaFiltro] = useState("");
  const [porteFiltro, setPorteFiltro] = useState("");
  const [tipoProdutoOptions, setTipoProdutoOptions] = useState<ProductFilterSelectOption[]>([]);
  const [especieOptions, setEspecieOptions] = useState<ProductFilterSelectOption[]>([]);
  const [faixaEtariaOptions, setFaixaEtariaOptions] = useState<ProductFilterSelectOption[]>([]);
  const [porteOptions, setPorteOptions] = useState<ProductFilterSelectOption[]>([]);

  const catalogFilterValues: ProductFilterValues = useMemo(() => ({
    codigo: codigoFiltro,
    descricao: descricaoFiltro,
    tipoProduto: tipoProdutoFiltro,
    especie: especieFiltro,
    faixaEtaria: faixaEtariaFiltro,
    porte: porteFiltro,
  }), [codigoFiltro, descricaoFiltro, tipoProdutoFiltro, especieFiltro, faixaEtariaFiltro, porteFiltro]);

  const catalogFilterOptions: ProductFilterOptions = useMemo(() => ({
    tiposProduto: tipoProdutoOptions,
    especies: especieOptions,
    faixasEtarias: faixaEtariaOptions,
    portes: porteOptions,
  }), [tipoProdutoOptions, especieOptions, faixaEtariaOptions, porteOptions]);

  const hasCatalogFilters = Boolean(
    codigoFiltro.trim() ||
    descricaoFiltro.trim() ||
    tipoProdutoFiltro ||
    especieFiltro ||
    faixaEtariaFiltro ||
    porteFiltro
  );

  const editWindowActive = useMemo(() => {
    if (isAdmin) return true;
    const day = new Date().getDate();
    return (
      day >= EDIT_WINDOW_OPENING_DAY &&
      day <= EDIT_WINDOW_CLOSING_DAY
    );
  }, [isAdmin]);

  const editorTotals = useMemo(() => {
    const totalItensCalc = editorItens.reduce((acc, item) => acc + item.quantidade, 0);
    const totalValorCalc = editorItens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
    const totalPesoCalc = editorItens.reduce((acc, item) => acc + item.pesoKg * item.quantidade, 0);
    return {
      totalItens: totalItensCalc,
      totalValor: totalValorCalc,
      totalPesoKg: totalPesoCalc,
    };
  }, [editorItens]);

  const pedidoSelecionado = detalhe?.pedido;

  const canEditPedido = useMemo(() => {
    if (!pedidoSelecionado) return false;
    if (pedidoSelecionado.statusId === STATUS_CANCELADO) return false;
    return isAdmin || editWindowActive;
  }, [pedidoSelecionado, isAdmin, editWindowActive]);

  const hasActiveFilters = useMemo(() => {
    const status = appliedStatusFiltro.trim();
    const usuario = appliedUsuarioFiltro.trim();
    return status || usuario || appliedDe !== defaultDe || appliedAte !== defaultAte;
  }, [appliedAte, appliedDe, appliedStatusFiltro, appliedUsuarioFiltro, defaultAte, defaultDe]);

  const isSingleUserList = useMemo(() => {
    if (!isAdmin) return true;
    if (pedidos.length === 0) return false;
    const uniqueUsers = new Set(pedidos.map((pedido) => pedido.usuarioId)).size;
    return uniqueUsers === 1;
  }, [isAdmin, pedidos]);

  const pesoProgressPerc = useMemo(() => {
    if (!resumo || resumo.limiteKg <= 0) return 0;
    return Math.min(100, Math.round((resumo.totalConsumidoKg / resumo.limiteKg) * 100));
  }, [resumo]);

  const pedidosProgressPerc = useMemo(() => {
    if (!resumo || resumo.limitePedidos <= 0) return 0;
    const utilizados = Math.min(resumo.pedidosUtilizados, resumo.limitePedidos);
    return Math.min(100, Math.round((utilizados / resumo.limitePedidos) * 100));
  }, [resumo]);

  const hasPedidos = pedidos.length > 0;
  const safePageSize = pageSize > 0 ? pageSize : 10;
  const safeTotalItems = hasPedidos ? Math.max(totalItems, pedidos.length) : totalItems;
  const normalizedTotalPages = safeTotalItems > 0
    ? (totalPages > 0 ? totalPages : Math.max(Math.ceil(safeTotalItems / safePageSize), 1))
    : 0;
  const safePage = normalizedTotalPages > 0
    ? Math.min(Math.max(page, 1), normalizedTotalPages)
    : 1;
  const showingStart = hasPedidos ? (safePage - 1) * safePageSize + 1 : 0;
  const showingEnd = hasPedidos ? Math.min(showingStart + pedidos.length - 1, safeTotalItems) : 0;
  const canGoPrev = hasPedidos && safePage > 1;
  const canGoNext = hasPedidos && normalizedTotalPages > 0 && safePage < normalizedTotalPages;
  const displayTotalPages = normalizedTotalPages > 0 ? normalizedTotalPages : 1;

  const loadPedidos = useCallback(async () => {
    setListLoading(true);
    setListError(null);

    const deIso = startOfDayISO_BR(appliedDe);
    const ateIso = endOfDayISO_BR(appliedAte);

    if (!deIso || !ateIso) {
      setListError("Datas inválidas. Use o formato dd/mm/aaaa.");
      setPedidos([]);
      setTotalItems(0);
      setTotalPages(0);
      setListLoading(false);
      return;
    }

    if (new Date(deIso) > new Date(ateIso)) {
      setListError("A data inicial não pode ser posterior à data final.");
      setPedidos([]);
      setTotalItems(0);
      setTotalPages(0);
      setListLoading(false);
      return;
    }

    try {
      const params: Record<string, string | number> = {
        page,
        pageSize,
        de: deIso,
        ate: ateIso,
      };

      if (appliedStatusFiltro) {
        params.statusId = appliedStatusFiltro;
      }

      if (isAdmin && appliedUsuarioFiltro.trim()) {
        params.usuarioBusca = appliedUsuarioFiltro.trim();
      }

      const response = await api.get<PedidoPaginadoResponse>("/pedidos", { params });
      const data = response.data;
      setPedidos(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || "Não foi possível carregar os pedidos.";
      setListError(msg);
      setPedidos([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setListLoading(false);
    }
  }, [appliedDe, appliedAte, appliedStatusFiltro, appliedUsuarioFiltro, isAdmin, page, pageSize]);

  const loadResumo = useCallback(async () => {
    const requestId = resumoRequestIdRef.current + 1;
    resumoRequestIdRef.current = requestId;

    setResumoLoading(true);
    setResumoError(null);

    const deIso = startOfDayISO_BR(appliedDe);
    const ateIso = endOfDayISO_BR(appliedAte);

    if (!deIso || !ateIso) {
      if (requestId === resumoRequestIdRef.current) {
        setResumoError("Datas inválidas. Use o formato dd/mm/aaaa.");
        setResumo(null);
        setResumoLoading(false);
      }
      return;
    }

    if (new Date(deIso) > new Date(ateIso)) {
      if (requestId === resumoRequestIdRef.current) {
        setResumoError("A data inicial não pode ser posterior à data final.");
        setResumo(null);
        setResumoLoading(false);
      }
      return;
    }

    try {
      const params: Record<string, string> = {
        de: deIso,
        ate: ateIso,
      };

      if (appliedStatusFiltro) {
        params.statusId = appliedStatusFiltro;
      }

      if (isAdmin && resumoUsuarioId) {
        params.usuarioId = resumoUsuarioId;
      }

      const response = await api.get<PedidoResumoMensal>("/pedidos/resumo-mensal", { params });
      if (requestId !== resumoRequestIdRef.current) return;
      setResumo(response.data);
    } catch (error: any) {
      if (requestId !== resumoRequestIdRef.current) return;
      const msg = error?.response?.data?.detail || error?.message || "Não foi possível carregar o resumo do período.";
      setResumoError(msg);
      setResumo(null);
    } finally {
      if (requestId !== resumoRequestIdRef.current) return;
      setResumoLoading(false);
    }
  }, [appliedDe, appliedAte, appliedStatusFiltro, isAdmin, resumoUsuarioId]);

  const aplicarFiltros = useCallback(() => {
    setListError(null);
    setResumoError(null);
    setPage(1);
    setAppliedDe(de);
    setAppliedAte(ate);
    setAppliedUsuarioFiltro(usuarioFiltro);
    setAppliedStatusFiltro(statusFiltro);
  }, [ate, de, statusFiltro, usuarioFiltro]);

  const limparFiltros = useCallback(() => {
    setDe(defaultDe);
    setAte(defaultAte);
    setUsuarioFiltro("");
    setStatusFiltro("");
    setPage(1);
    setAppliedDe(defaultDe);
    setAppliedAte(defaultAte);
    setAppliedUsuarioFiltro("");
    setAppliedStatusFiltro("");
    setListError(null);
    setResumoError(null);
  }, [defaultAte, defaultDe]);

  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  useEffect(() => {
    if (listLoading) return;
    if (totalPages === 0 && page !== 1) {
      setPage(1);
      return;
    }
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page, listLoading]);

  useEffect(() => {
    loadResumo();
  }, [loadResumo]);

  useEffect(() => {
    if (!isAdmin) {
      setResumoUsuarioId(null);
      return;
    }

    const usuarioBusca = appliedUsuarioFiltro.trim();
    if (!usuarioBusca || listLoading) {
      setResumoUsuarioId(null);
      return;
    }

    const uniqueUsuarios = Array.from(new Set(pedidos.map((pedido) => pedido.usuarioId)));
    if (uniqueUsuarios.length === 1) {
      setResumoUsuarioId(uniqueUsuarios[0]);
    } else {
      setResumoUsuarioId(null);
    }
  }, [appliedUsuarioFiltro, isAdmin, listLoading, pedidos]);

  useEffect(() => {
    if (!selectedPedidoId) return;
    if (detailLoading) return;
    if (!editorRef.current) return;

    editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedPedidoId, detailLoading]);

  useEffect(() => {
    let alive = true;
    setStatusLoading(true);

    type PedidoStatusResponse = { id: number; nome: string };

    api
      .get<PedidoStatusResponse[]>("/pedidos/status")
      .then((response) => {
        if (!alive) return;
        const options = (response.data || []).map((status) => ({
          value: String(status.id),
          label: status.nome,
        }));
        setStatusOptions(options);
      })
      .catch(() => {
        if (!alive) return;
        setStatusOptions([]);
      })
      .finally(() => {
        if (!alive) return;
        setStatusLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setUnidadesLoading(true);
    api
      .get<string[]>("/unidades-entrega")
      .then((response) => {
        if (!alive) return;
        setUnidadesEntrega(response.data || []);
      })
      .catch(() => {
        if (!alive) return;
        setUnidadesEntrega([]);
      })
      .finally(() => {
        if (!alive) return;
        setUnidadesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const loadOptions = async () => {
      try {
        const [tiposResp, especiesResp, faixasResp, portesResp] = await Promise.all([
          api.get<ProductFilterSelectOption[]>("/produtos/tipos-produto"),
          api.get<ProductFilterSelectOption[]>("/produtos/especies"),
          api.get<ProductFilterSelectOption[]>("/produtos/faixas-etarias"),
          api.get<ProductFilterSelectOption[]>("/produtos/portes"),
        ]);
        if (!alive) return;
        setTipoProdutoOptions(tiposResp.data);
        setEspecieOptions(especiesResp.data);
        setFaixaEtariaOptions(faixasResp.data);
        setPorteOptions(portesResp.data);
      } catch {
        if (!alive) return;
      }
    };

    loadOptions();
    return () => {
      alive = false;
    };
  }, []);

  const loadPedidoDetalhe = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setSaveError(null);
    setLoadingPedidoId(id);
    setSelectedPedidoId(id);
    try {
      const response = await api.get<PedidoDetalheCompleto>(`/pedidos/${id}`);
      const data = response.data;
      setDetalhe(data);
      setEditorItens(
        data.pedido.itens.map((item) => ({
          codigo: item.produtoCodigo,
          descricao: item.descricao,
          preco: item.preco,
          quantidade: item.quantidade,
          pesoKg: item.pesoKg,
          minQty: Math.max(1, item.quantidadeMinima ?? 1),
        }))
      );
      setUnidadeEntrega(data.pedido.unidadeEntrega);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || "Não foi possível carregar os detalhes do pedido.";
      setDetailError(msg);
      setDetalhe(null);
      setEditorItens([]);
      setSelectedPedidoId(null);
    } finally {
      setDetailLoading(false);
      setLoadingPedidoId((current) => (current === id ? null : current));
    }
  }, []);

  const aposAlterarStatus = useCallback(
    async (pedidoId: string) => {
      await Promise.all([loadPedidos(), loadResumo()]);
      if (selectedPedidoId === pedidoId) {
        await loadPedidoDetalhe(pedidoId);
      }
    },
    [loadPedidos, loadResumo, loadPedidoDetalhe, selectedPedidoId]
  );

  const aprovarPedido = useCallback(
    async (pedidoId: string) => {
      setApprovingId(pedidoId);
      try {
        await api.post<PedidoDetalhe>(`/pedidos/${pedidoId}/aprovar`);
        success("Pedido aprovado", "O pedido foi aprovado com sucesso.");
        await aposAlterarStatus(pedidoId);
      } catch (err: any) {
        const msg = err?.response?.data?.detail || err?.message || "Não foi possível aprovar o pedido.";
        toastError("Falha ao aprovar pedido", msg);
      } finally {
        setApprovingId(null);
      }
    },
    [aposAlterarStatus, success, toastError]
  );

  const cancelarPedido = useCallback(
    async (pedidoId: string) => {
      setCancellingId(pedidoId);
      try {
        await api.post<PedidoDetalhe>(`/pedidos/${pedidoId}/cancelar`);
        success("Pedido cancelado", "O pedido foi cancelado com sucesso.");
        await aposAlterarStatus(pedidoId);
      } catch (err: any) {
        const msg = err?.response?.data?.detail || err?.message || "Não foi possível cancelar o pedido.";
        toastError("Falha ao cancelar pedido", msg);
      } finally {
        setCancellingId(null);
      }
    },
    [aposAlterarStatus, success, toastError]
  );

  const loadCatalogo = useCallback(async () => {
    if (!selectedPedidoId) return;
    setCatalogLoading(true);
    const requestId = ++catalogRequestId.current;
    try {
      const params: Record<string, string> = {
        page: Math.max(catalogPage, 1).toString(),
        pageSize: catalogPageSize.toString(),
      };
      const codigo = codigoFiltro.trim();
      const descricao = descricaoFiltro.trim();
      if (codigo) params.codigo = codigo;
      if (descricao) params.descricao = descricao;
      if (tipoProdutoFiltro) params.tipoProdutoOpcaoId = tipoProdutoFiltro;
      if (especieFiltro) params.especieOpcaoId = especieFiltro;
      if (faixaEtariaFiltro) params.faixaEtariaOpcaoId = faixaEtariaFiltro;
      if (porteFiltro) params.porteOpcaoId = porteFiltro;

      const response = await api.get<CatalogoResponse>("/catalogo", { params });
      if (catalogRequestId.current !== requestId) return;
      setCatalogProducts(response.data.items);
      setCatalogTotalItems(response.data.totalItems);
      setCatalogTotalPages(response.data.totalPages);
    } catch (error: any) {
      if (catalogRequestId.current !== requestId) return;
      const msg = error?.response?.data?.detail || error?.message || "Não foi possível carregar o catálogo.";
      toastError("Erro ao carregar catálogo", msg);
      setCatalogProducts([]);
      setCatalogTotalItems(0);
      setCatalogTotalPages(0);
    } finally {
      if (catalogRequestId.current === requestId) {
        setCatalogLoading(false);
      }
    }
  }, [selectedPedidoId, catalogPage, catalogPageSize, codigoFiltro, descricaoFiltro, tipoProdutoFiltro, especieFiltro, faixaEtariaFiltro, porteFiltro, toastError]);

  useEffect(() => {
    if (!selectedPedidoId) return;
    loadCatalogo();
  }, [selectedPedidoId, loadCatalogo]);

  useEffect(() => {
    setCatalogPage(1);
  }, [selectedPedidoId]);

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
    setCatalogPage(1);
  };

  const clearCatalogFilters = () => {
    setCodigoFiltro("");
    setDescricaoFiltro("");
    setTipoProdutoFiltro("");
    setEspecieFiltro("");
    setFaixaEtariaFiltro("");
    setPorteFiltro("");
    setCatalogPage(1);
  };

  useEffect(() => {
    setPage(1);
    setSelectedPedidoId(null);
    setDetalhe(null);
    setEditorItens([]);
    setDetailError(null);
  }, [appliedDe, appliedAte, appliedUsuarioFiltro, appliedStatusFiltro]);

  const updateItemQuantity = (codigo: string, quantidade: number) => {
    if (!canEditPedido) return;
    setEditorItens((prev) => {
      return prev
        .map((item) => {
          if (item.codigo !== codigo) return item;
          const minimo = Math.max(1, item.minQty ?? 1);
          const desejada = Number.isFinite(quantidade) ? quantidade : item.quantidade;
          const normalizado = normalizeQuantityToMultiple(desejada, minimo, item.quantidade);
          return { ...item, quantidade: normalizado };
        })
        .filter((item) => item.quantidade > 0);
    });
  };

  const removeItem = (codigo: string) => {
    if (!canEditPedido) return;
    setEditorItens((prev) => prev.filter((item) => item.codigo !== codigo));
  };

  const addProduto = (produto: Produto) => {
    if (!canEditPedido) return;
    setEditorItens((prev) => {
      const min = minQtyFor(produto);
      const pesoKg = toKg(produto.peso, produto.tipoPeso);
      const existente = prev.find((item) => item.codigo === produto.codigo);
      if (existente) {
        return prev.map((item) =>
          item.codigo === produto.codigo
            ? {
                ...item,
                quantidade: item.quantidade + min,
                minQty: min,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          codigo: produto.codigo,
          descricao: produto.descricao,
          preco: produto.preco,
          quantidade: min,
          pesoKg,
          minQty: min,
        },
      ];
    });
  };

  const salvarAlteracoes = async () => {
    if (!selectedPedidoId || !canEditPedido) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        unidadeEntrega,
        itens: editorItens.map((item) => ({
          produtoCodigo: item.codigo,
          quantidade: item.quantidade,
        })),
      };
      const response = await api.put<PedidoDetalhe>(`/pedidos/${selectedPedidoId}`, payload);
      success("Pedido atualizado", "As alterações foram salvas com sucesso.");
      await loadPedidos();
      await loadPedidoDetalhe(selectedPedidoId);
      await loadResumo();
      const atualizado = response.data;
      setPedidos((prev) => prev.map((p) => (p.id === atualizado.id ? { ...p, ...atualizado } : p)));
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || "Falha ao salvar as alterações.";
      setSaveError(msg);
      toastError("Não foi possível salvar", msg);
    } finally {
      setSaving(false);
    }
  };

  const renderIndicadores = () => {
    if (!isSingleUserList) return null;

    if (resumoLoading) {
      return (
        <div className="bg-white p-6 rounded-xl shadow text-sm text-gray-500">
          Carregando indicadores do usuário...
        </div>
      );
    }

    if (resumoError) {
      return (
        <div className="bg-white p-6 rounded-xl shadow text-sm text-red-600">{resumoError}</div>
      );
    }

    if (!resumo) return null;

    const limitePesoFormatado = formatPeso(resumo.limiteKg, "kg", { unit: "kg" });
    const consumoPesoFormatado = formatPeso(resumo.totalConsumidoKg, "kg", { unit: "kg" });
    const pedidosUtilizados = Math.max(0, Math.min(resumo.pedidosUtilizados, resumo.limitePedidos));
    const pedidosDisponiveis = Math.max(0, resumo.limitePedidos - pedidosUtilizados);

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <div className="text-sm text-gray-500">Consumo de peso (kg)</div>
          <div className="mt-1 text-2xl font-semibold">{consumoPesoFormatado}</div>
          <div className="mt-3 h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${pesoProgressPerc}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {pesoProgressPerc}% do limite mensal de {limitePesoFormatado}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <div className="text-sm text-gray-500">Pedidos do mês</div>
          <div className="mt-1 text-2xl font-semibold">{pedidosUtilizados}</div>
          <div className="mt-3 h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${pedidosProgressPerc}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {pedidosDisponiveis} pedido(s) disponível(is) de {resumo.limitePedidos}
          </div>
        </div>
      </div>
    );
  };

  const renderHistorico = () => {
    if (!detalhe?.historico?.length) {
      return (
        <div className="text-sm text-gray-500">Nenhuma alteração registrada.</div>
      );
    }

    const itemResumo = (alteracao: PedidoHistoricoAlteracao) => {
      const { quantidadeAnterior, quantidadeAtual } = alteracao;
      if (quantidadeAnterior === quantidadeAtual) return null;
      return (
        <li key={`${alteracao.produtoCodigo}-${quantidadeAnterior}-${quantidadeAtual}`} className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{alteracao.descricao}</span>
          <span className="tabular-nums font-medium">
            {quantidadeAnterior} → {quantidadeAtual}
          </span>
        </li>
      );
    };

    return (
      <div className="space-y-3">
        {detalhe.historico.map((h: PedidoHistorico) => (
          <div key={h.id} className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <span>{formatDateTimePtBr(h.dataHora)}</span>
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-indigo-600">
                  {h.tipo}
                </span>
                <span>{h.usuarioNome || "Sistema"}</span>
              </span>
            </div>
            {h.detalhes && (
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                {h.detalhes.unidadeEntregaAnterior !== h.detalhes.unidadeEntregaAtual && (
                  <div>
                    Unidade de entrega: <strong>{h.detalhes.unidadeEntregaAnterior || "—"}</strong> → <strong>{h.detalhes.unidadeEntregaAtual || "—"}</strong>
                  </div>
                )}
                {h.detalhes.statusAnterior !== h.detalhes.statusAtual && (
                  <div>
                    Status: <strong>{h.detalhes.statusAnterior || "—"}</strong> → <strong>{h.detalhes.statusAtual || "—"}</strong>
                  </div>
                )}
                {h.detalhes.itens?.length ? (
                  <ul className="space-y-1">
                    {h.detalhes.itens.map((alteracao) => itemResumo(alteracao))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos</h1>
          <p className="text-sm text-gray-600">Visualize e gerencie os pedidos do período selecionado.</p>
        </div>
      </div>

      <DateUserFilters
        de={de}
        ate={ate}
        onChangeDe={setDe}
        onChangeAte={setAte}
        showUsuario={isAdmin}
        usuario={usuarioFiltro}
        onChangeUsuario={isAdmin ? setUsuarioFiltro : undefined}
        statusId={statusFiltro}
        onChangeStatusId={setStatusFiltro}
        statusOptions={statusOptions}
        onApply={aplicarFiltros}
        applyLabel={listLoading ? "Buscando..." : "Buscar"}
        disabled={listLoading || statusLoading}
      >
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={limparFiltros}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={listLoading || statusLoading}
          >
            Limpar filtros
          </button>
        ) : null}
      </DateUserFilters>

      {renderIndicadores()}

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pedidos do período</h2>
          <div className="text-xs text-gray-500">Total: {totalItems}</div>
        </div>
        {listLoading ? (
          <div className="p-6 text-sm text-gray-500">Carregando pedidos...</div>
        ) : listError ? (
          <div className="p-6 text-sm text-red-600">{listError}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Colaborador</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Peso (kg)</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pedidos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                        Nenhum pedido encontrado para o período selecionado.
                      </td>
                    </tr>
                  ) : (
                    pedidos.map((pedido) => {
                      const isSelecionado = selectedPedidoId === pedido.id;
                      const isAbrindo = loadingPedidoId === pedido.id && detailLoading;
                      const linhaClasse = isSelecionado
                        ? "bg-indigo-50/50"
                        : loadingPedidoId === pedido.id
                          ? "bg-indigo-50/30"
                          : "bg-white";
                      const podeEditarConteudo = pedido.statusId !== STATUS_CANCELADO && (isAdmin || editWindowActive);
                      const mostraAprovar = isAdmin && pedido.statusId === STATUS_SOLICITADO;
                      const mostraCancelar = pedido.statusId !== STATUS_CANCELADO && (isAdmin || editWindowActive);
                      const editLabel = isAbrindo
                        ? "Abrindo..."
                        : isSelecionado
                          ? podeEditarConteudo
                            ? "Editando"
                            : "Visualizando"
                          : podeEditarConteudo
                            ? "Editar"
                            : "Ver";

                      return (
                        <tr key={pedido.id} className={linhaClasse}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">{pedido.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDateTimePtBr(pedido.dataHora)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div>{pedido.usuarioNome}</div>
                            {pedido.usuarioCpf && <div className="text-xs text-gray-400">CPF: {pedido.usuarioCpf}</div>}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                              {pedido.statusNome}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">{formatPeso(pedido.pesoTotalKg, "kg", { unit: "kg" })}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrencyBRL(pedido.total)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <button
                                className="px-3 py-1.5 text-sm rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => loadPedidoDetalhe(pedido.id)}
                                disabled={isAbrindo}
                              >
                                {editLabel}
                              </button>
                              {mostraAprovar && (
                                <button
                                  className="px-3 py-1.5 text-sm rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => aprovarPedido(pedido.id)}
                                  disabled={approvingId === pedido.id || cancellingId === pedido.id}
                                >
                                  {approvingId === pedido.id ? "Aprovando..." : "Aprovar"}
                                </button>
                              )}
                              {mostraCancelar && (
                                <button
                                  className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => cancelarPedido(pedido.id)}
                                  disabled={cancellingId === pedido.id || approvingId === pedido.id || (!isAdmin && !editWindowActive)}
                                >
                                  {cancellingId === pedido.id ? "Cancelando..." : "Cancelar"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {hasPedidos && (
              <nav
                className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                aria-label="Paginação da lista de pedidos"
              >
                <p className="text-sm text-gray-600">
                  Mostrando {" "}
                  <span className="font-semibold text-gray-900">
                    {showingStart}-{showingEnd}
                  </span>{" "}
                  de {" "}
                  <span className="font-semibold text-gray-900">{safeTotalItems}</span>{" "}
                  pedidos
                  {listLoading && (
                    <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">Atualizando...</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={!canGoPrev}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Página {safePage} de {displayTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(displayTotalPages, prev + 1))}
                    disabled={!canGoNext}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                  >
                    Próxima
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>

      {selectedPedidoId && (
        <div className="space-y-6" ref={editorRef}>
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Editar pedido</h2>
                {pedidoSelecionado && (
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium text-gray-800">Código:</span>{" "}
                      <span className="text-gray-700">{pedidoSelecionado.id}</span>{" · "}
                      <span className="font-medium text-gray-800">Colaborador:</span>{" "}
                      <span className="text-gray-700">{pedidoSelecionado.usuarioNome}</span>
                    </p>
                    <p>
                      Pedido realizado em {formatDateTimePtBr(pedidoSelecionado.dataHora)} · Unidade atual: {pedidoSelecionado.unidadeEntrega}
                    </p>
                  </div>
                )}
              </div>
              {!isAdmin && !editWindowActive && pedidoSelecionado?.statusId !== STATUS_CANCELADO && (
                <div className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm max-w-md">
                  As edições estão disponíveis apenas entre os dias 15 e 20 de cada mês para colaboradores.
                </div>
              )}
              {pedidoSelecionado?.statusId === STATUS_CANCELADO && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm max-w-md">
                  Este pedido foi cancelado e está disponível apenas para consulta.
                </div>
              )}
            </div>

            {detailLoading ? (
              <div className="text-sm text-gray-500">Carregando detalhes...</div>
            ) : detailError ? (
              <div className="text-sm text-red-600">{detailError}</div>
            ) : pedidoSelecionado ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Unidade de entrega</label>
                    <select
                      value={unidadeEntrega}
                      onChange={(event) => setUnidadeEntrega(event.target.value)}
                      disabled={unidadesLoading || !canEditPedido || saving}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {unidadesEntrega.map((unidade) => (
                        <option key={unidade} value={unidade}>{unidade}</option>
                      ))}
                      {!unidadesEntrega.includes(unidadeEntrega) && unidadeEntrega && (
                        <option value={unidadeEntrega}>{unidadeEntrega}</option>
                      )}
                    </select>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Produto</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantidade</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Subtotal</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {editorItens.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">Nenhum item no pedido.</td>
                          </tr>
                        ) : (
                          editorItens.map((item) => (
                            <tr key={item.codigo}>
                              <td className="px-3 py-2 text-sm text-gray-700">
                                <div className="font-medium text-gray-800">{item.descricao}</div>
                                <div className="text-xs text-gray-500">{item.codigo}</div>
                                <div className="text-xs text-gray-400">Preço: {formatCurrencyBRL(item.preco)} · Peso unitário: {formatPeso(item.pesoKg, "kg", { unit: "kg" })}</div>
                                {item.minQty && <div className="text-xs text-amber-600">Mínimo por adição: {item.minQty}</div>}
                              </td>
                              <td className="px-3 py-2 text-right text-sm">
                                <input
                                  type="number"
                                  min={Math.max(1, item.minQty ?? 1)}
                                  step={Math.max(1, item.minQty ?? 1)}
                                  value={item.quantidade}
                                  onChange={(event) => updateItemQuantity(item.codigo, Number(event.target.value))}
                                  disabled={!canEditPedido || saving}
                                  className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm text-right shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="px-3 py-2 text-right text-sm text-gray-700">
                                {formatCurrencyBRL(item.preco * item.quantidade)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => removeItem(item.codigo)}
                                  disabled={!canEditPedido || saving}
                                >
                                  Remover
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm">
                    <div>
                      <div className="text-gray-600">Total de itens</div>
                      <div className="text-lg font-semibold text-indigo-700">{editorTotals.totalItens}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Peso total</div>
                      <div className="text-lg font-semibold text-indigo-700">{formatPeso(editorTotals.totalPesoKg, "kg", { unit: "kg" })}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Valor total</div>
                      <div className="text-lg font-semibold text-indigo-700">{formatCurrencyBRL(editorTotals.totalValor)}</div>
                    </div>
                  </div>

                  {saveError && <div className="text-sm text-red-600">{saveError}</div>}

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
                      onClick={() => {
                        setSelectedPedidoId(null);
                        setDetalhe(null);
                        setEditorItens([]);
                        setDetailError(null);
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={salvarAlteracoes}
                      disabled={!canEditPedido || saving || editorItens.length === 0 || !unidadeEntrega}
                    >
                      {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <ProductFilters
                      idPrefix="pedido-edicao"
                      title="Catálogo"
                      description="Use os filtros para adicionar novos produtos ao pedido."
                      values={catalogFilterValues}
                      options={catalogFilterOptions}
                      hasFilters={hasCatalogFilters}
                      onChange={handleFilterChange}
                      onClear={clearCatalogFilters}
                      clearLabel="Limpar"
                    />
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                      <span>Produtos disponíveis</span>
                      <span className="text-xs text-gray-500">{catalogTotalItems} encontrado(s)</span>
                    </div>
                    {catalogLoading ? (
                      <div className="p-4 text-sm text-gray-500">Carregando catálogo...</div>
                    ) : catalogProducts.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">Nenhum produto encontrado com os filtros selecionados.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {catalogProducts.map((produto) => {
                          const pesoUnit = toKg(produto.peso, produto.tipoPeso);
                          return (
                            <div key={produto.codigo} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div>
                                <div className="font-medium text-gray-800">{produto.descricao}</div>
                                <div className="text-xs text-gray-500">Código: {produto.codigo}</div>
                                <div className="text-xs text-gray-400">
                                  Peso unitário: {formatPeso(pesoUnit, "kg", { unit: "kg" })} · Mínimo: {minQtyFor(produto)} unidade(s)
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-sm font-semibold text-indigo-600">{formatCurrencyBRL(produto.preco)}</div>
                                <button
                                  className="px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 text-sm hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => addProduto(produto)}
                                  disabled={!canEditPedido || saving}
                                >
                                  Adicionar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {catalogTotalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
                        <button
                          className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => setCatalogPage((prev) => Math.max(1, prev - 1))}
                          disabled={catalogPage <= 1}
                        >
                          Anterior
                        </button>
                        <div>Pagina {catalogPage} de {catalogTotalPages}</div>
                        <button
                          className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => setCatalogPage((prev) => Math.min(catalogTotalPages, prev + 1))}
                          disabled={catalogPage >= catalogTotalPages}
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Histórico de alterações</h3>
                    {renderHistorico()}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
