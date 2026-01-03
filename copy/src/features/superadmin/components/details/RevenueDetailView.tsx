import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FaDollarSign,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaCreditCard,
  FaChartBar,
  FaCalendarAlt,
} from "react-icons/fa";
import superadminService from "../../services/superadminService";

interface RevenueDetailViewProps {
  dateRange: { startDate: string; endDate: string };
  onClose: () => void;
}

const RevenueDetailView: React.FC<RevenueDetailViewProps> = ({
  dateRange,
  onClose,
}) => {
  const { t } = useTranslation();

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["revenue-analytics", dateRange],
    queryFn: () => superadminService.getRevenueAnalytics(dateRange),
  });

  const { data: financialOverview } = useQuery({
    queryKey: ["financial-overview", dateRange],
    queryFn: () => superadminService.getFinancialOverview(dateRange),
  });

  const revenue = revenueData?.data || revenueData;
  const overview =
    financialOverview?.data?.summary || financialOverview?.summary;
  const paymentMethods =
    financialOverview?.data?.paymentsByMethod ||
    financialOverview?.paymentsByMethod ||
    [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <FaArrowUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <FaArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <FaChartBar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case "up":
        return "text-green-600 bg-green-50";
      case "down":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-green-500 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaDollarSign className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">
                {t("superadmin.details.revenueBreakdown", "Revenue Breakdown")}
              </h2>
              <p className="text-green-100 mt-1">
                {t(
                  "superadmin.details.detailedRevenueAnalysis",
                  "Detailed revenue analysis and trends"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-500 rounded-lg transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              {/* Main Revenue Summary */}
              <div className="bg-white rounded-lg p-6 border border-green-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm font-medium text-gray-600">
                      {t("superadmin.details.totalRevenue", "Total Revenue")}
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {formatCurrency(
                        revenue?.totalRevenue || overview?.totalRevenue || 0
                      )}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm font-medium text-gray-600">
                      {t(
                        "superadmin.details.avgTransaction",
                        "Avg Transaction"
                      )}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(revenue?.avgTransactionValue || 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm font-medium text-gray-600">
                      {t("superadmin.details.totalPayments", "Total Payments")}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {overview?.totalPayments || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm font-medium text-gray-600">
                      {t("superadmin.details.pendingAmount", "Pending Amount")}
                    </p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {formatCurrency(overview?.pendingAmount || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {overview?.pendingCount || 0}{" "}
                      {t("superadmin.details.payments", "payments")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue Trend */}
              {revenue?.trend && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaChartBar className="w-5 h-5 text-green-600" />
                    {t("superadmin.details.revenueTrend", "Revenue Trend")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      className={`rounded-lg p-4 ${getTrendColor(
                        revenue.trend.direction
                      )}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getTrendIcon(revenue.trend.direction)}
                        <p className="text-sm font-medium">
                          {t("superadmin.details.trend", "Trend")}
                        </p>
                      </div>
                      <p className="text-2xl font-bold capitalize">
                        {revenue.trend.direction}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-600 mb-2">
                        {t(
                          "superadmin.details.percentageChange",
                          "Percentage Change"
                        )}
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        {revenue.trend.percentage.toFixed(2)}%
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-purple-600 mb-2">
                        {t("superadmin.details.amountChange", "Amount Change")}
                      </p>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(Math.abs(revenue.trend.change))}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              {paymentMethods.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaCreditCard className="w-5 h-5 text-green-600" />
                    {t("superadmin.details.paymentMethods", "Payment Methods")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paymentMethods.map((method: any, index: number) => {
                      const totalRevenue =
                        revenue?.totalRevenue || overview?.totalRevenue || 1;
                      const percentage = (
                        (method.amount / totalRevenue) *
                        100
                      ).toFixed(1);
                      return (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <FaCreditCard className="w-4 h-4 text-green-600" />
                              </div>
                              <p className="font-semibold text-gray-900 capitalize">
                                {method.method}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                              {percentage}%
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                {t("superadmin.details.amount", "Amount")}
                              </span>
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(method.amount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                {t(
                                  "superadmin.details.transactions",
                                  "Transactions"
                                )}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {method.count}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Revenue by Period */}
              {revenue?.revenueByPeriod &&
                revenue.revenueByPeriod.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="w-5 h-5 text-green-600" />
                      {t(
                        "superadmin.details.revenueByPeriod",
                        "Revenue by Period"
                      )}
                    </h3>
                    <div className="space-y-3">
                      {revenue.revenueByPeriod.map(
                        (period: any, index: number) => {
                          const maxAmount = Math.max(
                            ...revenue.revenueByPeriod.map((p: any) => p.amount)
                          );
                          const percentage = (period.amount / maxAmount) * 100;
                          return (
                            <div
                              key={index}
                              className="bg-gray-50 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {period.period}
                                </span>
                                <div className="text-right">
                                  <span className="text-lg font-bold text-gray-900">
                                    {formatCurrency(period.amount)}
                                  </span>
                                  <p className="text-xs text-gray-500">
                                    {period.count}{" "}
                                    {t(
                                      "superadmin.details.payments",
                                      "payments"
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* Top Revenue Streams */}
              {revenue?.topRevenueStreams &&
                revenue.topRevenueStreams.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaChartBar className="w-5 h-5 text-green-600" />
                      {t(
                        "superadmin.details.topRevenueStreams",
                        "Top Revenue Streams"
                      )}
                    </h3>
                    <div className="space-y-3">
                      {revenue.topRevenueStreams.map(
                        (stream: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-green-700">
                                  #{index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {stream.feeItemId}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {stream.count}{" "}
                                  {t(
                                    "superadmin.details.transactions",
                                    "transactions"
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(stream.amount)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevenueDetailView;
