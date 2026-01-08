import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  HiChatBubbleLeftRight,
  HiExclamationTriangle,
  HiLightBulb,
  HiPaperAirplane,
  HiCheckCircle,
  HiClock,
  HiEye,
  HiAcademicCap,
} from "react-icons/hi2";
import { API_CONFIG } from "../../../services/apiConfig";
import { useParentChildren } from "../services/parentPortalService";
import { useRecipients, RecipientsResponse } from "../../../hooks/useRecipients";
import {
  useParentSubmissions,
  ParentSubmission,
} from "../../../hooks/useParentSubmissions";

interface SuggestionComplaintBoxProps {
  userId?: string;
  selectedStudent?: string;
  studentDetails?: any;
}

// Use the ParentSubmission interface from the hook
type Submission = ParentSubmission;

const SuggestionComplaintBox: React.FC<SuggestionComplaintBoxProps> = ({
  userId,
  selectedStudent,
  studentDetails,
}) => {
  const { t } = useTranslation();
  const { data: children = [] } = useParentChildren();
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [submissionType, setSubmissionType] = useState<
    "suggestion" | "complaint"
  >("suggestion");

  // Debug logging
  useEffect(() => {
    console.log(
      "🔍 SuggestionComplaintBox: userId =",
      userId,
      "selectedStudent =",
      selectedStudent
    );
  }, [userId, selectedStudent]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high",
    recipientId: "",
    recipientType: "TEACHER" as "TEACHER" | "ADMIN",
    studentId: selectedStudent || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Use useRecipients hook instead of local state
  const {
    recipients,
    getRecipientName,
    isLoading: loadingRecipients,
  } = useRecipients(userId, selectedStudent, studentDetails);

  // Fetch real submissions data
  const {
    submissions,
    isLoading: loadingSubmissions,
    refetch: refetchSubmissions,
  } = useParentSubmissions(userId);

  // Debug: Log recipients when they change
  useEffect(() => {
    console.log('🔍 Recipients updated:', {
      teachers: recipients.teachers.length,
      admins: recipients.admins.length,
      loading: loadingRecipients,
      recipientType: formData.recipientType,
    });
  }, [recipients, loadingRecipients, formData.recipientType]);

  // Update studentId when selectedStudent changes
  useEffect(() => {
    if (selectedStudent) {
      setFormData((prev) => ({ ...prev, studentId: selectedStudent }));
    }
  }, [selectedStudent]);

  // Local state for new submissions (will be added to the list after successful submission)
  const [localSubmissions, setLocalSubmissions] = useState<Submission[]>([]);

  const categories = [
    {
      value: "academic",
      label: t("parentPortal.suggestions.categories.academic"),
    },
    {
      value: "technical",
      label: t("parentPortal.suggestions.categories.technical"),
    },
    {
      value: "communication",
      label: t("parentPortal.suggestions.categories.communication"),
    },
    {
      value: "facilities",
      label: t("parentPortal.suggestions.categories.facilities"),
    },
    { value: "safety", label: t("parentPortal.suggestions.categories.safety") },
    { value: "other", label: t("parentPortal.suggestions.categories.other") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.recipientId) {
        console.error("Recipient is required");
        setIsSubmitting(false);
        return;
      }

      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      // First, get the parent record ID from the user ID
      let actualParentId: string | null = null;
      if (userId) {
        try {
          console.log('🔍 Fetching parent record for user ID:', userId);
          const parentResponse = await fetch(
            `${API_CONFIG.BASE_URL}/parents/${userId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (parentResponse.ok) {
            const parentData = await parentResponse.json();
            if (parentData.success && parentData.data?.id) {
              actualParentId = String(parentData.data.id);
              console.log('✅ Found parent ID:', actualParentId);
            } else {
              console.warn('⚠️ Parent data structure unexpected:', parentData);
            }
          } else {
            console.warn('⚠️ Failed to fetch parent record:', parentResponse.status);
          }
        } catch (parentError) {
          console.error('❌ Error fetching parent record:', parentError);
        }
      }

      if (!actualParentId) {
        console.error('❌ Could not find parent ID for user:', userId);
        alert('Failed to find parent information. Please try again.');
        setIsSubmitting(false);
        return;
      }

      console.log('🔍 Submitting suggestion with parentId:', actualParentId);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/suggestion-complaints`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            parentId: actualParentId, // Use the actual parent record ID
            studentId: selectedStudent || formData.studentId || null,
            recipientId: parseInt(formData.recipientId), // Ensure it's a number
            recipientType: formData.recipientType,
            type: submissionType.toUpperCase(),
            title: formData.title,
            description: formData.description,
            category: formData.category || null,
            priority: formData.priority.toUpperCase(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error submitting:", errorData);
        const errorMessage = errorData.message || "Failed to submit. Please try again.";
        alert(errorMessage);
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Add the new submission to local state
        setLocalSubmissions((prev) => [data.data, ...prev]);

        // Reset form
        setFormData({
          title: "",
          description: "",
          category: "",
          priority: "medium",
          recipientId: "",
          recipientType: "TEACHER",
          studentId: "",
        });
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);

        // Refetch submissions to get the latest data
        refetchSubmissions();
      } else {
        console.error("Error submitting:", data.message);
        alert("Failed to submit. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
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

  // Combine API submissions with local submissions
  const allSubmissions = [...localSubmissions, ...submissions];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "RESPONDED":
        return "bg-green-100 text-green-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return t("parentPortal.suggestions.submitted");
      case "UNDER_REVIEW":
        return t("parentPortal.suggestions.underReview");
      case "RESPONDED":
        return t("parentPortal.suggestions.responded");
      case "RESOLVED":
        return t("parentPortal.suggestions.resolved");
      case "CLOSED":
        return t("parentPortal.suggestions.closed");
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return t("parentPortal.suggestions.priorityHigh");
      case "MEDIUM":
        return t("parentPortal.suggestions.priorityMedium");
      case "LOW":
        return t("parentPortal.suggestions.priorityLow");
      default:
        return priority;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "SUGGESTION" ? (
      <HiLightBulb className="w-5 h-5 text-blue-500" />
    ) : (
      <HiExclamationTriangle className="w-5 h-5 text-red-500" />
    );
  };

  const getTypeText = (type: string) => {
    return type === "SUGGESTION"
      ? t("parentPortal.suggestions.suggestion")
      : t("parentPortal.suggestions.complaint");
  };

  // Split submissions into pending and responded
  const pendingSubmissions = useMemo(() => {
    return allSubmissions.filter(
      (sub) =>
        sub.status === "PENDING" || sub.status === "IN_REVIEW" || !sub.response
    );
  }, [allSubmissions]);

  const respondedSubmissions = useMemo(() => {
    return allSubmissions.filter(
      (sub) =>
        sub.status === "RESOLVED" || sub.status === "CLOSED" || sub.response
    );
  }, [allSubmissions]);

  return (
    <div className="max-w-7xl mx-auto p-1 sm:p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <HiChatBubbleLeftRight className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("parentPortal.suggestions.title")}
          </h1>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">
          {t("parentPortal.suggestions.subtitle")}
        </p>
      </div>

      {/* Main Grid Layout: Left (Form) and Right (History) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-1 sm:gap-6">
        {/* LEFT SIDE - New Submission Form (2 columns) */}
        <div className="lg:col-span-2">
          <div className="sticky top-6" style={{ zIndex: 1 }}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6" style={{ overflow: 'visible' }}>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <HiPaperAirplane className="w-5 h-5 text-blue-500" />
                  {t("parentPortal.suggestions.newSubmission")}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t("parentPortal.suggestions.fillFormBelow")}
                </p>
              </div>

              {/* Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t("parentPortal.suggestions.messageType")}
                </label>
                <div className="flex flex-row flex-wrap items-center justify-start gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmissionType("suggestion")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      submissionType === "suggestion"
                        ? " bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <HiLightBulb
                        className={`w-5 h-5 ${
                          submissionType === "suggestion"
                            ? "text-blue-500"
                            : "text-gray-400"
                        }`}
                      />
                      <div className="text-left">
                        <div className="font-medium">
                          {t("parentPortal.suggestions.suggestion")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t("parentPortal.suggestions.suggestionDescription")}
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionType("complaint")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      submissionType === "complaint"
                        ? " bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <HiExclamationTriangle
                        className={`w-5 h-5 ${
                          submissionType === "complaint"
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      />
                      <div className="text-left">
                        <div className="font-medium">
                          {t("parentPortal.suggestions.complaint")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t("parentPortal.suggestions.complaintDescription")}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Success Message */}
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <HiCheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">
                    {t("parentPortal.suggestions.successMessage")}
                  </span>
                </div>
              )}

              {/* Student Info Display */}
              {/* {selectedStudent && children.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <HiAcademicCap className="w-5 h-5 text-blue-500" />
                  <div>
                    <span className="text-sm font-medium text-blue-900">
                      {t('parentPortal.suggestions.submittingFor')}:
                    </span>
                    <span className="ml-2 text-blue-700">
                      {(() => {
                        const student = children.find(child => child.id === selectedStudent);
                        return student ? `${student.firstName} ${student.lastName} - ${student.grade}` : 'Unknown Student';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )} */}

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-2 sm:space-y-5 text-black"
              >
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    {t("parentPortal.suggestions.titleLabel")} *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder={t("parentPortal.suggestions.titlePlaceholder")}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("parentPortal.suggestions.descriptionLabel")} *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    placeholder={t(
                      "parentPortal.suggestions.descriptionPlaceholder"
                    )}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4" style={{ position: 'relative', zIndex: 10 }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("parentPortal.suggestions.category")}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">
                        {t("parentPortal.suggestions.selectCategory")}
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("parentPortal.suggestions.priority")}
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: e.target.value as "low" | "medium" | "high",
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="low">
                        {t("parentPortal.suggestions.priorityLow")}
                      </option>
                      <option value="medium">
                        {t("parentPortal.suggestions.priorityMedium")}
                      </option>
                      <option value="high">
                        {t("parentPortal.suggestions.priorityHigh")}
                      </option>
                    </select>
                  </div>

                  {/* Recipient Selection */}
                  <div className="relative z-10">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("parentPortal.suggestions.recipientType")} *
                    </label>
                    <select
                      value={formData.recipientType}
                      onChange={(e) => {
                        console.log('🔍 Recipient type changed to:', e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          recipientType: e.target.value as "TEACHER" | "ADMIN",
                          recipientId: "", // Reset recipient when type changes
                        }));
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer appearance-none bg-white"
                      required
                    >
                      <option value="TEACHER">
                        {t("parentPortal.suggestions.teacher")}
                      </option>
                      <option value="ADMIN">
                        {t("parentPortal.suggestions.admin")}
                      </option>
                    </select>
                  </div>

                  <div className="relative z-20">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("parentPortal.suggestions.selectRecipient")} *
                    </label>
                    <select
                      value={formData.recipientId}
                      onClick={(e) => {
                        console.log('🔍 Select recipient clicked', e);
                        e.stopPropagation();
                      }}
                      onChange={(e) => {
                        console.log('🔍 Recipient selected:', e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          recipientId: e.target.value,
                        }));
                      }}
                      onFocus={(e) => {
                        console.log('🔍 Select recipient dropdown focused');
                        e.target.style.zIndex = '9999';
                        e.stopPropagation();
                      }}
                      onBlur={(e) => {
                        e.target.style.zIndex = '20';
                      }}
                      onMouseDown={(e) => {
                        console.log('🔍 Select recipient mousedown');
                        e.stopPropagation();
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer appearance-none bg-white relative"
                      required
                      disabled={loadingRecipients || (formData.recipientType === "TEACHER" ? recipients.teachers.length === 0 : recipients.admins.length === 0)}
                      style={{ pointerEvents: loadingRecipients || (formData.recipientType === "TEACHER" ? recipients.teachers.length === 0 : recipients.admins.length === 0) ? 'none' : 'auto' }}
                    >
                      <option value="">
                        {loadingRecipients
                          ? t("parentPortal.suggestions.loading")
                          : (formData.recipientType === "TEACHER" 
                              ? (recipients.teachers.length === 0 
                                  ? t("parentPortal.suggestions.noTeachers") 
                                  : t("parentPortal.suggestions.selectRecipient"))
                              : (recipients.admins.length === 0 
                                  ? t("parentPortal.suggestions.noAdmins") 
                                  : t("parentPortal.suggestions.selectRecipient")))}
                      </option>
                      {(() => {
                        // Debug: Log what we're showing
                        const recipientList = formData.recipientType === "TEACHER" 
                          ? recipients.teachers 
                          : recipients.admins;
                        console.log('🔍 Rendering recipients for type:', formData.recipientType, 'List:', recipientList);
                        return recipientList.map((recipient) => (
                          <option key={recipient.id} value={String(recipient.id)}>
                            {recipient.name}
                          </option>
                        ));
                      })()}
                    </select>
                    {!loadingRecipients && formData.recipientType === "TEACHER" && recipients.teachers.length === 0 && (
                      <p className="mt-1 text-sm text-amber-600">
                        {t("parentPortal.suggestions.noTeachersAvailable")}
                      </p>
                    )}
                    {!loadingRecipients && formData.recipientType === "ADMIN" && recipients.admins.length === 0 && (
                      <p className="mt-1 text-sm text-amber-600">
                        {t("parentPortal.suggestions.noAdminsAvailable")}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("parentPortal.suggestions.sending")}
                    </>
                  ) : (
                    <>
                      <HiPaperAirplane className="w-4 h-4" />
                      {t("parentPortal.suggestions.sendMessage")}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - History (3 columns) */}
        <div className="lg:col-span-3 space-y-1 sm:space-y-6">
          {/* TOP - Pending/Submitted Forms */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {t("parentPortal.suggestions.pendingSubmissions")}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {t("parentPortal.suggestions.awaitingResponse")}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 text-yellow-500 rounded-full text-lg font-bold">
                  {pendingSubmissions.length}
                </span>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-3">
              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">
                    {t("parentPortal.suggestions.loading")}
                  </span>
                </div>
              ) : pendingSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <HiChatBubbleLeftRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("parentPortal.suggestions.noPendingMessages")}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {t("parentPortal.suggestions.noPendingDescription")}
                  </p>
                </div>
              ) : (
                pendingSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className=" rounded-lg border-2 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(submission.type)}
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {submission.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <HiClock className="w-3 h-3" />
                            {new Date(submission.createdAt).toLocaleDateString(
                              "fa-IR"
                            )}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-medium ${getPriorityColor(
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
                      <div className="mt-3 pt-3 border-t ">
                        <p className="text-sm text-gray-700 mb-2">
                          {submission.description}
                        </p>
                        <div className="text-xs text-gray-600">
                          <strong>
                            {t("parentPortal.suggestions.recipient")}:
                          </strong>{" "}
                          {submission.recipientId && submission.recipientType
                            ? getRecipientName(
                                submission.recipientId,
                                submission.recipientType
                              )
                            : submission.recipient?.displayName ||
                              `${submission.recipient?.firstName} ${submission.recipient?.lastName}` ||
                              "N/A"}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BOTTOM - Responded Forms */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {t("parentPortal.suggestions.respondedSubmissions")}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {t("parentPortal.suggestions.receivedResponses")}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1  text-green-500 rounded-full text-lg font-bold">
                  {respondedSubmissions.length}
                </span>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-3">
              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">
                    {t("parentPortal.suggestions.loading")}
                  </span>
                </div>
              ) : respondedSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <HiCheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("parentPortal.suggestions.noRespondedMessages")}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {t("parentPortal.suggestions.noRespondedDescription")}
                  </p>
                </div>
              ) : (
                respondedSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-lg border-2  p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(submission.type)}
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {submission.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <HiClock className="w-3 h-3" />
                            {new Date(submission.createdAt).toLocaleDateString(
                              "fa-IR"
                            )}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(
                              submission.status
                            )}`}
                          >
                            {getStatusText(submission.status)}
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
                      <div className="space-y-3 mt-3 pt-3 border-t ">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-1">
                            {t("parentPortal.suggestions.yourMessage")}:
                          </h4>
                          <p className="text-sm text-gray-700">
                            {submission.description}
                          </p>
                        </div>

                        {submission.response && (
                          <div className="bg-white border-2  rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1">
                              <HiCheckCircle className="w-4 h-4" />
                              {t("parentPortal.suggestions.schoolResponse")}:
                            </h4>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {submission.response}
                            </p>
                            {submission.respondedAt && (
                              <div className="mt-2 text-xs text-green-700 font-medium">
                                {t("parentPortal.suggestions.respondedOn")}:{" "}
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionComplaintBox;
