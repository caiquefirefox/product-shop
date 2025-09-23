function num(val: unknown, fallback: number) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const ENV = {
  LIMIT_KG_MES: num(import.meta.env.VITE_LIMIT_KG_MES, 30),
  QTD_MINIMA_PADRAO: num(import.meta.env.VITE_QTD_MINIMA_PADRAO, 1),
};
