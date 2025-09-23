// Helpers globais

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function formatCurrencyBRL(n: number) {
  return brl.format(n);
}

// --- Datas BR (dd/MM/yyyy) --- //
export function formatDateBR(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function parseDateBR(s: string): Date | undefined {
  // Aceita "dd/mm/aaaa"
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return undefined;
  const [, dd, mm, yyyy] = m;
  const d = Number(dd), mth = Number(mm), y = Number(yyyy);
  if (mth < 1 || mth > 12 || d < 1 || d > 31) return undefined;
  const date = new Date(y, mth - 1, d, 0, 0, 0, 0); // local
  // valida virada de mês (ex.: 31/02)
  if (date.getFullYear() !== y || date.getMonth() !== (mth - 1) || date.getDate() !== d) return undefined;
  return date;
}

export function startOfDayISO_BR(s: string | undefined) {
  const d = s ? parseDateBR(s) : undefined;
  if (!d) return undefined;
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function endOfDayISO_BR(s: string | undefined) {
  const d = s ? parseDateBR(s) : undefined;
  if (!d) return undefined;
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}