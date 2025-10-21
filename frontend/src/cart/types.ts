export type TipoPesoCodigo = 0 | 1; // 0=grama, 1=quilo

export type Produto = {
  codigo: string;
  descricao: string;
  peso: number;
  tipoPeso: TipoPesoCodigo;
  sabores: string;
  especieOpcaoId: string;
  especieNome: string;
  porteOpcaoIds: string[];
  porteNomes: string[];
  tipoProdutoOpcaoId: string;
  tipoProdutoNome: string;
  faixaEtariaOpcaoId: string;
  faixaEtariaNome: string;
  preco: number;
  quantidadeMinimaDeCompra: number; // UNIDADES
  imagemUrl?: string | null;
};

export type CartItem = {
  codigo: string;
  descricao: string;
  preco: number;
  pesoKg: number;        // normalizado em kg
  quantidade: number;    // unidades
  minQty?: number;       // mínimo do produto no momento da adição
  imagemUrl?: string | null;
  sabores?: string | null;
  porteNomes?: string[];
  peso?: number;
  tipoPeso?: TipoPesoCodigo;
};
