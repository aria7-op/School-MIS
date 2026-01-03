import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  HiChatBubbleLeftRight,
  HiExclamationTriangle,
  HiLightBulb,
  HiArrowUturnLeft,
  HiCheckCircle,
  HiClock,
  HiEye,
  HiUser,
  HiAcademicCap,
} from "react-icons/hi2";
import { API_CONFIG } from "../../../services/apiConfig";

interface TeacherSuggestionComplaintBoxProps {
  teacherId?: string;
}

interface Submission {
  id: string;
  type: "suggestion" | "complaint";
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "submitted" | "under_review" | "responded" | "resolved" | "closed";
  submittedAt: string;
  response?: string;
  respondedAt?: string;
  parent: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      displayName: string;
      phone: string;
    };
  };
  student?: {
    id: string;
    admissionNo: string;
    class: {
      name: string;
      level: string;
    };
    section: {
      name: string;
    };
  };
  responder?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    role: string;
  };
}

const TeacherSuggestionComplaintBox: React.FC<
  TeacherSuggestionComplaintBoxProps
> = ({ teacherId }) => {
  const { t } = useTranslation();
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]); // Store all submissions for counting
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [responseText, setResponseText] = useState<{ [key: string]: string }>(
    {}
  );
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load all submissions on component mount
  useEffect(() => {
    loadAllSubmissions();
  }, [teacherId]);

  const loadAllSubmissions = async () => {
    if (!teacherId) return;

    setLoading(true);
    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/suggestion-complaints/recipient/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        // Normalize status/priority casing from backend so UI filtering is consistent
        const payload = Array.isArray(data.data)
          ? data.data.map((item: any) => ({
              ...item,
              status: item.status
                ? String(item.status).toLowerCase()
                : item.status,
              priority: item.priority
                ? String(item.priority).toLowerCase()
                : item.priority,
            }))
          : data.data;

        setAllSubmissions(payload as Submission[]);
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  // (We derive pending/responded lists from `allSubmissions` in render)

  const handleRespond = async (submissionId: string) => {
    const response = responseText[submissionId];
    if (!response?.trim()) return;

    setIsResponding(true);
    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/suggestion-complaints/${submissionId}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            response: response.trim(),
            status: "RESPONDED",
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setResponseText((prev) => ({ ...prev, [submissionId]: "" }));
        setRespondingTo(null);
        loadAllSubmissions(); // Reload all submissions to get updated data
      } else {
        console.error("Error responding:", data.message);
      }
    } catch (error) {
      console.error("Error responding:", error);
    } finally {
      setIsResponding(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "responded":
        return "bg-green-100 text-green-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "submitted":
        return t("teacherPortal.suggestions.submitted");
      case "under_review":
        return t("teacherPortal.suggestions.underReview");
      case "responded":
        return t("teacherPortal.suggestions.responded");
      case "resolved":
        return t("teacherPortal.suggestions.resolved");
      case "closed":
        return t("teacherPortal.suggestions.closed");
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return t("teacherPortal.suggestions.priorityHigh");
      case "medium":
        return t("teacherPortal.suggestions.priorityMedium");
      case "low":
        return t("teacherPortal.suggestions.priorityLow");
      default:
        return priority;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "suggestion" ? (
      <HiLightBulb className="w-5 h-5 text-blue-500" />
    ) : (
      <HiExclamationTriangle className="w-5 h-5 text-red-500" />
    );
  };

  const getTypeText = (type: string) => {
    return type === "suggestion"
      ? t("teacherPortal.suggestions.suggestion")
      : t("teacherPortal.suggestions.complaint");
  };

  // derive lists for the two-column layout
  const pendingSubmissions = allSubmissions.filter(
    (s) => s.status === "submitted"
  );
  const respondedSubmissions = allSubmissions.filter(
    (s) => s.status === "responded"
  );

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center">
            <HiChatBubbleLeftRight className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("teacherPortal.suggestions.title")}
          </h1>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">
          {t("teacherPortal.suggestions.subtitle")}
        </p>
      </div>

      {/* Two-column layout: Pending (left) and Responded (right) */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">
            {t("teacherPortal.suggestions.loading")}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending column */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {t("teacherPortal.suggestions.pending")} (
                {pendingSubmissions.length})
              </h2>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <HiChatBubbleLeftRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {t("teacherPortal.suggestions.noPending")}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-4 ">
                {pendingSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getTypeIcon(submission.type)}
                            <h3 className="text-lg font-semibold text-gray-900">
                              {submission.title}
                            </h3>
                            <span className="text-sm text-gray-500">
                              ({getTypeText(submission.type)})
                            </span>
                          </div>

                          <div className="mb-3 text-sm text-gray-600">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-1">
                                <HiUser className="w-4 h-4" />
                                <span>
                                  <strong>
                                    {t("teacherPortal.suggestions.parent")}:
                                  </strong>{" "}
                                  {submission.parent.user.displayName ||
                                    `${submission.parent.user.firstName} ${submission.parent.user.lastName}`}
                                </span>
                              </div>
                              {submission.student ? (
                                <div className="flex items-center gap-1">
                                  <HiAcademicCap className="w-4 h-4" />
                                  <span>
                                    <strong>
                                      {t("teacherPortal.suggestions.student")}:
                                    </strong>{" "}
                                    {submission.student.admissionNo} -{" "}
                                    {submission.student.class.name} (Level{" "}
                                    {submission.student.class.level}){" "}
                                    {submission.student.section?.name ||
                                      t("teacherPortal.suggestions.noSection")}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <HiAcademicCap className="w-4 h-4" />
                                  <span>
                                    <strong>
                                      {t("teacherPortal.suggestions.student")}:
                                    </strong>{" "}
                                    {t(
                                      "teacherPortal.suggestions.noStudentAssociated"
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <HiClock className="w-4 h-4" />
                              {new Date(
                                submission.submittedAt
                              ).toLocaleDateString("fa-IR")}
                              {new Date(submission.submittedAt).toLocaleString(
                                "en-GB"
                              )}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                submission.status
                              )}`}
                            >
                              {getStatusText(submission.status)}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                submission.priority
                              )}`}
                            >
                              {getPriorityText(submission.priority)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleExpanded(submission.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                      </div>

                      {expandedItems.has(submission.id) && (
                        <div className="space-y-2 sm:space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              {t("teacherPortal.suggestions.description")}:
                            </h4>
                            <p className="text-gray-600 leading-relaxed">
                              {submission.description}
                            </p>
                          </div>

                          {/* Respond form for pending submissions */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-900 mb-3">
                              {t("teacherPortal.suggestions.respond")}:
                            </h4>
                            <textarea
                              value={responseText[submission.id] || ""}
                              onChange={(e) =>
                                setResponseText((prev) => ({
                                  ...prev,
                                  [submission.id]: e.target.value,
                                }))
                              }
                              rows={3}
                              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              placeholder={t(
                                "teacherPortal.suggestions.responsePlaceholder"
                              )}
                            />
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                onClick={() => setRespondingTo(null)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                              >
                                {t("teacherPortal.suggestions.cancel")}
                              </button>
                              <button
                                onClick={() => handleRespond(submission.id)}
                                disabled={
                                  isResponding ||
                                  !responseText[submission.id]?.trim()
                                }
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                              >
                                {isResponding ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t("teacherPortal.suggestions.sending")}
                                  </>
                                ) : (
                                  <>
                                    <HiArrowUturnLeft className="w-4 h-4" />
                                    {t(
                                      "teacherPortal.suggestions.sendResponse"
                                    )}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Responded column */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {t("teacherPortal.suggestions.responded")} (
                {respondedSubmissions.length})
              </h2>
            </div>

            {respondedSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <HiChatBubbleLeftRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {t("teacherPortal.suggestions.noResponded")}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {respondedSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getTypeIcon(submission.type)}
                            <h3 className="text-lg font-semibold text-gray-900">
                              {submission.title}
                            </h3>
                            <span className="text-sm text-gray-500">
                              ({getTypeText(submission.type)})
                            </span>
                          </div>

                          <div className="mb-3 text-sm text-gray-600">
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-1">
                                <HiUser className="w-4 h-4" />
                                <span>
                                  <strong>
                                    {t("teacherPortal.suggestions.parent")}:
                                  </strong>{" "}
                                  {submission.parent.user.displayName ||
                                    `${submission.parent.user.firstName} ${submission.parent.user.lastName}`}
                                </span>
                              </div>
                              {submission.student ? (
                                <div className="flex items-center gap-1">
                                  <HiAcademicCap className="w-4 h-4" />
                                  <span>
                                    <strong>
                                      {t("teacherPortal.suggestions.student")}:
                                    </strong>{" "}
                                    {submission.student.admissionNo} -{" "}
                                    {submission.student.class.name} (Level{" "}
                                    {submission.student.class.level}){" "}
                                    {submission.student.section?.name ||
                                      t("teacherPortal.suggestions.noSection")}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <HiAcademicCap className="w-4 h-4" />
                                  <span>
                                    <strong>
                                      {t("teacherPortal.suggestions.student")}:
                                    </strong>{" "}
                                    {t(
                                      "teacherPortal.suggestions.noStudentAssociated"
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <HiClock className="w-4 h-4" />
                              {new Date(
                                submission.submittedAt
                              ).toLocaleDateString("fa-IR")}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                submission.status
                              )}`}
                            >
                              {getStatusText(submission.status)}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                submission.priority
                              )}`}
                            >
                              {getPriorityText(submission.priority)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleExpanded(submission.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <HiEye className="w-5 h-5" />
                        </button>
                      </div>

                      {expandedItems.has(submission.id) && (
                        <div className="space-y-2 sm:space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              {t("teacherPortal.suggestions.description")}:
                            </h4>
                            <p className="text-gray-600 leading-relaxed">
                              {submission.description}
                            </p>
                          </div>

                          {/* Show response info */}
                          {submission.response && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-green-900 mb-2">
                                {t("teacherPortal.suggestions.yourResponse")}:
                              </h4>
                              <p className="text-green-800 leading-relaxed">
                                {submission.response}
                              </p>
                              {submission.respondedAt && (
                                <div className="mt-2 text-xs text-green-600">
                                  {t("teacherPortal.suggestions.respondedOn")}:{" "}
                                  {new Date(
                                    submission.respondedAt
                                  ).toLocaleDateString("fa-IR")}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSuggestionComplaintBox;
