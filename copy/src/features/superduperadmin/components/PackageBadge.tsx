import React from "react";
import clsx from "clsx";
import { PlatformPackage } from "../types";

interface PackageBadgeProps {
  pkg: Pick<
    PlatformPackage,
    "name" | "supportLevel" | "isActive" | "priceMonthly" | "priceYearly"
  >;
  showStatus?: boolean;
  className?: string;
}

const getTierClass = (level: string) => {
  const tierColorMap: Record<string, string> = {
    standard: "bg-emerald-100 text-emerald-700",
    premium: "bg-amber-100 text-amber-700",
    enterprise: "bg-indigo-100 text-indigo-700",
  };
  return tierColorMap[level] ?? "bg-slate-100 text-slate-700";
};

export const PackageBadge: React.FC<PackageBadgeProps> = ({
  pkg,
  showStatus = true,
  className,
}) => {
  const level = (pkg.supportLevel ?? "standard").toLowerCase();
  const tierClass = getTierClass(level);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${tierClass} ${
        className ?? ""
      }`.trim()}
    >
      <span>{pkg.name}</span>
      <span className="rounded-full px-2 py-0.5 uppercase tracking-wide text-[10px] bg-black/10">
        {pkg.supportLevel ?? "Standard"}
      </span>
      <span className="hidden truncate text-[10px] uppercase sm:inline text-slate-500">
        ${pkg.priceMonthly.toLocaleString()}/mo • $
        {pkg.priceYearly.toLocaleString()}/yr
      </span>
      {showStatus && (
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase",
            pkg.isActive
              ? "bg-emerald-500/15 text-emerald-600"
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
