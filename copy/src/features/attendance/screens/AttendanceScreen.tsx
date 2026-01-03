import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import secureApiService from "../../../services/secureApiService";
import {
  shamsiMonthRangeToGregorian,
  gregorianToSolarHijri,
  getDaysInShamsiMonth,
  getShamsiMonthName,
} from "../../../utils/shamsi";
import { useTranslation } from "react-i18next";
import { TodayAttendanceSummary } from "../components/TodayAttendanceSummary";
import {
  AttendanceFilters,
  AttendanceStatus,
  Class,
  Student,
  AttendanceRecord,
} from "../types/attendance";
import {
  useClasses,
  useStudents,
  useAttendanceRecordsPaginated,
  useAttendanceSummary,
  useAttendanceStats,
  useClassAttendanceSummary,
  useMarkInTime,
  useMarkOutTime,
  useMonthlyAttendanceMatrix,
  useCreateAttendanceRecord,
  getDateRangeFromFilter,
} from "../services/attendanceService";
import api from "../services/attendanceService";
import AttendanceList from "../components/AttendanceList";
import EnhancedAttendanceList from "../components/EnhancedAttendanceList";
import AttendanceFiltersComponent from "../components/AttendanceFilters";
import AttendanceStatsComponent from "../components/AttendanceStats";
import {
  FaPlus,
  FaRedo,
  FaCalendarAlt,
  FaChartBar,
  FaList,
  FaTable,
  FaCalendarWeek,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaFilePdf,
  FaSignInAlt,
  FaSignOutAlt,
  FaCheckCircle,
  FaUserTimes,
  FaExclamationCircle,
  FaUserClock,
  FaSms,
  FaUpload,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import { markIncompleteAttendanceAsAbsent } from "../services/attendanceService";
import StudentAttendanceCard from "../components/StudentAttendanceCard";
import LeaveModal from "../components/LeaveModal";
import SMSMonitoringScreen from "./SMSMonitoringScreen";
import BulkAttendanceUpload from "../components/BulkAttendanceUpload";
// import { FaPlus, FaRedo, FaCalendarAlt, FaChartBar, FaList, FaTable, FaCalendarWeek, FaChevronLeft, FaChevronRight, FaFilePdf, FaSignInAlt, FaSignOutAlt, FaCheckCircle } from 'react-icons/fa';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ExcelJS from "exceljs";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const AttendanceScreen: React.FC = () => {
  // Hooks must be called before any conditional returns
  const { t, i18n } = useTranslation();

  // Helper function to get student name based on selected language
  const getStudentName = (student: any): string => {
    // Check if current language is Dari (fa-AF) or Pashto (ps-AF)
    const isDariOrPashto = i18n.language === "fa-AF" || i18n.language === "ps-AF";
    
    // If Dari or Pashto and dariName exists, use it; otherwise use fullName or firstName+lastName
    if (isDariOrPashto && student.user?.dariName) {
      return student.user.dariName.trim();
    }
    
    // Fallback to fullName or firstName + lastName
    return student.fullName || 
      `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
      `${student.user?.firstName || ""} ${student.user?.lastName || ""}`.trim() ||
      "Unknown Student";
  };

  const { managedContext } = useAuth();
  // State
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "monthly" | "list" | "table" | "sms" | "bulk"
  >("overview");
  const [filters, setFilters] = useState<AttendanceFilters>({
    dateRange: "week",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    classId: "",
    studentId: "",
    academicSessionId: undefined,
    status: undefined,
    searchQuery: "",
    schoolId: "",
    branchId: "",
    courseId: "",
    teacherId: "",
  });

  // Sync filters with managed context so branch/school/course changes refetch data
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      schoolId: managedContext?.schoolId || '',
      branchId: managedContext?.branchId || '',
      courseId: managedContext?.courseId || '',
    }));
  }, [managedContext?.schoolId, managedContext?.branchId, managedContext?.courseId]);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [calendarType, setCalendarType] = useState<"miladi" | "hijri">("hijri");
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [markingAbsent, setMarkingAbsent] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [modalStudentLimit, setModalStudentLimit] = useState(50);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [expandedClassGroups, setExpandedClassGroups] = useState<Set<string>>(
    new Set()
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [displayedSearchResults, setDisplayedSearchResults] = useState<
    Student[]
  >([]);
  const [loadingAttendanceFor, setLoadingAttendanceFor] = useState<Set<string>>(
    new Set()
  );
  const [cachedAttendanceData, setCachedAttendanceData] = useState<any>({});

  // Helper function to get current Hijri Shamsi month from Gregorian date (same logic as HistoricalDataViewer)
  const getCurrentHijriMonth = (date: Date): number => {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // Map Gregorian dates to Hijri months (same logic as HistoricalDataViewer)
    if (month === 3 && day >= 21) return 1; // Hamal
    else if (month === 4 && day <= 20) return 1;
    else if (month === 4 && day >= 21) return 2; // Saur
    else if (month === 5 && day <= 21) return 2;
    else if (month === 5 && day >= 22) return 3; // Jawza
    else if (month === 6 && day <= 21) return 3;
    else if (month === 6 && day >= 22) return 4; // Saratan
    else if (month === 7 && day <= 22) return 4;
    else if (month === 7 && day >= 23) return 5; // Asad
    else if (month === 8 && day <= 22) return 5;
    else if (month === 8 && day >= 23) return 6; // Sunbula
    else if (month === 9 && day <= 22) return 6;
    else if (month === 9 && day >= 23) return 7; // Mizan
    else if (month === 10 && day <= 22) return 7;
    else if (month === 10 && day >= 23) return 8; // Aqrab
    else if (month === 11 && day <= 21) return 8;
    else if (month === 11 && day >= 22) return 9; // Qaws
    else if (month === 12 && day <= 21) return 9;
    else if (month === 12 && day >= 22) return 10; // Jadi
    else if (month === 1 && day <= 20) return 10;
    else if (month === 1 && day >= 21) return 11; // Dalw
    else if (month === 2 && day <= 19) return 11;
    else if (month === 2 && day >= 20) return 12; // Hoot
    else if (month === 3 && day <= 20) return 12;
    return 1; // Default to Hamal
  };

  const [selectedHijriMonth, setSelectedHijriMonth] = useState<number>(() => {
    // Calculate current Hijri Shamsi month using the same logic as HistoricalDataViewer
    const now = new Date();
    return getCurrentHijriMonth(now);
  });
  const [selectedHijriYear, setSelectedHijriYear] = useState<number>(() => {
    // Calculate current Hijri Shamsi year using the same simple approach as HistoricalDataViewer
    const today = new Date();
    return today.getFullYear() - 621; // 2025 - 621 = 1404
  });

  // Check if a Hijri month is in the future
  const isHijriMonthInFuture = (
    hijriMonth: number,
    hijriYear: number
  ): boolean => {
    try {
      const { endISO } = shamsiMonthRangeToGregorian(hijriYear, hijriMonth);
      const endDate = new Date(endISO);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return endDate > now;
    } catch {
      return false;
    }
  };

  // Get the last completed Hijri month
  const getLastCompletedHijriMonth = (): { month: number; year: number } => {
    const now = new Date();
    const currentGregorianYear = now.getFullYear();
    const currentGregorianMonth = now.getMonth();
    const currentGregorianDay = now.getDate();

    // Calculate current Hijri year
    let hijriYear = currentGregorianYear - 621;
    if (
      currentGregorianMonth < 2 ||
      (currentGregorianMonth === 2 && currentGregorianDay < 21)
    ) {
      hijriYear = hijriYear - 1;
    }

    // Determine which Hijri month we're currently in based on Gregorian date
    let currentHijriMonth = 1; // Default to Hamal

    // Map Gregorian dates to Hijri months
    if (currentGregorianMonth >= 2) {
      // March onwards
      if (currentGregorianMonth === 2 && currentGregorianDay >= 21)
        currentHijriMonth = 1; // Hamal (Mar 21+)
      else if (currentGregorianMonth === 3 && currentGregorianDay >= 21)
        currentHijriMonth = 2; // Saur (Apr 21+)
      else if (currentGregorianMonth === 4 && currentGregorianDay >= 21)
        currentHijriMonth = 3; // Jawza (May 21+)
      else if (currentGregorianMonth === 5 && currentGregorianDay >= 21)
        currentHijriMonth = 4; // Saratan (Jun 21+)
      else if (currentGregorianMonth === 6 && currentGregorianDay >= 22)
        currentHijriMonth = 5; // Asad (Jul 22+)
      else if (currentGregorianMonth === 7 && currentGregorianDay >= 22)
        currentHijriMonth = 6; // Sonbola (Aug 22+)
      else if (currentGregorianMonth === 8 && currentGregorianDay >= 23)
        currentHijriMonth = 7; // Mizan (Sep 23+)
      else if (currentGregorianMonth === 9 && currentGregorianDay >= 23)
        currentHijriMonth = 8; // Aqrab (Oct 23+)
      else if (currentGregorianMonth === 10 && currentGregorianDay >= 22)
        currentHijriMonth = 9; // Qaws (Nov 22+)
      else if (currentGregorianMonth === 11 && currentGregorianDay >= 22)
        currentHijriMonth = 10; // Jadi (Dec 22+)
      else {
        // Before the start of the month, we're in the previous month
        if (currentGregorianMonth === 3 && currentGregorianDay < 21)
          currentHijriMonth = 1; // Still in Hamal
        else if (currentGregorianMonth === 4 && currentGregorianDay < 21)
          currentHijriMonth = 2; // Still in Saur
        else if (currentGregorianMonth === 5 && currentGregorianDay < 21)
          currentHijriMonth = 3; // Still in Jawza
        else if (currentGregorianMonth === 6 && currentGregorianDay < 22)
          currentHijriMonth = 4; // Still in Saratan
        else if (currentGregorianMonth === 7 && currentGregorianDay < 22)
          currentHijriMonth = 5; // Still in Asad
        else if (currentGregorianMonth === 8 && currentGregorianDay < 23)
          currentHijriMonth = 6; // Still in Sonbola
        else if (currentGregorianMonth === 9 && currentGregorianDay < 23)
          currentHijriMonth = 7; // Still in Mizan
        else if (currentGregorianMonth === 10 && currentGregorianDay < 22)
          currentHijriMonth = 8; // Still in Aqrab
        else if (currentGregorianMonth === 11 && currentGregorianDay < 22)
          currentHijriMonth = 9; // Still in Qaws
      }
    } else {
      // January or February - these are months 11 (Dalwa) and 12 (Hoot) of the current Hijri year
      if (currentGregorianMonth === 0 && currentGregorianDay >= 21)
        currentHijriMonth = 11; // Dalwa (Jan 21+)
      else if (currentGregorianMonth === 1 && currentGregorianDay >= 20)
        currentHijriMonth = 12; // Hoot (Feb 20+)
      else if (currentGregorianMonth === 1 && currentGregorianDay < 20)
        currentHijriMonth = 11; // Still in Dalwa
      else if (currentGregorianMonth === 0 && currentGregorianDay < 21) {
        // Early January - still in previous month (Jadi)
        currentHijriMonth = 10; // Jadi
      }
    }

    // Return the previous month (last completed month)
    // If we're on the 1st day of a month, we might still be in the previous month
    if (currentHijriMonth === 1) {
      return { month: 12, year: hijriYear - 1 }; // Last month of previous year
    } else {
      return { month: currentHijriMonth - 1, year: hijriYear };
    }
  };

  // API Hooks
  const {
    data: classes = [],
    isLoading: classesLoading,
    error: classesError,
  } = useClasses();
  const {
    data: students = [],
    isLoading: studentsLoading,
    error: studentsError,
  } = useStudents({
    classId: filters.classId,
    limit: 50,
  });

  // Fetch full student list for the selected class when modal opens
  const { data: allStudents = [], isLoading: allStudentsLoading } = useStudents(
    {
      classId: filters.classId,
      limit: modalStudentLimit,
      searchQuery: modalSearchQuery || undefined,
    }
  );

  // Fetch students from ALL classes when searching globally
  const { data: searchResults = [] } = useStudents(
    searchQuery.trim().length > 0
      ? {
          classId: "", // Empty for global search
          searchQuery: searchQuery,
          limit: 1000,
        }
      : undefined // Don't fetch if no search query
  );

  // Fetch all students for Hijri monthly matrix (no limit)
  const { data: allStudentsForHijri = [] } = useStudents({
    classId: filters.classId || "",
    limit: 1000, // Large limit to get all students
  });

  // Get current date once
  const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  // Progressive search results loading - load attendance data one by one
  useEffect(() => {
    if (searchQuery && searchResults.length > 0) {
      // Reset displayed results when search query changes
      setDisplayedSearchResults([]);
      setCachedAttendanceData({});
      setLoadingAttendanceFor(new Set());

      // Start showing results progressively
      const uniqueClassIds = [
        ...new Set(searchResults.map((s: any) => s.classId)),
      ];
      const attendancePromises: { [key: string]: Promise<any> } = {};

      // Pre-fetch all class attendance summaries
      const fetchAllClassAttendance = async () => {
        for (const classId of uniqueClassIds) {
          if (!attendancePromises[classId]) {
            attendancePromises[classId] = api
              .getClassAttendanceSummary(classId, currentDate)
              .catch((error) => {
                console.error(
                  `Error fetching attendance for class ${classId}:`,
                  error
                );
                return null;
              });
          }
        }
      };

      fetchAllClassAttendance();

      // Display results one by one
      let displayIndex = 0;
      const displayNextResult = async () => {
        if (displayIndex < searchResults.length) {
          const student = searchResults[displayIndex];

          try {
            // Wait for this student's class attendance to be fetched
            const classAttendance = await attendancePromises[
              student.classId || ""
            ];
            if (classAttendance) {
              setCachedAttendanceData((prev: any) => ({
                ...prev,
                [student.classId || ""]: classAttendance,
              }));
            }
          } catch (error) {
            console.error("Error loading attendance:", error);
          }

          setDisplayedSearchResults((prev) => [...prev, student]);
          displayIndex++;

          // Display next result with a small delay for visual feedback
          setTimeout(displayNextResult, 100);
        }
      };

      displayNextResult();
    } else {
      setDisplayedSearchResults([]);
      setCachedAttendanceData({});
      setLoadingAttendanceFor(new Set());
    }
  }, [searchQuery, searchResults.length, currentDate]); // Use length instead of object

  // When opening modal, reset pagination
  useEffect(() => {
    if (isLeaveModalOpen) {
      setModalStudentLimit(50);
    }
  }, [isLeaveModalOpen]);

  // Get attendance summary for the selected class and current date
  const {
    data: attendanceSummary,
    isLoading: attendanceSummaryLoading,
    error: attendanceSummaryError,
  } = useClassAttendanceSummary(filters.classId, currentDate);

  // Get attendance data for searched students
  const searchedStudentClassIds = useMemo(
    () => [...new Set(searchResults.map((s: any) => s.classId))],
    [searchResults]
  );

  const searchedStudentsAttendance = useMemo(() => {
    return searchResults.reduce((acc: any, student: any) => {
      acc[student.id] = {
        studentId: student.id,
        studentName:
          student.fullName ||
          `${student.firstName || ""} ${student.lastName || ""}`.trim(),
        studentRollNo: student.rollNo || "N/A",
        status: undefined,
        inTime: null,
        outTime: null,
      };
      return acc;
    }, {});
  }, [searchResults]);

  // Mark in/out time mutations
  const markInTimeMutation = useMarkInTime();
  const markOutTimeMutation = useMarkOutTime();
  const createAttendanceMutation = useCreateAttendanceRecord();

  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch: refetchAttendance,
  } = useAttendanceRecordsPaginated({
    ...filters,
    page: currentPage,
    limit: 20,
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useAttendanceSummary({
    ...filters,
    startDate: currentDate,
    endDate: currentDate,
  });

  // Fetch today's records for the summary widget
  const todayStr = new Date().toISOString().split("T")[0];
  const {
    data: todayAttendanceData,
    isLoading: todayAttendanceLoading,
    error: todayAttendanceError,
  } = useAttendanceRecordsPaginated({
    startDate: todayStr,
    endDate: todayStr,
    classId: "",
    studentId: "",
    academicSessionId: undefined,
    status: undefined,
    searchQuery: "",
    schoolId: "",
    teacherId: "",
    page: 1,
    limit: 1000, // Get all records for today
  });

  // Debug: Log query state
  if (todayAttendanceError) {
    console.error("Error fetching today's attendance:", todayAttendanceError);
  }

  if (todayAttendanceData) {
    ({
      recordCount: todayAttendanceData.records?.length || 0,
      total: todayAttendanceData.total,
      date: todayStr,
    });
  }

  const [showAllStudents, setShowAllStudents] = useState(false);
  // Calculate date range for selected Hijri Shamsi month using proper conversion
  // Same logic as HistoricalDataViewer - directly convert without future checks
  const getHijriMonthDateRange = (hijriMonth: number, hijriYear: number) => {
    try {
      // Directly convert Hijri month/year to Gregorian date range
      // Same approach as HistoricalDataViewer - no future month checks
      const { startISO, endISO } = shamsiMonthRangeToGregorian(
        hijriYear,
        hijriMonth
      );
      return {
        startDate: startISO,
        endDate: endISO,
      };
    } catch (error) {
      console.error("Error converting Hijri Shamsi date:", error);
      return { startDate: "", endDate: "" };
    }
  };

  // Hijri Shamsi months - using translation keys
  const hijriMonths = [
    { id: 1, key: "hamal" },
    { id: 2, key: "saur" },
    { id: 3, key: "jawza" },
    { id: 4, key: "saratan" },
    { id: 5, key: "asad" },
    { id: 6, key: "sunbula" },
    { id: 7, key: "mizan" },
    { id: 8, key: "aqrab" },
    { id: 9, key: "qaws" },
    { id: 10, key: "jadi" },
    { id: 11, key: "dalw" },
    { id: 12, key: "hoot" },
  ];

  // Helper function to convert Hijri Shamsi date string to Gregorian
  const convertHijriDateToGregorian = (hijriDateStr: string): string => {
    const parts = hijriDateStr.split("-");
    if (parts.length !== 3) return hijriDateStr;

    const hijriYear = parseInt(parts[0]);
    const hijriMonth = parseInt(parts[1]);
    const hijriDay = parseInt(parts[2]);

    // Use month range conversion to get approximate Gregorian date
    const { startISO } = shamsiMonthRangeToGregorian(hijriYear, hijriMonth);
    const startDate = new Date(startISO);
    // Add the day offset (approximate)
    startDate.setDate(startDate.getDate() + hijriDay - 1);
    return startDate.toISOString().split("T")[0];
  };

  // Helper function to calculate date range in Hijri Shamsi calendar
  const getHijriDateRange = (
    dateRange: string
  ): { startDate: string; endDate: string } => {
    const now = new Date();
    // Use current Gregorian date to get current Hijri date
    const todaySolar = gregorianToSolarHijri(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );

    switch (dateRange) {
      case "today": {
        const todayGreg = new Date();
        return {
          startDate: todayGreg.toISOString().split("T")[0],
          endDate: todayGreg.toISOString().split("T")[0],
        };
      }
      case "yesterday": {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: yesterday.toISOString().split("T")[0],
          endDate: yesterday.toISOString().split("T")[0],
        };
      }
      case "week": {
        // For week, calculate 7 days ago from TODAY in Gregorian (always use current year)
        // This ensures we get 2025 dates, not 2024
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        today.setHours(23, 59, 59, 999);

        return {
          startDate: sevenDaysAgo.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      }
      case "month": {
        // Last month in Hijri Shamsi
        const lastMonth = todaySolar.month === 1 ? 12 : todaySolar.month - 1;
        const lastMonthYear =
          todaySolar.month === 1 ? todaySolar.year - 1 : todaySolar.year;
        const { startISO, endISO } = shamsiMonthRangeToGregorian(
          lastMonthYear,
          lastMonth
        );
        return { startDate: startISO, endDate: endISO };
      }
      case "quarter": {
        // Last 3 months in Hijri Shamsi
        let startMonth = todaySolar.month - 3;
        let startYear = todaySolar.year;
        if (startMonth <= 0) {
          startMonth += 12;
          startYear -= 1;
        }
        const { startISO } = shamsiMonthRangeToGregorian(startYear, startMonth);
        const { endISO } = shamsiMonthRangeToGregorian(
          todaySolar.year,
          todaySolar.month
        );
        return { startDate: startISO, endDate: endISO };
      }
      case "year": {
        // Last year in Hijri Shamsi
        const { startISO } = shamsiMonthRangeToGregorian(
          todaySolar.year - 1,
          1
        );
        const { endISO } = shamsiMonthRangeToGregorian(todaySolar.year - 1, 12);
        return { startDate: startISO, endDate: endISO };
      }
      default: {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          startDate: weekAgo.toISOString().split("T")[0],
          endDate: now.toISOString().split("T")[0],
        };
      }
    }
  };

  // Stats filters - convert dates based on calendar type and dateRange
  const statsFilters = useMemo(() => {
    // If dateRange is 'custom', check and convert Hijri dates if needed
    if (
      filters.dateRange === "custom" &&
      filters.startDate &&
      filters.endDate
    ) {
      let startDate = filters.startDate;
      let endDate = filters.endDate;

      // Check if dates are in Hijri format (years like 1051, 1403, etc. are Hijri)
      const startDateYear = parseInt(startDate.split("-")[0]);
      const endDateYear = parseInt(endDate.split("-")[0]);

      if (startDateYear < 1900 || endDateYear < 1900) {
        // This is a Hijri Shamsi date, convert to Gregorian
        if (startDateYear < 1900) {
          startDate = convertHijriDateToGregorian(startDate);
        }
        if (endDateYear < 1900) {
          endDate = convertHijriDateToGregorian(endDate);
        }

        // Verify dates are in valid range (after 1900)
        const finalStartYear = parseInt(startDate.split("-")[0]);
        const finalEndYear = parseInt(endDate.split("-")[0]);
        if (finalStartYear < 1900 || finalEndYear < 1900) {
          // Still invalid, use default week range based on calendar type
          const dateRange =
            calendarType === "hijri"
              ? getHijriDateRange("week")
              : getDateRangeFromFilter("week");
          return {
            ...filters,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            dateRange: "week",
          };
        }
      }

      return {
        ...filters,
        startDate,
        endDate,
      };
    }

    // For non-custom date ranges, always calculate fresh dates based on calendar type
    // This ensures we always use current dates (2025), not old dates from filters

    if (calendarType === "hijri") {
      // Use Hijri Shamsi calendar for date range calculation
      if (activeTab === "monthly") {
        // Use current Hijri Shamsi month/year for monthly view
        const dateRange = getHijriMonthDateRange(
          selectedHijriMonth,
          selectedHijriYear
        );
        return {
          ...filters,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          dateRange: filters.dateRange || "week",
        };
      } else if (activeTab === "analytics") {
        // For analytics tab, if a Hijri month is selected, use that month's date range
        if (selectedHijriMonth !== null) {
          const hijriMonth = selectedHijriMonth;
          const hijriYear = selectedHijriYear;
          const dateRange = getHijriMonthDateRange(hijriMonth, hijriYear);
          return {
            ...filters,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            dateRange: filters.dateRange || "week",
          };
        } else {
          // If no specific month selected in analytics, calculate based on Hijri calendar
          // Always calculate fresh dates from current time, ignore old filter dates
          const hijriDateRange = getHijriDateRange(filters.dateRange || "week");
          return {
            ...filters,
            startDate: hijriDateRange.startDate,
            endDate: hijriDateRange.endDate,
            dateRange: filters.dateRange || "week",
          };
        }
      } else {
        // For other tabs (overview, etc.), calculate based on Hijri calendar
        // Always calculate fresh dates from current time, ignore old filter dates
        const hijriDateRange = getHijriDateRange(filters.dateRange || "week");
        return {
          ...filters,
          startDate: hijriDateRange.startDate,
          endDate: hijriDateRange.endDate,
          dateRange: filters.dateRange || "week",
        };
      }
    }

    // For Miladi calendar in analytics tab, if a Hijri month is selected, still use Hijri month date range
    if (
      activeTab === "analytics" &&
      selectedHijriMonth !== null &&
      calendarType === "miladi"
    ) {
      const hijriMonth = selectedHijriMonth;
      const hijriYear = selectedHijriYear;
      const dateRange = getHijriMonthDateRange(hijriMonth, hijriYear);
      return {
        ...filters,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dateRange: filters.dateRange || "week",
      };
    }

    // For Miladi calendar, use standard date range calculation
    // Always calculate fresh dates from current time, ignore old filter dates
    const dateRange = getDateRangeFromFilter(filters.dateRange || "week");
    return {
      ...filters,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dateRange: filters.dateRange || "week",
    };
  }, [filters, calendarType, activeTab, selectedHijriMonth, selectedHijriYear]);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useAttendanceStats(statsFilters);

  // Filter stats data for Hijri Shamsi month when in analytics tab
  const filteredStats = useMemo(() => {
    if (!stats || activeTab !== "analytics" || selectedHijriMonth === null) {
      return stats;
    }

    // Get date range for selected Hijri month
    const { startISO, endISO } = shamsiMonthRangeToGregorian(
      selectedHijriYear,
      selectedHijriMonth
    );
    const startDate = new Date(startISO);
    const endDate = new Date(endISO);

    // Filter dailyTrends to only include dates within the Hijri month range
    const filteredDailyTrends = (stats.dailyTrends || []).filter(
      (trend: any) => {
        const trendDate = new Date(trend.date);
        return trendDate >= startDate && trendDate <= endDate;
      }
    );

    // Filter weeklyPatterns to only include weeks that overlap with the Hijri month range
    const filteredWeeklyPatterns = (stats.weeklyPatterns || []).filter(
      (pattern: any) => {
        const weekStart = new Date(pattern.week);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // Week is 7 days
        // Check if week overlaps with Hijri month range
        return weekStart <= endDate && weekEnd >= startDate;
      }
    );

    // Filter monthlyTrends to only include the selected Hijri month
    const filteredMonthlyTrends = (stats.monthlyTrends || []).filter(
      (trend: any) => {
        const trendMonth = trend.month; // Format: "YYYY-MM"
        const trendDate = new Date(trendMonth + "-01");
        // Check if the trend month overlaps with the Hijri month range
        return (
          trendDate <= endDate &&
          new Date(trendDate.getFullYear(), trendDate.getMonth() + 1, 0) >=
            startDate
        );
      }
    );

    // Student stats are already filtered by the date range in the API call, so we can keep them as is
    // But we can also filter them if needed based on their attendance dates

    return {
      ...stats,
      dailyTrends: filteredDailyTrends,
      weeklyPatterns: filteredWeeklyPatterns,
      monthlyTrends: filteredMonthlyTrends,
      // Recalculate totals based on filtered data
      totalDays: filteredDailyTrends.length,
      totalPresent: filteredDailyTrends.reduce(
        (sum: number, trend: any) => sum + (trend.present || 0),
        0
      ),
      totalAbsent: filteredDailyTrends.reduce(
        (sum: number, trend: any) => sum + (trend.absent || 0),
        0
      ),
      totalLate: filteredDailyTrends.reduce(
        (sum: number, trend: any) => sum + (trend.late || 0),
        0
      ),
      totalExcused: filteredDailyTrends.reduce(
        (sum: number, trend: any) => sum + (trend.excused || 0),
        0
      ),
    };
  }, [stats, activeTab, selectedHijriMonth, selectedHijriYear]);

  // Calculate Gregorian month/year for API calls (convert from Hijri if needed)
  // For Hijri months that span two Gregorian months, we use the start month
  // The filtering logic will ensure only dates within the Hijri month range are displayed
  const { apiMonth, apiYear } = useMemo(() => {
    if (calendarType === "miladi") {
      return { apiMonth: selectedMonth, apiYear: selectedYear };
    } else {
      // Convert Hijri Shamsi month to Gregorian date range
      // Use the start month for the API call
      const { startISO } = shamsiMonthRangeToGregorian(
        selectedHijriYear,
        selectedHijriMonth
      );
      const startDate = new Date(startISO);
      return {
        apiMonth: startDate.getMonth() + 1,
        apiYear: startDate.getFullYear(),
      };
    }
  }, [
    calendarType,
    selectedMonth,
    selectedYear,
    selectedHijriMonth,
    selectedHijriYear,
  ]);

  // Calculate date range for Hijri Shamsi month when in Hijri mode
  const hijriMonthDateRange = useMemo(() => {
    if (calendarType === "hijri" && activeTab === "monthly") {
      return getHijriMonthDateRange(selectedHijriMonth, selectedHijriYear);
    }
    return null;
  }, [calendarType, activeTab, selectedHijriMonth, selectedHijriYear]);

  // Fetch attendance records by date range for Hijri Shamsi months
  const {
    data: hijriAttendanceRecords,
    isLoading: hijriAttendanceLoading,
    error: hijriAttendanceError,
  } = useQuery({
    queryKey: [
      "hijri-attendance",
      filters.classId,
      hijriMonthDateRange?.startDate,
      hijriMonthDateRange?.endDate,
    ],
    queryFn: async () => {
      if (!filters.classId || !hijriMonthDateRange) return null;
      const response = await secureApiService.get("/attendances", {
        params: {
          classId: filters.classId,
          startDate: hijriMonthDateRange.startDate,
          endDate: hijriMonthDateRange.endDate,
          limit: 5000,
        },
      });
      const data =
        (response.data as any)?.data?.attendances ||
        (response.data as any)?.attendances ||
        (response.data as any)?.data ||
        response.data ||
        [];
      return Array.isArray(data) ? data : [];
    },
    enabled:
      calendarType === "hijri" &&
      activeTab === "monthly" &&
      !!filters.classId &&
      !!hijriMonthDateRange,
  });

  // Transform Hijri attendance records to finalMonthlyMatrix format
  const transformedHijriMatrix = useMemo(() => {
    if (
      calendarType !== "hijri" ||
      !hijriAttendanceRecords ||
      !hijriMonthDateRange
    ) {
      return null;
    }

    // Generate all dates in the Hijri month range
    const startDate = new Date(hijriMonthDateRange.startDate);
    const endDate = new Date(hijriMonthDateRange.endDate);
    const allDates: string[] = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      allDates.push(new Date(d).toISOString().split("T")[0]);
    }

    // Get all students from the class (use allStudentsForHijri when in Hijri mode)
    const students =
      calendarType === "hijri" ? allStudentsForHijri || [] : allStudents || [];

    // Create attendance map: studentId -> date -> attendance record
    // Also create a map of student info from attendance records as fallback
    const attendanceMap: Record<string, Record<string, any>> = {};
    const studentInfoFromRecords: Record<
      string,
      { name?: string; rollNo?: string }
    > = {};

    (hijriAttendanceRecords || []).forEach((record: any) => {
      const studentId = record.student?.id || record.studentId;
      if (!studentId) return;

      // Store student info from attendance records as fallback
      if (record.student && !studentInfoFromRecords[studentId]) {
        const s = record.student;
        studentInfoFromRecords[studentId] = {
          name:
            s.fullName ||
            s.studentName ||
            `${s.firstName || ""} ${s.lastName || ""}`.trim() ||
            s.dariName,
          rollNo: s.rollNo,
        };
      }

      const dateStr = record.date
        ? new Date(record.date).toISOString().split("T")[0]
        : null;
      if (!dateStr || !allDates.includes(dateStr)) return; // Only include dates in the Hijri month range

      if (!attendanceMap[studentId]) {
        attendanceMap[studentId] = {};
      }
      attendanceMap[studentId][dateStr] = {
        status: record.status || "ABSENT",
        inTime: record.inTime,
        outTime: record.outTime,
      };
    });

    // Create student objects with dailyAttendance
    const matrixStudents = students.map((student: any) => {
      const studentId = student.id || student.studentId || student.student?.id;
      const dailyAttendance = attendanceMap[studentId] || {};

      // Check if current language is Dari (fa-AF) or Pashto (ps-AF)
      const isDariOrPashto = i18n.language === "fa-AF" || i18n.language === "ps-AF";

      // Extract studentName from various possible field structures
      // First priority: use dariName if available and language is Dari/Pashto
      let studentName = "";
      
      if (isDariOrPashto) {
        // Check all possible locations for dariName
        if (student.user?.dariName) {
          studentName = student.user.dariName.trim();
        } else if (student.dariName) {
          studentName = student.dariName.trim();
        } else if (student.student?.user?.dariName) {
          studentName = student.student.user.dariName.trim();
        }
      }
      
      // Fallback to existing studentName field
      if (!studentName && student.studentName) {
        studentName = student.studentName;
      }
      
      // Fallback to fullName
      if (!studentName && student.fullName) {
        studentName = student.fullName;
      }
      
      // Fallback to firstName/lastName combination
      if (!studentName && (student.firstName || student.lastName)) {
        studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
      }
      
      // Fallback to student object nested structure
      if (!studentName && student.student) {
        const s = student.student;
        studentName = s.fullName || 
          `${s.firstName || ""} ${s.lastName || ""}`.trim() ||
          s.name;
      }
      
      // Fallback to user object
      if (!studentName && student.user) {
        const u = student.user;
        studentName = u.fullName || 
          `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
          u.name;
      }
      
      // Fallback to info from attendance records
      if (!studentName && studentInfoFromRecords[studentId]?.name) {
        studentName = studentInfoFromRecords[studentId].name;
      }
      
      // Final fallback
      if (!studentName) {
        studentName = student.name || "Unknown Student";
      }

      // Extract rollNo similarly
      let rollNo = student.rollNo;
      if (!rollNo && student.student) {
        rollNo = student.student.rollNo;
      }
      if (!rollNo && student.user) {
        rollNo = student.user.rollNo;
      }
      // Fallback to info from attendance records
      if (!rollNo && studentInfoFromRecords[studentId]?.rollNo) {
        rollNo = studentInfoFromRecords[studentId].rollNo;
      }

      return {
        studentId: studentId,
        studentName: studentName || "Unknown Student",
        rollNo: rollNo || "N/A",
        dailyAttendance,
      };
    });

    return {
      classId: filters.classId || "",
      month: selectedHijriMonth,
      year: selectedHijriYear,
      students: matrixStudents,
      totalDays: allDates.length,
    };
  }, [
    calendarType,
    hijriAttendanceRecords,
    hijriMonthDateRange,
    allStudentsForHijri,
    selectedHijriMonth,
    selectedHijriYear,
    filters.classId,
    i18n.language,
  ]);

  // Monthly attendance matrix - use Gregorian API for Miladi, transformed data for Hijri
  const {
    data: monthlyMatrix,
    isLoading: monthlyLoading,
    error: monthlyError,
    refetch: refetchMonthly,
  } = useQuery({
    queryKey: ["monthly-attendance-matrix", filters.classId, apiMonth, apiYear],
    queryFn: () =>
      api.getMonthlyAttendanceMatrix(filters.classId || "", apiMonth, apiYear),
    enabled:
      (calendarType === "miladi" || activeTab !== "monthly") &&
      !!filters.classId &&
      !!apiMonth &&
      !!apiYear,
  });

  // Normalize monthlyMatrix to ensure studentName is present
  const normalizedMonthlyMatrix = useMemo(() => {
    if (!monthlyMatrix || !monthlyMatrix.students) return monthlyMatrix;

    return {
      ...monthlyMatrix,
      students: monthlyMatrix.students.map((student: any) => {
        // Check if current language is Dari (fa-AF) or Pashto (ps-AF)
        const isDariOrPashto = i18n.language === "fa-AF" || i18n.language === "ps-AF";
        
        // Extract studentName from various possible field structures
        // First priority: use dariName if available and language is Dari/Pashto
        let studentName = "";
        
        if (isDariOrPashto) {
          // Check all possible locations for dariName
          if (student.user?.dariName) {
            studentName = student.user.dariName.trim();
          } else if (student.student?.user?.dariName) {
            studentName = student.student.user.dariName.trim();
          } else if (student.dariName) {
            studentName = student.dariName.trim();
          }
        }
        
        // Fallback to existing studentName field
        if (!studentName && student.studentName) {
          studentName = student.studentName;
        }
        
        // Fallback to fullName
        if (!studentName && student.fullName) {
          studentName = student.fullName;
        }
        
        // Fallback to firstName/lastName combination
        if (!studentName && (student.firstName || student.lastName)) {
          studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
        }
        
        // Fallback to student object nested structure
        if (!studentName && student.student) {
          const s = student.student;
          studentName = s.fullName || 
            `${s.firstName || ""} ${s.lastName || ""}`.trim() ||
            s.name;
        }
        
        // Fallback to user object
        if (!studentName && student.user) {
          const u = student.user;
          studentName = u.fullName || 
            `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
            u.name;
        }
        
        // Final fallback to any name field
        if (!studentName) {
          studentName = student.name || "Unknown Student";
        }

        // Extract rollNo similarly
        let rollNo = student.rollNo;
        if (!rollNo && student.student) {
          rollNo = student.student.rollNo;
        }
        if (!rollNo && student.user) {
          rollNo = student.user.rollNo;
        }

        return {
          ...student,
          studentId: student.studentId || student.id || student.student?.id,
          studentName: studentName || "Unknown Student",
          rollNo: rollNo || "N/A",
        };
      }),
    };
  }, [monthlyMatrix, i18n.language]);

  // Use transformed Hijri matrix when in Hijri mode, otherwise use normalized monthlyMatrix
  const finalMonthlyMatrix =
    calendarType === "hijri" && activeTab === "monthly"
      ? transformedHijriMatrix
      : normalizedMonthlyMatrix;
  const finalMonthlyLoading =
    calendarType === "hijri" && activeTab === "monthly"
      ? hijriAttendanceLoading
      : monthlyLoading;
  const finalMonthlyError =
    calendarType === "hijri" && activeTab === "monthly"
      ? hijriAttendanceError
      : monthlyError;

  // Sync calendar selection when switching calendar types
  useEffect(() => {
    if (calendarType === "miladi") {
      // When switching to Miladi, keep current Miladi selection
      // (already set in state)
    } else {
      // When switching to Hijri Shamsi, convert current Miladi month to Hijri
      // Use the same logic as HistoricalDataViewer
      const gregorianDate = new Date(selectedYear, selectedMonth - 1, 1);
      const hijriMonth = getCurrentHijriMonth(gregorianDate);
      const hijriYear = selectedYear - 621; // Same simple calculation as HistoricalDataViewer
      setSelectedHijriMonth(hijriMonth);
      setSelectedHijriYear(hijriYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarType]); // Only run when calendarType changes

  // Debug monthly matrix
  ({
    classId: filters.classId,
    selectedMonth,
    selectedYear,
    calendarType,
    selectedHijriMonth,
    selectedHijriYear,
    apiMonth,
    apiYear,
    finalMonthlyMatrix,
    studentsCount: finalMonthlyMatrix?.students?.length || 0,
    finalMonthlyLoading,
    finalMonthlyError,
  });

  // Update records when data changes
  useEffect(() => {
    if (attendanceData) {
      const recordsArray = Array.isArray(attendanceData.records)
        ? attendanceData.records
        : [];
      if (currentPage === 1) {
        setRecords(recordsArray);
      } else {
        setRecords((prev) => [...prev, ...recordsArray]);
      }
      setHasMore(currentPage < (attendanceData.totalPages || 1));
    }
  }, [attendanceData, currentPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setRecords([]);
  }, [
    filters.classId,
    filters.dateRange,
    filters.startDate,
    filters.endDate,
    filters.academicSessionId,
    filters.status,
    filters.searchQuery,
  ]);

  // Refetch data when classId changes
  useEffect(() => {
    if (filters.classId) {
      console.log(
        "🔄 Class changed, refetching data for classId:",
        filters.classId
      );
      refetchAttendance();
      refetchSummary();
      refetchStats();
    }
  }, [filters.classId, refetchAttendance, refetchSummary, refetchStats]);

  // Refetch data when date changes
  useEffect(() => {
    if (filters.classId) {
      console.log(
        "🔄 Date changed, refetching data for classId:",
        filters.classId,
        "date:",
        currentDate
      );
      refetchAttendance();
      refetchSummary();
      refetchStats();
    }
  }, [currentDate, refetchAttendance, refetchSummary, refetchStats]);

  // Set default class if none selected
  useEffect(() => {
    if (classes.length > 0 && !filters.classId) {
      setFilters((prev) => ({ ...prev, classId: classes[0].id }));
    }
  }, [classes, filters.classId]);

  const handleMarkIncompleteAsAbsent = async () => {
    try {
      const date = filters.startDate;
      const classId = filters.classId || undefined;
      if (!date) return;
      if (
        !window.confirm(
          `Mark all students without complete attendance as ABSENT for ${date}${
            classId ? ` (Class: ${classId})` : ""
          }?`
        )
      )
        return;
      setMarkingAbsent(true);
      const result = await markIncompleteAttendanceAsAbsent(date, classId);
      alert(
        `Processed ${
          result?.totalStudents || result?.data?.totalStudents || 0
        }. Absent: ${
          result?.absentCount || result?.data?.absentCount || 0
        }. Present: ${result?.presentCount || result?.data?.presentCount || 0}.`
      );
      await refetchAttendance();
      await refetchSummary();
    } catch (e: any) {
      console.error("❌ Mark absent failed:", e);
      alert(e?.message || "Failed to mark absent");
    } finally {
      setMarkingAbsent(false);
    }
  };

  // Calculate marked dates for calendar
  const markedDates = useMemo(() => {
    if (!filters.classId || !Array.isArray(records)) return {};

    const classRecords = records.filter(
      (r) => r && r.classId === filters.classId
    );
    const datesWithRecords = [...new Set(classRecords.map((r) => r.date))];

    const marked: { [date: string]: { marked: boolean; dotColor: string } } =
      {};

    datesWithRecords.forEach((date) => {
      const dateRecords = classRecords.filter((r) => r && r.date === date);
      const hasAbsent = dateRecords.some((r) => r.status === "ABSENT");
      const hasLate = dateRecords.some((r) => r.status === "LATE");

      let dotColor = "#4CAF50"; // Green for present
      if (hasAbsent) dotColor = "#F44336"; // Red for absent
      else if (hasLate) dotColor = "#FFC107"; // Yellow for late

      marked[date] = {
        marked: true,
        dotColor,
      };
    });

    return marked;
  }, [records, filters.classId]);

  // Handlers
  const handleFiltersChange = (newFilters: AttendanceFilters) => {
    console.log("🔄 Filters changed:", newFilters);
    setFilters(newFilters);
  };

  const handleClassSelect = (classId: string) => {
    console.log("🎯 Class selected:", classId);
    console.log("🎯 Current filters before update:", filters);

    // Find the class and auto-expand its group if it has multiple classes
    const selectedClass = classes.find((c) => c.id === classId);
    if (selectedClass) {
      const className = selectedClass.name.toLowerCase().trim();
      const sameNameClasses = classes.filter(
        (c) => c.name.toLowerCase().trim() === className
      );
      if (sameNameClasses.length > 1) {
        setExpandedClassGroups((prev) => {
          const newSet = new Set(prev);
          newSet.add(className);
          return newSet;
        });
      }
    }

    setFilters((prev) => {
      const newFilters = { ...prev, classId };
      console.log("🎯 New filters after update:", newFilters);
      return newFilters;
    });
  };

  const handleMarkInTime = async (studentId: string) => {
    try {
      await markInTimeMutation.mutateAsync({ studentId, date: currentDate });
      console.log("✅ Mark in time successful for student:", studentId);
    } catch (error) {
      console.error("❌ Error marking in time:", error);
    }
  };

  const handleMarkOutTime = async (studentId: string) => {
    try {
      await markOutTimeMutation.mutateAsync({ studentId, date: currentDate });
      console.log("✅ Mark out time successful for student:", studentId);
    } catch (error) {
      console.error("❌ Error marking out time:", error);
    }
  };

  const handleMarkLeave = async (
    studentId: string,
    reason: string,
    date: string,
    leaveDocument?: File
  ) => {
    // Try to resolve student from any available pool
    const pool = [...(allStudents || []), ...(students || [])];
    const student = pool.find(
      (s: any) =>
        String(s?.id ?? s?.studentId ?? s?.userId) === String(studentId)
    );

    // Determine class id safely
    const classId =
      (student as any)?.classId ||
      (student as any)?.class?.id ||
      filters.classId;

    // Use the new markStudentLeave API that supports document upload
    await api.markStudentLeave({
      studentId: String(studentId),
      classId: classId,
      date,
      reason,
      remarks: reason,
      leaveDocument,
    });

    // Refresh data
    refetchAttendance();
    refetchSummary();
    if (refetchMonthly) {
      refetchMonthly();
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setRecords([]);
    refetchAttendance();
    refetchSummary();
    refetchStats();
  };

  const handleResetFilters = () => {
    const resetFilters: AttendanceFilters = {
      dateRange: "week",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      classId: classes[0]?.id || "",
      studentId: "",
      status: undefined,
      searchQuery: "",
      schoolId: "",
      teacherId: "",
    };
    setFilters(resetFilters);
    setCurrentPage(1);
    setRecords([]);
  };

  const handleDateChange = (date: string) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: "custom",
      startDate: date,
      endDate: date,
    }));
  };

  const handleLoadMore = () => {
    if (hasMore && !attendanceLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleAddAttendance = () => {
    // TODO: Implement add attendance modal
    console.log("Add attendance clicked");
  };

  const handleEditAttendance = (recordId: string) => {
    // TODO: Implement edit attendance modal
    console.log("Edit attendance clicked:", recordId);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setRecords([]);
    refetchAttendance();
    refetchSummary();
    refetchStats();
  };

  // Export functions
  const handleExportExcelDari = async () => {
    console.log("🔍 Export Excel Debug (Dari):", {
      classId: filters.classId,
      finalMonthlyMatrix: finalMonthlyMatrix,
      students: finalMonthlyMatrix?.students,
      studentsLength: finalMonthlyMatrix?.students?.length,
      selectedMonth,
      selectedYear,
    });

    if (!filters.classId) {
      alert("لطفاً اول صنف را انتخاب کنید");
      return;
    }

    if (
      !finalMonthlyMatrix?.students ||
      finalMonthlyMatrix.students.length === 0
    ) {
      alert(
        "معلومات حاضری برای ماه انتخاب شده موجود نیست. لطفاً مطمئن شوید که معلومات بارگذاری شده است."
      );
      return;
    }

    setIsExportingExcel(true);
    try {
      // Refresh monthly data before export
      console.log("🔄 بازخوانی معلومات ماهانه قبل از صادرات...");
      await refetchMonthly();

      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(selectedYear, selectedMonth, 0)
        .toISOString()
        .split("T")[0];
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

      // ==========================================
      // Afghan Solar Hijri Calendar Conversion
      // ==========================================

      // Function to convert Gregorian to Solar Hijri (Afghan Calendar)
      const gregorianToSolarHijri = (
        gYear: number,
        gMonth: number,
        gDay: number
      ) => {
        // Approximate conversion (for more accurate conversion, use a library like moment-jalaali)
        const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        const jy = gYear <= 1600 ? 0 : 979;
        const gm = gMonth - 1;

        let gy2 = gMonth > 2 ? gYear + 1 : gYear;
        let days =
          365 * gYear +
          Math.floor((gy2 + 3) / 4) -
          Math.floor((gy2 + 99) / 100) +
          Math.floor((gy2 + 399) / 400) -
          80 +
          gDay +
          g_d_m[gm];

        let jy2 = -1595 + 33 * Math.floor(days / 12053);
        days %= 12053;
        jy2 += 4 * Math.floor(days / 1461);
        days %= 1461;

        if (days > 365) {
          jy2 += Math.floor((days - 1) / 365);
          days = (days - 1) % 365;
        }

        const jm =
          days < 186
            ? 1 + Math.floor(days / 31)
            : 7 + Math.floor((days - 186) / 30);
        const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

        return { year: jy2, month: jm, day: jd };
      };

      // Afghan/Persian month names (Solar Hijri)
      const afghanMonths = [
        "حمل", // 1 - Hamal (March-April)
        "ثور", // 2 - Sawr (April-May)
        "جوزا", // 3 - Jawza (May-June)
        "سرطان", // 4 - Saratan (June-July)
        "اسد", // 5 - Asad (July-August)
        "سنبله", // 6 - Sonbola (August-September)
        "میزان", // 7 - Mizan (September-October)
        "عقرب", // 8 - Aqrab (October-November)
        "قوس", // 9 - Qaws (November-December)
        "جدی", // 10 - Jadi (December-January)
        "دلو", // 11 - Dalvæ (January-February)
        "حوت", // 12 - Hut (February-March)
      ];

      // Convert current month to Solar Hijri
      const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
      const solarDate = gregorianToSolarHijri(
        firstDayOfMonth.getFullYear(),
        firstDayOfMonth.getMonth() + 1,
        firstDayOfMonth.getDate()
      );

      const monthName = `${afghanMonths[solarDate.month - 1]} ${
        solarDate.year
      }`;

      // Dari day names
      const dariDayNames = {
        Mon: "دوشنبه",
        Tue: "سه‌شنبه",
        Wed: "چهارشنبه",
        Thu: "پنج‌شنبه",
        Fri: "جمعه",
        Sat: "شنبه",
        Sun: "یک‌شنبه",
      };

      // Short day names for compact display
      const dariDayNamesShort = {
        Mon: "د",
        Tue: "س",
        Wed: "چ",
        Thu: "پ",
        Fri: "ج",
        Sat: "ش",
        Sun: "ی",
      };

      console.log("🚀 آغاز صادرات اکسل به زبان دری با تقویم افغانی");

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "سیستم مدیریت مکتب";
      workbook.lastModifiedBy = "ماژول حاضری";
      workbook.created = new Date();
      workbook.modified = new Date();

      // ==========================================
      // برگه ۱: خلاصه گزارش
      // ==========================================
      const summarySheet = workbook.addWorksheet("📊 خلاصه", {
        properties: { tabColor: { argb: "E0FDEA" } },
        views: [{ showGridLines: false, rightToLeft: true }],
      });

      // Add logo/title section
      summarySheet.mergeCells("A1:H3");
      const titleCell = summarySheet.getCell("A1");
      titleCell.value = "📊 گزارش حاضری ماهانه";
      titleCell.style = {
        font: {
          bold: true,
          size: 24,
          color: { argb: "FFFFFF" },
          name: "B Nazanin",
        },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "3B82F6" },
        },
        alignment: {
          horizontal: "center",
          vertical: "middle",
          readingOrder: "rtl",
        },
        border: {
          top: { style: "thick", color: { argb: "6B7280" } },
          bottom: { style: "thick", color: { argb: "6B7280" } },
          left: { style: "thick", color: { argb: "6B7280" } },
          right: { style: "thick", color: { argb: "6B7280" } },
        },
      };

      // Convert dates to Solar Hijri for display
      const startDateSolar = gregorianToSolarHijri(
        selectedYear,
        selectedMonth,
        1
      );
      const endDateGreg = new Date(selectedYear, selectedMonth, 0);
      const endDateSolar = gregorianToSolarHijri(
        endDateGreg.getFullYear(),
        endDateGreg.getMonth() + 1,
        endDateGreg.getDate()
      );

      const startDateDisplay = `${startDateSolar.day} ${
        afghanMonths[startDateSolar.month - 1]
      } ${startDateSolar.year}`;
      const endDateDisplay = `${endDateSolar.day} ${
        afghanMonths[endDateSolar.month - 1]
      } ${endDateSolar.year}`;

      // Add class information with styling
      const infoData = [
        ["صنف:", selectedClass?.name || "نامعلوم"],
        ["ماه:", monthName],
        ["محدوده تاریخ:", `${startDateDisplay} تا ${endDateDisplay}`],
        ["تاریخ میلادی:", `${startDate} تا ${endDate}`],
        ["مجموع شاگردان:", finalMonthlyMatrix.students.length.toString()],
        [
          "تاریخ تولید:",
          new Date().toLocaleDateString("fa-AF", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        ],
      ];

      let currentRow = 5;
      infoData.forEach((info) => {
        summarySheet.getCell(`G${currentRow}`).value = info[0];
        summarySheet.getCell(`G${currentRow}`).style = {
          font: {
            bold: true,
            size: 12,
            color: { argb: "1F2937" },
            name: "B Nazanin",
          },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F3F4F6" },
          },
          alignment: {
            horizontal: "right",
            vertical: "middle",
            readingOrder: "rtl",
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };

        summarySheet.mergeCells(`D${currentRow}:F${currentRow}`);
        summarySheet.getCell(`D${currentRow}`).value = info[1];
        summarySheet.getCell(`D${currentRow}`).style = {
          font: { size: 12, name: "B Nazanin" },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF" },
          },
          alignment: {
            horizontal: "right",
            vertical: "middle",
            readingOrder: "rtl",
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
        currentRow++;
      });

      // Add spacing
      currentRow += 2;

      // Student Summary Section Header
      summarySheet.mergeCells(`A${currentRow}:H${currentRow}`);
      const summaryHeaderCell = summarySheet.getCell(`A${currentRow}`);
      summaryHeaderCell.value = "📈 خلاصه حاضری شاگردان";
      summaryHeaderCell.style = {
        font: {
          bold: true,
          size: 16,
          color: { argb: "FFFFFF" },
          name: "B Nazanin",
        },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "6B7280" },
        },
        alignment: {
          horizontal: "center",
          vertical: "middle",
          readingOrder: "rtl",
        },
        border: {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" },
        },
      };
      currentRow++;

      // Add summary table headers
      const summaryHeaders = [
        "فیصدی حاضری",
        "مجموع روزها",
        "معذور",
        "دیر",
        "غایب",
        "حاضر",
        "نمبر حاضری",
        "نام شاگرد",
      ];
      const headerRow = summarySheet.addRow(summaryHeaders);
      headerRow.height = 30;

      headerRow.eachCell((cell, colNumber) => {
        cell.style = {
          font: {
            bold: true,
            size: 12,
            color: { argb: "FFFFFF" },
            name: "B Nazanin",
          },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "3B82F6" },
          },
          alignment: {
            horizontal: "center",
            vertical: "middle",
            readingOrder: "rtl",
          },
          border: {
            top: { style: "medium", color: { argb: "6B7280" } },
            bottom: { style: "medium", color: { argb: "6B7280" } },
            left: { style: "thin", color: { argb: "FFFFFF" } },
            right: { style: "thin", color: { argb: "FFFFFF" } },
          },
        };
      });

      // Add student summary data
      let studentRowIndex = 0;
      finalMonthlyMatrix.students.forEach((s: any) => {
        // Extract Dari name with multiple fallback options

        // Extract Dari name - simplified version
        let studentDariName = "";

        if (s.user?.dariName) {
          studentDariName = s.user.dariName;
        } else if (s.user?.firstName && s.user?.lastName) {
          studentDariName = `${s.user.firstName} ${s.user.lastName}`;
        } else if (s.studentName) {
          studentDariName = s.studentName;
        } else {
          studentDariName = "نامعلوم";
        }
        console.log("📝 Student name debug (Dari export):", {
          studentId: s.id,
          userDariName: s.user?.dariName,
          finalName: studentDariName,
        });

        const summary = {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: daysInMonth,
        };

        Object.values(s.dailyAttendance || {}).forEach((day: any) => {
          if (day?.status === "PRESENT") summary.present++;
          else if (day?.status === "ABSENT") summary.absent++;
          else if (day?.status === "LATE") summary.late++;
          else if (day?.status === "EXCUSED") summary.excused++;
        });

        const attendancePercentage =
          summary.total > 0
            ? Math.round(
                ((summary.present + summary.late) / summary.total) * 100
              )
            : 0;

        // Note: Reversed order for RTL layout
        const row = summarySheet.addRow([
          `٪${attendancePercentage}`,
          summary.total,
          summary.excused,
          summary.late,
          summary.absent,
          summary.present,
          s.rollNo || "ندارد",
          studentDariName,
        ]);

        row.height = 25;

        // Apply alternating row colors and style
        row.eachCell((cell, colNumber) => {
          cell.style = {
            font: { size: 11, name: "B Nazanin" },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: studentRowIndex % 2 === 0 ? "F9FAFB" : "FFFFFF",
              },
            },
            alignment: {
              horizontal: colNumber === 8 ? "right" : "center",
              vertical: "middle",
              readingOrder: "rtl",
            },
            border: {
              top: { style: "thin", color: { argb: "E5E7EB" } },
              bottom: { style: "thin", color: { argb: "E5E7EB" } },
              left: { style: "thin", color: { argb: "E5E7EB" } },
              right: { style: "thin", color: { argb: "E5E7EB" } },
            },
          };

          // Color code attendance percentage (now in column 1)
          if (colNumber === 1) {
            const percentage = parseInt(
              cell.value?.toString().replace("٪", "").replace("%", "") || "0"
            );
            if (percentage >= 90) {
              cell.style.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "E0F2FE" },
              };
              cell.style.font = {
                bold: true,
                color: { argb: "0F766E" },
                name: "B Nazanin",
              };
            } else if (percentage >= 75) {
              cell.style.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "F3F4F6" },
              };
              cell.style.font = {
                bold: true,
                color: { argb: "374151" },
                name: "B Nazanin",
              };
            } else {
              cell.style.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FEE2E2" },
              };
              cell.style.font = {
                bold: true,
                color: { argb: "991B1B" },
                name: "B Nazanin",
              };
            }
          }

          // Highlight high absence counts (now in column 5)
          if (colNumber === 5) {
            const absentCount = parseInt(cell.value?.toString() || "0");
            if (absentCount > 5) {
              cell.style.font = {
                bold: true,
                color: { argb: "DC2626" },
                name: "B Nazanin",
              };
            }
          }
        });

        studentRowIndex++;
      });

      // Add summary statistics at the bottom
      summarySheet.addRow([]); // Empty row for spacing

      const totalPresent = finalMonthlyMatrix.students.reduce(
        (sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "PRESENT"
            ).length
          );
        },
        0
      );

      const totalAbsent = finalMonthlyMatrix.students.reduce(
        (sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "ABSENT"
            ).length
          );
        },
        0
      );

      const totalLate = finalMonthlyMatrix.students.reduce(
        (sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "LATE"
            ).length
          );
        },
        0
      );

      const totalExcused = finalMonthlyMatrix.students.reduce(
        (sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "EXCUSED"
            ).length
          );
        },
        0
      );

      const statsRow = summarySheet.addRow([
        "",
        "",
        totalExcused,
        totalLate,
        totalAbsent,
        totalPresent,
        "",
        "مجموع",
      ]);

      statsRow.eachCell((cell, colNumber) => {
        cell.style = {
          font: {
            bold: true,
            size: 12,
            color: { argb: "FFFFFF" },
            name: "B Nazanin",
          },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "6B7280" },
          },
          alignment: {
            horizontal: "center",
            vertical: "middle",
            readingOrder: "rtl",
          },
          border: {
            top: { style: "medium" },
            bottom: { style: "medium" },
            left: { style: "medium" },
            right: { style: "medium" },
          },
        };
      });

      // Set column widths
      summarySheet.columns = [
        { width: 15 }, // Attendance %
        { width: 12 }, // Total Days
        { width: 10 }, // Excused
        { width: 10 }, // Late
        { width: 10 }, // Absent
        { width: 10 }, // Present
        { width: 15 }, // Roll No (نمبر حاضری)
        { width: 25 }, // Student Name
      ];

      // ==========================================
      // برگه ۲: حاضری روزانه
      // ==========================================
      const attendanceSheet = workbook.addWorksheet("📅 حاضری روزانه", {
        properties: { tabColor: { argb: "6B7280" } },
        views: [{ rightToLeft: true }],
      });

      // Create header row with student info and days (RTL - from right to left)
      const attendanceHeaders = ["نام شاگرد", "نمبر حاضری"];

      // Add day headers from 1 to daysInMonth (will appear RTL due to sheet settings)
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, selectedMonth - 1, day);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const dariDayShort =
          dariDayNamesShort[dayName as keyof typeof dariDayNamesShort] ||
          dayName;

        // Convert Gregorian day to Solar Hijri
        const solarDay = gregorianToSolarHijri(
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate()
        );

        attendanceHeaders.push(`${solarDay.day}\n${dariDayShort}`);
      }

      const attendanceHeaderRow = attendanceSheet.addRow(attendanceHeaders);
      attendanceHeaderRow.height = 35;

      // Style header row
      attendanceHeaderRow.eachCell((cell, colNumber) => {
        let isWeekend = false;

        if (colNumber > 2) {
          const dayIndex = colNumber - 3;
          const date = new Date(selectedYear, selectedMonth - 1, dayIndex + 1);
          isWeekend = date.getDay() === 5 || date.getDay() === 6; // Friday and Saturday for Afghanistan
        }

        cell.style = {
          font: {
            bold: true,
            size: 10,
            color: { argb: "FFFFFF" },
            name: "B Nazanin",
          },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isWeekend ? "F59E0B" : "3B82F6" },
          },
          alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
            readingOrder: "rtl",
          },
          border: {
            top: { style: "medium", color: { argb: "6B7280" } },
            bottom: { style: "medium", color: { argb: "6B7280" } },
            left: { style: "thin", color: { argb: "FFFFFF" } },
            right: { style: "thin", color: { argb: "FFFFFF" } },
          },
        };
      });

      // Add student attendance data
      let attendanceRowIndex = 0;
      finalMonthlyMatrix.students.forEach((s: any) => {
        // Extract Dari name
        let studentDariName = "";

        if (s.user?.dariName) {
          studentDariName = s.user.dariName;
        } else if (s.dariName) {
          studentDariName = s.dariName;
        } else if (s.user?.firstName && s.user?.lastName) {
          studentDariName = `${s.user.firstName} ${s.user.lastName}`;
        } else if (s.studentName) {
          studentDariName = s.studentName;
        } else {
          studentDariName = "نامعلوم";
        }

        const rowData = [studentDariName, s.rollNo || "ندارد"];

        // Add days from 1 to daysInMonth (RTL handled by sheet settings)
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = new Date(selectedYear, selectedMonth - 1, day)
            .toISOString()
            .split("T")[0];
          const attendance = s.dailyAttendance[dateStr];

          if (attendance?.status) {
            const statusSymbol = {
              PRESENT: "✅",
              ABSENT: "❌",
              LATE: "⏰",
              EXCUSED: "📝",
            };
            rowData.push(
              statusSymbol[attendance.status as keyof typeof statusSymbol] ||
                "⚪"
            );
          } else {
            rowData.push("⚪");
          }
        }

        const row = attendanceSheet.addRow(rowData);
        row.height = 25;

        // Style attendance data cells
        row.eachCell((cell, colNumber) => {
          let isWeekend = false;

          if (colNumber > 2) {
            const dayIndex = colNumber - 3;
            const date = new Date(
              selectedYear,
              selectedMonth - 1,
              dayIndex + 1
            );
            isWeekend = date.getDay() === 5 || date.getDay() === 6; // Friday and Saturday
          }

          // Base style
          cell.style = {
            font: { size: colNumber <= 2 ? 11 : 14, name: "B Nazanin" },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFFF" },
            },
            alignment: {
              horizontal: colNumber === 1 ? "right" : "center",
              vertical: "middle",
              readingOrder: "rtl",
            },
            border: {
              top: { style: "thin", color: { argb: "E5E7EB" } },
              bottom: { style: "thin", color: { argb: "E5E7EB" } },
              left: { style: "thin", color: { argb: "E5E7EB" } },
              right: { style: "thin", color: { argb: "E5E7EB" } },
            },
          };

          // Apply alternating row colors for name and roll columns
          if (colNumber <= 2) {
            cell.style.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: attendanceRowIndex % 2 === 0 ? "F9FAFB" : "FFFFFF",
              },
            };
          }

          // Color code attendance status cells
          if (colNumber > 2) {
            const value = cell.value?.toString();
            let bgColor = "FFFFFF";

            if (value === "✅") {
              bgColor = "E0F2FE"; // Light blue for present
            } else if (value === "❌") {
              bgColor = "FEE2E2"; // Light red for absent
            } else if (value === "⏰") {
              bgColor = "FEF3C7"; // Light yellow for late
            } else if (value === "📝") {
              bgColor = "E0E7FF"; // Light purple for excused
            } else if (value === "⚪") {
              bgColor = isWeekend ? "F3F4F6" : "FFFFFF";
            }

            cell.style.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: bgColor },
            };

            // Add weekend shading
            if (isWeekend) {
              cell.style.border = {
                top: { style: "thin", color: { argb: "CBD5E1" } },
                bottom: { style: "thin", color: { argb: "CBD5E1" } },
                left: { style: "medium", color: { argb: "CBD5E1" } },
                right: { style: "medium", color: { argb: "CBD5E1" } },
              };
            }
          }
        });

        attendanceRowIndex++;
      });

      // Add legend at the bottom
      attendanceSheet.addRow([]); // Empty row
      const legendRow = attendanceSheet.addRow([
        "علامات:",
        "",
        "✅ = حاضر",
        "❌ = غایب",
        "⏰ = دیر",
        "📝 = معذور",
        "⚪ = بدون معلومات",
      ]);
      legendRow.height = 25;

      legendRow.getCell(1).style = {
        font: {
          bold: true,
          size: 12,
          color: { argb: "FFFFFF" },
          name: "B Nazanin",
        },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1F2937" },
        },
        alignment: {
          horizontal: "center",
          vertical: "middle",
          readingOrder: "rtl",
        },
      };

      for (let i = 3; i <= 7; i++) {
        legendRow.getCell(i).style = {
          font: { size: 11, name: "B Nazanin" },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F9FAFB" },
          },
          alignment: {
            horizontal: "center",
            vertical: "middle",
            readingOrder: "rtl",
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      }

      // Set column widths for attendance sheet
      const attendanceCols = [
        { width: 25 }, // Student Name
        { width: 15 }, // Roll No (نمبر حاضری)
      ];

      // Add day columns
      for (let day = 1; day <= daysInMonth; day++) {
        attendanceCols.push({ width: 6 });
      }

      attendanceSheet.columns = attendanceCols;

      // Freeze first two columns
      attendanceSheet.views = [
        { state: "frozen", xSplit: 2, ySplit: 1, rightToLeft: true },
      ];

      // ==========================================
      // برگه ۳: آمار و معلومات
      // ==========================================
      const statsSheet = workbook.addWorksheet("📈 آمار", {
        properties: { tabColor: { argb: "6B7280" } },
        views: [{ showGridLines: false, rightToLeft: true }],
      });

      // Title
      statsSheet.mergeCells("A1:F2");
      const statsTitleCell = statsSheet.getCell("A1");
      statsTitleCell.value = "📊 داشبورد آماری حاضری";
      statsTitleCell.style = {
        font: {
          bold: true,
          size: 20,
          color: { argb: "FFFFFF" },
          name: "B Nazanin",
        },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "6B7280" },
        },
        alignment: {
          horizontal: "center",
          vertical: "middle",
          readingOrder: "rtl",
        },
        border: {
          top: { style: "thick" },
          bottom: { style: "thick" },
          left: { style: "thick" },
          right: { style: "thick" },
        },
      };

      // Calculate statistics
      const totalPossibleAttendance =
        finalMonthlyMatrix.students.length * daysInMonth;
      const actualPresent = finalMonthlyMatrix.students.reduce(
        (sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "PRESENT"
            ).length
          );
        },
        0
      );
      const actualAbsent = finalMonthlyMatrix.students.reduce(
        (sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "ABSENT"
            ).length
          );
        },
        0
      );
      const overallAttendanceRate =
        totalPossibleAttendance > 0
          ? ((actualPresent / totalPossibleAttendance) * 100).toFixed(1)
          : "0";

      // Add statistics cards
      const statsData = [
        ["میزان کلی حاضری", `٪${overallAttendanceRate}`],
        ["مجموع شاگردان", finalMonthlyMatrix.students.length.toString()],
        ["مجموع روزهای مکتب", daysInMonth.toString()],
        ["مجموع حاضری (ماه)", actualPresent.toString()],
        ["مجموع غیابت (ماه)", actualAbsent.toString()],
        [
          "اوسط حاضری روزانه",
          `${(actualPresent / daysInMonth).toFixed(0)} شاگرد`,
        ],
      ];

      let statsRowNum = 4;
      statsData.forEach((stat, index) => {
        if (index % 2 === 0) {
          statsRowNum++;
        }

        const labelCol = index % 2 === 0 ? "E" : "B";
        const valueCol = index % 2 === 0 ? "F" : "C";

        statsSheet.getCell(`${valueCol}${statsRowNum}`).value = stat[1];
        statsSheet.getCell(`${valueCol}${statsRowNum}`).style = {
          font: {
            bold: true,
            size: 14,
            color: {
              argb:
                index === 0
                  ? parseFloat(overallAttendanceRate) >= 80
                    ? "16A34A"
                    : "DC2626"
                  : "1F2937",
            },
            name: "B Nazanin",
          },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb:
                index === 0
                  ? parseFloat(overallAttendanceRate) >= 80
                    ? "DCFCE7"
                    : "FEE2E2"
                  : "FFFFFF",
            },
          },
          alignment: {
            horizontal: "center",
            vertical: "middle",
            readingOrder: "rtl",
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };

        statsSheet.getCell(`${labelCol}${statsRowNum}`).value = stat[0];
        statsSheet.getCell(`${labelCol}${statsRowNum}`).style = {
          font: { bold: true, size: 12, name: "B Nazanin" },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F0FDF4" },
          },
          alignment: {
            horizontal: "right",
            vertical: "middle",
            readingOrder: "rtl",
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      });

      // Set column widths for stats sheet
      statsSheet.columns = [
        { width: 5 },
        { width: 25 },
        { width: 20 },
        { width: 5 },
        { width: 25 },
        { width: 20 },
      ];

      // Generate and download file
      const fileName = `حاضری_${selectedClass?.name}_${solarDate.year}_${
        afghanMonths[solarDate.month - 1]
      }.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log("✅ صادرات اکسل موفقانه انجام شد");
      alert(t("attendance.export.excelSuccess"));
    } catch (error) {
       console.error("❌ صادرات اکسل ناموفق بود:", error);
       alert(
         `${t("attendance.export.excelError")}: ${
           error instanceof Error ? error.message : "Unknown error"
         }`
       );
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportExcel = async () => {
    console.log("🔍 Export Excel Debug:", {
      classId: filters.classId,
      finalMonthlyMatrix: finalMonthlyMatrix,
      students: finalMonthlyMatrix?.students,
      studentsLength: finalMonthlyMatrix?.students?.length,
      selectedMonth,
      selectedYear,
    });

    if (!filters.classId) {
      alert(t("attendance.monthly.selectClassFirst"));
      return;
    }

    if (
      !finalMonthlyMatrix?.students ||
      finalMonthlyMatrix.students.length === 0
    ) {
      alert(
        t("attendance.monthly.noDataForExcelExport")
      );
      return;
    }

    setIsExportingExcel(true);
    try {
      // Refresh monthly data before export
      console.log("🔄 Refreshing monthly data before export...");
      await refetchMonthly();

      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(selectedYear, selectedMonth, 0)
        .toISOString()
        .split("T")[0];
      const monthName = new Date(
        selectedYear,
        selectedMonth - 1
      ).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

      console.log("🚀 Starting frontend Excel export");

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "School Management System";
      workbook.lastModifiedBy = "Attendance Module";
      workbook.created = new Date();
      workbook.modified = new Date();

      // ==========================================
      // Sheet 1: Summary Sheet
      // ==========================================
      const summarySheet = workbook.addWorksheet("📊 Summary", {
        properties: { tabColor: { argb: "E0FDEA" } },
        views: [{ showGridLines: false }],
      });

      // Add logo/title section
      summarySheet.mergeCells("A1:H3");
      const titleCell = summarySheet.getCell("A1");
      titleCell.value = "📊 MONTHLY ATTENDANCE REPORT";
      titleCell.style = {
        font: { bold: true, size: 24, color: { argb: "FFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "3B82F6" },
        },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thick", color: { argb: "6B7280" } },
          bottom: { style: "thick", color: { argb: "6B7280" } },
          left: { style: "thick", color: { argb: "6B7280" } },
          right: { style: "thick", color: { argb: "6B7280" } },
        },
      };

      // Add class information with styling
      const infoData = [
        ["Class:", selectedClass?.name || "Unknown Class"],
        ["Month:", monthName],
        ["Date Range:", `${startDate} to ${endDate}`],
        ["Total Students:", finalMonthlyMatrix.students.length],
        ["Generated On:", new Date().toLocaleString()],
      ];

      let currentRow = 5;
      infoData.forEach((info) => {
        summarySheet.getCell(`B${currentRow}`).value = info[0];
        summarySheet.getCell(`B${currentRow}`).style = {
          font: { bold: true, size: 12, color: { argb: "1F2937" } },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F3F4F6" },
          },
          alignment: { horizontal: "right", vertical: "middle" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };

        summarySheet.mergeCells(`C${currentRow}:E${currentRow}`);
        summarySheet.getCell(`C${currentRow}`).value = info[1];
        summarySheet.getCell(`C${currentRow}`).style = {
          font: { size: 12 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF" },
          },
          alignment: { horizontal: "left", vertical: "middle" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
        currentRow++;
      });

      // Add spacing
      currentRow += 2;

      // Student Summary Section Header
      summarySheet.mergeCells(`A${currentRow}:H${currentRow}`);
      const summaryHeaderCell = summarySheet.getCell(`A${currentRow}`);
      summaryHeaderCell.value = "📈 STUDENT ATTENDANCE SUMMARY";
      summaryHeaderCell.style = {
        font: { bold: true, size: 16, color: { argb: "FFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "6B7280" },
        },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" },
        },
      };
      currentRow++;

      // Add summary table headers
      const summaryHeaders = [
        "Student Name",
        "Roll No",
        "Present",
        "Absent",
        "Late",
        "Excused",
        "Total Days",
        "Attendance %",
      ];
      const headerRow = summarySheet.addRow(summaryHeaders);
      headerRow.height = 30;

      headerRow.eachCell((cell, colNumber) => {
        cell.style = {
          font: { bold: true, size: 12, color: { argb: "FFFFFF" } },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "3B82F6" },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "medium", color: { argb: "6B7280" } },
            bottom: { style: "medium", color: { argb: "6B7280" } },
            left: { style: "thin", color: { argb: "FFFFFF" } },
            right: { style: "thin", color: { argb: "FFFFFF" } },
          },
        };
      });

      // Add student summary data
      let studentRowIndex = 0;
      finalMonthlyMatrix.students.forEach((student: any) => {
        const summary = {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: daysInMonth,
        };

        Object.values(student.dailyAttendance || {}).forEach((day: any) => {
          if (day?.status === "PRESENT") summary.present++;
          else if (day?.status === "ABSENT") summary.absent++;
          else if (day?.status === "LATE") summary.late++;
          else if (day?.status === "EXCUSED") summary.excused++;
        });

        const attendancePercentage =
          summary.total > 0
            ? Math.round(
                ((summary.present + summary.late) / summary.total) * 100
              )
            : 0;

        const row = summarySheet.addRow([
          getStudentName(student),
          student.rollNo || "N/A",
          summary.present,
          summary.absent,
          summary.late,
          summary.excused,
          summary.total,
          `${attendancePercentage}%`,
        ]);

        row.height = 25;

        // Apply alternating row colors and style
        row.eachCell((cell, colNumber) => {
          cell.style = {
            font: { size: 11 },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: studentRowIndex % 2 === 0 ? "F9FAFB" : "FFFFFF",
              },
            },
            alignment: {
              horizontal: colNumber === 1 ? "left" : "center",
              vertical: "middle",
            },
            border: {
              top: { style: "thin", color: { argb: "E5E7EB" } },
              bottom: { style: "thin", color: { argb: "E5E7EB" } },
              left: { style: "thin", color: { argb: "E5E7EB" } },
              right: { style: "thin", color: { argb: "E5E7EB" } },
            },
          };

          // Color code attendance percentage
          if (colNumber === 8) {
            const percentage = parseInt(
              cell.value?.toString().replace("%", "") || "0"
            );
            if (percentage >= 90) {
              cell.style.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "E0F2FE" },
              };
              cell.style.font = { bold: true, color: { argb: "0F766E" } };
            } else if (percentage >= 75) {
              cell.style.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "F3F4F6" },
              };
              cell.style.font = { bold: true, color: { argb: "374151" } };
            } else {
              cell.style.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FEE2E2" },
              };
              cell.style.font = { bold: true, color: { argb: "991B1B" } };
            }
          }

          // Highlight high absence counts
          if (colNumber === 4) {
            // Absent column
            const absentCount = parseInt(cell.value?.toString() || "0");
            if (absentCount > 5) {
              cell.style.font = { bold: true, color: { argb: "DC2626" } };
            }
          }
        });

        studentRowIndex++;
      });

      // Add summary statistics at the bottom
      summarySheet.addRow([]); // Empty row for spacing

      const statsRow = summarySheet.addRow([
        "TOTALS",
        "",
        finalMonthlyMatrix.students.reduce((sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "PRESENT"
            ).length
          );
        }, 0),
        finalMonthlyMatrix.students.reduce((sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "ABSENT"
            ).length
          );
        }, 0),
        finalMonthlyMatrix.students.reduce((sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "LATE"
            ).length
          );
        }, 0),
        finalMonthlyMatrix.students.reduce((sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "EXCUSED"
            ).length
          );
        }, 0),
        "",
        "",
      ]);

      statsRow.eachCell((cell, colNumber) => {
        cell.style = {
          font: { bold: true, size: 12, color: { argb: "FFFFFF" } },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "6B7280" },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "medium" },
            bottom: { style: "medium" },
            left: { style: "medium" },
            right: { style: "medium" },
          },
        };
      });

      // Set column widths
      summarySheet.columns = [
        { width: 25 }, // Student Name
        { width: 12 }, // Roll No
        { width: 10 }, // Present
        { width: 10 }, // Absent
        { width: 10 }, // Late
        { width: 10 }, // Excused
        { width: 12 }, // Total Days
        { width: 15 }, // Attendance %
      ];

      // ==========================================
      // Sheet 2: Daily Attendance Matrix
      // ==========================================
      const attendanceSheet = workbook.addWorksheet("📅 Daily Attendance", {
        properties: { tabColor: { argb: "6B7280" } },
      });

      // Create header row with student info and days
      const attendanceHeaders = ["👤 Student Name", "🎫 Roll No"];

      // Add day headers
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, selectedMonth - 1, day);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        attendanceHeaders.push(`${day}\n${dayName}`);
      }

      const attendanceHeaderRow = attendanceSheet.addRow(attendanceHeaders);
      attendanceHeaderRow.height = 35;

      // Style header row
      attendanceHeaderRow.eachCell((cell, colNumber) => {
        const isWeekend =
          colNumber > 2 &&
          (new Date(selectedYear, selectedMonth - 1, colNumber - 2).getDay() ===
            0 ||
            new Date(
              selectedYear,
              selectedMonth - 1,
              colNumber - 2
            ).getDay() === 6);

        cell.style = {
          font: { bold: true, size: 10, color: { argb: "FFFFFF" } },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: isWeekend ? "F59E0B" : "3B82F6" },
          },
          alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          },
          border: {
            top: { style: "medium", color: { argb: "6B7280" } },
            bottom: { style: "medium", color: { argb: "6B7280" } },
            left: { style: "thin", color: { argb: "FFFFFF" } },
            right: { style: "thin", color: { argb: "FFFFFF" } },
          },
        };
      });

      // Add student attendance data
      let attendanceRowIndex = 0;
      finalMonthlyMatrix.students.forEach((student: any) => {
        const rowData = [getStudentName(student), student.rollNo || "N/A"];

        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = new Date(selectedYear, selectedMonth - 1, day)
            .toISOString()
            .split("T")[0];
          const attendance = student.dailyAttendance[dateStr];

          if (attendance?.status) {
            const statusSymbol = {
              PRESENT: "✅",
              ABSENT: "❌",
              LATE: "⏰",
              EXCUSED: "📝",
            };
            rowData.push(
              statusSymbol[attendance.status as keyof typeof statusSymbol] ||
                "⚪"
            );
          } else {
            rowData.push("⚪");
          }
        }

        const row = attendanceSheet.addRow(rowData);
        row.height = 25;

        // Style attendance data cells
        row.eachCell((cell, colNumber) => {
          const isWeekend =
            colNumber > 2 &&
            (new Date(
              selectedYear,
              selectedMonth - 1,
              colNumber - 2
            ).getDay() === 0 ||
              new Date(
                selectedYear,
                selectedMonth - 1,
                colNumber - 2
              ).getDay() === 6);

          // Base style
          cell.style = {
            font: { size: colNumber <= 2 ? 11 : 14 },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFFF" },
            },
            alignment: {
              horizontal: colNumber === 1 ? "left" : "center",
              vertical: "middle",
            },
            border: {
              top: { style: "thin", color: { argb: "E5E7EB" } },
              bottom: { style: "thin", color: { argb: "E5E7EB" } },
              left: { style: "thin", color: { argb: "E5E7EB" } },
              right: { style: "thin", color: { argb: "E5E7EB" } },
            },
          };

          // Apply alternating row colors for name and roll columns
          if (colNumber <= 2) {
            cell.style.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb: attendanceRowIndex % 2 === 0 ? "F9FAFB" : "FFFFFF",
              },
            };
          }

          // Color code attendance status cells
          if (colNumber > 2) {
            const value = cell.value?.toString();
            let bgColor = "FFFFFF";

            if (value === "✅") {
              bgColor = "E0F2FE"; // Light blue for present
            } else if (value === "❌") {
              bgColor = "FEE2E2"; // Light red for absent
            } else if (value === "⏰") {
              bgColor = "F3F4F6"; // Light gray for late
            } else if (value === "📝") {
              bgColor = "F3F4F6"; // Light gray for excused
            } else if (value === "⚪") {
              bgColor = isWeekend ? "F3F4F6" : "FFFFFF"; // Gray for no data/weekend
            }

            cell.style.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: bgColor },
            };

            // Add weekend shading
            if (isWeekend) {
              cell.style.border = {
                top: { style: "thin", color: { argb: "CBD5E1" } },
                bottom: { style: "thin", color: { argb: "CBD5E1" } },
                left: { style: "medium", color: { argb: "CBD5E1" } },
                right: { style: "medium", color: { argb: "CBD5E1" } },
              };
            }
          }
        });

        attendanceRowIndex++;
      });

      // Add legend at the bottom
      attendanceSheet.addRow([]); // Empty row
      const legendRow = attendanceSheet.addRow([
        "LEGEND:",
        "",
        "✅ = Present",
        "❌ = Absent",
        "⏰ = Late",
        "📝 = Excused",
        "⚪ = No Data",
      ]);
      legendRow.height = 25;

      legendRow.getCell(1).style = {
        font: { bold: true, size: 12 },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1F2937" },
        },

        alignment: { horizontal: "center", vertical: "middle" },
      };

      for (let i = 3; i <= 7; i++) {
        legendRow.getCell(i).style = {
          font: { size: 11 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F9FAFB" },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      }

      // Set column widths for attendance sheet
      const attendanceCols = [
        { width: 25 }, // Student Name
        { width: 12 }, // Roll No
      ];

      // Add day columns
      for (let day = 1; day <= daysInMonth; day++) {
        attendanceCols.push({ width: 6 });
      }

      attendanceSheet.columns = attendanceCols;

      // Freeze first two columns
      attendanceSheet.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];

      // ==========================================
      // Sheet 3: Statistics Dashboard
      // ==========================================
      const statsSheet = workbook.addWorksheet("📈 Statistics", {
        properties: { tabColor: { argb: "6B7280" } },
        views: [{ showGridLines: false }],
      });

      // Title
      statsSheet.mergeCells("A1:F2");
      const statsTitleCell = statsSheet.getCell("A1");
      statsTitleCell.value = "📊 ATTENDANCE STATISTICS DASHBOARD";
      statsTitleCell.style = {
        font: { bold: true, size: 20, color: { argb: "FFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "6B7280" },
        },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thick" },
          bottom: { style: "thick" },
          left: { style: "thick" },
          right: { style: "thick" },
        },
      };

      // Calculate statistics
      const totalPossibleAttendance =
        finalMonthlyMatrix.students.length * daysInMonth;
      const actualPresent = finalMonthlyMatrix.students.reduce(
        (sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "PRESENT"
            ).length
          );
        },
        0
      );
      const actualAbsent = finalMonthlyMatrix.students.reduce(
        (sum: number, s: any) => {
          return (
            sum +
            Object.values(s.dailyAttendance || {}).filter(
              (d: any) => d?.status === "ABSENT"
            ).length
          );
        },
        0
      );
      const overallAttendanceRate = (
        (actualPresent / totalPossibleAttendance) *
        100
      ).toFixed(1);

      // Add statistics cards
      const statsData = [
        ["Overall Attendance Rate", `${overallAttendanceRate}%`],
        ["Total Students", finalMonthlyMatrix.students.length],
        ["Total School Days", daysInMonth],
        ["Total Present (Month)", actualPresent],
        ["Total Absent (Month)", actualAbsent],
        [
          "Average Daily Attendance",
          `${(actualPresent / daysInMonth).toFixed(0)} students`,
        ],
      ];

      let statsRowNum = 4;
      statsData.forEach((stat, index) => {
        if (index % 2 === 0) {
          statsRowNum++;
        }

        const col = index % 2 === 0 ? "B" : "E";
        const labelCol = index % 2 === 0 ? "B" : "E";
        const valueCol = index % 2 === 0 ? "C" : "F";

        statsSheet.getCell(`${labelCol}${statsRowNum}`).value = stat[0];
        statsSheet.getCell(`${labelCol}${statsRowNum}`).style = {
          font: { bold: true, size: 12 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F0FDF4" },
          },
          alignment: { horizontal: "left", vertical: "middle" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };

        statsSheet.getCell(`${valueCol}${statsRowNum}`).value = stat[1];
        statsSheet.getCell(`${valueCol}${statsRowNum}`).style = {
          font: {
            bold: true,
            size: 14,
            color: {
              argb:
                index === 0
                  ? parseFloat(overallAttendanceRate) >= 80
                    ? "16A34A"
                    : "DC2626"
                  : "1F2937",
            },
          },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb:
                index === 0
                  ? parseFloat(overallAttendanceRate) >= 80
                    ? "DCFCE7"
                    : "FEE2E2"
                  : "FFFFFF",
            },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      });

      // Set column widths for stats sheet
      statsSheet.columns = [
        { width: 5 },
        { width: 25 },
        { width: 20 },
        { width: 5 },
        { width: 25 },
        { width: 20 },
      ];

      // Generate and download file
      const fileName = `attendance_${
        selectedClass?.name
      }_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log("✅ Excel export successful");
      alert(t("attendance.export.excelSuccess"));
      } catch (error) {
      console.error("❌ Excel export failed:", error);
      alert(
        `${t("attendance.export.excelError")}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    console.log("🔍 Export PDF Debug:", {
      classId: filters.classId,
      finalMonthlyMatrix: finalMonthlyMatrix,
      students: finalMonthlyMatrix?.students,
      studentsLength: finalMonthlyMatrix?.students?.length,
      selectedMonth,
      selectedYear,
    });

    if (!filters.classId) {
      alert(t("attendance.monthly.selectClassFirst"));
      return;
    }

    if (
      !finalMonthlyMatrix?.students ||
      finalMonthlyMatrix.students.length === 0
    ) {
      alert(t("attendance.monthly.noDataForExport"));
      return;
    }

    setIsExportingPDF(true);
    try {
      console.log("🔄 Refreshing monthly data before export...");
      await refetchMonthly();

      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
        .toISOString()
        .split("T")[0];
      const endDate = new Date(selectedYear, selectedMonth, 0)
        .toISOString()
        .split("T")[0];
      const monthName = new Date(
        selectedYear,
        selectedMonth - 1
      ).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      console.log("🚀 Starting PDF export");

      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

      // ==========================================
      // Page 1: Attendance Summary Table
      // ==========================================

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 22, "F");

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Monthly Attendance Report", pageWidth / 2, 9, {
        align: "center",
      });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("School Management System", pageWidth / 2, 16, {
        align: "center",
      });

      // Info Bar
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(243, 244, 246);
      doc.rect(0, 22, pageWidth, 13, "F");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Class:", 12, 29);
      doc.setFont("helvetica", "normal");
      doc.text(selectedClass?.name || "N/A", 25, 29);

      doc.setFont("helvetica", "bold");
      doc.text("Month:", 80, 29);
      doc.setFont("helvetica", "normal");
      doc.text(monthName, 96, 29);

      doc.setFont("helvetica", "bold");
      doc.text("Total Students:", 160, 29);
      doc.setFont("helvetica", "normal");
      doc.text(finalMonthlyMatrix.students.length.toString(), 191, 29);

      doc.setFont("helvetica", "bold");
      doc.text("Generated:", pageWidth - 65, 29);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString("en-US"), pageWidth - 45, 29);

      // Summary Table
      const summaryHeaders = [
        "#",
        "Student Name",
        "Roll No",
        "Present",
        "Absent",
        "Late",
        "Excused",
        "Total",
        "Rate %",
      ];

      const summaryData = finalMonthlyMatrix.students.map(
        (student: any, index: number) => {
          const summary = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: daysInMonth,
          };

          Object.values(student.dailyAttendance || {}).forEach((day: any) => {
            if (day?.status === "PRESENT") summary.present++;
            else if (day?.status === "ABSENT") summary.absent++;
            else if (day?.status === "LATE") summary.late++;
            else if (day?.status === "EXCUSED") summary.excused++;
          });

          const attendanceRate =
            summary.total > 0
              ? Math.round(
                  ((summary.present + summary.late) / summary.total) * 100
                )
              : 0;

          return [
            (index + 1).toString(),
            getStudentName(student),
            student.rollNo || "N/A",
            summary.present.toString(),
            summary.absent.toString(),
            summary.late.toString(),
            summary.excused.toString(),
            summary.total.toString(),
            `${attendanceRate}%`,
          ];
        }
      );

      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          head: [summaryHeaders],
          body: summaryData,
          startY: 40,
          margin: { left: 12, right: 12 },
          styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [209, 213, 219],
            lineWidth: 0.1,
            halign: "center",
            valign: "middle",
          },
          headStyles: {
            fillColor: [107, 114, 128],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            halign: "center",
          },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 70, halign: "left" },
            2: { cellWidth: 18, halign: "center" },
            3: { cellWidth: 18, halign: "center" },
            4: { cellWidth: 18, halign: "center" },
            5: { cellWidth: 18, halign: "center" },
            6: { cellWidth: 18, halign: "center" },
            7: { cellWidth: 20, halign: "center" },
            8: { cellWidth: 22, halign: "center" },
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          didDrawCell: (data: any) => {
            if (data.column.index === 8 && data.row.index >= 0) {
              const cellValue = data.cell.text[0];
              if (typeof cellValue === "string") {
                const percentage = parseInt(cellValue.replace("%", ""));
                if (percentage >= 90) {
                  data.cell.styles.fillColor = [219, 234, 254];
                  data.cell.styles.textColor = [30, 64, 175];
                  data.cell.styles.fontStyle = "bold";
                } else if (percentage >= 75) {
                  data.cell.styles.fillColor = [243, 244, 246];
                  data.cell.styles.textColor = [75, 85, 99];
                } else {
                  data.cell.styles.fillColor = [243, 244, 246];
                  data.cell.styles.textColor = [107, 114, 128];
                }
              }
            }
          },
        });
      }

      // Footer Statistics
      const totalPresent = summaryData.reduce(
        (sum: number, row: any) => sum + parseInt(row[3]),
        0
      );
      const totalAbsent = summaryData.reduce(
        (sum: number, row: any) => sum + parseInt(row[4]),
        0
      );
      const totalLate = summaryData.reduce(
        (sum: number, row: any) => sum + parseInt(row[5]),
        0
      );
      const totalExcused = summaryData.reduce(
        (sum: number, row: any) => sum + parseInt(row[6]),
        0
      );
      const overallRate =
        totalPresent + totalAbsent + totalLate + totalExcused > 0
          ? Math.round(
              ((totalPresent + totalLate) /
                (totalPresent + totalAbsent + totalLate + totalExcused)) *
                100
            )
          : 0;

      doc.setFillColor(243, 244, 246);
      doc.rect(0, pageHeight - 22, pageWidth, 22, "F");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);

      const footerY = pageHeight - 14;
      doc.text("Overall Statistics:", 12, footerY);

      doc.setFont("helvetica", "normal");
      doc.text(`Total Present: ${totalPresent}`, 55, footerY);
      doc.text(`Total Absent: ${totalAbsent}`, 105, footerY);
      doc.text(`Total Late: ${totalLate}`, 150, footerY);
      doc.text(`Total Excused: ${totalExcused}`, 185, footerY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Overall Attendance: ${overallRate}%`, 235, footerY);

      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(107, 114, 128);
      doc.text(
        "Color Legend: Blue (≥90%) | Gray (75-89%) | Light Gray (<75%)",
        12,
        pageHeight - 7
      );

      // ==========================================
      // Pages 2+: Daily Attendance Matrix
      // ==========================================
      const maxDaysPerPage = 18; // Days that fit comfortably
      const totalMatrixPages = Math.ceil(daysInMonth / maxDaysPerPage);

      for (let page = 0; page < totalMatrixPages; page++) {
        doc.addPage();

        const startDay = page * maxDaysPerPage + 1;
        const endDay = Math.min((page + 1) * maxDaysPerPage, daysInMonth);

        // Header
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, pageWidth, 18, "F");

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("Daily Attendance Matrix", pageWidth / 2, 8, {
          align: "center",
        });

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${monthName} | Days ${startDay}-${endDay}`,
          pageWidth / 2,
          14,
          { align: "center" }
        );

        // Prepare headers
        const matrixHeaders = ["#", "Student Name", "Roll"];

        for (let day = startDay; day <= endDay; day++) {
          const date = new Date(selectedYear, selectedMonth - 1, day);
          const dayName = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          matrixHeaders.push(`${day}\n${dayName}`);
        }

        // Prepare table data
        const matrixData = finalMonthlyMatrix.students.map(
          (student: any, index: number) => {
            const row = [
              (index + 1).toString(),
              student.studentName,
              student.rollNo || "N/A",
            ];

            for (let day = startDay; day <= endDay; day++) {
              const dateStr = new Date(selectedYear, selectedMonth - 1, day)
                .toISOString()
                .split("T")[0];
              const attendance = student.dailyAttendance[dateStr];

              if (attendance?.status) {
                // Use single letter abbreviations
                const statusSymbol = {
                  PRESENT: "P",
                  ABSENT: "A",
                  LATE: "L",
                  EXCUSED: "E",
                };
                row.push(
                  statusSymbol[
                    attendance.status as keyof typeof statusSymbol
                  ] || "-"
                );
              } else {
                row.push("-");
              }
            }

            return row;
          }
        );

        // Add matrix table
        if (typeof doc.autoTable === "function") {
          const columnStyles: any = {
            0: { cellWidth: 8, halign: "center" }, // #
            1: { cellWidth: 50, halign: "left" }, // Student Name
            2: { cellWidth: 15, halign: "center" }, // Roll No
          };

          // Dynamic column widths for days
          const remainingWidth = pageWidth - 12 - 12 - 8 - 50 - 15; // margins and fixed columns
          const dayColumnWidth = remainingWidth / (endDay - startDay + 1);

          for (let i = 3; i < matrixHeaders.length; i++) {
            columnStyles[i] = {
              cellWidth: Math.max(dayColumnWidth, 8),
              halign: "center",
            };
          }

          doc.autoTable({
            head: [matrixHeaders],
            body: matrixData,
            startY: 22,
            margin: { left: 12, right: 12 },
            styles: {
              fontSize: 7,
              cellPadding: 1.5,
              lineColor: [209, 213, 219],
              lineWidth: 0.1,
              halign: "center",
              valign: "middle",
            },
            headStyles: {
              fillColor: [107, 114, 128],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 7,
              halign: "center",
              valign: "middle",
            },
            columnStyles: columnStyles,
            alternateRowStyles: {
              fillColor: [249, 250, 251],
            },
            didDrawCell: (data: any) => {
              // Color code attendance status
              if (data.row.index >= 0 && data.column.index >= 3) {
                const cellValue = data.cell.text[0];

                if (cellValue === "P") {
                  data.cell.styles.fillColor = [219, 234, 254]; // Light blue
                  data.cell.styles.textColor = [30, 64, 175]; // Dark blue
                  data.cell.styles.fontStyle = "bold";
                } else if (cellValue === "A") {
                  data.cell.styles.fillColor = [243, 244, 246]; // Light gray
                  data.cell.styles.textColor = [107, 114, 128]; // Gray
                } else if (cellValue === "L") {
                  data.cell.styles.fillColor = [243, 244, 246]; // Light gray
                  data.cell.styles.textColor = [107, 114, 128]; // Gray
                } else if (cellValue === "E") {
                  data.cell.styles.fillColor = [243, 244, 246]; // Light gray
                  data.cell.styles.textColor = [107, 114, 128]; // Gray
                } else if (cellValue === "-") {
                  data.cell.styles.fillColor = [249, 250, 251]; // Very light gray
                  data.cell.styles.textColor = [209, 213, 219]; // Very light text
                }
              }

              // Highlight weekends
              if (data.row.section === "head" && data.column.index >= 3) {
                const dayIndex = startDay + (data.column.index - 3);
                const date = new Date(
                  selectedYear,
                  selectedMonth - 1,
                  dayIndex
                );
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                if (isWeekend) {
                  data.cell.styles.fillColor = [249, 115, 22]; // Orange for weekends
                }
              }
            },
          });
        }

        // Footer - Legend and Page Number
        doc.setFillColor(243, 244, 246);
        doc.rect(0, pageHeight - 15, pageWidth, 15, "F");

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(75, 85, 99);
        doc.text(
          "Legend: P = Present | A = Absent | L = Late | E = Excused | - = No Record",
          12,
          pageHeight - 8
        );

        doc.setFont("helvetica", "bold");
        doc.text(
          `Page ${page + 2} of ${totalMatrixPages + 1}`,
          pageWidth - 30,
          pageHeight - 8
        );
      }

      // Save the PDF
      const fileName = `Attendance_Report_${selectedClass?.name.replace(
        /\s+/g,
        "_"
      )}_${monthName.replace(/\s+/g, "_")}.pdf`;
      doc.save(fileName);

      console.log("✅ PDF export successful");
      alert(t("attendance.export.pdfSuccess"));
      } catch (error) {
      console.error("❌ PDF export failed:", error);
      alert(
        `${t("attendance.export.pdfError")}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsExportingPDF(false);
    }
  };
  const selectedClass = classes.find((c) => c.id === filters.classId);
  const isLoading =
    classesLoading || attendanceLoading || summaryLoading || statsLoading;

  // Debug logging (remove in production)
  ({
    classesLoading,
    classes: classes.length,
    selectedClass,
    filters,
    attendanceLoading,
    attendanceData,
    records: Array.isArray(records) ? records.length : "Not an array",
    students: students.length,
    studentsData: students,
    studentsLoading,
    studentsError,
    stats: stats,
    statsLoading,
    statsError,
    classId: filters.classId,
    attendanceSummary,
    attendanceSummaryLoading,
    attendanceSummaryError,
    finalMonthlyMatrix,
    finalMonthlyLoading,
    monthlyError,
  });

  if (classesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (classesError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCalendarAlt className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Classes
          </h3>
          <p className="text-gray-500 mb-4">
            There was an error loading classes. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCalendarAlt className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("attendance.noClasses")}
          </h3>
          <p className="text-gray-500">
            {t("attendance.noClassesDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-x-hidden">
      <div className="p-4 sm:p-6 max-w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-3xl font-bold text-gray-900">
                {t("attendance.header")}
              </h1>
              <p className="text-sm md:text-md text-gray-600">
                {t("attendance.track")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <FaUserClock className="w-4 h-4" />
                <span className="hidden sm:inline-block">{t('attendance.markLeave')}</span>
              </button>
            </div>
          </div>

          {/* Global Student Search - Shows students from all classes */}

          <div className="flex-1 max-w-full my-4">
            <div className="relative">
              <div className="absolute inset-y-5 left-0  pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
                {/* <label className="text-sm font-medium text-gray-700">
                {t("attendance.searchAllStudents") || "Search All Students"}
              </label> */}
              </div>
            </div>
            <input
              type="text"
              placeholder={
                t("attendance.searchStudentPlaceholder") ||
                "Enter student name or roll number..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />

            {searchQuery && (
              <div className="mt-2 text-xs text-gray-500">
                Searching across {classes.length} classes...
              </div>
            )}
            {/* Global Search Results with Attendance Cards - Progressive Loading */}
            {searchQuery &&
              (searchResults.length > 0 ||
                displayedSearchResults.length > 0) && (
                <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      Found {searchResults.length} student(s)
                      {displayedSearchResults.length < searchResults.length &&
                        ` - Showing ${displayedSearchResults.length}...`}
                    </p>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {displayedSearchResults.map((student, index) => {
                      // Get attendance data for searched student from cache
                      const studentClass = classes.find(
                        (c) => c.id === student.classId
                      );

                      const classSummary =
                        cachedAttendanceData[student.classId || ""];

                      const studentAttendance =
                        classSummary?.students?.find(
                          (att: any) => att.studentId === student.id.toString()
                        ) || searchedStudentsAttendance[student.id];

                      return (
                        <div
                          key={student.id || index}
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              classId: student.classId || "",
                              studentId: student.id,
                            }));
                            setSearchQuery("");
                          }}
                          className="cursor-pointer transition-shadow animate-fadeIn"
                        >
                          <StudentAttendanceCard
                            student={student}
                            attendance={studentAttendance}
                            onMarkInTime={() => handleMarkInTime(student.id)}
                            onMarkOutTime={() => handleMarkOutTime(student.id)}
                            isMarkingIn={markInTimeMutation.isPending}
                            isMarkingOut={markOutTimeMutation.isPending}
                          />
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Class: {studentClass?.name || "Unknown"}
                          </p>
                        </div>
                      );
                    })}
                    {displayedSearchResults.length < searchResults.length && (
                      <div className="col-span-full flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* No results message */}
            {searchQuery && searchResults.length === 0 && (
              <div className="mt-4 px-4 py-8 text-center border border-gray-200 rounded-lg bg-gray-50">
                <svg
                  className="h-12 w-12 text-gray-400 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
                <p className="text-gray-600 text-sm">
                  No students found matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick today's total attendance stats for all classes */}
        <TodayAttendanceSummary />

        {/* Class Selector */}
        <div className="mb-2 sm:mb-6">
          <style>{`
            @keyframes slideInFromRight {
              from {
                opacity: 0;
                transform: translateX(15px) scale(0.9);
              }
              to {
                opacity: 1;
                transform: translateX(0) scale(1);
              }
            }
            @keyframes slideOutToRight {
              from {
                opacity: 1;
                transform: translateX(0) scale(1);
              }
              to {
                opacity: 0;
                transform: translateX(15px) scale(0.9);
              }
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            .slide-in-from-right {
              animation: slideInFromRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .slide-out-to-right {
              animation: slideOutToRight 0.3s ease-in forwards;
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-in forwards;
            }
          `}</style>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            {(() => {
              // Sort classes first
              const sortedClasses = [...classes].sort((a, b) => {
                const aName = a.name.toLowerCase().trim();
                const bName = b.name.toLowerCase().trim();
                const aSection = (a.section || a.code || "")
                  .toLowerCase()
                  .trim();
                const bSection = (b.section || b.code || "")
                  .toLowerCase()
                  .trim();

                const getSortPriority = (name: string) => {
                  if (name === "prep") return 0;
                  const num = parseInt(name);
                  return isNaN(num) ? 1000 : num + 1;
                };

                const aPriority = getSortPriority(aName);
                const bPriority = getSortPriority(bName);

                if (aPriority !== bPriority) {
                  return aPriority - bPriority;
                }

                if (aSection !== bSection) {
                  if (!aSection) return 1;
                  if (!bSection) return -1;
                  return aSection.localeCompare(bSection);
                }

                return 0;
              });

              // Group classes by name
              const groupedClasses = sortedClasses.reduce((acc, cls) => {
                const name = cls.name.toLowerCase().trim();
                if (!acc[name]) {
                  acc[name] = [];
                }
                acc[name].push(cls);
                return acc;
              }, {} as Record<string, typeof classes>);

              // Sort grouped entries by the same priority logic
              const getSortPriority = (name: string) => {
                if (name === "prep") return 0;
                const num = parseInt(name);
                return isNaN(num) ? 1000 : num + 1;
              };

              const sortedGroupEntries = Object.entries(groupedClasses).sort(
                ([aName], [bName]) => {
                  const aPriority = getSortPriority(aName);
                  const bPriority = getSortPriority(bName);
                  return aPriority - bPriority;
                }
              );

              // Render groups
              return sortedGroupEntries.map(([groupName, groupClasses]) => {
                const isExpanded = expandedClassGroups.has(groupName);
                const hasMultiple = groupClasses.length > 1;
                const isSelected = groupClasses.some(
                  (cls) => filters.classId === cls.id
                );

                return (
                  <React.Fragment key={`group-${groupName}`}>
                    {/* Main group button - always visible */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasMultiple) {
                          // Toggle expand/collapse
                          setExpandedClassGroups((prev) => {
                            const newSet = new Set(prev);
                            if (isExpanded) {
                              newSet.delete(groupName);
                            } else {
                              newSet.add(groupName);
                            }
                            return newSet;
                          });
                        } else {
                          // Single class - select it directly
                          handleClassSelect(groupClasses[0].id);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                        isSelected && !isExpanded
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                      }`}
                    >
                      <span>{groupClasses[0].name}</span>
                      {hasMultiple && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isSelected && !isExpanded
                              ? "bg-white bg-opacity-30 text-white"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          +{groupClasses.length}
                        </span>
                      )}
                    </button>

                    {/* Expanded class codes - shown to the right when expanded */}
                    {hasMultiple && (
                      <div
                        className={`flex items-center gap-2 transition-all duration-300 ${
                          isExpanded
                            ? "opacity-100 max-w-[1000px]"
                            : "opacity-0 max-w-0 overflow-hidden"
                        }`}
                      >
                        {groupClasses.map((cls, index) => {
                          const isClassSelected = filters.classId === cls.id;
                          const classCode = cls.code || cls.section || "";
                          return (
                            <button
                              key={cls.id}
                              onClick={() => handleClassSelect(cls.id)}
                              title={`Class: ${cls.name} ${
                                classCode ? `(${classCode})` : ""
                              }`}
                              className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap flex-shrink-0 ${
                                isExpanded ? "slide-in-from-right" : ""
                              } ${
                                isClassSelected
                                  ? "bg-indigo-600 text-white shadow-md border-2 border-indigo-700"
                                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-2 border-indigo-200"
                              }`}
                              style={{
                                animationDelay: isExpanded
                                  ? `${index * 60}ms`
                                  : "0ms",
                              }}
                            >
                              {classCode || cls.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              });
            })()}
            {!filters.classId && (
              <div className="flex items-center gap-2 text-gray-500 text-sm whitespace-nowrap flex-shrink-0 ml-2">
                <FaExclamationCircle className="w-4 h-4" />
                <span>No class selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Class Info */}
        {selectedClass && (
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedClass.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedClass.schedule} • {selectedClass.room} •{" "}
                  {students.length} students
                  {studentsLoading && (
                    <span className="ml-2 text-blue-600">(Loading...)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-8 overflow-x-auto">
              {[
                {
                  id: "overview",
                  label: t("attendance.tabs.overview"),
                  icon: FaList,
                },
                {
                  id: "analytics",
                  label: t("attendance.tabs.analytics"),
                  icon: FaChartBar,
                },
                {
                  id: "monthly",
                  label: t("attendance.tabs.monthly"),
                  icon: FaCalendarWeek,
                },
                { id: "list", label: t("attendance.tabs.list"), icon: FaList },
                {
                  id: "table",
                  label: t("attendance.tabs.table"),
                  icon: FaTable,
                },
                {
                  id: "bulk",
                  label: t("attendance.tabs.bulkAttendance"),
                  icon: FaUpload,
                },
                { id: "sms", label: t("attendance.tabs.sms"), icon: FaSms },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Summary Stats */}
              {summaryLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                    >
                      <div className="animate-pulse">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : summaryError ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaList className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Error Loading Summary
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {summaryError.message ||
                      "Failed to load attendance summary"}
                  </p>
                  <button
                    onClick={() => refetchSummary()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : summary ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaList className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          {t("attendance.summaryCards.present")}
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {Math.max(0, Math.round(summary.present || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <FaList className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          {t("attendance.summaryCards.absent")}
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {Math.max(0, Math.round(summary.absent || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <FaList className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          {t("attendance.summaryCards.late")}
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {Math.max(0, Math.round(summary.late || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FaUserClock className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          {t("attendance.studentCard.status.leave")}
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {Math.max(0, Math.round(summary.excused || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex col-span-2 md:col-span-1">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FaList className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">
                          {t("attendance.studentCard.status.attendanceRate")}
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {(() => {
                            const rate = summary.attendanceRate || 0;
                            // If rate is already a percentage (0-100), use it directly
                            // If rate is a decimal (0-1), multiply by 100
                            let percentage = rate > 1 ? rate : rate * 100;

                            // If the calculated rate seems wrong (over 100%), recalculate from raw data
                            if (percentage > 100) {
                              const total =
                                (summary.present || 0) +
                                (summary.absent || 0) +
                                (summary.late || 0) +
                                (summary.excused || 0);
                              percentage =
                                total > 0
                                  ? ((summary.present || 0) / total) * 100
                                  : 0;
                            }

                            return Math.round(
                              Math.min(Math.max(percentage, 0), 100)
                            );
                          })()}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaList className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("attendance.noSummry")}
                  </h3>
                  <p className="text-gray-500">
                    {t("attendance.noSummryDesc")}
                  </p>
                </div>
              )}

              {/* Students List with Attendance - Show when class is selected */}
              {filters.classId && (
                <div className="mb-6">
                  {(() => {
                    ({
                      classId: filters.classId,
                      studentsCount: students.length,
                      studentsLoading,
                      studentsError,
                      attendanceSummary,
                    });
                    return null;
                  })()}
                  {studentsError ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaList className="w-8 h-8 text-red-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t("attendance.error")}
                      </h3>
                      <p className="text-gray-500">
                        {t("attendance.errorDesc")}
                      </p>
                    </div>
                  ) : studentsLoading || attendanceSummaryLoading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">
                        {t("attendance.studentsLoading")}
                      </p>
                    </div>
                  ) : students.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t("attendance.classSelection.selectClass")}{" "}
                          {selectedClass?.name}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-gray-500">
                            {t("attendance.classSelection.studentsInClass", {
                              count: students.length,
                            })}
                          </p>
                          {attendanceSummary && (
                            <div className="text-sm text-gray-500">
                              <span className="text-green-600 font-medium">
                                {attendanceSummary.present}
                              </span>{" "}
                              {t("attendance.studentCard.status.present")}
                              <span className="text-red-600 font-medium ml-1">
                                {attendanceSummary.absent}
                              </span>{" "}
                              {t("attendance.studentCard.status.absent")}
                              <span className="text-yellow-600 font-medium ml-1">
                                {attendanceSummary.late}
                              </span>{" "}
                              {t("attendance.studentCard.status.late")}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Student Cards Grid */}
                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {students.map((student, index) => {
                            // Get attendance data for this student
                            const studentAttendance =
                              attendanceSummary?.students?.find(
                                (att: any) =>
                                  att.studentId === student.id.toString()
                              );

                            return (
                              <StudentAttendanceCard
                                key={student.id || index}
                                student={student}
                                attendance={studentAttendance}
                                onMarkInTime={handleMarkInTime}
                                onMarkOutTime={handleMarkOutTime}
                                isMarkingIn={markInTimeMutation.isPending}
                                isMarkingOut={markOutTimeMutation.isPending}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaList className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Students Found
                      </h3>
                      <p className="text-gray-500">
                        No students are enrolled in this class.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Attendance List */}
              <AttendanceList
                records={records}
                students={students}
                onEdit={handleEditAttendance}
                onAdd={handleAddAttendance}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                loading={attendanceLoading}
              />
            </>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Hijri Shamsi Month Tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                  <button
                    onClick={() => setSelectedHijriMonth(null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedHijriMonth === null
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    {t('attendance.allMonth')}
                  </button>
                  {hijriMonths.map((month) => (
                    <button
                      key={month.id}
                      onClick={() => setSelectedHijriMonth(month.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                        selectedHijriMonth === month.id
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                      }`}
                    >
                      {t(`shamsiMonths.${month.key}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats Component */}
              {filteredStats || stats ? (
                <AttendanceStatsComponent
                  stats={filteredStats || stats}
                  loading={statsLoading}
                  onRefresh={refetchStats}
                  selectedHijriMonth={selectedHijriMonth}
                  selectedHijriYear={selectedHijriYear}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Analytics Data
                    </h3>
                    <p className="text-gray-500">
                      Analytics data is not available at the moment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "monthly" && (
            <div className="bg-white rounded-lg shadow-lg border-2 border-gray-300 overflow-hidden">
              {/* Header Section */}
              <div className="bg-linear-to-r from-blue-600 to-blue-700 px-2 pt-4 sm:px-6 sm:pt-6 text-white">
                <h3 className="text-2xl font-bold mb-0 text-gray-900 text-center">
                  {selectedClass?.name || t("attendance.monthly.selectClass")} -{" "}
                  {t("attendance.monthly.title")}
                </h3>
                <div className="flex items-center justify-between flex-wrap">
                  {/* Left Side - Title and Month */}
                  <div className="flex-1 pr-6">
                    {/* Calendar Type Selector (Hijri only) */}
                    {/* <div className="flex items-center gap-3 mb-4 bg-blue-300">
                      <div className="flex items-center gap-2 rounded-full px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 shadow-md">
                        <span className="px-1 py-0.5 rounded-full text-sm font-semibold text-white">Hijri Shamsi</span>
                      </div>
                      <div>
                        <p className="text-blue-100 text-lg font-medium">
                          {calendarType === 'miladi' 
                            ? new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            : `${t(`shamsiMonths.${getShamsiMonthName(selectedHijriMonth)}`)} ${selectedHijriYear}`
                          }
                        </p>
                        {calendarType === 'hijri' && (() => {
                          const { startISO, endISO } = shamsiMonthRangeToGregorian(selectedHijriYear, selectedHijriMonth);
                          const startDate = new Date(startISO);
                          const endDate = new Date(endISO);
                          const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          return (
                            <p className="text-blue-200 text-sm mt-1">
                              ({startFormatted} - {endFormatted})
                            </p>
                          );
                        })()}
                      </div>
                    </div> */}

                    {/* Month Navigation */}
                    <div className="flex items-center gap-3 bg-blue-100  rounded-full p-1 border border-blue-200  w-max  mx-auto md:mx-0 mt-4 md:mt-0">
                      <button
                        onClick={() => {
                          if (calendarType === "miladi") {
                            if (selectedMonth > 1) {
                              setSelectedMonth(selectedMonth - 1);
                            } else {
                              setSelectedMonth(12);
                              setSelectedYear(selectedYear - 1);
                            }
                          } else {
                            if (selectedHijriMonth > 1) {
                              setSelectedHijriMonth(selectedHijriMonth - 1);
                            } else {
                              setSelectedHijriMonth(12);
                              setSelectedHijriYear(selectedHijriYear - 1);
                            }
                          }
                        }}
                        className="w-9 h-9 text-blue-600 rounded-full bg-blue-200  border border-blue-300  flex items-center justify-center hover:bg-blue-300 transition-all duration-200 shadow-lg"
                      >
                        <FaChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="px-2 bg-linear-to-r from-blue-50 to-blue-100 rounded-full border border-blue-200 min-w-40 sm:min-w-[220px] text-center">
                        <div className="flex flex-col sm:flex-row sm:gap-2 items-center p-2 sm:p-0 ">
                          <span className="text-blue-600 font-bold text-lg">
                            {calendarType === "miladi"
                              ? new Date(
                                  selectedYear,
                                  selectedMonth - 1
                                ).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })
                              : `${t(
                                  `shamsiMonths.${getShamsiMonthName(
                                    selectedHijriMonth
                                  )}`
                                )} ${selectedHijriYear}`}
                          </span>
                          {calendarType === "hijri" &&
                            (() => {
                              const { startISO, endISO } =
                                shamsiMonthRangeToGregorian(
                                  selectedHijriYear,
                                  selectedHijriMonth
                                );
                              const startDate = new Date(startISO);
                              const endDate = new Date(endISO);
                              const startFormatted =
                                startDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                });
                              const endFormatted = endDate.toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              );
                              return (
                                <div className="text-blue-600 text-xs mt-1 ">
                                  ({startFormatted} - {endFormatted})
                                </div>
                              );
                            })()}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (calendarType === "miladi") {
                            if (selectedMonth < 12) {
                              setSelectedMonth(selectedMonth + 1);
                            } else {
                              setSelectedMonth(1);
                              setSelectedYear(selectedYear + 1);
                            }
                          } else {
                            if (selectedHijriMonth < 12) {
                              setSelectedHijriMonth(selectedHijriMonth + 1);
                            } else {
                              setSelectedHijriMonth(1);
                              setSelectedHijriYear(selectedHijriYear + 1);
                            }
                          }
                        }}
                        className="w-9 h-9 text-blue-600 rounded-full bg-blue-200  border border-blue-300  flex items-center justify-center hover:bg-blue-300 transition-all duration-200 shadow-lg"
                      >
                        <FaChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Right Side - Controls */}
                  <div className="flex items-center  gap-3 bg-white bg-opacity-10 rounded-2xl p-3 border border-white border-opacity-20  flex-wrap mt-4 md:mt-0">
                    {/* Refresh Button */}
                    <button
                      onClick={() => refetchMonthly()}
                      className="w-10 h-10 rounded-full bg-gray-100  border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-all duration-200 shadow-lg"
                    >
                      <FaRedo className="w-4 h-4" />
                    </button>

                    {/* View Selector */}
                    {/* <div className="flex gap-1">
                      <button className="px-4 py-2 rounded-2xl bg-white bg-opacity-20 border border-white border-opacity-25 text-white text-sm font-semibold shadow-lg">
                        {t('attendance.monthly.matrix')}
                      </button>
                    </div> */}

                    {/* Mark Absent + Export Buttons */}
                    <button
                      onClick={handleMarkIncompleteAsAbsent}
                      disabled={markingAbsent}
                      className={`flex items-center w-47 sm:w-auto gap-2 px-4 py-2 rounded-full text-red-600 border border-red-200 text-sm font-bold shadow-lg transition-all duration-200 ${
                        markingAbsent
                          ? "bg-red-300 cursor-not-allowed"
                          : "bg-red-100 hover:bg-red-200"
                      }`}
                    >
                      {markingAbsent ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <FaUserTimes className="w-4 h-4" />
                      )}
                      <span>
                        {markingAbsent
                          ? t("attendance.monthly.marking")
                          : t("attendance.monthly.markAllAbsent")}
                      </span>
                    </button>

                    {/* Export Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={handleExportExcel}
                        disabled={
                          isExportingExcel || isExportingPDF || monthlyLoading
                        }
                        className={`flex items-center w-full sm:w-auto gap-2 px-4 py-2 rounded-full border border-green-200 text-green-600 text-sm font-bold shadow-lg transition-all duration-200 ${
                          isExportingExcel || monthlyLoading
                            ? "bg-green-300 cursor-not-allowed"
                            : "bg-green-100 hover:bg-green-200"
                        }`}
                      >
                        {isExportingExcel ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <FaTable className="w-4 h-4" />
                        )}
                        <span>
                          {isExportingExcel
                            ? t("attendance.export.exporting")
                            : monthlyLoading
                            ? t("attendance.monthly.loading")
                            : t("attendance.export.excel")}
                        </span>
                      </button>
                      <button
                        onClick={handleExportExcelDari}
                        disabled={
                          isExportingExcel || isExportingPDF || monthlyLoading
                        }
                        className={`flex flex-row items-center w-full sm:w-auto gap-2 px-4 py-2 rounded-full border border-green-200 text-green-600 text-sm font-bold shadow-lg transition-all duration-200 ${
                          isExportingExcel || monthlyLoading
                            ? "bg-green-300 cursor-not-allowed"
                            : "bg-green-100 hover:bg-green-200"
                        }`}
                      >
                        <span className="flex flex-row items-center gap-2">
                          <FaTable className="w-4 h-4" />

                          {t("attendance.dariExport")}
                        </span>
                      </button>

                      {/* <button
                        onClick={handleExportPDF}
                        disabled={
                          isExportingExcel || isExportingPDF || monthlyLoading
                        }
                        className={`flex items-center w-full sm:w-auto gap-2 px-4 py-2 rounded-full border border-green-200 text-green-600 text-sm font-bold shadow-lg transition-all duration-200 ${
                          isExportingPDF || monthlyLoading
                            ? "bg-green-300 cursor-not-allowed"
                            : "bg-green-100 hover:bg-green-200"
                        }`}
                      >
                        {isExportingPDF ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <FaFilePdf className="w-4 h-4" />
                        )}
                        <span>
                          {isExportingPDF
                            ? t("attendance.export.exporting")
                            : monthlyLoading
                            ? t("attendance.monthly.loading")
                            : t("attendance.export.pdf")}
                        </span>
                      </button> */}

                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {!filters.classId ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📚</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t("attendance.monthly.selectClass")}
                    </h3>
                    <p className="text-gray-500">
                      {t("attendance.monthly.selectClassDescription")}
                    </p>
                  </div>
                ) : monthlyLoading ? (
                  <div className="flex items-center justify-center gap-3 py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">
                      {t("attendance.monthly.loading")}
                    </span>
                  </div>
                ) : monthlyError ? (
                  <div className="text-center py-12">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t("attendance.monthly.error")}
                    </h3>
                    <p className="text-gray-500 mb-4">{monthlyError.message}</p>
                    <button
                      onClick={() => refetchMonthly()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      {t("attendance.monthly.tryAgain")}
                    </button>
                  </div>
                ) : finalMonthlyMatrix &&
                  finalMonthlyMatrix.students &&
                  finalMonthlyMatrix.students.length > 0 ? (
                  <>
                    {/* Legend */}
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                      <div className="flex justify-center gap-4 sm:gap-8 w-full  mx-auto flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">
                            {t("attendance.monthly.legend.present")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">
                            {t("attendance.monthly.legend.absent")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">
                            {t("attendance.monthly.legend.late")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">
                            {t("attendance.monthly.legend.excused")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Section - Moved to Top */}
                    <div className="bg-gray-50 border-2 border-black px-4 py-4 mb-4">
                      <div className="flex justify-around">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">
                            Total Students
                          </div>
                          <div className="text-lg font-bold text-black">
                            {finalMonthlyMatrix.students.length}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">
                            Month
                          </div>
                          <div className="text-lg font-bold text-black">
                            {calendarType === "miladi"
                              ? new Date(
                                  selectedYear,
                                  selectedMonth - 1
                                ).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })
                              : `${t(
                                  `shamsiMonths.${getShamsiMonthName(
                                    selectedHijriMonth
                                  )}`
                                )} ${selectedHijriYear}`}
                          </div>
                          {calendarType === "hijri" &&
                            (() => {
                              const { startISO, endISO } =
                                shamsiMonthRangeToGregorian(
                                  selectedHijriYear,
                                  selectedHijriMonth
                                );
                              const startDate = new Date(startISO);
                              const endDate = new Date(endISO);
                              const startFormatted =
                                startDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                });
                              const endFormatted = endDate.toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              );
                              return (
                                <div className="text-xs text-gray-500 mt-1">
                                  ({startFormatted} - {endFormatted})
                                </div>
                              );
                            })()}
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">Days</div>
                          <div className="text-lg font-bold text-black">
                            {calendarType === "miladi"
                              ? new Date(
                                  selectedYear,
                                  selectedMonth,
                                  0
                                ).getDate()
                              : getDaysInShamsiMonth(
                                  selectedHijriYear,
                                  selectedHijriMonth
                                )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Matrix Table */}

                    <div className="overflow-x-auto border-2 border-black">
                      <div className="min-w-fit lg:min-w-full bg-white">
                        {/* Header Row with Dates */}
                        <div className="flex bg-gray-200 border-b border-black">
                          {/* Student Info Column */}
                          <div className="w-40 bg-gray-200 border-r-2 border-black px-2 py-3">
                            <div className="text-center">
                              <span className="text-xs font-bold text-black">
                                {t("attendance.monthly.studentInfo")}
                              </span>
                            </div>
                          </div>

                          {/* Date Columns */}
                          {Array.from(
                            {
                              length:
                                calendarType === "miladi"
                                  ? new Date(
                                      selectedYear,
                                      selectedMonth,
                                      0
                                    ).getDate()
                                  : getDaysInShamsiMonth(
                                      selectedHijriYear,
                                      selectedHijriMonth
                                    ),
                            },
                            (_, i) => {
                              const day = i + 1;
                              let displayDay: number;
                              let displayDayName: string;
                              let miladiDate: string | null = null;

                              if (calendarType === "miladi") {
                                const date = new Date(
                                  selectedYear,
                                  selectedMonth - 1,
                                  day
                                );
                                displayDay = day;
                                displayDayName = date.toLocaleDateString(
                                  "en-US",
                                  { weekday: "short" }
                                );
                              } else {
                                // For Hijri Shamsi, display the day number directly (1, 2, 3, ...)
                                // Get the corresponding Gregorian date for the weekday
                                const { startISO } =
                                  shamsiMonthRangeToGregorian(
                                    selectedHijriYear,
                                    selectedHijriMonth
                                  );
                                const startDate = new Date(startISO);
                                // Calculate the Gregorian date for this Hijri day (day 1 = start, day 2 = start + 1, etc.)
                                const gregorianDate = new Date(startDate);
                                gregorianDate.setDate(
                                  startDate.getDate() + day - 1
                                );
                                // Display the Hijri day number directly (1, 2, 3...)
                                displayDay = day;
                                displayDayName =
                                  gregorianDate.toLocaleDateString("en-US", {
                                    weekday: "short",
                                  });
                                // Get Miladi date for display
                                miladiDate = gregorianDate.toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                );
                              }

                              return (
                                <div
                                  key={day}
                                  className={`${
                                    calendarType === "hijri" ? "w-16" : "w-9"
                                  } border-r border-black ${
                                    i === 0 ? "border-l-2 border-l-black" : ""
                                  } bg-gray-200`}
                                >
                                  <div className="text-center py-1 px-0.5">
                                    <div className="text-xs font-bold text-black">
                                      {displayDay}
                                    </div>
                                    <div className="text-xs text-black opacity-80">
                                      {displayDayName}
                                    </div>
                                    {miladiDate && (
                                      <div className="text-[9px] text-gray-600 mt-0.5 leading-tight font-medium">
                                        {miladiDate}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>

                        {/* Daily Totals Row */}
                        <div className="flex bg-blue-50 border-b-2 border-black">
                          {/* Empty cell for Student Info column */}
                          <div className="w-40 bg-blue-50 border-r-2 border-black px-2 py-1">
                            <div className="text-center">
                              <span className="text-[10px] font-bold text-black">
                                Totals
                              </span>
                            </div>
                          </div>

                          {/* Daily Totals for each day */}
                          {Array.from(
                            {
                              length:
                                calendarType === "miladi"
                                  ? new Date(
                                      selectedYear,
                                      selectedMonth,
                                      0
                                    ).getDate()
                                  : getDaysInShamsiMonth(
                                      selectedHijriYear,
                                      selectedHijriMonth
                                    ),
                            },
                            (_, i) => {
                              const day = i + 1;
                              let dateStr: string;

                              if (calendarType === "miladi") {
                                const date = new Date(
                                  selectedYear,
                                  selectedMonth - 1,
                                  day
                                );
                                dateStr = date.toISOString().split("T")[0];
                              } else {
                                const { startISO } =
                                  shamsiMonthRangeToGregorian(
                                    selectedHijriYear,
                                    selectedHijriMonth
                                  );
                                const startDate = new Date(startISO);
                                const gregorianDate = new Date(startDate);
                                gregorianDate.setDate(
                                  startDate.getDate() + day - 1
                                );
                                dateStr = gregorianDate
                                  .toISOString()
                                  .split("T")[0];
                              }

                              // Calculate daily totals for this day
                              let dayPresent = 0;
                              let dayAbsent = 0;
                              let dayLate = 0;
                              let dayExcused = 0;

                              finalMonthlyMatrix.students.forEach(
                                (student: any) => {
                                  let validDateRange: {
                                    start: string;
                                    end: string;
                                  } | null = null;
                                  if (calendarType === "hijri") {
                                    const { startISO, endISO } =
                                      shamsiMonthRangeToGregorian(
                                        selectedHijriYear,
                                        selectedHijriMonth
                                      );
                                    validDateRange = {
                                      start: startISO,
                                      end: endISO,
                                    };
                                  }

                                  const filteredDailyAttendance: Record<
                                    string,
                                    any
                                  > = {};
                                  if (validDateRange) {
                                    Object.keys(
                                      student.dailyAttendance || {}
                                    ).forEach((dStr: string) => {
                                      if (
                                        dStr >= validDateRange!.start &&
                                        dStr <= validDateRange!.end
                                      ) {
                                        filteredDailyAttendance[dStr] =
                                          student.dailyAttendance[dStr];
                                      }
                                    });
                                  } else {
                                    Object.assign(
                                      filteredDailyAttendance,
                                      student.dailyAttendance || {}
                                    );
                                  }

                                  const attendance =
                                    filteredDailyAttendance[dateStr];
                                  if (attendance?.status) {
                                    if (attendance.status === "PRESENT")
                                      dayPresent++;
                                    else if (attendance.status === "ABSENT")
                                      dayAbsent++;
                                    else if (attendance.status === "LATE")
                                      dayLate++;
                                    else if (attendance.status === "EXCUSED")
                                      dayExcused++;
                                  }
                                }
                              );

                              // Get Miladi date for totals row when in Hijri mode
                              let miladiDateForTotals: string | null = null;
                              if (calendarType === "hijri") {
                                const { startISO } =
                                  shamsiMonthRangeToGregorian(
                                    selectedHijriYear,
                                    selectedHijriMonth
                                  );
                                const startDate = new Date(startISO);
                                const gregorianDate = new Date(startDate);
                                gregorianDate.setDate(
                                  startDate.getDate() + day - 1
                                );
                                miladiDateForTotals =
                                  gregorianDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  });
                              }

                              return (
                                <div
                                  key={day}
                                  className={`${
                                    calendarType === "hijri" ? "w-16" : "w-9"
                                  } border-r border-black ${
                                    i === 0 ? "border-l-2 border-l-black" : ""
                                  } bg-blue-50`}
                                >
                                  <div className="text-center py-0.5 px-0.5">
                                    {miladiDateForTotals && (
                                      <div className="text-[8px] text-gray-500 mb-0.5 leading-tight">
                                        {miladiDateForTotals}
                                      </div>
                                    )}
                                    <div className="text-[9px] font-bold text-green-600 leading-tight">
                                      P:{dayPresent}
                                    </div>
                                    <div className="text-[9px] font-bold text-red-600 leading-tight">
                                      A:{dayAbsent}
                                    </div>
                                    <div className="text-[9px] font-bold text-yellow-600 leading-tight">
                                      L:{dayLate}
                                    </div>
                                    <div className="text-[9px] font-bold text-purple-600 leading-tight">
                                      E:{dayExcused}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>

                        {/* Student Rows */}
                        {finalMonthlyMatrix.students.map(
                          (student: any, studentIndex: number) => {
                            // Calculate date range for filtering attendance data
                            let validDateRange: {
                              start: string;
                              end: string;
                            } | null = null;
                            if (calendarType === "hijri") {
                              const { startISO, endISO } =
                                shamsiMonthRangeToGregorian(
                                  selectedHijriYear,
                                  selectedHijriMonth
                                );
                              validDateRange = { start: startISO, end: endISO };
                            }

                            // Filter dailyAttendance to only include dates within the selected month range
                            const filteredDailyAttendance: Record<string, any> =
                              {};
                            if (validDateRange) {
                              Object.keys(
                                student.dailyAttendance || {}
                              ).forEach((dateStr: string) => {
                                if (
                                  dateStr >= validDateRange!.start &&
                                  dateStr <= validDateRange!.end
                                ) {
                                  filteredDailyAttendance[dateStr] =
                                    student.dailyAttendance[dateStr];
                                }
                              });
                            } else {
                              // For Miladi, use all attendance data
                              Object.assign(
                                filteredDailyAttendance,
                                student.dailyAttendance || {}
                              );
                            }

                            // Calculate summary for this student using filtered data
                            const summary = {
                              present: 0,
                              absent: 0,
                              late: 0,
                              excused: 0,
                              total:
                                calendarType === "miladi"
                                  ? new Date(
                                      selectedYear,
                                      selectedMonth,
                                      0
                                    ).getDate()
                                  : getDaysInShamsiMonth(
                                      selectedHijriYear,
                                      selectedHijriMonth
                                    ),
                            };

                            Object.values(filteredDailyAttendance).forEach(
                              (day: any) => {
                                if (day?.status === "PRESENT")
                                  summary.present++;
                                else if (day?.status === "ABSENT")
                                  summary.absent++;
                                else if (day?.status === "LATE") summary.late++;
                                else if (day?.status === "EXCUSED")
                                  summary.excused++;
                              }
                            );

                            return (
                              <div
                                key={student.studentId}
                                className={`flex border-b border-black ${
                                  studentIndex % 2 === 0
                                    ? "bg-white"
                                    : "bg-gray-50"
                                }`}
                              >
                                {/* Student Info */}
                                <div className="w-40 border-r-2 border-black px-2 py-2 bg-white">
                                  <div className="mb-2">
                                    <div className="text-xs font-semibold text-black leading-tight">
                                      {student.studentName || "Unknown Student"}
                                    </div>
                                    <div className="text-xs text-black opacity-70">
                                      {t("attendance.monthly.roll")}:{" "}
                                      {student.rollNo || t("common.na")}
                                    </div>
                                  </div>

                                  {/* Summary Stats */}
                                  <div className="grid grid-cols-2 gap-1">
                                    <div className="bg-white border border-gray-300 rounded px-1 py-1 text-center">
                                      <div className="text-xs font-bold text-green-600">
                                        {summary.present}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {t(
                                          "attendance.monthly.summary.present"
                                        )}
                                      </div>
                                    </div>
                                    <div className="bg-white border border-gray-300 rounded px-1 py-1 text-center">
                                      <div className="text-xs font-bold text-red-600">
                                        {summary.absent}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {t("attendance.monthly.summary.absent")}
                                      </div>
                                    </div>
                                    <div className="bg-white border border-gray-300 rounded px-1 py-1 text-center">
                                      <div className="text-xs font-bold text-yellow-600">
                                        {summary.late}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {t("attendance.monthly.summary.late")}
                                      </div>
                                    </div>
                                    <div className="bg-white border border-gray-300 rounded px-1 py-1 text-center">
                                      <div className="text-xs font-bold text-purple-600">
                                        {summary.excused}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {t(
                                          "attendance.monthly.summary.excused"
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Attendance Cells */}
                                {Array.from(
                                  {
                                    length:
                                      calendarType === "miladi"
                                        ? new Date(
                                            selectedYear,
                                            selectedMonth,
                                            0
                                          ).getDate()
                                        : getDaysInShamsiMonth(
                                            selectedHijriYear,
                                            selectedHijriMonth
                                          ),
                                  },
                                  (_, i) => {
                                    const day = i + 1;
                                    // Convert to Gregorian date for API lookup
                                    let dateStr: string;
                                    if (calendarType === "miladi") {
                                      dateStr = new Date(
                                        selectedYear,
                                        selectedMonth - 1,
                                        day
                                      )
                                        .toISOString()
                                        .split("T")[0];
                                    } else {
                                      // Convert Hijri Shamsi day to Gregorian date
                                      const { startISO } =
                                        shamsiMonthRangeToGregorian(
                                          selectedHijriYear,
                                          selectedHijriMonth
                                        );
                                      const startDate = new Date(startISO);
                                      const gregorianDate = new Date(startDate);
                                      gregorianDate.setDate(
                                        startDate.getDate() + day - 1
                                      );
                                      dateStr = gregorianDate
                                        .toISOString()
                                        .split("T")[0];
                                    }
                                    // Use filtered attendance data when in Hijri mode
                                    const attendance = (
                                      calendarType === "hijri"
                                        ? filteredDailyAttendance
                                        : student.dailyAttendance
                                    )[dateStr];

                                    return (
                                      <div
                                        key={day}
                                        className={`${
                                          calendarType === "hijri"
                                            ? "w-16"
                                            : "w-9"
                                        } h-9 border-r border-black ${
                                          i === 0
                                            ? "border-l-2 border-l-black"
                                            : ""
                                        } bg-white flex items-center justify-center`}
                                      >
                                        {attendance?.status ? (
                                          attendance.status === "EXCUSED" ? (
                                            <span className="w-4 h-4 rounded-full flex items-center justify-center bg-purple-500 text-white text-xs font-bold">
                                              ！
                                            </span>
                                          ) : (
                                            <div
                                              className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                                attendance.status === "PRESENT"
                                                  ? "bg-green-500"
                                                  : attendance.status ===
                                                    "ABSENT"
                                                  ? "bg-red-500"
                                                  : attendance.status === "LATE"
                                                  ? "bg-yellow-500"
                                                  : "bg-gray-400"
                                              }`}
                                            >
                                              <span className="text-xs font-bold text-white">
                                                {attendance.status === "PRESENT"
                                                  ? "✓"
                                                  : attendance.status ===
                                                    "ABSENT"
                                                  ? "✗"
                                                  : attendance.status === "LATE"
                                                  ? "⏰"
                                                  : "?"}
                                              </span>
                                            </div>
                                          )
                                        ) : (
                                          <div className="w-4 h-4 border border-gray-300 bg-gray-100 rounded-full"></div>
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                   <div className="text-center py-12">
                     <div className="text-gray-400 text-6xl mb-4">📅</div>
                     <h3 className="text-lg font-medium text-gray-900 mb-2">
                       {t("attendance.monthly.noData")}
                     </h3>
                     <p className="text-gray-500">
                       {t("attendance.monthly.noDataDescription")}
                     </p>
                   </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === "list" && (
            <div>
              {!filters.classId ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaList className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("attendance.list.selectClass")}
                  </h3>
                  <p className="text-gray-500">
                    {t("attendance.list.selectClassDescription")}
                  </p>
                </div>
              ) : studentsLoading || attendanceSummaryLoading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {t("attendance.list.loadingStudents")}
                  </p>
                </div>
              ) : studentsError || attendanceSummaryError ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaList className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("attendance.list.errorLoading")}
                  </h3>
                  <p className="text-gray-500">
                    {t("attendance.list.errorLoadingDescription")}
                  </p>
                </div>
              ) : (
                <EnhancedAttendanceList
                  students={students}
                  attendanceRecords={records}
                  attendanceSummary={attendanceSummary}
                  onMarkInTime={handleMarkInTime}
                  onMarkOutTime={handleMarkOutTime}
                  onEditRecord={handleEditAttendance}
                  onRefresh={() => {
                    refetchAttendance();
                    refetchSummary();
                  }}
                  selectedClassName={selectedClass?.name}
                  isMarkingIn={markInTimeMutation.isPending}
                  isMarkingOut={markOutTimeMutation.isPending}
                  loading={false}
                />
              )}
            </div>
          )}

          {activeTab === "table" && (
            <div>
              {!filters.classId ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTable className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("attendance.table.selectClass")}
                  </h3>
                  <p className="text-gray-500">
                    {t("attendance.table.selectClassDescription")}
                  </p>
                </div>
              ) : studentsLoading || attendanceSummaryLoading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {t("attendance.table.loading")}
                  </p>
                </div>
              ) : studentsError || attendanceSummaryError ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTable className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("attendance.table.errorLoading")}
                  </h3>
                  <p className="text-gray-500">
                    {t("attendance.table.errorLoadingDescription")}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-6 text-gray-900 text-center">
                    <h3 className="text-xl font-bold mb-2">
                      {selectedClass?.name || t("attendance.table.selectClass")}{" "}
                      - {t("attendance.table.title")}
                    </h3>
                    <p className="text-gray-500">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            {t("attendance.table.headers.rollNo")}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            {t("attendance.table.headers.studentName")}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            {t("attendance.table.headers.status")}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            {t("attendance.table.headers.inTime")}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            {t("attendance.table.headers.outTime")}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("attendance.table.headers.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.length > 0 ? (
                          students.map((student, index) => {
                            const attendanceRecord =
                              attendanceSummary?.students?.find(
                                (s) => s.studentId === student.id
                              );
                            const canMarkIn = !(
                              attendanceRecord && attendanceRecord.inTime
                            );
                            const canMarkOut =
                              !!(attendanceRecord && attendanceRecord.inTime) &&
                              !(attendanceRecord && attendanceRecord.outTime);

                            return (
                              <tr
                                key={student.id}
                                className={`${
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } hover:bg-blue-50 transition-colors`}
                              >
                                {/* Roll No */}
                                <td className="px-4 py-4 text-center border-r border-gray-200">
                                  <span className="text-sm font-medium text-gray-900">
                                    {student.rollNo ||
                                      attendanceRecord?.studentRollNo ||
                                      "N/A"}
                                  </span>
                                </td>

                                {/* Student Name */}
                                <td className="px-4 py-4 text-center border-r border-gray-200">
                                  <span className="text-sm font-medium text-gray-900">
                                    {getStudentName(student) ||
                                      attendanceRecord?.studentName}
                                  </span>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-4 text-center border-r border-gray-200">
                                  <div className="flex items-center justify-center gap-2">
                                    {attendanceRecord ? (
                                      <>
                                        <div
                                          className={`w-3 h-3 rounded-full ${
                                            attendanceRecord.status ===
                                            "PRESENT"
                                              ? "bg-green-500"
                                              : attendanceRecord.status ===
                                                "ABSENT"
                                              ? "bg-red-500"
                                              : attendanceRecord.status ===
                                                "LATE"
                                              ? "bg-orange-500"
                                              : attendanceRecord.status ===
                                                "EXCUSED"
                                              ? "bg-purple-500"
                                              : "bg-gray-400"
                                          }`}
                                        ></div>
                                        <span
                                          className={`text-xs font-medium ${
                                            attendanceRecord.status ===
                                            "PRESENT"
                                              ? "text-green-700"
                                              : attendanceRecord.status ===
                                                "ABSENT"
                                              ? "text-red-700"
                                              : attendanceRecord.status ===
                                                "LATE"
                                              ? "text-orange-700"
                                              : attendanceRecord.status ===
                                                "EXCUSED"
                                              ? "text-purple-700"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          {attendanceRecord.status}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-xs font-medium text-gray-500">
                                        {t("attendance.notMarked")}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* In Time */}
                                <td className="px-4 py-4 text-center border-r border-gray-200">
                                  <span className="text-sm text-gray-900">
                                    {attendanceRecord?.inTime
                                      ? new Date(
                                          attendanceRecord.inTime
                                        ).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                      : "--"}
                                  </span>
                                </td>

                                {/* Out Time */}
                                <td className="px-4 py-4 text-center border-r border-gray-200">
                                  <span className="text-sm text-gray-900">
                                    {attendanceRecord?.outTime
                                      ? new Date(
                                          attendanceRecord.outTime
                                        ).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                      : "--"}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {!attendanceRecord?.inTime ? (
                                      <button
                                        onClick={() =>
                                          handleMarkInTime(student.id)
                                        }
                                        disabled={markInTimeMutation.isPending}
                                        className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 border border-green-300 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                                      >
                                        <FaSignInAlt className="w-3 h-3" />
                                        <span>
                                          {t("attendance.table.actions.markIn")}
                                        </span>
                                      </button>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <FaCheckCircle className="w-3 h-3 text-green-600" />
                                      </div>
                                    )}

                                    {attendanceRecord?.inTime &&
                                    !attendanceRecord?.outTime ? (
                                      <button
                                        onClick={() =>
                                          handleMarkOutTime(student.id)
                                        }
                                        disabled={markOutTimeMutation.isPending}
                                        className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                                      >
                                        <FaSignOutAlt className="w-3 h-3" />
                                        <span>
                                          {t(
                                            "attendance.table.actions.markOut"
                                          )}
                                        </span>
                                      </button>
                                    ) : attendanceRecord?.outTime ? (
                                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                                        <FaCheckCircle className="w-3 h-3 text-orange-600" />
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                  <FaTable className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                  {t("attendance.list.noStudents")}
                                </h3>
                                <p className="text-gray-500">
                                  {t("attendance.list.noStudentsDescription")}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {t("attendance.totalStudent")}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {students.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {t("attendance.studentCard.status.present")}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {attendanceSummary?.present || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {t("attendance.studentCard.status.absent")}
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          {attendanceSummary?.absent || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {t("attendance.studentCard.status.late")}
                        </div>
                        <div className="text-lg font-bold text-yellow-600">
                          {attendanceSummary?.late || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {t("attendance.studentCard.status.leave")}
                        </div>
                        <div className="text-lg font-bold text-purple-600">
                          {attendanceSummary?.excused || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          {t("attendance.studentCard.status.attendanceRate")}
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {attendanceSummary?.attendanceRate
                            ? Math.round(
                                (attendanceSummary.attendanceRate * 100) / 100
                              )
                            : 0}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bulk Attendance Tab */}
          {activeTab === "bulk" && filters.classId && (
            <BulkAttendanceUpload
              classId={filters.classId}
              onSuccess={() => {
                // Refresh attendance summary and switch to overview
                setActiveTab("overview");
              }}
            />
          )}

          {activeTab === "bulk" && !filters.classId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">
                {t("bulkAttendance.selectClassFirst")}
              </p>
            </div>
          )}

          {/* SMS Monitoring Tab */}
          {activeTab === "sms" && <SMSMonitoringScreen />}
        </div>
      </div>

      {/* Leave Modal */}
      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        students={isLeaveModalOpen ? allStudents : students}
        onMarkLeave={handleMarkLeave}
        selectedDate={currentDate}
        loading={createAttendanceMutation.isPending}
        studentsLoading={allStudentsLoading}
        classNameFallback={selectedClass?.name}
        classCodeFallback={(selectedClass as any)?.code}
        onSeeMore={() => setModalStudentLimit((l) => l + 50)}
        onSearchChange={(q) => {
          setModalSearchQuery(q);
          setModalStudentLimit(50);
        }}
      />
    </div>
  );
};

export default AttendanceScreen;
