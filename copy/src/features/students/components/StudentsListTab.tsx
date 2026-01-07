import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { Student, StudentFilters } from "../types";
import StudentForm from "./StudentForm";
import type { SavedDraft } from "./types";
import DraftsModal from "./DraftsModal";
import StudentDetailsModal from "./StudentDetailsModal";
import PromoteStudentModal from "./PromoteStudentModal";
import TransferCertificate from "./TransferCertificate";
import AssignCourseModal from "./AssignCourseModal";
import cardService from "../services/cardService";
import studentService from "../services/studentService";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import secureApiService from "../../../services/secureApiService";
import {
  FaPrint,
  FaGraduationCap,
  FaFileExport,
  FaShower,
  FaNewspaper,
  FaBook,
} from "react-icons/fa";
import { dir } from "i18next";

interface StudentsListTabProps {
  students: Student[];
  loading: boolean;
  error: string | null;
  filters: StudentFilters;
  onFiltersChange: (filters: StudentFilters) => void;
  onRefresh: () => void;
  onStudentCreate: (
    studentData: Partial<Student>
  ) => Promise<{ success: boolean; data?: Student; error?: string }>;
  onStudentUpdate: (
    id: number,
    studentData: Partial<Student>
  ) => Promise<{ success: boolean; data?: Student; error?: string }>;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

const StudentsListTab: React.FC<StudentsListTabProps> = ({
  students,
  loading,
  error,
  filters,
  onFiltersChange,
  onRefresh,
  onStudentCreate,
  onStudentUpdate,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}) => {
  const { t } = useTranslation();
  const { error: showError, warning: showWarning } = useToast();
  const { managedContext } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [loadedDraft, setLoadedDraft] = useState<SavedDraft | null>(null);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [promotingStudent, setPromotingStudent] = useState<Student | null>(
    null
  );
  const [transferCertificateData, setTransferCertificateData] = useState<
    any | null
  >(null);
  const [loadingTransferCert, setLoadingTransferCert] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || "");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [isSearching, setIsSearching] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
  const [selectedStudentForCourse, setSelectedStudentForCourse] = useState<{id: number, name: string} | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filtersRef = useRef(filters);

  // Update filters ref when filters change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Load courses on component mount
  useEffect(() => {
    const loadCourses = async () => {
      if (!managedContext.schoolId) return;

      try {
        setLoadingCourses(true);
        const response = await secureApiService.get(
          `/schools/${managedContext.schoolId}/courses`
        );
        const courseList = Array.isArray(response?.data)
          ? response.data
          : response?.data?.data || [];
        setCourses(courseList);
      } catch (err) {
        console.error("Error loading courses:", err);
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, [managedContext.schoolId]);

  // Handle show inactive toggle
  const handleToggleInactive = () => {
    const newShowInactive = !showInactive;
    setShowInactive(newShowInactive);

    onFiltersChange({
      ...filters,
      includeInactive: newShowInactive,
      status: newShowInactive ? "INACTIVE" : undefined,
      page: 1,
    });
  };

  // Debounced search function with proper cleanup
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const searchFunction = (query: string) => {
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Set searching state immediately for UI feedback
        setIsSearching(true);

        // Set new timeout
        timeoutId = setTimeout(() => {
          onFiltersChange({ ...filtersRef.current, search: query });
          setIsSearching(false);
          timeoutId = null;
        }, 800); // 500ms delay for better typing flexibility
      };

      // Add cleanup method to the function
      searchFunction.cancel = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
          setIsSearching(false);
        }
      };

      return searchFunction;
    })(),
    [onFiltersChange]
  );

  // Handle search input change - memoized to prevent re-renders
  const handleSearchInputChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      // Only trigger search if:
      // 1. Query is empty (clearing search)
      // 2. Query has at least 2 characters (avoid searching on single letters)
      // 3. Query has been completely cleared
      if (query.trim() === "" || query.trim().length >= 2) {
        debouncedSearch(query);
      }
    },
    [debouncedSearch]
  );

  // Sync search query with filters when they change externally (only if different)
  useEffect(() => {
    if (filters.search !== searchQuery) {
      setSearchQuery(filters.search || "");
    }
  }, [filters.search]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending timeouts
      if (debouncedSearch && typeof debouncedSearch.cancel === "function") {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  // Handle student selection
  const handleStudentSelect = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  // Pagination helpers
  const handlePageChange = (page: number) => {
    if (onPageChange && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Handle student edit
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
  };

  // Handle form submission
  const handleFormSubmit = async (
    studentData: Partial<Student>
  ): Promise<{ success: boolean; data?: Student; error?: string }> => {
    setFormLoading(true);
    try {
      let result;
      if (editingStudent) {
        result = await onStudentUpdate(editingStudent.id, studentData);
      } else {
        result = await onStudentCreate(studentData);
      }

      if (result.success) {
        setShowAddModal(false);
        setEditingStudent(null);
        return result;
      } else {
        alert(result.error || "Failed to save student");
        return result;
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowAddModal(false);
    setEditingStudent(null);
  };

  const handleViewStudent = (student: Student) => {
    setViewingStudent(student);
  };

  const handlePromoteStudent = (student: Student) => {
    setPromotingStudent(student);
  };

  const handlePromoteSuccess = () => {
    setPromotingStudent(null);
    onRefresh(); // Refresh the list after promotion
  };

  // Handle course assignment
  const handleAssignCourse = async (studentId: number, courseId: number) => {
    try {
      const response = await fetch(`/api/students/${studentId}/assign-course`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to assign course' };
      }
    } catch (error) {
      console.error('Error assigning course:', error);
      return { success: false, error: 'Error assigning course' };
    }
  };

  // Handle assign course button click
  const handleAssignCourseClick = (student: Student) => {
    setSelectedStudentForCourse({ id: student.id, name: `${student.user?.firstName} ${student.user?.lastName}` });
    setShowAssignCourseModal(true);
  };

  // Handle print card
  const handlePrintCard = async (student: Student) => {
    try {
      // console.log("🔍 Printing card for student:", student.id);
      const result = await cardService.generateStudentCard(student.id);

      if (result.success) {
        // console.log("✅ Card generated successfully");
      } else {
        console.error("❌ Failed to generate card:", result);

        // Check if it's a permission error
        if (
          result.message?.includes("Insufficient permissions") ||
          result.message?.includes("permission")
        ) {
          showWarning(
            "Permission Denied",
            t("common.insufficientPermissions") ||
              "You don't have permission to perform this action. Required roles: SUPER_ADMIN, SCHOOL_ADMIN, ADMIN, PRINCIPAL"
          );
        } else {
          showError(
            "Error",
            `Failed to generate card: ${result.message || "Unknown error"}`
          );
        }
      }
    } catch (error) {
      console.error("❌ Error generating card:", error);
      showError(
        "Error",
        `Error generating card: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleTransferCertificate = async (student: Student) => {
    try {
      // console.log("📄 Fetching transfer certificate for student:", student.id);
      setLoadingTransferCert(true);

      const response = await studentService.getStudentTransferCertificate(
        student.id
      );

      if (response.success && response.data) {
        // console.log("✅ Transfer certificate data fetched");
        setTransferCertificateData(response.data);
      } else {
        console.error(
          "❌ Failed to fetch transfer certificate:",
          response.message || response
        );

        // Check if it's a 403 permission error
        if (
          response.message?.includes("permission") ||
          response.message?.includes("Permission") ||
          response.message?.includes("Insufficient")
        ) {
          showError(
            "Permission Denied",
            response.message ||
              "You don't have permission to perform this action. Required roles: SUPER_ADMIN, SCHOOL_ADMIN, ADMIN, PRINCIPAL"
          );
        } else {
          showError(
            "Error",
            t("students.transferCertificate.error") ||
              `Failed to fetch transfer certificate: ${
                response.message || "Unknown error"
              }`
          );
        }
      }
    } catch (error) {
      console.error("❌ Error fetching transfer certificate:", error);
      showError(
        "Error",
        t("students.transferCertificate.error") ||
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoadingTransferCert(false);
    }
  };

  // Format date
  const formatDate = (dateInput: any) => {
    // Debug: Log the input to understand what we're receiving
    // console.log("🔍 formatDate input:", dateInput, "type:", typeof dateInput);

    if (!dateInput) return "N/A";

    // Normalize to Date
    let date: Date | null = null;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === "string") {
      const value = dateInput.trim();
      if (value === "" || value === "null" || value === "undefined") {
        return "N/A";
      }

      // Numeric timestamp string
      if (/^\d+$/.test(value)) {
        const asNumber = Number(value);
        if (!Number.isNaN(asNumber)) {
          // Assume milliseconds
          date = new Date(asNumber);
        }
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // YYYY-MM-DD → ensure timezone to avoid off-by-one
        date = new Date(`${value}T00:00:00Z`);
      } else {
        // ISO or other parseable string
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          date = parsed;
        }
      }
    } else if (typeof dateInput === "number") {
      // Treat as epoch milliseconds
      date = new Date(dateInput);
    }

    // console.log("🔍 formatDate parsed date:", date);

    if (!date || Number.isNaN(date.getTime())) {
      console.log("🔍 formatDate returning N/A for:", dateInput);
      return "N/A";
    }

    const formatted = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

    // console.log("🔍 formatDate formatted result:", formatted);
    return formatted;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      case "GRADUATED":
        return "bg-blue-100 text-blue-800";
      case "TRANSFERRED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Students
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onRefresh}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Controls */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          {/* Info Text */}
          <div className="lg:mr-auto">
            <p className="text-xs sm:text-sm text-gray-600">
              {totalItems > 0
                ? t("students.table.subtitle", { count: totalItems })
                : t("students.table.empty")}
              {totalPages > 1 && (
                <>
                  <span className="hidden sm:inline">
                    {` • ${t("students.table.pageInfo", {
                      current: currentPage,
                      total: totalPages,
                    })}`}
                  </span>
                </>
              )}
            </p>
            {totalPages > 1 && (
              <p className="text-xs text-gray-500 sm:hidden mt-0.5">
                {t("students.table.pageInfo", {
                  current: currentPage,
                  total: totalPages,
                })}
              </p>
            )}
          </div>

          {/* Controls - Different layout for small vs large */}
          <div className="flex flex-col xs:flex-row lg:flex-row flex-wrap lg:flex-nowrap items-stretch xs:items-center gap-2 sm:gap-3">
            {/* Show Inactive Toggle */}
            {/* <button
              onClick={handleToggleInactive}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center xs:justify-start gap-2 border whitespace-nowrap ${
                showInactive
                  ? "bg-gray-600 text-white border-gray-700"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
              title={
                showInactive
                  ? "Showing Inactive Students"
                  : "Show Inactive Students"
              }
            >
              <span className={showInactive ? "text-white" : "text-gray-500"}>
                {showInactive ? "👁️" : "🚫"}
              </span>
              <span className="hidden xs:inline">
                {showInactive
                  ? t("students.dashboard.showInactive")
                  : "Show Inactive"}
              </span>
              <span className="xs:hidden">
                {showInactive
                  ? t("students.dashboard.inactive")
                  : t("students.dashboard.showInactive")}
              </span>
            </button> */}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 ">
              <button
                onClick={() => setViewMode("table")}
                className={`flex-1 xs:flex-none px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors  items-center justify-center hidden sm:flex gap-1 ${
                  viewMode === "table"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{t("students.table.viewModes.table")}</span>
                <span className="hidden xs:inline">
                  {t("students.table.viewModes.table")}
                </span>
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`flex-1 xs:flex-none px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                  viewMode === "card"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{t("students.table.viewModes.cards")}</span>
                <span className="hidden xs:inline">
                  {t("students.table.viewModes.cards")}
                </span>
              </button>
            </div>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-400 rounded-lg text-gray-600 px-2 sm:px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={5}>5 {t("students.table.perPage")}</option>
              <option value={10}>10 {t("students.table.perPage")}</option>
              <option value={20}>20 {t("students.table.perPage")}</option>
              <option value={50}>50 {t("students.table.perPage")}</option>
            </select>

            {/* Action Buttons */}
            <button
              onClick={() => setShowDraftsModal(true)}
              className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors hidden md:flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
            >
              <span className="hidden sm:inline">
                <FaNewspaper />
              </span>
              <span>{t("students.dashboard.draft")}</span>
            </button>

            <button
              onClick={() => {
                setLoadedDraft(null);
                setShowStudentForm(true);
              }}
              className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors hidden md:flex items-center justify-center gap-2 text-xs sm:text-sm font-medium"
            >
              <span className="text-base sm:text-lg">+</span>
              <span>{t("students.dashboard.quickActions.addStudent")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-4">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t("students.table.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              </div>
            )}
            {!isSearching && searchQuery.trim().length === 1 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              </div>
            )}
            {!isSearching && searchQuery.trim().length >= 2 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 rounded-full bg-green-400"></div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <select
              value={filters.courseId || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  courseId: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
              disabled={loadingCourses}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">
                {loadingCourses ? "Loading courses..." : "All Courses"}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <select
              value={filters.status || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  status: e.target.value || undefined,
                })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">{t("students.table.filters.allStatus")}</option>
              <option value="ACTIVE">
                {t("students.table.filters.status.active")}
              </option>
              <option value="INACTIVE">
                {t("students.table.filters.status.inactive")}
              </option>
              <option value="SUSPENDED">
                {t("students.table.filters.status.suspended")}
              </option>
              <option value="GRADUATED">
                {t("students.table.filters.status.graduated")}
              </option>
              <option value="TRANSFERRED">
                {t("students.table.filters.status.transferred")}
              </option>
            </select>

            <select
              value={filters.gender || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  gender: e.target.value || undefined,
                })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">{t("students.table.filters.allGender")}</option>
              <option value="MALE">
                {t("students.table.filters.gender.male")}
              </option>
              <option value="FEMALE">
                {t("students.table.filters.gender.female")}
              </option>
              <option value="OTHER">
                {t("students.table.filters.gender.other")}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Content */}
      <div
        className="flex-1 overflow-y-scroll overflow-x-auto min-h-0"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#9333ea #f3f4f6",
        }}
      >
        <div className="bg-white min-w-full">
          {viewMode === "table" ? (
            // Table View
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedStudents.length === students.length &&
                        students.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.table.columns.userId")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.table.columns.student")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.table.columns.fatherName")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.table.columns.fatherNumber")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.table.columns.admissionNo")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.table.columns.cardNo")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.table.columns.class")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.table.columns.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.table.columns.admissionDate")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students.table.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  // Debug: Log student data to understand structure
                  // console.log("🔍 Student data:", student);
                  // console.log(
                  //   "🔍 Student admissionDate:",
                  //   student.admissionDate,
                  //   "type:",
                  //   typeof student.admissionDate
                  // );
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentSelect(student.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {student.userId || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-medium text-sm">
                                {student.user?.firstName?.[0]}
                                {student.user?.lastName?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {dir() === "rtl"
                                ? student.user?.dariName
                                : `${student.user?.firstName} ${student.user?.lastName}`}

                              {/* {student.user?.dariName ||
                                `${student.user?.firstName} ${student.user?.lastName}`} */}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.user?.email || student.user?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dir() === "rtl"
                          ? student.parent?.user?.dariName
                          : `${student.parent?.user?.firstName} ${student.parent?.user?.lastName}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.parent?.user?.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.admissionNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.cardNo || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.class?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            student.user?.status || "ACTIVE"
                          )}`}
                        >
                          {student.user?.status === "ACTIVE"
                            ? t("students.dashboard.active")
                            : t("students.dashboard.inactive")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.admissionDate
                          ? formatDate(student.admissionDate)
                          : student.createdAt
                          ? formatDate(student.createdAt)
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewStudent(student)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {t("students.table.actions.view")}
                          </button>
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="text-purple-600 hover:text-purple-900 hidden sm:inline-block"
                          >
                            {t("students.table.actions.edit")}
                          </button>
                          <button
                            onClick={() => handlePrintCard(student)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            title={t("students.table.actions.printCard")}
                          >
                            <FaPrint className="w-4 h-4" />
                            <span>{t("students.table.actions.print")}</span>
                          </button>
                          <button
                            onClick={() => handleTransferCertificate(student)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            title={t(
                              "students.table.actions.transferCertificate"
                            )}
                            disabled={loadingTransferCert}
                          >
                            <FaFileExport className="w-4 h-4" />
                            <span>{t("students.dashboard.transfer")}</span>
                          </button>
                          <button
                            onClick={() => handlePromoteStudent(student)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            title="Promote Student"
                          >
                            <FaGraduationCap className="w-4 h-4" />
                            <span>{t("students.dashboard.promote")}</span>
                          </button>
                          <button
                            onClick={() => handleAssignCourseClick(student)}
                            className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                            title="Assign Course"
                          >
                            <FaBook className="w-4 h-4" />
                            <span>{t("students.dashboard.assignCourse")}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            // Card View
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentSelect(student.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            student.user?.status || "ACTIVE"
                          )}`}
                        >
                          {student.user?.status ||
                            t("students.table.status.active")}
                        </span>
                      </div>

                      <div className="flex items-center mb-4 gap-4">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-medium text-lg">
                              {student.user?.firstName?.[0]}
                              {student.user?.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-medium text-gray-900">
                            {student.user?.dariName ||
                              `${student.user?.firstName} ${student.user?.lastName}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.admissionNo}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {t("students.details.userId")}:
                          </span>
                          <span className="text-gray-900">
                            {student.userId || t("common.na")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {t("students.details.class")}:
                          </span>
                          <span className="text-gray-900">
                            {student.class?.name || t("common.na")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {t("students.details.cardNo")}:
                          </span>
                          <span className="text-gray-900">
                            {student.cardNo || t("common.na")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {t("students.details.parent")}:
                          </span>
                          <span className="text-gray-900">
                            {student.parent?.user?.dariName ||
                              `${student.parent?.user?.firstName} ${student.parent?.user?.lastName}`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {t("students.details.parentUsername")}:
                          </span>
                          <span className="text-gray-900">
                            {student.parent?.user?.username || t("common.na")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {t("students.details.parentPhone")}:
                          </span>
                          <span className="text-gray-900">
                            {student.parent?.user?.phone || t("common.na")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {t("students.details.email")}:
                          </span>
                          <span className="text-gray-900 truncate">
                            {student.user?.email || t("common.na")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {t("students.details.phone")}:
                          </span>
                          <span className="text-gray-900">
                            {student.user?.phone || t("common.na")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {t("students.details.admission")}:
                          </span>
                          <span className="text-gray-900">
                            {student.admissionDate
                              ? formatDate(student.admissionDate)
                              : student.createdAt
                              ? formatDate(student.createdAt)
                              : t("common.na")}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handlePrintCard(student)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
                          title={t("students.table.actions.printCard")}
                        >
                          <FaPrint className="w-4 h-4" />
                          <span>{t("students.table.actions.printCard")}</span>
                        </button>
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                        >
                          {t("students.table.actions.edit")}
                        </button>
                        <button
                          onClick={() => handlePromoteStudent(student)}
                          className="text-green-600 hover:text-green-900 text-sm font-medium flex items-center gap-1"
                          title="Promote Student"
                        >
                          <FaGraduationCap className="w-4 h-4" />
                          <span>Promote</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {students.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No students found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Get started by adding your first student"}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Student
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && totalItems > pageSize && (
        <div className="bg-white border-t border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Results Info */}
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              {t("students.table.pagination.showing")}{" "}
              {(currentPage - 1) * pageSize + 1}{" "}
              {t("students.table.pagination.to")}{" "}
              {Math.min(currentPage * pageSize, totalItems)}{" "}
              {t("students.table.pagination.of")} {totalItems}{" "}
              {t("students.table.pagination.results")}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center sm:justify-end gap-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="sm:hidden">←</span>
                <span className="hidden sm:inline">
                  {t("students.table.pagination.previous")}
                </span>
              </button>

              {/* Page Numbers - Hidden on mobile */}
              <div className="hidden sm:flex gap-1">
                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-3 py-2 text-sm text-gray-500"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentPage === page
                          ? "bg-purple-600 text-white"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              {/* Current Page Indicator - Only on mobile */}
              <div className="sm:hidden px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md">
                {currentPage} / {totalPages}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="sm:hidden">→</span>
                <span className="hidden sm:inline">
                  {t("students.table.pagination.next")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal */}
      {(showStudentForm || editingStudent) && (
        <StudentForm
          isOpen={showStudentForm || !!editingStudent}
          onClose={() => {
            setShowStudentForm(false);
            setEditingStudent(null);
            setLoadedDraft(null);
          }}
          student={editingStudent}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
          initialDraft={loadedDraft}
        />
      )}

      {showDraftsModal && (
        <DraftsModal
          onClose={() => setShowDraftsModal(false)}
          onLoadDraft={(draft) => {
            // Load draft into editing flow — open StudentForm and pass the draft
            setShowDraftsModal(false);
            setLoadedDraft(draft);
            setShowStudentForm(true);
          }}
        />
      )}

      {viewingStudent && (
        <StudentDetailsModal
          isOpen={!!viewingStudent}
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
        />
      )}

      {/* Promote Student Modal */}
      {promotingStudent && (
        <PromoteStudentModal
          isOpen={!!promotingStudent}
          student={{
            id: promotingStudent.id,
            name: `${promotingStudent.user?.firstName || ""} ${
              promotingStudent.user?.lastName || ""
            }`.trim(),
            admissionNo: promotingStudent.admissionNo || "",
            currentClass: promotingStudent.class?.name || "",
          }}
          onClose={() => setPromotingStudent(null)}
          onSuccess={handlePromoteSuccess}
        />
      )}

      {/* Transfer Certificate Modal */}
      {transferCertificateData && (
        <TransferCertificate
          certificateData={transferCertificateData}
          onClose={() => setTransferCertificateData(null)}
          onStudentTransferred={() => {
            setTransferCertificateData(null);
            onRefresh(); // Refresh the list after transfer
          }}
        />
      )}

      {/* Assign Course Modal */}
      {showAssignCourseModal && selectedStudentForCourse && (
        <AssignCourseModal
          isOpen={showAssignCourseModal}
          onClose={() => {
            setShowAssignCourseModal(false);
            setSelectedStudentForCourse(null);
          }}
          studentId={selectedStudentForCourse.id}
          studentName={selectedStudentForCourse.name}
          onAssign={handleAssignCourse}
        />
      )}
    </div>
  );
};

export default StudentsListTab;
