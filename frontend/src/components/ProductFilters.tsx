import { ChangeEvent } from "react";

export type ProductFilterSelectOption = {
  value: string;
  label: string;
};

export type ProductFilterValues = {
  codigo: string;
  descricao: string;
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
  "text-[11px] font-semibold uppercase tracking-wide text-slate-500";

const filterInputClasses =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

const clearButtonClasses =
  "inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2";

const combineClassNames = (
  ...classes: Array<string | null | false | undefined>
) => classes.filter(Boolean).join(" ");

const inputIds = {
  codigo: "codigo",
  descricao: "descricao",
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
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange(field, event.target.value);
    };

  const fullClassName = combineClassNames(
    "flex flex-col gap-6",
    className,
  );

  return (
    <div className={fullClassName}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-left">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        {hasFilters && (
          <button type="button" onClick={onClear} className={clearButtonClasses}>
            {clearLabel}
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-2 text-left lg:col-span-5">
          <label htmlFor={`${idPrefix}-${inputIds.descricao}`} className={filterLabelClasses}>
            Descrição
          </label>
          <input
            id={`${idPrefix}-${inputIds.descricao}`}
            type="text"
            value={values.descricao}
            onChange={handleChange("descricao")}
            placeholder="Pesquise por código ou nome do produto"
            className={filterInputClasses}
          />
        </div>

        <div className="flex flex-col gap-2 text-left lg:col-span-2">
          <label htmlFor={`${idPrefix}-${inputIds.codigo}`} className={filterLabelClasses}>
            Código
          </label>
          <input
            id={`${idPrefix}-${inputIds.codigo}`}
            type="text"
            value={values.codigo}
            onChange={handleChange("codigo")}
            placeholder="Buscar por código"
            className={filterInputClasses}
          />
        </div>

        <div className="flex flex-col gap-2 text-left lg:col-span-2">
          <label htmlFor={`${idPrefix}-${inputIds.tipoProduto}`} className={filterLabelClasses}>
            Tipo do produto
          </label>
          <select
            id={`${idPrefix}-${inputIds.tipoProduto}`}
            value={values.tipoProduto}
            onChange={handleChange("tipoProduto")}
            className={filterInputClasses}
          >
            <option value="">Todos os tipos</option>
            {options.tiposProduto.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 text-left lg:col-span-2">
          <label htmlFor={`${idPrefix}-${inputIds.especie}`} className={filterLabelClasses}>
            Espécie
          </label>
          <select
            id={`${idPrefix}-${inputIds.especie}`}
            value={values.especie}
            onChange={handleChange("especie")}
            className={filterInputClasses}
          >
            <option value="">Todas as espécies</option>
            {options.especies.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 text-left lg:col-span-2">
          <label htmlFor={`${idPrefix}-${inputIds.faixaEtaria}`} className={filterLabelClasses}>
            Faixa etária
          </label>
          <select
            id={`${idPrefix}-${inputIds.faixaEtaria}`}
            value={values.faixaEtaria}
            onChange={handleChange("faixaEtaria")}
            className={filterInputClasses}
          >
            <option value="">Todas as faixas</option>
            {options.faixasEtarias.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 text-left lg:col-span-2">
          <label htmlFor={`${idPrefix}-${inputIds.porte}`} className={filterLabelClasses}>
            Porte
          </label>
          <select
            id={`${idPrefix}-${inputIds.porte}`}
            value={values.porte}
            onChange={handleChange("porte")}
            className={filterInputClasses}
          >
            <option value="">Todos os portes</option>
            {options.portes.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default ProductFilters;
