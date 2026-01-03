import React from "react";
import { FeatureToggleList, QuickActions } from "../components";
import { useSuperAdmin } from "../../../contexts/SuperAdminContext";
import { useThemeContext } from "../../../contexts/ThemeContext";

const PLATFORM_TOGGLES = [
  {
    id: "maintenance_mode",
    name: "Maintenance mode",
    description:
      "Temporarily disable school access while maintenance is in progress.",
    enabled: false,
    category: "Platform",
  },
  {
    id: "backup_enabled",
    name: "Nightly backups",
    description: "Generate encrypted backups of all school data each night.",
    enabled: true,
    category: "Data management",
  },
  {
    id: "webhooks_active",
    name: "Webhooks enabled",
    description: "Send lifecycle events to external systems.",
    enabled: true,
    category: "Integrations",
  },
];

export const SettingsScreen: React.FC = () => {
  const { refreshPlatform } = useSuperAdmin();
  const { mode } = useThemeContext();
  const [toggles, setToggles] = React.useState(PLATFORM_TOGGLES);

  return (
    <div className="space-y-6">
      <div
        className={
          mode === "dark"
            ? "rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm"
            : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className={
                mode === "dark"
                  ? "text-lg font-semibold text-slate-100"
                  : "text-lg font-semibold text-slate-900"
              }
            >
              Platform settings
            </h1>
            <p
              className={
                mode === "dark"
                  ? "text-sm text-slate-400"
                  : "text-sm text-slate-500"
              }
            >
              Configure notification channels, API keys, maintenance windows,
              and integrations.
            </p>
          </div>
          <QuickActions
            actions={[
              {
                id: "refresh",
                label: "Refresh state",
                onClick: refreshPlatform,
              },
              {
                id: "open-docs",
                label: "Open docs",
                onClick: () =>
                  window.open("https://sms.ariadelta.af", "_blank"),
              },
            ]}
          />
        </div>
      </div>

      <div
        className={
          mode === "dark"
            ? "rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm"
            : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        }
      >
        <h2
          className={
            mode === "dark"
              ? "text-sm font-semibold text-slate-100"
              : "text-sm font-semibold text-slate-900"
          }
        >
          Configuration toggles
        </h2>
        <p
          className={
            mode === "dark"
              ? "text-xs text-slate-400"
              : "text-xs text-slate-500"
          }
        >
          Adjust platform-wide feature flags. Changes apply instantly across all
          schools.
        </p>
        <div className="mt-4">
          <FeatureToggleList
            features={toggles}
            onToggle={(featureId, enabled) =>
              setToggles((prev) =>
                prev.map((feature) =>
                  feature.id === featureId ? { ...feature, enabled } : feature
                )
              )
            }
          />
        </div>
      </div>

      <div
        className={
          mode === "dark"
            ? "rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm"
            : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        }
      >
        <h2
          className={
            mode === "dark"
              ? "text-sm font-semibold text-slate-100"
              : "text-sm font-semibold text-slate-900"
          }
        >
          API keys & integrations
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className={
                mode === "dark"
                  ? "text-xs font-medium uppercase text-slate-400"
                  : "text-xs font-medium uppercase text-slate-500"
              }
            >
              Primary API key
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                value="sk_live_*************"
                readOnly
                className={
                  mode === "dark"
                    ? "w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none bg-slate-950"
                    : "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:outline-none"
                }
              />
              <button
                type="button"
                className={
                  mode === "dark"
                    ? "rounded-lg border border-slate-700 px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    : "rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                }
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <label
              className={
                mode === "dark"
                  ? "text-xs font-medium uppercase text-slate-400"
                  : "text-xs font-medium uppercase text-slate-500"
              }
            >
              Email sender
            </label>
            <input
              value="notifications@sms.ariadelta.af"
              readOnly
              className={
                mode === "dark"
                  ? "mt-1 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none bg-slate-950"
                  : "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:outline-none"
              }
            />
            <p
              className={
                mode === "dark"
                  ? "mt-1 text-xs text-slate-400"
                  : "mt-1 text-xs text-slate-500"
              }
            >
              Update SMTP credentials in environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
