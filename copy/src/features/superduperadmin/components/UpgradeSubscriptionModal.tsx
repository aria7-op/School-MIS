import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { PlatformPackage } from "../types";
import FullScreenOverlay from "./infrastructure/FullScreenOverlay";
import { useThemeContext } from "../../../contexts/ThemeContext";

interface UpgradeSubscriptionModalProps {
  open: boolean;
  currentPackageId: string;
  packages: PlatformPackage[];
  onClose: () => void;
  onSubmit: (payload: {
    packageId: string;
    autoRenew?: boolean;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

interface UpgradeFormState {
  packageId: string;
  autoRenew: boolean;
}

export const UpgradeSubscriptionModal: React.FC<
  UpgradeSubscriptionModalProps
> = ({ open, currentPackageId, packages, onClose, onSubmit, isSubmitting }) => {
  const { mode } = useThemeContext();
  const [formState, setFormState] = useState<UpgradeFormState>({
    packageId: "",
    autoRenew: true,
  });

  useEffect(() => {
    if (open) {
      const recommendedPackage =
        packages.find((pkg) => pkg.id !== currentPackageId) ??
        packages[0] ??
        null;
      setFormState({
        packageId: recommendedPackage?.id ?? currentPackageId,
        autoRenew: true,
      });
    }
  }, [open, packages, currentPackageId]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      packageId: formState.packageId,
      autoRenew: formState.autoRenew,
    });
  };

  const currentPackage = packages.find((pkg) => pkg.id === currentPackageId);
  const selectedPackage = packages.find(
    (pkg) => pkg.id === formState.packageId
  );

  return (
    <>
      <div
        className="fixed top-0 left-0 z-[90] bg-slate-900/50 backdrop-blur"
        style={{
          width: "100vw",
          height: "100vh",
          margin: 0,
          padding: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <div
        className="fixed top-0 left-0 z-[91] flex items-center justify-center p-4"
        style={{
          width: "100vw",
          height: "100vh",
          margin: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <form
          onSubmit={handleSubmit}
          className={clsx(
            "superduperadmin-modal-form w-full max-w-xl rounded-xl p-6 shadow-2xl",
            mode === "dark"
              ? "border border-slate-800 bg-slate-900"
              : "bg-white"
          )}
        >
          <div className="flex items-center justify-between">
            <h2
              className={clsx(
                "text-lg font-semibold",
                mode === "dark" ? "text-slate-100" : "text-slate-900"
              )}
            >
              Upgrade subscription
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                "rounded-full p-2 text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500",
                mode === "dark"
                  ? "hover:bg-slate-800 hover:text-slate-300"
                  : "hover:bg-slate-100 hover:text-slate-600"
              )}
            >
              ✕
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div
              className={clsx(
                "rounded-lg border p-3 text-sm",
                mode === "dark"
                  ? "border-slate-800 bg-slate-800/50"
                  : "border-slate-200 bg-slate-50"
              )}
            >
              <div
                className={clsx(
                  "font-semibold",
                  mode === "dark" ? "text-slate-200" : "text-slate-700"
                )}
              >
                Current package
              </div>
              <div
                className={clsx(
                  "mt-1",
                  mode === "dark" ? "text-slate-300" : "text-slate-600"
                )}
              >
                {currentPackage ? currentPackage.name : "Not assigned"}
              </div>
            </div>
            <div>
              <label
                className={clsx(
                  "text-xs font-medium uppercase",
                  mode === "dark" ? "text-slate-400" : "text-slate-500"
                )}
              >
                New package
              </label>
              <select
                required
                value={formState.packageId}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    packageId: event.target.value,
                  }))
                }
                className={clsx(
                  "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                  mode === "dark"
                    ? "border-slate-700 bg-slate-950 text-slate-100"
                    : "border-slate-200"
                )}
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — ${pkg.priceMonthly.toLocaleString()}/mo • $
                    {pkg.priceYearly.toLocaleString()}/yr
                  </option>
                ))}
              </select>
            </div>
            <label
              className={clsx(
                "flex items-center gap-2 text-sm",
                mode === "dark" ? "text-slate-300" : "text-slate-600"
              )}
            >
              <input
                type="checkbox"
                checked={formState.autoRenew}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    autoRenew: event.target.checked,
                  }))
                }
              />
              Enable auto-renewal
            </label>
            {selectedPackage && (
              <div
                className={clsx(
                  "rounded-lg border p-3 text-xs",
                  mode === "dark"
                    ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-200"
                    : "border-indigo-200 bg-indigo-50 text-indigo-700"
                )}
              >
                Upgrading to <strong>{selectedPackage.name}</strong> —{" "}
                <strong>
                  ${selectedPackage.priceMonthly.toLocaleString()}/mo
                </strong>{" "}
                or{" "}
                <strong>
                  ${selectedPackage.priceYearly.toLocaleString()}/yr
                </strong>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                "rounded-lg border px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400",
                mode === "dark"
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-slate-200 text-slate-600 hover:bg-slate-100"
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Applying…" : "Apply upgrade"}
            </button>
          </div>
        </form>
      </div>
      <FullScreenOverlay
        visible={Boolean(isSubmitting)}
        title="Updating subscription"
        message="Please hold on while we finalize the upgrade."
      />
    </>
  );
};

export default UpgradeSubscriptionModal;
