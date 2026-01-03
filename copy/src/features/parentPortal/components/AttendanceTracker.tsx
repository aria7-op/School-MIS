import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStudentAttendance } from "../services/parentPortalService";
import { AttendanceRecord, Child } from "../types/parentPortal";
import {
  HiUser,
  HiCalendarDays,
  HiCheckCircle,
  HiXCircle,
  HiClock,
} from "react-icons/hi2";

interface AttendanceTrackerProps {
  studentId: string;
  children?: Child[];
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  studentId,
  children = [],
}) => {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeView, setActiveView] = useState<"list" | "calendar" | "summary">(
    "list"
  );
  const [selectedChild, setSelectedChild] = useState(studentId);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Update selectedChild when studentId prop changes
  useEffect(() => {
    setSelectedChild(studentId);
  }, [studentId]);

  // Create filters object for the selected month/year
  const attendanceFilters = useMemo(() => {
    if (selectedMonth === "all") {
      // For "all months", set start and end dates for the entire year
      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
      };
    } else {
      // For specific month, use month/year filtering
      return {
        month: selectedMonth,
        year: selectedYear,
      };
    }
  }, [selectedMonth, selectedYear]);

  const {
    data: attendanceRecords = [],
    isLoading,
    error,
  } = useStudentAttendance(selectedChild, attendanceFilters);

  // Normalize API data shape to a consistent array
  const records: AttendanceRecord[] = useMemo(() => {
    if (!attendanceRecords) return [];

    // Handle the actual API response structure
    const apiData = attendanceRecords as any;

    // Check if it's the expected API response format
    if (apiData?.success && apiData?.data?.attendances) {
      const normalized = apiData.data.attendances.map((record: any) => ({
        id: record.id.toString(),
        date: record.date.split("T")[0], // Convert "2025-10-07T12:00:00" to "2025-10-07"
        status: record.status,
        inTime: record.inTime,
        outTime: record.outTime,
        remarks: record.remarks,
        subject: record.subject?.name || record.subjectId?.toString() || null,
      })) as AttendanceRecord[];

      // Debug log to verify data processing
      // console.log('📊 Data processing debug:');
      // console.log('  - Raw API data count:', apiData.data.attendances.length);
      // console.log('  - All raw records:', apiData.data.attendances.map(r => ({
      //   id: r.id,
      //   rawDate: r.date,
      //   status: r.status,
      //   month: new Date(r.date).getMonth(),
      //   year: new Date(r.date).getFullYear()
      // })));
      // console.log('  - Current filter:', attendanceFilters);
      // console.log('  - Selected month/year:', { selectedMonth, selectedYear });
      // console.log('  - Processed records count:', normalized.length);
      // console.log('  - All processed records:', normalized.map(r => ({
      //   id: r.id,
      //   date: r.date,
      //   status: r.status
      // })));
      return normalized;
    }

    // Fallback for other possible structures
    if (Array.isArray(attendanceRecords))
      return attendanceRecords as AttendanceRecord[];
    const payload: any =
      (attendanceRecords as any)?.data ?? (attendanceRecords as any);
    if (Array.isArray(payload)) return payload as AttendanceRecord[];
    if (Array.isArray(payload?.attendances))
      return payload.attendances as AttendanceRecord[];

    return [] as AttendanceRecord[];
  }, [attendanceRecords]);

  // Debug logging for filter changes
  useEffect(() => {
    // console.log('🔄 Filter change detected:', {
    //   selectedChild,
    //   selectedMonth,
    //   selectedYear,
    //   attendanceFilters,
    //   recordsCount: records.length
    // });
  }, [
    selectedChild,
    selectedMonth,
    selectedYear,
    attendanceFilters,
    records.length,
  ]);

  const stats = useMemo(() => {
    const totalDays = records.length;
    const presentDays = records.filter(
      (r: AttendanceRecord) => r.status === "PRESENT"
    ).length;
    const absentDays = records.filter(
      (r: AttendanceRecord) => r.status === "ABSENT"
    ).length;
    const lateDays = records.filter(
      (r: AttendanceRecord) => r.status === "LATE"
    ).length;
    const excusedDays = records.filter(
      (r: AttendanceRecord) => r.status === "EXCUSED"
    ).length;
    const attendancePercentage =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendancePercentage,
    };
  }, [records]);

  // Build a quick lookup by yyyy-mm-dd for calendar view
  const dateKey = (d: Date | string) => {
    const dt = typeof d === "string" ? new Date(d) : d;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const recordByDate = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {};
    for (const r of records) {
      map[dateKey(r.date as any)] = r;
    }
    return map;
  }, [records]);

  const daysInMonth = useMemo(() => {
    // When "all" is selected, show current month for calendar view
    const displayMonth =
      selectedMonth === "all" ? new Date().getMonth() : selectedMonth;
    const displayYear =
      selectedMonth === "all" ? new Date().getFullYear() : selectedYear;

    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    const days: Date[] = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(displayYear, displayMonth, d));
    }
    // pad start with blanks to align week
    const pad = firstDay.getDay(); // 0-6 Sun-Sat
    const blanks: (Date | null)[] = Array(pad).fill(null);
    return [...blanks, ...days];
  }, [selectedMonth, selectedYear, records]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800 border-green-200";
      case "ABSENT":
        return "bg-red-100 text-red-800 border-red-200";
      case "LATE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "EXCUSED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <HiCheckCircle className="w-4 h-4" />;
      case "ABSENT":
        return <HiXCircle className="w-4 h-4" />;
      case "LATE":
        return <HiClock className="w-4 h-4" />;
      case "EXCUSED":
        return <HiCalendarDays className="w-4 h-4" />;
      default:
        return <HiUser className="w-4 h-4" />;
    }
  };

  // Handle calendar cell click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // Helper function to validate and correct time order
  const validateAttendanceTimes = (
    attendance: AttendanceRecord
  ): AttendanceRecord => {
    if (!attendance.inTime || !attendance.outTime) {
      return attendance;
    }

    const inTime = new Date(attendance.inTime);
    const outTime = new Date(attendance.outTime);

    // If outTime is before inTime, swap them
    if (outTime < inTime) {
      // console.log('⚠️ Time order issue detected, swapping times:', {
      //   originalInTime: attendance.inTime,
      //   originalOutTime: attendance.outTime
      // });

      return {
        ...attendance,
        inTime: attendance.outTime,
        outTime: attendance.inTime,
      };
    }

    return attendance;
  };

  // Get attendance record for a specific date
  const getAttendanceForDate = (date: Date): AttendanceRecord | null => {
    const key = dateKey(date);

    // console.log('🔍 Date lookup debug:');
    // console.log('  - Input date:', date);
    // console.log('  - Generated dateKey:', key);
    // console.log('  - Available recordByDate keys:', Object.keys(recordByDate));
    // console.log('  - Looking in recordByDate map...');

    const found = recordByDate[key];

    if (found) {
      // Validate and correct time order if needed
      const validatedRecord = validateAttendanceTimes(found);
      // console.log('  - Found and validated record:', validatedRecord);
      return validatedRecord;
    }

    // console.log('  - No record found');
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="text-center py-4 text-gray-500">
          <p>
            {t("parentPortal.attendance.loading", {
              name:
                children.find((c) => c.id === selectedChild)?.firstName ||
                t("parentPortal.common.student"),
            })}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorStatus = (error as any)?.response?.status;
    const errorMessage =
      (error as any)?.response?.data?.message || error.message;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("parentPortal.attendance.errorLoading")}
          </h3>
          <p className="text-gray-600 mb-2">
            {t("parentPortal.attendance.unableToFetch")}
          </p>
          {errorStatus === 403 && (
            <p className="text-red-600 text-sm mb-4">
              {t("parentPortal.attendance.accessDenied")}
            </p>
          )}
          <p className="text-gray-500 text-xs mb-4">
            {t("parentPortal.common.error")}:{" "}
            {errorMessage || t("parentPortal.attendance.unknownError")}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("parentPortal.common.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none overflow-x-hidden bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 sm:mb-6 space-y-3 lg:space-y-0 text-black">
        <div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-900">
            {t("parentPortal.attendance.title")}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {t("parentPortal.attendance.showingFor", {
              period:
                selectedMonth === "all"
                  ? t("parentPortal.attendance.filters.thisMonth", {
                      year: selectedYear,
                    })
                  : new Date(
                      selectedYear,
                      selectedMonth as number
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    }),
            })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-1.5 lg:gap-2">
          {/* View switcher */}
          <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
            <button
              className={`px-2 py-1 text-xs ${
                activeView === "list"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveView("list")}
            >
              {t("parentPortal.attendance.views.list")}
            </button>
            <button
              className={`px-2 py-1 text-xs border-l border-gray-200 ${
                activeView === "calendar"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveView("calendar")}
            >
              {t("parentPortal.attendance.views.calendar")}
            </button>
            <button
              className={`px-2 py-1 text-xs border-l border-gray-200 ${
                activeView === "summary"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setActiveView("summary")}
            >
              {t("parentPortal.attendance.views.summary")}
            </button>
          </div>
        </div>

        {/* Second Row - Date Selectors and Action Buttons (Mobile) */}
        <div className="flex flex-col sm:hidden gap-2">
          <div className="flex items-center gap-1.5">
            {/* Date Selectors */}
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value === "all" ? "all" : parseInt(e.target.value)
                )
              }
              className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white hover:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">
                {t("parentPortal.attendance.filters.allMonths")}
              </option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white hover:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>

            {/* Show All Year Button - moved to same row */}
            {selectedMonth !== "all" && (
              <button
                onClick={() => setSelectedMonth("all")}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-1 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                title="Show all months of selected year"
              >
                {t("parentPortal.attendance.filters.allYear")}
              </button>
            )}

            {/* Today Button - moved to same row */}
            {(selectedMonth !== new Date().getMonth() ||
              selectedYear !== new Date().getFullYear()) && (
              <button
                onClick={() => {
                  setSelectedMonth(new Date().getMonth());
                  setSelectedYear(new Date().getFullYear());
                }}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                title="Reset to current month"
              >
                {t("parentPortal.attendance.filters.thisMonth")}
              </button>
            )}
          </div>

          {/* Children Selector Row (Mobile) */}
          {children.length > 1 && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent w-full"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.firstName} {child.lastName} - Grade {child.grade}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Desktop/Tablet - Keep original layout */}
        <div className="hidden sm:flex items-center gap-1.5 lg:gap-2">
          {/* Date Selectors */}
          <select
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value === "all" ? "all" : parseInt(e.target.value)
              )
            }
            className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white hover:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">
              {t("parentPortal.attendance.filters.allMonths")}
            </option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white hover:border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>

          {/* Reset to Current Month Button */}
          {(selectedMonth !== new Date().getMonth() ||
            selectedYear !== new Date().getFullYear()) && (
            <button
              onClick={() => {
                setSelectedMonth(new Date().getMonth());
                setSelectedYear(new Date().getFullYear());
              }}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
              title="Reset to current month"
            >
              {t("parentPortal.attendance.filters.thisMonth")}
            </button>
          )}

          {/* Show All Year Button */}
          {selectedMonth !== "all" && (
            <button
              onClick={() => setSelectedMonth("all")}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-1 focus:ring-green-500 focus:ring-offset-1 transition-colors"
              title="Show all months of selected year"
            >
              {t("parentPortal.attendance.filters.allYear")}
            </button>
          )}

          {/* Children Selector */}
          {children.length > 1 && (
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName} - Grade {child.grade}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Selected Child Info */}
      {children.length > 0 && (
        <div className="mb-2 sm:mb-8 p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {(() => {
                const child = children.find((c) => c.id === selectedChild);
                return child
                  ? `${child.firstName[0]}${child.lastName[0]}`
                  : "S";
              })()}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-base sm:text-lg">
                {(() => {
                  const child = children.find((c) => c.id === selectedChild);
                  return child
                    ? `${child.firstName} ${child.lastName}`
                    : "Student";
                })()}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 mx-2">
                {(() => {
                  const child = children.find((c) => c.id === selectedChild);
                  return child
                    ? t("parentPortal.attendance.gradeSection", {
                        grade: child.grade,
                      })
                    : "Grade Information";
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-4 mb-2 sm:mb-6">
        <div className="relative overflow-hidden rounded-xl p-3 sm:p-4 border border-blue-100 bg-gradient-to-b from-blue-50 to-white">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-blue-100/60 blur-2xl" />
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="material-icons text-blue-600 text-sm sm:text-base">
              event
            </span>
            <div>
              <div className="text-xs uppercase tracking-wide text-blue-700/80">
                {t("parentPortal.attendance.stats.totalDays")}
              </div>
              <div className="text-lg sm:text-2xl font-extrabold text-blue-700">
                {stats.totalDays}
              </div>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl p-3 sm:p-4 border border-green-100 bg-gradient-to-b from-green-50 to-white">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-green-100/60 blur-2xl" />
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="material-icons text-green-600 text-sm sm:text-base">
              check_circle
            </span>
            <div>
              <div className="text-xs uppercase tracking-wide text-green-700/80">
                {t("parentPortal.attendance.present")}
              </div>
              <div className="text-lg sm:text-2xl font-extrabold text-green-700">
                {stats.presentDays}
              </div>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl p-3 sm:p-4 border border-red-100 bg-gradient-to-b from-red-50 to-white">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-red-100/60 blur-2xl" />
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="material-icons text-red-600 text-sm sm:text-base">
              cancel
            </span>
            <div>
              <div className="text-xs uppercase tracking-wide text-red-700/80">
                {t("parentPortal.attendance.absent")}
              </div>
              <div className="text-lg sm:text-2xl font-extrabold text-red-700">
                {stats.absentDays}
              </div>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl p-3 sm:p-4 border border-purple-100 bg-gradient-to-b from-purple-50 to-white">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-purple-100/60 blur-2xl" />
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="material-icons text-purple-600 text-sm sm:text-base">
              insights
            </span>
            <div>
              <div className="text-xs uppercase tracking-wide text-purple-700/80">
                {t("parentPortal.tabs.attendance")}
              </div>
              <div className="text-lg sm:text-2xl font-extrabold text-purple-700">
                {stats.attendancePercentage}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Views */}
      {activeView === "list" && (
        <div className="space-y-3">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
            {t("parentPortal.attendance.recentRecords")}
          </h4>
          {records.length > 0 ? (
            <div className="space-y-1.5">
              {records.slice(0, 7).map((record: AttendanceRecord) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-md border border-gray-100 hover:shadow-sm hover:bg-white transition-all"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium border ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {getStatusIcon(record.status)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                      {record.subject && (
                        <div className="text-xs text-gray-500">
                          {record.subject}
                        </div>
                      )}
                      {/* Time information for mobile and tablet */}
                      <div className="flex flex-col sm:hidden mt-2">
                        {(record.inTime || record.outTime) && (
                          <div className="flex flex-col space-y-1 bg-gray-100 rounded-md p-2">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              Attendance Times:
                            </div>
                            {record.inTime && (
                              <div className="text-xs text-gray-600 flex items-center">
                                <span className="font-medium text-green-600 mr-2">
                                  🕐 In:
                                </span>
                                <span className="font-mono">
                                  {new Date(record.inTime).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </span>
                              </div>
                            )}
                            {record.outTime && (
                              <div className="text-xs text-gray-600 flex items-center">
                                <span className="font-medium text-red-600 mr-2">
                                  🕐 Out:
                                </span>
                                <span className="font-mono">
                                  {new Date(record.outTime).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Time information for desktop */}
                  <div className="hidden sm:block text-right">
                    {record.inTime && (
                      <div className="text-xs text-gray-600">
                        In:{" "}
                        {new Date(record.inTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                    {record.outTime && (
                      <div className="text-xs text-gray-600">
                        Out:{" "}
                        {new Date(record.outTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 sm:py-12 text-gray-500">
              <HiCalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {t("parentPortal.attendance.noRecords")}
              </p>
              <p className="text-sm">
                {t("parentPortal.attendance.noRecordsMessage")}
              </p>
            </div>
          )}
        </div>
      )}

      {activeView === "calendar" && (
        <div>
          {selectedMonth === "all" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <HiCalendarDays className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-700 font-medium">
                  {t("parentPortal.attendance.calendarBanner", {
                    year: selectedYear,
                  })}
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-2">
            {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((d) => (
              <div key={d} className="px-2 py-1 text-center">
                {t(`parentPortal.attendance.days.${d}`)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {daysInMonth.map((d, idx) => {
              if (!d) return <div key={`b-${idx}`} className="h-12 sm:h-16" />;
              const key = dateKey(d);
              const rec = recordByDate[key];
              const status = rec?.status || "";
              const color =
                status === "PRESENT"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : status === "ABSENT"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : status === "LATE"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                  : status === "EXCUSED"
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-white text-gray-700 border-gray-200";
              return (
                <div
                  key={key}
                  className={`h-12 sm:h-16 rounded-lg border ${color} relative p-1 sm:p-2 cursor-pointer hover:shadow-md transition-all duration-200 ${
                    rec ? "hover:scale-105" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleDateClick(d)}
                >
                  <div className="text-xs font-semibold">{d.getDate()}</div>
                  {rec && (
                    <div className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] sm:text-[10px] opacity-80 truncate">
                      {status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
              <span>{t("parentPortal.attendance.present")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
              <span>{t("parentPortal.attendance.absent")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></span>
              <span>{t("parentPortal.attendance.late")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500"></span>
              <span>{t("parentPortal.attendance.stats.excused")}</span>
            </div>
          </div>
        </div>
      )}

      {activeView === "summary" && (
        <div className="space-y-4">
          {/* Overall Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl border border-gray-200">
              <h5 className="font-semibold mb-2 text-sm sm:text-base">
                {selectedMonth === "all"
                  ? t("parentPortal.attendance.allYear")
                  : t("parentPortal.attendance.thisMonth")}
              </h5>
              <p className="text-xs sm:text-sm text-gray-600">
                {t("parentPortal.attendance.present")}: {stats.presentDays}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                {t("parentPortal.attendance.absent")}: {stats.absentDays}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                {t("parentPortal.attendance.late")}: {stats.lateDays}
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl border border-gray-200">
              <h5 className="font-semibold mb-2 text-sm sm:text-base">
                {t("parentPortal.attendance.score")}
              </h5>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">
                {stats.attendancePercentage}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("parentPortal.attendance.calculatedAs")}
              </p>
            </div>
          </div>

          {/* Monthly Breakdown - Only show when "All Months" is selected */}
          {selectedMonth === "all" && records.length > 0 && (
            <div className="p-4 rounded-xl border border-gray-200">
              <h5 className="font-semibold mb-3 text-sm sm:text-base">
                Monthly Breakdown
              </h5>
              <div className="space-y-2">
                {(() => {
                  // Group records by month
                  const monthlyData: Record<
                    string,
                    {
                      present: number;
                      absent: number;
                      late: number;
                      excused: number;
                      total: number;
                    }
                  > = {};

                  records.forEach((record) => {
                    const date = new Date(record.date);
                    const monthKey = `${date.getFullYear()}-${String(
                      date.getMonth() + 1
                    ).padStart(2, "0")}`;
                    const monthName = date.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    });

                    if (!monthlyData[monthKey]) {
                      monthlyData[monthKey] = {
                        present: 0,
                        absent: 0,
                        late: 0,
                        excused: 0,
                        total: 0,
                      };
                    }

                    monthlyData[monthKey].total++;
                    switch (record.status) {
                      case "PRESENT":
                        monthlyData[monthKey].present++;
                        break;
                      case "ABSENT":
                        monthlyData[monthKey].absent++;
                        break;
                      case "LATE":
                        monthlyData[monthKey].late++;
                        break;
                      case "EXCUSED":
                        monthlyData[monthKey].excused++;
                        break;
                    }
                  });

                  return Object.entries(monthlyData)
                    .sort(([a], [b]) => b.localeCompare(a)) // Sort by date descending
                    .map(([monthKey, data]) => {
                      const [year, month] = monthKey.split("-");
                      const monthName = new Date(
                        parseInt(year),
                        parseInt(month) - 1
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      });
                      const percentage =
                        data.total > 0
                          ? Math.round((data.present / data.total) * 100)
                          : 0;

                      return (
                        <div
                          key={monthKey}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {monthName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {data.present} present, {data.absent} absent,{" "}
                              {data.late} late, {data.excused} excused
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-purple-700">
                              {percentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {data.total} days
                            </div>
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Detail Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("parentPortal.attendance.details")}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Date Display */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">Date</div>
                <div className="text-lg font-medium text-gray-900">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              {/* Attendance Record */}
              {(() => {
                const attendance = getAttendanceForDate(selectedDate);
                // console.log('🎯 Modal Debug - Date:', selectedDate?.toISOString().split('T')[0]);
                // console.log('🎯 Modal Debug - Found:', attendance);
                if (!attendance) {
                  return (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HiCalendarDays className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">
                        No attendance record for this date
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Status */}
                    <div
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        attendance.status === "ABSENT"
                          ? "bg-red-50 border border-red-200"
                          : attendance.status === "PRESENT"
                          ? "bg-green-50 border border-green-200"
                          : attendance.status === "LATE"
                          ? "bg-yellow-50 border border-yellow-200"
                          : attendance.status === "EXCUSED"
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(
                            attendance.status
                          )}`}
                        >
                          {getStatusIcon(attendance.status)}
                        </div>
                        <div>
                          <div
                            className={`font-semibold text-lg capitalize ${
                              attendance.status === "ABSENT"
                                ? "text-red-700"
                                : attendance.status === "PRESENT"
                                ? "text-green-700"
                                : attendance.status === "LATE"
                                ? "text-yellow-700"
                                : attendance.status === "EXCUSED"
                                ? "text-blue-700"
                                : "text-gray-900"
                            }`}
                          >
                            {attendance.status === "ABSENT"
                              ? t("parentPortal.attendance.absent")
                              : attendance.status === "PRESENT"
                              ? t("parentPortal.attendance.present")
                              : attendance.status === "LATE"
                              ? t("parentPortal.attendance.late")
                              : attendance.status === "EXCUSED"
                              ? t("parentPortal.attendance.stats.excused")
                              : attendance.status}
                          </div>
                          {attendance.subject && (
                            <div className="text-sm text-gray-500">
                              {attendance.subject}
                            </div>
                          )}
                          {attendance.status === "ABSENT" && (
                            <div className="text-sm text-red-600 font-medium mt-1">
                              {t("parentPortal.attendance.wasAbsent")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time Information */}
                    {(attendance.inTime || attendance.outTime) && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700">
                          {t("parentPortal.attendance.times")}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {attendance.inTime && (
                            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <HiClock className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <div className="text-xs text-green-600 font-medium">
                                  {t("parentPortal.attendance.timeIn")}
                                </div>
                                <div className="text-sm font-mono text-gray-900">
                                  {new Date(
                                    attendance.inTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                          {attendance.outTime && (
                            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <HiClock className="w-4 h-4 text-red-600" />
                              </div>
                              <div>
                                <div className="text-xs text-red-600 font-medium">
                                  {t("parentPortal.attendance.timeOut")}
                                </div>
                                <div className="text-sm font-mono text-gray-900">
                                  {new Date(
                                    attendance.outTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Absent Day Information */}
                    {attendance.status === "ABSENT" &&
                      !attendance.inTime &&
                      !attendance.outTime && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-gray-700">
                            {t("parentPortal.attendance.details")}
                          </div>
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <HiXCircle className="w-4 h-4 text-red-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-red-700">
                                  {t("parentPortal.attendance.noRecord")}
                                </div>
                                <div className="text-xs text-red-600">
                                  {t("parentPortal.attendance.markedAbsent")}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Remarks */}
                    {attendance.remarks && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Remarks
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            {attendance.remarks}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t("parentPortal.attendance.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
