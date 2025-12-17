type Item = {
  produtoCodigo: string;
  descricao: string;
  preco: number;
  quantidade: number;
  quantidadeMinima: number;
  subtotal: number;
  pesoKg: number;
  pesoTotalKg: number;
};

type PedidoDetalhe = {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioCpf: string | null;
  unidadeEntregaId: string;
  unidadeEntregaNome: string;
  empresaId: string;
  empresaNome: string;
  statusId: number;
  statusNome: string;
  dataHora: string; // ISO
  total: number;
  pesoTotalKg: number;
  itens: Item[];
};

export type { PedidoDetalhe, Item };
