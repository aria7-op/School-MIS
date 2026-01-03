import React from "react";
import clsx from "clsx";
import {
  AdvancedDataTable,
  ChartContainer,
  EmptyState,
  QuickActions,
  UpgradeSubscriptionModal,
} from "../components";
import { useSuperAdmin } from "../../../contexts/SuperAdminContext";
import platformService from "../services/platformService";
import { PlatformSubscriptionSummary } from "../types";
import { useToast } from "../../../contexts/ToastContext";
import { useThemeContext } from "../../../contexts/ThemeContext";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

export const SubscriptionsBilling: React.FC = () => {
  const {
    subscriptions,
    subscriptionsQuery,
    currentSchoolId,
    packages,
    financialAnalytics,
    financialAnalyticsQuery,
    refreshPlatform,
  } = useSuperAdmin();
  const toast = useToast();
  const { mode } = useThemeContext();
  const [isUpgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    React.useState<PlatformSubscriptionSummary | null>(null);

  const revenueTrendEntries = Object.entries(
    financialAnalytics?.monthlyRevenue ?? {}
  ).slice(-12);

  const parseAmount = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === "string") {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    }
    if (typeof value === "object" && value !== null) {
      const maybeBig = (value as { d?: number[] }).d;
      if (Array.isArray(maybeBig) && maybeBig.length) {
        const numeric = Number(maybeBig[0]);
        return Number.isFinite(numeric) ? numeric : 0;
      }
    }
    return 0;
  };

  const revenueTrend = revenueTrendEntries.map(([period, amount]) => ({
    period,
    amount: parseAmount(amount),
  }));

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) return "؋0";
    return new Intl.NumberFormat("fa-AF", {
      style: "currency",
      currency: "AFN",
      maximumFractionDigits: value < 1000 ? 0 : 0,
    })
      .format(value)
      .replace("AFN", "؋")
      .trim();
  };

  const formatCompact = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const RevenueTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({
    active,
    payload,
    label,
  }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const [{ value }] = payload;
    return (
      <div className={clsx("rounded-lg border px-3 py-2 text-xs shadow-lg", mode === 'dark' ? 'border-slate-700 bg-slate-950/90 text-slate-100' : 'border-slate-200 bg-white/95')}>
        <p className={clsx("font-semibold", mode === 'dark' ? 'text-slate-100' : 'text-slate-700')}>
          {label}
        </p>
        <p className={clsx("mt-1", mode === 'dark' ? 'text-slate-300' : 'text-slate-500')}>
          {formatCurrency(Number(value ?? 0))}
        </p>
      </div>
    );
  };

  const handleUpgrade = async (payload: {
    packageId: string;
    autoRenew?: boolean;
  }) => {
    if (!selectedSubscription) {
      return;
    }
    try {
      setSubmitting(true);
      await platformService.changeSubscriptionPackage(
        selectedSubscription.id,
        payload
      );
      toast.success(
        "Subscription updated",
        "The subscription package has been updated."
      );
      setUpgradeModalOpen(false);
      setSelectedSubscription(null);
      await refreshPlatform();
    } catch (error: any) {
      toast.error(
        "Upgrade failed",
        error?.message ?? "Please review the request and retry."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={clsx("rounded-xl border p-4 shadow-sm", mode === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={clsx("text-lg font-semibold", mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>
              Subscription & billing
            </h1>
            <p className={clsx("text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
              View platform subscriptions and manage package upgrades for
              schools.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (subscriptions.length) {
                  setSelectedSubscription(subscriptions[0]);
                  setUpgradeModalOpen(true);
                } else {
                  toast.info(
                    "No subscriptions",
                    "There are no subscriptions to upgrade yet."
                  );
                }
              }}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={!subscriptions.length}
            >
              Upgrade subscription
            </button>
            <button
              type="button"
              onClick={refreshPlatform}
              className={clsx(
                "rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-400",
                mode === "dark"
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-slate-200 text-slate-600 hover:bg-slate-100"
              )}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <ChartContainer
        title="Revenue trend"
        description="Paid invoice totals aggregated by month."
        type="line"
        onRefresh={refreshPlatform}
      >
        {revenueTrend.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={revenueTrend}
              margin={{
                top: 8,
                right: 16,
                left: 0,
                bottom: 8,
              }}
            >
              <defs>
                <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={mode === "dark" ? "#334155" : "#E2E8F0"}
                opacity={0.5}
              />
              <XAxis
                dataKey="period"
                tick={{
                  fill: mode === "dark" ? "#94a3b8" : "#64748B",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                tick={{
                  fill: mode === "dark" ? "#94a3b8" : "#64748B",
                  fontSize: 11,
                }}
                width={72}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompact}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6366F1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueArea)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className={clsx("flex h-64 items-center justify-center text-sm", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
            No revenue data yet.
          </div>
        )}
      </ChartContainer>

      <AdvancedDataTable<PlatformSubscriptionSummary>
        data={subscriptions}
        columns={[
          {
            key: "school",
            header: "School",
            accessor: (row) => (
              <div>
                <div className={clsx("font-medium", mode === 'dark' ? 'text-slate-100' : 'text-slate-900')}>
                  {row.school?.name ?? "Unknown"}
                </div>
                <div className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                  {row.school?.code ?? "—"}
                </div>
              </div>
            ),
          },
          {
            key: "package",
            header: "Package",
            accessor: (row) => row.package?.name ?? "—",
          },
          {
            key: "status",
            header: "Status",
            accessor: (row) => (
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-xs uppercase",
                  row.status === "ACTIVE"
                    ? mode === 'dark'
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-emerald-500/10 text-emerald-600"
                    : row.status === "SUSPENDED"
                    ? mode === 'dark'
                      ? "bg-amber-500/10 text-amber-300"
                      : "bg-amber-500/10 text-amber-600"
                    : mode === 'dark'
                    ? "bg-slate-500/10 text-slate-300"
                    : "bg-slate-500/10 text-slate-600"
                )}
              >
                {row.status}
              </span>
            ),
            align: "center",
          },
          {
            key: "dates",
            header: "Period",
            accessor: (row) => (
              <div className={clsx("text-xs", mode === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                {row.startedAt
                  ? new Date(row.startedAt).toLocaleDateString()
                  : "—"}{" "}
                →{" "}
                {row.expiresAt
                  ? new Date(row.expiresAt).toLocaleDateString()
                  : "—"}
              </div>
            ),
          },
          {
            key: "autoRenew",
            header: "Auto renew",
            accessor: (row) => (row.autoRenew ? "Yes" : "No"),
            align: "center",
          },
        ]}
        isLoading={subscriptionsQuery.isLoading}
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          setSelectedSubscription(row);
          setUpgradeModalOpen(true);
        }}
        actions={
          <QuickActions
            actions={[
              {
                id: "refresh",
                label: "Refresh",
                onClick: refreshPlatform,
              },
            ]}
          />
        }
        emptyState={
          <EmptyState
            title="No subscriptions yet"
            description="Provision a school to create its first subscription."
          />
        }
      />

      <UpgradeSubscriptionModal
        open={isUpgradeModalOpen}
        currentPackageId={selectedSubscription?.package?.id ?? ""}
        packages={packages}
        onClose={() => {
          setUpgradeModalOpen(false);
          setSelectedSubscription(null);
        }}
        onSubmit={handleUpgrade}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default SubscriptionsBilling;
