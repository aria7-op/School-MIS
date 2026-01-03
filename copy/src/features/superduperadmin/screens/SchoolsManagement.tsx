import React from 'react';
import clsx from 'clsx';
import {
  AdvancedDataTable,
  AdvancedFilters,
  CreateSchoolModal,
  PackageBadge,
  QuickActions,
} from '../components';
import { useSuperAdmin } from '../../../contexts/SuperAdminContext';
import platformService from '../services/platformService';
import {
  CreatePlatformSchoolPayload,
  PlatformSchoolFilters,
  PlatformSchoolSummary,
} from '../types';
import { useToast } from '../../../contexts/ToastContext';
import { useThemeContext } from '../../../contexts/ThemeContext';

export const SchoolsManagement: React.FC = () => {
  const { schoolsQuery, packages, refreshPlatform, schools } = useSuperAdmin();
  const toast = useToast();
  const { mode } = useThemeContext();

  const [filters, setFilters] = React.useState<PlatformSchoolFilters>({
    status: '',
    search: '',
  });
  const [isCreateModalOpen, setCreateModalOpen] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);

  const handleCreateSchool = async (payload: CreatePlatformSchoolPayload) => {
    try {
      setSubmitting(true);
      await platformService.createSchool(payload);
      toast.success('School created successfully.', 'The school environment is ready.');
      setCreateModalOpen(false);
      await refreshPlatform();
    } catch (error: any) {
      toast.error('Failed to create school', error?.message ?? 'Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSchools = React.useMemo(() => {
    let rows: PlatformSchoolSummary[] = schools ?? [];
    if (filters.packageId) {
      rows = rows.filter((school) => school.subscription?.package?.id === filters.packageId);
    }
    if (filters.status) {
      rows = rows.filter((school) => school.status.toLowerCase() === filters.status?.toLowerCase());
    }
    if (filters.search) {
      const lower = filters.search.toLowerCase();
      rows = rows.filter(
        (school) =>
          school.name.toLowerCase().includes(lower) ||
          (school.ownerName ?? '').toLowerCase().includes(lower),
      );
    }
    return rows;
  }, [filters, schools]);

  const containerVariant = mode === 'dark'
    ? 'border-slate-800 bg-slate-900 text-slate-100'
    : 'border-slate-100 bg-white text-slate-800 shadow-[0_24px_45px_-28px_rgba(15,23,42,0.24)]';

  return (
    <div className="space-y-6">
      <div
        className={clsx(
          'flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between',
          containerVariant,
        )}
      >
        <div>
          <h1 className={clsx("text-lg font-semibold transition-colors duration-200", mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>
            Schools registry
          </h1>
          <p className={clsx("text-sm transition-colors duration-200", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
            Manage schools provisioned under the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            Create school
          </button>
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
            placeholder: 'Search by school or owner',
          },
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Pending', value: 'pending' },
              { label: 'Suspended', value: 'suspended' },
            ],
          },
          {
            id: 'packageId',
            label: 'Package',
            type: 'select',
            options: packages.map((pkg) => ({ label: pkg.name, value: pkg.id })),
          },
        ]}
        className={clsx(
          'rounded-xl border p-4 shadow-sm transition-colors duration-200',
          containerVariant,
        )}
      />

      <AdvancedDataTable<PlatformSchoolSummary>
        data={filteredSchools}
        columns={[
          {
            key: 'name',
            header: 'School',
            accessor: (row) => (
              <div>
                <div className={clsx("font-medium", mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>{row.name}</div>
                <div className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                  {row.city ?? 'Unknown'}, {row.country ?? '—'}
                </div>
              </div>
            ),
          },
          {
            key: 'ownerName',
            header: 'Owner',
            accessor: (row) => (
              <div>
                <div className={clsx("text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                  {row.ownerName ?? '—'}
                </div>
                <div className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                  {row.ownerEmail ?? '—'}
                </div>
              </div>
            ),
            visible: true,
          },
          {
            key: 'packageId',
            header: 'Package',
            accessor: (row) => {
              const pkgId = row.subscription?.package?.id;
              const pkg = packages.find((item) => item.id === pkgId);
              return pkg ? (
                <PackageBadge pkg={pkg} showStatus={false} />
              ) : (
                <span className="text-xs text-slate-400">Unknown</span>
              );
            },
          },
          {
            key: 'status',
            header: 'Status',
            accessor: (row) => (
              <span className={clsx(
                'rounded-full px-2 py-0.5 text-xs uppercase',
                mode === 'dark'
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-100 text-slate-600'
              )}>
                {row.status}
              </span>
            ),
            align: 'center',
          },
          {
            key: 'createdAt',
            header: 'Created',
            accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
          },
        ]}
        isLoading={schoolsQuery.isLoading}
        getRowId={(row) => row.id}
        actions={
          <QuickActions
            actions={[
              {
                id: 'refresh',
                label: 'Refresh',
                onClick: refreshPlatform,
              },
            ]}
          />
        }
        onRowClick={(row) => {
          toast.info('Opening school details', row.name);
        }}
      />

      <CreateSchoolModal
        open={isCreateModalOpen}
        packages={packages}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSchool}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default SchoolsManagement;

