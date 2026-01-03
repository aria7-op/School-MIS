import React from "react";
import clsx from "clsx";
import { PlatformPackage } from "../types";
import { useThemeContext } from "../../../contexts/ThemeContext";

interface PackageBadgeProps {
  pkg: Pick<
    PlatformPackage,
    "name" | "supportLevel" | "isActive" | "priceMonthly" | "priceYearly"
  >;
  showStatus?: boolean;
  className?: string;
}

const getTierClass = (level: string, mode: "light" | "dark") => {
  const tierColorMap: Record<string, { light: string; dark: string }> = {
    standard: {
      light: "bg-emerald-100 text-emerald-700",
      dark: "bg-emerald-500/10 text-emerald-300",
    },
    premium: {
      light: "bg-amber-100 text-amber-700",
      dark: "bg-amber-500/10 text-amber-300",
    },
    enterprise: {
      light: "bg-indigo-100 text-indigo-700",
      dark: "bg-indigo-500/10 text-indigo-300",
    },
  };
  const colors = tierColorMap[level] ?? {
    light: "bg-slate-100 text-slate-700",
    dark: "bg-slate-500/10 text-slate-300",
  };
  return mode === "dark" ? colors.dark : colors.light;
};

export const PackageBadge: React.FC<PackageBadgeProps> = ({
  pkg,
  showStatus = true,
  className,
}) => {
  const { mode } = useThemeContext();
  const level = (pkg.supportLevel ?? "standard").toLowerCase();
  const tierClass = getTierClass(level, mode);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${tierClass} ${
        className ?? ""
      }`.trim()}
    >
      <span>{pkg.name}</span>
      <span
        className={clsx(
          "rounded-full px-2 py-0.5 uppercase tracking-wide text-[10px]",
          mode === "dark" ? "bg-white/10" : "bg-black/10"
        )}
      >
        {pkg.supportLevel ?? "Standard"}
      </span>
      <span
        className={clsx(
          "hidden truncate text-[10px] uppercase sm:inline",
          mode === "dark" ? "text-slate-400" : "text-slate-500"
        )}
      >
        ${pkg.priceMonthly.toLocaleString()}/mo • $
        {pkg.priceYearly.toLocaleString()}/yr
      </span>
      {showStatus && (
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase",
            pkg.isActive
              ? mode === "dark"
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-emerald-500/15 text-emerald-600"
              : mode === "dark"
              ? "bg-rose-400/10 text-rose-300"
              : "bg-rose-500/15 text-rose-600"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {pkg.isActive ? "Active" : "Inactive"}
        </span>
      )}
    </span>
  );
};

export default PackageBadge;
