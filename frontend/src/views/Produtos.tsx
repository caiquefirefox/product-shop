import { useEffect, useState } from "react";
import api from "../lib/api";

type Produto = {
  codigo: string;
  descricao: string;
  peso: number;
  tipoPeso: number;
  sabores: string;
  preco: number;
  quantidadeMinimaDeCompra: number;
};

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [peso, setPeso] = useState("1");
  const [tipoPeso, setTipoPeso] = useState(1);
  const [sabores, setSabores] = useState("");
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

  const load = async () => setProdutos((await api.get("/produtos")).data);
  useEffect(() => { load(); }, []);

  const salvar = async () => {
    const dto = {
      descricao,
      peso: parseDecimalInput(peso),
      tipoPeso,
      sabores,
      preco: parseDecimalInput(preco),
      quantidadeMinimaDeCompra: Math.max(1, parseIntegerInput(quantidadeMinimaDeCompra)),
    };
    await api.post(`/produtos/${codigo}`, dto);
    setCodigo("");
    setDescricao("");
    setPeso("1");
    setTipoPeso(1);
    setSabores("");
    setPreco("0");
    setQuantidadeMinimaDeCompra("1");
    await load();
  };

  const remover = async (c: string) => {
    await api.delete(`/produtos/${c}`);
    await load();
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
          {produtos.map(p => (
            <div key={p.codigo} className="flex items-center justify-between border rounded p-2 bg-gray-50">
              <div className="flex-1">
                <div className="font-semibold">{p.descricao}</div>
                <div className="text-sm text-gray-600">
                  {p.codigo} • {p.sabores} • mín: {Math.max(1, p.quantidadeMinimaDeCompra)} un. • R$ {p.preco.toFixed(2)}
                </div>
              </div>
              <button onClick={()=>remover(p.codigo)} className="px-3 py-1 border rounded-lg">Excluir</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}