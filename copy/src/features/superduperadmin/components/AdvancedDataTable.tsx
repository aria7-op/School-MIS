import React from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { SkeletonLoader, EmptyState } from "./infrastructure";
import { useThemeContext } from "../../../contexts/ThemeContext";

export interface DataTableColumn<TData> {
  key: keyof TData & string;
  header: string;
  accessor?: (row: TData) => React.ReactNode;
  width?: string;
  visible?: boolean;
  align?: "left" | "center" | "right";
}

interface AdvancedDataTableProps<TData extends Record<string, any>> {
  data: TData[];
  columns: DataTableColumn<TData>[];
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  actions?: React.ReactNode;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData, index: number) => string;
}

const downloadCsv = (rows: Record<string, any>[], columns: string[]) => {
  if (!rows.length) return;
  const header = columns.join(",");
  const csvRows = rows.map((row) =>
    columns
      .map((column) => {
        const cell = row[column];
        if (cell === null || cell === undefined) return "";
        const value =
          typeof cell === "object" ? JSON.stringify(cell) : String(cell);
        const safe = value.replace(/"/g, '""');
        return `"${safe}"`;
      })
      .join(",")
  );
  const csvContent = [header, ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `export-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const AdvancedDataTable = <TData extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder,
  filters,
  isLoading,
  emptyState,
  actions,
  pageSize = 10,
  onRowClick,
  getRowId,
}: AdvancedDataTableProps<TData>) => {
  const { mode } = useThemeContext();
  const { t } = useTranslation();
  const defaultSearchPlaceholder =
    searchPlaceholder || t("advancedDataTable.searchPlaceholder");
  const [search, setSearch] = React.useState("");
  const [visibleColumns, setVisibleColumns] = React.useState<
    Record<string, boolean>
  >(() =>
    columns.reduce<Record<string, boolean>>((acc, column) => {
      acc[column.key] = column.visible !== false;
      return acc;
    }, {})
  );
  const [page, setPage] = React.useState(1);

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredData = React.useMemo(() => {
    if (!search.trim()) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      columns.some((column) => {
        if (!visibleColumns[column.key]) return false;
        const value =
          column.accessor?.(row) ??
          row[column.key] ??
          (column.key in row ? row[column.key] : undefined);
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lower);
      })
    );
  }, [data, search, columns, visibleColumns]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pageData = filteredData.slice(startIndex, startIndex + pageSize);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleExportCsv = () => {
    const columnKeys = columns
      .filter((column) => visibleColumns[column.key])
      .map((column) => column.key);
    downloadCsv(filteredData, columnKeys);
  };

  const handleExportPdf = () => {
    window.print();
  };

  const surfaceClasses =
    mode === "dark"
      ? "border-slate-800 bg-slate-900 text-slate-100"
      : "border-slate-100 bg-white text-slate-800 shadow-[0_24px_45px_-28px_rgba(15,23,42,0.24)]";

  return (
    <div className="space-y-4">
      <div
        className={clsx(
          "flex flex-col gap-3 rounded-xl border p-4 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between",
          surfaceClasses
        )}
      >
        <div className="flex flex-1 items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className={clsx(
              "w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400",
              mode === "dark"
                ? "border-slate-700 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-700"
            )}
            placeholder={defaultSearchPlaceholder}
          />
          <button
            type="button"
            onClick={() => {
              handleExportCsv();
            }}
            className={clsx(
              "hidden rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:inline-flex",
              mode === "dark"
                ? "border-slate-700 text-white hover:bg-slate-800"
                : "border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            {t("advancedDataTable.exportCsv")}
          </button>
          <button
            type="button"
            onClick={() => {
              handleExportPdf();
            }}
            className={clsx(
              "hidden rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:inline-flex",
              mode === "dark"
                ? "border-slate-700 text-white hover:bg-slate-800"
                : "border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            {t("advancedDataTable.exportPdf")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <details className="group relative">
            <summary
              className={clsx(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
                mode === "dark"
                  ? "border-slate-700 text-white hover:bg-slate-800"
                  : "border-slate-200 text-slate-600 hover:bg-slate-100"
              )}
            >
              {t("advancedDataTable.columns")}
              <span
                className={clsx(
                  "text-xs",
                  mode === "dark" ? "text-white" : "text-slate-400"
                )}
              >
                ▼
              </span>
            </summary>
            <div
              className={clsx(
                "absolute right-0 z-10 mt-2 w-48 rounded-lg border p-3 text-xs shadow-lg transition-colors duration-200",
                mode === "dark"
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-200 bg-white"
              )}
            >
              {columns.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center gap-2 py-1"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(visibleColumns[column.key])}
                    onChange={() => toggleColumn(column.key)}
                  />
                  <span>{column.header}</span>
                </label>
              ))}
            </div>
          </details>
          {actions}
        </div>
      </div>
      {filters && <div>{filters}</div>}

      <div
        className={clsx(
          "overflow-hidden rounded-xl border shadow-sm transition-colors duration-200",
          surfaceClasses
        )}
      >
        <div className="overflow-x-auto">
          <table
            className={`min-w-full divide-y ${
              mode === "dark" ? "divide-slate-800" : "divide-slate-200"
            }`}
          >
            <thead
              className={clsx(
                "transition-colors duration-200",
                mode === "dark" ? "bg-slate-900/80" : "bg-slate-100"
              )}
            >
              <tr>
                {columns
                  .filter((column) => visibleColumns[column.key])
                  .map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={clsx(
                        "px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors duration-200",
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                          ? "text-center"
                          : "text-left",
                        mode === "dark" ? "text-white" : "text-slate-500"
                      )}
                      style={{ width: column.width }}
                    >
                      {column.header}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody
              className={clsx(
                "divide-y transition-colors duration-200",
                mode === "dark"
                  ? "divide-slate-800 bg-slate-900 text-slate-100"
                  : "divide-slate-100 bg-white text-slate-700"
              )}
            >
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6">
                    <SkeletonLoader lines={3} />
                  </td>
                </tr>
              ) : pageData.length ? (
                pageData.map((row, index) => {
                  const rowId = getRowId?.(row, index) ?? `${index}`;
                  return (
                    <tr
                      key={rowId}
                      className={`transition ${
                        mode === "dark"
                          ? "hover:bg-indigo-500/5"
                          : "hover:bg-indigo-50/40"
                      } ${onRowClick ? "cursor-pointer" : ""}`}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns
                        .filter((column) => visibleColumns[column.key])
                        .map((column) => {
                          const content =
                            column.accessor?.(row) ??
                            row[column.key] ??
                            (column.key in row ? row[column.key] : null);
                          return (
                            <td
                              key={`${rowId}-${column.key}`}
                              className={clsx(
                                "whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200",
                                column.align === "right"
                                  ? "text-right"
                                  : column.align === "center"
                                  ? "text-center"
                                  : "text-left",
                                mode === "dark"
                                  ? "text-white"
                                  : "text-slate-700"
                              )}
                            >
                              {content ?? (
                                <span
                                  className={
                                    mode === "dark"
                                      ? "text-white"
                                      : "text-slate-400"
                                  }
                                >
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10">
                    {emptyState ?? (
                      <EmptyState
                        title="No records"
                        description="Adjust your filters or refresh the data source."
                      />
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div
          className={clsx(
            "flex items-center justify-between border px-4 py-3 text-xs transition-colors duration-200",
            mode === "dark"
              ? "border-slate-800 bg-slate-900/40 text-white"
              : "border-slate-200 bg-slate-50 text-slate-500"
          )}
        >
          <div>
            {t("advancedDataTable.showing")}{" "}
            <strong>
              {pageData.length ? startIndex + 1 : 0}-
              {Math.min(startIndex + pageData.length, filteredData.length)}
            </strong>{" "}
            {t("advancedDataTable.of")} <strong>{filteredData.length}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className={
                mode === "dark"
                  ? "rounded-lg border border-slate-700 px-3 py-1 font-medium text-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  : "rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              }
            >
              {t("advancedDataTable.prev")}
            </button>
            <span>
              {t("advancedDataTable.page")} {page} {t("advancedDataTable.of")}{" "}
              {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className={
                mode === "dark"
                  ? "rounded-lg border border-slate-700 px-3 py-1 font-medium text-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                  : "rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              }
            >
              {t("advancedDataTable.next")}
            </button>
          </div>
        </div>
      </div>
      <div
        className={clsx(
          "flex flex-wrap items-center justify-between gap-2 text-xs transition-colors duration-200",
          mode === "dark" ? "text-slate-400" : "text-slate-500"
        )}
      >
        <div>{t("advancedDataTable.exportInfo")}</div>
        <div className="flex gap-2 sm:hidden">
          <button
            type="button"
            onClick={handleExportCsv}
            className={
              mode === "dark"
                ? "rounded-lg border border-slate-700 px-3 py-1 font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                : "rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            }
          >
            {t("advancedDataTable.csv")}
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className={
              mode === "dark"
                ? "rounded-lg border border-slate-700 px-3 py-1 font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                : "rounded-lg border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            }
          >
            {t("advancedDataTable.pdf")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDataTable;
