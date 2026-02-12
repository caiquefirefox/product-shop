import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import type { PedidoDetalhe, Item } from "../report/types";
import {
  formatCurrencyBRL,
  formatDateBR,
  formatPeso,
  startOfDayISO_BR,
  endOfDayISO_BR,
} from "../lib/format";
import { DateUserFilters, type SimpleOption } from "../components/DateUserFilters";
import { formatCpf } from "../lib/cpf";
import { getStatusBadgeStyle } from "../pedidos/statusStyles";

type EmpresaOption = { id: string; nome: string };

// ---------------------- Component ---------------------- //
export default function Relatorios() {
  // filtros
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [de, setDe]   = useState<string>(() => formatDateBR(thirtyDaysAgo));
  const [ate, setAte] = useState<string>(() => formatDateBR(now));
  const [buscaUsuario, setBuscaUsuario] = useState<string>("");
  const [statusId, setStatusId] = useState<string>("");
  const [statusOptions, setStatusOptions] = useState<SimpleOption[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [empresaId, setEmpresaId] = useState<string>("");
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [empresasLoading, setEmpresasLoading] = useState(false);
  const [empresasErro, setEmpresasErro] = useState<string | null>(null);
  const empresaOptions = useMemo(
    () => empresas.map((empresa) => ({ value: empresa.id, label: empresa.nome })),
    [empresas],
  );

  // dados & estados
  const [pedidos, setPedidos] = useState<PedidoDetalhe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expand, setExpand] = useState<Record<string, boolean>>({}); // pedidoId -> expandido
  const [exportando, setExportando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      const deIso = startOfDayISO_BR(de);
      const ateIso = endOfDayISO_BR(ate);

      if (!deIso || !ateIso) {
        setError("Datas inválidas. Use o formato dd/mm/aaaa.");
        setPedidos([]);
        setLoading(false);
        return;
      }

      params.de = deIso;
      params.ate = ateIso;

      if (statusId) {
        params.statusId = statusId;
      }

      if (empresaId) {
        params.empresaId = empresaId;
      }

      const r = await api.get<PedidoDetalhe[]>("/relatorios/pedidos/detalhes", { params });
      setPedidos(r.data);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || e?.message || "Falha ao carregar relatórios");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [ate, de, empresaId, statusId]);

  useEffect(() => {
    // carrega ao montar
    carregar();
  }, [carregar]);

  useEffect(() => {
    let vivo = true;
    setStatusLoading(true);

    type PedidoStatusResponse = { id: number; nome: string };

    api
      .get<PedidoStatusResponse[]>("/pedidos/status")
      .then((response) => {
        if (!vivo) return;
        const options = (response.data || []).map((item) => ({
          value: String(item.id),
          label: item.nome,
        }));
        setStatusOptions(options);
      })
      .catch(() => {
        if (!vivo) return;
        setStatusOptions([]);
      })
      .finally(() => {
        if (!vivo) return;
        setStatusLoading(false);
      });

    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    let vivo = true;
    setEmpresasLoading(true);
    setEmpresasErro(null);

    api
      .get<EmpresaOption[]>("/empresas")
      .then((response) => {
        if (!vivo) return;
        setEmpresas(response.data || []);
      })
      .catch((error: any) => {
        if (!vivo) return;
        const msg = error?.response?.data?.detail || error?.message || "Falha ao carregar empresas";
        setEmpresasErro(msg);
        setEmpresas([]);
      })
      .finally(() => {
        if (!vivo) return;
        setEmpresasLoading(false);
      });

    return () => {
      vivo = false;
    };
  }, []);

  // agrupamento por usuário (nome)
  const grupos = useMemo(() => {
    const grouped = new Map<string, { usuarioNome: string; usuarioCpf: string | null; lista: PedidoDetalhe[] }>();
    const filtro = buscaUsuario.trim().toLowerCase();
    for (const p of pedidos) {
      if (filtro) {
        const nomeMatch = p.usuarioNome.toLowerCase().includes(filtro);
        const cpfDigits = (p.usuarioCpf ?? "").toLowerCase();
        const cpfFormatado = formatCpf(p.usuarioCpf).toLowerCase();
        if (!nomeMatch && !cpfDigits.includes(filtro) && !cpfFormatado.includes(filtro)) continue;
      }

      const existente = grouped.get(p.usuarioId);
      if (!existente) {
        grouped.set(p.usuarioId, { usuarioNome: p.usuarioNome, usuarioCpf: p.usuarioCpf ?? null, lista: [p] });
      } else {
        existente.lista.push(p);
        if (!existente.usuarioCpf && p.usuarioCpf) existente.usuarioCpf = p.usuarioCpf;
        if (p.usuarioNome && existente.usuarioNome !== p.usuarioNome) existente.usuarioNome = p.usuarioNome;
      }
    }
    return Array.from(grouped.entries()).map(([usuarioId, data]) => {
      const totalPedidos = data.lista.length;
      const totalValor = data.lista.reduce((acc, p) => acc + p.total, 0);
      const totalPeso = data.lista.reduce((acc, p) => acc + p.pesoTotalKg, 0);
      return {
        usuarioId,
        usuarioNome: data.usuarioNome,
        usuarioCpf: data.usuarioCpf,
        lista: data.lista,
        totalPedidos,
        totalValor,
        totalPeso,
      };
    });
  }, [pedidos, buscaUsuario]);

  const toggle = useCallback((id: string) => {
    setExpand((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const exportarExcel = useCallback(async () => {
    const params: Record<string, string> = {};
    const deIso = startOfDayISO_BR(de);
    const ateIso = endOfDayISO_BR(ate);

    if (!deIso || !ateIso) {
      setError("Datas inválidas. Use o formato dd/mm/aaaa.");
      return;
    }

    params.de = deIso;
    params.ate = ateIso;

    if (statusId) {
      params.statusId = statusId;
    }

    if (empresaId) {
      params.empresaId = empresaId;
    }

    setExportando(true);
    setError(null);

    try {
      const response = await api.get<Blob>("/relatorios/pedidos/excel", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-pedidos-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || e?.message || "Falha ao exportar relatório");
    } finally {
      setExportando(false);
    }
  }, [ate, de, empresaId, statusId]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>

      {/* Filtros */}
      <DateUserFilters
        de={de}
        ate={ate}
        onChangeDe={setDe}
        onChangeAte={setAte}
        usuario={buscaUsuario}
        onChangeUsuario={setBuscaUsuario}
        showUsuario
        statusId={statusId}
        onChangeStatusId={setStatusId}
        statusOptions={statusOptions}
        empresaId={empresaId}
        onChangeEmpresaId={setEmpresaId}
        empresaOptions={empresaOptions}
        onApply={carregar}
        applyLabel={loading ? "Carregando..." : "Buscar"}
        disabled={loading || statusLoading || empresasLoading}
      >
        <button
          type="button"
          onClick={exportarExcel}
          className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={exportando || !grupos.length}
        >
          {exportando ? "Exportando..." : "Exportar Excel"}
        </button>
      </DateUserFilters>

      {empresasErro && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {empresasErro}
        </div>
      )}

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}

      {/* Conteúdo */}
      <div className="space-y-6">
        {grupos.map((g) => {
          const cpfFormatado = g.usuarioCpf ? formatCpf(g.usuarioCpf) : "Não informado";
          return (
            <div
              key={g.usuarioId}
              className="overflow-hidden rounded-2xl border border-[#E9E9E9] bg-[#E9E9E9] shadow-sm"
            >
              <div className="border-b border-[#E9E9E9] bg-[#E9E9E9] px-5 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-semibold text-gray-900">
                      {`${g.usuarioNome} | CPF: ${cpfFormatado}`}
                    </div>
                    <div className="text-sm text-gray-500">ID: {g.usuarioId}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="grid grid-cols-3 gap-x-10 gap-y-1 text-left">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">PEDIDOS</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">TOTAL</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">PESO</span>
                      <span className="tabular-nums text-sm font-semibold text-gray-900">{g.totalPedidos}</span>
                      <span className="tabular-nums text-sm font-semibold text-gray-900">{formatCurrencyBRL(g.totalValor)}</span>
                      <span className="tabular-nums text-sm font-semibold text-gray-900">{formatPeso(g.totalPeso, "kg", { unit: "kg" })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de pedidos do usuário */}
              <div className="overflow-auto bg-white">
                <table className="min-w-[960px] w-full bg-white">
                  <tbody className="divide-y divide-gray-100">
                    {g.lista.map((p) => {
                      const itensCount = p.itens.length;
                      const itensLabel = itensCount === 1 ? "1 item" : `${itensCount} itens`;
                      const statusStyle = getStatusBadgeStyle(p.statusId);
                      return (
                        <React.Fragment key={p.id}>
                          <tr>
                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
                              {formatDateBR(new Date(p.dataHora))}
                            </td>
                                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">{p.empresaNome}</td>
                            <td className="px-5 py-4 text-sm">
                              <span
                                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                                style={{ backgroundColor: statusStyle.background, color: statusStyle.color }}
                              >
                                {p.statusNome}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">{itensLabel}</td>
                            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-gray-900">
                              {formatPeso(p.pesoTotalKg, "kg", { unit: "kg" })}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-gray-900">
                              {formatCurrencyBRL(p.total)}
                            </td>
                            <td className="px-5 py-4 text-right text-sm">
                              <button
                                type="button"
                                className="font-semibold text-[#FF6900] transition hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#FF6900]/40"
                                onClick={() => toggle(p.id)}
                                aria-expanded={!!expand[p.id]}
                                aria-controls={`itens-${p.id}`}
                              >
                                {expand[p.id] ? "Ocultar itens" : "Ver itens"}
                              </button>
                            </td>
                          </tr>
                          {expand[p.id] && (
                            <tr id={`itens-${p.id}`} className="bg-white">
                              <td colSpan={7} className="px-0">
                                <div className="bg-white px-5 py-4">
                                  <table className="min-w-[860px] w-full text-sm">
                                    <thead>
                                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        <th className="px-3 py-2">Código</th>
                                        <th className="px-3 py-2">Descrição</th>
                                        <th className="px-3 py-2">Qtd</th>
                                        <th className="px-3 py-2">Peso un. (kg)</th>
                                        <th className="px-3 py-2">Peso total (kg)</th>
                                        <th className="px-3 py-2">Valor un. (R$)</th>
                                        <th className="px-3 py-2">Total (R$)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {p.itens.map((it, idx) => (
                                        <tr key={`${p.id}-${it.produtoCodigo}-${idx}`} className="border-t border-gray-200">
                                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700">
                                            {it.produtoCodigo}
                                          </td>
                                          <td className="px-3 py-2 text-sm text-gray-700">{it.descricao}</td>
                                          <td className="px-3 py-2 text-sm text-gray-700">{it.quantidade}</td>
                                          <td className="px-3 py-2 text-sm text-gray-700">
                                            {formatPeso(it.pesoKg, "kg", { unit: "kg", unitSuffix: false })}
                                          </td>
                                          <td className="px-3 py-2 text-sm text-gray-700">
                                            {formatPeso(it.pesoTotalKg, "kg", { unit: "kg", unitSuffix: false })}
                                          </td>
                                          <td className="px-3 py-2 text-sm text-gray-700">
                                            {formatCurrencyBRL(it.preco)}
                                          </td>
                                          <td className="px-3 py-2 text-sm text-gray-700">
                                            {formatCurrencyBRL(it.subtotal)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {!loading && !grupos.length && (
          <div className="text-center text-gray-500">Nenhum resultado no período selecionado.</div>
        )}
      </div>
    </div>
  );
}
