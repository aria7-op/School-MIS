import React from 'react';
import clsx from 'clsx';
import { useThemeContext } from '../../../../contexts/ThemeContext';

interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ lines = 1, className }) => {
  const { mode } = useThemeContext();
  return (
    <div className={`space-y-2 animate-pulse ${className ?? ''}`.trim()}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className={clsx("h-4 rounded", mode === 'dark' ? 'bg-slate-700' : 'bg-slate-200')}
        />
      ))}
    </div>
  );
};

export default SkeletonLoader;

