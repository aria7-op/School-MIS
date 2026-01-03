import React from 'react';
import clsx from 'clsx';
import { useThemeContext } from '../../../contexts/ThemeContext';

interface LimitIndicatorProps {
  label: string;
  value: number | string;
  limit?: number | string;
  status?: 'ok' | 'warning' | 'danger';
  icon?: React.ReactNode;
  className?: string;
}

const getStatusStyles = (status: NonNullable<LimitIndicatorProps['status']>, mode: 'light' | 'dark') => {
  const styles = {
    ok: mode === 'dark' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-500/10 text-emerald-600',
    warning: mode === 'dark' ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-500/10 text-amber-600',
    danger: mode === 'dark' ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-500/10 text-rose-600',
  };
  return styles[status];
};

export const LimitIndicator: React.FC<LimitIndicatorProps> = ({
  label,
  value,
  limit,
  status = 'ok',
  icon,
  className,
}) => {
  const { mode } = useThemeContext();
  return (
    <div
      className={clsx(
        'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors duration-200',
        mode === 'dark'
          ? 'border-slate-800 bg-slate-900 text-slate-200'
          : 'border-slate-100 bg-white text-slate-800 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.24)]',
        className,
      )}
    >
      <div className="flex items-center gap-3">
         <div className={clsx('flex h-8 w-8 items-center justify-center rounded-full', getStatusStyles(status, mode))}>
           {icon ?? <span className="text-lg">⏳</span>}
         </div>
        <div>
          <div
            className={clsx(
              'text-xs uppercase tracking-wide transition-colors duration-200',
              mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
            )}
          >
            {label}
          </div>
          <div
            className={clsx(
              'text-sm font-semibold transition-colors duration-200',
              mode === 'dark' ? 'text-slate-100' : 'text-slate-900',
            )}
          >
            {value}
            {limit !== undefined && (
              <span
                className={clsx(
                  'ml-2 text-xs font-normal transition-colors duration-200',
                  mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
                )}
              >
                / {limit}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LimitIndicator;

