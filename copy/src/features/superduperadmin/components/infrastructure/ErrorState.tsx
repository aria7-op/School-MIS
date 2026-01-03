import React from 'react';
import clsx from 'clsx';
import { useThemeContext } from '../../../../contexts/ThemeContext';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We could not load this section. Please try again.',
  onRetry,
  retryLabel = 'Retry',
  className,
}) => {
  const { mode } = useThemeContext();
  return (
    <div
      className={clsx("flex flex-col items-center justify-center rounded-lg border p-6 text-center", mode === 'dark' ? 'border-red-900/40 bg-red-950' : 'border-red-100 bg-red-50', className ?? '')}
    >
      <div className={clsx("mb-3 text-3xl", mode === 'dark' ? 'text-red-400' : 'text-red-500')}>⚠️</div>
      <h3 className={clsx("text-lg font-semibold", mode === 'dark' ? 'text-red-300' : 'text-red-600')}>{title}</h3>
      <p className={clsx("mt-2 max-w-md text-sm", mode === 'dark' ? 'text-red-400' : 'text-red-500')}>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={clsx("mt-4 rounded px-4 py-2 text-sm font-medium text-white shadow focus:outline-none focus:ring-2 focus:ring-red-400", mode === 'dark' ? 'bg-red-500 hover:bg-red-600 focus:ring-offset-slate-950' : 'bg-red-500 hover:bg-red-600 focus:ring-offset-2')}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};

export default ErrorState;

