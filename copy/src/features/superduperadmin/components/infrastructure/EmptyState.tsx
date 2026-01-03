import React from "react";
import clsx from "clsx";
import { useThemeContext } from "../../../../contexts/ThemeContext";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  const { mode } = useThemeContext();

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
        mode === "dark"
          ? "border-slate-700 bg-slate-900"
          : "border-slate-200 bg-white",
        className
      )}
    >
      {icon && <div className="mb-4 text-4xl text-slate-400">{icon}</div>}
      <h3
        className={clsx(
          "text-lg font-semibold",
          mode === "dark" ? "text-slate-100" : "text-slate-900"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={clsx(
            "mt-2 max-w-md text-sm",
            mode === "dark" ? "text-slate-400" : "text-slate-500"
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
