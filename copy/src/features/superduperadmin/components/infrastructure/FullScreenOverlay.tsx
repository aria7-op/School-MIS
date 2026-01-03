import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '../../../../contexts/ThemeContext';

interface FullScreenOverlayProps {
  visible: boolean;
  title?: string;
  message?: string;
  children?: React.ReactNode;
}

export const FullScreenOverlay: React.FC<FullScreenOverlayProps> = ({
  visible,
  title,
  message,
  children,
}) => {
  const { t } = useTranslation();
  const { mode } = useThemeContext();

  const defaultTitle = title || t('overlay.workingOnIt', 'Working on it…');
  const defaultMessage = message || t('overlay.pleaseWait', 'Please wait while we process your request.');

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/70 backdrop-blur">
      <div className={clsx("rounded-xl p-8 text-center shadow-2xl", mode === 'dark' ? 'bg-slate-900' : 'bg-white')}>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
        <h2 className={clsx("text-lg font-semibold", mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>{defaultTitle}</h2>
        <p className={clsx("mt-2 text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-600')}>{defaultMessage}</p>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};

export default FullScreenOverlay;

