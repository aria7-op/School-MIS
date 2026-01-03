import React, { useEffect, useState } from "react";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineXMark } from "react-icons/hi2";
import clsx from "clsx";
import {
  buildFeatureDefaults,
  normalizePackageFeatures,
  serializePackageFeatures,
} from "../services/platformService";
import {
  PlatformPackage,
  PlatformPackageFeatureValue,
  PlatformPackageFeatures,
} from "../types";
import FullScreenOverlay from "./infrastructure/FullScreenOverlay";
import { useThemeContext } from "../../../contexts/ThemeContext";

interface PackageModalProps {
  open: boolean;
  sourcePackage?: PlatformPackage;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    description?: string;
    priceMonthly: number;
    priceYearly: number;
    features: PlatformPackageFeatures;
    supportLevel?: string;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

interface PackageFormState {
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  supportLevel: string;
  features: PlatformPackageFeatures;
}

type FeatureRowType = "number" | "boolean" | "text" | "list";

interface FeatureRow {
  id: string;
  key: string;
  type: FeatureRowType;
  value: string | boolean;
  isDefault?: boolean;
}

const PRIORITY_FEATURE_KEYS: string[] = [
  "modules_enabled",
  "max_staff",
  "max_schools",
  "max_students",
  "max_teachers",
  "max_storage_gb",
  "max_branches_per_school",
];

const FEATURE_TYPE_OPTIONS: Array<{ value: FeatureRowType; label: string }> = [
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "text", label: "Text" },
  { value: "list", label: "List (comma separated)" },
];

const DEFAULT_FEATURE_TYPES: Record<string, FeatureRowType> = {
  modules_enabled: "list",
  max_staff: "number",
  max_schools: "number",
  max_students: "number",
  max_teachers: "number",
  max_storage_gb: "number",
  max_branches_per_school: "number",
};

const createRowId = () => `feature-${Math.random().toString(36).slice(2, 10)}`;

const humanizeKey = (key: string) => {
  if (!key) return "New feature";
  return key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const coerceBoolean = (value: string | boolean): boolean => {
  if (typeof value === "boolean") return value;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "on", "enabled"].includes(normalized))
    return true;
  if (["false", "0", "no", "n", "off", "disabled"].includes(normalized))
    return false;
  return false;
};

const detectFeatureType = (
  value: PlatformPackageFeatureValue
): FeatureRowType => {
  if (Array.isArray(value)) return "list";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (
      [
        "true",
        "false",
        "yes",
        "no",
        "on",
        "off",
        "enabled",
        "disabled",
      ].includes(normalized)
    ) {
      return "boolean";
    }
    if (normalized !== "" && Number.isFinite(Number(normalized))) {
      return "number";
    }
  }
  return "text";
};

const formatInputValue = (
  value: PlatformPackageFeatureValue,
  type: FeatureRowType
) => {
  if (type === "boolean") {
    if (typeof value === "boolean") return value;
    return coerceBoolean(
      typeof value === "string" ? value : String(value ?? "")
    );
  }
  if (type === "list") {
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "string") {
      return value;
    }
    return "";
  }
  if (type === "number") {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }
    return "";
  }
  if (value === null || value === undefined) return "";
  return String(value);
};

const mapFeaturesToRows = (features: PlatformPackageFeatures): FeatureRow[] => {
  const rows: FeatureRow[] = [];
  const seen = new Set<string>();
  const addRow = (
    key: string,
    rawValue: PlatformPackageFeatureValue,
    isDefault = false
  ) => {
    const detectedType = detectFeatureType(rawValue);
    const type =
      detectedType === "text" && DEFAULT_FEATURE_TYPES[key]
        ? DEFAULT_FEATURE_TYPES[key]
        : detectedType;
    rows.push({
      id: key || createRowId(),
      key,
      type,
      value:
        type === "boolean"
          ? coerceBoolean(
              typeof rawValue === "boolean" ? rawValue : String(rawValue ?? "")
            )
          : formatInputValue(rawValue, type),
      isDefault,
    });
    seen.add(key);
  };

  PRIORITY_FEATURE_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(features, key)) {
      addRow(key, features[key], true);
    }
  });

  Object.entries(features || {}).forEach(([key, value]) => {
    if (seen.has(key)) return;
    addRow(key, value, false);
  });

  if (!rows.length) {
    PRIORITY_FEATURE_KEYS.forEach((key) => {
      addRow(key, undefined, true);
    });
  }

  return rows;
};

const mapRowsToFeatures = (rows: FeatureRow[]): PlatformPackageFeatures => {
  const features: PlatformPackageFeatures = {};
  rows.forEach((row) => {
    const key = row.key.trim();
    if (!key) return;

    if (row.type === "boolean") {
      features[key] = coerceBoolean(row.value as string | boolean);
      return;
    }

    if (row.type === "number") {
      const numericValue =
        typeof row.value === "string" && row.value.trim() !== ""
          ? Number(row.value)
          : null;
      features[key] = Number.isFinite(numericValue as number)
        ? (numericValue as number)
        : null;
      return;
    }

    if (row.type === "list") {
      const raw = typeof row.value === "string" ? row.value : "";
      const parsed = raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      features[key] = parsed;
      return;
    }

    features[key] =
      typeof row.value === "string" ? row.value : String(row.value);
  });

  if (!Array.isArray(features.modules_enabled)) {
    features.modules_enabled = [];
  }

  return features;
};

const createDefaultFormState = (): PackageFormState => ({
  name: "",
  description: "",
  priceMonthly: 0,
  priceYearly: 0,
  supportLevel: "",
  features: buildFeatureDefaults(),
});

export const ClonePackageModal: React.FC<PackageModalProps> = ({
  open,
  sourcePackage,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const { mode } = useThemeContext();
  const [formState, setFormState] = useState<PackageFormState>(
    createDefaultFormState
  );
  const [featureRows, setFeatureRows] = useState<FeatureRow[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (sourcePackage) {
      const normalized = normalizePackageFeatures(sourcePackage.features ?? {});
      setFormState({
        name: sourcePackage.name,
        description: sourcePackage.description ?? "",
        priceMonthly: sourcePackage.priceMonthly ?? 0,
        priceYearly: sourcePackage.priceYearly ?? 0,
        supportLevel: sourcePackage.supportLevel ?? "",
        features: normalized,
      });
      setFeatureRows(mapFeaturesToRows(normalized));
    } else {
      const defaults = buildFeatureDefaults();
      setFormState({
        name: "",
        description: "",
        priceMonthly: 0,
        priceYearly: 0,
        supportLevel: "",
        features: defaults,
      });
      setFeatureRows(mapFeaturesToRows(defaults));
    }
  }, [open, sourcePackage]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormState((prev) => ({
      ...prev,
      features: mapRowsToFeatures(featureRows),
    }));
  }, [featureRows, open]);

  if (!open) {
    return null;
  }

  const handleKeyChange = (id: string, key: string) => {
    setFeatureRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, key } : row))
    );
  };

  const handleTypeChange = (id: string, type: FeatureRowType) => {
    setFeatureRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (type === row.type) return row;
        if (type === "boolean") {
          const nextValue =
            typeof row.value === "boolean"
              ? row.value
              : coerceBoolean(
                  typeof row.value === "string"
                    ? row.value
                    : String(row.value ?? "")
                );
          return { ...row, type, value: nextValue };
        }
        if (type === "number") {
          return {
            ...row,
            type,
            value:
              typeof row.value === "boolean" ? "" : String(row.value ?? ""),
          };
        }
        if (type === "list") {
          return {
            ...row,
            type,
            value:
              typeof row.value === "boolean" ? "" : String(row.value ?? ""),
          };
        }
        return {
          ...row,
          type,
          value: typeof row.value === "boolean" ? "" : String(row.value ?? ""),
        };
      })
    );
  };

  const handleValueChange = (id: string, value: string | boolean) => {
    setFeatureRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, value } : row))
    );
  };

  const handleAddFeature = () => {
    setFeatureRows((prev) => [
      ...prev,
      {
        id: createRowId(),
        key: "",
        type: "text",
        value: "",
      },
    ]);
  };

  const handleRemoveFeature = (id: string) => {
    setFeatureRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const features = serializePackageFeatures(formState.features);
    await onSubmit({
      name: formState.name,
      description: formState.description || undefined,
      priceMonthly: Number(formState.priceMonthly) || 0,
      priceYearly: Number(formState.priceYearly) || 0,
      supportLevel: formState.supportLevel || undefined,
      features,
    });
  };

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
          className={clsx("superduperadmin-modal-form flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl p-6 shadow-2xl", mode === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white')}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className={clsx(
                    "text-xl font-medium uppercase",
                    mode === "dark" ? "text-slate-400" : "text-slate-600"
                  )}>
                
                {sourcePackage ? "Edit package" : "Create package"}
              </h2>
              <p className={clsx("mt-1 text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                Configure pricing, capacity limits, and feature access for this
                subscription tier.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={clsx("rounded-full p-2 text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500", mode === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100 hover:text-slate-600')}
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  className={clsx(
                    "text-xs font-medium uppercase",
                    mode === "dark" ? "text-slate-400" : "text-slate-600"
                  )}
                >
                  Package name
                </label>
                <input
                  required
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className={clsx(
                    "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    mode === "dark"
                      ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-500"
                      : "border-slate-200 bg-white text-slate-900"
                  )}
                />
              </div>
              <div>
                <label
                  className={clsx(
                    "text-xs font-medium uppercase",
                    mode === "dark" ? "text-slate-400" : "text-slate-600"
                  )}
                >
                  Support level
                </label>
                <input
                  value={formState.supportLevel}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      supportLevel: event.target.value,
                    }))
                  }
                  className={clsx(
                    "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    mode === "dark"
                      ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-500"
                      : "border-slate-200 bg-white text-slate-900"
                  )}
                />
              </div>
              <div>
                <label
                  className={clsx(
                    "text-xs font-medium uppercase",
                    mode === "dark" ? "text-slate-400" : "text-slate-600"
                  )}
                >
                  Monthly price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formState.priceMonthly}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      priceMonthly: Number(event.target.value),
                    }))
                  }
                  className={clsx(
                    "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    mode === "dark"
                      ? "border-slate-700 bg-slate-950 text-slate-100"
                      : "border-slate-200 bg-white/80 text-slate-900"
                  )}
                />
              </div>
              <div>
                <label
                  className={clsx(
                    "text-xs font-medium uppercase",
                    mode === "dark" ? "text-slate-400" : "text-slate-600"
                  )}
                >
                  Annual price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formState.priceYearly}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      priceYearly: Number(event.target.value),
                    }))
                  }
                  className={clsx(
                    "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    mode === "dark"
                      ? "border-slate-700 bg-slate-950 text-slate-100"
                      : "border-slate-200 bg-white/80 text-slate-900"
                  )}
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  className={clsx(
                    "text-xs font-medium uppercase",
                    mode === "dark" ? "text-slate-400" : "text-slate-600"
                  )}
                >
                  Description
                </label>
                <textarea
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={2}
                  className={clsx(
                    "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                    mode === "dark"
                      ? "border-slate-700 bg-slate-950 text-slate-100"
                      : "border-slate-200 bg-white/80 text-slate-900"
                  )}
                />
              </div>
            </div>

            <div
              className={clsx(
                "mt-6 space-y-4 rounded-xl border p-4",
                mode === "dark"
                  ? "border-slate-800 bg-slate-900/40"
                  : "border-slate-200 bg-slate-50"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3
                    className={clsx(
                      "text-xs font-semibold uppercase tracking-wide",
                      mode === "dark" ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    Feature metadata
                  </h3>
                  <p
                    className={clsx(
                      "text-xs",
                      mode === "dark" ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    Specify usage limits, enabled modules, or any additional
                    entitlements for this package.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  disabled={isSubmitting}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60",
                    mode === "dark"
                      ? "border-indigo-400 text-indigo-300 hover:bg-indigo-500/10"
                      : "border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                  )}
                >
                  <HiOutlinePlus className="h-4 w-4" />
                  Add field
                </button>
              </div>

              <div className="space-y-3">
                {featureRows.length ? (
                  featureRows.map((row) => {
                    const isBoolean = row.type === "boolean";
                    const isList = row.type === "list";
                    const isNumber = row.type === "number";
                    const stringValue =
                      typeof row.value === "string"
                        ? row.value
                        : isBoolean
                        ? ""
                        : String(row.value ?? "");
                    const isDefault = Boolean(row.isDefault);
                    const toggleOn = coerceBoolean(
                      row.value as string | boolean
                    );

                    return (
                      <div
                        key={row.id}
                        className={clsx(
                          "rounded-lg border border-slate-200 p-4 shadow-sm",
                          mode === "dark"
                            ? " border-slate-800 bg-slate-900/60"
                            : "bg-white/70"
                        )}
                      >
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.6fr)_minmax(0,1fr)_auto]">
                          <div>
                            <label
                              className={clsx(
                                "text-xs font-medium uppercase",
                                mode === "dark"
                                  ? "text-slate-400"
                                  : "text-slate-600"
                              )}
                            >
                              Field key
                            </label>
                            <input
                              value={row.key}
                              onChange={(event) =>
                                handleKeyChange(row.id, event.target.value)
                              }
                              placeholder="e.g. max_students"
                              disabled={isSubmitting}
                              className={clsx(
                                "mt-1 w-full rounded-lg border px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                                mode === "dark"
                                  ? "border-slate-700 bg-slate-950 text-slate-100"
                                  : "border-slate-200 bg-white/80 text-slate-900"
                              )}
                            />
                            <p
                              className={clsx(
                                "mt-1 text-[10px] uppercase tracking-wide",
                                mode === "dark"
                                  ? "text-slate-500"
                                  : "text-slate-400"
                              )}
                            >
                              {humanizeKey(row.key)}
                            </p>
                          </div>
                          <div>
                            <label
                              className={clsx(
                                "text-xs font-medium uppercase",
                                mode === "dark"
                                  ? "text-slate-400"
                                  : "text-slate-600"
                              )}
                            >
                              Type
                            </label>
                            <select
                              value={row.type}
                              onChange={(event) =>
                                handleTypeChange(
                                  row.id,
                                  event.target.value as FeatureRowType
                                )
                              }
                              disabled={isSubmitting}
                              className={clsx(
                                "mt-1 w-full rounded-lg border px-2.5 py-1.5 text-xs capitalize focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                                mode === "dark"
                                  ? "border-slate-700 bg-slate-950 text-slate-100"
                                  : "border-slate-200 bg-white/80 text-slate-900"
                              )}
                            >
                              {FEATURE_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label
                              className={clsx(
                                "text-xs font-medium uppercase",
                                mode === "dark"
                                  ? "text-slate-400"
                                  : "text-slate-600"
                              )}
                            >
                              Value
                            </label>
                            {isBoolean ? (
                              <div className="mt-2 flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleValueChange(row.id, !toggleOn)
                                  }
                                  disabled={isSubmitting}
                                  className={clsx(
                                    `relative inline-flex h-5 w-10 items-center rounded-full transition`,
                                    toggleOn
                                      ? "bg-indigo-600"
                                      : mode === "dark"
                                      ? "bg-slate-700"
                                      : "bg-slate-300",
                                    isSubmitting
                                      ? "cursor-not-allowed opacity-60"
                                      : "cursor-pointer"
                                  )}
                                  aria-pressed={toggleOn}
                                >
                                  <span className="sr-only">Toggle value</span>
                                  <span
                                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${
                                      toggleOn
                                        ? "translate-x-5"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                                <span
                                  className={clsx(
                                    "text-[10px] font-medium uppercase",
                                    mode === "dark"
                                      ? "text-slate-400"
                                      : "text-slate-500"
                                  )}
                                >
                                  {toggleOn ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                            ) : isList ? (
                              <textarea
                                rows={2}
                                placeholder="Comma separated values"
                                value={stringValue}
                                onChange={(event) =>
                                  handleValueChange(row.id, event.target.value)
                                }
                                disabled={isSubmitting}
                                className={clsx(
                                  "mt-1 w-full rounded-lg border px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                                  mode === "dark"
                                    ? "border-slate-700 bg-slate-950 text-slate-100"
                                    : "border-slate-200 bg-white/80 text-slate-900"
                                )}
                              />
                            ) : (
                              <input
                                type={isNumber ? "number" : "text"}
                                value={stringValue}
                                onChange={(event) =>
                                  handleValueChange(row.id, event.target.value)
                                }
                                placeholder={isNumber ? "0" : "Enter value"}
                                disabled={isSubmitting}
                                className={clsx(
                                  "mt-1 w-full rounded-lg border px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                                  mode === "dark"
                                    ? "border-slate-700 bg-slate-950 text-slate-100"
                                    : "border-slate-200 bg-white/80 text-slate-900"
                                )}
                              />
                            )}
                            {row.key === "modules_enabled" && (
                              <p
                                className={clsx(
                                  "mt-1 text-[10px] uppercase tracking-wide",
                                  mode === "dark"
                                    ? "text-slate-500"
                                    : "text-slate-400"
                                )}
                              >
                                Provide module identifiers separated by commas.
                              </p>
                            )}
                          </div>
                          <div className="flex items-end justify-end pl-2">
                            {!isDefault && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFeature(row.id)}
                                disabled={isSubmitting}
                                className={clsx(
                                  "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60",
                                  mode === "dark"
                                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                    : "border-slate-200 text-slate-500 hover:bg-slate-100"
                                )}
                              >
                                <HiOutlineTrash className="h-4 w-4" />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    className={clsx(
                      "rounded-lg border border-dashed p-6 text-center text-xs shadow-sm",
                      mode === "dark"
                        ? "border-slate-700 bg-slate-900/60 text-slate-400"
                        : "border-slate-300 bg-white/60 text-slate-500"
                    )}
                  >
                    No metadata fields yet. Use “Add field” to define limits or
                    modules.
                  </div>
                )}
              </div>
            </div>  
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={clsx(
                "rounded-lg border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
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
              {isSubmitting ? "Saving…" : "Save package"}
            </button>
          </div>
        </form>
      </div>
      <FullScreenOverlay
        visible={Boolean(isSubmitting)}
        title={sourcePackage ? "Updating package" : "Creating package"}
        message="Persisting package configuration."
      />
    </>
  );
};

export default ClonePackageModal;
