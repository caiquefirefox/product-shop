const DEFAULT_EDIT_WINDOW_OPENING_DAY = 15;
const DEFAULT_EDIT_WINDOW_CLOSING_DAY = 20;

function clampPositiveInt(value: number, min: number, max: number) {
  const bounded = Math.min(Math.max(value, min), max);
  return Math.trunc(bounded);
}

function toNumber(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) {
    return val;
  }

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) {
      return null;
    }

    let normalized = trimmed;
    if (trimmed.includes(",") && !trimmed.includes(".")) {
      normalized = trimmed.replace(",", ".");
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function num(val: unknown, fallback: number) {
  const parsed = toNumber(val);
  if (parsed === null || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function dayOfMonth(val: unknown, fallback: number) {
  const base = clampPositiveInt(fallback, 1, 31);
  const parsed = Number(val);
  if (Number.isFinite(parsed) && parsed > 0) {
    return clampPositiveInt(parsed, 1, 31);
  }
  return base;
}

const rawEditWindowOpeningDay = import.meta.env.VITE_PEDIDOS_EDIT_WINDOW_OPENING_DAY ?? DEFAULT_EDIT_WINDOW_OPENING_DAY;
const rawEditWindowClosingDay = import.meta.env.VITE_PEDIDOS_EDIT_WINDOW_CLOSING_DAY ?? DEFAULT_EDIT_WINDOW_CLOSING_DAY;

const editWindowOpeningDay = dayOfMonth(rawEditWindowOpeningDay, DEFAULT_EDIT_WINDOW_OPENING_DAY);
const editWindowClosingDay = Math.max(
  editWindowOpeningDay,
  dayOfMonth(rawEditWindowClosingDay, DEFAULT_EDIT_WINDOW_CLOSING_DAY),
);

export const ENV = {
  LIMIT_KG_MES: num(import.meta.env.VITE_LIMIT_KG_MES, 33.1),
  QTD_MINIMA_PADRAO: num(import.meta.env.VITE_QTD_MINIMA_PADRAO, 1),
  PEDIDOS_EDIT_WINDOW_OPENING_DAY: editWindowOpeningDay,
  PEDIDOS_EDIT_WINDOW_CLOSING_DAY: editWindowClosingDay,
};
