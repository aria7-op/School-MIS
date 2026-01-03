import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTeacherDashboard } from "../hooks/useTeacherDashboard";
import secureApiService from "../../../services/secureApiService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { TeacherDashboardData } from "../services/teacherDashboardService";

// Web-compatible width calculation
const getWidth = () => window.innerWidth;

interface TeacherDashboardProps {
  data?: any;
  classes?: any[];
  students?: any[];
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  data,
  classes = [],
  students = [],
}) => {
  const { t } = useTranslation();
  const {
    dashboardData,
    isLoading: loading,
    error,
    clearCache,
    getAttendanceTrends,
  } = useTeacherDashboard();
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [attendanceTrends, setAttendanceTrends] = useState<any>(null);
  const [todayClassSummary, setTodayClassSummary] = useState<any>(null);
  const [sevenDayAttendance, setSevenDayAttendance] = useState<any[]>([]);

  // Chart colors
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
  ];

  useEffect(() => {
    setSelectedClassFilter("all");
  }, []);
  // Fetch attendance trends on component mount
  useEffect(() => {
    const fetchTrends = async () => {
      if (!dashboardData) return;
      try {
        // Try to fetch trends for the selected filter (hook may accept a second param)
        const trends = await getAttendanceTrends(selectedClassFilter);
        setAttendanceTrends(trends);
        console.log("📈 Attendance Trends Loaded:", trends);
      } catch (error) {
        // console.error("Error fetching attendance trends:", error);
      }
    };

    fetchTrends();
  }, [dashboardData, getAttendanceTrends, selectedClassFilter]);

  // Fetch today's class attendance summary - same pattern as AttendanceManagement.tsx
  useEffect(() => {
    const fetchTodayClassSummary = async () => {
      if (selectedClassFilter === "all") {
        setTodayClassSummary(null);
        return;
      }
      try {
        const today = new Date().toISOString().slice(0, 10);
        const resp = await secureApiService.get("/attendances/class-summary", {
          params: { classId: selectedClassFilter, date: today },
        });
        const apiData = resp?.data;
        if (apiData) {
          setTodayClassSummary({
            present: apiData.present || 0,
            absent: apiData.absent || 0,
            late: apiData.late || 0,
            totalStudents: apiData.totalStudents || 0,
          });
          console.log("📊 Today's Class Summary:", apiData);
        }
      } catch (error) {
        console.error("Error fetching today's class summary:", error);
        setTodayClassSummary(null);
      }
    };

    fetchTodayClassSummary();
  }, [selectedClassFilter]);

  // Fetch previous 7 days attendance data from API
  useEffect(() => {
    const fetchSevenDaysAttendance = async () => {
      if (selectedClassFilter === "all") {
        // For "all" teacher's classes, aggregate 7-day data
        try {
          const days = [
            t("teacherPortal.dashboard.days.mon"),
            t("teacherPortal.dashboard.days.tue"),
            t("teacherPortal.dashboard.days.wed"),
            t("teacherPortal.dashboard.days.thu"),
            t("teacherPortal.dashboard.days.fri"),
            t("teacherPortal.dashboard.days.sat"),
            t("teacherPortal.dashboard.days.sun"),
          ];

          const data = [];
          const today = new Date();

          // Fetch data for previous 7 days
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().slice(0, 10);
            const dayIndex = date.getDay();
            const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;

            let totalPresent = 0;
            let totalAbsent = 0;
            let totalLate = 0;

            // Fetch data for each teacher's class
            for (const classItem of displayClasses) {
              try {
                const resp = await secureApiService.get(
                  "/attendances/class-summary",
                  {
                    params: { classId: classItem.id, date: dateStr },
                  }
                );
                const apiData = resp?.data;
                if (apiData) {
                  totalPresent += apiData.present || 0;
                  totalAbsent += apiData.absent || 0;
                  totalLate += apiData.late || 0;
                }
              } catch (classError) {
                // Skip if no data for this class on this date
              }
            }

            data.push({
              day: days[mappedIndex],
              attendance: totalPresent,
              absent: totalAbsent,
              late: totalLate,
            });
          }

          setSevenDayAttendance(data);
          console.log("📊 Seven Days Attendance Data (Teacher's Classes):", data);
        } catch (error) {
          console.error("Error fetching 7-day attendance for teacher's classes:", error);
          setSevenDayAttendance([]);
        }
        return;
      }
      try {
        const days = [
          t("teacherPortal.dashboard.days.mon"),
          t("teacherPortal.dashboard.days.tue"),
          t("teacherPortal.dashboard.days.wed"),
          t("teacherPortal.dashboard.days.thu"),
          t("teacherPortal.dashboard.days.fri"),
          t("teacherPortal.dashboard.days.sat"),
          t("teacherPortal.dashboard.days.sun"),
        ];

        const data = [];
        const today = new Date();

        // Fetch data for previous 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().slice(0, 10);

          try {
            const resp = await secureApiService.get(
              "/attendances/class-summary",
              {
                params: { classId: selectedClassFilter, date: dateStr },
              }
            );
            const apiData = resp?.data;
            if (apiData) {
              const dayIndex = date.getDay();
              const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
              data.push({
                day: days[mappedIndex],
                attendance: apiData.present || 0,
                absent: apiData.absent || 0,
                late: apiData.late || 0,
              });
            }
          } catch (dayError) {
            // If no data for this day, add empty record
            const dayIndex = date.getDay();
            const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            data.push({
              day: days[mappedIndex],
              attendance: 0,
              absent: 0,
              late: 0,
            });
          }
        }

        setSevenDayAttendance(data);
        console.log("📊 Seven Days Attendance Data (Single class:", selectedClassFilter, "):", data);
      } catch (error) {
        console.error("Error fetching 7-day attendance:", error);
        setSevenDayAttendance([]);
      }
    };

    fetchSevenDaysAttendance();
  }, [selectedClassFilter, t]);
  // Function to generate only today's attendance data
  const generateTodayAttendanceData = () => {
    const days = [
      t("teacherPortal.dashboard.days.mon"),
      t("teacherPortal.dashboard.days.tue"),
      t("teacherPortal.dashboard.days.wed"),
      t("teacherPortal.dashboard.days.thu"),
      t("teacherPortal.dashboard.days.fri"),
      t("teacherPortal.dashboard.days.sat"),
      t("teacherPortal.dashboard.days.sun"),
    ];

    // Determine today's index (Monday = 0, Sunday = 6)
    const todayIndex = new Date().getDay(); // Sunday = 0
    const mappedIndex = todayIndex === 0 ? 6 : todayIndex - 1; // map Sunday to 6

    let data: any = null;

    // Prefer class-specific trends from API
    if (attendanceTrends) {
      if (selectedClassFilter !== "all" && attendanceTrends?.trends) {
        const classTrend = attendanceTrends.trends.find(
          (t: any) => String(t.classId) === String(selectedClassFilter)
        );
        if (classTrend?.data && classTrend.data.length >= 7) {
          const classSize = getClassSize(classTrend);
          const dayData =
            getDayDataFromTrend(classTrend, mappedIndex, days) || {};
          const presentVal = getNumericField(
            dayData,
            [
              "present",
              "presentCount",
              "present_count",
              "presentPct",
              "presentRate",
              "present_rate",
              "presentPercent",
            ],
            classSize
          );
          const absentVal = getNumericField(
            dayData,
            [
              "absent",
              "absentCount",
              "absent_count",
              "absentPct",
              "absentRate",
              "absent_rate",
              "absentPercent",
            ],
            classSize
          );
          const lateVal = getNumericField(
            dayData,
            [
              "late",
              "lateCount",
              "late_count",
              "latePct",
              "lateRate",
              "late_rate",
            ],
            classSize
          );
          data = {
            day: days[mappedIndex],
            attendance: presentVal,
            absent: absentVal,
            late: lateVal,
          };
          console.log("📅 Today's class (single) computed:", {
            classId: classTrend?.classId,
            classSize,
            presentVal,
            absentVal,
            lateVal,
          });
        }
      }

      // Aggregate all classes when filter is 'all' -> produce absolute counts
      if (
        selectedClassFilter === "all" &&
        attendanceTrends?.trends &&
        Array.isArray(attendanceTrends.trends)
      ) {
        // For today's single-day summary, map each class to its counts for the mappedIndex
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;

        for (const classTrend of attendanceTrends.trends) {
          if (!classTrend?.data) continue;
          const size = getClassSize(classTrend);
          const dayData =
            getDayDataFromTrend(classTrend, mappedIndex, days) || {};
          const presentVal = getNumericField(
            dayData,
            [
              "present",
              "presentCount",
              "present_count",
              "presentPct",
              "presentRate",
              "present_rate",
              "presentPercent",
            ],
            size
          );
          const absentVal = getNumericField(
            dayData,
            [
              "absent",
              "absentCount",
              "absent_count",
              "absentPct",
              "absentRate",
              "absent_rate",
              "absentPercent",
            ],
            size
          );
          const lateVal = getNumericField(
            dayData,
            [
              "late",
              "lateCount",
              "late_count",
              "latePct",
              "lateRate",
              "late_rate",
            ],
            size
          );

          // store per-class (debug) then accumulate
          // (If you need per-class breakdown, we could push to an array here.)
          totalPresent += presentVal;
          totalAbsent += absentVal;
          totalLate += lateVal;
        }

        data = {
          day: days[mappedIndex],
          attendance: totalPresent,
          absent: totalAbsent,
          late: totalLate,
        };
      }

      // Fallback to overall data if available
      if (
        !data &&
        selectedClassFilter === "all" &&
        attendanceTrends?.overall?.data
      ) {
        const dayData = attendanceTrends.overall.data[mappedIndex] || {};
        const totalStudents =
          attendanceTrends.overall.totalStudents ??
          dashboardData?.attendance?.summary?.totalStudents ??
          100;
        const presentVal = toActualCount(dayData.present ?? 0, totalStudents);
        const absentVal = toActualCount(dayData.absent ?? 0, totalStudents);
        const lateVal = toActualCount(dayData.late ?? 0, totalStudents);
        data = {
          day: days[mappedIndex],
          attendance: presentVal,
          absent: absentVal,
          late: lateVal,
        };
        console.log("📅 Today's overall computed:", {
          mappedIndex,
          presentVal,
          absentVal,
          lateVal,
          totalStudents,
        });
      }
    }

    // Fallback: use dashboard summary
    if (!data) {
      const rate = dashboardData?.attendance?.summary?.overallRate ?? 0;
      const normalized = rate > 0 && rate <= 1 ? Math.round(rate * 100) : rate;
      const absentRate = 100 - normalized;
      data = {
        day: days[mappedIndex],
        attendance: normalized,
        absent: absentRate,
      };
    }

    // Return only today's data as single-item array
    console.log("📅 generateTodayAttendanceData -> returning:", data);
    return [data];
  };

  // Helper: convert fraction (0..1) to actual count using classSize fallback
  const toActualCount = (value: any, classSize: number) => {
    const size = Number(classSize) || 0;
    if (typeof value === "number" && value > 0 && value <= 1) {
      // It's a fraction -> convert to count
      return Math.round(value * (size || 30));
    }
    return Number(value) || 0;
  };

  // Helper: determine class size from a trend object or dashboard data
  const getClassSize = (classTrend: any) => {
    const possibleSize =
      classTrend?.totalStudents ?? classTrend?.studentCount ?? classTrend?.size;

    if (possibleSize && Number(possibleSize) > 0) return Number(possibleSize);

    // Try dashboardData breakdown if available
    const breakdown = dashboardData?.attendance?.classBreakdown;
    if (Array.isArray(breakdown)) {
      const found = breakdown.find(
        (b: any) => String(b.classId) === String(classTrend?.classId)
      );
      if (found && (found.totalStudents || found.studentCount)) {
        return Number(found.totalStudents ?? found.studentCount);
      }
    }

    // As last resort, use a reasonable default
    return 30;
  };

  // Helper: find a day's data inside a classTrend.data array regardless of ordering.
  // Supports elements with `date` (ISO) or `day` (localized name) or falls back to index.
  const getDayDataFromTrend = (
    classTrend: any,
    mappedIndex: number,
    days: string[]
  ) => {
    if (!classTrend?.data) return {};
    const dataArr = classTrend.data;
    if (!Array.isArray(dataArr)) return dataArr || {};

    // First try to find by date property (ISO date string)
    for (const entry of dataArr) {
      if (entry?.date) {
        const d = new Date(entry.date);
        if (!isNaN(d.getTime())) {
          const dayIndex = d.getDay(); // Sunday=0
          const idx = dayIndex === 0 ? 6 : dayIndex - 1;
          if (idx === mappedIndex) return entry;
        }
      }
    }

    // Next try to match by localized day name
    for (const entry of dataArr) {
      if (entry?.day) {
        const foundIdx = days.findIndex((d) => String(d) === String(entry.day));
        if (foundIdx === mappedIndex) return entry;
      }
    }

    // Fallback to positional index if exists
    return dataArr[mappedIndex] || {};
  };

  // Helper: get numeric value from possible keys on an entry and convert fractions
  const getNumericField = (
    entry: any,
    possibleKeys: string[],
    classSize: number
  ) => {
    if (!entry) return 0;
    for (const key of possibleKeys) {
      if (entry[key] != null) {
        const v = entry[key];
        if (typeof v === "number") return toActualCount(v, classSize);
        const num = Number(v);
        if (!isNaN(num)) return toActualCount(num, classSize);
      }
    }
    return 0;
  };

  // Generate attendance data based on REAL data
  const generateAttendanceData = () => {
    // If we have 7-day API data, use it
    if (sevenDayAttendance.length > 0) {
      console.log("✅ Using API-fetched 7-day attendance data");
      return sevenDayAttendance;
    }

    const days = [
      t("teacherPortal.dashboard.days.mon"),
      t("teacherPortal.dashboard.days.tue"),
      t("teacherPortal.dashboard.days.wed"),
      t("teacherPortal.dashboard.days.thu"),
      t("teacherPortal.dashboard.days.fri"),
      t("teacherPortal.dashboard.days.sat"),
      t("teacherPortal.dashboard.days.sun"),
    ];

    console.log(
      "📊 generateAttendanceData called - attendanceTrends:",
      attendanceTrends,
      "selectedClassFilter:",
      selectedClassFilter
    );

    // Prefer class-specific trends from API
    if (attendanceTrends?.trends && Array.isArray(attendanceTrends.trends)) {
      // SINGLE CLASS SELECTED
      if (selectedClassFilter !== "all") {
        const classTrend = attendanceTrends.trends.find(
          (t: any) => String(t.classId) === String(selectedClassFilter)
        );
        if (classTrend?.data && classTrend.data.length >= 7) {
          console.log("✅ Using class-specific trend data");
          const classSize =
            classTrend.totalStudents ??
            classTrend.studentCount ??
            classTrend.size ??
            100;

          return days.map((day, index) => {
            const dayData = getDayDataFromTrend(classTrend, index, days) || {};
            const presentVal = getNumericField(
              dayData,
              [
                "present",
                "presentCount",
                "present_count",
                "presentPct",
                "presentRate",
                "present_rate",
                "presentPercent",
              ],
              classSize
            );
            const absentVal = getNumericField(
              dayData,
              [
                "absent",
                "absentCount",
                "absent_count",
                "absentPct",
                "absentRate",
                "absent_rate",
                "absentPercent",
              ],
              classSize
            );
            const lateVal = getNumericField(
              dayData,
              [
                "late",
                "lateCount",
                "late_count",
                "latePct",
                "lateRate",
                "late_rate",
              ],
              classSize
            );

            return {
              day,
              attendance: presentVal,
              absent: absentVal,
              late: lateVal,
            };
          });
        }
      }

      // ALL CLASSES - Map per-class 7-day arrays then sum day-by-day
      if (selectedClassFilter === "all") {
        console.log(
          "✅ Aggregating data for ALL classes (per-class mapping then summing)"
        );

        // Build per-class results: [{ classId, name, days: [{attendance, absent, late}, ...] }, ...]
        const perClassResults: Array<any> = [];

        for (const classTrend of attendanceTrends.trends) {
          if (!classTrend?.data) continue;
          const size = getClassSize(classTrend);
          const classDays = days.map((day, idx) => {
            const dayData = getDayDataFromTrend(classTrend, idx, days) || {};
            const presentVal = getNumericField(
              dayData,
              [
                "present",
                "presentCount",
                "present_count",
                "presentPct",
                "presentRate",
                "present_rate",
                "presentPercent",
              ],
              size
            );
            const absentVal = getNumericField(
              dayData,
              [
                "absent",
                "absentCount",
                "absent_count",
                "absentPct",
                "absentRate",
                "absent_rate",
                "absentPercent",
              ],
              size
            );
            const lateVal = getNumericField(
              dayData,
              [
                "late",
                "lateCount",
                "late_count",
                "latePct",
                "lateRate",
                "late_rate",
              ],
              size
            );
            return {
              day,
              attendance: presentVal,
              absent: absentVal,
              late: lateVal,
            };
          });
          perClassResults.push({
            classId: classTrend.classId,
            days: classDays,
          });
        }

        // Sum across classes day-by-day
        const summed = days.map((day, idx) => {
          let totalPresent = 0;
          let totalAbsent = 0;
          let totalLate = 0;

          for (const cls of perClassResults) {
            const d = cls.days[idx] || { attendance: 0, absent: 0, late: 0 };
            totalPresent += d.attendance || 0;
            totalAbsent += d.absent || 0;
            totalLate += d.late || 0;
          }

          return {
            day,
            attendance: totalPresent,
            absent: totalAbsent,
            late: totalLate,
          };
        });

        console.log("📊 Aggregated ALL classes (summed):", summed);
        return summed;
      }
    }

    // Fallback to overall data if available
    if (
      attendanceTrends?.overall?.data &&
      Array.isArray(attendanceTrends.overall.data)
    ) {
      console.log("✅ Using overall trend data");
      const totalStudents =
        attendanceTrends?.overall?.totalStudents ??
        dashboardData?.attendance?.summary?.totalStudents ??
        100;

      return days.map((day, index) => {
        const dayData = attendanceTrends.overall.data[index] || {};
        const presentVal = toActualCount(dayData.present ?? 0, totalStudents);
        const absentVal = toActualCount(dayData.absent ?? 0, totalStudents);
        const lateVal = toActualCount(dayData.late ?? 0, totalStudents);

        return {
          day,
          attendance: presentVal,
          absent: absentVal,
          late: lateVal,
        };
      });
    }

    // Fallback: Get attendance rate based on selected class filter
    console.log("⚠️ Using dashboard fallback data");
    let attendanceRate = dashboardData?.attendance?.summary?.overallRate || 0;
    let absentRate = dashboardData?.attendance?.summary?.overallAbsent || 0;
    let totalStudents =
      dashboardData?.attendance?.summary?.totalStudents || 100;

    if (selectedClassFilter !== "all") {
      // Get attendance from classBreakdown
      const classAttendance = dashboardData?.attendance?.classBreakdown?.find(
        (att: any) => String(att.classId) === String(selectedClassFilter)
      );
      attendanceRate = classAttendance?.attendanceRate || 0;
      absentRate = classAttendance?.absentRate || 0;
      totalStudents = classAttendance?.totalStudents || 100;
    }

    // Convert rates to actual counts
    const presentCount = toActualCount(attendanceRate, totalStudents);
    const absentCount = toActualCount(absentRate, totalStudents);

    console.log(
      "📊 Fallback data - present:",
      presentCount,
      "absent:",
      absentCount
    );

    return days.map((day) => ({
      day,
      attendance: presentCount,
      absent: absentCount,
      late: 0,
    }));
  };

  const generateClassPerformanceData = () => {
    if (!displayClasses || displayClasses.length === 0) {
      console.log("⚠️ No classes available for performance chart");
      return [];
    }

    // Filter classes based on selected filter
    let filteredClasses = displayClasses;
    if (selectedClassFilter !== "all") {
      filteredClasses = displayClasses.filter(
        (cls) => String(cls.id) === String(selectedClassFilter)
      );
    }

    // Calculate attendance rate from sevenDayAttendance data
    const getAttendanceForClass = (classId: string) => {
      // For single class selection, use todayClassSummary data
      if (selectedClassFilter !== "all" && todayClassSummary) {
        const attendancePercent = todayClassSummary.totalStudents > 0 
          ? Math.round((todayClassSummary.present / todayClassSummary.totalStudents) * 100)
          : 0;
        console.log(`📊 Single class ${classId}: present=${todayClassSummary.present}, total=${todayClassSummary.totalStudents}, percent=${attendancePercent}`);
        return attendancePercent;
      }
      
      if (!sevenDayAttendance || sevenDayAttendance.length === 0) {
        console.log(`⚠️ No sevenDayAttendance for class ${classId}`);
        return 0;
      }
      
      // For "all classes", we need per-class breakdown - use displayClasses count
      // This is a simplified calculation
      const classObj = displayClasses.find((c: any) => String(c.id) === String(classId));
      if (!classObj) return 0;
      
      const classSize = classObj.students || 30;
      let totalPresent = 0;
      for (const day of sevenDayAttendance) {
        totalPresent += day.attendance || 0;
      }
      const avgDaily = totalPresent / sevenDayAttendance.length;
      // For all classes view, assume proportional distribution
      const avgPerClass = avgDaily / (displayClasses.length || 1);
      const attendancePercent = classSize > 0 ? Math.round((avgPerClass / classSize) * 100) : 0;
      return Math.min(100, attendancePercent || 0);
    };

    const data = filteredClasses.slice(0, 6).map((cls, index) => {
      const attendancePercent = getAttendanceForClass(cls.id);
      
      // Calculate performance from assignments and exams
      let performancePercent = 0;
      if (cls.assignments && cls.assignments > 0) {
        performancePercent = Math.min(100, cls.assignments * 10); // Scale assignments to percentage
      } else if (cls.exams && cls.exams > 0) {
        performancePercent = Math.min(100, cls.exams * 20); // Scale exams to percentage
      } else {
        performancePercent = cls.averageGrade || 0; // Fallback to grade if available
      }
      
      console.log(`📊 Class ${cls.name}: assignments=${cls.assignments}, exams=${cls.exams}, performance=${performancePercent}`);
      
      return {
        name:
          (cls.name || `Class ${index + 1}`) + (cls.code ? ` (${cls.code})` : ""),
        performance: performancePercent,
        attendance: attendancePercent,
        assignments: cls.assignments,
      };
    });

    console.log("📊 Class Performance Data:", data);
    return data;
  };

  const generateStudentDistributionData = () => {
    if (!displayClasses || displayClasses.length === 0) return [];

    return displayClasses.slice(0, 6).map((cls, index) => {
      const studentsVal = Array.isArray(cls.students)
        ? cls.students.length
        : typeof cls.students === "number"
        ? cls.students
        : cls.studentCount || 0;
      return {
        name:
          (cls.name || `Class ${index + 1}`) +
          (cls.code ? ` (${cls.code})` : ""),
        value: studentsVal,
        color: COLORS[index % COLORS.length],
      };
    });
  };

  const generateAssignmentTrendsData = () => {
    // Get assignments from dashboard data - it's structured as an object with arrays
    const assignmentsData = dashboardData?.assignments || {};

    let allAssignments = [
      ...(Array.isArray(assignmentsData.recent) ? assignmentsData.recent : []),
      ...(Array.isArray(assignmentsData.upcoming)
        ? assignmentsData.upcoming
        : []),
      ...(Array.isArray(assignmentsData.overdue)
        ? assignmentsData.overdue
        : []),
      ...(Array.isArray(assignmentsData.pendingSubmissions)
        ? assignmentsData.pendingSubmissions
        : []),
    ];

    // Filter assignments by selected class if not 'all'
    if (selectedClassFilter !== "all") {
      allAssignments = allAssignments.filter(
        (assignment) =>
          String(assignment.classId) === String(selectedClassFilter)
      );
    }

    // Group assignments by month based on creation date
    const monthlyData: {
      [key: string]: { assigned: number; submitted: number; graded: number };
    } = {};

    // Initialize last 6 months
    const currentDate = new Date();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthKey = date.toLocaleDateString("en-US", { month: "short" });
      last6Months.push(monthKey);
      monthlyData[monthKey] = { assigned: 0, submitted: 0, graded: 0 };
    }

    // Process real assignment data
    allAssignments.forEach((assignment: any) => {
      const createdDate = assignment.createdAt
        ? new Date(assignment.createdAt)
        : assignment.dueDate
        ? new Date(assignment.dueDate)
        : new Date(); // fallback to current date

      const monthKey = createdDate.toLocaleDateString("en-US", {
        month: "short",
      });

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].assigned++;

        // Count submissions and graded based on assignment status and submission stats
        if (assignment.submissionStats) {
          // Use REAL submission stats data
          monthlyData[monthKey].submitted +=
            assignment.submissionStats.submittedCount || 0;
          monthlyData[monthKey].graded +=
            assignment.submissionStats.gradedCount || 0;
        } else if (assignment.submissions) {
          // Use REAL submission count
          monthlyData[monthKey].submitted += assignment.submissions;
          // Calculate graded count based on real submission data
          // If status is completed/graded, count all as graded
          const gradedCount =
            assignment.status === "completed" || assignment.status === "graded"
              ? assignment.submissions
              : 0;
          monthlyData[monthKey].graded += gradedCount;
        } else {
          // For assignments without submission data, only count if explicitly marked as submitted/completed
          if (
            assignment.status === "submitted" ||
            assignment.status === "completed"
          ) {
            monthlyData[monthKey].submitted += 1;
            if (
              assignment.status === "completed" ||
              assignment.status === "graded"
            ) {
              monthlyData[monthKey].graded += 1;
            }
          }
        }
      }
    });

    // Convert to chart format
    return last6Months.map((month) => ({
      month,
      assigned: monthlyData[month]?.assigned || 0,
      submitted: monthlyData[month]?.submitted || 0,
      graded: monthlyData[month]?.graded || 0,
    }));
  };

  // Helper function to get classes array
  const getClassesArray = () => {
    if (Array.isArray(dashboardData?.classes)) {
      return dashboardData.classes;
    } else if (dashboardData?.classes?.active) {
      return dashboardData.classes.active;
    } else if (Array.isArray(classes)) {
      return classes;
    }
    return [];
  };

  // Helper function to get students
  const getStudentsArray = () => {
    if (Array.isArray(dashboardData?.students)) {
      return dashboardData.students;
    } else if (dashboardData?.students?.byClass) {
      return dashboardData.students.byClass;
    } else if (Array.isArray(students)) {
      return students;
    }
    return [];
  };

  // Use classes from dashboardData if available, otherwise fall back to props
  const displayClasses = getClassesArray();
  const displayStudents = getStudentsArray();

  // Calculate real averages from dashboard data
  const calculateAveragePerformance = () => {
    if (!displayClasses || displayClasses.length === 0) return 0;
    const totalGrade = displayClasses.reduce(
      (sum: number, cls: any) => sum + (cls.averageGrade || 0),
      0
    );
    return Math.round(totalGrade / displayClasses.length);
  };

  const calculatePendingTasks = () => {
    const pendingSubmissions =
      dashboardData?.assignments?.pendingSubmissions?.length || 0;
    const overdueAssignments = dashboardData?.assignments?.overdue?.length || 0;
    return pendingSubmissions + overdueAssignments;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <span className="material-icons text-4xl sm:text-5xl lg:text-6xl text-gray-400 mb-4">
          hourglass_empty
        </span>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          {t("teacherPortal.common.loading")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <span className="material-icons text-4xl sm:text-5xl lg:text-6xl text-red-500 mb-4">
          error
        </span>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-2">
          {t("teacherPortal.common.errorLoading")}
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-md">
          {t("teacherPortal.common.errorLoadingMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          {t("teacherPortal.dashboard.title")}
        </h1>
      </div>

      {/* Statistics */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 w-full">
          {/* Classes Card */}
          <div className="relative group bg-gradient-to-br from-blue-500/10 via-blue-100/30 to-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500"></div>
            <span className="material-icons text-2xl text-blue-600 mb-1">
              school
            </span>
            <h3 className="text-lg font-bold text-gray-900">
              {displayClasses.length}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {t("teacherPortal.dashboard.totalClasses")}
            </p>
          </div>

          {/* Students Card */}
          <div className="relative group bg-gradient-to-br from-green-500/10 via-green-100/30 to-green-50 border border-green-100 rounded-xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500"></div>
            <span className="material-icons text-2xl text-green-600 mb-1">
              people
            </span>
            <h3 className="text-lg font-bold text-gray-900">
              {displayStudents.length}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {t("teacherPortal.dashboard.totalStudents")}
            </p>
          </div>

          {/* Assignments Card */}
          <div className="relative group bg-gradient-to-br from-orange-500/10 via-orange-100/30 to-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-500"></div>
            <span className="material-icons text-2xl text-orange-500 mb-1">
              assignment
            </span>
            <h3 className="text-lg font-bold text-gray-900">
              {dashboardData?.overview?.totalAssignments || 0}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {t("teacherPortal.dashboard.totalAssignments")}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-6 flex flex-row justify-between items-center gap-2">
          {t("teacherPortal.dashboard.analytics")}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">
              {t("teacherPortal.dashboard.allClasses")}
            </option>
            {displayClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name + (cls.code ? ` (${cls.code})` : "")}
              </option>
            ))}
          </select>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-6 mb-2 sm:mb-6">
          {/* Attendance Trends Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:col-span-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("teacherPortal.dashboard.attendanceTrends")}
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={generateAttendanceData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#141414" />
                <XAxis dataKey="day" stroke="#171717" fontSize={12} />
                <YAxis stroke="#171717" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #212020",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  name={t("teacherPortal.dashboard.present")}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                  name={t("teacherPortal.dashboard.absent")}
                />
                <Line
                  type="monotone"
                  dataKey="late"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
                  name={t("teacherPortal.dashboard.late") || "Late"}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Today data Chart (smaller, pie) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("teacherPortal.dashboard.todayAttendance")}
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                {
                  // Show today's attendance from API or fallback to trends data
                }
                <Pie
                  data={(() => {
                    let presentVal = 0;
                    let absentVal = 0;
                    let lateVal = 0;

                    // Use today's attendance data for "all" classes
                    if (
                      selectedClassFilter === "all" &&
                      sevenDayAttendance.length > 0
                    ) {
                      // Get today's data (last day) from all classes
                      const todayData =
                        sevenDayAttendance[sevenDayAttendance.length - 1];
                      presentVal = todayData?.attendance ?? 0;
                      absentVal = todayData?.absent ?? 0;
                      lateVal = todayData?.late ?? 0;
                      console.log("📊 Today's Attendance (All Teacher's Classes):", {
                        present: presentVal,
                        absent: absentVal,
                        late: lateVal,
                      });
                    } else if (
                      selectedClassFilter !== "all" &&
                      todayClassSummary
                    ) {
                      // Use API data for a specific class
                      presentVal = todayClassSummary.present ?? 0;
                      absentVal = todayClassSummary.absent ?? 0;
                      lateVal = todayClassSummary.late ?? 0;
                    } else {
                      // Fallback to trends data
                      const today = generateTodayAttendanceData()[0];
                      presentVal = today?.attendance ?? 0;
                      absentVal = today?.absent ?? 0;
                      lateVal = today?.late ?? 0;
                    }

                    const data = [
                      {
                        name: t("teacherPortal.dashboard.present"),
                        value: presentVal,
                      },
                      {
                        name: t("teacherPortal.dashboard.absent"),
                        value: absentVal,
                      },
                    ];

                    // Only add late if there are late records
                    if (lateVal > 0) {
                      data.push({
                        name: t("teacherPortal.dashboard.late") || "Late",
                        value: lateVal,
                      });
                    }

                    return data;
                  })()}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}`}
                >
                  {(() => {
                    // Use three distinct colors for present / absent / late
                    const colorMap = [COLORS[1], COLORS[3], "#f2d038"];
                    const dataLen =
                      selectedClassFilter !== "all" &&
                      todayClassSummary &&
                      (todayClassSummary.late ?? 0) > 0
                        ? 3
                        : 2;
                    return Array.from({ length: dataLen }).map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={colorMap[i % colorMap.length]}
                      />
                    ));
                  })()}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Class Performance Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:col-span-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("teacherPortal.dashboard.performanceOverview")}
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={generateClassPerformanceData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="performance"
                  fill="#3B82F6"
                  name={t("teacherPortal.dashboard.performancePercent")}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="attendance"
                  fill="#10B981"
                  name={t("teacherPortal.dashboard.attendancePercent")}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gep-2 sm:gap-6 mb-6">
          {/* Student Distribution Pie Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("teacherPortal.dashboard.studentDistribution")}
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={generateStudentDistributionData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {generateStudentDistributionData().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Assignment Trends Area Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("teacherPortal.dashboard.assignmentTrends")}
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={generateAssignmentTrendsData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="assigned"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name={t("teacherPortal.dashboard.assigned")}
                />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name={t("teacherPortal.dashboard.submitted")}
                />
                <Area
                  type="monotone"
                  dataKey="graded"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                  name={t("teacherPortal.dashboard.graded")}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Classes Analytics Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-2 sm:gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("teacherPortal.dashboard.classesAnalytics") ||
                  "Classes Analytics"}
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={generateClassPerformanceData()}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="performance"
                  fill="#3B82F6"
                  name={
                    t("teacherPortal.dashboard.performancePercent") ||
                    "Performance"
                  }
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="attendance"
                  fill="#10B981"
                  name={
                    t("teacherPortal.dashboard.attendancePercent") ||
                    "Attendance"
                  }
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="assignments"
                  fill="#F59E0B"
                  name={
                    t("teacherPortal.dashboard.assignments") || "Assignments"
                  }
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Insights Cards */}
      </div>
    </div>
  );
};

export default TeacherDashboard;
