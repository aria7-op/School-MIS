import React from 'react';
import clsx from 'clsx';
import { useThemeContext } from '../../../contexts/ThemeContext';

export interface TrendIndicatorProps {
  label: string;
  current: number;
  previous?: number;
  target?: number;
  trend?: 'up' | 'down' | 'flat';
  precision?: number;
  showTarget?: boolean;
  className?: string;
}

const getTrend = (
  trend: TrendIndicatorProps['trend'],
  current: number,
  previous?: number,
): TrendIndicatorProps['trend'] => {
  if (trend) return trend;
  if (previous === undefined) return 'flat';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
};

const getTrendColor = (trend: TrendIndicatorProps['trend']): string => {
  switch (trend) {
    case 'up':
      return 'text-emerald-600';
    case 'down':
      return 'text-rose-500';
    default:
      return 'text-slate-500';
  }
};

const getTrendSymbol = (trend: TrendIndicatorProps['trend']): string => {
  switch (trend) {
    case 'up':
      return '▲';
    case 'down':
      return '▼';
    default:
      return '■';
  }
};

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  label,
  current,
  previous,
  target,
  trend,
  precision = 2,
  showTarget = false,
  className,
}) => {
  const { mode } = useThemeContext();
  const resolvedTrend = getTrend(trend, current, previous);
  const delta = previous !== undefined ? current - previous : undefined;
  const percentageChange =
    previous && previous !== 0 ? ((current - previous) / previous) * 100 : undefined;

  return (
    <div
      className={clsx(
        'flex flex-col gap-1 rounded-lg border p-4 transition-colors duration-200',
        mode === 'dark'
          ? 'border-slate-800 bg-slate-900 text-slate-200'
          : 'border-slate-100 bg-white text-slate-800 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.24)]',
        className,
      )}
    >
      <div
        className={clsx(
          'flex items-center justify-between text-sm transition-colors duration-200',
          mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
        )}
      >
        <span>{label}</span>
        <span className={getTrendColor(resolvedTrend)}>{getTrendSymbol(resolvedTrend)}</span>
      </div>
      <div
        className={clsx(
          'text-2xl font-semibold transition-colors duration-200',
          mode === 'dark' ? 'text-slate-100' : 'text-slate-900',
        )}
      >
        {current.toFixed(precision)}
      </div>
      <div
        className={clsx(
          'text-xs transition-colors duration-200',
          mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
        )}
      >
        {previous !== undefined && (
          <span>
            Prev: <strong>{previous.toFixed(precision)}</strong>
          </span>
        )}
        {delta !== undefined && (
          <span className="ml-2">
            Δ <strong>{delta > 0 ? '+' : ''}{delta.toFixed(precision)}</strong>
          </span>
        )}
        {percentageChange !== undefined && (
          <span className="ml-2">
            ({percentageChange > 0 ? '+' : ''}
            {percentageChange.toFixed(1)}%)
          </span>
        )}
      </div>
      {showTarget && target !== undefined && (
        <div
          className={clsx(
            'mt-1 text-xs transition-colors duration-200',
            mode === 'dark' ? 'text-indigo-300' : 'text-indigo-600',
          )}
        >
          Target: <strong>{target.toFixed(precision)}</strong>
        </div>
      )}
    </div>
  );
};

export default TrendIndicator;

