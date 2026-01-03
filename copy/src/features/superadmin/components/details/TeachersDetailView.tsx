import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FaChalkboardTeacher,
  FaTimes,
  FaSearch,
  FaBook,
  FaSchool,
  FaUsers,
  FaPhone,
  FaMale,
  FaFemale,
} from "react-icons/fa";
import superadminService from "../../services/superadminService";

interface TeachersDetailViewProps {
  dateRange: { startDate: string; endDate: string };
  onClose: () => void;
}

const TeachersDetailView: React.FC<TeachersDetailViewProps> = ({
  dateRange,
  onClose,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: teachersData, isLoading } = useQuery({
    queryKey: ["teachers-analytics", dateRange],
    queryFn: () => superadminService.getTeacherAnalytics(dateRange),
  });

  // Handle different possible response structures
  const teacherStats = teachersData?.data || teachersData || {};
  const mostEngaged = teacherStats?.workload?.mostEngaged || [];

  // Debug logging
  console.log("=== Teachers Analytics Debug ===");
  console.log("teachersData:", teachersData);
  console.log("teacherStats:", teacherStats);
  console.log("demographics:", teacherStats?.demographics);

  // Filter teachers by search term
  const filteredTeachers = mostEngaged.filter(
    (teacher: any) =>
      teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="bg-purple-600 to-indigo-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaChalkboardTeacher className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">
                {t("superadmin.details.allTeachers", "All Teachers")}
              </h2>
              <p className="text-purple-100 mt-1">
                {t(
                  "superadmin.details.teacherDataAndWorkload",
                  "Teacher data and workload statistics"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-500 rounded-lg transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm font-medium text-purple-600">
                    {t("superadmin.details.totalTeachers", "Total Teachers")}
                  </p>
                  <p className="text-3xl font-bold text-purple-700 mt-2">
                    {(teacherStats?.total || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-600">
                    {t("superadmin.details.activeTeachers", "Active Teachers")}
                  </p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {(teacherStats?.active || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {teacherStats?.total
                      ? (
                          (teacherStats.active / teacherStats.total) *
                          100
                        ).toFixed(1)
                      : 0}
                    % {t("superadmin.details.activeRate", "active")}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm font-medium text-orange-600">
                    {t(
                      "superadmin.details.inactiveTeachers",
                      "Inactive Teachers"
                    )}
                  </p>
                  <p className="text-3xl font-bold text-orange-700 mt-2">
                    {(teacherStats?.inactive || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-600">
                      {t("superadmin.details.maleTeachers", "Male Teachers")}
                    </p>
                    <FaMale className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700">
                    {(teacherStats?.demographics?.male || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {teacherStats?.demographics?.malePercentage || 0}%
                  </p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-pink-600">
                      {t(
                        "superadmin.details.femaleTeachers",
                        "Female Teachers"
                      )}
                    </p>
                    <FaFemale className="w-5 h-5 text-pink-600" />
                  </div>
                  <p className="text-3xl font-bold text-pink-700">
                    {(teacherStats?.demographics?.female || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-pink-600 mt-1">
                    {teacherStats?.demographics?.femalePercentage || 0}%
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <p className="text-sm font-medium text-indigo-600">
                    {t("superadmin.details.avgClasses", "Avg Classes")}
                  </p>
                  <p className="text-3xl font-bold text-indigo-700 mt-2">
                    {(teacherStats?.workload?.averageClasses || 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    {t("superadmin.details.perTeacher", "per teacher")}
                  </p>
                </div>
              </div>

              {/* Department Distribution */}
              {teacherStats?.distribution?.byDepartment &&
                teacherStats.distribution.byDepartment.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaSchool className="w-5 h-5 text-purple-600" />
                      {t(
                        "superadmin.details.departmentDistribution",
                        "Department Distribution"
                      )}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {teacherStats.distribution.byDepartment.map(
                        (dept: any, index: number) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-4 text-center"
                          >
                            <p className="text-2xl font-bold text-purple-700">
                              {dept.count}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {dept.departmentId ||
                                t("superadmin.details.general", "General")}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-8 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t(
                      "superadmin.details.searchTeachers",
                      "Search teachers by name or department..."
                    )}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Teachers List */}
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-12">
                  <FaChalkboardTeacher className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {mostEngaged.length === 0
                      ? t(
                          "superadmin.details.noTeachersData",
                          "No teacher data available"
                        )
                      : t(
                          "superadmin.details.noTeachersFound",
                          "No teachers found matching your search"
                        )}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTeachers.map((teacher: any, index: number) => (
                    <div
                      key={teacher.teacherId || index}
                      className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FaChalkboardTeacher className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">
                                {teacher.name}
                              </h4>
                              {teacher.teacherId && (
                                <p className="text-xs text-gray-500">
                                  ID: {teacher.teacherId}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                teacher.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {teacher.status ||
                                t("superadmin.details.active", "Active")}
                            </span>
                          </div>

                          {/* Teacher Details */}
                          <div className="space-y-2">
                            {teacher.department && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaSchool className="w-4 h-4 text-gray-400" />
                                <span>{teacher.department}</span>
                              </div>
                            )}
                            {teacher.classes !== undefined && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaBook className="w-4 h-4 text-gray-400" />
                                <span>
                                  {teacher.classes}{" "}
                                  {t("superadmin.details.classes", "classes")}
                                </span>
                              </div>
                            )}
                            {teacher.students !== undefined && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaUsers className="w-4 h-4 text-gray-400" />
                                <span>
                                  {teacher.students}{" "}
                                  {t("superadmin.details.students", "students")}
                                </span>
                              </div>
                            )}
                            {teacher.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaPhone className="w-4 h-4 text-gray-400" />
                                <span>{teacher.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Workload Indicator */}
                          {teacher.classes !== undefined &&
                            teacherStats?.workload?.averageClasses && (
                              <div className="mt-4 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">
                                    {t(
                                      "superadmin.details.workload",
                                      "Workload"
                                    )}
                                  </span>
                                  <span
                                    className={`font-semibold ${
                                      teacher.classes >
                                      teacherStats.workload.averageClasses * 1.2
                                        ? "text-red-600"
                                        : teacher.classes <
                                          teacherStats.workload.averageClasses *
                                            0.8
                                        ? "text-blue-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {teacher.classes >
                                    teacherStats.workload.averageClasses * 1.2
                                      ? t("superadmin.details.high", "High")
                                      : teacher.classes <
                                        teacherStats.workload.averageClasses *
                                          0.8
                                      ? t("superadmin.details.low", "Low")
                                      : t(
                                          "superadmin.details.balanced",
                                          "Balanced"
                                        )}
                                  </span>
                                </div>
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      teacher.classes >
                                      teacherStats.workload.averageClasses * 1.2
                                        ? "bg-red-600"
                                        : teacher.classes <
                                          teacherStats.workload.averageClasses *
                                            0.8
                                        ? "bg-blue-600"
                                        : "bg-green-600"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        (teacher.classes /
                                          (teacherStats.workload
                                            .averageClasses *
                                            1.5)) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
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

export default TeachersDetailView;
