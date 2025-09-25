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
import { formatCpf } from "../lib/cpf";

// ---------------------- Component ---------------------- //
export default function Relatorios() {
  // filtros
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [de, setDe]   = useState<string>(() => formatDateBR(thirtyDaysAgo));
  const [ate, setAte] = useState<string>(() => formatDateBR(now));
  const [buscaUsuario, setBuscaUsuario] = useState<string>("");

  // dados & estados
  const [pedidos, setPedidos] = useState<PedidoDetalhe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expand, setExpand] = useState<Record<string, boolean>>({}); // pedidoId -> expandido

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      const deIso = startOfDayISO_BR(de);
      const ateIso = endOfDayISO_BR(ate);

      if (!deIso || !ateIso) {
        setError("Datas inválidas. Use o formato dd/mm/aaaa.");
        setLoading(false);
        return;
      }

      params.de = deIso;
      params.ate = ateIso;

      const r = await api.get<PedidoDetalhe[]>("/relatorios/pedidos/detalhes", { params });
      setPedidos(r.data);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || e?.message || "Falha ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  }, [de, ate]);

  useEffect(() => {
    // carrega ao montar
    carregar();
  }, [carregar]);

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

  const exportarCSV = useCallback(() => {
    const header = [
      "UsuarioId",
      "UsuarioNome",
      "UsuarioCpf",
      "PedidoId",
      "DataHora",
      "UnidadeEntrega",
      "ItemCodigo",
      "ItemDescricao",
      "Quantidade",
      "PrecoUnit",
      "Subtotal",
      "PesoItemKg",
      "PesoTotalItemKg",
      "TotalPedido",
      "PesoTotalPedidoKg",
    ];

    const rows: string[] = [];
    for (const g of grupos) {
      for (const p of g.lista) {
        for (const it of p.itens) {
          rows.push(
            [
              g.usuarioId,
              g.usuarioNome,
              formatCpf(g.usuarioCpf),
              p.id,
              formatDateBR(new Date(p.dataHora)),
              p.unidadeEntrega,
              it.produtoCodigo,
              it.descricao,
              String(it.quantidade),
              String(it.preco).replace(".", ","),
              String(it.subtotal).replace(".", ","),
              formatPeso(it.pesoKg, "kg", { unit: "kg", unitSuffix: false, useGrouping: false }),
              formatPeso(it.pesoTotalKg, "kg", { unit: "kg", unitSuffix: false, useGrouping: false }),
              String(p.total).replace(".", ","),
              formatPeso(p.pesoTotalKg, "kg", { unit: "kg", unitSuffix: false, useGrouping: false }),
            ]
              .map((v) => `"${String(v).replaceAll('"', '""')}"`)
              .join(",")
          );
        }
      }
    }

    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [grupos]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Relatórios · Pedidos por usuário</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end bg-white p-4 rounded-xl shadow">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">De</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            value={de}
            onChange={(e) => setDe(e.target.value)}
            className="border rounded-lg px-3 py-2 w-[160px]"
            aria-label="Data inicial no formato dia/mês/ano"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Até</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            value={ate}
            onChange={(e) => setAte(e.target.value)}
            className="border rounded-lg px-3 py-2 w-[160px]"
            aria-label="Data final no formato dia/mês/ano"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600">Usuário (contém)</label>
          <input
            type="text"
            placeholder="Nome do usuário"
            value={buscaUsuario}
            onChange={(e) => setBuscaUsuario(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-[240px]"
          />
        </div>
        <button
          onClick={carregar}
          className="ml-auto px-4 py-2 rounded-xl border shadow hover:bg-gray-50"
          disabled={loading}
        >
          {loading ? "Carregando..." : "Buscar"}
        </button>
        <button
          onClick={exportarCSV}
          className="px-4 py-2 rounded-xl border shadow hover:bg-gray-50"
          disabled={!grupos.length}
        >
          Exportar CSV
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}

      {/* Conteúdo */}
      <div className="space-y-6">
        {grupos.map((g) => (
          <div key={g.usuarioId} className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">{g.usuarioNome}</div>
                <div className="text-sm text-gray-500">ID: {g.usuarioId}</div>
                <div className="text-sm text-gray-500">CPF: {g.usuarioCpf ? formatCpf(g.usuarioCpf) : "Não informado"}</div>
              </div>
              <div className="text-sm text-gray-700 flex gap-4">
                <span>
                  <strong>{g.totalPedidos}</strong> pedido(s)
                </span>
                <span>
                  Total: <strong>{formatCurrencyBRL(g.totalValor)}</strong>
                </span>
                <span>
                  Peso: <strong>{formatPeso(g.totalPeso, "kg", { unit: "kg" })}</strong>
                </span>
              </div>
            </div>

            {/* Tabela de pedidos do usuário */}
            <div className="overflow-auto">
              <table className="min-w-[900px] w-full">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="px-4 py-2">Data</th>
                    <th className="px-4 py-2">Unidade</th>
                    <th className="px-4 py-2">Itens</th>
                    <th className="px-4 py-2">Total (R$)</th>
                    <th className="px-4 py-2">Peso (kg)</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {g.lista.map((p) => (
                    <React.Fragment key={p.id}>
                      <tr className="border-t">
                        <td className="px-4 py-2 whitespace-nowrap">{formatDateBR(new Date(p.dataHora))}</td>
                        <td className="px-4 py-2">{p.unidadeEntrega}</td>
                        <td className="px-4 py-2">{p.itens.length}</td>
                        <td className="px-4 py-2">{formatCurrencyBRL(p.total)}</td>
                        <td className="px-4 py-2">{formatPeso(p.pesoTotalKg, "kg", { unit: "kg", unitSuffix: false })}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-50"
                            onClick={() => toggle(p.id)}
                            aria-expanded={!!expand[p.id]}
                            aria-controls={`itens-${p.id}`}
                          >
                            {expand[p.id] ? "Ocultar itens" : "Ver itens"}
                          </button>
                        </td>
                      </tr>
                      {expand[p.id] && (
                        <tr id={`itens-${p.id}`} className="border-t bg-gray-50">
                          <td colSpan={6} className="px-0">
                            <div className="px-4 py-3">
                              <div className="font-medium mb-2">Itens do pedido</div>
                              <table className="min-w-[860px] w-full text-sm">
                                <thead>
                                  <tr className="text-left">
                                    <th className="px-3 py-2">Código</th>
                                    <th className="px-3 py-2">Descrição</th>
                                    <th className="px-3 py-2">Qtd</th>
                                    <th className="px-3 py-2">Preço (R$)</th>
                                    <th className="px-3 py-2">Subtotal (R$)</th>
                                    <th className="px-3 py-2">Peso un. (kg)</th>
                                    <th className="px-3 py-2">Peso total (kg)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.itens.map((it, idx) => (
                                    <tr key={`${p.id}-${it.produtoCodigo}-${idx}`} className="border-t">
                                      <td className="px-3 py-2 whitespace-nowrap">{it.produtoCodigo}</td>
                                      <td className="px-3 py-2">{it.descricao}</td>
                                      <td className="px-3 py-2">{it.quantidade}</td>
                                      <td className="px-3 py-2">{formatCurrencyBRL(it.preco)}</td>
                                      <td className="px-3 py-2">{formatCurrencyBRL(it.subtotal)}</td>
                                      <td className="px-3 py-2">{formatPeso(it.pesoKg, "kg", { unit: "kg", unitSuffix: false })}</td>
                                      <td className="px-3 py-2">{formatPeso(it.pesoTotalKg, "kg", { unit: "kg", unitSuffix: false })}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {!loading && !grupos.length && (
          <div className="text-center text-gray-500">Nenhum resultado no período selecionado.</div>
        )}
      </div>
    </div>
  );
}
