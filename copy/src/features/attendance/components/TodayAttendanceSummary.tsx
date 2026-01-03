import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueries } from "@tanstack/react-query"; // Crucial for parallel fetching

import {
  FaCalendarWeek,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUserClock,
} from "react-icons/fa";

// 1. IMPORT THE `api` OBJECT and `useClasses` HOOK
// Adjust this import path to your project structure
import api, { useClasses } from "../services/attendanceService";

// A simple skeleton loader for the stats.
const StatsSkeletonLoader = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-6 w-1/4 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
      </div>
    ))}
  </div>
);

export const TodayAttendanceSummary = () => {
  const { t } = useTranslation();
  const todayStr = new Date().toISOString().split("T")[0];

  // 2. First, fetch the list of all classes. This is our starting point.
  const { data: classesData, isLoading: classesLoading } = useClasses({
    // Scope classes by managed context (school/branch/course)
  });

  // 3. Use `useQueries` to fetch the summary for EACH class in parallel.
  const classSummaries = useQueries({
    queries: (classesData || []).map((classItem) => ({
      queryKey: ["class-attendance-summary", String(classItem.id), todayStr],

      // 4. THE FIX: Call the plain async API function directly.
      //    Do NOT call another hook (like `useClassAttendanceSummary`) here.
      queryFn: () =>
        api.getClassAttendanceSummary(String(classItem.id), todayStr),

      staleTime: 2 * 60 * 1000,
      enabled: !!classesData, // Important: Only run these queries after the class list is loaded.
    })),
  });

  // Determine the overall loading and error states from the multiple queries.
  const isLoading = classesLoading || classSummaries.some((q) => q.isLoading);
  const isError = classSummaries.some((q) => q.isError);

  // Use useMemo to aggregate the results only when the data changes.
  const totalSummary = useMemo(() => {
    if (isLoading || isError) {
      return { present: 0, absent: 0, late: 0, excused: 0 };
    }

    // Use .reduce() to sum up the values from each successful query result.
    return classSummaries.reduce(
      (acc, queryResult) => {
        // Only add data from queries that succeeded.
        if (queryResult.isSuccess && queryResult.data) {
          acc.present += queryResult.data.present || 0;
          acc.absent += queryResult.data.absent || 0;
          acc.late += queryResult.data.late || 0;
          acc.excused +=
            (queryResult.data.excused || 0) + (queryResult.data.halfDay || 0);
        }
        return acc;
      },
      { present: 0, absent: 0, late: 0, excused: 0 }
    );
  }, [classSummaries, isLoading, isError]);

  const renderContent = () => {
    if (isLoading) {
      return <StatsSkeletonLoader />;
    }

    if (isError) {
      // This message appears if any of the parallel API calls fail.
      return (
        <div className="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
          {t("attendance.fetchSummary")}
        </div>
      );
    }

    const totalRecords = Object.values(totalSummary).reduce(
      (sum, val) => sum + val,
      0
    );

    if (totalRecords === 0) {
      return (
        <div className="text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {t("attendance.noRecords")}
        </div>
      );
    }

    const stats = [
      {
        icon: <FaCheckCircle className="w-5 h-5 text-green-600" />,
        label: t("attendance.stats.present", "Present"),
        value: totalSummary.present,
        bg: "bg-green-50",
      },
      {
        icon: <FaTimesCircle className="w-5 h-5 text-red-600" />,
        label: t("attendance.stats.absent", "Absent"),
        value: totalSummary.absent,
        bg: "bg-red-50",
      },
      {
        icon: <FaClock className="w-5 h-5 text-yellow-600" />,
        label: t("attendance.stats.late", "Late"),
        value: totalSummary.late,
        bg: "bg-yellow-50",
      },
      {
        icon: <FaUserClock className="w-5 h-5 text-orange-600" />,
        label: t("attendance.excused", "Excused"),
        value: totalSummary.excused,
        bg: "bg-orange-50",
      },
    ];

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center gap-3 rounded-lg p-4 shadow-sm border border-gray-200 ${stat.bg}`}
          >
            <div className="shrink-0">{stat.icon}</div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <FaCalendarWeek className="w-5 h-5 text-blue-600" />
        {t("attendance.todayTotal")}
      </h2>
      {renderContent()}
    </div>
  );
};
