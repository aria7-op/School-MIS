import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FaDollarSign,
  FaTimes,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import superadminService from "../../services/superadminService";

interface ProfitDetailViewProps {
  dateRange: { startDate: string; endDate: string };
  selectedSchoolId?: string | null;
  selectedBranchId?: string | null;
  selectedCourseId?: string | null;
  onClose: () => void;
}

const ProfitDetailView: React.FC<ProfitDetailViewProps> = ({
  dateRange,
  selectedSchoolId,
  selectedBranchId,
  selectedCourseId,
  onClose,
}) => {
  const { t } = useTranslation();

  const { data: profitData, isLoading } = useQuery({
    queryKey: ["profit-loss-report", dateRange, selectedSchoolId, selectedBranchId, selectedCourseId],
    queryFn: () => superadminService.getProfitLossReport({
      ...dateRange,
      schoolId: selectedSchoolId || undefined,
      branchId: selectedBranchId || undefined,
      courseId: selectedCourseId || undefined,
    }),
  });

  const { data: financialOverview } = useQuery({
    queryKey: ["financial-overview", dateRange, selectedSchoolId, selectedBranchId, selectedCourseId],
    queryFn: () => superadminService.getFinancialOverview({
      ...dateRange,
      schoolId: selectedSchoolId || undefined,
      branchId: selectedBranchId || undefined,
      courseId: selectedCourseId || undefined,
    }),
  });

  const report = profitData?.data || profitData;
  const overview =
    financialOverview?.data?.summary || financialOverview?.summary;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
                {t(
                  "superadmin.details.netProfitBreakdown",
                  "Net Profit Breakdown"
                )}
              </h2>
              <p className="text-green-100 mt-1">
                {t(
                  "superadmin.details.detailedProfitAnalysis",
                  "Detailed profit and loss analysis"
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
              {/* Main Profit Summary */}
              <div className="bg-green-400 rounded-lg p-6 border border-green-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {t("superadmin.details.profitSummary", "Profit Summary")}
                  </h3>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      (overview?.netProfit || report?.profit?.net || 0) >= 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {(overview?.netProfit || report?.profit?.net || 0) >= 0 ? (
                      <>
                        <FaArrowUp className="w-4 h-4" />
                        <span className="font-semibold">
                          {t("superadmin.details.profitable", "Profitable")}
                        </span>
                      </>
                    ) : (
                      <>
                        <FaArrowDown className="w-4 h-4" />
                        <span className="font-semibold">
                          {t("superadmin.details.loss", "Loss")}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm font-medium text-gray-600">
                      {t("superadmin.details.netProfit", "Net Profit")}
                    </p>
                    <p
                      className={`text-3xl font-bold mt-2 ${
                        (overview?.netProfit || report?.profit?.net || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(
                        overview?.netProfit || report?.profit?.net || 0
                      )}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm font-medium text-gray-600">
                      {t("superadmin.details.profitMargin", "Profit Margin")}
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {overview?.profitMargin || report?.profit?.margin || "0"}%
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm font-medium text-gray-600">
                      {t("superadmin.details.grossProfit", "Gross Profit")}
                    </p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {formatCurrency(
                        report?.profit?.gross || overview?.netProfit || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaArrowUp className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {t(
                        "superadmin.details.revenueBreakdown",
                        "Revenue Breakdown"
                      )}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        {t("superadmin.details.totalRevenue", "Total Revenue")}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(
                          overview?.totalRevenue || report?.revenue?.total || 0
                        )}
                      </span>
                    </div>

                    {report?.revenue?.breakdown && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {t(
                                "superadmin.details.tuitionFees",
                                "Tuition Fees"
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {overview?.totalRevenue
                                ? (
                                    (report.revenue.breakdown.tuitionFees /
                                      overview.totalRevenue) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              % {t("superadmin.details.ofTotal", "of total")}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              report.revenue.breakdown.tuitionFees || 0
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {t("superadmin.details.otherFees", "Other Fees")}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {overview?.totalRevenue
                                ? (
                                    (report.revenue.breakdown.otherFees /
                                      overview.totalRevenue) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              % {t("superadmin.details.ofTotal", "of total")}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              report.revenue.breakdown.otherFees || 0
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {t(
                            "superadmin.details.totalPayments",
                            "Total Payments"
                          )}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {overview?.totalPayments || 0}{" "}
                          {t("superadmin.details.transactions", "transactions")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expenses Breakdown */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FaArrowDown className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {t(
                        "superadmin.details.expensesBreakdown",
                        "Expenses Breakdown"
                      )}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        {t(
                          "superadmin.details.totalExpenses",
                          "Total Expenses"
                        )}
                      </span>
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(
                          overview?.totalExpenses || report?.costs?.total || 0
                        )}
                      </span>
                    </div>

                    {report?.costs?.breakdown && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {t(
                                "superadmin.details.operationalExpenses",
                                "Operational Expenses"
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {overview?.totalExpenses
                                ? (
                                    (report.costs.breakdown
                                      .operationalExpenses /
                                      overview.totalExpenses) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              % {t("superadmin.details.ofTotal", "of total")}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              report.costs.breakdown.operationalExpenses || 0
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {t(
                                "superadmin.details.staffSalaries",
                                "Staff Salaries"
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {overview?.totalExpenses
                                ? (
                                    (report.costs.breakdown.staffSalaries /
                                      overview.totalExpenses) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              % {t("superadmin.details.ofTotal", "of total")}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(
                              report.costs.breakdown.staffSalaries || 0
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {t(
                            "superadmin.details.totalTransactions",
                            "Total Transactions"
                          )}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {overview?.totalExpenseTransactions || 0}{" "}
                          {t("superadmin.details.transactions", "transactions")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Health Analysis */}
              {report?.analysis && (
                <div
                  className={`rounded-lg p-6 border ${
                    report.analysis.isProfitable
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        report.analysis.isProfitable
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {report.analysis.isProfitable ? (
                        <FaCheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`text-lg font-bold mb-2 ${
                          report.analysis.isProfitable
                            ? "text-green-900"
                            : "text-red-900"
                        }`}
                      >
                        {t(
                          "superadmin.details.financialHealthAnalysis",
                          "Financial Health Analysis"
                        )}
                      </h3>
                      <p
                        className={`text-sm mb-3 ${
                          report.analysis.isProfitable
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        <span className="font-semibold">
                          {t("superadmin.details.status", "Status")}:
                        </span>{" "}
                        {report.analysis.status}
                      </p>
                      <p
                        className={`text-sm ${
                          report.analysis.isProfitable
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        <span className="font-semibold">
                          {t(
                            "superadmin.details.recommendation",
                            "Recommendation"
                          )}
                          :
                        </span>{" "}
                        {report.analysis.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Period Information */}
              {report?.period && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-600">
                        {t("superadmin.details.reportPeriod", "Report Period")}:{" "}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {new Date(report.period.startDate).toLocaleDateString()}{" "}
                        - {new Date(report.period.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaChartLine className="w-4 h-4" />
                      <span>
                        {t(
                          "superadmin.details.profitLossReport",
                          "Profit & Loss Report"
                        )}
                      </span>
                    </div>
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

export default ProfitDetailView;
