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
  empresaId: string;
  empresaNome: string;
  condicaoPagamento: number;
  statusId: number;
  statusNome: string;
  integracaoStatusId: string | null;
  integracaoStatus: string;
  integracaoPedidoExternoId: string | null;
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
  editWindowOpeningDay: number;
  editWindowClosingDay: number;
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
