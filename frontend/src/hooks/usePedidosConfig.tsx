import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import api from "../lib/api";
import type { PedidoResumoMensal } from "../types/pedidos";

function normalizeLimitKg(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? value : 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }

    let normalized = trimmed.replace(/\s+/g, "");
    const hasComma = normalized.includes(",");
    const hasDot = normalized.includes(".");

    if (hasComma && hasDot) {
      // Assume formato pt-BR com milhares usando ponto e decimais com vírgula.
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else if (hasComma && !hasDot) {
      normalized = normalized.replace(",", ".");
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  return 0;
}

function normalizeMinQty(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    const floored = Math.floor(value);
    return floored > 0 ? floored : 1;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return 1;
    }

    const parsed = Number(trimmed.replace(/\s+/g, ""));
    if (Number.isFinite(parsed)) {
      const floored = Math.floor(parsed);
      return floored > 0 ? floored : 1;
    }
  }

  return 1;
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const maybeResponse = (err as any).response;
    const detail = maybeResponse?.data?.detail ?? maybeResponse?.data?.title;
    if (typeof detail === "string" && detail.trim()) {
      return detail.trim();
    }
    const message = (err as any).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  return "Não foi possível carregar as configurações de pedidos.";
}

type PedidosConfigContextValue = {
  limitKg: number;
  minQtyPadrao: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const PedidosConfigContext = createContext<PedidosConfigContextValue | null>(null);

export function PedidosConfigProvider({ children }: { children: ReactNode }) {
  const [limitKg, setLimitKg] = useState(0);
  const [minQtyPadrao, setMinQtyPadrao] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setLoadingSafe = useCallback((value: boolean) => {
    if (!isMountedRef.current) return;
    setLoading(value);
  }, []);

  const applyResult = useCallback((data?: PedidoResumoMensal) => {
    if (!isMountedRef.current) return;
    setLimitKg(normalizeLimitKg(data?.limiteKg));
    setMinQtyPadrao(normalizeMinQty(data?.quantidadeMinimaPadrao));
    setError(null);
  }, []);

  const applyError = useCallback((err: unknown) => {
    if (!isMountedRef.current) return;
    setError(extractErrorMessage(err));
    setLimitKg(0);
    setMinQtyPadrao(1);
  }, []);

  const refresh = useCallback(async () => {
    setLoadingSafe(true);
    try {
      const response = await api.get<PedidoResumoMensal>("/pedidos/resumo-mensal");
      applyResult(response?.data);
    } catch (err) {
      applyError(err);
    } finally {
      setLoadingSafe(false);
    }
  }, [applyResult, applyError, setLoadingSafe]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ limitKg, minQtyPadrao, loading, error, refresh }),
    [limitKg, minQtyPadrao, loading, error, refresh],
  );

  return (
    <PedidosConfigContext.Provider value={value}>
      {children}
    </PedidosConfigContext.Provider>
  );
}

export function usePedidosConfig() {
  const ctx = useContext(PedidosConfigContext);
  if (!ctx) {
    throw new Error("usePedidosConfig must be used within a PedidosConfigProvider");
  }
  return ctx;
}
