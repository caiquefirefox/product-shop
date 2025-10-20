import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type ProductFilterSelectOption = {
  value: string;
  label: string;
};

export type ProductFilterValues = {
  query: string;
  tipoProduto: string;
  especie: string;
  faixaEtaria: string;
  porte: string;
};

export type ProductFilterChangeHandler = (
  field: keyof ProductFilterValues,
  value: string,
) => void;

export type ProductFilterOptions = {
  tiposProduto: ProductFilterSelectOption[];
  especies: ProductFilterSelectOption[];
  faixasEtarias: ProductFilterSelectOption[];
  portes: ProductFilterSelectOption[];
};

export type ProductFiltersProps = {
  idPrefix: string;
  title: string;
  description: string;
  values: ProductFilterValues;
  options: ProductFilterOptions;
  hasFilters: boolean;
  onChange: ProductFilterChangeHandler;
  onClear: () => void;
  className?: string;
  clearLabel?: string;
};

const filterLabelClasses =
  "text-xs font-semibold uppercase tracking-wide text-slate-500";

const filterInputClasses =
  "w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

const clearButtonClasses =
  "inline-flex items-center gap-2 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2";

const dropdownButtonBaseClasses =
  "inline-flex w-full items-center justify-between gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2";

const dropdownButtonActiveClasses =
  "border-indigo-300 bg-indigo-50 text-indigo-600";

const dropdownListClasses =
  "absolute left-0 top-full z-10 mt-2 w-full min-w-[200px] origin-top-left rounded-2xl border border-slate-200 bg-white p-2 shadow-xl";

const dropdownOptionClasses =
  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600";

type CategoryFilterDropdownProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: ProductFilterSelectOption[];
  onChange: (value: string) => void;
};

function CategoryFilterDropdown({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
}: CategoryFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const optionsWithPlaceholder = useMemo(
    () => [{ value: "", label: placeholder }, ...options],
    [options, placeholder],
  );

  const selectedOption = useMemo(
    () => options.find(option => option.value === value) ?? null,
    [options, value],
  );

  const displayLabel = selectedOption?.label ?? placeholder;
  const isPlaceholder = !selectedOption;

  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

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

  const handleToggle = () => setIsOpen(prev => !prev);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    closeMenu();
  };

  return (
    <div className="relative flex min-w-[160px] flex-1 flex-col gap-2 text-left">
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

const combineClassNames = (
  ...classes: Array<string | null | false | undefined>
) => classes.filter(Boolean).join(" ");

const inputIds = {
  query: "busca",
  tipoProduto: "tipo-produto",
  especie: "especie",
  faixaEtaria: "faixa-etaria",
  porte: "porte",
} satisfies Record<keyof ProductFilterValues, string>;

export function ProductFilters({
  idPrefix,
  title,
  description,
  values,
  options,
  hasFilters,
  onChange,
  onClear,
  className,
  clearLabel = "Limpar filtros",
}: ProductFiltersProps) {
  const handleChange = (
    field: keyof ProductFilterValues,
  ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(field, event.target.value);
    };

  const hasHeadingContent = title.trim() !== "" || description.trim() !== "";
  const fullClassName = combineClassNames(
    "flex flex-col gap-6",
    !hasHeadingContent && "pt-1",
    className,
  );

  return (
    <div className={fullClassName}>
      {hasHeadingContent && (
        <div className="flex flex-col text-left">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-4">
        <div className="flex min-w-[220px] flex-1 flex-col gap-2 text-left">
          <label htmlFor={`${idPrefix}-${inputIds.query}`} className={filterLabelClasses}>
            Buscar
          </label>
          <div className="relative">
            <input
              id={`${idPrefix}-${inputIds.query}`}
              type="text"
              value={values.query}
              onChange={handleChange("query")}
              placeholder="Buscar por código ou descrição"
              className={`${filterInputClasses} pr-12`}
            />
            <Search
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:items-end lg:flex lg:flex-1 lg:flex-nowrap lg:gap-4">
          <CategoryFilterDropdown
            id={`${idPrefix}-${inputIds.especie}`}
            label="Espécie"
            placeholder="Todas"
            value={values.especie}
            options={options.especies}
            onChange={value => onChange("especie", value)}
          />

          <CategoryFilterDropdown
            id={`${idPrefix}-${inputIds.tipoProduto}`}
            label="Tipo de alimento"
            placeholder="Todos"
            value={values.tipoProduto}
            options={options.tiposProduto}
            onChange={value => onChange("tipoProduto", value)}
          />

          <CategoryFilterDropdown
            id={`${idPrefix}-${inputIds.faixaEtaria}`}
            label="Idade"
            placeholder="Todas as faixas"
            value={values.faixaEtaria}
            options={options.faixasEtarias}
            onChange={value => onChange("faixaEtaria", value)}
          />

          <CategoryFilterDropdown
            id={`${idPrefix}-${inputIds.porte}`}
            label="Porte"
            placeholder="Todos"
            value={values.porte}
            options={options.portes}
            onChange={value => onChange("porte", value)}
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className={`${clearButtonClasses} self-start whitespace-nowrap lg:self-end`}
          >
            {clearLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductFilters;
