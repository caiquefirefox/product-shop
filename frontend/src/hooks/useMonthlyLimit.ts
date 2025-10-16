import { useEffect, useState } from "react";
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

  return "Não foi possível carregar o limite mensal.";
}

export function useMonthlyLimit() {
  const [limitKg, setLimitKg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    api.get<PedidoResumoMensal>("/pedidos/resumo-mensal")
      .then((response) => {
        if (!active) return;
        const normalized = normalizeLimitKg(response?.data?.limiteKg);
        setLimitKg(normalized);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(extractErrorMessage(err));
        setLimitKg(0);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { limitKg, loading, error };
}
