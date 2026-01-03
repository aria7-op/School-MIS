import React from 'react';
import clsx from 'clsx';
import { SkeletonLoader } from './infrastructure';
import { useThemeContext } from '../../../contexts/ThemeContext';

export interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  trend?: 'up' | 'down' | 'flat';
  footer?: React.ReactNode;
  onClick?: () => void;
}

const getDeltaColor = (delta?: number, trend?: 'up' | 'down' | 'flat') => {
  if (trend === 'flat' || !delta) return 'text-slate-500';
  if (delta > 0) return 'text-emerald-600';
  if (delta < 0) return 'text-rose-500';
  return 'text-slate-500';
};

const getTrendSymbol = (trend?: 'up' | 'down' | 'flat', delta?: number) => {
  if (!trend) {
    if (typeof delta === 'number') {
      if (delta > 0) return '▲';
      if (delta < 0) return '▼';
    }
    return '■';
  }
  switch (trend) {
    case 'up':
      return '▲';
    case 'down':
      return '▼';
    default:
      return '■';
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  delta,
  deltaLabel,
  icon,
  isLoading,
  trend,
  footer,
  onClick,
}) => {
  const { mode } = useThemeContext();

  const cardClasses = clsx(
    'w-full rounded-xl border p-4 shadow-sm transition-colors duration-200',
    mode === 'dark'
      ? 'border-slate-800 bg-slate-900 text-slate-100'
      : 'border-slate-100 bg-white text-slate-800 shadow-[0_25px_50px_-30px_rgba(15,23,42,0.35)]',
  );

  const titleClasses = clsx(
    'text-sm font-medium transition-colors duration-200',
    mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
  );

  const valueClasses = clsx(
    'text-3xl font-semibold transition-colors duration-200',
    mode === 'dark' ? 'text-slate-100' : 'text-slate-900',
  );

  const descriptionClasses = clsx(
    'text-sm transition-colors duration-200',
    mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
  );

  const footerClasses = clsx(
    'pt-2 text-xs transition-colors duration-200',
    mode === 'dark' ? 'text-slate-500' : 'text-slate-400',
  );

  const content = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className={titleClasses}>{title}</div>
        {icon && (
          <div className={clsx('transition-colors duration-200', mode === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
            {icon}
          </div>
        )}
      </div>
      {isLoading ? (
        <SkeletonLoader lines={2} />
      ) : (
        <>
          <div className={valueClasses}>{value}</div>
          {(delta !== undefined || deltaLabel) && (
            <div className={`flex items-center gap-1 text-sm ${getDeltaColor(delta, trend)}`}>
              <span className="text-xs">{getTrendSymbol(trend, delta)}</span>
              {delta !== undefined && (
                <span>
                  {delta > 0 ? '+' : ''}
                  {delta.toFixed(2)}%
                </span>
              )}
              {deltaLabel && <span className="text-slate-400 dark:text-slate-500">{deltaLabel}</span>}
            </div>
          )}
          {description && (
            <p className={descriptionClasses}>{description}</p>
          )}
        </>
      )}
      {footer && <div className={footerClasses}>{footer}</div>}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          cardClasses,
          'text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500',
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={cardClasses}>{content}</div>;
};

export default StatCard;

