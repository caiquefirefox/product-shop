type Item = {
  produtoCodigo: string;
  descricao: string;
  preco: number;
  quantidade: number;
  subtotal: number;
  pesoKg: number;
  pesoTotalKg: number;
};

type PedidoDetalhe = {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioCpf: string | null;
  unidadeEntrega: string;
  dataHora: string; // ISO
  total: number;
  pesoTotalKg: number;
  itens: Item[];
};

export type { PedidoDetalhe, Item };