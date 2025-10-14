import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";
import { formatCurrencyBRL, formatPeso } from "../lib/format";
import { ProductFilters, type ProductFilterChangeHandler, type ProductFilterOptions, type ProductFilterSelectOption, type ProductFilterValues } from "../components/ProductFilters";
import type { Produto } from "../cart/types";
import { minQtyFor, toKg } from "../cart/calc";
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

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonth(value: string) {
  const [yearStr, monthStr] = value.split("-");
  const year = Number(yearStr) || new Date().getFullYear();
  const monthIndex = (Number(monthStr) || 1) - 1;
  return {
    year,
    monthIndex: Math.min(Math.max(monthIndex, 0), 11),
    monthNumber: Math.min(Math.max(Number(monthStr) || 1, 1), 12),
  };
}

function monthDateRange(value: string) {
  const { year, monthIndex } = parseMonth(value);
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  return {
    de: start.toISOString(),
    ate: end.toISOString(),
  };
}

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

  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue());
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

  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<PedidoDetalheCompleto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

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
    const now = new Date();
    const day = now.getDate();
    return day >= 15 && day <= 20;
  }, [isAdmin]);

  const monthRange = useMemo(() => monthDateRange(selectedMonth), [selectedMonth]);
  const parsedMonth = useMemo(() => parseMonth(selectedMonth), [selectedMonth]);

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

  const progressPerc = useMemo(() => {
    if (!resumo || resumo.limiteKg <= 0) return 0;
    return Math.min(100, Math.round((resumo.totalConsumidoKg / resumo.limiteKg) * 100));
  }, [resumo]);

  const loadPedidos = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const params = {
        page,
        pageSize,
        de: monthRange.de,
        ate: monthRange.ate,
      };
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
  }, [page, pageSize, monthRange.de, monthRange.ate]);

  const loadResumo = useCallback(async () => {
    setResumoLoading(true);
    setResumoError(null);
    try {
      const response = await api.get<PedidoResumoMensal>("/pedidos/resumo-mensal", {
        params: {
          ano: parsedMonth.year,
          mes: parsedMonth.monthNumber,
        },
      });
      setResumo(response.data);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || "Não foi possível carregar o resumo do mês.";
      setResumoError(msg);
      setResumo(null);
    } finally {
      setResumoLoading(false);
    }
  }, [parsedMonth.year, parsedMonth.monthNumber]);

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
    try {
      const response = await api.get<PedidoDetalheCompleto>(`/pedidos/${id}`);
      const data = response.data;
      setDetalhe(data);
      setSelectedPedidoId(id);
      setEditorItens(
        data.pedido.itens.map((item) => ({
          codigo: item.produtoCodigo,
          descricao: item.descricao,
          preco: item.preco,
          quantidade: item.quantidade,
          pesoKg: item.pesoKg,
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
    }
  }, []);

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
  }, [selectedMonth]);

  const updateItemQuantity = (codigo: string, quantidade: number) => {
    if (!editWindowActive) return;
    setEditorItens((prev) => {
      return prev
        .map((item) =>
          item.codigo === codigo
            ? { ...item, quantidade: Math.max(0, Math.floor(Number.isFinite(quantidade) ? quantidade : item.quantidade)) }
            : item
        )
        .filter((item) => item.quantidade > 0);
    });
  };

  const removeItem = (codigo: string) => {
    if (!editWindowActive) return;
    setEditorItens((prev) => prev.filter((item) => item.codigo !== codigo));
  };

  const addProduto = (produto: Produto) => {
    if (!editWindowActive) return;
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
    if (!selectedPedidoId) return;
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
      setPedidos((prev) =>
        prev.map((p) => (p.id === atualizado.id ? { ...p, ...atualizado } : p))
      );
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || "Falha ao salvar as alterações.";
      setSaveError(msg);
      toastError("Não foi possível salvar", msg);
    } finally {
      setSaving(false);
    }
  };

  const resumoCards = () => {
    if (resumoLoading) {
      return (
        <div className="bg-white p-6 rounded-xl shadow text-sm text-gray-500">Carregando resumo...</div>
      );
    }
    if (resumoError) {
      return (
        <div className="bg-white p-6 rounded-xl shadow text-sm text-red-600">{resumoError}</div>
      );
    }
    if (!resumo) {
      return null;
    }

    const limiteFormatado = formatPeso(resumo.limiteKg, "kg", { unit: "kg" });
    const consumoFormatado = formatPeso(resumo.totalConsumidoKg, "kg", { unit: "kg" });

    return (
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <div className="text-sm text-gray-500">Consumo de peso (kg)</div>
          <div className="mt-1 text-2xl font-semibold">{consumoFormatado}</div>
          <div className="mt-3 h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${progressPerc}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {progressPerc}% do limite mensal de {limiteFormatado}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <div className="text-sm text-gray-500">Total em reais (mês)</div>
          <div className="mt-1 text-2xl font-semibold">{formatCurrencyBRL(resumo.totalValor)}</div>
          <div className="mt-2 text-xs text-gray-500">{resumo.totalPedidos} pedido(s)</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <div className="text-sm text-gray-500">Total de itens</div>
          <div className="mt-1 text-2xl font-semibold">{resumo.totalItens}</div>
          <div className="mt-2 text-xs text-gray-500">Incluindo todas as quantidades do mês selecionado</div>
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
              <span>{h.usuarioNome || "Sistema"}</span>
            </div>
            {h.detalhes && (
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                {h.detalhes.unidadeEntregaAnterior !== h.detalhes.unidadeEntregaAtual && (
                  <div>
                    Unidade de entrega: <strong>{h.detalhes.unidadeEntregaAnterior || "—"}</strong> → <strong>{h.detalhes.unidadeEntregaAtual || "—"}</strong>
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

  const pedidoSelecionado = detalhe?.pedido;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos</h1>
          <p className="text-sm text-gray-600">Visualize e edite os pedidos do mês selecionado.</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="mes" className="text-sm text-gray-600">Mês</label>
          <input
            id="mes"
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {resumoCards()}

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pedidos do mês</h2>
          <div className="text-xs text-gray-500">Total: {totalItems}</div>
        </div>
        {listLoading ? (
          <div className="p-6 text-sm text-gray-500">Carregando pedidos...</div>
        ) : listError ? (
          <div className="p-6 text-sm text-red-600">{listError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Colaborador</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Peso (kg)</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      Nenhum pedido encontrado para o período selecionado.
                    </td>
                  </tr>
                ) : (
                  pedidos.map((pedido) => (
                    <tr key={pedido.id} className={selectedPedidoId === pedido.id ? "bg-indigo-50/50" : "bg-white"}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{pedido.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDateTimePtBr(pedido.dataHora)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{pedido.usuarioNome}</div>
                        {pedido.usuarioCpf && <div className="text-xs text-gray-400">CPF: {pedido.usuarioCpf}</div>}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">{formatPeso(pedido.pesoTotalKg, "kg", { unit: "kg" })}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrencyBRL(pedido.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          className="px-3 py-1.5 text-sm rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                          onClick={() => loadPedidoDetalhe(pedido.id)}
                          disabled={detailLoading && selectedPedidoId === pedido.id}
                        >
                          {detailLoading && selectedPedidoId === pedido.id ? "Abrindo..." : "Editar"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <button
              className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Anterior
            </button>
            <div>Pagina {page} de {totalPages}</div>
            <button
              className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {selectedPedidoId && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Editar pedido</h2>
                {pedidoSelecionado && (
                  <p className="text-sm text-gray-600">
                    Pedido realizado em {formatDateTimePtBr(pedidoSelecionado.dataHora)} · Unidade atual: {pedidoSelecionado.unidadeEntrega}
                  </p>
                )}
              </div>
              {!editWindowActive && (
                <div className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm max-w-md">
                  As edições estão disponíveis apenas entre os dias 15 e 20 de cada mês para colaboradores.
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
                      disabled={unidadesLoading || !editWindowActive || saving}
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
                                  min={0}
                                  value={item.quantidade}
                                  onChange={(event) => updateItemQuantity(item.codigo, Number(event.target.value))}
                                  disabled={!editWindowActive || saving}
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
                                  disabled={!editWindowActive || saving}
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
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-50"
                      onClick={salvarAlteracoes}
                      disabled={!editWindowActive || saving || editorItens.length === 0 || !unidadeEntrega}
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
                                  disabled={!editWindowActive || saving}
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
