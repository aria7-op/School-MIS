import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FaTimes, FaGraduationCap, FaCheckCircle } from "react-icons/fa";
import secureApiService from "../../../services/secureApiService";
// import AcademicYearSelector from '../../../components/AcademicYearSelector';

interface PromoteStudentModalProps {
  isOpen: boolean;
  student: {
    id: string | number;
    name?: string;
    admissionNo?: string;
    currentClass?: string;
  } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Class {
  id: string | number;
  name: string;
  code?: string;
  level?: number;
  section?: string;
}

interface Section {
  id: string | number;
  name: string;
  classId?: string | number;
}

const PromoteStudentModal: React.FC<PromoteStudentModalProps> = ({
  isOpen,
  student,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [targetClassId, setTargetClassId] = useState<string>("");
  const [targetSectionId, setTargetSectionId] = useState<string>("");
  const [academicSessionId, setAcademicSessionId] = useState<string>("");
  const [rollNo, setRollNo] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch classes and sections
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    Promise.all([
      secureApiService.get("/classes?limit=100"),
      secureApiService.get("/enrollments/academic-year/sessions"),
    ])
      .then(([classesRes, sessionsRes]) => {
        // Debug: Log responses to understand structure
        console.log("Classes response:", classesRes);
        console.log("Sessions response:", sessionsRes);

        // Handle classes response - check multiple possible structures
        let classesData: Class[] = [];
        if (Array.isArray(classesRes.data)) {
          // Direct array: { success: true, data: [...] }
          classesData = classesRes.data;
        } else if (classesRes.data && typeof classesRes.data === "object") {
          // Nested structure: { success: true, data: { data: [...] } }
          if (Array.isArray((classesRes.data as any).data)) {
            classesData = (classesRes.data as any).data;
          } else if (Array.isArray(classesRes.data)) {
            classesData = classesRes.data as any;
          }
        }

        console.log("Parsed classes:", classesData);
        console.log("Classes count:", classesData.length);
        setClasses(classesData);

        // Handle sessions response - the AcademicYearSelector should handle this
        // But we also need to set the default value here
        let fetchedSessions: any[] = [];
        if (Array.isArray(sessionsRes.data)) {
          fetchedSessions = sessionsRes.data as any[];
        } else if ((sessionsRes.data as any)?.data) {
          fetchedSessions = Array.isArray((sessionsRes.data as any).data)
            ? (sessionsRes.data as any).data
            : [];
        }

        setSessions(fetchedSessions);
        const currentSession = fetchedSessions.find((s: any) => s.isCurrent);
        if (currentSession) {
          setAcademicSessionId(currentSession.id.toString());
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        console.error("Error details:", err.response?.data || err.message);
        setError(
          `Failed to load data: ${
            err.response?.data?.message || err.message || "Unknown error"
          }`
        );
        setLoading(false);
      });
  }, [isOpen]);

  // Fetch sections when class is selected
  useEffect(() => {
    if (!targetClassId) {
      setSections([]);
      return;
    }

    secureApiService
      .get<{ data: Section[] }>(`/classes/${targetClassId}/sections`)
      .then((res) => {
        const sectionsData = (res.data as any)?.data || [];
        setSections(sectionsData);
      })
      .catch((err) => {
        console.error("Error fetching sections:", err);
        // Sections might not be available, continue anyway
      });
  }, [targetClassId]);

  const handlePromote = async () => {
    if (!student || !targetClassId || !academicSessionId) {
      setError(
        t("students.promote.selectRequired") ||
          "Please select target class and academic year"
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await secureApiService.post("/enrollments/enroll", {
        studentId: student.id,
        classId: targetClassId,
        sectionId: targetSectionId || null,
        academicSessionId: academicSessionId,
        rollNo: rollNo || null,
        status: "ENROLLED",
        remarks: `Promoted from ${student.currentClass || "previous class"}`,
      });

      if (response.success || (response as any).data) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
          // Reset form
          setTargetClassId("");
          setTargetSectionId("");
          setRollNo("");
          setSuccess(false);
        }, 1500);
      } else {
        setError("Failed to promote student");
      }
    } catch (err: any) {
      console.error("Error promoting student:", err);
      setError(err.response?.data?.message || "Failed to promote student");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !student) return null;

  const selectedClass = classes.find((c) => c.id.toString() === targetClassId);

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaGraduationCap className="w-6 h-6" />
            <div>
              <h2 className="text-xl text-gray-900 font-bold">
                {t("students.promote.title")}
              </h2>
              <p className="text-gray-800 text-sm mt-1">
                {student.name} ({student.admissionNo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {t("students.promote.currentStatus")}
                </h3>
                <p className="text-sm text-blue-700">
                  {t("students.promote.currentClass")}:{" "}
                  <span className="font-medium">
                    {student.currentClass || "N/A"}
                  </span>
                </p>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("students.promote.academicYear")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={academicSessionId}
                  onChange={(e) => setAcademicSessionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">
                    {t("students.promote.selectAcademicYear")}
                  </option>
                  {sessions.map((s: any) => {
                    const label =
                      s.name ||
                      s.label ||
                      s.title ||
                      `${s.startYear || ""}${
                        s.endYear ? " - " + s.endYear : ""
                      }` ||
                      `Session ${s.id}`;
                    return (
                      <option key={s.id} value={String(s.id)}>
                        {label} {s.isCurrent ? "(Current)" : ""}
                      </option>
                    );
                  })}
                </select>
                {academicSessionId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {academicSessionId}
                  </p>
                )}
              </div>

              {/* Target Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("students.promote.targetClass")}{" "}
                  <span className="text-red-500">*</span>
                  {classes.length === 0 && !loading && (
                    <span className="text-xs text-red-500 ml-2">
                      ({t("students.promote.noClassesAvailable")})
                    </span>
                  )}
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => {
                    setTargetClassId(e.target.value);
                    setTargetSectionId(""); // Reset section when class changes
                  }}
                  disabled={classes.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {classes.length === 0
                      ? t("students.promote.noClassesAvailable")
                      : t("students.promote.selectTargetClass")}
                  </option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={String(cls.id)}>
                      {cls.name || `Class ${cls.id}`}{" "}
                      {cls.code ? `(${cls.code})` : ""}
                    </option>
                  ))}
                </select>
                {classes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t("students.promote.classesAvailable", {
                      count: classes.length,
                    })}
                  </p>
                )}
              </div>

              {/* Target Section (if sections available) */}
              {sections.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("students.promote.targetSection")}
                  </label>
                  <select
                    value={targetSectionId}
                    onChange={(e) => setTargetSectionId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t("students.promote.noSection")}</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Roll Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("students.promote.rollNumber")}
                </label>
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder={t("students.promote.enterRollNumber")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Summary */}
              {targetClassId && academicSessionId && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t("students.promote.summary")}
                  </h3>
                  <div className="text-sm space-y-1 text-gray-700">
                    <p>
                      {t("students.promote.from")}:{" "}
                      <span className="font-medium">
                        {student.currentClass || "N/A"}
                      </span>
                    </p>
                    <p>
                      {t("students.promote.to")}:{" "}
                      <span className="font-medium">
                        {selectedClass?.name || "N/A"}
                      </span>
                    </p>
                    {targetSectionId &&
                      sections.find(
                        (s) => s.id.toString() === targetSectionId
                      ) && (
                        <p>
                          {t("students.promote.section")}:{" "}
                          <span className="font-medium">
                            {
                              sections.find(
                                (s) => s.id.toString() === targetSectionId
                              )?.name
                            }
                          </span>
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                  <FaCheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">
                    {t("students.promote.successMessage")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handlePromote}
            disabled={
              !targetClassId || !academicSessionId || submitting || success
            }
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t("students.promote.promoting")}
              </>
            ) : (
              <>
                <FaGraduationCap className="w-4 h-4" />
                {t("students.promote.button")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PromoteStudentModal;
