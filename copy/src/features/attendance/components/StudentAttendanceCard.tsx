import React from "react";
import { useTranslation } from "react-i18next";
import {
  FaUser,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaFileAlt,
} from "react-icons/fa";
import secureApiService from "../../../services/secureApiService";
import SMSStatusIndicator from "../../../components/attendance/SMSStatusIndicator";

interface StudentAttendanceCardProps {
  student: {
    id: string | number;
    user?: {
      firstName?: string;
      lastName?: string;
      dariName?: string;
      username?: string;
      email?: string;
      phone?: string;
    };
    rollNo?: string;
    admissionNo?: string;
    userId?: string | number;
  };
  attendance?: {
    id?: string | number;
    status?: string;
    inTime?: string | null;
    outTime?: string | null;
    remarks?: string | null;
    leaveDocumentPath?: string | null;
    // SMS Status fields
    smsInStatus?: string;
    smsInError?: string;
    smsInSentAt?: string;
    smsInAttempts?: number;
    smsInRequestId?: string;
    smsOutStatus?: string;
    smsOutError?: string;
    smsOutSentAt?: string;
    smsOutAttempts?: number;
    smsOutRequestId?: string;
  };
  onMarkInTime?: (studentId: string) => void;
  onMarkOutTime?: (studentId: string) => void;
  isMarkingIn?: boolean;
  isMarkingOut?: boolean;
  className?: string;
}

const StudentAttendanceCard: React.FC<StudentAttendanceCardProps> = ({
  student,
  attendance,
  onMarkInTime,
  onMarkOutTime,
  isMarkingIn = false,
  isMarkingOut = false,
  className = "",
}) => {
  const { t, i18n } = useTranslation();
  
  // Get student name based on selected language
  const getStudentName = () => {
    if (!student.user) {
      return `Student ${student.id}`;
    }
    
    // Check if current language is Dari (fa-AF) or Pashto (ps-AF)
    const isDariOrPashto = i18n.language === "fa-AF" || i18n.language === "ps-AF";
    
    // If Dari or Pashto and dariName exists, use it; otherwise use firstName + lastName
    if (isDariOrPashto && student.user.dariName) {
      return student.user.dariName.trim();
    }
    
    return `${student.user.firstName || ""} ${student.user.lastName || ""}`.trim();
  };
  
  const studentName = getStudentName();

  // Get initials for avatar
  const initials = studentName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Format time strings
  const formatTime = (timeString: string | null) => {
    if (!timeString) return t("attendance.studentCard.notMarked");
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PRESENT":
        return {
          color: "text-green-600 bg-green-100 border-green-200",
          icon: FaCheckCircle,
          bgColor: "bg-green-50",
          textColor: "text-green-700",
        };
      case "LATE":
        return {
          color: "text-yellow-600 bg-yellow-100 border-yellow-200",
          icon: FaExclamationTriangle,
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-700",
        };
      case "ABSENT":
        return {
          color: "text-red-600 bg-red-100 border-red-200",
          icon: FaTimesCircle,
          bgColor: "bg-red-50",
          textColor: "text-red-700",
        };
      case "EXCUSED":
        return {
          color: "text-blue-600 bg-blue-100 border-blue-200",
          icon: FaFileAlt,
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
        };
      default:
        return {
          color: "text-gray-600 bg-gray-100 border-gray-200",
          icon: FaClock,
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
        };
    }
  };

  const statusInfo = getStatusInfo(attendance?.status || "ABSENT");
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-purple-200 ${className}`}
    >
      {/* Card Header */}
      <div
        className={`p-4 rounded-t-xl ${statusInfo.bgColor} border-b border-gray-100`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {initials}
                </span>
              </div>
              {/* Status indicator dot */}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  statusInfo.color.split(" ")[1]
                }`}
              ></div>
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {studentName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  {t("attendance.studentCard.roll")}:{" "}
                  {student.rollNo || t("common.na")}
                </span>
                <span>•</span>
                <span>
                  {t("attendance.studentCard.admission")}:{" "}
                  {student.admissionNo || t("common.na")}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color} max-w-20 gap-1 flex-shrink-0`}
          >
            <StatusIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {attendance?.status === "ABSENT"
                ? t("attendance.studentCard.status.absent")
                : t("attendance.studentCard.status.present")}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {student.user?.email && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs">@</span>
              </div>
              <span className="truncate">{student.user.email}</span>
            </div>
          )}
          {student.user?.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs">📞</span>
              </div>
              <span>{student.user.phone}</span>
            </div>
          )}
          {student.user?.username && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
              <span>@{student.user.username}</span>
            </div>
          )}
        </div>

        {/* Time Information or Leave Info */}
        {attendance?.status === "EXCUSED" ? (
          <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
            <div className="flex items-start gap-2">
              <FaFileAlt className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-900 mb-1">
                  {t("attendance.studentCard.status.excused")} (Leave)
                </div>
                {attendance.remarks && (
                  <div className="text-xs text-blue-700 mb-2">
                    <span className="font-medium">{t("common.reason")}:</span>{" "}
                    {attendance.remarks}
                  </div>
                )}
                {attendance.leaveDocumentPath && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await secureApiService.api.get(
                          `/attendances/${attendance.id}/leave-document`,
                          { responseType: "blob" }
                        );

                        const blobUrl = URL.createObjectURL(response.data);
                        window.open(blobUrl, "_blank");
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                      } catch (error) {
                        console.error("Error opening document:", error);
                        alert("Failed to open document");
                      }
                    }}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                    >
                     <FaFileAlt className="w-3 h-3" />
                     {t("attendance.studentCard.viewLeaveDocument")}
                    </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                  {t("attendance.studentCard.checkIn")}
                </div>
                <div
                  className={`text-sm font-semibold ${
                    attendance?.inTime ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {formatTime(attendance?.inTime)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                  {t("attendance.studentCard.checkOut")}
                </div>
                <div
                  className={`text-sm font-semibold ${
                    attendance?.outTime ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  {formatTime(attendance?.outTime)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Show buttons only if not EXCUSED */}
          {attendance?.status !== "EXCUSED" && (
            <>
              {!attendance?.inTime && onMarkInTime && (
                <button
                  onClick={() => onMarkInTime(student.id.toString())}
                  disabled={isMarkingIn}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg font-medium text-xs hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow-md"
                >
                  <FaCheckCircle className="w-3 h-3" />
                  <span className="truncate">
                    {isMarkingIn
                      ? t("attendance.studentCard.marking")
                      : t("attendance.studentCard.markIn")}
                  </span>
                </button>
              )}

              {!attendance?.outTime && attendance?.inTime && onMarkOutTime && (
                <button
                  onClick={() => onMarkOutTime(student.id.toString())}
                  disabled={isMarkingOut}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg font-medium text-xs hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow-md"
                >
                  <FaTimesCircle className="w-3 h-3" />
                  <span className="truncate">
                    {isMarkingOut
                      ? t("attendance.studentCard.marking")
                      : t("attendance.studentCard.markOut")}
                  </span>
                </button>
              )}

              {attendance?.inTime && attendance?.outTime && (
                <div className="flex-1 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-medium text-xs text-center flex items-center justify-center gap-1">
                  <FaClock className="w-3 h-3" />
                  <span className="truncate">
                    {t("attendance.studentCard.complete")}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Show EXCUSED badge if on leave */}
          {attendance?.status === "EXCUSED" &&
            !attendance?.leaveDocumentPath && (
              <div className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium text-xs text-center flex items-center justify-center gap-1">
                <FaFileAlt className="w-3 h-3" />
                <span className="truncate">{t("attendance.studentCard.onLeave")}</span>
              </div>
            )}
        </div>
      </div>

      {/* SMS Status Section */}
      {attendance?.id && (attendance?.inTime || attendance?.outTime) && (
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-600 mb-2">
          {t("attendance.studentCard.smsNotifications")}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {attendance?.inTime && (
              <SMSStatusIndicator
                attendanceId={Number(attendance.id)}
                smsType="in"
                status={(attendance as any).smsInStatus || "PENDING"}
                error={(attendance as any).smsInError}
                sentAt={(attendance as any).smsInSentAt}
                attempts={(attendance as any).smsInAttempts || 0}
                onResendSuccess={() => {
                  window.location.reload();
                }}
              />
            )}
            {attendance?.outTime && (
              <SMSStatusIndicator
                attendanceId={Number(attendance.id)}
                smsType="out"
                status={(attendance as any).smsOutStatus || "PENDING"}
                error={(attendance as any).smsOutError}
                sentAt={(attendance as any).smsOutSentAt}
                attempts={(attendance as any).smsOutAttempts || 0}
                onResendSuccess={() => {
                  window.location.reload();
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Card Footer */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="truncate">
            {t("attendance.studentCard.userId")}: {student.userId || student.id}
          </span>
          <span className="flex items-center gap-2 min-w-0">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                statusInfo.color.split(" ")[1]
              }`}
            ></div>
            <span className="truncate max-w-20">
              {attendance?.status || t("attendance.studentCard.notMarked")}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceCard;
