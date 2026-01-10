import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FaUserGraduate,
  FaTimes,
  FaSearch,
  FaMale,
  FaFemale,
  FaBook,
  FaSchool,
  FaPhone,
  FaEnvelope,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import superadminService from "../../services/superadminService";
import EnrollmentHistory from "../../../students/components/EnrollmentHistory";

interface StudentsDetailViewProps {
  dateRange: { startDate: string; endDate: string };
  selectedSchoolId?: string | null;
  selectedBranchId?: string | null;
  selectedCourseId?: string | null;
  onClose: () => void;
}

const StudentsDetailView: React.FC<StudentsDetailViewProps> = ({
  dateRange,
  selectedSchoolId,
  selectedBranchId,
  selectedCourseId,
  onClose,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<
    string | number | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["students-analytics", dateRange, selectedSchoolId, selectedBranchId, selectedCourseId],
    queryFn: () => superadminService.getStudentAnalytics({
      ...dateRange,
      schoolId: selectedSchoolId || undefined,
      branchId: selectedBranchId || undefined,
      courseId: selectedCourseId || undefined,
    }),
  });

  const { data: performanceData } = useQuery({
    queryKey: ["student-performance", dateRange, selectedSchoolId, selectedBranchId, selectedCourseId],
    queryFn: () => superadminService.getStudentPerformanceAnalytics({
      ...dateRange,
      schoolId: selectedSchoolId || undefined,
      branchId: selectedBranchId || undefined,
      courseId: selectedCourseId || undefined,
    }),
  });

  // Handle different possible response structures
  // Service extracts response.data, but handle both nested and direct structures
  const studentStats = studentsData?.data || studentsData || {};
  const performanceList =
    performanceData?.data?.students || performanceData?.students || [];

  // Debug logging
  //   console.log('=== Students Analytics Debug ===');
  //   console.log('studentsData:', studentsData);
  //   console.log('studentStats:', studentStats);
  //   console.log('Stats total:', studentStats?.total);
  //   console.log('Stats demographics:', studentStats?.demographics);
  //   console.log('performanceData:', performanceData);
  //   console.log('Performance list:', performanceList);
  //   console.log('Performance list length:', performanceList.length);

  // Filter students by search term
  const filteredStudents = performanceList.filter(
    (student: any) =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const getPerformanceColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "excellent":
        return "bg-green-100 text-green-700 border-green-200";
      case "good":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "average":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "needs attention":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-green-600  text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaUserGraduate className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">
                {t("superadmin.details.allStudents", "All Students")}
              </h2>
              <p className="text-green-100 mt-1">
                {t(
                  "superadmin.details.studentDataAndPerformance",
                  "Student data and performance metrics"
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
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-600">
                    {t("superadmin.details.totalStudents", "Total Students")}
                  </p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {(studentStats?.total || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-600">
                      {t("superadmin.details.maleStudents", "Male Students")}
                    </p>
                    <FaMale className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700">
                    {(studentStats?.demographics?.male || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {studentStats?.demographics?.malePercentage || 0}%
                  </p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-pink-600">
                      {t(
                        "superadmin.details.femaleStudents",
                        "Female Students"
                      )}
                    </p>
                    <FaFemale className="w-5 h-5 text-pink-600" />
                  </div>
                  <p className="text-3xl font-bold text-pink-700">
                    {(studentStats?.demographics?.female || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-pink-600 mt-1">
                    {studentStats?.demographics?.femalePercentage || 0}%
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm font-medium text-purple-600">
                    {t("superadmin.details.avgPerformance", "Avg Performance")}
                  </p>
                  <p className="text-3xl font-bold text-purple-700 mt-2">
                    {performanceList.length > 0
                      ? (
                          performanceList.reduce(
                            (sum: number, s: any) =>
                              sum + (parseFloat(s.averageMarks) || 0),
                            0
                          ) / performanceList.length
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-8 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t(
                      "superadmin.details.searchStudents",
                      "Search students by name or class..."
                    )}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Students List */}
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <FaUserGraduate className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {t("superadmin.details.noStudents", "No students found")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="bg-gray-50 rounded-lg p-4 hidden lg:grid grid-cols-12 gap-4 font-semibold text-sm text-gray-700 ">
                    <div className="col-span-3">
                      {t("superadmin.details.studentName", "Student Name")}
                    </div>
                    <div className="col-span-2">
                      {t("superadmin.details.class", "Class")}
                    </div>
                    <div className="col-span-2">
                      {t("superadmin.details.grade", "Grade")}
                    </div>
                    <div className="col-span-2">
                      {t("superadmin.details.avgMarks", "Avg Marks")}
                    </div>
                    <div className="col-span-2">
                      {t("superadmin.details.assignments", "Assignments")}
                    </div>
                    <div className="col-span-1">
                      {t("superadmin.details.performance", "Performance")}
                    </div>
                  </div>

                  {/* Table Rows */}
                  {paginatedStudents.map((student: any, index: number) => (
                    <div
                      key={student.studentId || index}
                      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      {/* Mobile Layout (default) - Stack everything vertically */}
                      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center">
                        {/* Student Info - Full width on mobile, 3 cols on desktop */}
                        <div className="lg:col-span-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <FaUserGraduate className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 truncate">
                                {student.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {student.studentId}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Mobile: 2-column grid for stats | Desktop: individual columns */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:contents">
                          {/* Class */}
                          <div className="lg:col-span-2">
                            <p className="text-xs text-gray-500 mb-1 lg:hidden">
                              Class
                            </p>
                            <div className="flex items-center gap-2">
                              <FaBook className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {student.class || "N/A"}
                              </span>
                            </div>
                          </div>

                          {/* Grade */}
                          <div className="lg:col-span-2">
                            <p className="text-xs text-gray-500 mb-1 lg:hidden">
                              Grade
                            </p>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium inline-block">
                              {student.grade || "N/A"}
                            </span>
                          </div>

                          {/* Average Marks */}
                          <div className="lg:col-span-2">
                            <p className="text-xs text-gray-500 mb-1 lg:hidden">
                              Avg. Marks
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {student.averageMarks || "0"}%
                            </p>
                          </div>

                          {/* Total Assignments */}
                          <div className="lg:col-span-2">
                            <p className="text-xs text-gray-500 mb-1 lg:hidden">
                              Assignments
                            </p>
                            <p className="text-sm text-gray-700 font-medium">
                              {student.totalAssignments || 0}
                            </p>
                          </div>
                        </div>

                        {/* Performance Level & Action Button */}
                        <div className="lg:col-span-1 flex items-center justify-between lg:justify-end gap-2 pt-3 border-t lg:pt-0 lg:border-t-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold border ${getPerformanceColor(
                                student.performanceLevel
                              )}`}
                            >
                              {student.performanceLevel || "N/A"}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedStudentId(
                                selectedStudentId === student.studentId
                                  ? null
                                  : student.studentId
                              )
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                            title="View Enrollment History"
                          >
                            <FaHistory className="w-4 h-4" />
                            <span className="text-xs lg:hidden">History</span>
                          </button>
                        </div>
                      </div>

                      {/* Enrollment History Section */}
                      {selectedStudentId === student.studentId && (
                        <div className="mt-4 border-t pt-4">
                          <EnrollmentHistory studentId={student.studentId} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        {t("common.page", "Page")} {currentPage}{" "}
                        {t("common.of", "of")} {totalPages} |{" "}
                        {t("common.showing", "Showing")} {startIndex + 1}-
                        {Math.min(endIndex, filteredStudents.length)}{" "}
                        {t("common.of", "of")} {filteredStudents.length}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={currentPage === 1}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors font-medium"
                        >
                          {t("common.previous", "Previous")}
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors font-medium"
                        >
                          {t("common.next", "Next")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Performance Statistics */}
              {performanceData?.data?.statistics && (
                <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {t(
                      "superadmin.details.performanceBreakdown",
                      "Performance Breakdown"
                    )}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <p className="text-2xl font-bold text-green-700">
                          {performanceData.data.statistics
                            .excellentPerformers || 0}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {t("superadmin.details.excellent", "Excellent")}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <p className="text-2xl font-bold text-blue-700">
                          {performanceData.data.statistics.goodPerformers || 0}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {t("superadmin.details.good", "Good")}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <p className="text-2xl font-bold text-yellow-700">
                          {performanceData.data.statistics.averagePerformers ||
                            0}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {t("superadmin.details.average", "Average")}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <p className="text-2xl font-bold text-red-700">
                          {performanceData.data.statistics.needsAttention || 0}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {t(
                          "superadmin.details.needsAttention",
                          "Needs Attention"
                        )}
                      </p>
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

export default StudentsDetailView;
