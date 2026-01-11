import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FaUserGraduate,
  FaChartBar,
  FaCalendarCheck,
  FaMedal,
  FaUsers,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import superadminService from "../services/superadminService";
import studentService from "../../students/services/studentService";

interface Props {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  selectedSchoolId?: string | null;
  selectedBranchId?: string | null;
  selectedCourseId?: string | null;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

const AcademicAnalyticsDashboard: React.FC<Props> = ({
  dateRange,
  selectedSchoolId,
  selectedBranchId,
  selectedCourseId,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // Build a stable params object using useMemo (avoid re-creating functions per render)
  const params = React.useMemo(() => {
    const p: any = {};
    // Always include school ID first
    if (selectedSchoolId) p.schoolId = selectedSchoolId;
    // Validate dateRange values
    if (dateRange?.startDate) p.startDate = dateRange.startDate;
    if (dateRange?.endDate) p.endDate = dateRange.endDate;
    // Include branch or course ID only if school ID is set
    if (selectedSchoolId) {
      if (selectedBranchId) p.branchId = selectedBranchId;
      if (selectedCourseId) p.courseId = selectedCourseId;
    }
    return p;
  }, [
    selectedSchoolId,
    dateRange?.startDate,
    dateRange?.endDate,
    selectedBranchId,
    selectedCourseId,
  ]);

  const {
    data: academicOverview,
    isLoading,
    refetch: refetchAcademic,
  } = useQuery({
    queryKey: ["academic-overview", params],
    queryFn: () => superadminService.getAcademicOverview(params),
  });

  // Fetch students with branch/course filtering
  const studentFilters = React.useMemo(() => {
    const filters: any = {};
    if (searchQuery) filters.search = searchQuery;
    if (selectedBranchId) filters.branchId = selectedBranchId;
    if (selectedCourseId) filters.courseId = selectedCourseId;
    filters.page = currentPage;
    filters.limit = studentsPerPage;
    return filters;
  }, [
    searchQuery,
    selectedBranchId,
    selectedCourseId,
    currentPage,
    studentsPerPage,
  ]);

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["students-list", studentFilters],
    queryFn: () => studentService.getStudents(studentFilters),
    enabled: true,
  });

  const { data: studentPerformance, refetch: refetchPerformance } = useQuery({
    queryKey: ["student-performance", params],
    queryFn: () => superadminService.getStudentPerformanceAnalytics(params),
    enabled: true,
  });

  const { data: attendanceAnalytics, refetch: refetchAttendance } = useQuery({
    queryKey: ["attendance-analytics", params],
    queryFn: () => superadminService.getAttendanceAnalytics(params),
    enabled: true,
  });

  // Refetch when params change (date range, school, branch)
  React.useEffect(() => {
    refetchAcademic();
    refetchPerformance();
    refetchAttendance();
  }, [params, refetchAcademic, refetchPerformance, refetchAttendance]);

  // Normalize response safely (api wrapper may already return data)
  const rawAcademic: any = (academicOverview as any) ?? {};
  const overview: any =
    rawAcademic?.overview ?? rawAcademic?.data?.overview ?? {};
  const performance: any =
    rawAcademic?.performance ?? rawAcademic?.data?.performance ?? {};

  const rawStudent: any = (studentPerformance as any) ?? {};
  const statistics: any =
    rawStudent?.statistics ?? rawStudent?.data?.statistics ?? {};

  const rawAttendance: any = (attendanceAnalytics as any) ?? {};
  const attendanceSummary: any =
    rawAttendance?.summary ?? rawAttendance?.data?.summary ?? {};
  const attendanceTrends: any[] = Array.isArray(
    rawAttendance?.trends ?? rawAttendance?.data?.trends
  )
    ? rawAttendance?.trends ?? rawAttendance?.data?.trends
    : [];

  // Extract students data
  const students = Array.isArray(studentsData?.data) ? studentsData.data : [];
  const totalStudentsCount = studentsData?.pagination?.total || students.length;
  const totalPages = Math.ceil(totalStudentsCount / studentsPerPage);

  // Debug log for course filtering
  React.useEffect(() => {
    console.log("📚 Students Filter Request:", {
      filters: studentFilters,
      selectedCourseId: selectedCourseId,
      selectedBranchId: selectedBranchId,
      studentsReceived: students.length,
      studentsWithBranch: students.filter((s: any) => s.branchId).length,
      studentsWithCourse: students.filter((s: any) => s.enrollments?.length > 0)
        .length,
      allStudentsCourseIds: students.map((s: any) => ({
        studentId: s.id,
        directCourseId: s.courseId,
        enrollmentCourseIds: s.enrollments?.map((e: any) => e.courseId) || [],
      })),
      sampleStudent: students[0]
        ? {
            id: students[0].id,
            branchId: students[0].branchId,
            courseId: students[0].courseId, // Direct courseId field
            branch: students[0].branch,
            enrollments: students[0].enrollments,
          }
        : null,
    });

    // Warning if filtering by courseId but backend returned students without that course
    if (selectedCourseId && students.length > 0) {
      const mismatchedStudents = students.filter((s: any) => {
        const hasMatchingCourse = s.enrollments?.some(
          (e: any) => e.courseId?.toString() === selectedCourseId?.toString()
        );
        return !hasMatchingCourse;
      });

      if (mismatchedStudents.length > 0) {
        console.warn(
          "⚠️ Backend returned students without selected courseId in enrollments:",
          {
            selectedCourseId,
            mismatchedStudents: mismatchedStudents.map((s: any) => ({
              id: s.id,
              name: s.user?.firstName + " " + s.user?.lastName,
              enrollmentCourseIds: s.enrollments?.map((e: any) => e.courseId),
            })),
          }
        );
      }
    }
  }, [students, studentFilters, selectedCourseId, selectedBranchId]);

  // Group students by branch and course
  const groupedStudents = React.useMemo(() => {
    const groups: { [key: string]: any[] } = {
      "branch-and-course": [],
      "branch-only": [],
      "no-assignment": [],
    };

    students.forEach((student: any) => {
      const hasBranch = student.branchId;
      const hasCourse = student.enrollments && student.enrollments.length > 0;

      if (hasBranch && hasCourse) {
        groups["branch-and-course"].push(student);
      } else if (hasBranch) {
        groups["branch-only"].push(student);
      } else {
        groups["no-assignment"].push(student);
      }
    });

    return groups;
  }, [students]);

  // Log if we're receiving dummy/zero data with branch filter
  React.useEffect(() => {
    const p = params as any;
    console.log("📊 Academic Overview Request:", {
      url: "/superadmin/analytics/academic/overview",
      params: p,
      fullUrl: `https://khwanzay.school/api/superadmin/analytics/academic/overview?${new URLSearchParams(
        p
      ).toString()}`,
      response: overview,
    });

    if (selectedBranchId && overview?.totalStudents === 0) {
      console.warn(
        "⚠️ Backend returned EMPTY data for branch:",
        selectedBranchId,
        {
          totalStudents: overview?.totalStudents,
          totalClasses: overview?.totalClasses,
          totalSubjects: overview?.totalSubjects,
          averageGrade: overview?.averageGrade,
        }
      );
    }
  }, [selectedBranchId, overview, params]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Safely parse average grade which may come as string/null
  const avgGrade: number = (() => {
    const value: any = overview?.averageGrade;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  })();

  const performanceData = [
    {
      name: t("superadmin.academic.excellent", "Excellent"),
      value: performance?.excellentStudents || 0,
      color: "#10B981",
    },
    {
      name: t("superadmin.academic.good", "Good"),
      value: performance?.goodStudents || 0,
      color: "#3B82F6",
    },
    {
      name: t("superadmin.academic.average", "Average"),
      value: performance?.averageStudents || 0,
      color: "#F59E0B",
    },
    {
      name: t("superadmin.academic.needsAttention", "Needs Attention"),
      value: performance?.needsAttention || 0,
      color: "#EF4444",
    },
  ];

  console.log("Performance Distribution Data:", performanceData);

  return (
    <div className="space-y-2 sm:space-y-6">
      {/* Filter Info Badge */}
      {(selectedBranchId || selectedCourseId) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <FaSearch className="text-blue-600" />
            <span className="text-sm text-blue-900">
              {t("superadmin.academic.filteringBy", "Filtering by:")}
              {selectedBranchId && (
                <span className="font-semibold ml-2">Branch</span>
              )}
              {selectedCourseId && (
                <span className="font-semibold ml-2">Course</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t("superadmin.academic.totalStudents", "Total Students")}
            </span>
            <FaUserGraduate className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {overview?.totalStudents?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {selectedBranchId || selectedCourseId
              ? t("superadmin.academic.filteredData", "Filtered data")
              : t("superadmin.academic.acrossSchools", "Across all schools")}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t("superadmin.academic.classesSubjects", "Classes & Subjects")}
            </span>
            <FaChartBar className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {overview?.totalClasses || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {overview?.totalSubjects || 0}{" "}
            {t("superadmin.academic.subjects", "subjects")}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t("superadmin.academic.avgAttendance", "Avg Attendance")}
            </span>
            <FaCalendarCheck className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {attendanceSummary?.attendanceRate || 0}%
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t("superadmin.academic.presentToday", {
              count: attendanceSummary?.presentCount?.toLocaleString() || 0,
            }) ||
              `${
                attendanceSummary?.presentCount?.toLocaleString() || 0
              } present today`}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t("superadmin.academic.avgGrade", "Avg Grade")}
            </span>
            <FaMedal className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {avgGrade.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {t("superadmin.academic.outOf", "Out of 100")}
          </p>
        </div>
      </div>

      {/* Student Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t(
              "superadmin.academic.performanceDistribution",
              "Student Performance Distribution"
            )}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t(
              "superadmin.academic.performanceStats",
              "Performance Statistics"
            )}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t(
                    "superadmin.academic.excellentPerformers",
                    "Excellent Performers"
                  )}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {performance?.excellentStudents || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {t("superadmin.academic.avg85", "85%+ Average")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("superadmin.academic.goodPerformers", "Good Performers")}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {performance?.goodStudents || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {t("superadmin.academic.avg70to84", "70-84% Average")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t(
                    "superadmin.academic.averagePerformers",
                    "Average Performers"
                  )}
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {performance?.averageStudents || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {t("superadmin.academic.avg50to69", "50-69% Average")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t("superadmin.academic.needsAttention", "Needs Attention")}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {performance?.needsAttention || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {t("superadmin.academic.avgBelow50", "<50% Average")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("superadmin.academic.attendanceTrends", "Attendance Trends")}
        </h3>
        {attendanceTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="present"
                stroke="#10B981"
                name={t("superadmin.academic.present", "Present")}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="absent"
                stroke="#EF4444"
                name={t("superadmin.academic.absent", "Absent")}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="late"
                stroke="#F59E0B"
                name={t("superadmin.academic.late", "Late")}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">
            {t(
              "superadmin.academic.noAttendanceData",
              "No attendance data available"
            )}
          </p>
        )}
      </div>

      {/* Students List Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Filter Status Display */}
        {(selectedBranchId || selectedCourseId) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              {t(
                "superadmin.academic.showingDataFor",
                "Showing data for selected filters"
              )}
              {selectedBranchId && (
                <span className="ml-2 font-semibold">
                  Branch ID: {selectedBranchId}
                </span>
              )}
              {selectedCourseId && (
                <span className="ml-2 font-semibold">
                  Course ID: {selectedCourseId}
                </span>
              )}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaUsers className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("superadmin.academic.studentsList", "Students List")}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedCourseId
                  ? t(
                      "superadmin.academic.filteredByCourse",
                      "Filtered by Course"
                    )
                  : selectedBranchId
                  ? t(
                      "superadmin.academic.filteredByBranch",
                      "Filtered by Branch"
                    )
                  : t("superadmin.academic.allStudents", "All Students")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t(
                  "superadmin.academic.searchStudents",
                  "Search students..."
                )}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {studentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <FaUserGraduate className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {t("superadmin.academic.noStudentsFound", "No students found")}
            </p>
          </div>
        ) : (
          <>
            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.academic.student", "Student")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.academic.admissionNo", "Admission No")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.academic.class", "Class")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.academic.branch", "Branch")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.academic.course", "Course")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("superadmin.academic.status", "Status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student: any, index: number) => {
                    const enrollment = student.enrollments?.[0];
                    const hasBranch = student.branchId;
                    const hasCourse = enrollment?.courseId;

                    return (
                      <tr
                        key={student.id || index}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-sm">
                                  {student.user?.firstName?.[0]}
                                  {student.user?.lastName?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.user?.firstName}{" "}
                                {student.user?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.user?.dariName || "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.admissionNo || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.class?.name || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasBranch ? (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {student.branch?.name ||
                                  `Branch ${student.branchId}`}
                              </span>
                              {student.branch?.code && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {student.branch.code}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {t(
                                "superadmin.academic.notAssigned",
                                "Not Assigned"
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasCourse ? (
                            <div>
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {enrollment?.course?.name ||
                                  t("superadmin.academic.enrolled", "Enrolled")}
                              </span>
                              {enrollment?.course?.code && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {enrollment.course.code}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {t(
                                "superadmin.academic.notEnrolled",
                                "Not Enrolled"
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              student.user?.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.user?.status || "UNKNOWN"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  {t("superadmin.academic.showing", "Showing")}{" "}
                  {(currentPage - 1) * studentsPerPage + 1} -{" "}
                  {Math.min(currentPage * studentsPerPage, totalStudentsCount)}{" "}
                  {t("superadmin.academic.of", "of")} {totalStudentsCount}{" "}
                  {t("superadmin.academic.students", "students")}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("superadmin.academic.previous", "Previous")}
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    {t("superadmin.academic.page", "Page")} {currentPage}{" "}
                    {t("superadmin.academic.of", "of")} {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("superadmin.academic.next", "Next")}
                  </button>
                </div>
              </div>
            )}

            {/* Summary Statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {t(
                        "superadmin.academic.branchAndCourse",
                        "Branch & Course"
                      )}
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {groupedStudents["branch-and-course"].length}
                    </p>
                  </div>
                  <FaCheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  {t(
                    "superadmin.academic.studentsWithBoth",
                    "Students with branch and course"
                  )}
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      {t("superadmin.academic.branchOnly", "Branch Only")}
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {groupedStudents["branch-only"].length}
                    </p>
                  </div>
                  <FaExclamationTriangle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-xs text-green-700 mt-2">
                  {t(
                    "superadmin.academic.studentsWithBranch",
                    "Students with branch only"
                  )}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t("superadmin.academic.noAssignment", "No Assignment")}
                    </p>
                    <p className="text-2xl font-bold text-gray-600 mt-1">
                      {groupedStudents["no-assignment"].length}
                    </p>
                  </div>
                  <FaClock className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-xs text-gray-700 mt-2">
                  {t(
                    "superadmin.academic.studentsWithNeither",
                    "Students without assignment"
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AcademicAnalyticsDashboard;
