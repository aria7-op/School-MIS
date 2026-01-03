// copy/src/classes/components/ClassesList.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaUserPlus, FaEye, FaChalkboardTeacher } from "react-icons/fa";
import { Class, PaginationMeta } from "../types/classes";
import AddStudentsToClassModal from "./AddStudentsToClassModal";
import ClassStudentsModal from "./ClassStudentsModal";
import AssignTeachersModal from "./AssignTeachersModal";
import PaginationControls from "./PaginationControls";
import PaginationInfo from "./PaginationInfo";

interface ClassesListProps {
  classes: Class[];
  loading: boolean;
  error: string | null;
  pagination?: PaginationMeta | null;
  currentPage?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onPageChange?: (page: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onEditClass: (classData: Class) => void;
  onDeleteClass: (id: string) => void;
  onViewClass: (id: string) => void;
  onStudentsAdded?: (classId: string, studentIds: number[]) => void;
  onToggleStatus?: (classId: string, currentStatus: boolean | number) => void;
}

const ClassesList: React.FC<ClassesListProps> = ({
  classes,
  loading,
  error,
  pagination,
  currentPage = 1,
  totalPages = 1,
  hasNextPage = false,
  hasPrevPage = false,
  onPageChange,
  onNextPage,
  onPrevPage,
  onEditClass,
  onDeleteClass,
  onViewClass,
  onStudentsAdded,
  onToggleStatus,
}) => {
  const { t } = useTranslation();
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showAssignTeachersModal, setShowAssignTeachersModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const handleAddStudents = (classData: Class) => {
    setSelectedClass(classData);
    setShowAddStudentsModal(true);
  };

  const handleStudentsAdded = (studentIds: number[]) => {
    if (selectedClass && onStudentsAdded) {
      onStudentsAdded(selectedClass.id, studentIds);
    }
    setShowAddStudentsModal(false);
    setSelectedClass(null);
  };

  const handleViewStudents = (classData: Class) => {
    setSelectedClass(classData);
    setShowStudentsModal(true);
  };

  const handleAssignTeachers = (classData: Class) => {
    setSelectedClass(classData);
    setShowAssignTeachersModal(true);
  };

  const handleTeachersAssigned = () => {
    setShowAssignTeachersModal(false);
    setSelectedClass(null);
  };

  if (loading) {
    return (
      <div className="p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-1 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
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
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {t("classes.errors.loadingClasses")}
              </h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="p-1 sm:p-6">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t("classes.noClassesFound")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("classes.getStarted")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-6 mt-4">
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group"
          >
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 text-white font-bold text-base sm:text-lg rounded-full shrink-0">
                      {classItem.level}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate">
                        {classItem.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {classItem.code}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      classItem.isActive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {classItem.isActive
                      ? t("classes.status.active")
                      : t("classes.status.inactive")}
                  </span>
                  <button
                    onClick={() =>
                      onToggleStatus?.(classItem.id, classItem.isActive)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      classItem.isActive
                        ? "bg-green-500 focus:ring-green-500"
                        : "bg-red-400 focus:ring-red-400"
                    }`}
                    title={
                      classItem.isActive
                        ? t("classes.deactivate")
                        : t("classes.activate")
                    }
                  >
                    <span
                      className={`hidden sm:block  h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                        classItem.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Class Details */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <svg
                    className="h-4 w-4 text-blue-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <span className="font-medium">
                    {t("classes.level")} {classItem.level}
                  </span>
                  {classItem.section && (
                    <span className="text-gray-400">
                      - Section {classItem.section}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <svg
                    className="h-4 w-4 text-green-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    {classItem._count?.students || 0} {t("classes.students")}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                  <svg
                    className="h-4 w-4 text-orange-500 shrink-0"
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
                  <span className="font-medium">
                    {t("classes.capacity")}: {classItem.capacity}
                  </span>
                </div>

                {classItem.roomNumber && (
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <svg
                      className="h-4 w-4 text-purple-500 shrink-0"
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
                    <span className="font-medium">
                      {t("classes.room")} {classItem.roomNumber}
                    </span>
                  </div>
                )}

                {classItem.expectedFees &&
                  Number(classItem.expectedFees) > 0 && (
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-green-600 bg-green-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-green-200">
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        Expected Fees: AFN{" "}
                        {Number(classItem.expectedFees).toLocaleString()}
                      </span>
                    </div>
                  )}
              </div>

              {/* Class Teacher */}
              {classItem.classTeacher && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          {classItem.classTeacher.user.firstName[0]}
                          {classItem.classTeacher.user.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {classItem.classTeacher.user.firstName}{" "}
                        {classItem.classTeacher.user.lastName}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        {t("classes.classTeacher")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleViewStudents(classItem)}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                  >
                    <FaEye className="w-3 h-3" />
                    {t("classes.viewStudents")}
                  </button>
                  <button
                    onClick={() => handleAddStudents(classItem)}
                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                  >
                    <FaUserPlus className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {t("classes.addStudents")}
                    </span>
                    <span className="sm:hidden">{t("classes.add")}</span>
                  </button>
                  <button
                    onClick={() => handleAssignTeachers(classItem)}
                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                  >
                    <FaChalkboardTeacher className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {t("classes.assignTeachers")}
                    </span>
                    <span className="sm:hidden">
                      {t("classes.assignTeacher")}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => onEditClass(classItem)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-md hover:bg-gray-100"
                    title={t("classes.editClass")}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteClass(classItem.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 rounded-md hover:bg-red-50"
                    title={t("classes.deleteClass")}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Students Modal */}
      <AddStudentsToClassModal
        isOpen={showAddStudentsModal}
        onClose={() => setShowAddStudentsModal(false)}
        classData={selectedClass}
        onStudentsAdded={handleStudentsAdded}
      />

      {/* View Students Modal */}
      <ClassStudentsModal
        isOpen={showStudentsModal}
        onClose={() => setShowStudentsModal(false)}
        classData={selectedClass}
      />

      {/* Assign Teachers Modal */}
      <AssignTeachersModal
        isOpen={showAssignTeachersModal}
        onClose={() => setShowAssignTeachersModal(false)}
        classData={selectedClass}
        onTeachersAssigned={handleTeachersAssigned}
      />

      {/* Pagination Info */}
      {pagination && (
        <PaginationInfo
          pagination={pagination}
          currentPage={currentPage}
          loading={loading}
        />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={onPageChange || (() => {})}
          onNextPage={onNextPage || (() => {})}
          onPrevPage={onPrevPage || (() => {})}
          loading={loading}
        />
      )}
    </div>
  );
};

export default ClassesList;
