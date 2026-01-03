import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import secureApiService from "../../../services/secureApiService";
import { AttendanceStats, AttendanceStatsProps, AttendanceRecord } from "../types/attendance";
import {
  getDaysInShamsiMonth,
  gregorianToSolarHijri,
  shamsiMonthRangeToGregorian,
} from "../../../utils/shamsi";
import {
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaUserClock,
} from "react-icons/fa";

const AttendanceStatsComponent: React.FC<
  AttendanceStatsProps & {
    selectedHijriMonth?: number | null;
    selectedHijriYear?: number | null;
    /**
     * Optional: custom fetcher function to load stats from backend.
     * If provided the component will use this to load dynamic data when mounted or when
     * `selectedHijriMonth` changes. If not provided and `stats` prop is undefined, the
     * component will attempt a default fetch from `/api/attendance/stats`.
     */
    fetchStats?: (month?: number | null) => Promise<AttendanceStats | null>;
  }
> = ({
  stats,
  loading,
  onRefresh,
  selectedHijriMonth,
  selectedHijriYear,
  fetchStats,
}) => {
  const { t } = useTranslation();
  // Internal state used when fetching dynamically
  const [internalStats, setInternalStats] = useState<
    AttendanceStats | null | undefined
  >(stats);
  const [internalLoading, setInternalLoading] = useState<boolean>(!!loading);

  // Default fetcher: used when no fetchStats prop is provided and stats prop is undefined
  const defaultFetcher = useCallback(async (month?: number | null) => {
    try {
      const q = typeof month === "number" ? { month } : {};
      const response = await secureApiService.get<AttendanceStats>(`/attendance/stats`, {
        params: q
      });
      if (!response || response.success === false) {
        throw new Error(response?.message || "Failed to load attendance stats");
      }
      return (response.data as AttendanceStats) ?? (response as unknown as AttendanceStats);
    } catch (e) {
      console.warn("AttendanceStats default fetch failed", e);
      return null;
    }
  }, []);

  const fetcher = fetchStats ?? defaultFetcher;

  const fetchAndSet = useCallback(
    async (month?: number | null) => {
      setInternalLoading(true);
      try {
        const result = await fetcher(month);
        setInternalStats(result ?? null);
      } catch (e) {
        console.error("Failed to fetch attendance stats", e);
        setInternalStats(null);
      } finally {
        setInternalLoading(false);
      }
    },
    [fetcher]
  );

  // If caller passed stats prop we prefer that source unless fetchStats is provided.
  // If fetchStats is provided, always load dynamic data and update internalStats.
  useEffect(() => {
    if (fetchStats) {
      fetchAndSet(selectedHijriMonth ?? null);
      return;
    }
    // If no fetchStats but stats prop is undefined, attempt default fetch once
    if (typeof stats === "undefined" || stats === null) {
      fetchAndSet(selectedHijriMonth ?? null);
    } else {
      setInternalStats(stats);
      setInternalLoading(!!loading);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHijriMonth, fetchStats]);

  const displayLoading = fetchStats
    ? internalLoading
    : loading || internalLoading;
  const displayStats =
    fetchStats || typeof stats === "undefined" || stats === null
      ? internalStats
      : stats;

  if (displayLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-12 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!displayStats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaChartLine className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t("attendance.stats.noStatsAvailable")}
        </h3>
        <p className="text-gray-500">
          {t("attendance.stats.noStatsDescription")}
        </p>
      </div>
    );
  }

  const getTrendIcon = (direction: "up" | "down" | "stable") => {
    switch (direction) {
      case "up":
        return <FaArrowUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <FaArrowDown className="w-4 h-4 text-red-500" />;
      case "stable":
        return <FaMinus className="w-4 h-4 text-gray-500" />;
      default:
        return <FaMinus className="w-4 h-4 text-gray-500" />;
    }
  };

  // Helper to convert time string (HH:mm) to minutes since midnight
  const timeToMinutes = (time: string | undefined): number | null => {
    if (!time) return null;
    const parts = time.split(":");
    if (parts.length !== 2) return null;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  };

  // Helper to convert minutes since midnight back to HH:mm
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  // Calculate average time from array of time strings
  const calculateAverageTime = (times: (string | undefined)[]): string | "--" => {
    const validTimes = times
      .map((t) => timeToMinutes(t))
      .filter((m): m is number => m !== null);
    if (validTimes.length === 0) return "--";
    const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
    return minutesToTime(Math.round(avg));
  };

  const getTrendColor = (direction: "up" | "down" | "stable") => {
    switch (direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      case "stable":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return "0%";
    const percentage = value > 1 ? value : value * 100;
    return `${Math.round(Math.min(Math.max(percentage, 0), 100) * 100) / 100}%`;
  };

  const formatHours = (hours: number | undefined | null) => {
    if (hours === undefined || hours === null || isNaN(hours)) return "0h";
    return `${Math.round(Math.max(hours, 0) * 100) / 100}h`;
  };

  const formatNumber = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return 0;
    return Math.max(0, Math.round(value));
  };

  // Calculate days passed from start of selected Hijri month until today
  const hijriMonthDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current Hijri date
    const currentHijri = gregorianToSolarHijri(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );

    // Determine which Hijri month/year to use
    let hijriYear: number;
    let hijriMonth: number;

    if (!selectedHijriMonth) {
      // If no month selected, use current Hijri month
      hijriYear = currentHijri.year;
      hijriMonth = currentHijri.month;
    } else {
      // Use selected month
      hijriMonth = selectedHijriMonth;

      // Use selected year if provided
      if (selectedHijriYear !== null && selectedHijriYear !== undefined) {
        hijriYear = selectedHijriYear;
      } else {
        // Determine the correct year by checking which year's month contains today
        // For months 10, 11, 12 (Jadi, Dalw, Hoot), they span Gregorian year boundaries
        // We need to check both current year and previous year to find the right one

        hijriYear = currentHijri.year;

        // Try current year first
        try {
          const { startISO: startCurrent, endISO: endCurrent } =
            shamsiMonthRangeToGregorian(hijriYear, hijriMonth);
          const monthStartCurrent = new Date(startCurrent);
          monthStartCurrent.setHours(0, 0, 0, 0);
          const monthEndCurrent = new Date(endCurrent);
          monthEndCurrent.setHours(23, 59, 59, 999);

          // Check if today falls within this year's month
          if (today >= monthStartCurrent && today <= monthEndCurrent) {
            // Current year is correct
          } else {
            // Try previous year
            const prevYear = hijriYear - 1;
            try {
              const { startISO: startPrev, endISO: endPrev } =
                shamsiMonthRangeToGregorian(prevYear, hijriMonth);
              const monthStartPrev = new Date(startPrev);
              monthStartPrev.setHours(0, 0, 0, 0);
              const monthEndPrev = new Date(endPrev);
              monthEndPrev.setHours(23, 59, 59, 999);

              if (today >= monthStartPrev && today <= monthEndPrev) {
                hijriYear = prevYear;
              } else if (today < monthStartCurrent) {
                // Month is in the future for current year, check if it's in the past for previous year
                if (today < monthStartPrev) {
                  // Month is in the future for both years, use current year
                } else {
                  // Month is in the past for previous year, use previous year
                  hijriYear = prevYear;
                }
              }
            } catch (e) {
              // If error, use current year
            }
          }
        } catch (e) {
          // If error calculating current year, try previous year
          const prevYear = hijriYear - 1;
          try {
            const { startISO: startPrev, endISO: endPrev } =
              shamsiMonthRangeToGregorian(prevYear, hijriMonth);
            const monthStartPrev = new Date(startPrev);
            monthStartPrev.setHours(0, 0, 0, 0);
            const monthEndPrev = new Date(endPrev);
            monthEndPrev.setHours(23, 59, 59, 999);

            if (today >= monthStartPrev && today <= monthEndPrev) {
              hijriYear = prevYear;
            }
          } catch (e2) {
            // If both fail, keep current year
          }
        }
      }
    }

    try {
      // Get the date range for the selected Hijri month
      const { startISO, endISO } = shamsiMonthRangeToGregorian(
        hijriYear,
        hijriMonth
      );

      const monthStart = new Date(startISO);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(endISO);
      monthEnd.setHours(23, 59, 59, 999);

      // If today is before the month starts, return 0 (month is in the future)
      if (today < monthStart) {
        return 0;
      }

      // If today is after the month ends, return total days in month (month is in the past)
      if (today > monthEnd) {
        return getDaysInShamsiMonth(hijriYear, hijriMonth);
      }

      // Calculate days between month start and today (inclusive)
      // Both dates are set to midnight, so the difference is in full days
      const diffTime = today.getTime() - monthStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day

      // Ensure we don't return more days than are in the month
      const totalDaysInMonth = getDaysInShamsiMonth(hijriYear, hijriMonth);
      return Math.min(Math.max(0, diffDays), totalDaysInMonth);
    } catch (error) {
      console.error("Error calculating Hijri month days:", error);
      // Fallback to current month calculation
      if (!selectedHijriMonth || selectedHijriMonth === currentHijri.month) {
        return currentHijri.day;
      }
      return 0;
    }
  }, [selectedHijriMonth, selectedHijriYear]);

  // Internal state for fetched records (for time analysis calculation)
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[] | null
  >(null);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Fetch attendance records to calculate time analysis
  const fetchRecordsForTimeAnalysis = useCallback(
    async (month?: number | null) => {
      try {
        setLoadingRecords(true);
        const params = typeof month === "number" ? { month } : undefined;
        const res = await secureApiService.get(`/attendance/records`, {
          params,
        });
        if (!res || res.success === false) {
          throw new Error(res?.message || "Failed to load attendance records");
        }
        const payload = res.data ?? res;
        setAttendanceRecords(
          Array.isArray((payload as any)?.records)
            ? (payload as any).records
            : Array.isArray(payload)
              ? (payload as AttendanceRecord[])
              : (payload as any)?.data ?? []
        );
      } catch (e) {
        console.warn("Failed to fetch attendance records for time analysis", e);
        setAttendanceRecords(null);
      } finally {
        setLoadingRecords(false);
      }
    },
    []
  );

  // Auto-fetch records when month changes
  useEffect(() => {
    if (fetchStats || !stats) {
      fetchRecordsForTimeAnalysis(selectedHijriMonth ?? null);
    }
  }, [selectedHijriMonth, fetchStats, stats, fetchRecordsForTimeAnalysis]);

  // Calculate timeAnalysis from available data
  const computedTimeAnalysis = useMemo(() => {
    const stats = displayStats || internalStats;
    if (!stats) return null;

    if (stats.timeAnalysis && stats.timeAnalysis.averageInTime !== "--") {
      return stats.timeAnalysis;
    }

    // Calculate from available stats
    const totalDays = stats.totalDays || 0;
    const totalLate = stats.totalLate || 0;
    const totalPresent = stats.totalPresent || 0;
    const totalHours = stats.totalHours || 0;

    // Calculate rates
    const lateRate = totalDays > 0 ? totalLate / totalDays : 0;
    const onTimeRate =
      totalDays > 0 ? (totalPresent - totalLate) / totalDays : 0;
    const averageHours = totalPresent > 0 ? totalHours / totalPresent : 0;

    // Calculate average times from fetched records
    let averageInTime: string | "--" = "--";
    let averageOutTime: string | "--" = "--";
    let earlyLeaveRate = 0;
    let overtimeRate = 0;

    if (attendanceRecords && attendanceRecords.length > 0) {
      const inTimes = attendanceRecords.map((r) => r.inTime);
      averageInTime = calculateAverageTime(inTimes);

      const outTimes = attendanceRecords.map((r) => r.outTime);
      averageOutTime = calculateAverageTime(outTimes);

      // Calculate early leave and overtime rates
      const earlyLeaves = attendanceRecords.filter(
        (r) => r.outTimeStatus === "EARLY_LEAVE"
      ).length;
      const overtimes = attendanceRecords.filter(
        (r) => r.outTimeStatus === "OVERTIME"
      ).length;
      earlyLeaveRate = attendanceRecords.length > 0 ? earlyLeaves / attendanceRecords.length : 0;
      overtimeRate = attendanceRecords.length > 0 ? overtimes / attendanceRecords.length : 0;
    }

    return {
      averageInTime,
      averageOutTime,
      averageHours,
      onTimeRate,
      lateRate,
      earlyLeaveRate,
      overtimeRate,
    };
  }, [displayStats, internalStats, attendanceRecords]);

  // Calculate insights from available data if missing
  const computedInsights = useMemo(() => {
    const stats = displayStats || internalStats;
    if (!stats) return null;

    if (stats.insights) {
      return stats.insights;
    }

    const recommendations: string[] = [];
    const improvementAreas: string[] = [];

    const attendanceRate = stats.averageAttendanceRate || 0;
    const totalAbsent = stats.totalAbsent || 0;
    const totalLate = stats.totalLate || 0;
    const totalDays = stats.totalDays || 0;

    // Generate recommendations based on attendance data
    if (attendanceRate < 0.8) {
      recommendations.push(
        t("attendance.stats.insights.lowAttendanceRecommendation", {
          defaultValue:
            "Attendance rate is below 80%. Consider implementing attendance incentives.",
        })
      );
      improvementAreas.push(
        t("attendance.stats.insights.attendanceRate", {
          defaultValue: "Overall attendance rate needs improvement",
        })
      );
    }

    if (totalLate > totalDays * 0.2) {
      recommendations.push(
        t("attendance.stats.insights.lateArrivalRecommendation", {
          defaultValue:
            "High number of late arrivals. Review start times and punctuality policies.",
        })
      );
      improvementAreas.push(
        t("attendance.stats.insights.punctuality", {
          defaultValue: "Punctuality and on-time arrival",
        })
      );
    }

    if (totalAbsent > totalDays * 0.3) {
      recommendations.push(
        t("attendance.stats.insights.absenteeismRecommendation", {
          defaultValue:
            "Significant absenteeism detected. Consider reaching out to students and parents.",
        })
      );
      improvementAreas.push(
        t("attendance.stats.insights.absenteeism", {
          defaultValue: "Reducing absenteeism",
        })
      );
    }

    // Find best and worst days from dailyTrends
    let bestDay = "--";
    let worstDay = "--";
    if (stats.dailyTrends && stats.dailyTrends.length > 0) {
      const sortedByPresent = [...stats.dailyTrends].sort(
        (a, b) => (b.present || 0) - (a.present || 0)
      );
      bestDay = sortedByPresent[0]?.date || "--";
      worstDay = sortedByPresent[sortedByPresent.length - 1]?.date || "--";
    }

    // Find best and worst students
    let bestStudent = "--";
    let worstStudent = "--";
    if (stats.studentStats && stats.studentStats.length > 0) {
      const sortedByRate = [...stats.studentStats].sort(
        (a, b) => (b.attendanceRate || 0) - (a.attendanceRate || 0)
      );
      bestStudent = sortedByRate[0]?.studentName || "--";
      worstStudent = sortedByRate[sortedByRate.length - 1]?.studentName || "--";
    }

    // If no specific recommendations, add general ones
    if (recommendations.length === 0) {
      recommendations.push(
        t("attendance.stats.insights.generalRecommendation", {
          defaultValue:
            "Continue monitoring attendance patterns and maintain current practices.",
        })
      );
    }

    if (improvementAreas.length === 0) {
      improvementAreas.push(
        t("attendance.stats.insights.generalImprovement", {
          defaultValue: "Maintain current attendance levels",
        })
      );
    }

    return {
      bestDay,
      worstDay,
      bestStudent,
      worstStudent,
      averageAttendanceRate: attendanceRate,
      improvementAreas,
      recommendations,
    };
  }, [displayStats, internalStats, t]);

  const totalAttendanceRecords = useMemo(() => {
    if (!internalStats) return 0;
    return (
      (internalStats.totalPresent || 0) +
      (internalStats.totalAbsent || 0) +
      (internalStats.totalLate || 0) +
      (internalStats.totalExcused || 0)
    );
  }, [internalStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FaChartLine className="w-5 h-5 text-blue-600" />
          {t("attendance.stats.title")}
        </h3>
        {onRefresh && (
          <button
            onClick={() => {
              try {
                onRefresh?.();
              } catch {}
              if (fetchStats) fetchAndSet(selectedHijriMonth ?? null);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={t("attendance.stats.refresh")}
          >
            <FaClock className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-6">
        {/* Total Days */}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {t("attendance.stats.totalDays")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(hijriMonthDays)}
              </p>
            </div>
          </div>
        </div>

        {/* Present */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {t("attendance.stats.present")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPercentage(
                  totalAttendanceRecords > 0
                    ? internalStats.totalPresent / totalAttendanceRecords
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FaTimesCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {t("attendance.stats.absent")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPercentage(
                  totalAttendanceRecords > 0
                    ? internalStats.totalAbsent / totalAttendanceRecords
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Late */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaClock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {t("attendance.stats.late")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPercentage(
                  totalAttendanceRecords > 0
                    ? internalStats.totalLate / totalAttendanceRecords
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Leave */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 col-span-2 md:col-span-1 ">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaUserClock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                {t("attendance.stats.excused")}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPercentage(
                  totalAttendanceRecords > 0
                    ? internalStats.totalExcused / totalAttendanceRecords
                    : 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Attendance Rate */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {t("attendance.stats.attendanceRate")}
            </h4>
            <div
              className={`flex items-center gap-1 ${getTrendColor(
                internalStats.trendDirection || "stable"
              )}`}
            >
              {getTrendIcon(internalStats.trendDirection || "stable")}
              <span className="text-sm font-medium">
                {internalStats.trendPercentage &&
                !isNaN(internalStats.trendPercentage)
                  ? `${
                      internalStats.trendPercentage > 0 ? "+" : ""
                    }${formatNumber(internalStats.trendPercentage)}%`
                  : "0%"}
              </span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatPercentage(internalStats.averageAttendanceRate)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  typeof internalStats.averageAttendanceRate === "number" &&
                    !isNaN(internalStats.averageAttendanceRate)
                    ? internalStats.averageAttendanceRate > 1
                      ? internalStats.averageAttendanceRate
                      : internalStats.averageAttendanceRate * 100
                    : 0,
                  100
                )}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Total Hours */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {t("attendance.stats.totalHours")}
          </h4>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatHours(internalStats.totalHours)}
          </div>
          <p className="text-sm text-gray-500">
            {t("attendance.stats.average")}:{" "}
            {formatHours(
              internalStats.totalHours / Math.max(internalStats.totalDays, 1)
            )}{" "}
            {t("attendance.stats.perMonth")}
          </p>
        </div>

        {/* Recent Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {t("attendance.stats.recentTrend")}
          </h4>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-gray-900">
              {internalStats.recentTrend && !isNaN(internalStats.recentTrend)
                ? `${internalStats.recentTrend > 0 ? "+" : ""}${formatNumber(
                    internalStats.recentTrend
                  )}%`
                : "0%"}
            </span>
            <div
              className={`flex items-center ${getTrendColor(
                internalStats.trendDirection
              )}`}
            >
              {getTrendIcon(internalStats.trendDirection)}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {selectedHijriMonth !== null && selectedHijriMonth !== undefined
              ? internalStats.trendDirection === "up"
                ? t("attendance.stats.improvingComparison")
                : internalStats.trendDirection === "down"
                ? t("attendance.stats.decliningComparison")
                : t("attendance.stats.stableComparison")
              : internalStats.trendDirection === "up"
              ? t("attendance.stats.improving")
              : internalStats.trendDirection === "down"
              ? t("attendance.stats.declining")
              : t("attendance.stats.stable")}
          </p>
        </div>
      </div>

      {/* Time Analysis */}
      {displayStats && computedTimeAnalysis && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {t("attendance.stats.timeAnalysis.title")}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {t("attendance.stats.timeAnalysis.avgInTime")}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {computedTimeAnalysis.averageInTime || "--"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {t("attendance.stats.timeAnalysis.avgOutTime")}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {computedTimeAnalysis.averageOutTime || "--"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {t("attendance.stats.timeAnalysis.onTimeRate")}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {formatPercentage(computedTimeAnalysis.onTimeRate)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {t("attendance.stats.timeAnalysis.lateRate")}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {formatPercentage(computedTimeAnalysis.lateRate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {displayStats && computedInsights && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
            {t("attendance.stats.insights.title")}
          </h4>
          <div className="space-y-3">
            {computedInsights?.recommendations &&
              computedInsights.recommendations.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    {t("attendance.stats.insights.recommendations")}
                  </h5>
                  <ul className="list-disc list-inside space-y-1">
                    {computedInsights.recommendations.map(
                      (recommendation, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          {recommendation}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            {computedInsights?.improvementAreas &&
              computedInsights.improvementAreas.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    {t("attendance.stats.insights.improvementAreas")}
                  </h5>
                  <ul className="list-disc list-inside space-y-1">
                    {computedInsights.improvementAreas.map((area, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceStatsComponent;
