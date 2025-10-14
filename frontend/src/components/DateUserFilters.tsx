import type { ChangeEvent, ReactNode } from "react";

export type SimpleOption = {
  value: string;
  label: string;
};

export type DateUserFiltersProps = {
  de: string;
  ate: string;
  onChangeDe: (value: string) => void;
  onChangeAte: (value: string) => void;
  usuario?: string;
  onChangeUsuario?: (value: string) => void;
  showUsuario?: boolean;
  statusId?: string;
  onChangeStatusId?: (value: string) => void;
  statusOptions?: SimpleOption[];
  onApply?: () => void;
  applyLabel?: string;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
};

function inputClass(disabled?: boolean) {
  const base = "border rounded-lg px-3 py-2 text-sm";
  const disabledClasses = disabled ? " bg-gray-100 cursor-not-allowed" : "";
  return `${base}${disabledClasses}`;
}

export function DateUserFilters({
  de,
  ate,
  onChangeDe,
  onChangeAte,
  usuario = "",
  onChangeUsuario,
  showUsuario = true,
  statusId = "",
  onChangeStatusId,
  statusOptions,
  onApply,
  applyLabel = "Aplicar filtros",
  className = "",
  disabled = false,
  children,
}: DateUserFiltersProps) {
  const handleChange = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(event.target.value);
  };

  const containerClasses = className || "flex flex-wrap gap-3 items-end bg-white p-4 rounded-xl shadow";

  const showStatus = statusOptions && statusOptions.length > 0 && onChangeStatusId;

  return (
    <div className={containerClasses}>
      <div className="flex flex-col">
        <label className="text-sm text-gray-600" htmlFor="filtro-de">
          De
        </label>
        <input
          id="filtro-de"
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          value={de}
          onChange={handleChange(onChangeDe)}
          className={inputClass(disabled)}
          aria-label="Data inicial no formato dia/mês/ano"
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-sm text-gray-600" htmlFor="filtro-ate">
          Até
        </label>
        <input
          id="filtro-ate"
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          value={ate}
          onChange={handleChange(onChangeAte)}
          className={inputClass(disabled)}
          aria-label="Data final no formato dia/mês/ano"
          disabled={disabled}
        />
      </div>

      {showUsuario && onChangeUsuario && (
        <div className="flex flex-col min-w-[200px]">
          <label className="text-sm text-gray-600" htmlFor="filtro-usuario">
            Usuário (contém)
          </label>
          <input
            id="filtro-usuario"
            type="text"
            placeholder="Nome ou CPF"
            value={usuario}
            onChange={handleChange(onChangeUsuario)}
            className={inputClass(disabled)}
            disabled={disabled}
          />
        </div>
      )}

      {showStatus && (
        <div className="flex flex-col min-w-[200px]">
          <label className="text-sm text-gray-600" htmlFor="filtro-status">
            Status
          </label>
          <select
            id="filtro-status"
            value={statusId}
            onChange={handleChange(onChangeStatusId!)}
            className={inputClass(disabled)}
            disabled={disabled}
          >
            <option value="">Todos</option>
            {statusOptions!.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {(onApply || children) && (
        <div className="ml-auto flex items-center gap-3">
          {onApply && (
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onApply}
              disabled={disabled}
            >
              {applyLabel}
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

export default DateUserFilters;
