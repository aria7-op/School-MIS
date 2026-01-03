import React from 'react';
import clsx from 'clsx';
import { useThemeContext } from '../../../contexts/ThemeContext';

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  title = 'Quick actions',
  className,
}) => {
  const { mode } = useThemeContext();

  const containerClasses = clsx(
    'rounded-xl border p-4 shadow-sm transition-colors duration-200',
    mode === 'dark'
      ? 'border-slate-800 bg-slate-900 text-slate-200'
      : 'border-slate-100 bg-white text-slate-800 shadow-[0_24px_45px_-28px_rgba(15,23,42,0.28)]',
    className,
  );

  const titleClasses = clsx(
    'text-sm font-semibold transition-colors duration-200',
    mode === 'dark' ? 'text-slate-100' : 'text-slate-900',
  );

  return (
    <div className={containerClasses}>
      <h3 className={titleClasses}>
        {title}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className={clsx(
              'flex min-w-40 flex-1 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60',
              action.disabled ? 'pointer-events-none' : '',
              mode === 'dark'
                ? 'border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/10'
                : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50'
            )}
          >
            <div>
              <div
                className={clsx(
                  'flex items-center gap-2 font-medium transition-colors duration-200',
                  mode === 'dark' ? 'text-slate-100' : 'text-slate-900',
                )}
              >
                {action.icon && <span className="text-lg text-indigo-500">{action.icon}</span>}
                <span>{action.label}</span>
                {action.badge && (
                  <span className={clsx(
                    'rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide transition-colors duration-200',
                    mode === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
                  )}>
                    {action.badge}
                  </span>
                )}
              </div>
              {action.description && (
                <p
                  className={clsx(
                    'mt-1 text-xs transition-colors duration-200',
                    mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
                  )}
                >
                  {action.description}
                </p>
              )}
            </div>
            <span className={clsx(
              'text-lg transition-colors duration-200',
              mode === 'dark' ? 'text-slate-600' : 'text-slate-300'
            )}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;

