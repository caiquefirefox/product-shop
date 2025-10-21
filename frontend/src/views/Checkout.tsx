import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";
import { useCart } from "../cart/CartContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../ui/toast";
import { formatCurrencyBRL, formatPeso } from "../lib/format";
import { sanitizeCpf, isValidCpf, formatCpf } from "../lib/cpf";
import type { UsuarioPerfil } from "../types/user";
import { usePedidosConfig } from "../hooks/usePedidosConfig";
import { Check, ChevronDown } from "lucide-react";

type UnidadeEntrega = {
  id: string;
  nome: string;
};

type DeliveryDropdownProps = {
  id: string;
  label: string;
  options: UnidadeEntrega[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const dropdownButtonBaseClasses =
  "inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const dropdownButtonActiveClasses = "border-indigo-300 bg-indigo-50 text-indigo-600";

const dropdownListClasses =
  "absolute left-0 top-full z-10 mt-2 w-full min-w-[200px] origin-top-left rounded-xl border border-slate-200 bg-white p-2 shadow-xl";

const dropdownOptionClasses =
  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600";

function DeliveryDropdown({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder = "Selecione uma unidade",
}: DeliveryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const optionsWithFallback = useMemo(() => {
    if (value && !options.some(option => option.id === value)) {
      return [...options, { id: value, nome: value }];
    }
    return options;
  }, [options, value]);

  const selectedOption = useMemo(
    () => optionsWithFallback.find(option => option.id === value) ?? null,
    [optionsWithFallback, value],
  );

  const displayLabel = selectedOption?.nome ?? placeholder;
  const isPlaceholder = !selectedOption;

  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(prev => !prev);
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    closeMenu();
  };

  return (
    <div className="flex flex-col gap-2 text-left">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <button
          type="button"
          id={id}
          ref={buttonRef}
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
          className={`${dropdownButtonBaseClasses} ${
            isPlaceholder ? "text-slate-500" : dropdownButtonActiveClasses
          }`}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        </button>
        {isOpen && (
          <div
            ref={menuRef}
            className={dropdownListClasses}
            role="listbox"
            aria-activedescendant={selectedOption?.id ?? ""}
          >
            <div className="max-h-64 overflow-y-auto">
              {optionsWithFallback.length ? (
                optionsWithFallback.map(option => {
                  const isSelected = option.id === value;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option.id)}
                      className={`${dropdownOptionClasses} ${
                        isSelected ? "bg-indigo-50 text-indigo-600" : ""
                      }`}
                    >
                      <span className="truncate">{option.nome}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500">
                  Nenhuma unidade disponível.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Checkout() {
  const { items, totalValor, totalPesoKg, clear, anyBelowMinimum } = useCart();
  const pesoTotalFormatado = formatPeso(totalPesoKg, "kg", { unit: "kg" });
  const { limitKg: limiteMensalKg, loading: limiteLoading, error: limiteErro } = usePedidosConfig();
  const limiteMensalFormatado = limiteMensalKg > 0
    ? formatPeso(limiteMensalKg, "kg", { unit: "kg" })
    : "Não configurado";
  const [unidades, setUnidades] = useState<UnidadeEntrega[]>([]);
  const [unidadeId, setUnidadeId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [perfilErro, setPerfilErro] = useState<string | null>(null);
  const [cpf, setCpf] = useState<string>("");
  const [cpfBloqueado, setCpfBloqueado] = useState(false);
  const [cpfErro, setCpfErro] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  // Busca unidades do backend
  useEffect(() => {
    let alive = true;
    setLoadingUnidades(true);
    api.get<UnidadeEntrega[]>("/unidades-entrega")
      .then(r => {
        if (!alive) return;
        const lista = r.data || [];
        setUnidades(lista);
        setUnidadeId((current) => {
          if (current) return current;
          return lista.length > 0 ? lista[0].id : "";
        });
      })
      .catch(e => { if (!alive) return; setErr(e?.response?.data?.title ?? "Falha ao carregar unidades de entrega."); })
      .finally(() => { if (!alive) return; setLoadingUnidades(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoadingPerfil(true);
    setPerfilErro(null);
    api.get<UsuarioPerfil>("/usuarios/me")
      .then(r => {
        if (!alive) return;
        const dados = r.data;
        const digits = sanitizeCpf(dados?.cpf ?? "");
        setCpf(digits);
        setCpfBloqueado(Boolean(digits));
      })
      .catch(e => {
        if (!alive) return;
        const msg = e?.response?.data?.detail || e?.message || "Não foi possível carregar seus dados.";
        setPerfilErro(msg);
        setCpfBloqueado(false);
      })
      .finally(() => { if (!alive) return; setLoadingPerfil(false); });

    return () => { alive = false; };
  }, []);

  const onCpfChange = (value: string) => {
    const digits = sanitizeCpf(value).slice(0, 11);
    setCpf(digits);
    if (cpfErro) setCpfErro(null);
  };

  const enviar = async () => {
    setErr(null);
    setCpfErro(null);

    if (!cpfBloqueado && !isValidCpf(cpf)) {
      setCpfErro("Informe um CPF válido.");
      return;
    }

    setLoading(true);
    try {
      const cpfDigits = sanitizeCpf(cpf);
      const dto = {
        unidadeEntregaId: unidadeId,
        itens: items.map(i => ({ produtoCodigo: i.codigo, quantidade: i.quantidade })),
        cpf: cpfDigits || undefined,
      };
      const r = await api.post("/checkout", dto);

      // extrai um id legível
      const id = r?.data?.id ?? r?.data?.pedidoId ?? r?.data;
      const idStr = typeof id === "string" ? id : (typeof id === "number" ? String(id) : "");
      const idCurto = idStr.length > 8 ? idStr.slice(0, 8) + "…" : idStr;

      success("Pedido criado com sucesso!", idStr ? `Código: ${idCurto}` : undefined);

      clear();
      navigate("/");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.response?.data?.title || e?.message || "Erro ao finalizar pedido.";
      setErr(msg);
      if (msg?.toLowerCase().includes("cpf")) {
        setCpfErro(msg);
      }
      toastError("Não foi possível finalizar", msg);
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
        <p className="text-gray-600">Seu carrinho está vazio.</p>
      </div>
    );
  }

  const disableFinalize =
    loading ||
    loadingUnidades ||
    loadingPerfil ||
    !unidadeId ||
    anyBelowMinimum ||
    (!cpfBloqueado && !isValidCpf(cpf));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finalizar pedido</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="cpf-input">
                CPF
              </label>
              {loadingPerfil ? (
                <div className="text-sm text-gray-600">Carregando informações...</div>
              ) : (
                <>
                  <input
                    id="cpf-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={formatCpf(cpf)}
                    onChange={e => onCpfChange(e.target.value)}
                    disabled={cpfBloqueado}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {cpfBloqueado ? (
                    <p className="text-xs text-gray-500">
                      CPF já cadastrado. Entre em contato com o suporte para alterações.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Informe seu CPF para concluir o pedido.</p>
                  )}
                </>
              )}
            </div>

            {cpfErro && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{cpfErro}</div>
            )}

            {perfilErro && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{perfilErro}</div>
            )}

            <div className="flex flex-col gap-2">
              {loadingUnidades ? (
                <>
                  <span className="text-sm font-medium text-gray-700">Entrega</span>
                  <div className="text-sm text-gray-600">Carregando unidades...</div>
                </>
              ) : unidades.length ? (
                <DeliveryDropdown
                  id="entrega-select"
                  label="Entrega"
                  options={unidades}
                  value={unidadeId}
                  onChange={setUnidadeId}
                />
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-700">Entrega</span>
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    Não foi possível carregar as unidades de entrega. Tente novamente mais tarde.
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-lg font-bold text-[20px]">Resumo do pedido</h2>

            <div className="flex flex-1 flex-col gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600">Limite mensal:</span>
                <span className="ml-auto font-semibold text-gray-900">
                  {limiteLoading ? "Carregando..." : limiteMensalFormatado}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600">Peso total:</span>
                <span className="ml-auto font-semibold text-gray-900">{pesoTotalFormatado}</span>
              </div>
              <div className="mt-auto space-y-3">
                <div className="border-t border-gray-200" aria-hidden="true" />
                <div className="flex items-center justify-between text-[20px]">
                  <span className="text-gray-900">Valor total:</span>
                  <span className="font-semibold text-gray-900">{formatCurrencyBRL(totalValor)}</span>
                </div>
              </div>
            </div>

            {anyBelowMinimum && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                Existem itens abaixo da quantidade mínima exigida. Ajuste as quantidades no carrinho.
              </div>
            )}

            {limiteErro && !limiteLoading && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{limiteErro}</div>
            )}

            {limiteMensalKg > 0 && totalPesoKg > limiteMensalKg && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Atenção: seu carrinho tem {pesoTotalFormatado}. O limite mensal é {limiteMensalFormatado}.
              </div>
            )}

            {err && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
            )}
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={enviar}
          disabled={disableFinalize}
          className="inline-flex items-center justify-center rounded-full bg-[#FF6900] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#FF6900]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40 disabled:cursor-not-allowed disabled:opacity-60"
          title={anyBelowMinimum ? "Há itens abaixo da quantidade mínima." : ""}
        >
          {loading ? "Enviando..." : "Finalizar solicitação"}
        </button>
      </div>
    </div>
  );
}
