import React from 'react';
import { SkeletonLoader } from './infrastructure';
import { useThemeContext } from '../../../contexts/ThemeContext';
import clsx from 'clsx';

interface UsageProgressCardProps {
  label: string;
  value: number;
  limit?: number | null;
  unit?: string;
  thresholds?: {
    warning?: number;
    danger?: number;
  };
  icon?: React.ReactNode;
  isLoading?: boolean;
  footer?: React.ReactNode;
}

const getBarColor = (percentage: number, thresholds?: UsageProgressCardProps['thresholds']): string => {
  if (!thresholds) return 'bg-indigo-500';
  if (thresholds.danger !== undefined && percentage >= thresholds.danger) {
    return 'bg-rose-500';
  }
  if (thresholds.warning !== undefined && percentage >= thresholds.warning) {
    return 'bg-amber-500';
  }
  return 'bg-indigo-500';
};

export const UsageProgressCard: React.FC<UsageProgressCardProps> = ({
  label,
  value,
  limit,
  unit,
  thresholds,
  icon,
  isLoading,
  footer,
}) => {
  const { mode } = useThemeContext();
  const hasLimit = typeof limit === 'number' && Number.isFinite(limit) && limit > 0;
  const percentage = hasLimit ? Math.min((value / (limit as number)) * 100, 100) : 0;

  const cardClasses = clsx(
    'rounded-xl border p-5 shadow-sm transition-colors duration-200',
    mode === 'dark'
      ? 'border-slate-800 bg-slate-900 text-slate-200'
      : 'border-slate-100 bg-white text-slate-800 shadow-[0_24px_45px_-28px_rgba(15,23,42,0.28)]',
  );

  const labelClasses = clsx(
    'text-sm font-medium transition-colors duration-200',
    mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
  );

  const valueClasses = clsx(
    'text-2xl font-semibold transition-colors duration-200',
    mode === 'dark' ? 'text-slate-100' : 'text-slate-900',
  );

  return (
    <div className={cardClasses}>
      <div className="flex items-center justify-between">
        <div className={labelClasses}>{label}</div>
        {icon && (
          <div className={clsx('transition-colors duration-200', mode === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
            {icon}
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="mt-4">
          <SkeletonLoader lines={2} />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between">
            <div className={valueClasses}>
              {value.toLocaleString()}
              {unit && (
                <span
                  className={clsx(
                    'ml-1 text-sm transition-colors duration-200',
                    mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
                  )}
                >
                  {unit}
                </span>
              )}
            </div>
            <div
              className={clsx(
                'text-xs transition-colors duration-200',
                mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
              )}
            >
              {hasLimit ? (
                <>
                  of {(limit as number).toLocaleString()}
                  {unit && <span className="ml-1">{unit}</span>}
                </>
              ) : (
                'Unlimited'
              )}
            </div>
          </div>
          {hasLimit ? (
            <>
              <div
                className={clsx(
                  'mt-3 h-2 w-full overflow-hidden rounded-full transition-colors duration-200',
                  mode === 'dark' ? 'bg-slate-800' : 'bg-slate-200',
                )}
              >
                <div
                  className={`h-full transition-all duration-500 ${getBarColor(percentage, thresholds)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div
                className={clsx(
                  'mt-2 text-xs transition-colors duration-200',
                  mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
                )}
              >
                {percentage.toFixed(1)}% used
              </div>
            </>
          ) : (
            <div
              className={clsx(
                'mt-3 text-xs transition-colors duration-200',
                mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
              )}
            >
              Usage not capped
            </div>
          )}
        </>
      )}
      {footer && (
        <div
          className={clsx(
            'mt-3 text-xs transition-colors duration-200',
            mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default UsageProgressCard;

