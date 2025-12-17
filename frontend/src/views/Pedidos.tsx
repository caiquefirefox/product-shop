import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, FilePenLine, X } from "lucide-react";
import api from "../lib/api";
import { formatCurrencyBRL, formatPeso, startOfDayISO_BR, endOfDayISO_BR, formatDateBR } from "../lib/format";
import { DateUserFilters, type SimpleOption } from "../components/DateUserFilters";
import { ProductFilters, type ProductFilterChangeHandler, type ProductFilterOptions, type ProductFilterSelectOption, type ProductFilterValues } from "../components/ProductFilters";
import type { Produto } from "../cart/types";
import { minQtyFor, normalizeQuantityToMultiple, resolveMinQty, toKg } from "../cart/calc";
import { ENV } from "../config/env";
import { usePedidosConfig } from "../hooks/usePedidosConfig";
import { STATUS_APROVADO, STATUS_BADGE_STYLES, STATUS_CANCELADO, STATUS_SOLICITADO } from "../pedidos/statusStyles";
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

type UnidadeEntregaOption = {
  id: string;
  nome: string;
};

type EmpresaOption = {
  id: string;
  nome: string;
};

type DetailMode = "edit" | "view";

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
  const { minQtyPadrao } = usePedidosConfig();

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
  const [empresaFiltro, setEmpresaFiltro] = useState("");
  const [appliedEmpresaFiltro, setAppliedEmpresaFiltro] = useState("");
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [empresasLoading, setEmpresasLoading] = useState(false);
  const [empresasError, setEmpresasError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelConfirmPedido, setCancelConfirmPedido] = useState<PedidoDetalhe | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
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
  const [detailMode, setDetailMode] = useState<DetailMode>("edit");
  const [detalhe, setDetalhe] = useState<PedidoDetalheCompleto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingPedidoId, setLoadingPedidoId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [editorItens, setEditorItens] = useState<EditorItem[]>([]);
  const [empresaIdEditor, setEmpresaIdEditor] = useState("");
  const [unidadeEntregaId, setUnidadeEntregaId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [unidadesEntrega, setUnidadesEntrega] = useState<UnidadeEntregaOption[]>([]);
  const [unidadesLoading, setUnidadesLoading] = useState(false);

  const [catalogProducts, setCatalogProducts] = useState<Produto[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogPageSize = 6;
  const [catalogTotalPages, setCatalogTotalPages] = useState(0);
  const [catalogTotalItems, setCatalogTotalItems] = useState(0);
  const catalogRequestId = useRef(0);

  const [buscaFiltro, setBuscaFiltro] = useState("");
  const [tipoProdutoFiltro, setTipoProdutoFiltro] = useState("");
  const [especieFiltro, setEspecieFiltro] = useState("");
  const [faixaEtariaFiltro, setFaixaEtariaFiltro] = useState("");
  const [porteFiltro, setPorteFiltro] = useState("");
  const [tipoProdutoOptions, setTipoProdutoOptions] = useState<ProductFilterSelectOption[]>([]);
  const [especieOptions, setEspecieOptions] = useState<ProductFilterSelectOption[]>([]);
  const [faixaEtariaOptions, setFaixaEtariaOptions] = useState<ProductFilterSelectOption[]>([]);
  const [porteOptions, setPorteOptions] = useState<ProductFilterSelectOption[]>([]);

  const catalogFilterValues: ProductFilterValues = useMemo(() => ({
    query: buscaFiltro,
    tipoProduto: tipoProdutoFiltro,
    especie: especieFiltro,
    faixaEtaria: faixaEtariaFiltro,
    porte: porteFiltro,
  }), [buscaFiltro, tipoProdutoFiltro, especieFiltro, faixaEtariaFiltro, porteFiltro]);

  const catalogFilterOptions: ProductFilterOptions = useMemo(() => ({
    tiposProduto: tipoProdutoOptions,
    especies: especieOptions,
    faixasEtarias: faixaEtariaOptions,
    portes: porteOptions,
  }), [tipoProdutoOptions, especieOptions, faixaEtariaOptions, porteOptions]);

  const hasCatalogFilters = Boolean(
    buscaFiltro.trim() ||
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
  const isViewMode = detailMode === "view";

  const canEditPedido = useMemo(() => {
    if (!pedidoSelecionado) return false;
    if (pedidoSelecionado.statusId === STATUS_CANCELADO) return false;
    return isAdmin || editWindowActive;
  }, [pedidoSelecionado, isAdmin, editWindowActive]);

  const effectiveCanEdit = !isViewMode && canEditPedido;
  const painelTitulo = isViewMode ? "Detalhes do pedido" : "Editar pedido";

  const unidadeSelecionadaOption = useMemo(
    () => unidadesEntrega.find((unidade) => unidade.id === unidadeEntregaId) || null,
    [unidadesEntrega, unidadeEntregaId]
  );

  const unidadeSelecionadaNome = useMemo(() => {
    if (unidadeSelecionadaOption) return unidadeSelecionadaOption.nome;
    if (pedidoSelecionado && pedidoSelecionado.unidadeEntregaId === unidadeEntregaId) {
      return pedidoSelecionado.unidadeEntregaNome;
    }
    return "";
  }, [unidadeSelecionadaOption, pedidoSelecionado, unidadeEntregaId]);

  const empresaSelecionadaNome = useMemo(() => {
    const selecionada = empresas.find((empresa) => empresa.id === empresaIdEditor);
    if (selecionada) return selecionada.nome;
    return pedidoSelecionado?.empresaNome || "";
  }, [empresaIdEditor, empresas, pedidoSelecionado]);

  const empresaOptions = useMemo(
    () => empresas.map((empresa) => ({ value: empresa.id, label: empresa.nome })),
    [empresas]
  );

  const hasActiveFilters = useMemo(() => {
    const status = appliedStatusFiltro.trim();
    const usuario = appliedUsuarioFiltro.trim();
    const empresa = appliedEmpresaFiltro.trim();
    return status || usuario || empresa || appliedDe !== defaultDe || appliedAte !== defaultAte;
  }, [appliedAte, appliedDe, appliedEmpresaFiltro, appliedStatusFiltro, appliedUsuarioFiltro, defaultAte, defaultDe]);

  const isSingleUserList = useMemo(() => {
    if (!isAdmin) return true;
    if (pedidos.length === 0) return false;
    const uniqueUsers = new Set(pedidos.map((pedido) => pedido.usuarioId)).size;
    return uniqueUsers === 1;
  }, [isAdmin, pedidos]);

  const limiteMensalKg = useMemo(() => {
    const resumoLimit = resumo?.limiteKg ?? 0;
    return resumoLimit > 0 ? resumoLimit : 0;
  }, [resumo]);

  const pesoProgressPerc = useMemo(() => {
    if (!resumo || limiteMensalKg <= 0) return 0;
    return Math.min(100, Math.round((resumo.totalConsumidoKg / limiteMensalKg) * 100));
  }, [resumo, limiteMensalKg]);

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

      if (appliedEmpresaFiltro.trim()) {
        params.empresaId = appliedEmpresaFiltro.trim();
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
  }, [appliedAte, appliedDe, appliedEmpresaFiltro, appliedStatusFiltro, appliedUsuarioFiltro, isAdmin, page, pageSize]);

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

      if (appliedEmpresaFiltro.trim()) {
        params.empresaId = appliedEmpresaFiltro.trim();
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
  }, [appliedAte, appliedDe, appliedEmpresaFiltro, appliedStatusFiltro, isAdmin, resumoUsuarioId]);

  const aplicarFiltros = useCallback(() => {
    setListError(null);
    setResumoError(null);
    setPage(1);
    setAppliedDe(de);
    setAppliedAte(ate);
    setAppliedUsuarioFiltro(usuarioFiltro);
    setAppliedStatusFiltro(statusFiltro);
    setAppliedEmpresaFiltro(empresaFiltro);
  }, [ate, de, empresaFiltro, statusFiltro, usuarioFiltro]);

  const limparFiltros = useCallback(() => {
    setDe(defaultDe);
    setAte(defaultAte);
    setUsuarioFiltro("");
    setStatusFiltro("");
    setEmpresaFiltro("");
    setPage(1);
    setAppliedDe(defaultDe);
    setAppliedAte(defaultAte);
    setAppliedUsuarioFiltro("");
    setAppliedStatusFiltro("");
    setAppliedEmpresaFiltro("");
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
    setEmpresasLoading(true);
    setEmpresasError(null);

    api
      .get<EmpresaOption[]>("/empresas")
      .then((response) => {
        if (!alive) return;
        setEmpresas(response.data || []);
      })
      .catch((error: any) => {
        if (!alive) return;
        const msg = error?.response?.data?.detail || error?.message || "Não foi possível carregar empresas.";
        setEmpresasError(msg);
        setEmpresas([]);
      })
      .finally(() => {
        if (!alive) return;
        setEmpresasLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setUnidadesLoading(true);

    if (!empresaIdEditor) {
      setUnidadesEntrega([]);
      setUnidadeEntregaId("");
      setUnidadesLoading(false);
      return () => {
        alive = false;
      };
    }

    api
      .get<UnidadeEntregaOption[]>("/unidades-entrega", { params: { empresaId: empresaIdEditor } })
      .then((response) => {
        if (!alive) return;
        const lista = response.data || [];
        setUnidadesEntrega(lista);
        setUnidadeEntregaId((current) => {
          if (current && lista.some((unidade) => unidade.id === current)) return current;
          return lista.length > 0 ? lista[0].id : "";
        });
      })
      .catch(() => {
        if (!alive) return;
        setUnidadesEntrega([]);
        setUnidadeEntregaId("");
      })
      .finally(() => {
        if (!alive) return;
        setUnidadesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [empresaIdEditor]);

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

  const loadPedidoDetalhe = useCallback(async (id: string, mode?: DetailMode) => {
    const nextMode = mode ?? (selectedPedidoId === id ? detailMode : "edit");
    setDetailMode(nextMode);
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
          minQty: resolveMinQty(item.quantidadeMinima, minQtyPadrao),
        }))
      );
      setEmpresaIdEditor(data.pedido.empresaId);
      setUnidadeEntregaId(data.pedido.unidadeEntregaId);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || "Não foi possível carregar os detalhes do pedido.";
      setDetailError(msg);
      setDetalhe(null);
      setEditorItens([]);
      setSelectedPedidoId(null);
      setEmpresaIdEditor("");
      setUnidadeEntregaId("");
    } finally {
      setDetailLoading(false);
      setLoadingPedidoId((current) => (current === id ? null : current));
    }
  }, [detailMode, minQtyPadrao, selectedPedidoId]);

  const aposAlterarStatus = useCallback(
    async (pedidoId: string) => {
      await Promise.all([loadPedidos(), loadResumo()]);
      if (selectedPedidoId === pedidoId) {
        await loadPedidoDetalhe(pedidoId, detailMode);
      }
    },
    [detailMode, loadPedidos, loadResumo, loadPedidoDetalhe, selectedPedidoId]
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

  const closeCancelModal = useCallback(() => {
    if (confirmingCancel) return;
    setCancelConfirmPedido(null);
  }, [confirmingCancel]);

  const confirmarCancelamento = useCallback(async () => {
    if (!cancelConfirmPedido) return;
    setConfirmingCancel(true);
    await cancelarPedido(cancelConfirmPedido.id);
    setConfirmingCancel(false);
    setCancelConfirmPedido(null);
  }, [cancelConfirmPedido, cancelarPedido]);

  const solicitarCancelamento = useCallback((pedido: PedidoDetalhe) => {
    setConfirmingCancel(false);
    setCancelConfirmPedido(pedido);
  }, []);

  const loadCatalogo = useCallback(async () => {
    if (!selectedPedidoId || detailMode !== "edit") return;
    setCatalogLoading(true);
    const requestId = ++catalogRequestId.current;
    try {
      const params: Record<string, string> = {
        page: Math.max(catalogPage, 1).toString(),
        pageSize: catalogPageSize.toString(),
      };
      const busca = buscaFiltro.trim();
      if (busca) params.q = busca;
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
  }, [
    selectedPedidoId,
    detailMode,
    catalogPage,
    catalogPageSize,
    buscaFiltro,
    tipoProdutoFiltro,
    especieFiltro,
    faixaEtariaFiltro,
    porteFiltro,
    toastError,
  ]);

  useEffect(() => {
    if (!selectedPedidoId || detailMode !== "edit") return;
    loadCatalogo();
  }, [selectedPedidoId, detailMode, loadCatalogo]);

  useEffect(() => {
    setCatalogPage(1);
  }, [selectedPedidoId]);

  const handleFilterChange: ProductFilterChangeHandler = (field, value) => {
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
    setCatalogPage(1);
  };

  const clearCatalogFilters = () => {
    setBuscaFiltro("");
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
    setDetailMode("edit");
  }, [appliedDe, appliedAte, appliedUsuarioFiltro, appliedStatusFiltro]);

  const fecharDetalhes = () => {
    setSelectedPedidoId(null);
    setDetalhe(null);
    setEditorItens([]);
    setDetailError(null);
    setDetailMode("edit");
  };

  const updateItemQuantity = (codigo: string, quantidade: number) => {
    if (!canEditPedido || detailMode !== "edit") return;
    setEditorItens((prev) => {
      return prev
        .map((item) => {
          if (item.codigo !== codigo) return item;
          const minimo = resolveMinQty(item.minQty, minQtyPadrao);
          const desejada = Number.isFinite(quantidade) ? quantidade : item.quantidade;
          const normalizado = normalizeQuantityToMultiple(desejada, minimo, item.quantidade);
          return { ...item, quantidade: normalizado };
        })
        .filter((item) => item.quantidade > 0);
    });
  };

  const removeItem = (codigo: string) => {
    if (!canEditPedido || detailMode !== "edit") return;
    setEditorItens((prev) => prev.filter((item) => item.codigo !== codigo));
  };

  const addProduto = (produto: Produto) => {
    if (!canEditPedido || detailMode !== "edit") return;
    setEditorItens((prev) => {
      const min = minQtyFor(produto, minQtyPadrao);
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
    if (!selectedPedidoId || !canEditPedido || detailMode !== "edit") return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        unidadeEntregaId,
        itens: editorItens.map((item) => ({
          produtoCodigo: item.codigo,
          quantidade: item.quantidade,
        })),
      };
      const response = await api.put<PedidoDetalhe>(`/pedidos/${selectedPedidoId}`, payload);
      success("Pedido atualizado", "As alterações foram salvas com sucesso.");
      await loadPedidos();
      await loadPedidoDetalhe(selectedPedidoId, "edit");
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

    const limitePesoFormatado = formatPeso(limiteMensalKg, "kg", { unit: "kg" });
    const consumoPesoFormatado = formatPeso(resumo.totalConsumidoKg, "kg", { unit: "kg" });
    const pedidosUtilizados = Math.max(0, Math.min(resumo.pedidosUtilizados, resumo.limitePedidos));
    const pedidosDisponiveis = Math.max(0, resumo.limitePedidos - pedidosUtilizados);
    const limiteInfoText = limiteMensalKg > 0
      ? `${pesoProgressPerc}% do limite mensal de ${limitePesoFormatado}`
      : "Limite mensal não configurado.";

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
          <div className="mt-2 text-xs text-gray-500">{limiteInfoText}</div>
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
      {cancelConfirmPedido && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancelar-pedido-title"
          aria-describedby="cancelar-pedido-description"
          onClick={closeCancelModal}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4 border-b border-gray-100 px-6 py-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <h2 id="cancelar-pedido-title" className="text-lg font-semibold text-gray-900">
                  Cancelar pedido
                </h2>
                <p id="cancelar-pedido-description" className="text-sm text-gray-600">
                  Tem certeza de que deseja cancelar o pedido {" "}
                  <span className="font-semibold text-gray-900">#{cancelConfirmPedido.id.slice(0, 8)}</span>? Essa ação não pode ser desfeita e o pedido não poderá mais ser editado.
                </p>
              </div>
            </div>
            <div className="space-y-3 px-6 py-5 text-sm text-gray-600">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-gray-500">Data</span>
                <span className="font-semibold text-gray-900">{formatDateTimePtBr(cancelConfirmPedido.dataHora)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-gray-500">Solicitante</span>
                <span className="font-semibold text-gray-900">{cancelConfirmPedido.usuarioNome}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-gray-500">Peso total</span>
                <span className="font-semibold text-gray-900">{formatPeso(cancelConfirmPedido.pesoTotalKg, "kg", { unit: "kg" })}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-gray-500">Valor total</span>
                <span className="font-semibold text-gray-900">{formatCurrencyBRL(cancelConfirmPedido.total)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={confirmingCancel}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Manter pedido
              </button>
              <button
                type="button"
                onClick={confirmarCancelamento}
                disabled={confirmingCancel || cancellingId === cancelConfirmPedido.id}
                className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {confirmingCancel || cancellingId === cancelConfirmPedido.id ? "Cancelando..." : "Cancelar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
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
        empresaId={empresaFiltro}
        onChangeEmpresaId={setEmpresaFiltro}
        empresaOptions={empresaOptions}
        onApply={aplicarFiltros}
        applyLabel={listLoading ? "Buscando..." : "Buscar"}
        disabled={listLoading || statusLoading || empresasLoading}
      >
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={limparFiltros}
            className="rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={listLoading || statusLoading}
          >
            Limpar filtros
          </button>
        ) : null}
      </DateUserFilters>

      {renderIndicadores()}

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Histórico</h2>
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
                <thead className="bg-[#E9E9E9]">
                  <tr className="h-[49px]">
                    <th className="px-4 text-left text-xs font-bold uppercase tracking-wide text-black align-middle">Código</th>
                    <th className="px-4 text-left text-xs font-bold uppercase tracking-wide text-black align-middle">Data</th>
                    <th className="px-4 text-left text-xs font-bold uppercase tracking-wide text-black align-middle">Colaborador</th>
                    <th className="px-4 text-center text-xs font-bold uppercase tracking-wide text-black align-middle">Status</th>
                    <th className="px-4 text-right text-xs font-bold uppercase tracking-wide text-black align-middle">Peso (kg)</th>
                    <th className="px-4 text-center text-xs font-bold uppercase tracking-wide text-black align-middle">Total</th>
                    <th className="px-4 text-center text-xs font-bold uppercase tracking-wide text-black align-middle">Editar</th>
                    <th className="px-4 text-center text-xs font-bold uppercase tracking-wide text-black align-middle">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pedidos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
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
                      const isEditandoAtual = isSelecionado && detailMode === "edit";
                      const isVisualizandoAtual = isSelecionado && detailMode === "view";
                      const statusStyle =
                        STATUS_BADGE_STYLES[pedido.statusId] ?? {
                          background: "#E5E7EB",
                          color: "#1F2937",
                        };
                      const verLabel = isAbrindo
                        ? "Abrindo..."
                        : isVisualizandoAtual
                          ? "Visualizando"
                          : "Ver";

                      return (
                        <tr key={pedido.id} className={linhaClasse}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">{pedido.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDateTimePtBr(pedido.dataHora)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div>{pedido.usuarioNome}</div>
                            {pedido.usuarioCpf && <div className="text-xs text-gray-400">CPF: {pedido.usuarioCpf}</div>}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span
                              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                              style={{ backgroundColor: statusStyle.background, color: statusStyle.color }}
                            >
                              {pedido.statusNome}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">{formatPeso(pedido.pesoTotalKg, "kg", { unit: "kg" })}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrencyBRL(pedido.total)}</td>
                          <td className="px-4 py-3 text-center">
                            {podeEditarConteudo ? (
                              <button
                                type="button"
                                className={`inline-flex h-9 w-9 items-center justify-center text-[#878787] transition hover:bg-[#FF6900]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF6900] focus-visible:outline-offset-2 ${
                                  isEditandoAtual ? "bg-[#FF6900]/10" : ""
                                }`}
                                onClick={() => loadPedidoDetalhe(pedido.id, "edit")}
                                disabled={isAbrindo}
                                aria-label={isEditandoAtual ? "Editando pedido" : "Editar pedido"}
                              >
                                <FilePenLine className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : (
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-gray-300">
                                <FilePenLine className="h-4 w-4" aria-hidden="true" />
                                <span className="sr-only">Edição indisponível</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {mostraAprovar && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 rounded-full border border-[#EDECE5] px-4 py-2 text-sm font-semibold text-[#16A34A] transition hover:bg-[#16A34A]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16A34A] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  onClick={() => aprovarPedido(pedido.id)}
                                  disabled={approvingId === pedido.id || cancellingId === pedido.id}
                                >
                                  <Check className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />
                                  {approvingId === pedido.id ? "Aprovando..." : "Aprovar"}
                                </button>
                              )}
                              {mostraCancelar && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 rounded-full border border-[#EDECE5] px-4 py-2 text-sm font-semibold text-[#DC2626] transition hover:bg-[#DC2626]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#DC2626] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  onClick={() => solicitarCancelamento(pedido)}
                                  disabled={
                                    cancellingId === pedido.id || approvingId === pedido.id || (!isAdmin && !editWindowActive)
                                  }
                                >
                                  <X className="h-4 w-4 text-[#DC2626]" aria-hidden="true" />
                                  {cancellingId === pedido.id ? "Cancelando..." : "Cancelar"}
                                </button>
                              )}
                              <button
                                type="button"
                                className={`inline-flex items-center gap-2 rounded-full border border-[#EDECE5] px-4 py-2 text-sm font-semibold text-[#FF6900] transition hover:bg-[#FF6900]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF6900] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                                  isVisualizandoAtual ? "bg-[#FF6900]/10" : ""
                                }`}
                                onClick={() => loadPedidoDetalhe(pedido.id, "view")}
                                disabled={isAbrindo}
                              >
                                <ArrowUpRight className="h-4 w-4 text-[#FF6900]" aria-hidden="true" />
                                {verLabel}
                              </button>
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
            <div className="mb-4 flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">{painelTitulo}</h2>
                {pedidoSelecionado && (
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium text-gray-800">Código:</span>{" "}
                      <span className="text-gray-700">{pedidoSelecionado.id}</span>{" · "}
                      <span className="font-medium text-gray-800">Colaborador:</span>{" "}
                      <span className="text-gray-700">{pedidoSelecionado.usuarioNome}</span>
                    </p>
                    <p>
                      Pedido realizado em {formatDateTimePtBr(pedidoSelecionado.dataHora)} · Unidade atual: {pedidoSelecionado.unidadeEntregaNome}
                      {pedidoSelecionado.empresaNome ? ` · Empresa: ${pedidoSelecionado.empresaNome}` : ""}
                    </p>
                  </div>
                )}
              </div>
              {!isViewMode && !isAdmin && !editWindowActive && pedidoSelecionado?.statusId !== STATUS_CANCELADO && (
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
              <div className={`grid gap-6 ${effectiveCanEdit ? "lg:grid-cols-2" : ""}`}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Empresa</label>
                    {effectiveCanEdit ? (
                      <select
                        value={empresaIdEditor}
                        onChange={(event) => {
                          setEmpresaIdEditor(event.target.value);
                          setUnidadeEntregaId("");
                        }}
                        disabled={empresasLoading || !effectiveCanEdit || saving}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Selecione</option>
                        {empresas.map((empresa) => (
                          <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>
                        ))}
                        {!empresas.find((empresa) => empresa.id === empresaIdEditor) && empresaIdEditor && (
                          <option value={empresaIdEditor}>{empresaSelecionadaNome || empresaIdEditor}</option>
                        )}
                      </select>
                    ) : (
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                        {empresaSelecionadaNome || "Não informado"}
                      </div>
                    )}
                    {empresasError && (
                      <p className="text-xs text-red-600">{empresasError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Unidade de entrega</label>
                    {effectiveCanEdit ? (
                      <select
                        value={unidadeEntregaId}
                        onChange={(event) => setUnidadeEntregaId(event.target.value)}
                        disabled={unidadesLoading || !effectiveCanEdit || saving || !empresaIdEditor}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {unidadesEntrega.map((unidade) => (
                          <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
                        ))}
                        {!unidadeSelecionadaOption && unidadeEntregaId && (
                          <option value={unidadeEntregaId}>{unidadeSelecionadaNome || unidadeEntregaId}</option>
                        )}
                      </select>
                    ) : (
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                        {unidadeSelecionadaNome || pedidoSelecionado.unidadeEntregaNome || "Não informado"}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 md:hidden">
                    {editorItens.length === 0 ? (
                      <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-500 text-center">
                        Nenhum item no pedido.
                      </div>
                    ) : (
                      editorItens.map((item) => {
                        const minStep = resolveMinQty(item.minQty, minQtyPadrao);
                        const inputId = `pedido-item-quantidade-${item.codigo}`.replace(/[^a-zA-Z0-9_-]/g, "-");
                        return (
                          <div key={item.codigo} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="space-y-2 text-sm">
                              <div>
                                <div className="font-medium text-gray-900">{item.descricao}</div>
                                <div className="text-xs text-gray-500">{item.codigo}</div>
                                <div className="text-xs text-gray-400">Preço: {formatCurrencyBRL(item.preco)} · Peso unitário: {formatPeso(item.pesoKg, "kg", { unit: "kg" })}</div>
                                {minStep > 0 && (
                                  <div className="text-xs text-amber-600">Mínimo por adição: {minStep}</div>
                                )}
                              </div>
                              {effectiveCanEdit ? (
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor={inputId}>
                                    Quantidade
                                  </label>
                                  <input
                                    id={inputId}
                                    type="number"
                                    min={minStep}
                                    step={minStep}
                                    value={item.quantidade}
                                    onChange={(event) => updateItemQuantity(item.codigo, Number(event.target.value))}
                                    disabled={!effectiveCanEdit || saving}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-right text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                  <span>Quantidade</span>
                                  <span className="font-semibold text-gray-900">{item.quantidade}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-semibold text-gray-800">{formatCurrencyBRL(item.preco * item.quantidade)}</span>
                              </div>
                            </div>
                            {effectiveCanEdit && (
                              <div className="mt-3 flex justify-end">
                                <button
                                  className="text-xs px-3 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => removeItem(item.codigo)}
                                  disabled={!effectiveCanEdit || saving}
                                >
                                  Remover
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-[520px] w-full divide-y divide-gray-200">
                      <thead className="bg-[#E9E9E9]">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">Produto</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-700">Quantidade</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-700">Subtotal</th>
                          {effectiveCanEdit && <th className="px-3 py-2" />}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {editorItens.length === 0 ? (
                          <tr>
                            <td colSpan={effectiveCanEdit ? 4 : 3} className="px-3 py-4 text-center text-sm text-gray-500">Nenhum item no pedido.</td>
                          </tr>
                        ) : (
                          editorItens.map((item) => {
                            const minStep = resolveMinQty(item.minQty, minQtyPadrao);
                            return (
                              <tr key={item.codigo}>
                                <td className="px-3 py-2 text-sm text-gray-700">
                                  <div className="font-medium text-gray-800">{item.descricao}</div>
                                  <div className="text-xs text-gray-500">{item.codigo}</div>
                                  <div className="text-xs text-gray-400">Preço: {formatCurrencyBRL(item.preco)} · Peso unitário: {formatPeso(item.pesoKg, "kg", { unit: "kg" })}</div>
                                  {minStep > 0 && (
                                    <div className="text-xs text-amber-600">Mínimo por adição: {minStep}</div>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right text-sm text-gray-700">
                                  {effectiveCanEdit ? (
                                    <input
                                      type="number"
                                      min={minStep}
                                      step={minStep}
                                      value={item.quantidade}
                                      onChange={(event) => updateItemQuantity(item.codigo, Number(event.target.value))}
                                      disabled={!effectiveCanEdit || saving}
                                      className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm text-right shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                  ) : (
                                    <span className="font-semibold text-gray-900">{item.quantidade}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right text-sm text-gray-700">
                                  {formatCurrencyBRL(item.preco * item.quantidade)}
                                </td>
                                {effectiveCanEdit && (
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                      onClick={() => removeItem(item.codigo)}
                                      disabled={!effectiveCanEdit || saving}
                                    >
                                      Remover
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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

                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Histórico de alterações</h3>
                    {renderHistorico()}
                  </div>

                  {effectiveCanEdit ? (
                    <>
                      {saveError && <div className="text-sm text-red-600">{saveError}</div>}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <button
                          type="button"
                          className="w-full rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                          onClick={fecharDetalhes}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="w-full rounded-full bg-[#FF6900] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#FF6900]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                          onClick={salvarAlteracoes}
                          disabled={!effectiveCanEdit || saving || editorItens.length === 0 || !empresaIdEditor || !unidadeEntregaId}
                        >
                          {saving ? "Salvando..." : "Salvar alterações"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        onClick={fecharDetalhes}
                      >
                        Fechar
                      </button>
                    </div>
                  )}
                </div>

                {effectiveCanEdit && (
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
                        wrapOnLarge
                      />
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 sm:flex-row sm:items-center sm:justify-between">
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
                            const minimoProduto = minQtyFor(produto, minQtyPadrao);
                            return (
                              <div key={produto.codigo} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                  <div className="font-medium text-gray-800">{produto.descricao}</div>
                                  <div className="text-xs text-gray-500">Código: {produto.codigo}</div>
                                  <div className="text-xs text-gray-400">
                                    Peso unitário: {formatPeso(pesoUnit, "kg", { unit: "kg" })} · Mínimo: {minimoProduto} unidade(s)
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-semibold text-indigo-600">{formatCurrencyBRL(produto.preco)}</div>
                                  <button
                                    className="px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 text-sm hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => addProduto(produto)}
                                    disabled={!effectiveCanEdit || saving}
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
                        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
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
                  </div>
                )}
                
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
