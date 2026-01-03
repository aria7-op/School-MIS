import React from 'react';
import clsx from 'clsx';
import { AdvancedFilters, AdvancedDataTable, QuickActions } from '../components';
import { useSuperAdmin } from '../../../contexts/SuperAdminContext';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { AuditLogEntry } from '../types';

export const ActivityLogs: React.FC = () => {
  const { auditLogs, auditLogQuery, refreshPlatform } = useSuperAdmin();
  const { mode } = useThemeContext();
  const [filters, setFilters] = React.useState({
    search: '',
    action: '',
  });

  const rows = React.useMemo(() => {
    let data: AuditLogEntry[] = auditLogs;
    if (filters.action) {
      const matcher = filters.action.toLowerCase();
      data = data.filter((log) => log.action.toLowerCase().includes(matcher));
    }
    if (filters.search) {
      const lower = filters.search.toLowerCase();
      data = data.filter(
        (log) =>
          log.actorName?.toLowerCase().includes(lower) ||
          log.entityType.toLowerCase().includes(lower) ||
          log.action.toLowerCase().includes(lower),
      );
    }
    return data;
  }, [auditLogs, filters]);

  return (
    <div className="space-y-6">
      <div className={clsx("rounded-xl border p-4 shadow-sm", mode === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={clsx("text-lg font-semibold", mode === 'dark' ? 'text-white' : 'text-slate-900')}>
              Activity logs
            </h1>
            <p className={clsx("text-sm", mode === 'dark' ? 'text-white' : 'text-slate-500')}>
              Monitor platform-level changes and audit-ready actions across schools.
            </p>
          </div>
          <QuickActions
            actions={[
              {
                id: 'refresh',
                label: 'Refresh stream',
                onClick: refreshPlatform,
              },
              {
                id: 'export',
                label: 'Export logs',
                onClick: () => console.log('export logs'),
              },
            ]}
          />
        </div>
      </div>

      <AdvancedFilters
        filters={filters}
        onChange={setFilters}
        config={[
          {
            id: 'search',
            label: 'Search',
            type: 'search',
            placeholder: 'Search by actor or entity',
          },
          {
            id: 'action',
            label: 'Action',
            type: 'search',
            placeholder: 'Filter by action keyword',
          },
        ]}
        className={clsx("rounded-xl border p-4 shadow-sm", mode === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}
      />

      <AdvancedDataTable<AuditLogEntry>
        data={rows}
        columns={[
          {
            key: 'createdAt',
            header: 'Timestamp',
            accessor: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'),
          },
          {
            key: 'action',
            header: 'Action',
            accessor: (row) => (
              <div>
                <div className={clsx("font-medium", mode === 'dark' ? 'text-white' : 'text-slate-900')}>
                  {row.action.replace(/_/g, ' ')}
                </div>
                <div className={clsx("text-xs", mode === 'dark' ? 'text-white' : 'text-slate-500')}>
                  {row.entityType}
                  {row.entityId ? ` • ${row.entityId}` : ''}
                </div>
              </div>
            ),
          },
          {
            key: 'actor',
            header: 'Actor',
            accessor: (row) => (
              <div className={clsx("text-xs", mode === 'dark' ? 'text-white' : 'text-slate-500')}>
                {row.actorName ?? 'System'} {row.actorRole ? `(${row.actorRole})` : ''}
              </div>
            ),
          },
        ]}
        isLoading={auditLogQuery.isLoading}
        getRowId={(row) => row.id}
        emptyState={{
          title: 'No activity yet',
          description: 'New platform actions will appear here automatically.',
        }}
      />
    </div>
  );
};

export default ActivityLogs;

