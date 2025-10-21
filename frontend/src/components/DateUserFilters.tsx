import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";

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

type StatusDropdownProps = {
  id: string;
  label: string;
  options: SimpleOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const filterLabelClasses = "text-xs font-semibold uppercase tracking-wide text-slate-500";

const inputBaseClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100";

const dropdownButtonBaseClasses =
  "inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const dropdownButtonActiveClasses = "border-indigo-300 bg-indigo-50 text-indigo-600";

const dropdownListClasses =
  "absolute left-0 top-full z-10 mt-2 w-full min-w-[200px] origin-top-left rounded-xl border border-slate-200 bg-white p-2 shadow-xl";

const dropdownOptionClasses =
  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600";

function StatusDropdown({ id, label, options, value, onChange, disabled }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const optionsWithPlaceholder = useMemo(
    () => [{ value: "", label: "Todos" }, ...options],
    [options],
  );

  const selectedOption = useMemo(
    () => options.find(option => option.value === value) ?? null,
    [options, value],
  );

  const displayLabel = selectedOption?.label ?? "Todos";
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
    <div className="relative flex min-w-[220px] flex-1 flex-col gap-2 text-left">
      <label htmlFor={id} className={filterLabelClasses}>
        {label}
      </label>
      <button
        type="button"
        id={id}
        ref={buttonRef}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`${dropdownButtonBaseClasses} ${
          isPlaceholder ? "text-slate-500" : dropdownButtonActiveClasses
        }`}
        disabled={disabled}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          className={dropdownListClasses}
          role="listbox"
          aria-activedescendant={selectedOption?.value ?? ""}
        >
          <div className="max-h-64 overflow-y-auto">
            {optionsWithPlaceholder.map(option => {
              const isSelected = option.value === value || (!value && option.value === "");
              return (
                <button
                  key={option.value || "placeholder"}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`${dropdownOptionClasses} ${
                    isSelected ? "bg-indigo-50 text-indigo-600" : ""
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateForInput(value: string) {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return "";
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function formatDateFromInput(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "";
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
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
  applyLabel = "Buscar",
  className = "",
  disabled = false,
  children,
}: DateUserFiltersProps) {
  const handleChange = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(event.target.value);
  };

  const handleDateChange = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (!value) {
      setter("");
      return;
    }
    setter(formatDateFromInput(value));
  };

  const containerClasses =
    className ||
    "flex flex-wrap items-end gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100";

  const showStatus = statusOptions && statusOptions.length > 0 && onChangeStatusId;

  return (
    <div className={containerClasses}>
      {showUsuario && onChangeUsuario && (
        <div className="flex min-w-[260px] flex-1 flex-col gap-2">
          <label className={filterLabelClasses} htmlFor="filtro-usuario">
            Buscar
          </label>
          <div className="relative">
            <input
              id="filtro-usuario"
              type="text"
              placeholder="Pesquise por usuário ou CPF"
              value={usuario}
              onChange={handleChange(onChangeUsuario)}
              className={`${inputBaseClasses} pr-12`}
              disabled={disabled}
            />
            <Search
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {showStatus && (
        <StatusDropdown
          id="filtro-status"
          label="Status"
          options={statusOptions!}
          value={statusId}
          onChange={onChangeStatusId!}
          disabled={disabled}
        />
      )}

      <div className="flex min-w-[160px] flex-1 flex-col gap-2">
        <label className={filterLabelClasses} htmlFor="filtro-de">
          De
        </label>
        <div className="relative">
          <input
            id="filtro-de"
            type="date"
            lang="pt-BR"
            value={de ? formatDateForInput(de) : ""}
            onChange={handleDateChange(onChangeDe)}
            className={`${inputBaseClasses} text-transparent caret-transparent`}
            disabled={disabled}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center px-4">
            {de ? (
              <span className={`text-sm ${disabled ? "text-slate-400" : "text-slate-700"}`}>{de}</span>
            ) : (
              <span className="text-sm text-slate-400">dd/mm/aaaa</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-w-[160px] flex-1 flex-col gap-2">
        <label className={filterLabelClasses} htmlFor="filtro-ate">
          Até
        </label>
        <div className="relative">
          <input
            id="filtro-ate"
            type="date"
            lang="pt-BR"
            value={ate ? formatDateForInput(ate) : ""}
            onChange={handleDateChange(onChangeAte)}
            className={`${inputBaseClasses} text-transparent caret-transparent`}
            disabled={disabled}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center px-4">
            {ate ? (
              <span className={`text-sm ${disabled ? "text-slate-400" : "text-slate-700"}`}>{ate}</span>
            ) : (
              <span className="text-sm text-slate-400">dd/mm/aaaa</span>
            )}
          </div>
        </div>
      </div>

      {(onApply || children) && (
        <div className="ml-auto flex items-center gap-3 self-end">
          {onApply && (
            <button
              type="button"
              className="rounded-full bg-[#FF6900] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#FF6900]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6900]/40 disabled:cursor-not-allowed disabled:opacity-60"
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
