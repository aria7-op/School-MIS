import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTeacherClasses, TeacherClass } from "../hooks/useTeacherClasses";
import { useAuth } from "../../../contexts/AuthContext";
import secureApiService from "../../../services/secureApiService";
import gradeManagementService from "../../gradeManagement/services/gradeManagementService";

const ClassManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  // Get teacher ID from auth context
  const { user } = useAuth();
  // Prefer user.teacherId; fall back to persisted teacherId in localStorage
  const teacherId = (user?.teacherId ||
    localStorage.getItem("teacherId") ||
    "") as string;
  const {
    classes,
    isLoading,
    error,
    refreshClasses,
    filters,
    setFilters,
    pagination,
  } = useTeacherClasses(teacherId);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [subjectCounts, setSubjectCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: localSearch, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Debug: Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("userToken");
        console.log("🔍 CLASS MANAGEMENT - Auth Check:", {
          hasToken: !!token,
          tokenLength: token?.length || 0,
          teacherId: teacherId,
          userId: user?.id,
          userRole: user?.role,
          userName: `${user?.firstName} ${user?.lastName}`,
        });

        if (teacherId) {
          console.log("✅ Teacher ID found:", teacherId);
          console.log(
            "📚 Will fetch classes from: GET /api/classes/teacher/" + teacherId
          );
        } else {
          console.warn(
            "⚠️ No teacher ID found in user context. Cannot fetch classes."
          );
        }
      } catch (error) {
        console.error("❌ AUTH CHECK ERROR:", error);
      }
    };
    checkAuth();
  }, [teacherId, user]);

  // Fetch subject counts for all classes
  useEffect(() => {
    const fetchSubjectCounts = async () => {
      console.log(
        "🔄 [SUBJECT COUNTS] Starting fetch for classes:",
        classes.length
      );
      console.log(
        "🔄 [SUBJECT COUNTS] Classes data:",
        classes.map((c) => ({ id: c.id, name: c.name }))
      );

      if (classes.length === 0) {
        console.warn("⚠️ [SUBJECT COUNTS] No classes to fetch");
        return;
      }

      const counts = new Map<string, number>();

      for (const classData of classes) {
        try {
          console.log(
            `🔄 [SUBJECT COUNTS] Fetching for class: ${classData.id} (${classData.name}) for teacher: ${teacherId}`
          );
          const response = await secureApiService.get(
            `/classes/${classData.id}/subjects?teacherId=${teacherId}`
          );
          const subjectCount = Array.isArray(response.data)
            ? response.data.length
            : 0;
          counts.set(classData.id, subjectCount);
          console.log(
            `✅ [SUBJECT COUNTS] Class ${classData.id} (${classData.name}): ${subjectCount} subjects assigned to teacher`
          );
        } catch (error) {
          console.warn(
            `❌ [SUBJECT COUNTS] Failed to fetch subject count for class ${classData.id}:`,
            error
          );
          counts.set(classData.id, 0);
        }
      }

      console.log(
        "🔄 [SUBJECT COUNTS] Final counts map:",
        Object.fromEntries(counts)
      );
      setSubjectCounts(counts);
    };

    fetchSubjectCounts();
  }, [classes]);

  // Note: Now using GET /api/classes/teacher/{teacherId} to get only the classes assigned to the current teacher
  // Teachers have read-only access - no CREATE, UPDATE, DELETE operations

  const fetchClassStudents = async (classId: string) => {
    try {
      setLoadingStudents(true);
      console.log("🔄 FETCHING STUDENTS FOR CLASS:", classId);

      const response = await secureApiService.get(
        `/classes/${classId}/students`,
        {
          params: { include: "user,grades" },
        }
      );

      console.log("📡 STUDENTS RESPONSE:", response);

      if (response.data && Array.isArray(response.data)) {
        const studentsData = response.data.map((student: any) => ({
          id: student.id,
          name: `${student.user?.firstName || ""} ${
            student.user?.lastName || ""
          }`.trim(),
          dariName: student.user?.dariName || "",
          email: student.user?.email || t("teacherPortal.classes.modal.na"),
          rollNumber: student.rollNumber || t("teacherPortal.classes.modal.na"),
          status: student.status || t("teacherPortal.classes.modal.active"),
          grade:
            student.grades?.[0]?.grade || t("teacherPortal.classes.modal.na"),
        }));

        setStudents(studentsData);
        console.log("✅ STUDENTS LOADED:", studentsData.length);
      } else {
        console.log("⚠️ NO STUDENTS DATA FOUND");
        setStudents([]);
      }
    } catch (error) {
      console.error("❌ ERROR FETCHING STUDENTS:", error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleClassClick = async (classData: TeacherClass) => {
    setSelectedClass(classData);
    setShowStudents(true);
    setCurrentPage(0);
    await fetchClassStudents(classData.id);
  };

  const handleCloseStudents = () => {
    setShowStudents(false);
    setSelectedClass(null);
    setStudents([]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <span className="material-icons text-4xl sm:text-5xl lg:text-6xl text-gray-400 mb-4 animate-spin">
          hourglass_empty
        </span>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          {t("teacherPortal.common.loadingClasses")}
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
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-md mb-4">
          {error}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={refreshClasses}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-icons text-sm">refresh</span>
            {t("teacherPortal.common.tryAgain")}
          </button>
          <div className="text-xs text-gray-500">
            {t("teacherPortal.classes.teacherId")}: {teacherId}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          {t("teacherPortal.classes.title")}
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          {t("teacherPortal.classes.subtitle")}
        </p>

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t("teacherPortal.classes.searchPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={filters.level || ""}
              onChange={(e) =>
                setFilters({
                  level: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              {/* <option value="">{t("teacherPortal.classes.allLevels")}</option> */}
              <option value="1">{t("teacherPortal.classes.level")} 1</option>
              <option value="2">{t("teacherPortal.classes.level")} 2</option>
              <option value="3">{t("teacherPortal.classes.level")} 3</option>
              <option value="4">{t("teacherPortal.classes.level")} 4</option>
              <option value="5">{t("teacherPortal.classes.level")} 5</option>
              <option value="6">{t("teacherPortal.classes.level")} 6</option>
              <option value="7">{t("teacherPortal.classes.level")} 7</option>
              <option value="8">{t("teacherPortal.classes.level")} 8</option>
              <option value="9">{t("teacherPortal.classes.level")} 9</option>
              <option value="10">{t("teacherPortal.classes.level")} 10</option>
              <option value="11">{t("teacherPortal.classes.level")} 11</option>
              <option value="12">{t("teacherPortal.classes.level")} 12</option>
            </select>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center">
          <span className="material-icons text-6xl sm:text-7xl lg:text-8xl text-gray-400 mb-6">
            {filters.search || filters.level ? "search" : "school"}
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-600 mb-4">
            {filters.search || filters.level
              ? t("teacherPortal.classes.classNotFound")
              : t("teacherPortal.classes.noClassesAssigned")}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-500 max-w-md">
            {filters.search || filters.level
              ? t("teacherPortal.classes.classNotFoundDescription")
              : t("teacherPortal.classes.noClassesDescription")}
          </p>
          {!(filters.search || filters.level) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="material-icons text-blue-600">info</span>
                <span className="text-sm text-blue-700 font-medium">
                  {t("teacherPortal.classes.teacherId")}: {teacherId} •{" "}
                  {t("teacherPortal.classes.totalClasses")}: 0
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Classes Content */
        <div className="space-y-6 lg:space-y-8">
          {/* Classes Grid */}
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4">
              {t("teacherPortal.classes.yourClasses")} ({classes.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {classes.map((classData) => (
                <div
                  key={classData.id}
                  onClick={() => handleClassClick(classData)}
                  className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300"
                >
                  {/* Class Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-2xl text-blue-600">
                        school
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900">
                          {t("teacherPortal.classes.class")} {classData.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {t("teacherPortal.classes.level")} {classData.level} -{" "}
                          {t("teacherPortal.classes.code")}: {classData.code}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Class Stats */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {t("teacherPortal.classes.students")}:
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {classData._count?.students || classData.studentCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {t("teacherPortal.classes.capacity")}:
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {classData.capacity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {t("teacherPortal.classes.subjects")}:
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {(() => {
                          const displayCount = subjectCounts.has(classData.id)
                            ? subjectCounts.get(classData.id)
                            : classData._count?.subjects || 0;
                          console.log(
                            `📋 [DISPLAY] Class ${classData.id} (${
                              classData.name
                            }) - API count: ${subjectCounts.get(
                              classData.id
                            )}, Fallback count: ${
                              classData._count?.subjects || 0
                            }, Displaying: ${displayCount}`
                          );
                          return displayCount;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">
                        {t("teacherPortal.classes.exams")}:
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        {classData._count?.exams || 0}
                      </span>
                    </div>
                  </div>

                  {/* School Badge */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {classData.school?.name || 'Unknown School'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            {t("teacherPortal.classes.showing")}{" "}
            {(filters.page - 1) * filters.limit + 1}{" "}
            {t("teacherPortal.classes.to")}{" "}
            {Math.min(filters.page * filters.limit, pagination.total)}{" "}
            {t("teacherPortal.classes.of")} {pagination.total}{" "}
            {t("teacherPortal.classes.classes")}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ page: filters.page - 1 })}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("teacherPortal.classes.previous")}
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              {t("teacherPortal.classes.page")} {filters.page}{" "}
              {t("teacherPortal.classes.of")} {pagination.totalPages}
            </span>
            <button
              onClick={() => setFilters({ page: filters.page + 1 })}
              disabled={!pagination.hasNext}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("teacherPortal.classes.next")}
            </button>
          </div>
        </div>
      )}

      {/* Students Modal */}
      {showStudents && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("teacherPortal.classes.modal.studentsInClass")}{" "}
                  {selectedClass.name}
                </h2>
                <p className="text-gray-600 mt-1">
                  {t("teacherPortal.classes.modal.totalStudents")}:{" "}
                  {selectedClass._count?.students || selectedClass.studentCount || 0}
                </p>
              </div>
              <button
                onClick={handleCloseStudents}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-icons text-3xl">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-2 sm:p-6  max-h-[calc(90vh-120px)] overflow-y-auto">
              {loadingStudents ? (
                <div className="text-center py-12">
                  <span className="material-icons text-6xl text-gray-400 mb-4 animate-spin">
                    hourglass_empty
                  </span>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {t("teacherPortal.classes.modal.loadingStudents")}
                  </h3>
                  <p className="text-gray-500">
                    {t(
                      "teacherPortal.classes.modal.pleaseWaitFetchingStudents"
                    )}
                  </p>
                </div>
              ) : students.length > 0 ? (
                <div>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>
                        {t("teacherPortal.classes.modal.classInfo")}:
                      </strong>{" "}
                      {selectedClass.name} •{" "}
                      {t("teacherPortal.classes.modal.level")}{" "}
                      {selectedClass.level} • {students.length}{" "}
                      {t("teacherPortal.classes.modal.students")}
                    </p>
                  </div>

                  <div>
                    <div className="grid gap-4">
                      {students
                        .slice(currentPage * 20, (currentPage + 1) * 20)
                        .map((student) => (
                          <div
                            key={student.id}
                            className="bg-white shadow-sm rounded-2xl p-4 hover:shadow-lg transition-colors transation-300 transform-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="material-icons text-blue-600">
                                    person
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {i18n.language === "en"
                                      ? student.name
                                      : student.dariName || student.name}
                                  </h4>
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-900">
                                  {t("teacherPortal.classes.modal.roll")}:{" "}
                                  {student.id}
                                </p>

                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    student.status === "Active"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {student.status === "Active"
                                    ? t("teacherPortal.classes.modal.active")
                                    : student.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(0, prev - 1))
                        }
                        disabled={currentPage === 0}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                      >
                        {t("teacherPortal.classes.modal.previous")}
                      </button>
                      <span className="text-sm text-gray-600">
                        {t("teacherPortal.classes.modal.page")}{" "}
                        {currentPage + 1} {t("teacherPortal.classes.modal.of")}{" "}
                        {Math.ceil(students.length / 20)}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            (prev + 1) * 20 < students.length ? prev + 1 : prev
                          )
                        }
                        disabled={(currentPage + 1) * 20 >= students.length}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                      >
                        {t("teacherPortal.classes.modal.next")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="material-icons text-6xl text-gray-400 mb-4">
                    people_outline
                  </span>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {t("teacherPortal.classes.modal.noStudentsFound")}
                  </h3>
                  <p className="text-gray-500">
                    {t("teacherPortal.classes.modal.classNoStudentsAssigned")}
                  </p>
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>
                        {t("teacherPortal.classes.modal.classInfo")}:
                      </strong>{" "}
                      {selectedClass.name} •{" "}
                      {t("teacherPortal.classes.modal.level")}{" "}
                      {selectedClass.level} • {(selectedClass._count?.students || selectedClass.studentCount || 0)}{" "}
                      {t("teacherPortal.classes.modal.students")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
