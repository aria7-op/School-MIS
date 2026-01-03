import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { Notification as ParentNotification } from "../types/parentPortal";
import { Child, ParentDashboardData, TabType } from "../types/parentPortal";
import {
  useParentChildren,
  useParentNotifications,
  useParentDashboard,
} from "../services/parentPortalService";
import AttendanceTracker from "../components/AttendanceTracker";
import AcademicProgress from "../components/AcademicProgress";
import FeeManagement from "../components/FeeManagement";
import ExamSchedule from "../components/ExamSchedule";
import StudentOverview from "../components/StudentOverview";
import Assignments from "../components/Assignments";
import SuggestionComplaintBox from "../components/SuggestionComplaintBox";
import {
  HiOutlineHandRaised,
  HiArrowPath,
  HiDocumentText,
  HiCheckCircle,
  HiChartBar,
  HiBookOpen,
  HiClock,
  HiCalendar,
  HiSparkles,
  HiExclamationTriangle,
  HiChatBubbleLeftRight,
  HiClipboardDocumentList,
  HiAcademicCap,
  HiCurrencyDollar,
} from "react-icons/hi2";

const ParentDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [notificationsList, setNotificationsList] = useState<
    ParentNotification[]
  >([]);
  const [loadingNotifications, setLoadingNotifications] =
    useState<boolean>(false);
  const [visibleNotifications, setVisibleNotifications] = useState<number>(10);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState<boolean>(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] =
    useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardStats, setDashboardStats] = useState({
    totalAssignments: 0,
    pendingAssignments: 0,
    submittedAssignments: 0,
    overdueAssignments: 0,
    recentAttendance: 0,
    upcomingExams: 0,
    totalFees: 0,
    paidFees: 0,
  });
  const [attendanceStats, setAttendanceStats] = useState({
    currentMonthAttendance: 0,
    lastMonthAttendance: 0,
    attendanceTrend: "stable" as "improving" | "declining" | "stable",
    totalPresentDays: 0,
    totalAbsentDays: 0,
    attendancePeriod: "This Month",
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [apiChildren, setApiChildren] = useState([]);
  const [childrenWithAttendance, setChildrenWithAttendance] = useState<any[]>(
    []
  );
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activityFilter, setActivityFilter] = useState("all");

  // New state for dynamic data of dashboard
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [academicPerformance, setAcademicPerformance] = useState({
    averageGrade: 0,
    trend: 0,
    topSubjects: 0,
  });
  const [feeStatus, setFeeStatus] = useState({
    totalFees: 0,
    paidFees: 0,
    nextDueDate: null,
    status: "Paid",
  });
  const [studentGrades, setStudentGrades] = useState<Record<string, number>>(
    {}
  );
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>();
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const { data: children = [], isLoading: loadingChildren } =
    useParentChildren();
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useParentNotifications();
  const { data: dashboardData } = useParentDashboard();

  // Filter children based on search
  const filteredChildren = useMemo(() => {
    const childrenToFilter =
      childrenWithAttendance.length > 0 ? childrenWithAttendance : children;
    if (!searchQuery.trim()) return childrenToFilter;
    return childrenToFilter.filter(
      (child) =>
        child.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.grade.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [children, childrenWithAttendance, searchQuery]);

  // Set first child as selected by default
  React.useEffect(() => {
    if (children.length > 0 && !selectedStudent) {
      setSelectedStudent(children[0].id);
    }
  }, [children, selectedStudent]);

  // Calculate dynamic attendance statistics
  const calculateAttendanceStats = async () => {
    if (!selectedStudent) return;

    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      if (!token) return;

      // Fetch attendance records for the selected student
      const response = await fetch(
        `https://khwanzay.school/api/attendances?studentId=${selectedStudent}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Handle the correct API response structure
        const attendanceRecords =
          data.data?.attendances || data.attendances || data.data || data || [];

        if (Array.isArray(attendanceRecords)) {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear =
            currentMonth === 0 ? currentYear - 1 : currentYear;

          // Filter records for current month
          const currentMonthRecords = attendanceRecords.filter(
            (record: any) => {
              const recordDate = new Date(record.date);
              return (
                recordDate.getMonth() === currentMonth &&
                recordDate.getFullYear() === currentYear
              );
            }
          );

          // Filter records for last month
          const lastMonthRecords = attendanceRecords.filter((record: any) => {
            const recordDate = new Date(record.date);
            return (
              recordDate.getMonth() === lastMonth &&
              recordDate.getFullYear() === lastMonthYear
            );
          });

          // Calculate current month attendance
          const currentPresentDays = currentMonthRecords.filter(
            (r: any) => r.status === "PRESENT"
          ).length;
          const currentTotalDays = currentMonthRecords.length;
          const currentMonthAttendance =
            currentTotalDays > 0
              ? Math.round((currentPresentDays / currentTotalDays) * 100)
              : 0;

          // Calculate last month attendance
          const lastPresentDays = lastMonthRecords.filter(
            (r: any) => r.status === "PRESENT"
          ).length;
          const lastTotalDays = lastMonthRecords.length;
          const lastMonthAttendance =
            lastTotalDays > 0
              ? Math.round((lastPresentDays / lastTotalDays) * 100)
              : 0;

          // Determine trend
          let attendanceTrend: "improving" | "declining" | "stable" = "stable";
          if (currentMonthAttendance > lastMonthAttendance + 5) {
            attendanceTrend = "improving";
          } else if (currentMonthAttendance < lastMonthAttendance - 5) {
            attendanceTrend = "declining";
          }

          // Calculate total present/absent days for current month
          const totalAbsentDays = currentMonthRecords.filter(
            (r: any) => r.status === "ABSENT"
          ).length;

          setAttendanceStats({
            currentMonthAttendance,
            lastMonthAttendance,
            attendanceTrend,
            totalPresentDays: currentPresentDays,
            totalAbsentDays,
            attendancePeriod: t("parentPortal.attendance.thisMonth"),
          });

          // console.log('✅ Dynamic attendance stats calculated:', {
          //   currentMonthAttendance,
          //   lastMonthAttendance,
          //   attendanceTrend,
          //   totalPresentDays: currentPresentDays,
          //   totalAbsentDays
          // });
        } else {
          // Fallback to static data if API returns unexpected format
          // console.warn('⚠️ Unexpected attendance data format, using fallback');
          setAttendanceStats((prev) => ({
            ...prev,
            currentMonthAttendance: prev.currentMonthAttendance || 0,
            attendancePeriod: t("parentPortal.attendance.thisMonth"),
          }));
        }
      } else {
        // console.warn('⚠️ Failed to fetch attendance data, using fallback');
        // Keep existing stats or use fallback
        setAttendanceStats((prev) => ({
          ...prev,
          currentMonthAttendance: prev.currentMonthAttendance || 0,
          attendancePeriod: "This Month",
        }));
      }
    } catch (error) {
      // console.error('Error calculating attendance stats:', error);
      // Keep existing stats on error
      setAttendanceStats((prev) => ({
        ...prev,
        currentMonthAttendance: prev.currentMonthAttendance || 0,
        attendancePeriod: "This Month",
      }));
    }
  };

  // Fetch dynamic dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        // console.error('No authentication token found');
        setLoading(false);
        return;
      }

      // Fetch dashboard data from the real API endpoint
      // console.log('🌐 Fetching dashboard data from API...');
      const response = await fetch(
        "https://khwanzay.school/api/parents/dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // console.log('📡 Dashboard API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const dashboardData = data.data;

          // Update dashboard stats with real data
          setDashboardStats({
            totalAssignments: dashboardData.totalAssignments || 0,
            pendingAssignments: dashboardData.pendingAssignments || 0,
            submittedAssignments: dashboardData.submittedAssignments || 0,
            overdueAssignments: dashboardData.overdueAssignments || 0,
            recentAttendance: dashboardData.recentAttendance || 0,
            upcomingExams: dashboardData.upcomingExams || 0,
            totalFees: dashboardData.totalFees || 0,
            paidFees: dashboardData.paidFees || 0,
          });

          // Set recent activity from API
          setRecentActivity(dashboardData.recentActivity || []);

          // Set children data from API
          setApiChildren(dashboardData.children || []);

          // console.log('✅ Dashboard data loaded:', dashboardData);
        } else {
          // console.error('API returned error:', data.message);
        }
      } else {
        // console.error('Failed to fetch dashboard data:', response.status);
      }
    } catch (error) {
      // console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  // Update fee status from dashboard stats
  useEffect(() => {
    if (dashboardStats.totalFees > 0) {
      const isPaid = dashboardStats.paidFees >= dashboardStats.totalFees;
      setFeeStatus({
        totalFees: dashboardStats.totalFees,
        paidFees: dashboardStats.paidFees,
        nextDueDate: null, // You'll need to fetch this from API if available
        status: isPaid ? "Paid" : "Pending",
      });
    }
  }, [dashboardStats]);

  // Regenerate insights when data changes
  useEffect(() => {
    if (selectedStudent && activeTab === "dashboard") {
      generateInsights();
    }
  }, [
    selectedStudent,
    activeTab,
    attendanceStats,
    dashboardStats,
    feeStatus,
    academicPerformance,
  ]);

  // Calculate attendance stats when selectedStudent changes
  // Fetch all dashboard data when selectedStudent changes
  useEffect(() => {
    if (selectedStudent && activeTab === "dashboard") {
      // Fetch all dynamic data
      const fetchAllDashboardData = async () => {
        setLoadingInsights(true);
        try {
          await Promise.all([
            calculateAttendanceStats(),
            fetchRecentActivity(),
            fetchTodaySchedule(),
            fetchUpcomingDeadlines(),
            fetchUpcomingEvents(),
            fetchAcademicPerformance(),
          ]);
        } finally {
          setLoadingInsights(false);
        }
      };

      fetchAllDashboardData();
    }
  }, [selectedStudent, activeTab]);

  // Fetch grades for all children
  const fetchAllChildrenGrades = async () => {
    if (filteredChildren.length === 0) return;

    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      if (!token) return;

      const gradesMap: Record<string, number> = {};

      // Fetch grades for each child
      for (const child of filteredChildren) {
        try {
          const response = await fetch(
            `https://khwanzay.school/api/students/${child.id}/grades`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const grades = data.data?.grades || data.grades || data.data || [];

            if (Array.isArray(grades) && grades.length > 0) {
              const totalGrade = grades.reduce((sum: number, grade: any) => {
                const score = grade.score || grade.marks || grade.grade || 0;
                const maxScore = grade.maxScore || grade.totalMarks || 100;
                const percentage = (score / maxScore) * 100;
                return sum + percentage;
              }, 0);

              const averageGrade = Math.round(totalGrade / grades.length);
              gradesMap[child.id] = averageGrade;
            }
          }
        } catch (error) {
          // Continue with next child if one fails
          continue;
        }
      }

      setStudentGrades(gradesMap);
    } catch (error) {
      // console.error('Error fetching children grades:', error);
    }
  };

  // Fetch attendance data for all children
  const fetchChildrenAttendance = async () => {
    if (children.length === 0) return;

    setLoadingAttendance(true);
    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      if (!token) {
        // console.warn('No token found for attendance fetch');
        // Set children without attendance data
        setChildrenWithAttendance(
          children.map((child) => ({ ...child, attendance: 0 }))
        );
        return;
      }

      // console.log('🔍 Fetching attendance for children:', children.length);

      const childrenWithAttendanceData = await Promise.all(
        children.map(async (child: any) => {
          try {
            // console.log(`📊 Fetching attendance for child: ${child.firstName} ${child.lastName} (ID: ${child.id})`);

            // Fetch attendance records for this child
            const response = await fetch(
              `https://khwanzay.school/api/attendances?studentId=${child.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            // console.log(`📡 Response status for ${child.firstName}:`, response.status);

            if (response.ok) {
              const data = await response.json();
              // console.log(`📄 Raw attendance data for ${child.firstName}:`, data);

              // Handle the correct API response structure
              const attendanceRecords =
                data.data?.attendances ||
                data.attendances ||
                data.data ||
                data ||
                [];
              // console.log(`📋 Attendance records for ${child.firstName}:`, attendanceRecords);

              if (
                Array.isArray(attendanceRecords) &&
                attendanceRecords.length > 0
              ) {
                // Calculate attendance for current academic year (September to current month)
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth();

                // Academic year typically starts in September (month 8)
                const academicYearStart =
                  currentMonth >= 8 ? currentYear : currentYear - 1;
                const academicYearEnd =
                  currentMonth >= 8 ? currentYear + 1 : currentYear;

                // console.log(`📅 Using academic year: ${academicYearStart}-${academicYearEnd}`);

                const academicYearRecords = attendanceRecords.filter(
                  (record: any) => {
                    const recordDate = new Date(record.date);
                    const recordYear = recordDate.getFullYear();
                    const recordMonth = recordDate.getMonth();

                    // Include records from current academic year
                    if (recordYear === academicYearStart && recordMonth >= 8)
                      return true;
                    if (recordYear === academicYearEnd && recordMonth < 8)
                      return true;

                    return false;
                  }
                );

                // console.log(`📊 Academic year records for ${child.firstName}:`, academicYearRecords.length);

                if (academicYearRecords.length > 0) {
                  const presentDays = academicYearRecords.filter(
                    (r: any) => r.status === "PRESENT"
                  ).length;
                  const absentDays = academicYearRecords.filter(
                    (r: any) => r.status === "ABSENT"
                  ).length;
                  const totalDays = academicYearRecords.length;
                  const attendancePercentage =
                    totalDays > 0
                      ? Math.round((presentDays / totalDays) * 100)
                      : 0;

                  // console.log(`📊 Dashboard calculation for ${child.firstName}: ${presentDays} present / ${totalDays} total = ${attendancePercentage}%`);
                  // console.log(`📊 Detailed records for ${child.firstName}:`, academicYearRecords.map(r => ({ date: r.date, status: r.status })));

                  return {
                    ...child,
                    attendance: attendancePercentage,
                    attendanceDetails: {
                      present: presentDays,
                      absent: absentDays,
                      total: totalDays,
                    },
                  };
                } else {
                  // console.warn(`⚠️ No attendance records found for current academic year for ${child.firstName}`);
                  return {
                    ...child,
                    attendance: 0,
                    attendanceDetails: {
                      present: 0,
                      absent: 0,
                      total: 0,
                    },
                  };
                }
              } else {
                // console.warn(`⚠️ No attendance records found for ${child.firstName}`);
                return {
                  ...child,
                  attendance: 0,
                  attendanceDetails: {
                    present: 0,
                    absent: 0,
                    total: 0,
                  },
                };
              }
            } else {
              // console.error(`❌ Failed to fetch attendance for ${child.firstName}:`, response.status, response.statusText);
              return {
                ...child,
                attendance: 0,
                attendanceDetails: {
                  present: 0,
                  absent: 0,
                  total: 0,
                },
              };
            }
          } catch (error) {
            // console.error(`❌ Error fetching attendance for child ${child.id}:`, error);
            return {
              ...child,
              attendance: 0,
              attendanceDetails: {
                present: 0,
                absent: 0,
                total: 0,
              },
            };
          }
        })
      );

      // console.log('✅ Final children with attendance:', childrenWithAttendanceData);
      setChildrenWithAttendance(childrenWithAttendanceData);
    } catch (error) {
      // console.error('❌ Error fetching children attendance:', error);
      // Fallback to children with zero attendance
      setChildrenWithAttendance(
        children.map((child) => ({
          ...child,
          attendance: 0,
          attendanceDetails: {
            present: 0,
            absent: 0,
            total: 0,
          },
        }))
      );
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Fetch attendance and grades data when children data changes
  useEffect(() => {
    if (children.length > 0) {
      fetchChildrenAttendance();
    }
  }, [children]);

  // Fetch grades for all children when childrenWithAttendance changes
  useEffect(() => {
    if (childrenWithAttendance.length > 0) {
      fetchAllChildrenGrades();
    }
  }, [childrenWithAttendance]);

  // Test function to validate API response parsing (can be removed in production)
  const testAttendanceParsing = () => {
    const mockApiResponse: any = {
      success: true,
      message: "Attendances retrieved successfully",
      data: {
        attendances: [
          {
            id: 2485,
            date: "2025-10-14T12:00:00",
            status: "ABSENT",
            studentId: 72,
          },
          {
            id: 1194,
            date: "2025-10-07T12:00:00",
            status: "ABSENT",
            studentId: 72,
          },
        ],
      },
    };

    const attendanceRecords =
      mockApiResponse.data?.attendances ||
      mockApiResponse.attendances ||
      mockApiResponse.data ||
      mockApiResponse ||
      [];
    // console.log('🧪 Test parsing result:', attendanceRecords);
    // console.log('🧪 Expected: 2 records, Got:', attendanceRecords.length);

    if (attendanceRecords.length === 2) {
      const presentDays = attendanceRecords.filter(
        (r: any) => r.status === "PRESENT"
      ).length;
      const absentDays = attendanceRecords.filter(
        (r: any) => r.status === "ABSENT"
      ).length;
      const totalDays = attendanceRecords.length;
      const attendancePercentage =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // console.log('🧪 Test calculation: 0 present / 2 total = 0% (Expected: 0%)');
      // console.log('🧪 Test result:', { presentDays, absentDays, totalDays, attendancePercentage });
    }
  };

  // Fetch recent activity data dynamically
  const fetchRecentActivity = async () => {
    if (!selectedStudent) return;

    try {
      setLoadingActivity(true);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      if (!token) return;

      // Fetch recent activity for the selected student
      const response = await fetch(
        `https://khwanzay.school/api/activities?studentId=${selectedStudent}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const activities = data.data?.data || data.data || data || [];

        if (Array.isArray(activities)) {
          // Format activities with proper time formatting
          const formattedActivities = activities.map((activity: any) => ({
            id: activity.id || Math.random().toString(36).substr(2, 9),
            message:
              activity.message ||
              activity.description ||
              activity.title ||
              "Activity update",
            time: formatActivityTime(
              activity.timestamp || activity.createdAt || activity.date
            ),
            type: activity.type || "general",
            icon: activity.icon || getActivityIconFromType(activity.type),
          }));

          setRecentActivity(formattedActivities);
          // console.log('✅ Recent activity loaded:', formattedActivities);
        } else {
          // Fallback to generate sample activities if API returns unexpected format
          // console.warn('⚠️ Unexpected activity data format, using fallback');
          setRecentActivity(generateSampleActivities());
        }
      } else {
        // console.warn('⚠️ Failed to fetch activity data, using fallback');
        setRecentActivity(generateSampleActivities());
      }
    } catch (error) {
      // console.error('Error fetching recent activity:', error);
      setRecentActivity(generateSampleActivities());
    } finally {
      setLoadingActivity(false);
    }
  };

  // Fetch today's schedule for selected student
  const fetchTodaySchedule = async () => {
    if (!selectedStudent) return;

    try {
      setLoadingSchedule(true);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      if (!token) return;

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const dayOfWeek = new Date().toLocaleDateString("en-US", {
        weekday: "long",
      }); // "Monday", "Tuesday", etc.

      // Try to fetch schedule from API
      const response = await fetch(
        `https://khwanzay.school/api/students/${selectedStudent}/schedule?date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const scheduleData =
          data.data?.schedule || data.schedule || data.data || [];

        if (Array.isArray(scheduleData) && scheduleData.length > 0) {
          // Map API response to our format
          const formattedSchedule = scheduleData.map((period: any) => {
            const startTime =
              period.startTime || period.time?.split("-")[0]?.trim() || "00:00";
            const endTime =
              period.endTime || period.time?.split("-")[1]?.trim() || "00:00";
            const currentTime = new Date();
            const periodStart = new Date(`${today}T${startTime}`);
            const periodEnd = new Date(`${today}T${endTime}`);

            let status = "upcoming";
            if (currentTime > periodEnd) {
              status = "completed";
            } else if (currentTime >= periodStart && currentTime <= periodEnd) {
              status = "ongoing";
            }

            return {
              time: `${startTime} - ${endTime}`,
              subject:
                period.subject ||
                period.subjectName ||
                period.course ||
                "Subject",
              teacher: period.teacher || period.teacherName || "Teacher",
              room: period.room || period.classroom || "",
              status: status,
            };
          });

          setTodaySchedule(formattedSchedule);
          // console.log('✅ Today\'s schedule loaded:', formattedSchedule);
          return;
        }
      }

      // Fallback: Generate schedule from student's enrolled subjects/classes
      const fallbackResponse = await fetch(
        `https://khwanzay.school/api/students/${selectedStudent}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (fallbackResponse.ok) {
        const studentData = await fallbackResponse.json();
        const student = studentData.data || studentData;

        // If student has enrolled classes, use those
        if (student.enrolledClasses && Array.isArray(student.enrolledClasses)) {
          const currentHour = new Date().getHours();
          const generatedSchedule = student.enrolledClasses
            .slice(0, 4)
            .map((cls: any, idx: number) => {
              const hour = 8 + idx; // Start at 8 AM
              let status = "upcoming";
              if (currentHour > hour) status = "completed";
              else if (currentHour === hour) status = "ongoing";

              return {
                time: `${hour}:00 - ${hour + 1}:00`,
                subject: cls.subject?.name || cls.courseName || "Subject",
                teacher: cls.teacher?.firstName
                  ? `${cls.teacher.firstName} ${cls.teacher.lastName}`
                  : "Teacher",
                status: status,
              };
            });

          setTodaySchedule(generatedSchedule);
          // console.log('✅ Schedule generated from enrolled classes:', generatedSchedule);
          return;
        }
      }

      // Ultimate fallback: Empty schedule
      setTodaySchedule([]);
      // console.warn('⚠️ No schedule data available for today');
    } catch (error) {
      // console.error('Error fetching today\'s schedule:', error);
      setTodaySchedule([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Fetch upcoming assignment deadlines
  const fetchUpcomingDeadlines = async () => {
    if (!selectedStudent) return;

    try {
      setLoadingDeadlines(true);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      if (!token) return;

      // Fetch assignments for the student
      const response = await fetch(
        `https://khwanzay.school/api/students/${selectedStudent}/assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const assignments =
          data.data?.assignments || data.assignments || data.data || [];

        if (Array.isArray(assignments)) {
          const now = new Date();

          // Filter for pending/upcoming assignments
          const pendingAssignments = assignments
            .filter((assignment: any) => {
              const dueDate = new Date(
                assignment.dueDate || assignment.deadline
              );
              const isNotSubmitted =
                assignment.status !== "SUBMITTED" &&
                assignment.submissionStatus !== "SUBMITTED";
              const isFuture = dueDate >= now;
              return isNotSubmitted && isFuture;
            })
            .sort((a: any, b: any) => {
              const dateA = new Date(a.dueDate || a.deadline);
              const dateB = new Date(b.dueDate || b.deadline);
              return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 5) // Top 5 upcoming deadlines
            .map((assignment: any) => {
              const dueDate = new Date(
                assignment.dueDate || assignment.deadline
              );
              const daysLeft = Math.ceil(
                (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );

              // Determine priority based on days left
              let priority = "low";
              if (daysLeft <= 2) priority = "high";
              else if (daysLeft <= 5) priority = "medium";

              return {
                id: assignment.id,
                title: assignment.title || assignment.name || "Assignment",
                subject:
                  assignment.subject?.name ||
                  assignment.subjectName ||
                  assignment.course ||
                  "Subject",
                dueDate: assignment.dueDate || assignment.deadline,
                priority: priority,
                status: assignment.status || "PENDING",
              };
            });

          setUpcomingDeadlines(pendingAssignments);
          // console.log('✅ Upcoming deadlines loaded:', pendingAssignments);
        } else {
          setUpcomingDeadlines([]);
        }
      } else {
        setUpcomingDeadlines([]);
      }
    } catch (error) {
      // console.error('Error fetching upcoming deadlines:', error);
      setUpcomingDeadlines([]);
    } finally {
      setLoadingDeadlines(false);
    }
  };

  // Fetch upcoming school events
  const fetchUpcomingEvents = async () => {
    try {
      setLoadingEvents(true);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "https://khwanzay.school/api/events?upcoming=true&limit=5",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const events = data.data?.events || data.events || data.data || [];

        if (Array.isArray(events)) {
          const now = new Date();

          const formattedEvents = events
            .filter((event: any) => {
              const eventDate = new Date(event.date || event.startDate);
              return eventDate >= now; // Only future events
            })
            .sort((a: any, b: any) => {
              const dateA = new Date(a.date || a.startDate);
              const dateB = new Date(b.date || b.startDate);
              return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 3) // Top 3 events
            .map((event: any) => ({
              id: event.id,
              title: event.title || event.name || "Event",
              date: event.date || event.startDate,
              type: event.type?.toLowerCase() || "event",
              description: event.description || "",
            }));

          setUpcomingEvents(formattedEvents);
          // console.log('✅ Upcoming events loaded:', formattedEvents);
        } else {
          setUpcomingEvents([]);
        }
      } else {
        setUpcomingEvents([]);
      }
    } catch (error) {
      // console.error('Error fetching upcoming events:', error);
      setUpcomingEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Generate AI insights based on student data
  const generateInsights = () => {
    if (!selectedStudent) return;

    try {
      const insightsList: any[] = [];

      // Insight 0: Attendance Summary (always show)
      insightsList.push({
        id: "attendance-summary",
        type: "info",
        icon: "clipboard",
        title: "Attendance Overview",
        message: `This Month: ${attendanceStats.currentMonthAttendance}% | Present: ${attendanceStats.totalPresentDays} days | Absent: ${attendanceStats.totalAbsentDays} days`,
      });

      // Insight 1: Attendance Performance
      if (attendanceStats.currentMonthAttendance >= 95) {
        insightsList.push({
          id: "attendance-excellent",
          type: "success",
          icon: "check",
          title: "Perfect Attendance!",
          message: `${attendanceStats.currentMonthAttendance}% attendance this month. Keep it up!`,
        });
      } else if (attendanceStats.attendanceTrend === "improving") {
        insightsList.push({
          id: "attendance-improving",
          type: "success",
          icon: "trending-up",
          title: "Great Progress!",
          message: `Attendance improved from ${attendanceStats.lastMonthAttendance}% to ${attendanceStats.currentMonthAttendance}%`,
        });
      } else if (attendanceStats.currentMonthAttendance < 75) {
        insightsList.push({
          id: "attendance-warning",
          type: "warning",
          icon: "warning",
          title: "Attendance Alert",
          message: `Only ${attendanceStats.currentMonthAttendance}% attendance. Please improve.`,
        });
      }

      // Insight 2: Pending Assignments
      if (dashboardStats.pendingAssignments > 0) {
        insightsList.push({
          id: "assignments-pending",
          type: dashboardStats.pendingAssignments > 3 ? "warning" : "info",
          icon: "clipboard",
          title: "Action Needed",
          message: `${dashboardStats.pendingAssignments} assignment${
            dashboardStats.pendingAssignments > 1 ? "s" : ""
          } due soon`,
        });
      } else if (dashboardStats.submittedAssignments > 0) {
        insightsList.push({
          id: "assignments-complete",
          type: "success",
          icon: "check",
          title: "All Caught Up!",
          message: `All ${dashboardStats.submittedAssignments} assignments submitted`,
        });
      }

      // Insight 3: Fee Status
      if (
        feeStatus.totalFees > 0 &&
        feeStatus.paidFees >= feeStatus.totalFees
      ) {
        insightsList.push({
          id: "fees-paid",
          type: "success",
          icon: "dollar",
          title: "Fees Paid",
          message: "All fees are up to date!",
        });
      } else if (feeStatus.totalFees > feeStatus.paidFees) {
        const remaining = feeStatus.totalFees - feeStatus.paidFees;
        insightsList.push({
          id: "fees-pending",
          type: "warning",
          icon: "dollar",
          title: "Fees Pending",
          message: `$${remaining} remaining to be paid`,
        });
      }

      // Insight 4: Academic Performance (if available)
      if (academicPerformance.averageGrade > 0) {
        if (academicPerformance.averageGrade >= 85) {
          insightsList.push({
            id: "academic-excellent",
            type: "success",
            icon: "star",
            title: "Excellent Performance!",
            message: `Maintaining ${academicPerformance.averageGrade}% average`,
          });
        } else if (academicPerformance.trend > 0) {
          insightsList.push({
            id: "academic-improving",
            type: "success",
            icon: "trending-up",
            title: "Academic Progress",
            message: `Grades improved by ${academicPerformance.trend}%`,
          });
        }
      }

      // Set all insights (no limit)
      setInsights(insightsList);
      // console.log('✅ Insights generated:', insightsList);
    } catch (error) {
      // console.error('Error generating insights:', error);
      setInsights([]);
    }
  };

  // Fetch student grades and calculate average
  const fetchAcademicPerformance = async () => {
    if (!selectedStudent) return;

    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      if (!token) return;

      // Try to fetch grades/test results
      const response = await fetch(
        `https://khwanzay.school/api/students/${selectedStudent}/grades`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const grades = data.data?.grades || data.grades || data.data || [];

        if (Array.isArray(grades) && grades.length > 0) {
          // Calculate average grade
          const totalGrade = grades.reduce((sum: number, grade: any) => {
            const score = grade.score || grade.marks || grade.grade || 0;
            const maxScore = grade.maxScore || grade.totalMarks || 100;
            const percentage = (score / maxScore) * 100;
            return sum + percentage;
          }, 0);

          const averageGrade = Math.round(totalGrade / grades.length);

          // Count top performing subjects (>= 85%)
          const topSubjects = grades.filter((grade: any) => {
            const score = grade.score || grade.marks || grade.grade || 0;
            const maxScore = grade.maxScore || grade.totalMarks || 100;
            const percentage = (score / maxScore) * 100;
            return percentage >= 85;
          }).length;

          // Calculate trend (compare with previous month/term)
          // This is simplified - you'd need historical data for accurate trend
          const trend = averageGrade >= 85 ? 3 : 0;

          setAcademicPerformance({
            averageGrade,
            trend,
            topSubjects,
          });

          // Also update studentGrades for child cards
          setStudentGrades((prev) => ({
            ...prev,
            [selectedStudent]: averageGrade,
          }));

          // console.log('✅ Academic performance loaded:', { averageGrade, trend, topSubjects });
          return;
        }
      }

      // Fallback: Use default values
      setAcademicPerformance({
        averageGrade: 0,
        trend: 0,
        topSubjects: 0,
      });
    } catch (error) {
      // console.error('Error fetching academic performance:', error);
      setAcademicPerformance({
        averageGrade: 0,
        trend: 0,
        topSubjects: 0,
      });
    }
  };

  // Format activity time to relative format
  const formatActivityTime = (timestamp: string | Date) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - activityDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    return activityDate.toLocaleDateString();
  };

  // Get activity icon based on type
  const getActivityIconFromType = (type: string) => {
    switch (type?.toLowerCase()) {
      case "assignment":
        return "document";
      case "attendance":
        return "check";
      case "grade":
      case "test":
      case "exam":
        return "chart";
      case "fee":
        return "dollar";
      case "notification":
        return "bell";
      default:
        return "document";
    }
  };

  // Generate sample activities as fallback
  const generateSampleActivities = () => {
    const now = new Date();
    return [
      {
        id: "1",
        message: t("parentPortal.dashboard.recentActivity.newAssignment"),
        time: t("parentPortal.dashboard.recentActivity.timeAgo", {
          count: 2,
          unit: "hours",
        }),
        type: "assignment",
      },
      {
        id: "2",
        message: t("parentPortal.dashboard.recentActivity.attendanceMarked"),
        time: t("parentPortal.dashboard.recentActivity.timeAgo", {
          count: 4,
          unit: "hours",
        }),
        type: "attendance",
      },
      {
        id: "3",
        message: t("parentPortal.dashboard.recentActivity.testResults"),
        time: t("parentPortal.dashboard.recentActivity.timeAgo", {
          count: 1,
          unit: "day",
        }),
        type: "grade",
      },
      {
        id: "4",
        message: t("parentPortal.dashboard.recentActivity.upcomingExam"),
        time: t("parentPortal.dashboard.recentActivity.timeAgo", {
          count: 2,
          unit: "days",
        }),
        type: "exam",
      },
    ];
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    // console.log('Marking as read:', notificationId); // Debug

    try {
      setMarkingAsRead(notificationId);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      const response = await fetch(
        `https://khwanzay.school/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationId: notificationId }),
        }
      );
      // console.log('Response status:', response.status);

      if (response.ok) {
        // Update local state
        setNotificationsList((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      } else {
        // console.error('Failed to mark notification as read');
      }
    } catch (error) {
      // console.error('Error marking notification as read:', error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  // Load more handler
  const handleLoadMore = () => {
    setVisibleNotifications((prev) => prev + 10);
  };

  // Reset visible notifications when panel closes
  useEffect(() => {
    if (!notificationsOpen) {
      setVisibleNotifications(10);
    }
  }, [notificationsOpen]);

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      const response = await fetch(
        "https://khwanzay.school/api/notifications/mark-all-read",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Update local state - mark all as read
        setNotificationsList((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
        // setUnreadCount(0)
      } else {
        // console.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      // console.error('Error marking all notifications as read:', error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const tabs = [
    {
      id: "dashboard",
      label: t("parentPortal.tabs.dashboard"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
          />
        </svg>
      ),
    },
    {
      id: "attendance",
      label: t("parentPortal.tabs.attendance"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    // {
    //   id: 'academics',
    //   label: 'Academics',
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    //     </svg>
    //   )
    // },
    {
      id: "assignments",
      label: t("parentPortal.tabs.assignments"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: "fees",
      label: t("parentPortal.tabs.fees"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
    {
      id: "suggestions",
      label: t("parentPortal.tabs.suggestions"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    // {
    //   id: 'exams',
    //   label: 'Exams',
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    //     </svg>
    //   )
    //     },
    {
      id: "profile",
      label: t("parentPortal.tabs.profile"),
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    // {
    //   id: 'overview',
    //   label: 'Overview',
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    //     </svg>
    //   )
    // },
  ];

  // handle refresh on each component separatly

  const renderTabContent = () => {
    if (!selectedStudent) return null;

    switch (activeTab) {
      case "attendance":
        return (
          <AttendanceTracker
            key={`${activeTab}-${refreshKey}`}
            studentId={selectedStudent}
            children={children}
          />
        );
      // case 'academics':
      //   return <AcademicProgress key={`${activeTab}-${refreshKey}`} studentId={selectedStudent} />;
      case "assignments":
        return (
          <Assignments
            key={`${activeTab}-${refreshKey}`}
            selectedStudent={selectedStudent}
            children={children}
          />
        );
      case "fees":
        return (
          <FeeManagement
            key={`${activeTab}-${refreshKey}`}
            studentId={selectedStudent}
            parentId="1"
          />
        );
      case "suggestions":
        return (
          <SuggestionComplaintBox
            key={`${activeTab}-${refreshKey}`}
            userId={user?.id || "1"}
            selectedStudent={selectedStudent}
          />
        );
      case "profile" as TabType:
        return <div key={`${activeTab}-${refreshKey}`}>{renderProfile()}</div>;
      // case 'exams':
      //   return <ExamSchedule key={`${activeTab}-${refreshKey}`} studentId={selectedStudent} />;
      // case 'overview':
      //   return <StudentOverview key={`${activeTab}-${refreshKey}`} studentId={selectedStudent} />;
      default:
        return (
          <div key={`${activeTab}-${refreshKey}`}>{renderDashboard()}</div>
        );
    }
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="space-y-2 sm:space-y-6 pb-6">
          <div className="bg-blue-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  Loading Dashboard...
                </h2>
                <p className="text-indigo-100 text-lg">
                  Fetching your children's data
                </p>
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse"
              >
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1 sm:space-y-6 pb-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-gray-900 border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-2 text-gray-900">
                {t("parentPortal.header.welcomeBack")}
                <HiOutlineHandRaised className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </h2>
              <p className="text-gray-600 text-base sm:text-lg">
                {t("parentPortal.header.subtitle")}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-gray-500 text-sm sm:text-base">
                {t("parentPortal.dashboard.todayDate")}
              </p>
              <p className="text-lg sm:text-xl font-semibold text-gray-900">
                {new Date().toLocaleDateString(
                  i18n.language === "en"
                    ? "en-US"
                    : i18n.language === "fa-AF"
                    ? "fa-AF"
                    : "ps-AF",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Student Selector - Only show if multiple children */}
        {children.length > 1 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                {t("parentPortal.dashboard.viewingDataFor")}:
              </span>
              <div className="flex gap-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedStudent(child.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                      selectedStudent === child.id
                        ? "bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm"
                        : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        selectedStudent === child.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-700"
                      }`}
                    >
                      {child.firstName[0]}
                      {child.lastName[0]}
                    </div>
                    <span className="font-medium text-sm">
                      {child.firstName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Grid - Responsive 1/2/4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-4">
          {/* Attendance Card */}
          <div
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
            onClick={() => setActiveTab("attendance")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <HiCheckCircle className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {attendanceStats.attendancePeriod}
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              {t("parentPortal.tabs.attendance")}
            </p>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-3xl font-bold text-gray-900">
                {attendanceStats.currentMonthAttendance}%
              </p>
              {attendanceStats.attendanceTrend === "improving" && (
                <span className="text-green-600 text-sm font-medium">
                  ↗ +5%
                </span>
              )}
            </div>
            <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${attendanceStats.currentMonthAttendance}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {attendanceStats.totalPresentDays} /{" "}
              {attendanceStats.totalPresentDays +
                attendanceStats.totalAbsentDays}{" "}
              days
            </p>
          </div>

          {/* Assignments Card */}
          <div
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
            onClick={() => setActiveTab("assignments")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <HiClipboardDocumentList className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </div>
              {dashboardStats.pendingAssignments > 0 && (
                <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                  {dashboardStats.pendingAssignments} due
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              {t("parentPortal.dashboard.stats.totalAssignments")}
            </p>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-3xl font-bold text-gray-900">
                {dashboardStats.totalAssignments}
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 font-medium">
                ✓ {dashboardStats.submittedAssignments}
              </span>
              <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200 font-medium">
                ⏳ {dashboardStats.pendingAssignments}
              </span>
            </div>
          </div>

          {/* Academic Performance Card - DYNAMIC */}
          <div
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
            onClick={() => setActiveTab("assignments")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <HiChartBar className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {t("parentPortal.dashboard.thisMonth")}
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              {t("parentPortal.dashboard.avgGrade")}
            </p>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-3xl font-bold text-gray-900">
                {academicPerformance.averageGrade > 0
                  ? `${academicPerformance.averageGrade}%`
                  : "N/A"}
              </p>
              {academicPerformance.trend > 0 && (
                <span className="text-green-600 text-sm font-medium">
                  ↗ +{academicPerformance.trend}%
                </span>
              )}
            </div>
            <div className="text-xs">
              {academicPerformance.topSubjects > 0 ? (
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                  Top in {academicPerformance.topSubjects} subject
                  {academicPerformance.topSubjects > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-gray-400">No grades yet</span>
              )}
            </div>
          </div>

          {/* Fee Status Card - DYNAMIC */}
          <div
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
            onClick={() => setActiveTab("fees")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <HiCurrencyDollar className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded border ${
                  feeStatus.status === "Paid"
                    ? "text-green-700 bg-green-50 border-green-200"
                    : "text-orange-700 bg-orange-50 border-orange-200"
                }`}
              >
                {feeStatus.status === "Paid" ? "✅️" : ""}
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              {t("parentPortal.dashboard.feeStatus")}
            </p>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-3xl font-bold text-gray-900">
                ${feeStatus.paidFees || dashboardStats.paidFees}
              </p>
              <span className="text-gray-400 text-sm">
                / ${feeStatus.totalFees || dashboardStats.totalFees}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {feeStatus.status === "Paid" ? (
                <span className="text-green-600 font-semibold">
                  {t("parentPortal.dashboard.allPaid")}
                </span>
              ) : feeStatus.nextDueDate ? (
                <>
                  {t("parentPortal.dashboard.nextDue")}:{" "}
                  <span className="font-semibold text-gray-700">
                    {new Date(feeStatus.nextDueDate).toLocaleDateString()}
                  </span>
                </>
              ) : (
                <span className="text-orange-600 font-semibold">
                  {t("parentPortal.dashboard.paymentPending")}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Main Content Grid - Responsive 1/1/3 columns */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 sm:gap-6">
          {/* Left Column - Spans 2 columns on xl screens */}
          <div className="xl:col-span-2 space-y-1 sm:space-y-6">
            {/* Today's Schedule - DYNAMIC */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <HiClock className="w-5 h-5 text-blue-500" />
                  {t("parentPortal.dashboard.todaySchedule")}
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString(i18n.language, {
                    weekday: "long",
                  })}
                </span>
              </div>

              <div className="space-y-3">
                {loadingSchedule ? (
                  [...Array(4)].map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse bg-gray-100 rounded-lg h-20"
                    ></div>
                  ))
                ) : todaySchedule.length > 0 ? (
                  todaySchedule.map((period, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all ${
                        period.status === "ongoing"
                          ? "border-blue-300 bg-blue-50 shadow-sm"
                          : period.status === "completed"
                          ? "border-gray-200 bg-gray-50 opacity-60"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`min-w-[60px] sm:min-w-[70px] text-center py-2 px-2 rounded-md text-xs sm:text-sm font-medium ${
                          period.status === "ongoing"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {period.time.split(" - ")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {period.subject}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {period.teacher}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {period.status === "ongoing" && (
                          <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full font-medium whitespace-nowrap">
                            {t("parentPortal.dashboard.liveNow")}
                          </span>
                        )}
                        {period.status === "completed" && (
                          <HiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiClock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {t("parentPortal.dashboard.noSchedule")}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {t("parentPortal.dashboard.scheduleAppear")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {t("parentPortal.dashboard.recentActivity.title")}
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-1 sm:flex-initial">
                    {["all", "assignments", "attendance", "grades"].map(
                      (filter) => (
                        <button
                          key={filter}
                          onClick={() => setActivityFilter(filter)}
                          className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all flex-1 sm:flex-initial ${
                            activityFilter === filter
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      )
                    )}
                  </div> */}
                  <button
                    onClick={fetchRecentActivity}
                    disabled={loadingActivity}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <HiArrowPath
                      className={`w-4 h-4 text-gray-600 ${
                        loadingActivity ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="hidden sm:block absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-4">
                  {loadingActivity ? (
                    [...Array(4)].map((_, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 sm:pl-12"
                      >
                        <div className="animate-pulse flex-1 bg-gray-100 rounded-lg p-4 h-20"></div>
                      </div>
                    ))
                  ) : recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => {
                      const getActivityIcon = (
                        message: string,
                        type?: string
                      ) => {
                        const messageLower = message.toLowerCase();
                        const typeLower = type?.toLowerCase() || "";

                        if (
                          typeLower === "assignment" ||
                          messageLower.includes("assignment")
                        ) {
                          return (
                            <HiDocumentText className="w-5 h-5 text-gray-600" />
                          );
                        }
                        if (
                          typeLower === "attendance" ||
                          messageLower.includes("attendance")
                        ) {
                          return (
                            <HiCheckCircle className="w-5 h-5 text-gray-600" />
                          );
                        }
                        if (
                          typeLower === "grade" ||
                          typeLower === "test" ||
                          messageLower.includes("test")
                        ) {
                          return (
                            <HiChartBar className="w-5 h-5 text-gray-600" />
                          );
                        }
                        if (
                          typeLower === "exam" ||
                          messageLower.includes("exam")
                        ) {
                          return (
                            <HiBookOpen className="w-5 h-5 text-gray-600" />
                          );
                        }
                        return (
                          <HiDocumentText className="w-5 h-5 text-gray-600" />
                        );
                      };

                      return (
                        <div
                          key={activity.id || index}
                          className="relative flex items-start gap-3 sm:gap-4 sm:pl-12"
                        >
                          <div className="hidden sm:block absolute left-3 w-4 h-4 rounded-full border-2 border-white bg-gray-400 shadow-sm"></div>

                          <div className="sm:hidden w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getActivityIcon(activity.message, activity.type)}
                          </div>

                          <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm sm:text-base">
                                  {activity.message}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                  {activity.time}
                                </p>
                              </div>
                              {activity.actionable && (
                                <button className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 whitespace-nowrap">
                                  View
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HiDocumentText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">
                        {t("parentPortal.dashboard.noRecentActivity")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines - DYNAMIC */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <HiCalendar className="w-5 h-5 text-blue-500" />
                  {t("parentPortal.dashboard.upcomingDeadlines")}
                </h3>
                <button
                  onClick={() => setActiveTab("assignments")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t("parentPortal.dashboard.viewAll")}
                </button>
              </div>

              <div className="space-y-3">
                {loadingDeadlines ? (
                  [...Array(3)].map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse bg-gray-100 rounded-lg h-20"
                    ></div>
                  ))
                ) : upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((deadline, idx) => {
                    const daysLeft = Math.ceil(
                      (new Date(deadline.dueDate).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div
                        key={deadline.id || idx}
                        className={`flex items-center gap-3 sm:gap-4 p-4 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                          deadline.priority === "high"
                            ? "border-red-200 bg-red-50"
                            : deadline.priority === "medium"
                            ? "border-orange-200 bg-orange-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                        onClick={() => setActiveTab("assignments")}
                      >
                        <div
                          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                            deadline.priority === "high"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : deadline.priority === "medium"
                              ? "bg-orange-100 text-orange-700 border border-orange-200"
                              : "bg-gray-200 text-gray-700 border border-gray-300"
                          }`}
                        >
                          <div className="text-lg sm:text-xl font-bold">
                            {daysLeft}
                          </div>
                          <div className="text-xs">days</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {deadline.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {deadline.subject}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-500">Due</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                            {new Date(deadline.dueDate).toLocaleDateString(
                              i18n.language,
                              { month: "short", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiCalendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {t("parentPortal.dashboard.noDateLine")}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {t("parentPortal.dashboard.assignment")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-2 sm:space-y-6">
            {/* Children List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                {t("parentPortal.dashboard.myChildren")}
              </h3>

              {loadingChildren ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-gray-100 rounded-lg h-32"
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredChildren.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => setSelectedStudent(child.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedStudent === child.id
                          ? "border-blue-300 bg-blue-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                            selectedStudent === child.id
                              ? "bg-blue-500"
                              : "bg-gray-400"
                          }`}
                        >
                          {child.firstName[0]}
                          {child.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                            {child.firstName} {child.lastName}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {child.grade} - {child.section}
                          </p>
                        </div>
                        {selectedStudent === child.id && (
                          <HiCheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Compact Stats - DYNAMIC GRADE */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                          <div className="text-green-600 font-bold text-base sm:text-lg">
                            {child.attendance || 0}%
                          </div>
                          <div className="text-gray-500 text-xs">
                            {t("parentPortal.dashboard.attendance")}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center border border-gray-200">
                          <div className="text-blue-600 font-bold text-base sm:text-lg">
                            {child.grade || "—"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {t("parentPortal.dashboard.class")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {t("parentPortal.dashboard.quickActionM")}
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("assignments")}
                  className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center justify-between group text-sm sm:text-base"
                >
                  <div className="flex items-center gap-3">
                    <HiClipboardDocumentList className="w-5 h-5" />
                    <span className="font-medium">
                      {t("parentPortal.dashboard.quickActions.viewAssignments")}
                    </span>
                  </div>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setActiveTab("attendance")}
                  className="w-full p-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-between group text-sm sm:text-base"
                >
                  <div className="flex items-center gap-3">
                    <HiCheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      {t("parentPortal.dashboard.quickActions.viewAttendance")}
                    </span>
                  </div>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setActiveTab("suggestions")}
                  className="w-full p-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-between group text-sm sm:text-base"
                >
                  <div className="flex items-center gap-3">
                    <HiChatBubbleLeftRight className="w-5 h-5" />
                    <span className="font-medium">
                      {t("parentPortal.dashboard.quickActions.contactTeacher")}
                    </span>
                  </div>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* AI Insights - DYNAMIC */}
            <div className="bg-white rounded-xl p-6 shadow-sm text-black">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <HiSparkles className="w-5 h-5" />
                {t("parentPortal.dashboard.insightsTitle")}
              </h3>
              <div className="space-y-3">
                {loadingInsights ? (
                  [...Array(3)].map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse bg-white/10 rounded-lg h-16"
                    ></div>
                  ))
                ) : insights.length > 0 ? (
                  insights.map((insight, idx) => (
                    <div
                      key={insight.id || idx}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            insight.type === "success"
                              ? "bg-green-500"
                              : insight.type === "warning"
                              ? "bg-orange-500"
                              : "bg-blue-400"
                          }`}
                        >
                          {insight.icon === "check" && (
                            <HiCheckCircle className="w-4 h-4 text-white" />
                          )}
                          {insight.icon === "warning" && (
                            <HiExclamationTriangle className="w-4 h-4 text-white" />
                          )}
                          {insight.icon === "trending-up" && (
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                          )}
                          {insight.icon === "clipboard" && (
                            <HiClipboardDocumentList className="w-4 h-4 text-white" />
                          )}
                          {insight.icon === "dollar" && (
                            <HiCurrencyDollar className="w-4 h-4 text-white" />
                          )}
                          {insight.icon === "star" && (
                            <HiSparkles className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            {insight.title}
                          </p>
                          <p className="text-xs text-black/90 mt-1">
                            {insight.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-black text-sm">
                    <p>{t("parentPortal.dashboard.studentAnalyzing")}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {t("parentPortal.dashboard.insights")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Events - DYNAMIC */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HiCalendar className="w-5 h-5 text-blue-500" />

                {t("parentPortal.dashboard.upcommingEvent")}
              </h3>
              <div className="space-y-3 text-black">
                {loadingEvents ? (
                  [...Array(3)].map((_, idx) => (
                    <div
                      key={idx}
                      className="animate-pulse bg-gray-100 rounded-lg h-16"
                    ></div>
                  ))
                ) : upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event, idx) => (
                    <div
                      key={event.id || idx}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 cursor-pointer"
                    >
                      <div
                        className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                          event.type === "meeting"
                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        <div className="text-xs font-semibold">
                          {new Date(event.date).toLocaleDateString("en", {
                            month: "short",
                          })}
                        </div>
                        <div className="text-lg font-bold">
                          {new Date(event.date).getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString(
                            i18n.language,
                            { weekday: "long" }
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <HiCalendar className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {t("parentPortal.dashboard.noUpcommingEventst")}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {t("parentPortal.dashboard.eventAppear")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Profile state and effects are declared at top level to keep hook order stable
  const [profile, setProfile] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState<boolean>(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  // Change password state
  const [showChangePassword, setShowChangePassword] =
    React.useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = React.useState<string>("");
  const [newPassword, setNewPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [changingPassword, setChangingPassword] =
    React.useState<boolean>(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(
    null
  );

  useEffect(() => {
    if (activeTab !== ("profile" as TabType)) return;
    let cancelled = false;
    const loadMe = async () => {
      try {
        setLoadingProfile(true);
        setProfileError(null);
        const token =
          localStorage.getItem("userToken") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("token");
        const res = await fetch("https://khwanzay.school/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const data = await res.json();
        if (!cancelled) setProfile(data?.data || data);
      } catch (e: any) {
        if (!cancelled) setProfileError(e.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };
    loadMe();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // Change password function
  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      if (!token) {
        setPasswordError("Authentication token not found");
        return;
      }

      const response = await fetch(
        "https://khwanzay.school/api/auth/change-password",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordSuccess(null);
        }, 2000);
      } else {
        setPasswordError(data.message || "Failed to change password");
      }
    } catch (error: any) {
      // console.error('Error changing password:', error);
      setPasswordError("Network error. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  const renderProfile = () => {
    if (loadingProfile) {
      return (
        <div className="space-y-2 sm:space-y-6 pb-6">
          <div className="bg-blue-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Loading Profile...</h2>
                <p className="text-indigo-100 text-lg">
                  Fetching your profile information
                </p>
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse"
              >
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (profileError) {
      return (
        <div className="space-y-2 sm:space-y-6 pb-6">
          <div className="bg-white rounded-2xl p-8 text-black">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Profile Error</h2>
                <p className="text-black text-lg">{profileError}</p>
              </div>
              <div className="text-black text-6xl">⚠️</div>
            </div>
          </div>
        </div>
      );
    }

    const firstName = profile?.firstName || "";
    const lastName = profile?.lastName || "";
    const username = profile?.username || "";
    const fullName = `${firstName} ${lastName}`.trim() || "Parent User";
    const email = profile?.email || "—";
    const phone = profile?.phone || "—";
    const role = profile?.role || "PARENT";
    const status = profile?.status || "ACTIVE";
    const timezone = profile?.timezone || "—";
    const locale = profile?.locale || "—";
    const createdAt = profile?.createdAt
      ? new Date(profile.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "—";
    const updatedAt = profile?.updatedAt
      ? new Date(profile.updatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "—";

    // School information
    const school = profile?.school;
    const schoolName = school?.name || "—";
    const schoolShortName = school?.shortName || "—";
    const schoolCode = school?.code || "—";
    const schoolThemeColor = school?.themeColor || "#0044cc";
    const schoolTimezone = school?.timezone || "—";
    const schoolLocale = school?.locale || "—";
    const schoolCurrency = school?.currency || "—";
    const schoolStatus = school?.status || "—";

    return (
      <div className="space-y-1 sm:space-y-6 pb-6">
        {/* Profile Header */}
        <div className="bg-blue-600 text-white rounded-2xl p-6 flex gap-4 rounded-lg sm:p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-sm text-white font-bold flex items-center justify-center text-3xl sm:text-4xl border-2 border-white/30 shadow-lg mx-6">
                  {firstName[0]}
                  {lastName[0] || firstName[1] || "P"}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">
                  {fullName}
                </h2>
                <p className="text-blue-100 text-base sm:text-lg mb-3">
                  @{username}
                </p>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 rounded-full text-sm bg-white/20 text-white border border-white/30 font-medium backdrop-blur-sm">
                    {role === "PARENT"
                      ? t("parentPortal.profile.parent")
                      : role}
                  </span>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${
                      status === "ACTIVE"
                        ? "bg-green-500/30 text-green-100 border border-green-400/50"
                        : "bg-red-500/30 text-red-100 border border-red-400/50"
                    }`}
                  >
                    {status === "ACTIVE"
                      ? t("parentPortal.profile.active")
                      : status}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-blue-100 text-sm sm:text-base mb-1">
                {t("parentPortal.profile.memberSince")}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {createdAt}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-8">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {t("parentPortal.profile.personalInformation")}
                </h3>
                <p className="text-gray-500 text-sm">
                  {t("parentPortal.profile.personalDetails")}
                </p>
              </div>
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm font-medium">
                      {t("parentPortal.profile.fullName")}
                    </span>
                    <p className="text-gray-900 font-semibold">{fullName}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 114 0v2"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm font-medium">
                      {t("parentPortal.profile.username")}
                    </span>
                    <p className="text-gray-900 font-semibold">@{username}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm font-medium">
                      {t("parentPortal.profile.email")}
                    </span>
                    <p className="text-gray-900 font-semibold">{email}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm font-medium">
                      {t("parentPortal.profile.phone")}
                    </span>
                    <p className="text-gray-900 font-semibold">{phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - School Information and Account Settings */}
          <div className="space-y-2 sm:space-y-6 flex flex-col h-full">
            {/* School Information */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-400 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {t("parentPortal.profile.schoolInformation")}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {t("parentPortal.profile.schoolDetails")}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm font-medium">
                      {t("parentPortal.profile.schoolName")}
                    </span>
                    <p className="text-gray-900 font-semibold">{schoolName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-400 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {t("parentPortal.profile.accountSettings")}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {t("parentPortal.profile.manageAccount")}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm font-medium">
                        {t("parentPortal.profile.accountCreated")}
                      </span>
                      <p className="text-gray-900 font-semibold">{createdAt}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="w-full px-4 py-3 bg-blue-400 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    {t("parentPortal.profile.changePassword")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-screen bg-gray-100 overflow-hidden lg:overflow-hidden"
      onClick={() => setLanguageDropdownOpen(false)}
    >
      {/* Desktop sidebar navigation */}
      <div className="hidden lg:flex max-w-none w-full h-full gap-1">
        <aside
          className={`${
            sidebarCollapsed ? "w-20" : "w-72"
          } h-screen shrink-0 bg-blue-50 border border-blue-200 rounded-2xl p-5 pb-20 pt-12 sticky top-0 transition-all duration-200`}
        >
          <div className="px-2 pb-3 border-b border-gray-200 mb-3 flex items-center justify-between">
            {!sidebarCollapsed && (
              <h2 className="text-base font-semibold text-gray-900">
                {t("parentPortal.header.title")}
              </h2>
            )}
            <button
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="p-2 rounded-md hover:bg-blue-100 text-blue-700"
            >
              {sidebarCollapsed ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </button>
          </div>
          <nav className="flex flex-col h-full">
            {tabs
              .filter((t) => t.id !== "profile")
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-3 ${
                    sidebarCollapsed ? "justify-center" : ""
                  } px-4 py-2.5 rounded-lg text-sm text-left mb-2 transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  title={sidebarCollapsed ? tab.label : undefined}
                >
                  <span
                    className={`text-base ${
                      activeTab === tab.id ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="truncate font-medium">{tab.label}</span>
                  )}
                </button>
              ))}
            {/* Bottom actions: Profile and Logout */}
            <div className="mt-auto pt-3 border-t border-gray-200">
              <button
                onClick={() => setActiveTab("profile" as TabType)}
                className={`w-full flex items-center gap-3 ${
                  sidebarCollapsed ? "justify-center" : ""
                } px-4 py-2.5 rounded-lg text-sm text-left transition-colors mb-2 ${
                  activeTab === ("profile" as TabType)
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                title={
                  sidebarCollapsed ? t("parentPortal.tabs.profile") : undefined
                }
              >
                <span
                  className={`text-base ${
                    activeTab === ("profile" as TabType)
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </span>
                {!sidebarCollapsed && (
                  <span className="truncate font-medium">
                    {t("parentPortal.tabs.profile")}
                  </span>
                )}
              </button>
              <button
                onClick={logout}
                className={`w-full flex items-center gap-3 ${
                  sidebarCollapsed ? "justify-center" : ""
                } px-4 py-2.5 rounded-lg text-sm text-left text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200`}
                title={
                  sidebarCollapsed ? t("parentPortal.common.logout") : undefined
                }
              >
                <span className="text-base">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 11-4 0v-1m4-10V5a2 2 0 10-4 0v1"
                    />
                  </svg>
                </span>
                {!sidebarCollapsed && (
                  <span className="truncate font-medium">
                    {t("parentPortal.common.logout")}
                  </span>
                )}
              </button>
            </div>
          </nav>
        </aside>
        <div className="flex-1 h-full flex flex-col min-w-0 px-1 sm:px-4 lg:px-6">
          {/* Top header - fixed with the sidebar */}
          <header className="sticky top-0 z-10 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">
                {t("parentPortal.header.title")}
              </h1>
              <div className="flex items-center gap-2">
                {/* refresh button */}
                <button
                  onClick={async () => {
                    // Increment refresh key to force remount
                    setRefreshKey((k) => k + 1);

                    // Invalidate React Query cache for specific tabs
                    if (selectedStudent) {
                      switch (activeTab) {
                        case "attendance":
                          await queryClient.invalidateQueries({
                            queryKey: ["student-attendance", selectedStudent],
                          });
                          break;
                        case "assignments":
                          await queryClient.invalidateQueries({
                            queryKey: ["parent-assignments", selectedStudent],
                          });
                          break;
                        case "fees":
                          await queryClient.invalidateQueries({
                            queryKey: ["student-payments", selectedStudent],
                          });
                          await queryClient.invalidateQueries({
                            queryKey: ["financial-summary", selectedStudent],
                          });
                          break;
                        case "suggestions":
                          await queryClient.invalidateQueries({
                            queryKey: ["suggestions", user?.id],
                          });
                          break;
                      }
                    }

                    // For dashboard, refresh dashboard data
                    if (activeTab === "dashboard") {
                      await fetchDashboardData();
                      if (selectedStudent) {
                        await calculateAttendanceStats();
                        await fetchRecentActivity();
                      }
                    }
                  }}
                  className="relative inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 gap-2"
                >
                  <HiArrowPath className="w-4 h-4" />
                  {t("parentPortal.common.refresh")}
                </button>

                {/* Language Selector */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    aria-label="Change Language"
                    onClick={() =>
                      setLanguageDropdownOpen(!languageDropdownOpen)
                    }
                    className="relative inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      {i18n.language === "en"
                        ? "EN"
                        : i18n.language === "fa-AF"
                        ? "دری"
                        : "پښتو"}
                    </span>
                  </button>

                  {/* Language Dropdown */}
                  {languageDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          i18n.changeLanguage("en");
                          setLanguageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${
                          i18n.language === "en"
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        <span className="text-lg"></span>
                        <span>{t("parentPortal.notifications.languageEnglish")}</span>
                      </button>
                      <button
                        onClick={() => {
                          i18n.changeLanguage("fa-AF");
                          setLanguageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${
                          i18n.language === "fa-AF"
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        <span className="text-lg"></span>
                        <span>{t("parentPortal.notifications.languageDari")}</span>
                      </button>
                      <button
                        onClick={() => {
                          i18n.changeLanguage("ps-AF");
                          setLanguageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${
                          i18n.language === "ps-AF"
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        <span className="text-lg"></span>
                        <span>{t("parentPortal.notifications.languagePashto")}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Notifications Button */}
                <button
                  aria-label="Notifications"
                  onClick={async () => {
                    setNotificationsOpen(true);
                    setLoadingNotifications(true);
                    try {
                      const token =
                        localStorage.getItem("userToken") ||
                        localStorage.getItem("authToken") ||
                        localStorage.getItem("token");
                      const res = await fetch(
                        "https://khwanzay.school/api/notifications",
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      const data = await res.json();

                      // Map API data to notification format
                      const notifications =
                        (data && (data.data || data.notifications)) || [];
                      const mappedNotifications = notifications.map(
                        (n: any) => ({
                          id: n.id,
                          title: n.title,
                          message: n.message,
                          type:
                            n.type === "warning" || n.type === "error"
                              ? n.type
                              : "info",
                          timestamp: n.createdAt || n.timestamp,
                          read: n.status === "READ" || n.read === true,
                          priority: n.priority?.toLowerCase() || "medium",
                        })
                      );

                      setNotificationsList(mappedNotifications);
                    } catch (e) {
                      setNotificationsList([]);
                    } finally {
                      setLoadingNotifications(false);
                    }
                  }}
                  className="relative inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {notificationsList.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {notificationsList.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Scrollable main content */}
          <main className="flex-1 overflow-y-auto min-w-0">
            {renderTabContent()}
          </main>
        </div>
      </div>

      {notificationsOpen && (
        <div className="fixed inset-0 z-60">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setNotificationsOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Notifications
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {notificationsList.length > 0
                      ? `${
                          notificationsList.filter((n) => !n.read).length
                        } unread`
                      : "All caught up!"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5 text-white"
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {loadingNotifications ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500 text-sm">
                    Loading notifications...
                  </p>
                </div>
              ) : notificationsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    No notifications
                  </h4>
                  <p className="text-gray-500 text-center text-sm">
                    {t("parentPortal.notifications.noNotifications")}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {notificationsList
                    .slice(0, visibleNotifications)
                    .map((n, index) => (
                      <div
                        key={n.id}
                        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all duration-200 hover:shadow-md hover:border-gray-200 cursor-pointer ${
                          !n.read ? "ring-2 ring-blue-100 bg-blue-50/30" : ""
                        }`}
                        onClick={() => !n.read && handleMarkAsRead(n.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Notification Icon */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              n.type === "warning"
                                ? "bg-yellow-100"
                                : n.type === "error"
                                ? "bg-red-100"
                                : n.type === "success"
                                ? "bg-green-100"
                                : "bg-blue-100"
                            }`}
                          >
                            {n.type === "warning" ? (
                              <svg
                                className="w-5 h-5 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                            ) : n.type === "error" ? (
                              <svg
                                className="w-5 h-5 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            ) : n.type === "success" ? (
                              <svg
                                className="w-5 h-5 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                                {n.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                {!n.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                )}
                                {markingAsRead === n.id && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-gray-400">
                                {n.timestamp
                                  ? (() => {
                                      const date = new Date(n.timestamp);
                                      return isNaN(date.getTime())
                                        ? "—"
                                        : date.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          });
                                    })()
                                  : "—"}
                              </span>
                              <div className="flex items-center gap-2">
                                {!n.read && (
                                   <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                     {t("parentPortal.notifications.new")}
                                   </span>
                                 )}
                                {!n.read && (
                                   <span className="text-xs text-blue-600 font-medium">
                                     {t("parentPortal.notifications.clickToMarkAsRead")}
                                   </span>
                                 )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  {visibleNotifications < notificationsList.length && (
                    <button
                       onClick={handleLoadMore}
                       className="w-full py-2 px-4 text-blue-600 hover:text-blue-700 disabled:text-blue-400 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                     >
                       {t("parentPortal.notifications.loadMore")}
                     </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {notificationsList.length > 0 &&
              notificationsList.some((n) => !n.read) && (
                <div className="bg-white border-t border-gray-200 px-6 py-4">
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={markingAllAsRead}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {markingAllAsRead ? (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                         {t("parentPortal.notifications.markingAllAsRead")}
                       </>
                     ) : (
                       t("parentPortal.notifications.markAllAsRead")
                     )}
                  </button>
                </div>
              )}
          </aside>
        </div>
      )}

      {/* Content (mobile/tablet) */}
      <div className="lg:hidden h-screen flex flex-col">
        {/* Mobile Header */}
        <div className=" sticky top-0 z-10 bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3 mx-4 mt-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">
              {t("parentPortal.header.title")}
            </h1>
            <div className="flex items-center gap-2">
              {/* Language Selector - Mobile */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  aria-label="Change Language"
                  onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                  className="relative inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                </button>

                {/* Language Dropdown - Mobile */}
                {languageDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                       onClick={() => {
                         i18n.changeLanguage("en");
                         setLanguageDropdownOpen(false);
                       }}
                       className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${
                         i18n.language === "en"
                           ? "bg-blue-50 text-blue-700"
                           : "text-gray-700"
                       }`}
                     >
                       <span className="text-lg"></span>
                       <span>{t("parentPortal.notifications.languageEnglish")}</span>
                     </button>
                     <button
                       onClick={() => {
                         i18n.changeLanguage("fa-AF");
                         setLanguageDropdownOpen(false);
                       }}
                       className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${
                         i18n.language === "fa-AF"
                           ? "bg-blue-50 text-blue-700"
                           : "text-gray-700"
                       }`}
                     >
                       <span className="text-lg"></span>
                       <span>{t("parentPortal.notifications.languageDari")}</span>
                     </button>
                     <button
                       onClick={() => {
                         i18n.changeLanguage("ps-AF");
                         setLanguageDropdownOpen(false);
                       }}
                       className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${
                         i18n.language === "ps-AF"
                           ? "bg-blue-50 text-blue-700"
                           : "text-gray-700"
                       }`}
                     >
                       <span className="text-lg"></span>
                       <span>{t("parentPortal.notifications.languagePashto")}</span>
                     </button>
                    </div>
                    )}
                    </div>

                    {/* Notifications Button */}
              <button
                aria-label="Notifications"
                onClick={async () => {
                  setNotificationsOpen(true);
                  setLoadingNotifications(true);
                  try {
                    const token =
                      localStorage.getItem("userToken") ||
                      localStorage.getItem("authToken") ||
                      localStorage.getItem("token");
                    const res = await fetch(
                      "https://khwanzay.school/api/notifications",
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const data = await res.json();

                    // Map API data to notification format
                    const notifications =
                      (data && (data.data || data.notifications)) || [];
                    const mappedNotifications = notifications.map((n: any) => ({
                      id: n.id,
                      title: n.title,
                      message: n.message,
                      type:
                        n.type === "warning" || n.type === "error"
                          ? n.type
                          : "info",
                      timestamp: n.createdAt || n.timestamp,
                      read: n.status === "READ" || n.read === true,
                      priority: n.priority?.toLowerCase() || "medium",
                    }));

                    setNotificationsList(mappedNotifications);
                  } catch (e) {
                    setNotificationsList([]);
                  } finally {
                    setLoadingNotifications(false);
                  }
                }}
                className="relative inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notificationsList.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {notificationsList.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              <button
                aria-label={t("parentPortal.common.logout")}
                onClick={logout}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 11-4 0v-1m4-10V5a2 2 0 10-4 0v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 pb-24">
          {renderTabContent()}
        </div>
      </div>

      {/* Bottom Navigation - Mobile and Tablet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50 safe-area-inset-bottom">
        <div className="max-w-none w-full mx-auto px-1 sm:px-2 py-2">
          <div className="flex justify-around">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex flex-col items-center justify-center py-1 sm:py-2 px-2 sm:px-3 rounded-lg transition-all duration-300 min-w-0 flex-1 ${
                  activeTab === tab.id
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title={tab.label}
              >
                <span
                  className={`text-sm sm:text-base mb-0.5 sm:mb-1 ${
                    activeTab === tab.id ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {tab.icon}
                </span>
                <span className="text-xs font-medium truncate max-w-full">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {t("parentPortal.profile.changePassword")}
              </h3>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
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

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-green-700 font-medium">
                    {passwordSuccess}
                  </p>
                </div>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-red-700 font-medium">{passwordError}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("parentPortal.profile.currentPassword")}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("parentPortal.profile.enterCurrentPassword")}
                  disabled={changingPassword}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("parentPortal.profile.newPassword")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("parentPortal.profile.enterNewPassword")}
                  disabled={changingPassword}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("parentPortal.profile.confirmNewPassword")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t(
                    "parentPortal.profile.confirmNewPasswordPlaceholder"
                  )}
                  disabled={changingPassword}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={changingPassword}
              >
                {t("parentPortal.profile.cancel")}
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t("parentPortal.profile.changing")}
                  </>
                ) : (
                  t("parentPortal.profile.changePassword")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
