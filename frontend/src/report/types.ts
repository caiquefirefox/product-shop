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
  empresaId: string;
  empresaNome: string;
  condicaoPagamento: number;
  statusId: number;
  statusNome: string;
  integracaoStatus: string;
  integracaoPedidoExternoId: string | null;
  dataHora: string; // ISO
  total: number;
  pesoTotalKg: number;
  itens: Item[];
};

export type { PedidoDetalhe, Item };
