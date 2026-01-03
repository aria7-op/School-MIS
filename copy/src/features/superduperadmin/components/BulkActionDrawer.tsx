import React from 'react';
import clsx from 'clsx';
import { PlatformSchoolSummary } from '../types';
import { useThemeContext } from '../../../contexts/ThemeContext';

interface BulkActionPayload {
  action: string;
  schoolIds: string[];
  metadata?: Record<string, unknown>;
}

interface BulkActionDrawerProps {
  open: boolean;
  schools: PlatformSchoolSummary[];
  selectedSchoolIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onClose: () => void;
  onExecute: (payload: BulkActionPayload) => Promise<void> | void;
  actions: Array<{ id: string; label: string; destructive?: boolean }>;
  isExecuting?: boolean;
}

export const BulkActionDrawer: React.FC<BulkActionDrawerProps> = ({
  open,
  schools,
  selectedSchoolIds,
  onSelectionChange,
  onClose,
  onExecute,
  actions,
  isExecuting,
}) => {
  const { mode } = useThemeContext();
  const [selectedAction, setSelectedAction] = React.useState<string>('');
  const [metadata, setMetadata] = React.useState<string>('');

  React.useEffect(() => {
    if (!open) {
      setSelectedAction('');
      setMetadata('');
    }
  }, [open]);

  const toggleSchool = (schoolId: string) => {
    if (selectedSchoolIds.includes(schoolId)) {
      onSelectionChange(selectedSchoolIds.filter((id) => id !== schoolId));
    } else {
      onSelectionChange([...selectedSchoolIds, schoolId]);
    }
  };

  const handleExecute = async () => {
    if (!selectedAction || !selectedSchoolIds.length) return;
    await onExecute({
      action: selectedAction,
      schoolIds: selectedSchoolIds,
      metadata: metadata ? { notes: metadata } : undefined,
    });
  };

  return (
    <div
      className={clsx(
        'fixed inset-y-0 right-0 z-[95] w-full max-w-md transform shadow-2xl transition-transform',
        open ? 'translate-x-0' : 'translate-x-full',
        mode === 'dark' ? 'bg-slate-900' : 'bg-white'
      )}
    >
      <div className="flex h-full flex-col">
        <div className={clsx('flex items-center justify-between border-b p-4', mode === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
           <div>
             <h3 className={clsx('text-lg font-semibold', mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>
               Bulk actions
             </h3>
             <p className={clsx('text-xs', mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
               Select up to 50 schools for mass updates.
             </p>
           </div>
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              'rounded-full p-2 text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500',
              mode === 'dark' ? 'hover:bg-slate-800 hover:text-slate-300' : 'hover:bg-slate-100 hover:text-slate-600'
            )}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <label className={clsx('text-xs font-medium uppercase', mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Action
              </label>
              <select
                value={selectedAction}
                onChange={(event) => setSelectedAction(event.target.value)}
                className={clsx(
                  'mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400',
                  mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200'
                )}
              >
                <option value="">Select action</option>
                {actions.map((action) => (
                  <option key={action.id} value={action.id}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={clsx('text-xs font-medium uppercase', mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Selected schools ({selectedSchoolIds.length})
              </label>
              <div className={clsx('mt-2 max-h-52 space-y-2 overflow-y-auto rounded-lg border p-3', mode === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
                {schools.map((school) => (
                  <label
                    key={school.id}
                    className={clsx('flex items-center justify-between rounded-lg border px-3 py-2 text-sm', mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}
                  >
                    <div>
                      <div className={clsx('font-medium', mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>
                        {school.name}
                      </div>
                      <div className={clsx('text-xs', mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        {school.subscription?.package?.name ?? 'No package'} • {school.status}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedSchoolIds.includes(school.id)}
                      onChange={() => toggleSchool(school.id)}
                    />
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={clsx('text-xs font-medium uppercase', mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Notes
              </label>
              <textarea
                value={metadata}
                onChange={(event) => setMetadata(event.target.value)}
                className={clsx(
                  'mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400',
                  mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200'
                )}
                placeholder="Add an internal note for the bulk change log."
                rows={4}
              />
            </div>
          </div>
        </div>
        <div className={clsx('border-t p-4', mode === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
          <button
            type="button"
            disabled={!selectedAction || !selectedSchoolIds.length || isExecuting}
            onClick={handleExecute}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isExecuting ? 'Running action…' : 'Run action'}
          </button>
        </div>
      </div>
    </div>
  );
};


