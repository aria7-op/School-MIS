import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FaTimes,
  FaCheckCircle,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaBook,
  FaSchool,
} from "react-icons/fa";
import axios from "axios";
import { API_BASE_URL } from "../../../constants/api";

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface ClassInfo {
  id: number;
  name: string;
  code?: string;
  level: number;
  section: string;
}

interface SubjectConfig {
  subjectId: number;
  subjectName: string;
  included: boolean;
  frequency: number;
}

interface ClassConfig {
  classId: number;
  className: string;
  classCode?: string;
  level: number;
  included: boolean;
  subjectsPerDay?: number;
  subjects: SubjectConfig[];
}

interface ClassCategory {
  name: string;
  range: string;
  levels: number[];
  expanded: boolean;
}

interface ScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: any) => void;
  isGenerating: boolean;
}

const ScheduleConfigModal: React.FC<ScheduleConfigModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}) => {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classConfigs, setClassConfigs] = useState<ClassConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Step-by-step mode
  const [stepMode, setStepMode] = useState<boolean>(true);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const DRAFT_KEY = "scheduleConfigDraft";
  const [loadedFromDraft, setLoadedFromDraft] = useState<boolean>(false);

  // Class categories
  const [categories, setCategories] = useState<ClassCategory[]>([
    {
      name: "Primary Level",
      range: "Classes 1-3",
      levels: [1, 2, 3],
      expanded: true,
    },
    {
      name: "Elementary Level",
      range: "Classes 4-6",
      levels: [4, 5, 6],
      expanded: true,
    },
    {
      name: "Middle Level",
      range: "Classes 7-9",
      levels: [7, 8, 9],
      expanded: true,
    },
    {
      name: "Secondary Level",
      range: "Classes 10-12",
      levels: [10, 11, 12],
      expanded: true,
    },
  ]);

  // Helper function to fetch all pages of data
  const fetchAllPages = async (url: string, config: any) => {
    let allData: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(url, {
        ...config,
        params: {
          ...config.params,
          page,
          limit: 100,
        },
      });

      const data = response.data.data || [];
      allData = [...allData, ...data];

      // Check if there are more pages
      const pagination = response.data.pagination;
      if (pagination && pagination.currentPage < pagination.totalPages) {
        page++;
      } else {
        hasMore = false;
      }
    }

    return allData;
  };

  // Fetch classes and subjects when modal opens (but prefer draft)
  useEffect(() => {
    if (isOpen) {
      let usedDraft = false;
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          if (
            Array.isArray(draft?.classConfigs) &&
            draft.classConfigs.length > 0
          ) {
            setClassConfigs(draft.classConfigs as ClassConfig[]);
            if (typeof draft?.stepMode === "boolean")
              setStepMode(!!draft.stepMode);
            if (typeof draft?.stepIndex === "number")
              setStepIndex(Math.max(0, Number(draft.stepIndex) || 0));
            usedDraft = true;
            setLoadedFromDraft(true);
          }
        }
      } catch {}

      if (!usedDraft) {
        setLoadedFromDraft(false);
        fetchData();
      }
    } else {
      // Modal just closed → persist current draft immediately
      try {
        const payload = { classConfigs, stepMode, stepIndex, ts: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch {}
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const schoolId = user.schoolId || (user.schoolIds && user.schoolIds[0]);

      // Fetch all classes with pagination
      const fetchedClasses = await fetchAllPages(`${API_BASE_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { schoolId, limit: 100 },
      });

      // For each class, fetch only assigned subjects for that class
      setClasses(fetchedClasses);

      const headers = { Authorization: `Bearer ${token}` };
      const classConfigsPromises = fetchedClasses.map(async (cls: any) => {
        try {
          const resp = await axios.get(
            `${API_BASE_URL}/teacher-class-subjects`,
            {
              headers,
              params: { classId: cls.id },
            }
          );

          // Try to normalize different possible response shapes
          const raw = (resp.data as any) || {};
          const list = Array.isArray(raw)
            ? raw
            : Array.isArray(raw.data)
            ? raw.data
            : Array.isArray(raw.subjects)
            ? raw.subjects
            : [];

          const mappedSubjects = (list || [])
            .map((s: any) => ({
              subjectId: Number(s.id ?? s.subjectId ?? s.subject?.id ?? 0),
              subjectName: String(
                s.name ?? s.subjectName ?? s.subject?.name ?? "Subject"
              ),
              included: true,
              frequency: 5,
            }))
            .filter((s: any) => s.subjectId);

          return {
            classId: cls.id,
            className: cls.name,
            classCode: cls.code,
            level: cls.level || parseInt(cls.name.match(/\d+/)?.[0] || "1"),
            included: true,
            subjectsPerDay: 6,
            subjects: mappedSubjects,
          } as ClassConfig;
        } catch (e) {
          console.error(
            "Error fetching assigned subjects for class",
            cls.id,
            e
          );
          return {
            classId: cls.id,
            className: cls.name,
            classCode: cls.code,
            level: cls.level || parseInt(cls.name.match(/\d+/)?.[0] || "1"),
            included: true,
            subjectsPerDay: 6,
            subjects: [],
          } as ClassConfig;
        }
      });

      const configs: ClassConfig[] = await Promise.all(classConfigsPromises);

      // Sort classes: prep classes first, then numeric levels, sorted by code within each level
      const sortedConfigs = configs.sort((a, b) => {
        // Helper to extract level number or treat "prep" as 0
        const getLevelValue = (config: ClassConfig): number => {
          const nameLower = config.className.toLowerCase();
          if (nameLower.includes("prep")) return 0; // Prep comes first
          return config.level;
        };

        const levelA = getLevelValue(a);
        const levelB = getLevelValue(b);

        // First sort by level (prep=0 comes before numeric levels)
        if (levelA !== levelB) {
          return levelA - levelB;
        }

        // If same level, sort by code/section alphabetically
        const codeA = (a.classCode || "").toUpperCase();
        const codeB = (b.classCode || "").toUpperCase();
        if (codeA !== codeB) {
          return codeA.localeCompare(codeB);
        }

        // If no code, sort by name
        return a.className.localeCompare(b.className);
      });

      setClassConfigs(sortedConfigs);
      setStepIndex(0);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Reusable sort helper to ensure consistent ordering
  const sortClasses = (configs: ClassConfig[]) => {
    return [...configs].sort((a, b) => {
      // Prefer extracting numeric from name to avoid API level inconsistencies
      const extractLevel = (cfg: ClassConfig): number => {
        const name = cfg.className?.toLowerCase() || "";
        if (name.includes("prep")) return 0;
        const m = cfg.className?.match(/\d+/);
        if (m && m[0]) return parseInt(m[0], 10);
        return cfg.level || 9999;
      };
      const levelA = extractLevel(a);
      const levelB = extractLevel(b);
      if (levelA !== levelB) return levelA - levelB;

      // Section/Code comparison (A < B < C). Fallback to letter inside parentheses in name.
      const sectionFromName = (name?: string) => {
        if (!name) return "";
        const m = name.match(/\(([A-Za-z])\)/);
        return m && m[1] ? m[1].toUpperCase() : "";
      };
      const codeA = (a.classCode || sectionFromName(a.className)).toUpperCase();
      const codeB = (b.classCode || sectionFromName(b.className)).toUpperCase();
      if (codeA !== codeB) return codeA.localeCompare(codeB);

      // Final tiebreaker by full name
      return a.className.localeCompare(b.className);
    });
  };

  // Derived for step mode
  const includedSortedClasses = sortClasses(
    classConfigs.filter((c) => c.included)
  );
  const currentClass = includedSortedClasses[stepIndex];
  const goPrev = () => setStepIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setStepIndex((i) => Math.min(includedSortedClasses.length - 1, i + 1));
  const skipCurrent = () => {
    if (!currentClass) return;
    setClassConfigs((prev) =>
      prev.map((c) =>
        c.classId === currentClass.classId ? { ...c, included: false } : c
      )
    );
    setTimeout(() => {
      setStepIndex((i) =>
        Math.min(i, Math.max(0, includedSortedClasses.length - 2))
      );
    }, 0);
  };

  // Persist draft to localStorage on changes
  useEffect(() => {
    if (!isOpen) return;
    try {
      const payload = { classConfigs, stepMode, stepIndex, ts: Date.now() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {}
  }, [isOpen, classConfigs, stepMode, stepIndex]);

  // Save on tab/browser close as well
  useEffect(() => {
    const handler = () => {
      try {
        const payload = { classConfigs, stepMode, stepIndex, ts: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch {}
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [classConfigs, stepMode, stepIndex]);

  const toggleCategory = (index: number) => {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === index ? { ...cat, expanded: !cat.expanded } : cat
      )
    );
  };

  const toggleAllClassesInCategory = (levels: number[], included: boolean) => {
    setClassConfigs((prev) =>
      prev.map((config) =>
        levels.includes(config.level) ? { ...config, included } : config
      )
    );
  };

  const toggleClass = (classId: number) => {
    setClassConfigs((prev) =>
      prev.map((config) =>
        config.classId === classId
          ? { ...config, included: !config.included }
          : config
      )
    );
  };

  const toggleSubject = (classId: number, subjectId: number) => {
    setClassConfigs((prev) =>
      prev.map((config) =>
        config.classId === classId
          ? {
              ...config,
              subjects: config.subjects.map((subj) =>
                subj.subjectId === subjectId
                  ? { ...subj, included: !subj.included }
                  : subj
              ),
            }
          : config
      )
    );
  };

  const updateSubjectsPerDay = (classId: number, value: number) => {
    setClassConfigs((prev) =>
      prev.map((config) =>
        config.classId === classId
          ? {
              ...config,
              subjectsPerDay: Math.max(
                1,
                Math.min(10, Number.isFinite(value) ? value : 1)
              ),
            }
          : config
      )
    );
  };

  const updateFrequency = (
    classId: number,
    subjectId: number,
    frequency: number
  ) => {
    setClassConfigs((prev) =>
      prev.map((config) =>
        config.classId === classId
          ? {
              ...config,
              subjects: config.subjects.map((subj) =>
                subj.subjectId === subjectId
                  ? { ...subj, frequency: Math.max(1, Math.min(6, frequency)) } // Clamp between 1-6
                  : subj
              ),
            }
          : config
      )
    );
  };

  const toggleAllSubjectsInClass = (classId: number, included: boolean) => {
    setClassConfigs((prev) =>
      prev.map((config) =>
        config.classId === classId
          ? {
              ...config,
              subjects: config.subjects.map((subj) => ({ ...subj, included })),
            }
          : config
      )
    );
  };

  const handleGenerate = () => {
    // Filter only included classes and subjects
    const finalConfig = classConfigs
      .filter((config) => config.included)
      .map((config) => ({
        classId: config.classId,
        className: config.className,
        subjectsPerDay: config.subjectsPerDay || 6,
        subjects: config.subjects
          .filter((subj) => subj.included)
          .map((subj) => ({
            subjectId: subj.subjectId,
            frequency: subj.frequency,
          })),
      }))
      .filter((config) => config.subjects.length > 0);

    if (finalConfig.length === 0) {
      setError("Please select at least one class with subjects");
      return;
    }

    // Clear draft on successful generate initiation
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    onGenerate({ classes: finalConfig });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-700">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="w-6 h-6 text-white" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  {t("timetable.configureTitle")}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {t("timetable.configureDescription")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="text-white hover:text-blue-100 transition-colors disabled:opacity-50"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Mode Switch */}
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stepMode}
                  onChange={(e) => setStepMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {t("timetable.stepByStepMode")}
                </span>
              </label>
              {stepMode && (
                <div className="text-sm text-gray-600">
                  {includedSortedClasses.length > 0 ? (
                    <span>
                      {t("timetable.classXOfY", {
                        current: stepIndex + 1,
                        total: includedSortedClasses.length,
                      })}
                      :{" "}
                      <strong>
                        {currentClass?.className}
                        {currentClass?.classCode
                          ? ` (${currentClass.classCode})`
                          : ""}
                      </strong>
                    </span>
                  ) : (
                    <span>{t("timetable.noClassesSelected")}</span>
                  )}
                </div>
              )}
            </div>

            {/* Class Tabs (Horizontal) */}
            {stepMode && includedSortedClasses.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {includedSortedClasses.map((cls, idx) => (
                    <button
                      key={cls.classId}
                      onClick={() => setStepIndex(idx)}
                      className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap transition-colors ${
                        stepIndex === idx
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                      title={`${cls.className}${
                        cls.classCode ? ` (${cls.classCode})` : ""
                      }`}
                    >
                      {cls.className}
                      {cls.classCode ? ` (${cls.classCode})` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  {t("timetable.loadingClassesSubjects")}
                </span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            ) : (
              <div className="space-y-6">
                {!stepMode &&
                  categories.map((category, categoryIndex) => {
                    const categoryClasses = sortClasses(classConfigs).filter(
                      (config) => category.levels.includes(config.level)
                    );
                    if (categoryClasses.length === 0) return null;

                    const allCategorySelected = categoryClasses.every(
                      (c) => c.included
                    );
                    const someCategorySelected = categoryClasses.some(
                      (c) => c.included
                    );

                    return (
                      <div
                        key={categoryIndex}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        {/* Category Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleCategory(categoryIndex)}
                                className="text-gray-700 hover:text-gray-900 transition-colors"
                              >
                                {category.expanded ? (
                                  <FaChevronUp className="w-4 h-4" />
                                ) : (
                                  <FaChevronDown className="w-4 h-4" />
                                )}
                              </button>
                              <FaSchool className="w-5 h-5 text-blue-600" />
                              <div>
                                <h3 className="font-bold text-gray-900">
                                  {category.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {category.range} • {categoryClasses.length}{" "}
                                  {t("timetable.classes")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={allCategorySelected}
                                  ref={(input) => {
                                    if (input)
                                      input.indeterminate =
                                        someCategorySelected &&
                                        !allCategorySelected;
                                  }}
                                  onChange={(e) =>
                                    toggleAllClassesInCategory(
                                      category.levels,
                                      e.target.checked
                                    )
                                  }
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  {allCategorySelected
                                    ? t("timetable.deselectAll")
                                    : t("timetable.selectAll")}
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Category Classes */}
                        {category.expanded && (
                          <div className="p-4 space-y-4">
                            {categoryClasses.map((classConfig) => (
                              <div
                                key={classConfig.classId}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                              >
                                {/* Class Header */}
                                <div className="bg-blue-50 p-4">
                                  <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                                      <input
                                        type="checkbox"
                                        checked={classConfig.included}
                                        onChange={() =>
                                          toggleClass(classConfig.classId)
                                        }
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="font-semibold text-gray-900 text-lg">
                                        {classConfig.className}
                                        {classConfig.classCode
                                          ? ` (${classConfig.classCode})`
                                          : ""}
                                      </span>
                                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                        {classConfig.subjects.length}{" "}
                                        {t("timetable.subjects")}
                                      </span>
                                    </label>
                                    {classConfig.included && (
                                      <div className="flex items-center gap-4">
                                        {/* Subjects-per-day control */}
                                        <div className="flex items-center gap-2 text-sm">
                                          <span className="text-gray-700">
                                            {t("timetable.subjectsPerDay")}:
                                          </span>
                                          <button
                                            onClick={() =>
                                              updateSubjectsPerDay(
                                                classConfig.classId,
                                                (classConfig.subjectsPerDay ||
                                                  6) - 1
                                              )
                                            }
                                            className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
                                          >
                                            -
                                          </button>
                                          <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={
                                              classConfig.subjectsPerDay || 6
                                            }
                                            onChange={(e) =>
                                              updateSubjectsPerDay(
                                                classConfig.classId,
                                                parseInt(e.target.value) || 1
                                              )
                                            }
                                            className="w-14 h-7 text-center border border-gray-300 rounded text-sm font-semibold text-gray-500  "
                                          />
                                          <button
                                            onClick={() =>
                                              updateSubjectsPerDay(
                                                classConfig.classId,
                                                (classConfig.subjectsPerDay ||
                                                  6) + 1
                                              )
                                            }
                                            className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
                                          >
                                            +
                                          </button>
                                        </div>
                                        <button
                                          onClick={() =>
                                            toggleAllSubjectsInClass(
                                              classConfig.classId,
                                              false
                                            )
                                          }
                                          className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                        >
                                          {t("timetable.deselectAllSubjects")}
                                        </button>
                                        <button
                                          onClick={() =>
                                            toggleAllSubjectsInClass(
                                              classConfig.classId,
                                              true
                                            )
                                          }
                                          className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                        >
                                          {t("timetable.selectAllSubjects")}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Subjects List */}
                                {classConfig.included && (
                                  <div className="p-0 bg-white">
                                    <div className="divide-y">
                                      {classConfig.subjects.map(
                                        (subject, idx) => (
                                          <div
                                            key={subject.subjectId}
                                            className="flex items-center gap-3 px-4 py-3"
                                          >
                                            <span className="w-6 h-6 text-xs rounded-full bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center">
                                              {idx + 1}
                                            </span>
                                            <input
                                              type="checkbox"
                                              checked={subject.included}
                                              onChange={() =>
                                                toggleSubject(
                                                  classConfig.classId,
                                                  subject.subjectId
                                                )
                                              }
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <FaBook className="w-3.5 h-3.5 text-purple-600" />
                                            <div className="flex-1 text-sm font-medium text-gray-800">
                                              {subject.subjectName}
                                            </div>
                                            {subject.included && (
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-600">
                                                  {t("timetable.perWeek")}
                                                </span>
                                                <button
                                                  onClick={() =>
                                                    updateFrequency(
                                                      classConfig.classId,
                                                      subject.subjectId,
                                                      subject.frequency - 1
                                                    )
                                                  }
                                                  className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
                                                >
                                                  -
                                                </button>
                                                <input
                                                  type="number"
                                                  min="1"
                                                  max="6"
                                                  value={subject.frequency}
                                                  onChange={(e) =>
                                                    updateFrequency(
                                                      classConfig.classId,
                                                      subject.subjectId,
                                                      parseInt(
                                                        e.target.value
                                                      ) || 1
                                                    )
                                                  }
                                                  className="w-12 h-6 text-center border border-gray-300 rounded text-sm font-semibold text-gray-500"
                                                />
                                                <button
                                                  onClick={() =>
                                                    updateFrequency(
                                                      classConfig.classId,
                                                      subject.subjectId,
                                                      subject.frequency + 1
                                                    )
                                                  }
                                                  className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                {stepMode && currentClass && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Class Header */}
                    <div className="bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={currentClass.included}
                            onChange={() => toggleClass(currentClass.classId)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="font-semibold text-gray-900 text-lg">
                            {currentClass.className}
                            {currentClass.classCode
                              ? ` (${currentClass.classCode})`
                              : ""}
                          </span>
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={skipCurrent}
                            className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                          >
                            {t("timetable.skipClass")}
                          </button>
                          {/* Subjects/day control (step view) */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-700">
                              {t("timetable.subjectsPerDay")}:
                            </span>
                            <button
                              onClick={() =>
                                updateSubjectsPerDay(
                                  currentClass.classId,
                                  (currentClass.subjectsPerDay || 6) - 1
                                )
                              }
                              className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={currentClass.subjectsPerDay || 6}
                              onChange={(e) =>
                                updateSubjectsPerDay(
                                  currentClass.classId,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-14 h-7 text-center border border-gray-300 rounded text-sm font-semibold text-gray-500"
                            />
                            <button
                              onClick={() =>
                                updateSubjectsPerDay(
                                  currentClass.classId,
                                  (currentClass.subjectsPerDay || 6) + 1
                                )
                              }
                              className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
                            >
                              +
                            </button>
                          </div>
                          {/* Select/Deselect all for step view */}
                          <button
                            onClick={() =>
                              toggleAllSubjectsInClass(
                                currentClass.classId,
                                false
                              )
                            }
                            className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            {t("timetable.deselectAllSubjects")}
                          </button>
                          <button
                            onClick={() =>
                              toggleAllSubjectsInClass(
                                currentClass.classId,
                                true
                              )
                            }
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            {t("timetable.selectAllSubjects")}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subjects List (Step) */}
                    {currentClass.included && (
                      <div className="p-0 bg-white">
                        <div className="divide-y">
                          {currentClass.subjects.map((subject, idx) => (
                            <div
                              key={subject.subjectId}
                              className="flex items-center gap-3 px-4 py-3"
                            >
                              <span className="w-6 h-6 text-xs rounded-full bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <input
                                type="checkbox"
                                checked={subject.included}
                                onChange={() =>
                                  toggleSubject(
                                    currentClass.classId,
                                    subject.subjectId
                                  )
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <FaBook className="w-3.5 h-3.5 text-purple-600" />
                              <div className="flex-1 text-sm font-medium text-gray-800">
                                {subject.subjectName}
                              </div>
                              {subject.included && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600">
                                    {t("timetable.perWeek")}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateFrequency(
                                        currentClass.classId,
                                        subject.subjectId,
                                        subject.frequency - 1
                                      )
                                    }
                                    className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    max="6"
                                    value={subject.frequency}
                                    onChange={(e) =>
                                      updateFrequency(
                                        currentClass.classId,
                                        subject.subjectId,
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="w-12 h-6 text-center border border-gray-300 rounded text-sm font-semibold text-gray-500"
                                  />
                                  <button
                                    onClick={() =>
                                      updateFrequency(
                                        currentClass.classId,
                                        subject.subjectId,
                                        subject.frequency + 1
                                      )
                                    }
                                    className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step Controls */}
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                      <button
                        onClick={goPrev}
                        disabled={stepIndex === 0}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                      >
                        {t("timetable.previous")}
                      </button>
                      <div className="text-sm text-gray-600">
                        {t("timetable.stepXOfY", {
                          current: stepIndex + 1,
                          total: includedSortedClasses.length,
                        })}
                      </div>
                      <button
                        onClick={goNext}
                        disabled={stepIndex >= includedSortedClasses.length - 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                      >
                        {t("timetable.next")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {classConfigs.filter((c) => c.included).length}{" "}
              {t("timetable.classesSelected")} •{" "}
              {classConfigs.reduce(
                (sum, c) => sum + c.subjects.filter((s) => s.included).length,
                0
              )}{" "}
              {t("timetable.totalSubjectAssignments")}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem(DRAFT_KEY);
                  } catch {}
                }}
                disabled={isGenerating}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("timetable.clearDraft")}
              </button>
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("timetable.cancel")}
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t("timetable.generating")}</span>
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="w-4 h-4" />
                    <span>{t("timetable.generateSchedule")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleConfigModal;
