const DEFAULT_EDIT_WINDOW_OPENING_DAY = 15;
const DEFAULT_EDIT_WINDOW_CLOSING_DAY = 20;

function clampPositiveInt(value: number, min: number, max: number) {
  const bounded = Math.min(Math.max(value, min), max);
  return Math.trunc(bounded);
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
  PEDIDOS_EDIT_WINDOW_OPENING_DAY: editWindowOpeningDay,
  PEDIDOS_EDIT_WINDOW_CLOSING_DAY: editWindowClosingDay,
};
