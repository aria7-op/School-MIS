import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FaServer,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaMemory,
} from "react-icons/fa";
import superadminService from "../services/superadminService";

const SystemHealthDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { data: systemHealth, isLoading } = useQuery({
    queryKey: ["system-health"],
    queryFn: superadminService.getSystemHealth,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: realTimeMetrics } = useQuery({
    queryKey: ["real-time-metrics"],
    queryFn: superadminService.getRealTimeMetrics,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: systemPerformance } = useQuery({
    queryKey: ["system-performance"],
    queryFn: superadminService.getSystemPerformance,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle both response formats
  const health = systemHealth?.data || systemHealth;
  const rawMetrics = realTimeMetrics?.data || realTimeMetrics;
  const metrics = rawMetrics?.metrics || rawMetrics;
  const performance = systemPerformance?.data || systemPerformance;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-2 sm:space-y-6">
      {/* System Status Header */}
      <div
        className={`rounded-lg shadow-sm border p-6 ${
          health?.status === "healthy"
            ? "bg-green-50 border-green-200"
            : health?.status === "warning"
            ? "bg-yellow-50 border-yellow-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t("superadmin.system.title", "System Health Monitor")}
            </h2>
            <p className="text-gray-600 mt-1">
              {t(
                "superadmin.system.subtitle",
                "Real-time system performance and health metrics"
              )}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(
              health?.status || "unknown"
            )}`}
          >
            {health?.status?.toUpperCase() === "HEALTHY"
              ? t('superadmin.header.healthy')
              : health?.status?.toUpperCase() === "UNHEALTHY"
              ? "UNHEALTHY"
              : "UNKNOWN"}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t("superadmin.system.activeUsers", "Active Users")}
            </span>
            <FaCheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics?.activeUsers?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t("superadmin.system.currentlyOnline", "Currently online")}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t("superadmin.system.systemLoad", "System Load")}
            </span>
            <FaServer className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics?.systemLoad || 0}%
          </p>
          <p
            className={`text-xs mt-2 ${
              parseFloat(metrics?.systemLoad || "0") > 80
                ? "text-red-600"
                : parseFloat(metrics?.systemLoad || "0") > 50
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {parseFloat(metrics?.systemLoad || "0") > 80
              ? t("superadmin.system.highLoad", "High Load")
              : parseFloat(metrics?.systemLoad || "0") > 50
              ? t("superadmin.system.mediumLoad", "Medium Load")
              : t("superadmin.system.normalLoad", "Normal Load")}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t("superadmin.system.uptime", "Uptime")}
            </span>
            <FaClock className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {Math.floor((health?.uptime || 0) / 3600)}h
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {formatUptime(health?.uptime || 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t("superadmin.system.errors24h", "Errors (24h)")}
            </span>
            <FaExclamationTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {health?.errors?.last24Hours || 0}
          </p>
          <p
            className={`text-xs mt-2 ${
              health?.errors?.severity === "high"
                ? "text-red-600"
                : health?.errors?.severity === "medium"
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {t(
              `superadmin.system.severity.${health?.errors?.severity || "low"}`,
              `${health?.errors?.severity || "low"} severity`
            )}
          </p>
        </div>
      </div>

      {/* Database Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("superadmin.system.databaseHealth", "Database Health")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">
              {t("superadmin.system.totalRecords", "Total Records")}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {health?.database?.totalRecords?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">
              {t("superadmin.system.activeConnections", "Active Connections")}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {health?.database?.connections || 0}
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">
              {t("superadmin.system.databaseSize", "Database Size")}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {health?.database?.size?.[0]?.size_mb || 0} MB
            </p>
          </div>
        </div>
      </div>

      {/* Memory Usage */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4 gap-2">
          <FaMemory className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t("superadmin.system.memoryUsage", "Memory Usage")}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">
              {t("superadmin.system.rss", "RSS")}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatBytes(health?.memory?.rss || 0)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">
              {t("superadmin.system.heapTotal", "Heap Total")}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatBytes(health?.memory?.heapTotal || 0)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">
              {t("superadmin.system.heapUsed", "Heap Used")}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatBytes(health?.memory?.heapUsed || 0)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">
              {t("superadmin.system.external", "External")}
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatBytes(health?.memory?.external || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t(
            "superadmin.system.realtimeActivity",
            "Real-time Activity (Last 5 minutes)"
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">
              {t("superadmin.system.recentPayments", "Recent Payments")}
            </p>
            <p className="text-3xl font-bold text-green-600">
              {metrics?.recentPayments || 0}
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">
              {t("superadmin.system.recentAttendance", "Recent Attendance")}
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {metrics?.recentAttendance || 0}
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">
              {t("superadmin.system.systemStatus", "System Status")}
            </p>
            <p
              className={`text-3xl font-bold ${
                metrics?.status === "low"
                  ? "text-green-600"
                  : metrics?.status === "medium"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {metrics?.status?.toUpperCase() || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">
          {t("superadmin.system.lastUpdated", "Last updated:")}{" "}
          {health?.lastCheck && !isNaN(new Date(health.lastCheck).getTime())
            ? new Date(health.lastCheck).toLocaleString()
            : "N/A"}
        </p>
      </div>
    </div>
  );
};

export default SystemHealthDashboard;
