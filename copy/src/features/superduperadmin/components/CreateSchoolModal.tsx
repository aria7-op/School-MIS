import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { CreatePlatformSchoolPayload, PlatformPackage } from '../types';
import { useThemeContext } from '../../../contexts/ThemeContext';
import FullScreenOverlay from './infrastructure/FullScreenOverlay';

interface CreateSchoolModalProps {
  open: boolean;
  packages: PlatformPackage[];
  onClose: () => void;
  onSubmit: (payload: CreatePlatformSchoolPayload) => Promise<void> | void;
  isSubmitting?: boolean;
}

interface CreateSchoolFormState {
  schoolName: string;
  schoolCode: string;
  schoolPhone: string;
  country: string;
  state: string;
  city: string;
  address: string;
  ownerName: string;
  ownerPhone: string;
  ownerPassword: string;
  superAdminUsername: string;
  superAdminPassword: string;
  superAdminFirstName: string;
  superAdminLastName: string;
  packageId: string;
  notes: string;
}

const initialState: CreateSchoolFormState = {
  schoolName: '',
  schoolCode: '',
  schoolPhone: '',
  country: '',
  state: '',
  city: '',
  address: '',
  ownerName: '',
  ownerPhone: '',
  ownerPassword: '',
  superAdminUsername: '',
  superAdminPassword: '',
  superAdminFirstName: '',
  superAdminLastName: '',
  packageId: '',
  notes: '',
};

const sampleSchoolData: Partial<CreateSchoolFormState> = {
  schoolName: 'Horizon Academy Kabul',
  schoolCode: 'HZ-KBL-01',
  schoolPhone: '+93 700 123 456',
  country: 'Afghanistan',
  state: 'Kabul',
  city: 'Kabul',
  address: 'Street 4, Karte Seh, Kabul',
  ownerName: 'Ahmad Wahidi',
  ownerPhone: '+93 700 222 333',
  ownerPassword: 'Owner@1234',
  superAdminUsername: 'horizon_admin',
  superAdminPassword: 'Admin@1234',
  superAdminFirstName: 'Fatima',
  superAdminLastName: 'Ahmadi',
  notes: 'Demo onboarding account created via autofill.',
};

export const CreateSchoolModal: React.FC<CreateSchoolModalProps> = ({
  open,
  packages,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const { mode } = useThemeContext();
  const [formState, setFormState] = useState<CreateSchoolFormState>(initialState);

  useEffect(() => {
    if (open) {
      setFormState((prev) => ({
        ...prev,
        packageId: packages[0]?.id ?? '',
        schoolCode: '',
      }));
    } else {
      setFormState(initialState);
    }
  }, [open, packages]);

  if (!open) {
    return null;
  }

  const handleAutofill = () => {
    setFormState((prev) => ({
      ...prev,
      ...sampleSchoolData,
      packageId: prev.packageId || packages[0]?.id || '',
    }));
  };

  const handleChange = (field: keyof CreateSchoolFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: CreatePlatformSchoolPayload = {
      owner: {
        name: formState.ownerName,
        phone: formState.ownerPhone,
        password: formState.ownerPassword,
      },
      superAdmin: {
        username: formState.superAdminUsername,
        password: formState.superAdminPassword,
        firstName: formState.superAdminFirstName,
        lastName: formState.superAdminLastName,
        phone: formState.ownerPhone,
      },
      school: {
        name: formState.schoolName,
        code: formState.schoolCode || formState.schoolName.replace(/\s+/g, '-').toUpperCase(),
        phone: formState.schoolPhone,
        country: formState.country,
        state: formState.state,
        city: formState.city,
        address: formState.address,
        metadata: formState.notes
          ? {
              notes: formState.notes,
            }
          : undefined,
      },
      packageId: formState.packageId,
      subscription: {
        durationDays: 365,
        autoRenew: true,
      },
    };
    await onSubmit(payload);
  };

  return (
    <>
      <div className="fixed top-0 left-0 z-[90] bg-slate-900/50 backdrop-blur" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, top: 0, left: 0, right: 0, bottom: 0 }} />
      <div className="fixed top-0 left-0 z-[91] flex items-center justify-center p-4" style={{ width: '100vw', height: '100vh', margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
        <form
          onSubmit={handleSubmit}
          className={clsx(
            "superduperadmin-modal-form flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl shadow-2xl",
            mode === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'
          )}
        >
          <div className={clsx("flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4", mode === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
            <h2 className={clsx("text-lg font-semibold", mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>
              Create new school
            </h2>
            <div className="flex items-center gap-2">
              {/* <button
                type="button"
                onClick={handleAutofill}
                className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                
              >
                <span className="mr-1">⚡</span>
                Autofill sample data
              </button> */}
              <button
                type="button"
                onClick={onClose}
                className={clsx(
                  "rounded-full p-2 transition focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  mode === 'dark' 
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300' 
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                )}
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                School name
              </label>
              <input
                required
                value={formState.schoolName}
                onChange={(event) => handleChange('schoolName', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="e.g. Horizon Academy"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                School code
              </label>
              <input
                value={formState.schoolCode}
                onChange={(event) => handleChange('schoolCode', event.target.value.toUpperCase())}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="Unique code (e.g. HZN-01)"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                School phone
              </label>
              <input
                required
                value={formState.schoolPhone}
                onChange={(event) => handleChange('schoolPhone', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="+93…"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Package
              </label>
              <select
                required
                value={formState.packageId}
                onChange={(event) => handleChange('packageId', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.supportLevel ?? 'Standard'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Country
              </label>
              <input
                value={formState.country ?? ''}
                onChange={(event) => handleChange('country', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="Country"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Province / State
              </label>
              <input
                value={formState.state}
                onChange={(event) => handleChange('state', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="State or province"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                City
              </label>
              <input
                value={formState.city}
                onChange={(event) => handleChange('city', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="City"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Address
              </label>
              <textarea
                required
                value={formState.address}
                onChange={(event) => handleChange('address', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="Campus address"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Owner name
              </label>
              <input
                required
                value={formState.ownerName}
                onChange={(event) => handleChange('ownerName', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="Owner full name"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Owner phone
              </label>
              <input
                value={formState.ownerPhone}
                onChange={(event) => handleChange('ownerPhone', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="+93…"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Owner password
              </label>
              <input
                type="password"
                required
                value={formState.ownerPassword}
                onChange={(event) => handleChange('ownerPassword', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="Secure password"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Platform admin username
              </label>
              <input
                required
                value={formState.superAdminUsername}
                onChange={(event) => handleChange('superAdminUsername', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="username"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Platform admin password
              </label>
              <input
                type="password"
                required
                value={formState.superAdminPassword}
                onChange={(event) => handleChange('superAdminPassword', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="Secure password"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Platform admin first name
              </label>
              <input
                required
                value={formState.superAdminFirstName}
                onChange={(event) => handleChange('superAdminFirstName', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="First name"
              />
            </div>
            <div>
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Platform admin last name
              </label>
              <input
                required
                value={formState.superAdminLastName}
                onChange={(event) => handleChange('superAdminLastName', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="Last name"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={clsx("text-xs font-medium uppercase", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Notes
              </label>
              <textarea
                value={formState.notes}
                onChange={(event) => handleChange('notes', event.target.value)}
                className={clsx("mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-slate-200')}
                placeholder="Internal notes for account managers"
              />
            </div>
            </div>
          </div>
          <div className={clsx("flex flex-col-reverse gap-3 border-t px-6 py-4 sm:flex-row sm:justify-end", mode === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
            <button
              type="button"
              onClick={onClose}
              className={clsx("rounded-lg border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400", mode === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-white/30')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating…' : 'Create school'}
            </button>
          </div>
        </form>
      </div>
      <FullScreenOverlay
        visible={Boolean(isSubmitting)}
        title="Provisioning school"
        message="We are preparing the school environment. This may take a few seconds."
      />
    </>
  );
};

export default CreateSchoolModal;

