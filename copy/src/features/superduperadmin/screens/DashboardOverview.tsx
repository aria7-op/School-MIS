import React, { useState } from 'react';
import clsx from 'clsx';
import {
  ChartContainer,
  QuickActions,
  SchoolSwitcher,
  StatCard,
  TrendIndicator,
  UsageProgressCard,
  CreateSchoolModal,
  UpgradeSubscriptionModal,
} from '../components';
import { useSuperAdmin } from '../../../contexts/SuperAdminContext';
import { SkeletonLoader, EmptyState } from '../components/infrastructure';
import platformService from '../services/platformService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useThemeContext } from '../../../contexts/ThemeContext';

export const DashboardOverview: React.FC = () => {
  const [createSchoolModalOpen, setCreateSchoolModalOpen] = useState(false);
  const [upgradeSubscriptionModalOpen, setUpgradeSubscriptionModalOpen] = useState(false);
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [isUpgradingSubscription, setIsUpgradingSubscription] = useState(false);
  const {
    isSuperDuperAdmin,
    schools,
    schoolsQuery,
    currentSchoolId,
    selectSchool,
    currentSchoolDetail,
    schoolDetailQuery,
    dashboardOverview,
    dashboardQuery,
    financialAnalytics,
    financialAnalyticsQuery,
    reportsSummary,
    churnAnalytics,
    churnAnalyticsQuery,
    auditLogs,
    auditLogQuery,
    refreshPlatform,
    packages,
  } = useSuperAdmin();
  const { mode } = useThemeContext();

  const handleCreateSchool = async (payload: any) => {
    setIsCreatingSchool(true);
    try {
      await platformService.createSchool(payload);
      await refreshPlatform();
      setCreateSchoolModalOpen(false);
    } catch (error) {
      console.error('Failed to create school:', error);
    } finally {
      setIsCreatingSchool(false);
    }
  };

  const handleUpgradeSubscription = async (payload: any) => {
    setIsUpgradingSubscription(true);
    try {
      await platformService.changeSubscriptionPackage(currentSchoolId!, payload.packageId, payload.autoRenew);
      await refreshPlatform();
      setUpgradeSubscriptionModalOpen(false);
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
    } finally {
      setIsUpgradingSubscription(false);
    }
  };

  if (!isSuperDuperAdmin) {
    return (
      <EmptyState
        title="Super Duper Portal"
        description="Switch to a SUPER_DUPER_ADMIN user to access the platform dashboard."
      />
    );
  }

  const totals = dashboardOverview?.totals ?? {
    schools: 0,
    activeSchools: 0,
    subscriptions: 0,
    activeSubscriptions: 0,
    revenue: 0,
  };

  const usage = (currentSchoolDetail?.usage as any) ?? {};
  const usageLimits = usage.limits ?? {};
  const getLimitValue = (limit?: number | null, fallback?: number | null): number | null => {
    if (typeof limit === 'number' && !Number.isNaN(limit)) return limit;
    if (typeof fallback === 'number' && !Number.isNaN(fallback)) return fallback;
    return null;
  };

  const studentLimit = getLimitValue(usageLimits.students);
  const storageLimit = getLimitValue(usageLimits.storageGb);
  const schoolName =
    schools.find((school) => school.id === currentSchoolId)?.name ??
    currentSchoolDetail?.school.name ??
    'Select a school';

  const revenueTrendEntries = Object.entries(financialAnalytics?.revenueTrend ?? {}).slice(-12);
  const chartData = revenueTrendEntries.map(([period, amount]) => ({
    period,
    amount: typeof amount === 'number' ? amount : Number(amount) || 0,
  }));

  return (
    <div className="space-y-6">
      <SchoolSwitcher
        schools={schools}
        currentSchoolId={currentSchoolId}
        onSchoolChange={selectSchool}
        isLoading={schoolsQuery.isLoading}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total revenue"
          value={`$${totals.revenue.toLocaleString()}`}
          description="Aggregate revenue recognised to date."
          delta={
            financialAnalytics?.monthlyRevenue
              ? Object.values(financialAnalytics.monthlyRevenue).slice(-1)[0]
              : undefined
          }
          deltaLabel="Latest month"
          isLoading={dashboardQuery.isLoading || financialAnalyticsQuery.isLoading}
        />
        <StatCard
          title="Active subscriptions"
          value={totals.activeSubscriptions}
          description="Schools currently subscribed to a package."
          delta={
            totals.subscriptions
              ? Number(((totals.activeSubscriptions / Math.max(totals.subscriptions, 1)) * 100).toFixed(1))
              : undefined
          }
          deltaLabel="% of subscriptions active"
          isLoading={dashboardQuery.isLoading}
        />
        <StatCard
          title="Churn rate"
          value={
            churnAnalytics?.churnRate !== undefined
              ? `${Math.max(churnAnalytics.churnRate, 0).toFixed(2)}%`
              : '—'
          }
          description="Trailing 30-day churn across schools."
          trend="down"
          isLoading={churnAnalyticsQuery.isLoading}
        />
        <StatCard
          title="Schools"
          value={`${totals.schools.toLocaleString()} / ${totals.activeSchools.toLocaleString()} active`}
          description="Total schools onboarded"
          isLoading={dashboardQuery.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Revenue trend"
            description="Subscription revenue collected over the selected period."
            type="line"
            onRefresh={refreshPlatform}
          >
            {financialAnalyticsQuery.isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <SkeletonLoader lines={6} />
              </div>
            ) : chartData.length ? (
              <ResponsiveContainer width="100%" height={256}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748B33" />
                  <XAxis dataKey="period" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: '#e2e8f0',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366F1"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No revenue data yet"
                description="Revenue history will surface once payments are processed."
                className="h-64"
              />
            )}
          </ChartContainer>
        </div>
        <div className="space-y-4">
          <UsageProgressCard
            label="Students (snapshot)"
            value={usage.students ?? 0}
            limit={studentLimit}
            thresholds={{ warning: 70, danger: 90 }}
            footer={`Usage for ${schoolName}`}
            isLoading={schoolDetailQuery.isFetching}
          />
          <UsageProgressCard
            label="Storage usage (GB)"
            value={usage.storageGb ?? 0}
            limit={storageLimit}
            thresholds={{ warning: 75, danger: 90 }}
            footer="Storage across learning resources."
            isLoading={schoolDetailQuery.isFetching}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <TrendIndicator
            label="New schools this month"
            current={totals.schools}
            previous={totals.schools - 1}
          />
          <TrendIndicator
            label="Storage growth (GB)"
            current={usage.storageGb ?? 0}
            previous={(usage.storageGb ?? 0) - 12}
            target={100}
            showTarget
          />
        </div>
        <QuickActions
          actions={[
            {
              id: 'create-school',
              label: 'Create school',
              description: 'Provision a fresh SaaS school and owner.',
              onClick: () => setCreateSchoolModalOpen(true),
            },
            {
              id: 'upgrade-subscription',
              label: 'Upgrade subscription',
              description: 'Change the subscription package for this school.',
              onClick: () => setUpgradeSubscriptionModalOpen(true),
            },
            {
              id: 'refresh-analytics',
              label: 'Refresh analytics',
              description: 'Sync the latest KPIs and usage.',
              onClick: refreshPlatform,
            },
          ]}
        />
      </div>

      <div
        className={clsx(
          'rounded-xl border p-4 shadow-sm transition-colors duration-200',
          mode === 'dark'
            ? 'border-slate-800 bg-slate-900 text-slate-100'
            : 'border-slate-100 bg-white text-slate-900 shadow-[0_24px_45px_-28px_rgba(15,23,42,0.24)]',
        )}
      >
        <h3 className="text-sm font-semibold">
          Recent platform activity
        </h3>
        {auditLogQuery.isLoading ? (
          <div className="mt-4">
            <SkeletonLoader lines={4} />
          </div>
        ) : auditLogs.length ? (
          <div className="mt-4 space-y-3">
            {auditLogs.slice(0, 5).map((log) => {
              const cardClasses =
                mode === 'dark'
                  ? 'rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition-colors duration-200'
                  : 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-colors duration-200';

              return (
                <div key={log.id} className={cardClasses}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                    </span>
                  </div>
                  <p
                    className={clsx(
                      'text-xs transition-colors duration-200',
                      mode === 'dark' ? 'text-slate-400' : 'text-slate-500',
                    )}
                  >
                    {log.actorName ?? 'System'} • {log.entityType}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No recent activity"
            description="Platform activity will surface here as the system records audit entries."
            className="mt-4"
          />
        )}
      </div>

      <CreateSchoolModal
        open={createSchoolModalOpen}
        packages={packages}
        onClose={() => setCreateSchoolModalOpen(false)}
        onSubmit={handleCreateSchool}
        isSubmitting={isCreatingSchool}
      />

      <UpgradeSubscriptionModal
        open={upgradeSubscriptionModalOpen}
        onClose={() => setUpgradeSubscriptionModalOpen(false)}
        onSubmit={handleUpgradeSubscription}
        isSubmitting={isUpgradingSubscription}
        packages={packages}
        currentPackageId={(currentSchoolDetail as any)?.subscription?.packageId}
      />
    </div>
  );
};

export default DashboardOverview;

