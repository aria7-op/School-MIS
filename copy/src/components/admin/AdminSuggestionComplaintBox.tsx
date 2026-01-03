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
  HiFunnel,
  HiArrowPath,
} from "react-icons/hi2";
import { API_CONFIG } from "../../services/apiConfig";
import { useRecipients } from "../../hooks/useRecipients";

interface AdminSuggestionComplaintBoxProps {
  adminId?: string;
}

interface Submission {
  id: string;
  type: "suggestion" | "complaint";
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "submitted" | "under_review" | "responded" | "resolved" | "closed";
  submittedAt?: string;
  createdAt?: string;
  response?: string;
  respondedAt?: string;
  recipientType: "TEACHER" | "ADMIN";
  recipientId: number; // Changed from recipient object to just ID
  parent: {
    id: string;
    user: {
      id: string;
      name: string;
      phone: string;
    };
  };
  student?: {
    id: string;
    admissionNo: string;
    class: {
      name: string;
      grade: string;
    };
    section: {
      name: string;
    };
  };
  responder?: {
    id: string;
    name: string;
    role: string;
  };
}

const AdminSuggestionComplaintBox: React.FC<
  AdminSuggestionComplaintBoxProps
> = ({ adminId }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "all" | "teachers" | "admins" | "pending" | "responded"
  >("all");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]); // Store all submissions for counting
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [responseText, setResponseText] = useState<{ [key: string]: string }>(
    {}
  );
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    priority: "",
  });

  // Fetch recipients data
  const {
    recipients,
    getRecipientName,
    isLoading: recipientsLoading,
  } = useRecipients("1");

  // Load all submissions on component mount
  useEffect(() => {
    loadAllSubmissions();
  }, []);

  // Filter submissions when activeTab or filters change
  useEffect(() => {
    filterSubmissions();
  }, [activeTab, filters, allSubmissions]);

  const loadAllSubmissions = async () => {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/suggestion-complaints/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAllSubmissions(data.data);
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...allSubmissions];

    // Filter by recipient type
    if (activeTab === "teachers") {
      filtered = filtered.filter((s) => s.recipientType === "TEACHER");
    } else if (activeTab === "admins") {
      filtered = filtered.filter((s) => s.recipientType === "ADMIN");
    }

    // Filter by status
    if (activeTab === "pending") {
      filtered = filtered.filter((s) => s.status === "submitted");
    } else if (activeTab === "responded") {
      filtered = filtered.filter((s) => s.status === "responded");
    }

    // Apply additional filters
    if (filters.type) {
      filtered = filtered.filter((s) => s.type.toUpperCase() === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(
        (s) => s.status.toUpperCase() === filters.status
      );
    }
    if (filters.priority) {
      filtered = filtered.filter(
        (s) => s.priority.toUpperCase() === filters.priority
      );
    }

    setSubmissions(filtered);
  };

  const loadSubmissions = async () => {
    await loadAllSubmissions();
  };

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

  const handleStatusUpdate = async (submissionId: string, status: string) => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      const res = await fetch(
        `${API_CONFIG.BASE_URL}/suggestion-complaints/${submissionId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();
      if (data.success) {
        loadAllSubmissions(); // Reload all submissions to get updated data
      } else {
        console.error("Error updating status:", data.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
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
        return t("admin.suggestions.submitted");
      case "under_review":
        return t("admin.suggestions.underReview");
      case "responded":
        return t("admin.suggestions.responded");
      case "resolved":
        return t("admin.suggestions.resolved");
      case "closed":
        return t("admin.suggestions.closed");
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
        return t("admin.suggestions.priorityHigh");
      case "medium":
        return t("admin.suggestions.priorityMedium");
      case "low":
        return t("admin.suggestions.priorityLow");
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
      ? t("admin.suggestions.suggestion")
      : t("admin.suggestions.complaint");
  };

  const getRecipientTypeColor = (type: string) => {
    return type === "TEACHER"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  const getRecipientTypeText = (type: string) => {
    return type === "TEACHER"
      ? t("admin.suggestions.teacher")
      : t("admin.suggestions.admin");
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case "all":
        return allSubmissions.length;
      case "teachers":
        return allSubmissions.filter((s) => s.recipientType === "TEACHER")
          .length;
      case "admins":
        return allSubmissions.filter((s) => s.recipientType === "ADMIN").length;
      case "pending":
        return allSubmissions.filter((s) => s.status === "submitted").length;
      case "responded":
        return allSubmissions.filter((s) => s.status === "responded").length;
      default:
        return 0;
    }
  };

  return (
    <div className="w-full p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 flex items-center justify-center flex-shrink-0">
              <HiChatBubbleLeftRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {t("admin.suggestions.title")}
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm lg:text-base mt-0.5">
                {t("admin.suggestions.subtitle")}
              </p>
            </div>
          </div>
          {/* <button
            onClick={loadAllSubmissions}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <span className="hidden xs:inline">
              {t("admin.suggestions.refresh")}
            </span>
            <HiArrowPath
              className={`w-4 h-4 xs:hidden ${loading ? "animate-spin" : ""}`}
            />
          </button> */}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "all"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("admin.suggestions.all")} ({getTabCount("all")})
        </button>
        <button
          onClick={() => setActiveTab("teachers")}
          className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "teachers"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("admin.suggestions.teachers")} ({getTabCount("teachers")})
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "admins"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("admin.suggestions.admins")} ({getTabCount("admins")})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "pending"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("admin.suggestions.pending")} ({getTabCount("pending")})
        </button>
        <button
          onClick={() => setActiveTab("responded")}
          className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "responded"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {t("admin.suggestions.responded")} ({getTabCount("responded")})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <HiFunnel className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">
            {t("admin.suggestions.filters")}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              {t("admin.suggestions.type")}
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="">{t("admin.suggestions.allTypes")}</option>
              <option value="SUGGESTION">
                {t("admin.suggestions.suggestion")}
              </option>
              <option value="COMPLAINT">
                {t("admin.suggestions.complaint")}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.suggestions.statusLabel")}
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="">{t("admin.suggestions.allStatuses")}</option>
              <option value="SUBMITTED">
                {t("admin.suggestions.submitted")}
              </option>
              <option value="UNDER_REVIEW">
                {t("admin.suggestions.underReview")}
              </option>
              <option value="RESPONDED">
                {t("admin.suggestions.responded")}
              </option>
              <option value="RESOLVED">
                {t("admin.suggestions.resolved")}
              </option>
              <option value="CLOSED">{t("admin.suggestions.closed")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.suggestions.priorityLabel")}
            </label>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, priority: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="">{t("admin.suggestions.allPriorities")}</option>
              <option value="LOW">{t("admin.suggestions.priorityLow")}</option>
              <option value="MEDIUM">
                {t("admin.suggestions.priorityMedium")}
              </option>
              <option value="HIGH">
                {t("admin.suggestions.priorityHigh")}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {loading || recipientsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">
            {t("admin.suggestions.loading")}
          </span>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12">
          <HiChatBubbleLeftRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("admin.suggestions.noMessages")}
          </h3>
          <p className="text-gray-500">
            {t("admin.suggestions.noMessagesDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getTypeIcon(submission.type)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {submission.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({getTypeText(submission.type)})
                      </span>
                    </div>

                    {/* Description - Always visible */}
                    <div className="mb-3">
                      <p className="text-gray-700 leading-relaxed line-clamp-2">
                        {submission.description}
                      </p>
                    </div>

                    {/* Parent, Student, and Recipient Info */}
                    <div className="mb-3 text-sm text-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-1">
                          <HiUser className="w-4 h-4" />
                          <span>
                            <strong>{t("admin.suggestions.parent")}:</strong>{" "}
                            {submission.parent?.user?.name || "N/A"}
                          </span>
                        </div>
                        {submission.student && (
                          <div className="flex items-center gap-1">
                            <HiAcademicCap className="w-4 h-4" />
                            <span>
                              <strong>{t("admin.suggestions.student")}:</strong>{" "}
                              {submission.student.admissionNo} -{" "}
                              {submission.student.class?.name || "N/A"}{" "}
                              {submission.student.section?.name || "No Section"}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>
                            <strong>{t("admin.suggestions.recipient")}:</strong>{" "}
                            {getRecipientName(
                              submission.recipientId,
                              submission.recipientType
                            )}
                            <span
                              className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getRecipientTypeColor(
                                submission.recipientType
                              )}`}
                            >
                              {getRecipientTypeText(submission.recipientType)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Date, Status, Priority, Category */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <HiClock className="w-4 h-4" />
                        <strong>Date:</strong>{" "}
                        {submission.submittedAt || submission.createdAt
                          ? new Date(submission.submittedAt || submission.createdAt).toLocaleString(
                              navigator.language || "en-US",
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }
                            )
                          : t("admin.suggestions.noDate")}
                      </span>
                      {submission.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          <strong>Category:</strong> {submission.category}
                        </span>
                      )}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpanded(submission.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={expandedItems.has(submission.id) ? "Collapse" : "Expand"}
                    >
                      <HiEye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {expandedItems.has(submission.id) && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        {t("admin.suggestions.description")}:
                      </h4>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {submission.description}
                      </p>
                    </div>
                    
                    {/* Additional Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong className="text-gray-700">Submitted Date:</strong>{" "}
                        <span className="text-gray-600">
                          {submission.submittedAt || submission.createdAt
                            ? new Date(submission.submittedAt || submission.createdAt).toLocaleString(
                                navigator.language || "en-US",
                                {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }
                              )
                            : "N/A"}
                        </span>
                      </div>
                      {submission.category && (
                        <div>
                          <strong className="text-gray-700">Category:</strong>{" "}
                          <span className="text-gray-600 capitalize">{submission.category}</span>
                        </div>
                      )}
                    </div>

                    {submission.response ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-900 mb-2">
                          {t("admin.suggestions.response")} (
                          {submission.responder?.name}):
                        </h4>
                        <p className="text-green-800 leading-relaxed">
                          {submission.response}
                        </p>
                        {submission.respondedAt && (
                          <div className="mt-2 text-xs text-green-600">
                            {t("admin.suggestions.respondedOn")}:{" "}
                            {new Date(
                              submission.respondedAt
                            ).toLocaleDateString(navigator.language || "en-US")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-3">
                          {t("admin.suggestions.respond")}:
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
                            "admin.suggestions.responsePlaceholder"
                          )}
                        />
                        <div className="mt-3 flex justify-between items-center">
                          <div className="flex gap-2">
                            <select
                              onChange={(e) =>
                                handleStatusUpdate(
                                  submission.id,
                                  e.target.value
                                )
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">
                                {t("admin.suggestions.updateStatus")}
                              </option>
                              <option value="UNDER_REVIEW">
                                {t("admin.suggestions.underReview")}
                              </option>
                              <option value="RESOLVED">
                                {t("admin.suggestions.resolved")}
                              </option>
                              <option value="CLOSED">
                                {t("admin.suggestions.closed")}
                              </option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setRespondingTo(null)}
                              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              {t("admin.suggestions.cancel")}
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
                                  {t("admin.suggestions.sending")}
                                </>
                              ) : (
                                <>
                                  <HiArrowUturnLeft className="w-4 h-4" />
                                  {t("admin.suggestions.sendResponse")}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
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
  );
};

export default AdminSuggestionComplaintBox;
