import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaBook,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaUsers,
  FaSchool,
} from "react-icons/fa";
import axios from "axios";
import { API_BASE_URL } from "../../../constants/api";
import ScheduleConfigModal from "./ScheduleConfigModal";

interface ScheduleStats {
  totalSlots: number;
  totalDays: number;
  totalPeriods: number;
  totalAssignments: number;
  uniqueTeachers: number;
  uniqueClasses: number;
  uniqueSubjects: number;
  slotsPerDay: Record<string, number>;
  slotsPerTeacher: Record<string, number>;
  slotsPerClass: Record<string, number>;
  slotsPerSubject: Record<string, number>;
}

interface GenerateScheduleResponse {
  success: boolean;
  message: string;
  statistics: ScheduleStats;
  scheduleSlots: Record<string, Record<string, any[]>>;
  totalSlots: number;
  validation: {
    isValid: boolean;
    conflicts: any[];
    totalSlots: number;
    validationDate: string;
  };
}

const ScheduleManagement: React.FC = () => {
  const { t } = useTranslation();
  const [generatedSchedule, setGeneratedSchedule] =
    useState<GenerateScheduleResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Saturday");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [viewMode, setViewMode] = useState<"teacher" | "class" | "all">(
    "teacher"
  );
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const days = [
    "Saturday",
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
  ];

  // Generate schedule mutation
  const generateScheduleMutation = useMutation({
    mutationFn: async (config?: any) => {
      // Try multiple token keys (userToken is the primary one)
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // For SUPER_ADMIN, get schoolId from user
      const schoolId = user.schoolId || (user.schoolIds && user.schoolIds[0]);

      console.log(
        "🔐 Sending request with token:",
        token.substring(0, 20) + "..."
      );
      console.log("🏫 School ID:", schoolId);
      console.log("📋 Schedule Config:", config);

      const response = await axios.post(
        `${API_BASE_URL}/schedules/generate`,
        {
          schoolId,
          options: config, // Send the configuration
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedSchedule(data.data);
      setIsConfigModalOpen(false);
    },
  });

  // Get existing schedule
  const { data: existingSchedule, refetch: refetchSchedule } = useQuery({
    queryKey: ["school-schedule"],
    queryFn: async () => {
      // Try multiple token keys (userToken is the primary one)
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // For SUPER_ADMIN, get schoolId from user
      const schoolId = user.schoolId || (user.schoolIds && user.schoolIds[0]);

      const response = await axios.get(`${API_BASE_URL}/schedules/school`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {
          schoolId, // Send schoolId as query parameter
        },
      });
      return response.data;
    },
    enabled: false,
  });

  const handleGenerateSchedule = () => {
    setIsConfigModalOpen(true);
  };

  const handleConfigGenerate = (config: any) => {
    generateScheduleMutation.mutate(config);
  };

  const handleViewExistingSchedule = () => {
    refetchSchedule();
  };

  const renderStatistics = (stats: ScheduleStats) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                {t("timetable.stats.totalSlots")}
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {stats.totalSlots}
              </p>
            </div>
            <FaCalendarAlt className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">
                {t("timetable.stats.teachers")}
              </p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {stats.uniqueTeachers}
              </p>
            </div>
            <FaChalkboardTeacher className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">
                {t("timetable.stats.classes")}
              </p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {stats.uniqueClasses}
              </p>
            </div>
            <FaSchool className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">
                {t("timetable.stats.subjects")}
              </p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {stats.uniqueSubjects}
              </p>
            </div>
            <FaBook className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>
    );
  };

  const renderTeacherScheduleTable = (scheduleData: any) => {
    const periods = [1, 2, 3, 4, 5, 6];

    // Group schedule by teacher
    const scheduleByTeacher: Record<string, any> = {};

    if (
      scheduleData?.scheduleSlots &&
      typeof scheduleData.scheduleSlots === "object"
    ) {
      // Convert the scheduleSlots to array format
      Object.entries(scheduleData.scheduleSlots).forEach(
        ([day, daySchedule]) => {
          Object.entries(daySchedule as any).forEach(
            ([period, slots]: [string, any]) => {
              (slots as any[]).forEach((slot: any) => {
                const teacherName = slot.teacher;
                if (!scheduleByTeacher[teacherName]) {
                  scheduleByTeacher[teacherName] = {};
                  days.forEach((d) => {
                    scheduleByTeacher[teacherName][d] = {};
                    periods.forEach((p) => {
                      scheduleByTeacher[teacherName][d][p] = null;
                    });
                  });
                }

                const periodNum = parseInt(period.replace("Period ", ""));
                scheduleByTeacher[teacherName][day][periodNum] = slot;
              });
            }
          );
        }
      );
    }

    const teacherNames = Object.keys(scheduleByTeacher);

    if (teacherNames.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          No teachers found in schedule
        </div>
      );
    }

    // Set default selected teacher if not set
    if (!selectedTeacher && teacherNames.length > 0) {
      setSelectedTeacher(teacherNames[0]);
    }

    const currentTeacherSchedule = scheduleByTeacher[selectedTeacher] || {};

    return (
      <div className="space-y-2 sm:space-y-6">
        {/* Teacher Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Teacher
          </label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {teacherNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Teacher Schedule Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FaChalkboardTeacher className="w-5 h-5" />
              {selectedTeacher}'s Weekly Schedule
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[100px]">
                    Period
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[180px]"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {periods.map((period) => (
                  <tr key={period} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                      <div className="flex flex-col">
                        <span className="font-semibold">Period {period}</span>
                        <span className="text-xs text-gray-500">
                          {period === 1 && "08:00-09:00"}
                          {period === 2 && "09:00-10:00"}
                          {period === 3 && "10:00-11:00"}
                          {period === 4 && "11:00-12:00"}
                          {period === 5 && "12:00-13:00"}
                          {period === 6 && "13:00-14:00"}
                        </span>
                      </div>
                    </td>
                    {days.map((day) => {
                      const slot = currentTeacherSchedule[day]?.[period];

                      if (!slot) {
                        return (
                          <td key={day} className="px-4 py-4 text-center">
                            <div className="text-sm text-gray-400 italic">
                              Free
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={day} className="px-4 py-4">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                            <div className="font-semibold text-blue-900 text-sm mb-1">
                              {slot.subject}
                            </div>
                            <div className="text-xs text-gray-700 flex items-center gap-1 mb-1">
                              <FaUsers className="w-3 h-3 text-green-600" />
                              <span>{slot.class}</span>
                            </div>
                            {slot.room && slot.room !== "N/A" && (
                              <div className="text-xs text-gray-600">
                                Room: {slot.room}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleTable = (
    schedule: Record<string, Record<string, any[]>>
  ) => {
    const periods = [
      t("timetable.periods.period1"),
      t("timetable.periods.period2"),
      t("timetable.periods.period3"),
      t("timetable.periods.period4"),
      t("timetable.periods.period5"),
      t("timetable.periods.period6"),
    ];

    return (
      <div className="space-y-6">
        {/* Day Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                selectedDay === day
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Schedule Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    {t("timetable.table.period")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    {t("timetable.table.time")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    {t("timetable.table.teacher")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    {t("timetable.table.class")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    {t("timetable.table.subject")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    {t("timetable.table.room")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {periods.map((period) => {
                  const slots = schedule[selectedDay]?.[period] || [];

                  if (slots.length === 0) {
                    return (
                      <tr key={period} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {period}
                        </td>
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-sm text-gray-500 italic"
                        >
                          {t("timetable.table.noClassesScheduled")}
                        </td>
                      </tr>
                    );
                  }

                  return slots.map((slot, index) => (
                    <tr key={`${period}-${index}`} className="hover:bg-gray-50">
                      {index === 0 && (
                        <td
                          rowSpan={slots.length}
                          className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50"
                        >
                          {period}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FaClock className="w-3 h-3 text-gray-400" />
                          <span>{slot.time}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FaChalkboardTeacher className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{slot.teacher}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FaUsers className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{slot.class}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FaBook className="w-4 h-4 text-purple-600" />
                          <span>{slot.subject}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {slot.room}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ScheduleConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onGenerate={handleConfigGenerate}
        isGenerating={generateScheduleMutation.isPending}
      />

      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t("schedule.title")}
              </h2>
              <p className="text-gray-600 mt-1">{t("schedule.description")}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleViewExistingSchedule}
                disabled={generateScheduleMutation.isPending}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCalendarAlt className="w-4 h-4" />
                <span>{t("schedule.viewCurrent")}</span>
              </button>
              <button
                onClick={handleGenerateSchedule}
                disabled={generateScheduleMutation.isPending}
                className="hidden sm:flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generateScheduleMutation.isPending ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>{t("schedule.generating")}</span>
                  </>
                ) : (
                  <>
                    <FaCalendarAlt className="w-4 h-4" />
                    <span>{t("schedule.generateSchedule")}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaCalendarAlt className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900">
                  {t("schedule.configuration.title")}
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>
                    • <strong>{t("schedule.configuration.days.label")}</strong>{" "}
                    {t("schedule.configuration.days.value")}
                  </li>
                  <li>
                    •{" "}
                    <strong>{t("schedule.configuration.periods.label")}</strong>{" "}
                    {t("schedule.configuration.periods.value")}
                  </li>
                  <li>
                    •{" "}
                    <strong>
                      {t("schedule.configuration.duration.label")}
                    </strong>{" "}
                    {t("schedule.configuration.duration.value")}
                  </li>
                  <li>
                    •{" "}
                    <strong>
                      {t("schedule.configuration.variation.label")}
                    </strong>{" "}
                    {t("schedule.configuration.variation.value")}
                  </li>
                  <li>
                    •{" "}
                    <strong>
                      {t("schedule.configuration.conflictFree.label")}
                    </strong>{" "}
                    {t("schedule.configuration.conflictFree.value")}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Generation Status */}
        {generateScheduleMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">
                  {t("schedule.generationFailed")}
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {(generateScheduleMutation.error as any)?.response?.data
                    ?.message || t("schedule.generationFailedMessage")}
                </p>
              </div>
            </div>
          </div>
        )}

        {generateScheduleMutation.isSuccess && generatedSchedule && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900">
                  {t("schedule.generationSuccess")}
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  {generatedSchedule.message} - {generatedSchedule.totalSlots}{" "}
                  {t("schedule.totalSlotsCreated")}
                </p>
                {generatedSchedule.validation.conflicts.length > 0 && (
                  <p className="text-sm text-orange-700 mt-1">
                    ⚠️ {t("schedule.warning")}{" "}
                    {generatedSchedule.validation.conflicts.length}{" "}
                    {t("schedule.conflictsDetected")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {generatedSchedule?.statistics &&
          renderStatistics(generatedSchedule.statistics)}

        {/* Schedule Display */}
        {generatedSchedule?.scheduleSlots && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {t("schedule.weeklyScheduleTeacherView")}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("teacher")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === "teacher"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t("schedule.teacherView")}
                </button>
                <button
                  onClick={() => setViewMode("class")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === "class"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t("schedule.classView")}
                </button>
              </div>
            </div>
            {viewMode === "teacher" &&
              renderTeacherScheduleTable(generatedSchedule)}
            {viewMode === "class" &&
              renderScheduleTable(generatedSchedule.scheduleSlots)}
          </div>
        )}

        {/* Existing Schedule */}
        {existingSchedule?.data?.schedule && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {t("schedule.currentActiveSchedule")}
            </h3>
            {renderScheduleTable(existingSchedule.data.schedule)}
            <div className="mt-4 text-sm text-gray-600">
              <p>
                {t("schedule.totalClasses")}:{" "}
                {existingSchedule.data.statistics.totalClasses}
              </p>
              <p>
                {t("schedule.totalTeachers")}:{" "}
                {existingSchedule.data.statistics.totalTeachers}
              </p>
              <p>
                {t("schedule.totalSubjects")}:{" "}
                {existingSchedule.data.statistics.totalSubjects}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!generatedSchedule &&
          !existingSchedule &&
          !generateScheduleMutation.isPending && (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <FaCalendarAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("schedule.noScheduleYet")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("schedule.noScheduleMessage")}
              </p>
            </div>
          )}
      </div>
    </>
  );
};

export default ScheduleManagement;
