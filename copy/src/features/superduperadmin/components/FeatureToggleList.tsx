import React from "react";
import clsx from "clsx";
import { useThemeContext } from "../../../contexts/ThemeContext";

export interface FeatureToggle {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  category?: string;
  locked?: boolean;
}

interface FeatureToggleListProps {
  features: FeatureToggle[];
  onToggle?: (featureId: string, newValue: boolean) => void;
  disabled?: boolean;
}

export const FeatureToggleList: React.FC<FeatureToggleListProps> = ({
  features,
  onToggle,
  disabled,
}) => {
  const { mode } = useThemeContext();
  const groupedFeatures = React.useMemo(() => {
    const groups = new Map<string, FeatureToggle[]>();
    features.forEach((feature) => {
      const key = feature.category ?? "General";
      const existing = groups.get(key) ?? [];
      existing.push(feature);
      groups.set(key, existing);
    });
    return Array.from(groups.entries());
  }, [features]);

  if (!features.length) {
    return (
      <div
        className={clsx(
          "rounded-lg border p-4 text-sm",
          mode === "dark"
            ? "border-slate-800 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-500"
        )}
      >
        No toggles available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedFeatures.map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h4
            className={clsx(
              "text-xs font-semibold uppercase tracking-wide",
              mode === "dark" ? "text-white" : "text-slate-500"
            )}
          >
            {category}
          </h4>
          <div
            className={clsx(
              "space-y-2 rounded-lg border",
              mode === "dark"
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            )}
          >
            {items.map((feature) => (
              <label
                key={feature.id}
                className={clsx(
                  "flex cursor-pointer items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0",
                  mode === "dark" ? "border-slate-800" : "border-slate-100",
                  feature.locked ? "opacity-60" : ""
                )}
              >
                <div>
                  <div
                    className={clsx(
                      "text-sm font-medium",
                      mode === "dark" ? "text-white" : "text-slate-900"
                    )}
                  >
                    {feature.name}
                    {feature.locked && (
                      <span
                        className={clsx(
                          "ml-2 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide",
                          mode === "dark"
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        Locked
                      </span>
                    )}
                  </div>
                  {feature.description && (
                    <p
                      className={clsx(
                        "text-xs",
                        mode === "dark" ? "text-white" : "text-slate-500"
                      )}
                    >
                      {feature.description}
                    </p>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-9 rounded-full bg-slate-200 transition checked:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  checked={feature.enabled}
                  disabled={disabled || feature.locked}
                  onChange={(event) =>
                    onToggle?.(feature.id, event.target.checked)
                  }
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeatureToggleList;
