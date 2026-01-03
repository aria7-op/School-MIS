import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import api from "../../../services/secureApiService";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  metadata: any;
  actions: any[];
  sender?: {
    firstName: string;
    lastName: string;
  };
}

interface TeacherNotificationsProps {
  onClose: () => void;
}

const TeacherNotifications: React.FC<TeacherNotificationsProps> = ({
  onClose,
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "assignment" | "parent">("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications", {
        params: {
          limit: 50,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      });

      if (response.success) {
        // Parse actions field if it's a string
        const notifications = Array.isArray(response.data)
          ? response.data.map((notification: any) => {
              let actions = [];
              let metadata = {};

              try {
                actions =
                  typeof notification.actions === "string"
                    ? JSON.parse(notification.actions)
                    : notification.actions || [];
              } catch (e) {
                console.warn("Error parsing actions:", e);
                actions = [];
              }

              try {
                metadata =
                  typeof notification.metadata === "string"
                    ? JSON.parse(notification.metadata)
                    : notification.metadata || {};
              } catch (e) {
                console.warn("Error parsing metadata:", e);
                metadata = {};
              }

              return {
                ...notification,
                actions,
                metadata,
              };
            })
          : [];
        setNotifications(notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, status: "READ" } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleAction = (action: any, notification: Notification) => {
    if (action.action === "view_assignment") {
      // Navigate to assignment details
      window.open(action.url, "_blank");
    } else if (action.action === "view_parent") {
      // Navigate to parent details
      window.open(action.url, "_blank");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ASSIGNMENT_PARENT_VIEW":
        return "visibility";
      case "ASSIGNMENT_PARENT_ACKNOWLEDGMENT":
        return "check_circle";
      case "ASSIGNMENT_PARENT_NOTES":
        return "note_add";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "ASSIGNMENT_PARENT_VIEW":
        return "text-blue-600 bg-blue-50";
      case "ASSIGNMENT_PARENT_ACKNOWLEDGMENT":
        return "text-green-600 bg-green-50";
      case "ASSIGNMENT_PARENT_NOTES":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getNotificationContent = (notification: Notification) => {
    // Translate notification titles and messages based on type
    switch (notification.type) {
      case "STUDENT_UPDATED":
        return {
          title: t("teacherPortal.notifications.studentUpdated"),
          message: t("teacherPortal.notifications.studentUpdatedMessage"),
        };
      case "NEW_ASSIGNMENT":
      case "ASSIGNMENT_CREATED":
        return {
          title: t("teacherPortal.notifications.newAssignmentNotification"),
          message: t("teacherPortal.notifications.newAssignmentMessage"),
        };
      default:
        return {
          title: notification.title,
          message: notification.message,
        };
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "assignment") {
      return notification.type.includes("ASSIGNMENT");
    } else if (filter === "parent") {
      return notification.type.includes("PARENT");
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t("teacherPortal.notifications.title")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t("teacherPortal.notifications.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="material-icons text-2xl">close</span>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("teacherPortal.notifications.allNotifications")}
            </button>
            <button
              onClick={() => setFilter("assignment")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "assignment"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("teacherPortal.notifications.assignmentRelated")}
            </button>
            <button
              onClick={() => setFilter("parent")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "parent"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("teacherPortal.notifications.parentInteractions")}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">
                {t("teacherPortal.notifications.loading")}
              </span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-icons text-6xl text-gray-300 mb-4">
                notifications_none
              </span>
              <p className="text-gray-500 text-lg">
                {t("teacherPortal.notifications.noNotifications")}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {filter === "all"
                  ? t("teacherPortal.notifications.youAreAllCaughtUp")
                  : t(
                      "teacherPortal.notifications.noFilterNotificationsAvailable"
                    )}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const content = getNotificationContent(notification);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      notification.status === "READ"
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-blue-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`p-2 rounded-full ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        <span className="material-icons text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {content.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {content.message}
                            </p>

                            {/* Metadata */}
                            {notification.metadata && (
                              <div className="text-xs text-gray-500 mb-2">
                                {notification.metadata.assignmentTitle && (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="material-icons text-xs">
                                      assignment
                                    </span>
                                    {t(
                                      "teacherPortal.notifications.attachment"
                                    )}
                                    : {notification.metadata.assignmentTitle}
                                  </span>
                                )}
                                {notification.metadata.parentName && (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="material-icons text-xs">
                                      person
                                    </span>
                                    {notification.metadata.parentName}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Actions */}
                            {notification.actions &&
                              Array.isArray(notification.actions) &&
                              notification.actions.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {notification.actions.map((action, index) => (
                                    <button
                                      key={index}
                                      onClick={() =>
                                        handleAction(action, notification)
                                      }
                                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                                    >
                                      {action.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>

                          {/* Status and Time */}
                          <div className="flex flex-col items-end gap-2">
                            {notification.status === "PENDING" && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {t("teacherPortal.notifications.markAsRead")}
                              </button>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredNotifications.length}{" "}
              {t("teacherPortal.notifications.notificationCount")}
            </p>
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t("teacherPortal.notifications.refresh")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherNotifications;
