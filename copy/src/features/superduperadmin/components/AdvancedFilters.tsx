import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '../../../contexts/ThemeContext';

export interface FilterOption<TValue = string> {
  label: string;
  value: TValue;
}

export interface AdvancedFilterConfig<TFilters = Record<string, unknown>> {
  id: keyof TFilters & string;
  label: string;
  options?: FilterOption[];
  type?: 'select' | 'search' | 'date' | 'daterange';
  placeholder?: string;
  translationKey?: string;
}

interface AdvancedFiltersProps<TFilters> {
  filters: TFilters;
  config: AdvancedFilterConfig<TFilters>[];
  onChange: (filters: TFilters) => void;
  className?: string;
}

export const AdvancedFilters = <TFilters extends Record<string, any>>({
  filters,
  config,
  onChange,
  className,
}: AdvancedFiltersProps<TFilters>) => {
  const { t } = useTranslation();
  const { mode } = useThemeContext();

  const updateFilter = React.useCallback(
    (key: keyof TFilters & string, value: unknown) => {
      onChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onChange],
  );

  const getPlaceholder = (filter: AdvancedFilterConfig<TFilters>) => {
    if (filter.placeholder) return filter.placeholder;

    if (filter.type === 'search') {
      return t('advancedFilters.searchPlaceholder', {
        label: filter.label.toLowerCase(),
      });
    }

    return t('advancedFilters.allPlaceholder', {
      label: filter.label,
    });
  };

  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className ?? ''}`.trim()}>
      {config.map((filter) => {
        const value = filters[filter.id];
        if (filter.type === 'search') {
          return (
            <input
              key={filter.id}
              type="search"
              className={clsx("w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-700')}
              placeholder={getPlaceholder(filter)}
              value={(value as string) ?? ''}
              onChange={(event) => updateFilter(filter.id, event.target.value)}
            />
          );
        }

        if (filter.type === 'date' || filter.type === 'daterange') {
          return (
            <input
              key={filter.id}
              type={filter.type === 'daterange' ? 'text' : 'date'}
              className={clsx("w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-700')}
              placeholder={getPlaceholder(filter)}
              value={(value as string) ?? ''}
              onChange={(event) => updateFilter(filter.id, event.target.value)}
            />
          );
        }

        return (
          <select
            key={filter.id}
            className={clsx("w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-700')}
            value={(value as string) ?? ''}
            onChange={(event) => updateFilter(filter.id, event.target.value)}
          >
            <option value="">{getPlaceholder(filter)}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      })}
    </div>
  );
};

export default AdvancedFilters;

