export type Produto = {
  codigo: string;
  descricao: string;
  peso: number;
  tipoPeso: number; // 0=grama, 1=quilo
  sabores: string;
  especieOpcaoId: string;
  especieNome: string;
  porteOpcaoIds: string[];
  porteNomes: string[];
  tipoProdutoOpcaoId: string;
  tipoProdutoNome: string;
  preco: number;
  quantidadeMinimaDeCompra: number; // UNIDADES
};

export type CartItem = {
  codigo: string;
  descricao: string;
  preco: number;
  pesoKg: number;        // normalizado em kg
  quantidade: number;    // unidades
  minQty?: number;       // mínimo do produto no momento da adição
};
