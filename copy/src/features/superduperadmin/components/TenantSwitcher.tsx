import React from 'react';
import clsx from 'clsx';
import { PlatformSchoolSummary } from '../types';
import { useThemeContext } from '../../../contexts/ThemeContext';

interface SchoolSwitcherProps {
  schools: PlatformSchoolSummary[];
  currentSchoolId: string | null;
  onSchoolChange: (schoolId: string | null) => void;
  isLoading?: boolean;
  className?: string;
}

export const SchoolSwitcher: React.FC<SchoolSwitcherProps> = ({
  schools,
  currentSchoolId,
  onSchoolChange,
  isLoading,
  className,
}) => {
  const { mode } = useThemeContext();

  const variantClasses =
    mode === 'dark'
      ? 'border-slate-800 bg-slate-950 text-slate-100 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.8)]'
      : 'border-transparent bg-white text-slate-800 shadow-[0_24px_40px_-28px_rgba(37,99,235,0.35)] ring-1 ring-indigo-100';

  return (
    <div
      className={clsx(
        'flex flex-col gap-2 rounded-xl border p-4 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between',
        variantClasses,
        className,
      )}
    >
      <div>
        <div className={clsx("text-xs uppercase tracking-wide transition-colors duration-200", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
          School Context
        </div>
        <div className={clsx("text-base font-semibold transition-colors duration-200", mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>
          {schools.find((school) => school.id === currentSchoolId)?.name ?? 'Select a school'}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:w-80">
        <select
          className={clsx(
            "w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
            mode === 'dark'
              ? 'border-slate-700 bg-slate-950 text-slate-100'
              : 'border-slate-200 bg-white text-slate-700'
          )}
          value={currentSchoolId ?? ''}
          onChange={(event) => onSchoolChange(event.target.value || null)}
          disabled={isLoading || !schools.length}
        >
          <option value="" disabled>
            {isLoading ? 'Loading schools…' : 'Select school'}
          </option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name} • {school.status}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SchoolSwitcher;

