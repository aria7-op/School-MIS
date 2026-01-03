import React from "react";
import clsx from "clsx";
import { useThemeContext } from "../../../contexts/ThemeContext";

type ChartType = "line" | "bar" | "donut" | "stacked" | "area";

interface ChartContainerProps {
  title: string;
  description?: string;
  type?: ChartType;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onRefresh?: () => void;
}

const typeLabels: Record<ChartType, string> = {
  line: "Line",
  bar: "Bar",
  donut: "Donut",
  stacked: "Stacked",
  area: "Area",
};

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  type,
  toolbar,
  footer,
  children,
  className,
  onRefresh,
}) => {
  const { mode } = useThemeContext();

  const wrapperClasses = clsx(
    "flex h-full flex-col rounded-xl border shadow-sm transition-colors duration-200",
    mode === "dark"
      ? "border-slate-800 bg-slate-900 text-slate-100"
      : "border-slate-100 bg-white text-slate-800 shadow-[0_24px_45px_-28px_rgba(15,23,42,0.24)]",
    className
  );

  const headerClasses = clsx(
    "flex items-start justify-between gap-3 border-b p-4 transition-colors duration-200",
    mode === "dark" ? "border-slate-800" : "border-slate-100"
  );

  const descriptionClasses = clsx(
    "mt-1 text-xs transition-colors duration-200",
    mode === "dark" ? "text-slate-400" : "text-slate-500"
  );

  const footerClasses = clsx(
    "border-t p-3 text-xs transition-colors duration-200",
    mode === "dark"
      ? "border-slate-800 text-slate-400"
      : "border-slate-100 text-slate-500"
  );

  const chartSurfaceClasses = clsx(
    "h-full rounded-lg p-2 transition-colors duration-200",
    mode === "dark" ? "bg-slate-950" : "bg-white"
  );

  return (
    <div className={wrapperClasses}>
      <div className={headerClasses}>
        <div>
          <div className="flex items-center gap-2">
            <h3
              className={clsx(
                "text-sm font-semibold transition-colors duration-200",
                mode === "dark" ? "text-slate-100" : "text-slate-900"
              )}
            >
              {title}
            </h3>
            {type && (
               <span className={clsx("rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide", mode === 'dark' ? 'text-indigo-300' : 'text-indigo-600')}>
                 {typeLabels[type]}
               </span>
             )}
          </div>
          {description && <p className={descriptionClasses}>{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {toolbar}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className={clsx(
                "rounded-lg border px-2 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
                mode === "dark"
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-slate-200 text-slate-500 hover:bg-slate-100"
              )}
            >
              Refresh
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className={chartSurfaceClasses}>{children}</div>
      </div>
      {footer && <div className={footerClasses}>{footer}</div>}
    </div>
  );
};

export default ChartContainer;
