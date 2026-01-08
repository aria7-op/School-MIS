import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../contexts/AuthContext";
import secureApiService from "../../../services/secureApiService";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number | { s: number; e: number; d: number[] };
  status:
    | "PENDING"
    | "SUBMITTED"
    | "OVERDUE"
    | "GRADED"
    | "active"
    | "completed";
  isOverdue?: boolean;
  daysRemaining?: number;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    username?: string;
    role?: string;
  };
  class: {
    id: string;
    name: string;
    code?: string;
  };
  attachments?: Array<{
    id: string;
    name: string;
    path: string;
    mimeType: string;
    size: number;
  }>;
  submission?: {
    id: string;
    status: string;
    submittedAt: string;
    score?: number;
    feedback?: string;
    attachments: Array<{
      id: string;
      name: string;
      path: string;
    }>;
  };
  studentName?: string;
  className?: string;
  parentStatus?: {
    seen: boolean;
    seenAt: string | null;
    acknowledged: boolean;
    acknowledgedAt: string | null;
    notes: string | null;
  };
  // Legacy properties for backward compatibility
  parentViewed?: boolean;
  parentViewedAt?: string;
  parentAcknowledged?: boolean;
  parentAcknowledgedAt?: string;
  parentNotes?: string;
  teacherResponse?: string;
  teacherResponseAt?: string;
  teacherResponderName?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  type?: string;
  weight?: number;
}

interface AssignmentsProps {
  selectedStudent?: string | null;
  children?: any[];
}

const Assignments: React.FC<AssignmentsProps> = ({
  selectedStudent,
  children = [],
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [parentNotes, setParentNotes] = useState("");
  const [markingAsSeen, setMarkingAsSeen] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState<any[]>([]);

  // Teacher details state
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [loadingTeacherDetails, setLoadingTeacherDetails] = useState(false);
  const [teacherDetails, setTeacherDetails] = useState<any>(null);

  // New state for subject filtering
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  // advance filter
  // Advanced Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    hasAttachments: null as boolean | null,
    parentViewed: null as boolean | null,
    parentAcknowledged: null as boolean | null,
    dateRange: "all" as
      | "all"
      | "thisWeek"
      | "thisMonth"
      | "overdue"
      | "upcoming",
    hasSubmission: null as boolean | null,
    hasGrade: null as boolean | null,
  });

  // Get parent user ID
  const parentUserId = user?.id;

  // Load assignments from API
  const loadAssignments = async () => {
    if (!parentUserId) {
      setError("Parent ID not found");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // console.log('🔍 Loading assignments for parent:', parentUserId);
      // console.log('🔑 Token:', localStorage.getItem('token') ? 'Present' : 'Missing');

      // Use the backend API server (not the frontend dev server)
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      const backendUrl = "https://khwanzay.school/api"; // Backend server URL
      // Core assignments endpoint supports query params; use studentId to filter
      const query = selectedStudent ? `?studentId=${selectedStudent}` : "";
      const apiUrl = `${backendUrl}/assignments${query}`;

      // console.log('🌐 Backend URL:', backendUrl);
      // console.log('🌐 API URL:', apiUrl);
      // console.log('🔑 Token found:', token ? 'Yes' : 'No');

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      // First, test if the backend API is accessible
      const testResponse = await fetch(`${backendUrl}/parents`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // console.log('🧪 Test API response status:', testResponse.status);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // console.log('📡 Response status:', response.status);
      // console.log('📡 Response headers:', response.headers.get('content-type'));

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        // console.error('❌ Server error response:', errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      // Get response text first to debug
      const responseText = await response.text();
      // console.log('📄 Raw response:', responseText);

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // console.error('❌ JSON parse error:', parseError);
        // console.error('❌ Response text that failed to parse:', responseText);

        // Check if it's an HTML error page (frontend dev server response)
        if (
          responseText.includes("<html>") ||
          responseText.includes("<!DOCTYPE")
        ) {
          throw new Error(
            "Backend server not running! The request is hitting the frontend dev server instead of the backend API. Please start the backend server on port 3000."
          );
        }

        // Check if it's a 404 or other error
        if (
          responseText.includes("Cannot GET") ||
          responseText.includes("404")
        ) {
          throw new Error(
            "API endpoint not found. Check if the backend server is running and the route is registered."
          );
        }

        // Check for connection errors
        if (
          responseText.includes("ERR_CONNECTION_REFUSED") ||
          responseText.includes("fetch")
        ) {
          throw new Error(
            "Cannot connect to backend server. Please ensure the backend server is running on http://localhost:3000"
          );
        }

        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 100)}...`
        );
      }

      // console.log('✅ Parsed data:', data);

      if (
        data.success ||
        Array.isArray(data.data) ||
        Array.isArray(data.assignments)
      ) {
        // Normalize payloads: {data:[...]}, {assignments:[...]}, or direct array
        let loaded: Assignment[] = Array.isArray(data)
          ? (data as Assignment[])
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.assignments)
          ? data.assignments
          : [];

        // If API didn't filter by student, filter client-side conservatively
        if (selectedStudent) {
          const child = children.find((c: any) => c.id === selectedStudent);
          const fullName = child
            ? `${child.firstName} ${child.lastName}`.toLowerCase()
            : undefined;
          loaded = loaded.filter((a: any) => {
            if (a.studentId != null) {
              return String(a.studentId) === String(selectedStudent);
            }
            if (a.studentName) {
              return fullName
                ? String(a.studentName).toLowerCase() === fullName
                : true;
            }
            // No per-student field provided; keep the item (assignment is class-level)
            return true;
          });
        }

        setAssignments(loaded);
        // console.log('✅ Assignments loaded:', loaded.length);
      } else {
        setError(data.message || "Failed to load assignments");
      }
    } catch (err: any) {
      // console.error('❌ Error loading assignments:', err);

      // Show sample data if API fails (for development)
      if (process.env.NODE_ENV === "development") {
        // console.log('🔄 Falling back to sample data for development');
        setAssignments([
          {
            id: "sample-1",
            title: "Math Homework - Chapter 5",
            description:
              "Complete exercises 1-20 from chapter 5. Show all work and submit by Friday.",
            dueDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            maxScore: 100,
            status: "PENDING",
            isOverdue: false,
            daysRemaining: 3,
            subject: {
              id: "1",
              name: "Mathematics",
              code: "MATH",
            },
            teacher: {
              id: "1",
              firstName: "John",
              lastName: "Smith",
              email: "john.smith@school.edu",
            },
            class: {
              id: "1",
              name: "Grade 9-A",
            },
            attachments: [
              {
                id: "1",
                name: "Chapter5_Exercises.pdf",
                path: "/uploads/assignments/chapter5.pdf",
                mimeType: "application/pdf",
                size: 1024000,
              },
            ],
            studentName:
              children[0]?.firstName + " " + children[0]?.lastName || "Student",
            className: "Grade 9-A",
          },
        ]);
        setError(
          `API Error: ${err.message}. Showing sample data for development.`
        );
      } else {
        setError(err.message || "Failed to load assignments");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load subjects for selected student's class
  const loadSubjects = async () => {
    if (!selectedStudent) {
      setSubjects([]);
      return;
    }

    try {
      setLoadingSubjects(true);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      const backendUrl = "https://khwanzay.school/api";

      // First get the student's class ID
      const studentResponse = await fetch(
        `${backendUrl}/students/${selectedStudent}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (studentResponse.ok) {
        const studentData = await studentResponse.json();
        const classId = studentData.data?.classId || studentData.classId;

        if (classId) {
          // Fetch subjects for this class
          const subjectsResponse = await fetch(
            `${backendUrl}/classes/${classId}/subjects`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (subjectsResponse.ok) {
            const subjectsData = await subjectsResponse.json();
            const subjectsList = Array.isArray(subjectsData.data)
              ? subjectsData.data
              : Array.isArray(subjectsData)
              ? subjectsData
              : [];

            const mappedSubjects = subjectsList.map((s: any) => ({
              id: String(s.id),
              name: s.name || s.code || `Subject ${s.id}`,
            }));
            setSubjects(mappedSubjects);
          }
        }
      }
    } catch (error) {
      // console.error('Error loading subjects:', error);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Load assignments on component mount
  useEffect(() => {
    loadAssignments();
  }, [parentUserId, selectedStudent]);

  // Load subjects when student changes
  useEffect(() => {
    loadSubjects();
    setSelectedSubject(null); // Reset subject filter when student changes
  }, [selectedStudent]);

  // Calculate subject counts
  const subjectCounts = useMemo(() => {
    const counts: {
      [key: string]: { total: number; pending: number; overdue: number };
    } = {};

    assignments.forEach((assignment) => {
      const subjectName = assignment.subject?.name || "Other";
      if (!counts[subjectName]) {
        counts[subjectName] = { total: 0, pending: 0, overdue: 0 };
      }
      counts[subjectName].total++;
      if (assignment.status === "PENDING") counts[subjectName].pending++;
      if (assignment.status === "OVERDUE") counts[subjectName].overdue++;
    });

    return counts;
  }, [assignments]);

  // Apply Advanced Filters
  const applyAdvancedFilters = (assignmentsList: Assignment[]) => {
    return assignmentsList.filter((assignment) => {
      // Status filter
      if (
        filters.status.length > 0 &&
        !filters.status.includes(assignment.status)
      ) {
        return false;
      }

      // Priority filter
      if (filters.priority.length > 0) {
        if (
          !assignment.priority ||
          !filters.priority.includes(assignment.priority)
        ) {
          return false;
        }
      }

      // Has attachments filter
      if (filters.hasAttachments !== null) {
        const hasAttachments = (assignment.attachments?.length ?? 0) > 0;
        if (filters.hasAttachments !== hasAttachments) return false;
      }

      // Parent viewed filter
      if (filters.parentViewed !== null) {
        const isViewed =
          assignment.parentStatus?.seen || assignment.parentViewed;
        if (filters.parentViewed !== isViewed) return false;
      }

      // Parent acknowledged filter
      if (filters.parentAcknowledged !== null) {
        const isAcknowledged =
          assignment.parentStatus?.acknowledged ||
          assignment.parentAcknowledged;
        if (filters.parentAcknowledged !== isAcknowledged) return false;
      }

      // Has submission filter
      if (filters.hasSubmission !== null) {
        const hasSubmission = !!assignment.submission;
        if (filters.hasSubmission !== hasSubmission) return false;
      }

      // Has grade filter
      if (filters.hasGrade !== null) {
        const hasGrade = assignment.submission?.score !== undefined;
        if (filters.hasGrade !== hasGrade) return false;
      }

      // Date range filter
      if (filters.dateRange !== "all") {
        const dueDate = new Date(assignment.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        switch (filters.dateRange) {
          case "thisWeek":
            if (daysDiff < 0 || daysDiff > 7) return false;
            break;
          case "thisMonth":
            if (daysDiff < 0 || daysDiff > 30) return false;
            break;
          case "overdue":
            if (daysDiff >= 0) return false;
            break;
          case "upcoming":
            if (daysDiff < 0 || daysDiff > 14) return false;
            break;
        }
      }

      return true;
    });
  };

  // Filter assignments based on subject, search query, and advanced filters
  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    // Subject filter
    if (selectedSubject) {
      filtered = filtered.filter(
        (assignment) =>
          assignment.subject?.name?.toLowerCase() ===
          selectedSubject.toLowerCase()
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((assignment) => {
        const teacherName =
          `${assignment.teacher.firstName} ${assignment.teacher.lastName}`.toLowerCase();
        const subjectName = assignment.subject?.name?.toLowerCase() || "";
        const className = assignment.class?.name?.toLowerCase() || "";
        const description = assignment.description?.toLowerCase() || "";

        return (
          assignment.title.toLowerCase().includes(searchLower) ||
          description.includes(searchLower) ||
          subjectName.includes(searchLower) ||
          teacherName.includes(searchLower) ||
          className.includes(searchLower)
        );
      });
    }

    // Apply advanced filters
    filtered = applyAdvancedFilters(filtered);

    // Sort by due date (soonest first, but overdue at top)
    return filtered.sort((a, b) => {
      const isAOverdue = a.status === "OVERDUE" || (a.isOverdue ?? false);
      const isBOverdue = b.status === "OVERDUE" || (b.isOverdue ?? false);

      // Overdue assignments come first
      if (isAOverdue && !isBOverdue) return -1;
      if (!isAOverdue && isBOverdue) return 1;

      // Then sort by due date
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });
  }, [assignments, selectedSubject, searchQuery, filters]);

  // Count active filters
  const activeFilterCount =
    filters.status.length +
    filters.priority.length +
    (filters.hasAttachments !== null ? 1 : 0) +
    (filters.parentViewed !== null ? 1 : 0) +
    (filters.parentAcknowledged !== null ? 1 : 0) +
    (filters.hasSubmission !== null ? 1 : 0) +
    (filters.hasGrade !== null ? 1 : 0) +
    (filters.dateRange !== "all" ? 1 : 0);

  // Clear all filters function
  const clearAllFilters = () => {
    setFilters({
      status: [],
      priority: [],
      hasAttachments: null,
      parentViewed: null,
      parentAcknowledged: null,
      dateRange: "all",
      hasSubmission: null,
      hasGrade: null,
    });
  };

  // Toggle filter option helper
  const toggleFilterArray = (
    filterKey: "status" | "priority",
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: prev[filterKey].includes(value)
        ? prev[filterKey].filter((v) => v !== value)
        : [...prev[filterKey], value],
    }));
  };
  // Translate assignment description patterns
  const translateDescription = (description: string): string => {
    if (!description) return description;

    // Common patterns to translate
    const patterns = [
      {
        regex: /(\w+)\s+assignment\s+for\s+class\s+(\d+)/gi,
        translationKey: "assignmentForClass",
        replacement: (match: string, title: string, classNumber: string) =>
          `${title} ${t(
            "parentPortal.assignments.descriptionPatterns.assignmentForClass",
            { classNumber }
          )}`,
      },
      {
        regex: /(\w+)\s+homework\s+for\s+class\s+(\d+)/gi,
        translationKey: "homeworkForClass",
        replacement: (match: string, title: string, classNumber: string) =>
          `${title} ${t(
            "parentPortal.assignments.descriptionPatterns.homeworkForClass",
            { classNumber }
          )}`,
      },
      {
        regex: /(\w+)\s+exercise\s+for\s+class\s+(\d+)/gi,
        translationKey: "exerciseForClass",
        replacement: (match: string, title: string, classNumber: string) =>
          `${title} ${t(
            "parentPortal.assignments.descriptionPatterns.exerciseForClass",
            { classNumber }
          )}`,
      },
      {
        regex: /(\w+)\s+project\s+for\s+class\s+(\d+)/gi,
        translationKey: "projectForClass",
        replacement: (match: string, title: string, classNumber: string) =>
          `${title} ${t(
            "parentPortal.assignments.descriptionPatterns.projectForClass",
            { classNumber }
          )}`,
      },
      {
        regex: /(\w+)\s+test\s+for\s+class\s+(\d+)/gi,
        translationKey: "testForClass",
        replacement: (match: string, title: string, classNumber: string) =>
          `${title} ${t(
            "parentPortal.assignments.descriptionPatterns.testForClass",
            { classNumber }
          )}`,
      },
      {
        regex: /(\w+)\s+quiz\s+for\s+class\s+(\d+)/gi,
        translationKey: "quizForClass",
        replacement: (match: string, title: string, classNumber: string) =>
          `${title} ${t(
            "parentPortal.assignments.descriptionPatterns.quizForClass",
            { classNumber }
          )}`,
      },
    ];

    let translatedDescription = description;

    patterns.forEach((pattern) => {
      translatedDescription = translatedDescription.replace(
        pattern.regex,
        pattern.replacement
      );
    });

    return translatedDescription;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "text-green-600 bg-green-100";
      case "OVERDUE":
        return "text-red-600 bg-red-100";
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Format date safely
  const formatDate = (dateString: any) => {
    if (typeof dateString !== "string" || !dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMaxScore = (maxScore: any): number | string => {
    if (typeof maxScore === "number") return maxScore;
    if (
      maxScore &&
      typeof maxScore === "object" &&
      Array.isArray(maxScore.d) &&
      maxScore.d.length > 0
    ) {
      return maxScore.d[0];
    }
    return "-";
  };

  // Mark assignment as seen by parent
  const handleMarkAsSeen = async (assignmentId: string) => {
    try {
      setMarkingAsSeen(assignmentId);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      const backendUrl = "https://khwanzay.school/api";

      const response = await fetch(
        `${backendUrl}/assignments/${assignmentId}/mark-seen`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parentId: String(parentUserId), // Convert BigInt to string
            viewedAt: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setAssignments((prev) =>
          prev.map((assignment) =>
            assignment.id === assignmentId
              ? {
                  ...assignment,
                  parentStatus: {
                    seen: true,
                    seenAt: new Date().toISOString(),
                    acknowledged:
                      assignment.parentStatus?.acknowledged || false,
                    acknowledgedAt:
                      assignment.parentStatus?.acknowledgedAt || null,
                    notes: assignment.parentStatus?.notes || null,
                  },
                  // Legacy support
                  parentViewed: true,
                  parentViewedAt: new Date().toISOString(),
                }
              : assignment
          )
        );
        alert("Assignment marked as seen successfully!");
      } else {
        throw new Error("Failed to mark assignment as seen");
      }
    } catch (error) {
      // console.error('Error marking assignment as seen:', error);
      alert("Failed to mark assignment as seen. Please try again.");
    } finally {
      setMarkingAsSeen(null);
    }
  };

  // Acknowledge assignment (parent confirms they've reviewed it)
  const handleAcknowledgeAssignment = async (assignmentId: string) => {
    try {
      setAcknowledging(assignmentId);
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      const backendUrl = "https://khwanzay.school/api";

      const response = await fetch(
        `${backendUrl}/assignments/${assignmentId}/acknowledge`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parentId: String(parentUserId), // Convert BigInt to string
            acknowledgedAt: new Date().toISOString(),
            notes: parentNotes,
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setAssignments((prev) =>
          prev.map((assignment) =>
            assignment.id === assignmentId
              ? {
                  ...assignment,
                  parentStatus: {
                    seen: assignment.parentStatus?.seen || true,
                    seenAt:
                      assignment.parentStatus?.seenAt ||
                      new Date().toISOString(),
                    acknowledged: true,
                    acknowledgedAt: new Date().toISOString(),
                    notes: parentNotes,
                  },
                  // Legacy support
                  parentAcknowledged: true,
                  parentAcknowledgedAt: new Date().toISOString(),
                  parentNotes: parentNotes,
                }
              : assignment
          )
        );
        setShowNotesModal(false);
        setParentNotes("");
        alert("Assignment acknowledged successfully!");
      } else {
        throw new Error("Failed to acknowledge assignment");
      }
    } catch (error) {
      // console.error('Error acknowledging assignment:', error);
      alert("Failed to acknowledge assignment. Please try again.");
    } finally {
      setAcknowledging(null);
    }
  };

  // Submit assignment with file upload
  const handleSubmitAssignment = async (file: File) => {
    if (!selectedAssignment || !selectedStudent) {
      alert("Please select a student first");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentId", selectedStudent);
      formData.append("submittedAt", new Date().toISOString());

      // Import the API service at the top if not already imported
      const api = await import("../../../services/secureApiService").then(
        (m) => m.default
      );

      const response = await api.submitAssignment(
        selectedAssignment.id,
        formData
      );

      if (response.success || response.data) {
        const data = response.data;

        // Update local state to show submission
        setAssignments((prev) =>
          prev.map((assignment) =>
            assignment.id === selectedAssignment.id
              ? {
                  ...assignment,
                  submission: {
                    id: data?.id || Math.random().toString(),
                    status: "submitted",
                    submittedAt: new Date().toISOString(),
                    score: undefined,
                    feedback: undefined,
                    attachments: [
                      {
                        id: file.name,
                        name: file.name,
                        path: data?.filePath || "",
                      },
                    ],
                  },
                }
              : assignment
          )
        );

        setSelectedAssignment((prev) =>
          prev
            ? {
                ...prev,
                submission: {
                  id: data?.id || Math.random().toString(),
                  status: "submitted",
                  submittedAt: new Date().toISOString(),
                  score: undefined,
                  feedback: undefined,
                  attachments: [
                    {
                      id: file.name,
                      name: file.name,
                      path: data?.filePath || "",
                    },
                  ],
                },
              }
            : null
        );

        alert("Assignment submitted successfully!");
      } else {
        alert(
          response.message || "Failed to submit assignment. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Error submitting assignment:", error);
      alert(error?.message || "Failed to submit assignment. Please try again.");
    }
  };

  // Fetch teacher details
  const fetchTeacherDetails = async (teacherId: string) => {
    try {
      setLoadingTeacherDetails(true);
      const response = await secureApiService.getTeacherDetails(teacherId);
      
      if (response.success) {
        setTeacherDetails(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch teacher details");
      }
    } catch (error: any) {
      console.error("Error fetching teacher details:", error);
      alert(error?.message || "Failed to load teacher details. Please try again.");
    } finally {
      setLoadingTeacherDetails(false);
    }
  };

  // Handle teacher name click
  const handleTeacherClick = (teacher: any) => {
    setSelectedTeacher(teacher);
    setShowTeacherModal(true);
    fetchTeacherDetails(teacher.teacherId);
  };

  // Fetch notes for a specific assignment
  const fetchAssignmentNotes = async (assignmentId: string) => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      const backendUrl = "https://khwanzay.school/api";

      const response = await fetch(
        `${backendUrl}/assignments/${assignmentId}/parent-notes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.notes) {
          // Filter notes for this parent
          const myNotes = data.data.notes.filter(
            (note: any) => String(note.parent?.userId) === String(parentUserId)
          );
          setAssignmentNotes(myNotes);
        }
      }
    } catch (error) {
      // console.error('Error fetching assignment notes:', error);
    }
  };

  // Add parent notes to assignment
  const handleAddNotes = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setParentNotes(
      assignment.parentStatus?.notes || assignment.parentNotes || ""
    );
    setShowNotesModal(true);
    // Fetch existing notes with teacher responses
    fetchAssignmentNotes(assignment.id);
  };

  // Download attachment
  const handleDownloadAttachment = async (attachment: any) => {
    try {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");
      const backendUrl = "https://khwanzay.school/api";

      const response = await fetch(
        `${backendUrl}/assignments/attachments/${attachment.id}/file`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Failed to download attachment");
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      alert("Failed to download attachment. Please try again.");
    }
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600 bg-red-100";
      case "HIGH":
        return "text-orange-600 bg-orange-100";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-100";
      case "LOW":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">
          {t("parentPortal.assignments.loading")}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t("parentPortal.assignments.errorLoading")}
        </h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={loadAssignments}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t("parentPortal.assignments.tryAgain")}
        </button>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t("parentPortal.assignments.noAssignments")}
        </h3>
        <p className="text-gray-500 mb-4">
          {t("parentPortal.assignments.noAssignmentsMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      

      {/* advance filter */}
      {/* Advanced Filters - Separate Component */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filter Header */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                activeFilterCount > 0
                  ? "bg-blue-500"
                  : "bg-gray-100 group-hover:bg-gray-200"
              }`}
            >
              <span
                className={`material-icons text-xl ${
                  activeFilterCount > 0 ? "text-white" : "text-gray-600"
                }`}
              >
                filter_list
              </span>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg">
                  {t("parentPortal.assignments.advancedFilters") ||
                    "Advanced Filters"}
                </span>
                {activeFilterCount > 0 && (
                  <span className="px-2.5 py-1 bg-blue-500 text-white rounded-full text-xs font-bold animate-pulse">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {activeFilterCount > 0
                  ? t("parentPortal.assignments.filtersActive", {
                      count: activeFilterCount,
                    }) || `${activeFilterCount} filter(s) active`
                  : t("parentPortal.assignments.clickToFilter") ||
                    "Click to filter assignments"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="material-icons text-sm">clear_all</span>
                {t("parentPortal.assignments.clearAll") || "Clear All"}
              </button>
            )}
            <span
              className={`material-icons text-gray-400 transition-transform duration-300 ${
                showFilters ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          </div>
        </button>

        {/* Filter Options - Collapsible */}
        {showFilters && (
          <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
            <div className="p-6 space-y-6">
              {/* Status Filter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide">
                    <span className="material-icons text-blue-500">
                      assignment
                    </span>
                    {t("parentPortal.assignments.filterByStatus") ||
                      "Assignment Status"}
                  </label>
                  {filters.status.length > 0 && (
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, status: [] }))
                      }
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: "PENDING", icon: "pending", color: "" },
                    { value: "SUBMITTED", icon: "check_circle", color: "" },
                    { value: "GRADED", icon: "grade", color: "" },
                    { value: "OVERDUE", icon: "warning", color: "" },
                  ].map((status) => {
                    const isSelected = filters.status.includes(status.value);
                    return (
                      <button
                        key={status.value}
                        onClick={() =>
                          toggleFilterArray("status", status.value)
                        }
                        className={`
                    relative px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
                    flex items-center justify-center gap-2 border-2
                    ${
                      isSelected
                        ? `bg-${status.color}-500 border-${status.color}-600 text-gray-700 shadow-lg scale-100`
                        : `bg-white border-gray-200 text-gray-700 hover:border-${status.color}-300 hover:bg-${status.color}-50`
                    }
                  `}
                      >
                        <span className="material-icons text-lg">
                          {status.icon}
                        </span>
                        <span>
                          {t(
                            `parentPortal.assignments.statusValues.${status.value.toLowerCase()}`
                          ) || status.value}
                        </span>
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                            <span
                              className={`material-icons text-${status.color}-500 text-sm`}
                            >
                              check
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide">
                  <span className="material-icons text-purple-500">
                    calendar_today
                  </span>
                  {t("parentPortal.assignments.filterByDate") ||
                    "Due Date Range"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    {
                      value: "all",
                      label: "All Dates",
                      icon: "calendar_month",
                    },
                    { value: "overdue", label: "Overdue", icon: "warning" },
                    {
                      value: "thisWeek",
                      label: "This Week",
                      icon: "view_week",
                    },
                    {
                      value: "upcoming",
                      label: "Next 2 Weeks",
                      icon: "upcoming",
                    },
                    {
                      value: "thisMonth",
                      label: "This Month",
                      icon: "date_range",
                    },
                  ].map((option) => {
                    const isSelected = filters.dateRange === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: option.value as any,
                          }))
                        }
                        className={`
                    relative px-3 py-3 rounded-lg font-medium text-sm transition-all duration-200
                    flex items-center justify-center gap-2 border-2
                    ${
                      isSelected
                        ? "text-gray-700 shadow-lg scale-100"
                        : "bg-white border-gray-200 text-gray-700 "
                    }
                  `}
                      >
                        <span className="material-icons text-sm">
                          {option.icon}
                        </span>
                        <span className="hidden sm:inline">
                          {t(
                            `parentPortal.assignments.dateRange.${option.value}`
                          ) || option.label}
                        </span>
                        <span className="sm:hidden">
                          {option.label.split(" ")[0]}
                        </span>
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                            <span className="material-icons text-purple-500 text-sm">
                              check
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide">
                    <span className="material-icons text-orange-500">flag</span>
                    {t("parentPortal.assignments.filterByPriority") ||
                      "Priority Level"}
                  </label>
                  {filters.priority.length > 0 && (
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, priority: [] }))
                      }
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: "URGENT", icon: "priority_high", color: "" },
                    { value: "HIGH", icon: "arrow_upward", color: "" },
                    { value: "MEDIUM", icon: "drag_handle", color: "" },
                    { value: "LOW", icon: "arrow_downward", color: "" },
                  ].map((priority) => {
                    const isSelected = filters.priority.includes(
                      priority.value
                    );
                    return (
                      <button
                        key={priority.value}
                        onClick={() =>
                          toggleFilterArray("priority", priority.value)
                        }
                        className={`
                    relative px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
                    flex items-center justify-center gap-2 border-2
                    ${
                      isSelected
                        ? `bg-${priority.color}-500 border-${priority.color}-600 text-gray-700 shadow-lg scale-100`
                        : `bg-white border-gray-200 text-gray-700 hover:border-${priority.color}-300 hover:bg-${priority.color}-50`
                    }
                  `}
                      >
                        <span className="material-icons text-lg">
                          {priority.icon}
                        </span>
                        <span>{priority.value}</span>
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                            <span
                              className={`material-icons text-${priority.color}-500 text-sm`}
                            >
                              check
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Toggles */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide">
                  <span className="material-icons text-teal-500">bolt</span>
                  {t("parentPortal.assignments.quickFilters") ||
                    "Quick Filters"}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Has Attachments */}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        hasAttachments:
                          prev.hasAttachments === true ? null : true,
                      }))
                    }
                    className={`
                relative px-4 py-4 rounded-lg font-medium text-sm transition-all duration-200
                flex flex-col items-center justify-center gap-2 border-2
                ${
                  filters.hasAttachments === true
                    ? " text-gray-700 shadow-lg scale-100"
                    : "bg-white border-gray-200 text-gray-700"
                }
              `}
                  >
                    <span className="material-icons text-2xl">attach_file</span>
                    <span className="text-xs font-bold">
                      {t("parentPortal.assignments.hasFiles") || "Has Files"}
                    </span>
                    {filters.hasAttachments === true && (
                      <span className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="material-icons text-blue-500 text-sm">
                          check
                        </span>
                      </span>
                    )}
                  </button>

                  {/* Has Submission */}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        hasSubmission:
                          prev.hasSubmission === true ? null : true,
                      }))
                    }
                    className={`
                relative px-4 py-4 rounded-lg font-medium text-sm transition-all duration-200
                flex flex-col items-center justify-center gap-2 border-2
                ${
                  filters.hasSubmission === true
                    ? " text-gray-700 shadow-lg scale-100"
                    : "bg-white border-gray-200 text-gray-700"
                }
              `}
                  >
                    <span className="material-icons text-2xl">
                      assignment_turned_in
                    </span>
                    <span className="text-xs font-bold">
                      {t("parentPortal.assignments.submitted") || "Submitted"}
                    </span>
                    {filters.hasSubmission === true && (
                      <span className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="material-icons text-green-500 text-sm">
                          check
                        </span>
                      </span>
                    )}
                  </button>

                  {/* Has Grade */}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        hasGrade: prev.hasGrade === true ? null : true,
                      }))
                    }
                    className={`
                relative px-4 py-4 rounded-lg font-medium text-sm transition-all duration-200
                flex flex-col items-center justify-center gap-2 border-2
                ${
                  filters.hasGrade === true
                    ? " text-gray-700 shadow-lg scale-100"
                    : "bg-white border-gray-200 text-gray-700"
                }
              `}
                  >
                    <span className="material-icons text-2xl">grade</span>
                    <span className="text-xs font-bold">
                      {t("parentPortal.assignments.graded") || "Graded"}
                    </span>
                    {filters.hasGrade === true && (
                      <span className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="material-icons text-purple-500 text-sm">
                          check
                        </span>
                      </span>
                    )}
                  </button>

                  {/* Not Viewed */}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        parentViewed:
                          prev.parentViewed === false ? null : false,
                      }))
                    }
                    className={`
                relative px-4 py-4 rounded-lg font-medium text-sm transition-all duration-200
                flex flex-col items-center justify-center gap-2 border-2
                ${
                  filters.parentViewed === false
                    ? " text-gray-700 shadow-lg scale-100"
                    : "bg-white border-gray-200 text-gray-700"
                }
              `}
                  >
                    <span className="material-icons text-2xl">
                      visibility_off
                    </span>
                    <span className="text-xs font-bold">
                      {t("parentPortal.assignments.notViewed") || "Not Viewed"}
                    </span>
                    {filters.parentViewed === false && (
                      <span className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="material-icons text-amber-500 text-sm">
                          check
                        </span>
                      </span>
                    )}
                  </button>

                  {/* Needs Action */}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        parentAcknowledged:
                          prev.parentAcknowledged === false ? null : false,
                      }))
                    }
                    className={`
                relative px-4 py-4 rounded-lg font-medium text-sm transition-all duration-200
                flex flex-col items-center justify-center gap-2 border-2
                ${
                  filters.parentAcknowledged === false
                    ? " text-gray-700 shadow-lg scale-100"
                    : "bg-white border-gray-200 text-gray-700"
                }
              `}
                  >
                    <span className="material-icons text-2xl">
                      pending_actions
                    </span>
                    <span className="text-xs font-bold">
                      {t("parentPortal.assignments.needsAction") ||
                        "Needs Action"}
                    </span>
                    {filters.parentAcknowledged === false && (
                      <span className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="material-icons text-red-500 text-sm">
                          check
                        </span>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="material-icons text-white">
                        filter_alt
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {t("parentPortal.assignments.showingResults", {
                          count: filteredAssignments.length,
                        }) ||
                          `Showing ${filteredAssignments.length} assignment(s)`}
                      </div>
                      <div className="text-xs text-gray-600">
                        {activeFilterCount > 0
                          ? `${activeFilterCount} filter(s) applied`
                          : "No filters applied"}
                      </div>
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm flex items-center gap-2"
                    >
                      <span className="material-icons text-sm">refresh</span>
                      {t("parentPortal.assignments.resetAll") || "Reset All"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* advance filter based on subject */}
      {/* Subject Filter - Simple Row List */}
      {selectedStudent && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            {/* All Subjects Button */}
            <button
              onClick={() => setSelectedSubject(null)}
              className={`
          px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
          ${
            selectedSubject === null
              ? "bg-blue-500 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }
        `}
            >
              All ({assignments.length})
            </button>

            {/* Subject Buttons */}
            {[
              ...new Set(
                assignments.map((a) => a.subject?.name).filter(Boolean)
              ),
            ].map((subjectName) => {
              const count = assignments.filter(
                (a) => a.subject?.name === subjectName
              ).length;
              const isSelected = selectedSubject === subjectName;

              return (
                <button
                  key={subjectName}
                  onClick={() => setSelectedSubject(subjectName)}
                  className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${
                isSelected
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
                >
                  {subjectName} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search - Redesigned */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-icons text-gray-400 text-xl">search</span>
          </div>
          <input
            type="text"
            placeholder={
              t("parentPortal.assignments.search") || "Search assignments..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <span className="material-icons text-xl">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Assignments List - Redesigned */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT SIDE - Pending, Overdue, Active */}
        <div className="grid grid-cols-1 gap-4 max-h-[calc(100vh-250px)] overflow-y-auto px-4">
          <div className="sticky top-0 bg-white z-10 pb-2 rounded-lg h-min -mx-4 px-4">
            <h2 className="text-lg font-semibold text-gray-700 pt-2">
              {t("parentPortal.assignments.activeAssignments")}
            </h2>
          </div>
          {filteredAssignments
            .filter((assignment) => {
              const status = assignment.status.toLowerCase();
              return (
                status === "pending" ||
                status === "overdue" ||
                status === "active"
              );
            })
            .map((assignment) => {
              const isOverdue =
                assignment.status === "OVERDUE" || assignment.isOverdue;
              const isSubmitted =
                assignment.status === "SUBMITTED" ||
                assignment.status === "GRADED";
              const hasParentEngagement =
                assignment.parentStatus?.seen || assignment.parentViewed;

              return (
                <div
                  key={assignment.id}
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setShowAssignmentModal(true);
                  }}
                  className={`
              group bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer
              hover:shadow-lg hover:-translate-y-0.5
              ${
                isOverdue && !isSubmitted
                  ? "border-red-200 bg-red-50/30"
                  : "border-gray-200 hover:border-blue-300"
              }
            `}
                >
                  {/* ... rest of your card content ... */}
                  {/* Card Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {assignment.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="material-icons text-sm">book</span>
                          <span className="font-medium">
                            {assignment.subject?.name
                              ? t(
                                  `parentPortal.assignments.subjects.${assignment.subject.name.toLowerCase()}`
                                ) || assignment.subject.name
                              : t("parentPortal.assignments.noSubject")}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>{assignment.className}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={`
                    px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
                    ${
                      isSubmitted
                        ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                        : isOverdue
                        ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                        : "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200"
                    }
                  `}
                        >
                          {t(
                            `parentPortal.assignments.statusValues.${assignment.status.toLowerCase()}`
                          ) || assignment.status}
                        </span>
                        {assignment.priority && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(
                              assignment.priority
                            )}`}
                          >
                            {assignment.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {translateDescription(assignment.description)}
                    </p>

                    {/* Meta Information */}
                    <div className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="material-icons text-sm text-gray-400">
                            event
                          </span>
                          <span
                            className={`font-medium ${
                              isOverdue && !isSubmitted
                                ? "text-red-600"
                                : "text-gray-700"
                            }`}
                          >
                            {formatDate(assignment.dueDate)}
                          </span>
                        </div>
                        {assignment.daysRemaining !== undefined &&
                          !isSubmitted && (
                            <span
                              className={`
                      text-xs font-semibold px-2 py-1 rounded-full
                      ${
                        isOverdue
                          ? "bg-red-100 text-red-700"
                          : assignment.daysRemaining <= 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    `}
                            >
                              {isOverdue
                                ? t("parentPortal.assignments.daysOverdue", {
                                    count: Math.abs(assignment.daysRemaining),
                                  })
                                : t("parentPortal.assignments.daysLeft", {
                                    count: assignment.daysRemaining,
                                  })}
                            </span>
                          )}
                      </div>

                      {assignment.maxScore && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="material-icons text-sm text-gray-400">
                            grade
                          </span>
                          <span className="font-medium text-gray-700">
                            {getMaxScore(assignment.maxScore)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Info (if exists) */}
                  {assignment.submission && (
                    <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <span className="material-icons text-lg">
                            check_circle
                          </span>
                          <span className="font-medium">
                            {t("parentPortal.assignments.submittedOn", {
                              date: formatDate(
                                assignment.submission.submittedAt
                              ),
                            })}
                          </span>
                        </div>
                        {assignment.submission?.score !== undefined && (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-green-700 bg-white px-3 py-1 rounded-full">
                            <span>
                              {assignment.submission.score}/
                              {getMaxScore(assignment.maxScore)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Info Pills */}
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex flex-wrap gap-2">
                      {/* Teacher */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTeacherClick(assignment.teacher);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md text-xs border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer group"
                      >
                        <span className="material-icons text-xs text-gray-400 group-hover:text-blue-600">
                          person
                        </span>
                        <span className="text-gray-600 group-hover:text-blue-700 font-medium">
                          {assignment.teacher.firstName}{" "}
                          {assignment.teacher.lastName}
                        </span>
                      </button>

                      {/* Attachments */}
                      {(assignment.attachments?.length ?? 0) > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md text-xs border border-gray-200">
                          <span className="material-icons text-xs text-gray-400">
                            attach_file
                          </span>
                          <span className="text-gray-600">
                            {assignment.attachments.length} file
                            {assignment.attachments.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {/* Parent Viewed */}
                      {hasParentEngagement && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-md text-xs border border-green-200">
                          <span className="material-icons text-xs text-green-600">
                            visibility
                          </span>
                          <span className="text-green-700 font-medium">
                            {t("parentPortal.assignments.seen")}
                          </span>
                        </div>
                      )}

                      {/* Parent Acknowledged */}
                      {(assignment.parentStatus?.acknowledged ||
                        assignment.parentAcknowledged) && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 rounded-md text-xs border border-blue-200">
                          <span className="material-icons text-xs text-blue-600">
                            verified
                          </span>
                          <span className="text-blue-700 font-medium">
                            {t("parentPortal.assignments.acknowledged")}
                          </span>
                        </div>
                      )}

                      {/* Has Notes */}
                      {(assignment.parentStatus?.notes ||
                        assignment.parentNotes) && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 rounded-md text-xs border border-amber-200">
                          <span className="material-icons text-xs text-amber-600">
                            note
                          </span>
                          <span className="text-amber-700 font-medium">
                            {t("parentPortal.assignments.hasNotes")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-5 py-3 border-t border-gray-200 bg-white rounded-b-xl">
                    <div className="flex items-center gap-2">
                      {!hasParentEngagement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsSeen(assignment.id);
                          }}
                          disabled={markingAsSeen === assignment.id}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 
                               !bg-green-500 !text-white rounded-lg 
                              text-sm font-semibold shadow-sm hover:shadow-md
                              hover:!bg-green-600
                              disabled:opacity-50 disabled:cursor-not-allowed
                              transition-all duration-200"
                        >
                          {markingAsSeen === assignment.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              <span>
                                {t("parentPortal.assignments.marking")}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="material-icons text-lg">
                                visibility
                              </span>
                              <span>
                                {t("parentPortal.assignments.markAsSeen")}
                              </span>
                            </>
                          )}
                        </button>
                      )}

                      {hasParentEngagement &&
                        !(
                          assignment.parentStatus?.acknowledged ||
                          assignment.parentAcknowledged
                        ) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddNotes(assignment);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 
                               !bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white rounded-lg 
                               text-sm font-semibold shadow-sm hover:shadow-md
                               hover:!from-blue-600 hover:!to-blue-700
                               transition-all duration-200"
                          >
                            <span className="material-icons text-lg">
                              verified
                            </span>
                            <span>
                              {t("parentPortal.assignments.acknowledge")}
                            </span>
                          </button>
                        )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddNotes(assignment);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 
                             !bg-white !text-gray-700 rounded-lg border-2 border-gray-200
                             text-sm font-semibold hover:bg-gray-50 hover:border-gray-300
                             transition-all duration-200"
                      >
                        <span className="material-icons text-lg">chat</span>
                        <span className="hidden sm:inline">
                          {t("parentPortal.assignments.addNotes")}
                        </span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAssignment(assignment);
                          setShowAssignmentModal(true);
                        }}
                        className="inline-flex items-center justify-center p-2.5 
                             !bg-white !text-gray-600 rounded-lg border-2 border-gray-200
                             hover:bg-gray-50 hover:border-gray-300 hover:text-blue-600
                             transition-all duration-200"
                      >
                        <span className="material-icons">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* RIGHT SIDE - Submitted, Graded, Completed */}
        <div className="max-h-[calc(100vh-250px)] overflow-y-auto px-4 flex flex-col">
          <div className="sticky top-0 bg-white z-10 pb-2 rounded-lg h-min mb-4">
            <h2 className="text-lg font-semibold text-gray-700 pt-2">
              {t("parentPortal.assignments.completedAssignments")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
          {filteredAssignments
            .filter((assignment) => {
              const status = assignment.status.toLowerCase();
              return (
                status === "submitted" ||
                status === "graded" ||
                status === "completed"
              );
            })
            .map((assignment) => {
              const isOverdue =
                assignment.status === "OVERDUE" || assignment.isOverdue;
              const isSubmitted =
                assignment.status === "SUBMITTED" ||
                assignment.status === "GRADED";
              const hasParentEngagement =
                assignment.parentStatus?.seen || assignment.parentViewed;

              return (
                <div
                  key={assignment.id}
                  onClick={() => {
                    setSelectedAssignment(assignment);
                    setShowAssignmentModal(true);
                  }}
                  className={`group h-min bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5${
                    isOverdue && !isSubmitted
                      ? "border-red-200 bg-red-50/30"
                      : "border-gray-200 hover:border-blue-300"
                  }
            `}
                >
                  {/* ... same card content as left side ... */}
                  {/* Card Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {assignment.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="material-icons text-sm">book</span>
                          <span className="font-medium">
                            {assignment.subject?.name
                              ? t(
                                  `parentPortal.assignments.subjects.${assignment.subject.name.toLowerCase()}`
                                ) || assignment.subject.name
                              : t("parentPortal.assignments.noSubject")}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>{assignment.className}</span>
                        </div>
                      </div> 

                      {/* Status Badge */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={`
                    px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
                    ${
                      isSubmitted
                        ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                        : isOverdue
                        ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                        : "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200"
                    }
                  `}
                        >
                          {t(
                            `parentPortal.assignments.statusValues.${assignment.status.toLowerCase()}`
                          ) || assignment.status}
                        </span>
                        {assignment.priority && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(
                              assignment.priority
                            )}`}
                          >
                            {assignment.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {translateDescription(assignment.description)}
                    </p>

                    {/* Meta Information */}
                    <div className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="material-icons text-sm text-gray-400">
                            event
                          </span>
                          <span
                            className={`font-medium ${
                              isOverdue && !isSubmitted
                                ? "text-red-600"
                                : "text-gray-700"
                            }`}
                          >
                            {formatDate(assignment.dueDate)}
                          </span>
                        </div>
                        {assignment.daysRemaining !== undefined &&
                          !isSubmitted && (
                            <span
                              className={`
                      text-xs font-semibold px-2 py-1 rounded-full
                      ${
                        isOverdue
                          ? "bg-red-100 text-red-700"
                          : assignment.daysRemaining <= 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    `}
                            >
                              {isOverdue
                                ? t("parentPortal.assignments.daysOverdue", {
                                    count: Math.abs(assignment.daysRemaining),
                                  })
                                : t("parentPortal.assignments.daysLeft", {
                                    count: assignment.daysRemaining,
                                  })}
                            </span>
                          )}
                      </div>

                      {assignment.maxScore && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="material-icons text-sm text-gray-400">
                            grade
                          </span>
                          <span className="font-medium text-gray-700">
                            {getMaxScore(assignment.maxScore)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Info (if exists) */}
                  {assignment.submission && (
                    <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <span className="material-icons text-lg">
                            check_circle
                          </span>
                          <span className="font-medium">
                            {t("parentPortal.assignments.submittedOn", {
                              date: formatDate(
                                assignment.submission.submittedAt
                              ),
                            })}
                          </span>
                        </div>
                        {assignment.submission?.score !== undefined && (
                          <div className="flex items-center gap-1.5 text-sm font-bold text-green-700 bg-white px-3 py-1 rounded-full">
                            <span>
                              {assignment.submission.score}/
                              {getMaxScore(assignment.maxScore)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Info Pills */}
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex flex-wrap gap-2">
                      {/* Teacher */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTeacherClick(assignment.teacher);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md text-xs border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer group"
                      >
                        <span className="material-icons text-xs text-gray-400 group-hover:text-blue-600">
                          person
                        </span>
                        <span className="text-gray-600 group-hover:text-blue-700 font-medium">
                          {assignment.teacher.firstName}{" "}
                          {assignment.teacher.lastName}
                        </span>
                      </button>

                      {/* Attachments */}
                      {(assignment.attachments?.length ?? 0) > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md text-xs border border-gray-200">
                          <span className="material-icons text-xs text-gray-400">
                            attach_file
                          </span>
                          <span className="text-gray-600">
                            {assignment.attachments.length} file
                            {assignment.attachments.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {/* Parent Viewed */}
                      {hasParentEngagement && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-md text-xs border border-green-200">
                          <span className="material-icons text-xs text-green-600">
                            visibility
                          </span>
                          <span className="text-green-700 font-medium">
                            {t("parentPortal.assignments.seen")}
                          </span>
                        </div>
                      )}

                      {/* Parent Acknowledged */}
                      {(assignment.parentStatus?.acknowledged ||
                        assignment.parentAcknowledged) && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 rounded-md text-xs border border-blue-200">
                          <span className="material-icons text-xs text-blue-600">
                            verified
                          </span>
                          <span className="text-blue-700 font-medium">
                            {t("parentPortal.assignments.acknowledged")}
                          </span>
                        </div>
                      )}

                      {/* Has Notes */}
                      {(assignment.parentStatus?.notes ||
                        assignment.parentNotes) && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 rounded-md text-xs border border-amber-200">
                          <span className="material-icons text-xs text-amber-600">
                            note
                          </span>
                          <span className="text-amber-700 font-medium">
                            {t("parentPortal.assignments.hasNotes")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-5 py-3 border-t border-gray-200 bg-white rounded-b-xl">
                    <div className="flex items-center gap-2">
                      {!hasParentEngagement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsSeen(assignment.id);
                          }}
                          disabled={markingAsSeen === assignment.id}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 
                               bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg 
                               text-sm font-semibold shadow-sm hover:shadow-md
                               hover:from-green-600 hover:to-green-700
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-200"
                        >
                          {markingAsSeen === assignment.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              <span>
                                {t("parentPortal.assignments.marking")}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="material-icons text-lg">
                                visibility
                              </span>
                              <span>
                                {t("parentPortal.assignments.markAsSeen")}
                              </span>
                            </>
                          )}
                        </button>
                      )}

                      {hasParentEngagement &&
                        !(
                          assignment.parentStatus?.acknowledged ||
                          assignment.parentAcknowledged
                        ) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddNotes(assignment);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 
                               !bg-gradient-to-r !from-blue-500 !to-blue-600 !text-white rounded-lg 
                               text-sm font-semibold shadow-sm hover:shadow-md
                               hover:!from-blue-600 hover:!to-blue-700
                               transition-all duration-200"
                          >
                            <span className="material-icons text-lg">
                              verified
                            </span>
                            <span>
                              {t("parentPortal.assignments.acknowledge")}
                            </span>
                          </button>
                        )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddNotes(assignment);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 
                             !bg-white !text-gray-700 rounded-lg border-2 border-gray-200
                             text-sm font-semibold hover:bg-gray-50 hover:border-gray-300
                             transition-all duration-200"
                      >
                        <span className="material-icons text-lg">chat</span>
                        <span className="hidden sm:inline">
                          {t("parentPortal.assignments.addNotes")}
                        </span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAssignment(assignment);
                          setShowAssignmentModal(true);
                        }}
                        className="inline-flex items-center justify-center p-2.5 
                             !bg-white !text-gray-600 rounded-lg border-2 border-gray-200
                             hover:bg-gray-50 hover:border-gray-300 hover:text-blue-600
                             transition-all duration-200"
                      >
                        <span className="material-icons">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-4xl text-gray-400">
                assignment
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("parentPortal.assignments.noAssignments") ||
                "No assignments found"}
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? t("parentPortal.assignments.tryDifferentSearch") ||
                  "Try a different search term"
                : t("parentPortal.assignments.noAssignmentsYet") ||
                  "There are no assignments at this time"}
            </p>
          </div>
        </div>
      )}

      {/* Assignment Detail Modal - Redesigned */}
      {showAssignmentModal && selectedAssignment && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setShowAssignmentModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-blue-500 text-white px-6 py-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-2xl">assignment</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {t("parentPortal.assignments.assignmentDetails")}
                  </h2>
                  <p className="text-sm text-blue-100">
                    {selectedAssignment.subject?.name || "Assignment"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="p-6 space-y-6">
                {/* Title & Key Info */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {selectedAssignment.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-blue-600">
                          person
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">
                          {t("parentPortal.assignments.teacher")}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {selectedAssignment.teacher.firstName}{" "}
                          {selectedAssignment.teacher.lastName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-purple-600">
                          event
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">
                          {t("parentPortal.assignments.dueDate")}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDate(selectedAssignment.dueDate)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-green-600">
                          grade
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">
                          {t("parentPortal.assignments.maxScore")}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {getMaxScore(selectedAssignment.maxScore)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <span className="material-icons text-amber-600">
                          flag
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">
                          {t("parentPortal.assignments.status")}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {t(
                            `parentPortal.assignments.statusValues.${selectedAssignment.status.toLowerCase()}`
                          ) || selectedAssignment.status}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="material-icons text-lg">description</span>
                    {t("parentPortal.assignments.description")}
                  </h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {translateDescription(selectedAssignment.description)}
                  </p>
                </div>

                {/* Attachments */}
                {(selectedAssignment.attachments?.length ?? 0) > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="material-icons text-lg">
                        attach_file
                      </span>
                      {t("parentPortal.assignments.attachments")} (
                      {selectedAssignment.attachments.length})
                    </h4>
                    <div className="grid gap-2">
                      {(selectedAssignment.attachments || []).map(
                        (attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <span className="material-icons text-blue-500">
                                  insert_drive_file
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {attachment.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(attachment.size / 1024).toFixed(1)} KB
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDownloadAttachment(attachment)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                              {t("parentPortal.assignments.download") ||
                                "Download"}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Submission Status */}
                <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <span className="material-icons text-lg">
                        assignment_turned_in
                      </span>
                      {t("parentPortal.assignments.submissionStatus") ||
                        "Submission Status"}
                    </h4>
                  </div>

                  <div className="p-5 space-y-3">
                    {selectedAssignment.submission ? (
                      <>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-3">
                            <span className="material-icons text-green-500 text-2xl">
                              check_circle
                            </span>
                            <div>
                              <div className="text-sm font-bold text-green-700">
                                {t("parentPortal.assignments.submitted") ||
                                  "Submitted"}
                              </div>
                              <div className="text-xs text-green-600">
                                {formatDate(
                                  selectedAssignment.submission.submittedAt
                                )}
                              </div>
                            </div>
                          </div>
                          {selectedAssignment.submission?.score !==
                            undefined && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-700">
                                {selectedAssignment.submission.score}/
                                {getMaxScore(selectedAssignment.maxScore)}
                              </div>
                              <div className="text-xs text-green-600">
                                {t("parentPortal.assignments.score")}
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedAssignment.submission.feedback && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-3">
                              <span className="material-icons text-blue-500">
                                feedback
                              </span>
                              <div className="flex-1">
                                <div className="text-xs font-bold text-blue-700 mb-1">
                                  {t(
                                    "parentPortal.assignments.teacherFeedback"
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 italic">
                                  {selectedAssignment.submission.feedback}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center p-6 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                          <div className="text-center">
                            <span className="material-icons text-yellow-500 text-3xl mb-2">
                              pending_actions
                            </span>
                            <div className="text-sm font-semibold text-yellow-700">
                              {selectedAssignment.isOverdue
                                ? t(
                                    "parentPortal.assignments.notSubmittedOverdue"
                                  ) || "Not Submitted (Overdue)"
                                : t("parentPortal.assignments.notSubmitted") ||
                                  "Not Yet Submitted"}
                            </div>
                            {selectedAssignment.daysRemaining !== undefined && (
                              <div className="text-xs text-yellow-600 mt-1">
                                {selectedAssignment.isOverdue
                                  ? `${Math.abs(
                                      selectedAssignment.daysRemaining
                                    )} days overdue`
                                  : `${selectedAssignment.daysRemaining} days remaining`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* File Upload Section */}
                        {/* Sends POST to API /assignments/{assignmentId}/submit */}
                        {/* <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <label className="block text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <span className="material-icons text-lg">
                              upload_file
                            </span>
                            {t("parentPortal.assignments.submitAssignment") ||
                              "Submit Assignment"}
                          </label>
                          
                          <div className="space-y-3">
                            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-white hover:bg-blue-50 transition-colors">
                              <input
                                type="file"
                                id={`file-input-${selectedAssignment.id}`}
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleSubmitAssignment(e.target.files[0]);
                                  }
                                }}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                              />
                              <label
                                htmlFor={`file-input-${selectedAssignment.id}`}
                                className="cursor-pointer text-center block"
                              >
                                <div className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700">
                                  <span className="material-icons">
                                    cloud_upload
                                  </span>
                                  <span className="text-sm font-medium">
                                    {t(
                                      "parentPortal.assignments.clickToUpload"
                                    ) || "Click to upload or drag and drop"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  PDF, DOC, XLS, PPT, JPG, PNG up to 25MB
                                </p>
                              </label>
                            </div>

                            <button
                              onClick={() => {
                                document.getElementById(
                                  `file-input-${selectedAssignment.id}`
                                )?.click();
                              }}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <span className="material-icons text-sm">
                                add_circle
                              </span>
                              {t(
                                "parentPortal.assignments.selectFile"
                              ) || "Select File to Submit"}
                            </button>
                          </div>
                        </div> */}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parent Notes Modal - Redesigned */}
      {showNotesModal && selectedAssignment && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowNotesModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-blue-500 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-2xl">chat</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {t("parentPortal.assignments.assignmentNotes")}
                  </h2>
                  <p className="text-sm text-blue-100 line-clamp-1">
                    {selectedAssignment.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotesModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-6 space-y-4">
              {/* Previous Notes */}
              {assignmentNotes.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    {t("parentPortal.assignments.conversationHistory") ||
                      "Conversation History"}
                  </h4>
                  <div className="space-y-3">
                    {assignmentNotes.map((note) => (
                      <div key={note.id} className="space-y-2">
                        {/* Parent Note */}
                        <div className="flex justify-end">
                          <div className="max-w-[80%]">
                            <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                              <p className="text-sm">{note.note}</p>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 text-right">
                              {new Date(note.createdAt).toLocaleDateString()}{" "}
                              {new Date(note.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Teacher Response */}
                        {note.teacherResponse ? (
                          <div className="flex justify-start">
                            <div className="max-w-[80%]">
                              <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-3">
                                <div className="text-xs font-semibold text-blue-600 mb-1">
                                  {note.teacherResponder?.firstName}{" "}
                                  {note.teacherResponder?.lastName}
                                </div>
                                <p className="text-sm">
                                  {note.teacherResponse}
                                </p>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(
                                  note.teacherResponseAt
                                ).toLocaleDateString()}{" "}
                                {new Date(
                                  note.teacherResponseAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-start">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
                              <span className="material-icons text-xs mr-1">
                                schedule
                              </span>
                              {t("parentPortal.assignments.awaitingResponse") ||
                                "Awaiting teacher response..."}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Note Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t("parentPortal.assignments.writeNewMessage") ||
                    "Write a new message"}
                </label>
                <textarea
                  value={parentNotes}
                  onChange={(e) => setParentNotes(e.target.value)}
                  placeholder={
                    t("parentPortal.assignments.messageTeacher") ||
                    "Type your message to the teacher..."
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         resize-none transition-all"
                  rows={4}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold 
                       hover:bg-gray-100 transition-colors"
              >
                {t("parentPortal.assignments.cancel")}
              </button>
              <button
                onClick={() =>
                  handleAcknowledgeAssignment(selectedAssignment.id)
                }
                disabled={acknowledging === selectedAssignment.id}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl 
                       font-semibold shadow-sm hover:shadow-md hover:bg-blue-600
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                       transition-all"
              >
                {acknowledging === selectedAssignment.id ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>{t("parentPortal.assignments.sending")}</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons">send</span>
                    <span>
                      {t("parentPortal.assignments.sendAndAcknowledge") ||
                        "Send & Acknowledge"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Details Modal */}
      {showTeacherModal && selectedTeacher && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setShowTeacherModal(false);
            setSelectedTeacher(null);
            setTeacherDetails(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-icons text-blue-600">person</span>
                  {t("parentPortal.assignments.teacherDetails") || "Teacher Details"}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTeacherModal(false);
                    setSelectedTeacher(null);
                    setTeacherDetails(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors z-10 relative"
                >
                  <span className="material-icons text-gray-600">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingTeacherDetails ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                  <p className="text-gray-600">
                    {t("parentPortal.assignments.loadingTeacherDetails") || "Loading teacher details..."}
                  </p>
                </div>
              ) : teacherDetails ? (
                <div className="space-y-6">
                  {/* Teacher Basic Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="material-icons text-2xl text-blue-600">person</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">
                        {teacherDetails.user?.firstName || selectedTeacher?.firstName}{" "}
                        {teacherDetails.user?.lastName || selectedTeacher?.lastName}
                      </h4>
                      <p className="text-gray-600">
                        {teacherDetails.user?.email || "Email not available"}
                      </p>
                      {teacherDetails.user?.phone && (
                        <p className="text-gray-600">{teacherDetails.user.phone}</p>
                      )}
                     
                    </div>
                  </div>

                  {/* School Information */}
                  {teacherDetails.school && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="material-icons text-sm">school</span>
                        {t("parentPortal.assignments.school") || "School"}
                      </h5>
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <p className="font-medium text-gray-800">{teacherDetails.school.name}</p>
                        <p className="text-sm text-gray-600">Code: {teacherDetails.school.code}</p>
                        {teacherDetails.school.shortName && (
                          <p className="text-xs text-gray-500">Short: {teacherDetails.school.shortName}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Professional Information */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="material-icons text-sm">work</span>
                      {t("parentPortal.assignments.professionalInfo") || "Professional Information"}
                    </h5>
                    <div className="space-y-3">
                      {teacherDetails.qualification && (
                        <div className="p-3 bg-white border border-gray-200 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {t("parentPortal.assignments.qualification") || "Qualification"}
                          </p>
                          <p className="text-gray-800">{teacherDetails.qualification}</p>
                        </div>
                      )}
                      {teacherDetails.specialization && (
                        <div className="p-3 bg-white border border-gray-200 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {t("parentPortal.assignments.specialization") || "Specialization"}
                          </p>
                          <p className="text-gray-800">{teacherDetails.specialization}</p>
                        </div>
                      )}
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {t("parentPortal.assignments.experience") || "Experience"}
                        </p>
                        <p className="text-gray-800">
                          {teacherDetails.experience} {teacherDetails.experience === 1 ? "year" : "years"}
                        </p>
                      </div>
                      {teacherDetails.joiningDate && (
                        <div className="p-3 bg-white border border-gray-200 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {t("parentPortal.assignments.joiningDate") || "Joining Date"}
                          </p>
                          <p className="text-gray-800">
                            {new Date(teacherDetails.joiningDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {t("parentPortal.assignments.classTeacher") || "Class Teacher"}
                        </p>
                        <p className="text-gray-800">
                          {teacherDetails.isClassTeacher ? 
                            (t("parentPortal.assignments.yes") || "Yes") : 
                            (t("parentPortal.assignments.no") || "No")
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Teaching Subjects */}
                  {teacherDetails.subjects && teacherDetails.subjects.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="material-icons text-sm">book</span>
                        {t("parentPortal.assignments.teachingSubjects") || "Teaching Subjects"}
                      </h5>
                      <div className="grid grid-cols-1 gap-2">
                        {teacherDetails.subjects.map((subject: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                            <span className="material-icons text-sm text-blue-600">school</span>
                            <div>
                              <p className="font-medium text-gray-800">{subject.name}</p>
                              {subject.code && (
                                <p className="text-xs text-gray-600">Code: {subject.code}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Classes */}
                  {teacherDetails.classes && teacherDetails.classes.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="material-icons text-sm">groups</span>
                        {t("parentPortal.assignments.assignedClasses") || "Assigned Classes"}
                      </h5>
                      <div className="grid grid-cols-1 gap-2">
                        {teacherDetails.classes.map((classItem: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                            <span className="material-icons text-sm text-green-600">class</span>
                            <div>
                              <p className="font-medium text-gray-800">{classItem.name} {classItem.code}</p>
                              {classItem.grade && (
                                <p className="text-xs text-gray-600">Grade: {classItem.grade}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Department */}
                  {teacherDetails.department && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="material-icons text-sm">business</span>
                        {t("parentPortal.assignments.department") || "Department"}
                      </h5>
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <p className="text-gray-800">{teacherDetails.department.name || "Department info"}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="material-icons text-4xl text-gray-400 mb-4">error</span>
                  <p className="text-gray-600">
                    {t("parentPortal.assignments.noTeacherDetails") || "No teacher details available"}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTeacherModal(false);
                  setSelectedTeacher(null);
                  setTeacherDetails(null);
                }}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
              >
                {t("parentPortal.assignments.close") || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Assignments;
