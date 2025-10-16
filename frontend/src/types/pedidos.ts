type PedidoItemDetalhe = {
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
  unidadeEntrega: string;
  statusId: number;
  statusNome: string;
  dataHora: string;
  total: number;
  pesoTotalKg: number;
  itens: PedidoItemDetalhe[];
};

type PedidoHistoricoAlteracao = {
  produtoCodigo: string;
  descricao: string;
  quantidadeAnterior: number;
  quantidadeAtual: number;
};

type PedidoHistoricoDetalhes = {
  unidadeEntregaAnterior: string | null;
  unidadeEntregaAtual: string | null;
  itens: PedidoHistoricoAlteracao[];
  statusAnterior: string | null;
  statusAtual: string | null;
};

type PedidoHistorico = {
  id: string;
  dataHora: string;
  tipo: string;
  usuarioNome: string | null;
  detalhes: PedidoHistoricoDetalhes | null;
};

type PedidoDetalheCompleto = {
  pedido: PedidoDetalhe;
  historico: PedidoHistorico[];
};

type PedidoPaginadoResponse = {
  items: PedidoDetalhe[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type PedidoResumoMensal = {
  limiteKg: number;
  totalConsumidoKg: number;
  totalValor: number;
  totalItens: number;
  totalPedidos: number;
  limitePedidos: number;
  pedidosUtilizados: number;
  quantidadeMinimaPadrao: number;
};

export type {
  PedidoItemDetalhe,
  PedidoDetalhe,
  PedidoHistorico,
  PedidoHistoricoDetalhes,
  PedidoHistoricoAlteracao,
  PedidoDetalheCompleto,
  PedidoPaginadoResponse,
  PedidoResumoMensal,
};
