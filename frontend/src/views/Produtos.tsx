import { useEffect, useMemo, useState } from "react";
import Select, { MultiValue, StylesConfig } from "react-select";
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
  const [opcoesCarregando, setOpcoesCarregando] = useState(true);

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
    try {
      setOpcoesCarregando(true);
      const [especiesResp, portesResp, tiposResp] = await Promise.all([
        api.get<ProdutoOpcao[]>("/produtos/especies"),
        api.get<ProdutoOpcao[]>("/produtos/portes"),
        api.get<ProdutoOpcao[]>("/produtos/tipos-produto"),
      ]);
      setEspecies(especiesResp.data);
      setPorteOpcoes(portesResp.data);
      setTiposProduto(tiposResp.data);
    } finally {
      setOpcoesCarregando(false);
    }
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

  const baseInputClasses =
    "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 shadow-sm transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="mb-6 space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Novo produto</h2>
          <p className="text-sm text-gray-500">
            Preencha os campos abaixo para cadastrar um novo item em seu catálogo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="codigo" className="text-sm font-medium text-gray-700">Código</label>
            <input
              id="codigo"
              placeholder="Ex: R128"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              className={baseInputClasses}
            />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
            <label htmlFor="descricao" className="text-sm font-medium text-gray-700">Descrição</label>
            <input
              id="descricao"
              placeholder="Nome do produto"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className={baseInputClasses}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="peso" className="text-sm font-medium text-gray-700">Peso</label>
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
            <label htmlFor="tipoPeso" className="text-sm font-medium text-gray-700">Tipo de peso</label>
            <select
              id="tipoPeso"
              value={tipoPeso}
              onChange={e => setTipoPeso(parseInt(e.target.value, 10))}
              className={baseInputClasses}
            >
              <option value={0}>Grama</option>
              <option value={1}>Quilo</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="qtdMin" className="text-sm font-medium text-gray-700">Qtd mínima (unidades)</label>
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
            <label htmlFor="sabores" className="text-sm font-medium text-gray-700">Sabores</label>
            <input
              id="sabores"
              placeholder="Informe os sabores separados por vírgula"
              value={sabores}
              onChange={e => setSabores(e.target.value)}
              className={baseInputClasses}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="especie" className="text-sm font-medium text-gray-700">Espécie</label>
            <select
              id="especie"
              value={especieId}
              onChange={e => setEspecieId(e.target.value)}
              className={baseInputClasses}
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

          <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
            <label htmlFor="tipoProduto" className="text-sm font-medium text-gray-700">Tipo do Produto</label>
            <select
              id="tipoProduto"
              value={tipoProdutoId}
              onChange={e => setTipoProdutoId(e.target.value)}
              className={baseInputClasses}
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

          <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
            <label htmlFor="portes" className="text-sm font-medium text-gray-700">Porte</label>
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
            <label htmlFor="preco" className="text-sm font-medium text-gray-700">Preço (R$)</label>
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

          <div className="flex justify-end md:col-span-2 xl:col-span-3">
            <button
              onClick={salvar}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:ring-offset-1 focus:ring-offset-white"
            >
              Salvar produto
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Produtos</h2>
          <p className="text-sm text-gray-500">Acompanhe os itens cadastrados e exclua aqueles que não fazem mais parte do catálogo.</p>
        </div>
        <div className="grid gap-3">
          {produtos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-8 text-center text-sm text-gray-500">
              Nenhum produto cadastrado por aqui ainda. Utilize o formulário acima para adicionar o primeiro item.
            </div>
          ) : (
            produtos.map(p => {
              const portesLabel = p.porteNomes.length
                ? p.porteNomes.join(", ")
                : "";
              const minimo = Math.max(1, p.quantidadeMinimaDeCompra);
              return (
                <div
                  key={p.codigo}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/70 p-4 transition hover:border-indigo-200 hover:shadow-md md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex-1 space-y-1">
                    <div className="text-base font-semibold text-gray-900">{p.descricao}</div>
                    <div className="text-sm text-gray-600">
                      {p.codigo} • {p.sabores}
                    </div>
                    <div className="text-sm text-gray-600">
                      {p.especieNome} • {portesLabel || "Sem porte definido"} • {p.tipoProdutoNome}
                    </div>
                    <div className="text-sm font-medium text-gray-700">
                      mín: {minimo} un. • R$ {p.preco.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => remover(p.codigo)}
                    className="inline-flex items-center justify-center self-start rounded-lg border border-transparent bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100"
                  >
                    Excluir
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}