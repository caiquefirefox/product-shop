import { useEffect, useState } from "react";
import api from "../lib/api";

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
  preco: number;
  quantidadeMinimaDeCompra: number;
};

type ProdutoOpcao = {
  id: string;
  nome: string;
};

export default function Produtos() {
  const [especies, setEspecies] = useState<ProdutoOpcao[]>([]);
  const [porteOpcoes, setPorteOpcoes] = useState<ProdutoOpcao[]>([]);
  const [tiposProduto, setTiposProduto] = useState<ProdutoOpcao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [peso, setPeso] = useState("1");
  const [tipoPeso, setTipoPeso] = useState(1);
  const [sabores, setSabores] = useState("");
  const [especieId, setEspecieId] = useState("");
  const [porteIds, setPorteIds] = useState<string[]>([]);
  const [tipoProdutoId, setTipoProdutoId] = useState("");
  const [preco, setPreco] = useState("0");
  const [quantidadeMinimaDeCompra, setQuantidadeMinimaDeCompra] = useState("1");

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

  const loadProdutos = async () => setProdutos((await api.get("/produtos")).data);
  const loadOpcoes = async () => {
    const [especiesResp, portesResp, tiposResp] = await Promise.all([
      api.get<ProdutoOpcao[]>("/produtos/especies"),
      api.get<ProdutoOpcao[]>("/produtos/portes"),
      api.get<ProdutoOpcao[]>("/produtos/tipos-produto"),
    ]);
    setEspecies(especiesResp.data);
    setPorteOpcoes(portesResp.data);
    setTiposProduto(tiposResp.data);
  };
  useEffect(() => {
    loadProdutos();
    loadOpcoes();
  }, []);

  useEffect(() => {
    setEspecieId(prev => {
      if (!especies.length) return "";
      return especies.some(opcao => opcao.id === prev) ? prev : especies[0].id;
    });
  }, [especies]);

  useEffect(() => {
    setTipoProdutoId(prev => {
      if (!tiposProduto.length) return "";
      return tiposProduto.some(opcao => opcao.id === prev) ? prev : tiposProduto[0].id;
    });
  }, [tiposProduto]);

  useEffect(() => {
    setPorteIds(prev => {
      if (!porteOpcoes.length) return [] as string[];
      const valid = new Set(porteOpcoes.map(opcao => opcao.id));
      return prev.filter(id => valid.has(id));
    });
  }, [porteOpcoes]);

  const salvar = async () => {
    const especieSelecionada = especieId || especies[0]?.id || "";
    const tipoSelecionado = tipoProdutoId || tiposProduto[0]?.id || "";
    if (!especieSelecionada || !tipoSelecionado) return;

    const dto = {
      descricao,
      peso: parseDecimalInput(peso),
      tipoPeso,
      sabores,
      especieOpcaoId: especieSelecionada,
      porteOpcaoIds: porteIds,
      tipoProdutoOpcaoId: tipoSelecionado,
      preco: parseDecimalInput(preco),
      quantidadeMinimaDeCompra: Math.max(1, parseIntegerInput(quantidadeMinimaDeCompra)),
    };
    await api.post(`/produtos/${codigo}`, dto);
    setCodigo("");
    setDescricao("");
    setPeso("1");
    setTipoPeso(1);
    setSabores("");
    setEspecieId(especies[0]?.id ?? "");
    setPorteIds([]);
    setTipoProdutoId(tiposProduto[0]?.id ?? "");
    setPreco("0");
    setQuantidadeMinimaDeCompra("1");
    await loadProdutos();
  };

  const remover = async (c: string) => {
    await api.delete(`/produtos/${c}`);
    await loadProdutos();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-3">Novo produto</h2>

        <div className="grid md:grid-cols-6 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="codigo" className="text-sm text-gray-700">Código</label>
            <input
              id="codigo"
              value={codigo}
              onChange={e=>setCodigo(e.target.value)}
              className="border rounded p-2"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label htmlFor="descricao" className="text-sm text-gray-700">Descrição</label>
            <input
              id="descricao"
              value={descricao}
              onChange={e=>setDescricao(e.target.value)}
              className="border rounded p-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="peso" className="text-sm text-gray-700">Peso</label>
            <input
              id="peso"
              type="text"
              inputMode="decimal"
              value={peso}
              onChange={e=>setPeso(sanitizeDecimalInput(e.target.value))}
              className="border rounded p-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tipoPeso" className="text-sm text-gray-700">Tipo de peso</label>
            <select
              id="tipoPeso"
              value={tipoPeso}
              onChange={e=>setTipoPeso(parseInt(e.target.value))}
              className="border rounded p-2"
            >
              <option value={0}>Grama</option>
              <option value={1}>Quilo</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="qtdMin" className="text-sm text-gray-700">Qtd mínima (unidades)</label>
            <input
              id="qtdMin"
              type="text"
              inputMode="numeric"
              value={quantidadeMinimaDeCompra}
              onChange={e => setQuantidadeMinimaDeCompra(e.target.value.replace(/[^0-9]/g, ""))}
              className="border rounded p-2"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label htmlFor="sabores" className="text-sm text-gray-700">Sabores</label>
            <input
              id="sabores"
              value={sabores}
              onChange={e=>setSabores(e.target.value)}
              className="border rounded p-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="especie" className="text-sm text-gray-700">Espécie</label>
            <select
              id="especie"
              value={especieId}
              onChange={e=>setEspecieId(e.target.value)}
              className="border rounded p-2"
              disabled={!especies.length}
            >
              {especies.length === 0 ? (
                <option value="" disabled>Carregando...</option>
              ) : (
                especies.map(opcao => (
                  <option key={opcao.id} value={opcao.id}>{opcao.nome}</option>
                ))
              )}
            </select>
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label htmlFor="tipoProduto" className="text-sm text-gray-700">Tipo do Produto</label>
            <select
              id="tipoProduto"
              value={tipoProdutoId}
              onChange={e=>setTipoProdutoId(e.target.value)}
              className="border rounded p-2"
              disabled={!tiposProduto.length}
            >
              {tiposProduto.length === 0 ? (
                <option value="" disabled>Carregando...</option>
              ) : (
                tiposProduto.map(opcao => (
                  <option key={opcao.id} value={opcao.id}>{opcao.nome}</option>
                ))
              )}
            </select>
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label htmlFor="portes" className="text-sm text-gray-700">Porte</label>
            <select
              id="portes"
              multiple
              value={porteIds}
              onChange={e=>setPorteIds(Array.from(e.target.selectedOptions, option => option.value))}
              className="border rounded p-2"
              size={Math.max(1, porteOpcoes.length)}
              disabled={!porteOpcoes.length}
            >
              {porteOpcoes.length === 0 ? (
                <option value="" disabled>Carregando...</option>
              ) : (
                porteOpcoes.map(opcao => (
                  <option key={opcao.id} value={opcao.id}>{opcao.nome}</option>
                ))
              )}
            </select>
            <span className="text-xs text-gray-500">Segure Ctrl (ou Cmd) para selecionar mais de uma opção.</span>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="preco" className="text-sm text-gray-700">Preço (R$)</label>
            <input
              id="preco"
              type="text"
              inputMode="decimal"
              value={preco}
              onChange={e=>setPreco(sanitizeDecimalInput(e.target.value))}
              className="border rounded p-2"
            />
          </div>

          <div className="md:col-span-6">
            <button onClick={salvar} className="px-3 py-2 border rounded-lg">
              Salvar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-3">Produtos</h2>
        <div className="grid gap-2">
          {produtos.map(p => {
            const portesLabel = p.porteNomes.length
              ? p.porteNomes.join(", ")
              : "";
            const minimo = Math.max(1, p.quantidadeMinimaDeCompra);
            return (
              <div key={p.codigo} className="flex items-center justify-between border rounded p-2 bg-gray-50">
                <div className="flex-1">
                  <div className="font-semibold">{p.descricao}</div>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    <div>{p.codigo} • {p.sabores}</div>
                    <div>{p.especieNome} • {portesLabel || "Sem porte definido"} • {p.tipoProdutoNome}</div>
                    <div>mín: {minimo} un. • R$ {p.preco.toFixed(2)}</div>
                  </div>
                </div>
                <button onClick={()=>remover(p.codigo)} className="px-3 py-1 border rounded-lg">Excluir</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}