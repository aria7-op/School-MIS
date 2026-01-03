import React from "react";
import { HiOutlineEye } from "react-icons/hi2";
import {
  AdvancedDataTable,
  ClonePackageModal,
  FeatureToggleList,
  PackageBadge,
  PackageDetailsModal,
  QuickActions,
} from "../components";
import { useSuperAdmin } from "../../../contexts/SuperAdminContext";
import platformService, {
  normalizePackageFeatures,
} from "../services/platformService";
// import packageFeatureCatalog from '../../../../../shared/packageFeatures.json';
const packageFeatureCatalog = {
  boolean: [] as Array<{
    key: string;
    label?: string;
    description?: string;
    category?: string;
    kind?: string;
  }>,
};
import { PlatformPackage } from "../types";
import { useToast } from "../../../contexts/ToastContext";
import clsx from "clsx";
import { useThemeContext } from "../../../contexts/ThemeContext";

export const PackagesManagement: React.FC = () => {
  const { packages, packagesQuery, refreshPlatform } = useSuperAdmin();
  const toast = useToast();
  const [selectedPackage, setSelectedPackage] =
    React.useState<PlatformPackage | null>(null);
  const [isCloneModalOpen, setCloneModalOpen] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [detailsPackage, setDetailsPackage] =
    React.useState<PlatformPackage | null>(null);

  const handleSavePackage = async (payload: any) => {
    try {
      setSubmitting(true);
      if (selectedPackage) {
        await platformService.updatePackage(selectedPackage.id, payload);
        toast.success("Package updated", "Changes saved successfully.");
      } else {
        await platformService.createPackage(payload);
        toast.success("Package created", "The package is now available.");
      }
      setCloneModalOpen(false);
      setSelectedPackage(null);
      await refreshPlatform();
    } catch (error: any) {
      toast.error("Save failed", error?.message ?? "Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };
  const { mode } = useThemeContext();

  return (
    <div className="space-y-6">
      <div className={clsx("rounded-xl border p-4 shadow-sm", mode === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={clsx("text-lg font-semibold", mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>
              Packages
            </h1>
            <p className={clsx("text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
              Manage SaaS bundles and feature toggles available to schools.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshPlatform}
              className={clsx(
                "rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
                mode === "dark"
                  ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              )}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPackage(null);
                setCloneModalOpen(true);
              }}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              New package
            </button>
          </div>
        </div>
      </div>

      <AdvancedDataTable<PlatformPackage>
        data={packages}
        columns={[
          {
            key: "name",
            header: "Package",
            accessor: (row) => <PackageBadge pkg={row} />,
          },
          {
            key: "features",
            header: "Features",
            accessor: (row) => (
              <span className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                {Object.keys(row.features ?? {}).length} configured
              </span>
            ),
            align: "center",
          },
          {
            key: "priceMonthly",
            header: "Pricing",
            accessor: (row) => (
              <div className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Monthly: ${row.priceMonthly.toLocaleString()}
                <br />
                Annual: ${row.priceYearly.toLocaleString()}
              </div>
            ),
          },
          {
            key: "isActive",
            header: "Status",
            accessor: (row) => (
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs uppercase",
                  row.isActive
                    ? mode === 'dark'
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-emerald-500/10 text-emerald-600"
                    : mode === 'dark'
                    ? "bg-slate-500/10 text-slate-300"
                    : "bg-slate-500/10 text-slate-600"
                )}
              >
                {row.isActive ? "Active" : "Inactive"}
              </span>
            ),
            align: "center",
          },
          {
            key: "view" as keyof PlatformPackage & string,
            header: "",
            accessor: (row) => (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDetailsPackage(row);
                  }}
                  className={clsx(
                    "rounded-lg border p-2 transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    mode === "dark"
                      ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-indigo-300"
                      : "border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-500"
                  )}
                  aria-label="View package details"
                >
                  <HiOutlineEye className="h-5 w-5" />
                </button>
              </div>
            ),
            width: "64px",
            align: "right",
          },
        ]}
        isLoading={packagesQuery.isLoading}
        getRowId={(row) => row.id}
        onRowClick={(pkg) => {
          setSelectedPackage(pkg);
          setCloneModalOpen(true);
        }}
        actions={
          <QuickActions
            actions={[
              {
                id: "edit",
                label: "Edit selected",
                onClick: () => {
                  if (selectedPackage) {
                    setCloneModalOpen(true);
                  } else {
                    toast.info(
                      "Select a package",
                      "Choose a package row to edit."
                    );
                  }
                },
              },
              {
                id: "toggle",
                label: selectedPackage
                  ? selectedPackage.isActive
                    ? "Deactivate"
                    : "Activate"
                  : "Toggle status",
                onClick: async () => {
                  if (!selectedPackage) {
                    toast.info(
                      "Select a package",
                      "Choose a package row first."
                    );
                    return;
                  }
                  try {
                    await platformService.togglePackageStatus(
                      selectedPackage.id,
                      !selectedPackage.isActive
                    );
                    toast.success(
                      "Status updated",
                      "Package status has been updated."
                    );
                    await refreshPlatform();
                  } catch (error: any) {
                    toast.error(
                      "Failed to update status",
                      error?.message ?? "Try again later."
                    );
                  }
                },
              },
            ]}
          />
        }
      />

      {selectedPackage && (
        <div
          className={clsx(
            "rounded-xl border p-4 shadow-sm",
            mode === "dark"
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          )}
        >
          <h2
            className={clsx(
              "text-sm font-semibold",
              mode === "dark" ? "text-slate-100" : "text-slate-900"
            )}
          >
            Feature toggles
          </h2>
          <FeatureToggleList
            disabled
            features={(() => {
              const normalized = normalizePackageFeatures(
                selectedPackage.features
              );
              return packageFeatureCatalog.boolean.map(
                (
                  feature: (typeof packageFeatureCatalog)["boolean"][number]
                ) => ({
                  id: feature.key,
                  name: feature.label ?? feature.key,
                  description:
                    feature.description ?? "Core platform capability",
                  enabled: Boolean(normalized?.[feature.key]),
                  category:
                    feature.category ??
                    (feature.kind === "module" ? "Modules" : "Advanced"),
                })
              );
            })()}
          />
        </div>
      )}

      <PackageDetailsModal
        open={Boolean(detailsPackage)}
        pkg={detailsPackage ?? undefined}
        onClose={() => setDetailsPackage(null)}
      />

      <ClonePackageModal
        open={isCloneModalOpen}
        sourcePackage={selectedPackage ?? undefined}
        onClose={() => setCloneModalOpen(false)}
        onSubmit={handleSavePackage}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default PackagesManagement;
