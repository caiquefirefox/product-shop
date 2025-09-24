// Helpers globais

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function formatCurrencyBRL(n: number) {
  return brl.format(n);
}

type TipoPeso = 0 | 1 | "g" | "kg";
type PesoUnit = "g" | "kg";
type FormatPesoOptions = {
  unit?: PesoUnit | "auto";
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  unitSuffix?: boolean;
  useGrouping?: boolean;
};

const numberCache = new Map<string, Intl.NumberFormat>();

function getNumberFormatter(min: number, max: number, useGrouping: boolean) {
  const key = `${min}|${max}|${useGrouping ? 1 : 0}`;
  const cached = numberCache.get(key);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    useGrouping,
  });
  numberCache.set(key, formatter);
  return formatter;
}

function resolveTipoPeso(tipoPeso: TipoPeso): PesoUnit {
  return tipoPeso === 0 || tipoPeso === "g" ? "g" : "kg";
}

export function formatPeso(peso: number, tipoPeso: TipoPeso = "kg", options?: FormatPesoOptions) {
  if (!Number.isFinite(peso)) return "-";

  const inputUnit = resolveTipoPeso(tipoPeso);
  const unitPreference = options?.unit ?? "auto";

  let displayUnit: PesoUnit;
  let value: number;

  if (unitPreference === "kg") {
    displayUnit = "kg";
    value = inputUnit === "kg" ? peso : peso / 1000;
  } else if (unitPreference === "g") {
    displayUnit = "g";
    value = inputUnit === "g" ? peso : peso * 1000;
  } else {
    if (inputUnit === "g" && peso >= 1000) {
      displayUnit = "kg";
      value = peso / 1000;
    } else {
      displayUnit = inputUnit;
      value = peso;
    }
  }

  let maximumFractionDigits = options?.maximumFractionDigits;
  let minimumFractionDigits = options?.minimumFractionDigits;

  if (displayUnit === "g") {
    if (maximumFractionDigits === undefined) maximumFractionDigits = 0;
    if (minimumFractionDigits === undefined) minimumFractionDigits = 0;
  } else {
    const isAuto = unitPreference === "auto";
    if (isAuto) {
      if (inputUnit === "g") {
        if (Number.isInteger(value)) {
          if (maximumFractionDigits === undefined) maximumFractionDigits = 0;
          if (minimumFractionDigits === undefined) minimumFractionDigits = 0;
        } else {
          if (maximumFractionDigits === undefined) maximumFractionDigits = 2;
          if (minimumFractionDigits === undefined) minimumFractionDigits = 2;
        }
      } else {
        if (maximumFractionDigits === undefined) {
          maximumFractionDigits = Number.isInteger(value) ? 0 : 3;
        }
        if (minimumFractionDigits === undefined) minimumFractionDigits = 0;
      }
    } else {
      if (maximumFractionDigits === undefined) maximumFractionDigits = 3;
      if (minimumFractionDigits === undefined) minimumFractionDigits = maximumFractionDigits;
    }
  }

  // Segurança extra caso opções inconsistentes sejam fornecidas.
  maximumFractionDigits = Math.max(0, maximumFractionDigits ?? 0);
  minimumFractionDigits = Math.max(0, Math.min(minimumFractionDigits ?? 0, maximumFractionDigits));

  const useGrouping = options?.useGrouping ?? true;
  const formatter = getNumberFormatter(minimumFractionDigits, maximumFractionDigits, useGrouping);
  const formatted = formatter.format(value);
  return options?.unitSuffix === false ? formatted : `${formatted} ${displayUnit}`;
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