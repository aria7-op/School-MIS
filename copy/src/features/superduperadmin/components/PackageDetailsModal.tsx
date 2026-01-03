import React from 'react';
import clsx from 'clsx';
import { HiOutlineXMark, HiOutlineInformationCircle } from 'react-icons/hi2';
import { PlatformPackage } from '../types';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { normalizePackageFeatures } from '../services/platformService';

interface PackageDetailsModalProps {
  open: boolean;
  pkg?: PlatformPackage;
  onClose: () => void;
}

const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) {
    return '—';
  }
  try {
    return `$${value.toLocaleString()}`;
  } catch {
    return `$${value}`;
  }
};

const buildFeatureRows = (pkg: PlatformPackage | undefined) => {
  if (!pkg?.features) {
    return [];
  }
  const normalized = normalizePackageFeatures(pkg.features);
  return Object.entries(normalized).map(([key, value]) => ({
    key,
    value:
      typeof value === 'boolean'
        ? value
          ? 'Enabled'
          : 'Disabled'
        : value === null || value === undefined
          ? '—'
          : value,
  }));
};

export const PackageDetailsModal: React.FC<PackageDetailsModalProps> = ({ open, pkg, onClose }) => {
  const { mode } = useThemeContext();
  
  if (!open || !pkg) {
    return null;
  }

  const featureRows = buildFeatureRows(pkg);

  return (
    <>
      <div className="fixed top-0 left-0 z-[90] bg-slate-900/60 backdrop-blur-sm" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0 }} />
      <div className="fixed top-0 left-0 z-[91] flex items-center justify-center px-4 py-6" style={{ width: '100vw', height: '100vh', margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
        <div className={clsx("superduperadmin-modal-form relative w-full max-w-2xl overflow-hidden rounded-xl border shadow-2xl", mode === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
          <div className={clsx("flex items-start justify-between gap-4 border-b px-6 py-4", mode === 'dark' ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50')}>
            <div className="flex items-start gap-3">
              <div className={clsx("mt-0.5 rounded-full bg-indigo-500/10 p-2", mode === 'dark' ? 'text-indigo-300' : 'text-indigo-500')}>
                <HiOutlineInformationCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className={clsx("text-base font-semibold", mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>
                  {pkg.name}
                </h2>
                <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                  {pkg.description || 'No description provided.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={clsx("rounded-full p-2 text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500", mode === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100 hover:text-slate-600')}
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                  Pricing
                </h3>
                <div className={clsx("mt-2 space-y-1 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                  <p>
                    <span className={clsx(mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>Monthly:</span>{' '}
                    {formatCurrency(pkg.priceMonthly)}
                  </p>
                  <p>
                    <span className={clsx(mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>Annual:</span>{' '}
                    {formatCurrency(pkg.priceYearly)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                  Support level
                </h3>
                <p className={clsx("mt-2 text-sm", mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>
                  {pkg.supportLevel || 'Standard'}
                </p>
              </div>

              <div className={clsx("grid grid-cols-2 gap-4 text-sm", mode === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                <div>
                  <h4 className={clsx("text-xs uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>Status</h4>
                  <p className="mt-1">
                    {pkg.isActive ? (
                      <span className={clsx("inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium", mode === 'dark' ? 'text-emerald-300' : 'text-emerald-600')}>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                      </span>
                    ) : (
                      <span className={clsx("inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium", mode === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                        <span className="h-2 w-2 rounded-full bg-slate-500" /> Inactive
                      </span>
                    )}
                  </p>
                  </div>
                  <div>
                  <h4 className={clsx("text-xs uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>Updated</h4>
                  <p className="mt-1 text-xs">
                    {pkg.updatedAt
                      ? new Date(pkg.updatedAt).toLocaleString()
                      : 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:col-span-1">
              <h3 className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Feature limits
              </h3>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
                {featureRows.length ? (
                  featureRows.map((item) => (
                    <div
                      key={item.key}
                      className={clsx("flex items-center justify-between rounded-lg border px-3 py-2 text-sm", mode === 'dark' ? 'border-slate-800' : 'border-slate-100')}
                    >
                      <span className={clsx("font-medium capitalize", mode === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                        {item.key.replace(/_/g, ' ')}
                      </span>
                      <span className={clsx(mode === 'dark' ? 'text-slate-200' : 'text-slate-700')}>{item.value}</span>
                    </div>
                  ))
                ) : (
                  <p className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                    No feature limits defined for this package.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={clsx("flex items-center justify-end gap-2 border-t px-6 py-4", mode === 'dark' ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50')}>
            <button
              type="button"
              onClick={onClose}
              className={clsx("rounded-lg border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500", mode === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100')}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PackageDetailsModal;

