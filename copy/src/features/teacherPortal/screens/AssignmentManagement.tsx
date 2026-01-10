import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../../../services/secureApiService";
import { useAuth } from "../../../contexts/AuthContext";
import { useTeacherClasses, TeacherClass } from "../hooks/useTeacherClasses";
import AssignmentForm from "../components/AssignmentForm";

interface AssignmentData {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  classId: string;
  className: string;
  subject: string;
  status: "draft" | "active" | "completed" | "overdue";
  submissions: number;
  totalStudents: number;
  createdAt: string;
  maxScore?: number;
  weight?: number;
  type?: string;
  attachments?: Array<{
    id: string;
    name: string;
    path: string;
    mimeType: string;
    size: number;
  }>;
  submissionStats?: {
    totalStudents: number;
    submittedCount: number;
    gradedCount: number;
    submissionRate: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  };
  parentViews?: {
    totalParents: number;
    viewedCount: number;
    viewRate: number;
  };
  analytics?: {
    views: number;
    downloads: number;
    engagement: number;
  };
}

const AssignmentManagement: React.FC = () => {
  const { t, i18n, ready } = useTranslation();

  // Debug: Log translation status
  useEffect(() => {
    console.log("🔍 AssignmentManagement - Current language:", i18n.language);
    console.log("🔍 AssignmentManagement - Translations ready:", ready);
    console.log(
      "🔍 AssignmentManagement - teacherPortal.assignments.title:",
      t("teacherPortal.assignments.title")
    );
    console.log(
      "🔍 AssignmentManagement - teacherPortal.assignments.subtitle:",
      t("teacherPortal.assignments.subtitle")
    );
    console.log(
      "🔍 AssignmentManagement - teacherPortal.assignments.createAssignment:",
      t("teacherPortal.assignments.createAssignment")
    );
  }, [t, i18n.language, ready]);

  // Show loading if translations are not ready
  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <span className="material-icons text-4xl sm:text-5xl lg:text-6xl text-gray-400 mb-4 animate-spin">
          hourglass_empty
        </span>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          {t("teacherPortal.common.loading")}
        </p>
      </div>
    );
  }

  const getAssignmentTypeTranslation = (type: string) => {
    const typeMap: { [key: string]: string } = {
      HOMEWORK: "homework",
      PROJECT: "project",
      QUIZ: "quiz",
      EXAM: "exam",
      LAB_REPORT: "labReport",
      ESSAY: "essay",
      PRESENTATION: "presentation",
      RESEARCH_PAPER: "researchPaper",
      OTHER: "other",
    };
    const translation = t(
      `teacherPortal.assignments.${typeMap[type] || "other"}`
    );
    // If translation returns the key itself, return a fallback
    return translation.startsWith("teacherPortal.assignments.")
      ? typeMap[type] || type
      : translation;
  };
  const { user } = useAuth();
  const teacherId = (user?.teacherId ||
    localStorage.getItem("teacherId") ||
    "") as string;
  const { classes, isLoading, error, refreshClasses } =
    useTeacherClasses(teacherId);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<AssignmentData | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [statusChangeLoading, setStatusChangeLoading] = useState<string | null>(
    null
  );
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [selectedAssignmentForDetails, setSelectedAssignmentForDetails] =
    useState<AssignmentData | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [bulkActions, setBulkActions] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [parentNotes, setParentNotes] = useState<any[]>([]);
  const [loadingParentNotes, setLoadingParentNotes] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedNoteForResponse, setSelectedNoteForResponse] =
    useState<any>(null);
  const [teacherResponse, setTeacherResponse] = useState("");

  // New state for subject filtering and student management
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentData | null>(null);
  const [assignmentStudents, setAssignmentStudents] = useState<Array<any>>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [showStudentListModal, setShowStudentListModal] =
    useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDetailModal, setShowStudentDetailModal] =
    useState<boolean>(false);
  const [studentSubmission, setStudentSubmission] = useState<any>(null);
  const [loadingSubmission, setLoadingSubmission] = useState<boolean>(false);
  const [studentAssignmentState, setStudentAssignmentState] =
    useState<any>(null);

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: "",
    classId: "",
    subjectId: "",
    maxScore: 100,
    weight: 1,
    type: "HOMEWORK",
    attachments: [] as File[],
    instructions: "",
    rubric: "",
    allowLateSubmission: false,
    latePenalty: 0,
    notifyParents: true,
    requireParentAcknowledgment: false,
  });

  // Choose first class when classes load
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
      setNewAssignment((prev) => ({ ...prev, classId: String(classes[0].id) }));
    }
  }, [classes, selectedClass]);

  // Fallback: if no classes from dashboard, fetch classes for this teacher
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (classes.length > 0) return;
      if (!user?.id) return;
      try {
        const res = await api.get<any>(`/classes/teacher/${user.id}`);
        const list = Array.isArray(res.data) ? res.data : [];
        const mapped = list.map((c: any) => ({
          id: String(c.id),
          name: c.name ?? `${c.level ?? ""}${c.section ? "-" + c.section : ""}`,
          level: String(c.level ?? ""),
          section: c.section ?? "",
          subject: "",
          students: c._count?.students ?? 0,
          averageGrade: 0,
          attendanceRate: 0,
          assignments: 0,
          exams: 0,
        }));
        if (mapped.length > 0) {
          // Keep current selectedClass type intact; only set classId for new assignment
          setNewAssignment((prev) => ({ ...prev, classId: mapped[0].id }));
        }
      } catch (e) {
        // ignore
      }
    };
    fetchTeacherClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, classes.length]);

  useEffect(() => {
    // Load assignments for selected class from backend
    const fetchAssignments = async () => {
      if (!selectedClass) {
        setAssignments([]);
        return;
      }
      try {
        setLoadingAssignments(true);

        // Get current logged-in teacher's ID
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const teacherId =
          user?.teacherId || localStorage.getItem("teacherId") || user?.id;

        if (!teacherId) {
          console.warn("⚠️ No teacher ID found, cannot filter assignments");
          setAssignments([]);
          return;
        }

        // Filter assignments by both class and teacher ID to show only logged-in teacher's assignments
        const res = await api.getAssignments({
          classId: selectedClass.id,
          teacherId: teacherId,
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        const list = Array.isArray(res.data) ? res.data : [];

        const toISODate = (value: any) => {
          try {
            if (!value) return new Date().toISOString().split("T")[0];
            const d = new Date(value as any);
            if (isNaN(d.getTime()))
              return new Date().toISOString().split("T")[0];
            return d.toISOString().split("T")[0];
          } catch {
            return new Date().toISOString().split("T")[0];
          }
        };

        const mapped: AssignmentData[] = list.map((a: any) => ({
          id: String(a.id ?? a.uuid ?? Math.random()),
          title: a.title ?? "Untitled",
          description: a.description ?? "",
          dueDate: toISODate(a.dueDate),
          classId: String(a.classId ?? selectedClass.id),
          className: String(a.class?.name ?? (selectedClass as any).name ?? ""),
          subject: String(a.subject?.name ?? a.subjectName ?? ""),
          status: (a.status ?? "active") as any,
          submissions: a._count?.submissions ?? a.submissionsCount ?? 0,
          totalStudents:
            a.class?._count?.students ??
            (selectedClass as any)._count?.students ??
            0,
          createdAt: toISODate(a.createdAt),
          maxScore: a.maxScore ? Number(a.maxScore) : 100,
          weight: a.weight ? Number(a.weight) : 1,
          type: a.type ?? "HOMEWORK",
          attachments: a.attachments ?? [],
          submissionStats: a.submissionStats ?? {
            totalStudents: Number(a.class?._count?.students ?? 0),
            submittedCount: Number(a._count?.submissions ?? 0),
            gradedCount: Number(a._count?.gradedSubmissions ?? 0),
            submissionRate: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
          },
          parentViews: a.parentViews ?? {
            totalParents: Number(a.class?._count?.parents ?? 0),
            viewedCount: Number(a._count?.parentViews ?? 0),
            viewRate: 0,
          },
          analytics: a.analytics ?? {
            views: Number(a._count?.views ?? 0),
            downloads: Number(a._count?.downloads ?? 0),
            engagement: 0,
          },
        }));
        setAssignments(mapped);
      } catch (e) {
        // Fallback to empty state on error
        setAssignments([]);
      } finally {
        setLoadingAssignments(false);
      }
    };

    fetchAssignments();
  }, [selectedClass]);

  // Fetch subjects for selected class (only subjects this teacher teaches)
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) {
        setSubjects([]);
        return;
      }
      if (!teacherId) {
        setSubjects([]);
        return;
      }
      try {
        // Pass teacherId to only get subjects this teacher is assigned to teach
        const res: any = await api.get(
          `/classes/${selectedClass.id}/subjects?teacherId=${teacherId}`
        );
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.subjects || [];
        const mapped = data.map((s: any) => ({
          id: String(s.id),
          name: s.name || s.code || `Subject ${s.id}`,
        }));
        setSubjects(mapped);
        if (mapped.length > 0) {
          setNewAssignment((prev) => ({ ...prev, subjectId: mapped[0].id }));
        } else {
          console.log("No subjects found for this teacher in this class");
        }
      } catch (e) {
        console.error("Error fetching subjects:", e);
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [selectedClass, teacherId]);

  const handleClassSelect = (classData: TeacherClass) => {
    setSelectedClass(classData);
    setNewAssignment((prev) => ({ ...prev, classId: String(classData.id) }));
  };

  const handleCreateAssignment = async () => {
    // Minimal validation with user feedback
    const missing: string[] = [];
    if (!newAssignment.title || !newAssignment.title.trim())
      missing.push("title");
    if (!selectedClass) missing.push("class");
    if (!newAssignment.subjectId) missing.push("subject");

    if (missing.length > 0) {
      alert(
        `Please fill the required fields before creating an assignment: ${missing.join(
          ", "
        )}`
      );
      return;
    }

    try {
      // Ensure description meets backend minimum length (>=10)
      const safeDescription =
        newAssignment.description &&
        newAssignment.description.trim().length >= 10
          ? newAssignment.description.trim()
          : `${newAssignment.title.trim()} assignment for class ${
              (selectedClass as any).name
            }.`;

      // Determine due date: if user didn't pick one, default to tomorrow end-of-day
      let dueDateISO: string;
      if (!newAssignment.dueDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 0, 0);
        dueDateISO = tomorrow.toISOString();
      } else {
        const selectedDate = new Date(newAssignment.dueDate);
        selectedDate.setHours(23, 59, 0, 0);
        const now = new Date();
        if (selectedDate.getTime() <= now.getTime()) {
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          tomorrow.setHours(23, 59, 0, 0);
          dueDateISO = tomorrow.toISOString();
        } else {
          dueDateISO = selectedDate.toISOString();
        }
      }

      const payload = {
        title: newAssignment.title.trim(),
        description: safeDescription,
        dueDate: dueDateISO,
        classId: Number(selectedClass.id),
        teacherId: Number(teacherId),
        subjectId: Number(newAssignment.subjectId),
        maxScore: Number(newAssignment.maxScore) || 100,
        type: newAssignment.type as any,
        weight: Number(newAssignment.weight) || 1,
      };

      console.log("Creating assignment with payload:", payload);
      const res = await api.createAssignment(payload);

      if (res?.success || res?.data) {
        // Refresh list
        setShowCreateModal(false);
        setNewAssignment({
          title: "",
          description: "",
          dueDate: "",
          classId: String(selectedClass.id),
          subjectId: subjects[0]?.id || "",
          maxScore: 100,
          weight: 1,
          type: "HOMEWORK",
          attachments: [],
          instructions: "",
          rubric: "",
          allowLateSubmission: false,
          latePenalty: 0,
          notifyParents: true,
          requireParentAcknowledgment: false,
        });
        // Trigger reload
        setSelectedClass({ ...selectedClass });
      } else {
        // Show backend message when available
        console.error("Create assignment failed:", res);
        alert(
          `Failed to create assignment: ${res?.message || "Unknown error"}`
        );
      }
    } catch (e: any) {
      console.error("Error creating assignment:", e);
      const errorMessage =
        e?.response?.data?.message ||
        e?.message ||
        "An unexpected error occurred";
      alert(`Failed to create assignment: ${errorMessage}`);
    }
  };

  const handleEdit = (assignment: AssignmentData) => {
    setEditingAssignment(assignment);
    setShowCreateModal(true);
    // Pre-populate the form with assignment data
    setNewAssignment({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate
        ? new Date(assignment.dueDate).toISOString().split("T")[0]
        : "",
      classId: assignment.classId,
      subjectId: assignment.subject || "",
      maxScore: assignment.maxScore || 100,
      weight: assignment.weight || 1,
      type: assignment.type || "HOMEWORK",
      attachments: [],
      instructions: "",
      rubric: "",
      allowLateSubmission: false,
      latePenalty: 0,
      notifyParents: true,
      requireParentAcknowledgment: false,
    });
  };

  const handleUpdateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.dueDate || !editingAssignment)
      return;
    try {
      const selectedDate = new Date(newAssignment.dueDate);
      selectedDate.setHours(23, 59, 0, 0);
      const dueDateISO = selectedDate.toISOString();

      const payload = {
        title: newAssignment.title,
        description:
          newAssignment.description || `${newAssignment.title} assignment.`,
        dueDate: dueDateISO,
        maxScore: Number(newAssignment.maxScore) || 100,
        type: newAssignment.type,
      };

      const res = await api.updateAssignment(editingAssignment.id, payload);
      if (res?.success) {
        setShowCreateModal(false);
        setEditingAssignment(null);
        setNewAssignment({
          title: "",
          description: "",
          dueDate: "",
          classId: String(selectedClass?.id || ""),
          subjectId: subjects[0]?.id || "",
          maxScore: 100,
          weight: 1,
          type: "HOMEWORK",
          attachments: [],
          instructions: "",
          rubric: "",
          allowLateSubmission: false,
          latePenalty: 0,
          notifyParents: true,
          requireParentAcknowledgment: false,
        });
        // Trigger reload
        if (selectedClass) {
          setSelectedClass({ ...selectedClass });
        }
      }
    } catch (e) {
      console.error("Error updating assignment:", e);
    }
  };

  const handleStatusChange = async (
    assignmentId: string,
    newStatus: string
  ) => {
    try {
      setStatusChangeLoading(assignmentId);
      console.log("Updating assignment status:", { assignmentId, newStatus });
      const response = await api.updateAssignmentStatus(
        assignmentId,
        newStatus
      );

      if (response.success) {
        // Update the assignment in the local state
        setAssignments((prev) =>
          prev.map((assignment) =>
            assignment.id === assignmentId
              ? { ...assignment, status: newStatus as any }
              : assignment
          )
        );
      } else {
        console.error("Status update failed:", response);
        alert(
          `Failed to update assignment status: ${
            response.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error updating assignment status:", error);
      alert("Failed to update assignment status");
    } finally {
      setStatusChangeLoading(null);
    }
  };

  const handleViewAssignmentDetails = async (assignment: AssignmentData) => {
    try {
      // Fetch comprehensive assignment details
      const response = await api.get(`/assignments/${assignment.id}/details`);
      if (response.success) {
        setSelectedAssignmentForDetails({
          ...assignment,
          ...(response.data as any).assignment,
          className: String(
            (response.data as any).assignment?.class?.name ||
              (response.data as any).assignment?.className ||
              assignment.className ||
              ""
          ),
          subject: String(
            (response.data as any).assignment?.subject?.name ||
              (response.data as any).assignment?.subject ||
              assignment.subject ||
              ""
          ),
          submissionStats: (response.data as any).statistics,
          analytics: (response.data as any).analytics,
        });
        setShowAdvancedModal(true);
        // Fetch parent notes for this assignment
        fetchParentNotes(assignment.id);
      }
    } catch (error) {
      console.error("Error fetching assignment details:", error);
      // Fallback to basic details
      setSelectedAssignmentForDetails(assignment);
      setShowAdvancedModal(true);
      // Fetch parent notes for this assignment
      fetchParentNotes(assignment.id);
    }
  };

  const handleViewAnalytics = async (assignment: AssignmentData) => {
    try {
      const response = await api.get(
        `/assignments/analytics?assignmentId=${assignment.id}`
      );
      if (response.success) {
        setAnalyticsData(response.data);
        setShowAnalyticsModal(true);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      alert("Failed to load analytics data");
    }
  };

  const handleBulkAction = async (action: string, assignmentIds: string[]) => {
    try {
      let response;
      switch (action) {
        case "delete":
          response = await api.post("/assignments/bulk/delete", {
            assignmentIds,
          });
          break;
        case "activate":
          response = await api.post("/assignments/bulk/update", {
            assignmentIds,
            updateData: { status: "active" },
          });
          break;
        case "complete":
          response = await api.post("/assignments/bulk/update", {
            assignmentIds,
            updateData: { status: "completed" },
          });
          break;
        default:
          throw new Error("Invalid bulk action");
      }

      if (response.success) {
        // Refresh assignments
        setSelectedClass({ ...selectedClass });
        setBulkActions([]);
        setShowBulkModal(false);
        alert(`Successfully ${action}d ${assignmentIds.length} assignments`);
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      alert("Failed to perform bulk action");
    }
  };

  const handleExportAssignments = async (assignmentIds?: string[]) => {
    try {
      const params = assignmentIds
        ? `?assignmentIds=${assignmentIds.join(",")}`
        : "";
      const response = await api.get(`/assignments/export${params}`, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(
        new Blob([response.data as BlobPart])
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `assignments-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error exporting assignments:", error);
      alert("Failed to export assignments");
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      const token = localStorage.getItem("userToken") || 
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

  const handleNotifyParents = async (assignmentId: string) => {
    try {
      const response = await api.post(
        `/assignments/${assignmentId}/notify-parents`
      );
      if (response.success) {
        alert("Parents have been notified successfully");
      }
    } catch (error) {
      console.error("Error notifying parents:", error);
      alert("Failed to notify parents");
    }
  };

  // Mark student submission as submitted/unsubmitted
  const handleMarkSubmission = async (student: any, isSubmitted: boolean) => {
    if (!selectedAssignment || !student.submission?.id) {
      alert("No submission found for this student");
      return;
    }

    try {
      const response = await api.markStudentSubmission(
        selectedAssignment.id,
        student.submission.id,
        isSubmitted
      );

      if (response.success) {
        // Update the local state
        setAssignmentStudents((prev) =>
          prev.map((s) =>
            s.id === student.id
              ? {
                  ...s,
                  submissionStatus: isSubmitted ? "submitted" : "not_submitted",
                  submissionDate: isSubmitted ? new Date().toISOString() : null,
                  submission: isSubmitted ? {
                    ...s.submission,
                    submittedAt: new Date().toISOString()
                  } : null
                }
              : s
          )
        );
        
        alert(`Student submission ${isSubmitted ? 'marked' : 'unmarked'} successfully!`);
      } else {
        alert(`Failed to ${isSubmitted ? 'mark' : 'unmark'} submission: ${response.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("Error marking submission:", error);
      alert(`Failed to ${isSubmitted ? 'mark' : 'unmark'} submission: ${error?.message || 'Unknown error'}`);
    }
  };

  const fetchParentNotes = async (assignmentId: string) => {
    try {
      setLoadingParentNotes(true);
      const response = await api.get(
        `/assignments/${assignmentId}/parent-notes`
      );
      if (response.success && response.data) {
        setParentNotes((response.data as any).notes || []);
      }
    } catch (error) {
      console.error("Error fetching parent notes:", error);
    } finally {
      setLoadingParentNotes(false);
    }
  };

  const handleRespondToNote = async () => {
    if (!selectedNoteForResponse || !teacherResponse.trim()) {
      alert("Please enter a response");
      return;
    }

    try {
      // Bypass encryption for teacher response endpoint
      const response = await api.post(
        `/assignments/parent-notes/${selectedNoteForResponse.id}/respond`,
        {
          response: teacherResponse,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if ((response.data as any).success) {
        alert("Response sent successfully!");
        setShowResponseModal(false);
        setTeacherResponse("");
        setSelectedNoteForResponse(null);
        // Refresh parent notes
        if (selectedAssignmentForDetails) {
          fetchParentNotes(selectedAssignmentForDetails.id);
        }
      }
    } catch (error) {
      console.error("Error responding to parent note:", error);
      alert("Failed to send response");
    }
  };

  // New handler functions for subject filtering and student management
  const handleSubjectSelect = (subjectName: string | null) => {
    setSelectedSubject(subjectName);
  };

  const handleAssignmentClick = async (assignment: AssignmentData) => {
    setSelectedAssignment(assignment);
    setShowStudentListModal(true);
    await fetchAssignmentStudents(assignment.id);
  };

  const fetchAssignmentStudents = async (assignmentId: string) => {
    try {
      setLoadingStudents(true);
      // Use the new submissions API to get students with their submission status
      const response = await api.getAssignmentSubmissions(assignmentId);
      if (response.success && response.data) {
        const submissionsData = response.data;
        
        // Transform the data to match the expected format
        const studentsWithStatus = submissionsData.students?.map((studentData: any) => ({
          ...studentData.student,
          submissionStatus: studentData.submitted ? "submitted" : "not_submitted",
          submissionDate: studentData.submission?.submittedAt || null,
          grade: studentData.submission?.score || null,
          feedback: studentData.submission?.feedback || null,
          submission: studentData.submission,
        })) || [];
        
        setAssignmentStudents(studentsWithStatus);
      } else {
        // Fallback: get all students from the class
        if (selectedClass) {
          try {
            const classResponse = await api.get(
              `/classes/${selectedClass.id}/students`
            );
            const students = Array.isArray(classResponse.data)
              ? classResponse.data
              : [];
            // Add default submission status
            const studentsWithStatus = students.map((student: any) => ({
              ...student,
              submissionStatus: "not_submitted",
              submissionDate: null,
              grade: null,
              feedback: null,
            }));
            setAssignmentStudents(studentsWithStatus);
          } catch (fallbackError) {
            console.error("Error fetching class students:", fallbackError);
            // If class students also fail, create mock data
            const mockStudents = Array.from({ length: 25 }, (_, i) => ({
              id: `student-${i + 1}`,
              name: `Student ${i + 1}`,
              studentId: `STU${String(i + 1).padStart(3, "0")}`,
              submissionStatus: "not_submitted",
              submissionDate: null,
              grade: null,
              feedback: null,
            }));
            setAssignmentStudents(mockStudents);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching assignment students:", error);
      // Fallback to empty array
      setAssignmentStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentClick = async (student: any) => {
    setSelectedStudent(student);
    setShowStudentDetailModal(true);
    await fetchStudentAssignmentState(student.id);
  };

  const fetchStudentAssignmentState = async (studentId: string) => {
    if (!selectedAssignment) return;

    try {
      setLoadingSubmission(true);
      // Try to get detailed student assignment state
      const response = await api.get(
        `/assignments/${selectedAssignment.id}/students/${studentId}/state`
      );
      if (response.success && response.data) {
        setStudentAssignmentState(response.data);
      } else {
        // Create mock data similar to analytics modal
        const student = assignmentStudents.find((s) => s.id === studentId);
        setStudentAssignmentState({
          student: {
            id: studentId,
            name:
              student?.user?.firstName + " " + student?.user?.lastName ||
              student?.firstName + " " + student?.lastName ||
              "Unknown Student",
            studentId: student?.studentCode || student?.id || studentId,
            email: student?.user?.email || student?.email || "N/A",
            class: selectedAssignment.className,
            grade: student?.grade || null,
          },
          assignment: {
            id: selectedAssignment.id,
            title: selectedAssignment.title,
            subject: selectedAssignment.subject,
            dueDate: selectedAssignment.dueDate,
            maxScore: selectedAssignment.maxScore || 100,
            description: selectedAssignment.description,
          },
          submission: {
            status: student?.submissionStatus || "not_submitted",
            submittedAt: student?.submissionDate || null,
            content: student?.submissionContent || null,
            attachments: student?.attachments || [],
          },
          grading: {
            grade: student?.grade || null,
            maxScore: selectedAssignment.maxScore || 100,
            feedback: student?.feedback || null,
            gradedAt: student?.gradedAt || null,
            gradedBy: student?.gradedBy || null,
          },
          parentEngagement: {
            viewed: Math.random() > 0.3, // Mock: 70% chance viewed
            acknowledged: Math.random() > 0.5, // Mock: 50% chance acknowledged
            viewedAt: Math.random() > 0.3 ? new Date().toISOString() : null,
            acknowledgedAt:
              Math.random() > 0.5 ? new Date().toISOString() : null,
            notes:
              Math.random() > 0.7
                ? "Parent has concerns about difficulty level"
                : null,
            parentDetails: {
              parentName: "Asadullah Abdul Karim",
              parentId: "562",
              parentEmail: "parent@example.com",
              parentPhone: "+93 70 123 4567",
            },
          },
          analytics: {
            timeSpent: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
            attempts: Math.floor(Math.random() * 3) + 1, // 1-3 attempts
            lastAccessed: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            device: ["Desktop", "Mobile", "Tablet"][
              Math.floor(Math.random() * 3)
            ],
          },
        });
      }
    } catch (error) {
      console.error("Error fetching student assignment state:", error);
      // Create mock data on error
      const student = assignmentStudents.find((s) => s.id === studentId);
      setStudentAssignmentState({
        student: {
          id: studentId,
          name:
            student?.user?.firstName + " " + student?.user?.lastName ||
            student?.firstName + " " + student?.lastName ||
            "Unknown Student",
          studentId: student?.studentCode || student?.id || studentId,
          email: student?.user?.email || student?.email || "N/A",
          class: selectedAssignment.className,
          grade: student?.grade || null,
        },
        assignment: {
          id: selectedAssignment.id,
          title: selectedAssignment.title,
          subject: selectedAssignment.subject,
          dueDate: selectedAssignment.dueDate,
          maxScore: selectedAssignment.maxScore || 100,
          description: selectedAssignment.description,
        },
        submission: {
          status: student?.submissionStatus || "not_submitted",
          submittedAt: student?.submissionDate || null,
          content: student?.submissionContent || null,
          attachments: student?.attachments || [],
        },
        grading: {
          grade: student?.grade || null,
          maxScore: selectedAssignment.maxScore || 100,
          feedback: student?.feedback || null,
          gradedAt: student?.gradedAt || null,
          gradedBy: student?.gradedBy || null,
        },
        parentEngagement: {
          viewed: Math.random() > 0.3,
          acknowledged: Math.random() > 0.5,
          viewedAt: Math.random() > 0.3 ? new Date().toISOString() : null,
          acknowledgedAt: Math.random() > 0.5 ? new Date().toISOString() : null,
          notes:
            Math.random() > 0.7
              ? "Parent has concerns about difficulty level"
              : null,
          parentDetails: {
            parentName: "Asadullah Abdul Karim",
            parentId: "562",
            parentEmail: "parent@example.com",
            parentPhone: "+93 70 123 4567",
          },
        },
        analytics: {
          timeSpent: Math.floor(Math.random() * 120) + 30,
          attempts: Math.floor(Math.random() * 3) + 1,
          lastAccessed: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          device: ["Desktop", "Mobile", "Tablet"][
            Math.floor(Math.random() * 3)
          ],
        },
      });
    } finally {
      setLoadingSubmission(false);
    }
  };

  const fetchStudentSubmission = async (studentId: string) => {
    if (!selectedAssignment) return;

    try {
      setLoadingSubmission(true);
      const response = await api.getStudentAssignmentSubmission(
        selectedAssignment.id,
        studentId
      );
      if (response.success && response.data) {
        setStudentSubmission(response.data);
      } else {
        // Mock data for now
        setStudentSubmission({
          studentId,
          assignmentId: selectedAssignment.id,
          status: "not_submitted",
          submittedAt: null,
          files: [],
          grade: null,
          feedback: null,
          teacherComments: null,
        });
      }
    } catch (error) {
      console.error("Error fetching student submission:", error);
      setStudentSubmission(null);
    } finally {
      setLoadingSubmission(false);
    }
  };

  const handleGradeSubmission = async (grade: number, feedback: string) => {
    if (!selectedAssignment || !selectedStudent) return;

    try {
      const response = await api.gradeSubmission(
        selectedAssignment.id,
        selectedStudent.id,
        {
          grade,
          feedback,
          teacherComments: feedback,
        }
      );

      if (response.success) {
        // Update local state
        setStudentSubmission((prev) =>
          prev ? { ...prev, grade, feedback } : null
        );
        // Refresh student list
        await fetchAssignmentStudents(selectedAssignment.id);
        alert("Grade submitted successfully");
      } else {
        alert("Failed to submit grade");
      }
    } catch (error) {
      console.error("Error grading submission:", error);
      alert("Failed to submit grade");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "overdue":
        return "text-red-600 bg-red-50 border-red-200";
      case "draft":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return "play_circle";
      case "completed":
        return "check_circle";
      case "overdue":
        return "warning";
      case "draft":
        return "edit";
      default:
        return "assignment";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredAssignments = assignments
    .filter((assignment) => {
      // Status filter
      if (filterStatus !== "all" && assignment.status !== filterStatus) {
        return false;
      }

      // Subject filter
      if (selectedSubject && assignment.subject !== selectedSubject) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          assignment.title.toLowerCase().includes(searchLower) ||
          assignment.description.toLowerCase().includes(searchLower) ||
          assignment.subject.toLowerCase().includes(searchLower) ||
          assignment.className.toLowerCase().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "dueDate":
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "submissions":
          aValue = a.submissions;
          bValue = b.submissions;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <span className="material-icons text-4xl sm:text-5xl lg:text-6xl text-gray-400 mb-4 animate-spin">
          hourglass_empty
        </span>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          {t("teacherPortal.common.loading")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <span className="material-icons text-4xl sm:text-5xl lg:text-6xl text-red-500 mb-4">
          error
        </span>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-2">
          {t("teacherPortal.common.errorLoading")}
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-md">
          {t("teacherPortal.common.tryAgain")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 lg:mb-8 bg-white shadow-md p-4 sm:p-8 rounded-lg border-black">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          {t("teacherPortal.assignments.title")}
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600">
          {t("teacherPortal.assignments.subtitle")}
        </p>
      </div>

      {!classes || classes.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 text-center">
          <span className="material-icons text-6xl sm:text-7xl lg:text-8xl text-gray-400 mb-6">
            assignment
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-600 mb-4">
            No Classes Assigned
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-500 max-w-md">
            You haven't been assigned to any classes yet. Contact your
            administrator to get started.
          </p>
        </div>
      ) : (
        /* Assignments Content */
        <div className="space-y-6 lg:space-y-8">
          {/* Class Selector & Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Class Selector */}
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  {t("teacherPortal.assignments.selectClass")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {classes.map((classData) => (
                    <button
                      key={classData.id}
                      onClick={() => handleClassSelect(classData)}
                      className={`
                        px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                        ${
                          selectedClass?.id === classData.id
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }
                      `}
                    >
                      {(classData as any).name + " " + classData.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Assignment Button */}
              <div className="lg:gap-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full lg:w-auto bg-blue-600 text-white px-4 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-lg">add</span>
                    {t("teacherPortal.assignments.createAssignment")}
                  </div>
                </button>
              </div>
            </div>

            {/* Subject Tab Bar */}
            {selectedClass && subjects.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-3">
                  {t("teacherPortal.assignments.selectSubject") ||
                    "Select Subject"}
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                  {/* All Subjects Tab */}
                  <button
                    onClick={() => handleSubjectSelect(null)}
                    className={`
                      px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2
                      ${
                        selectedSubject === null
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    <span className="material-icons text-sm">apps</span>
                    {t("teacherPortal.assignments.allSubjects") ||
                      "All Subjects"}
                    <span
                      className={`
                      px-2 py-0.5 rounded-full text-xs font-semibold
                      ${
                        selectedSubject === null
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    `}
                    >
                      {assignments.length}
                    </span>
                  </button>

                  {/* Individual Subject Tabs */}
                  {subjects.map((subject) => {
                    const subjectAssignmentCount = assignments.filter(
                      (a) => a.subject === subject.name
                    ).length;
                    return (
                      <button
                        key={subject.id}
                        onClick={() => handleSubjectSelect(subject.name)}
                        className={`
                          px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2
                          ${
                            selectedSubject === subject.name
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }
                        `}
                      >
                        <span className="material-icons text-sm">book</span>
                        {subject.name}
                        <span
                          className={`
                          px-2 py-0.5 rounded-full text-xs font-semibold
                          ${
                            selectedSubject === subject.name
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }
                        `}
                        >
                          {subjectAssignmentCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Advanced Filters and Search */}

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="space-y-4">
              {/* Search Bar */}

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-7 transform -translate-y-1/2 text-gray-400 text-sm">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder={t(
                        "teacherPortal.assignments.searchPlaceholder"
                      )}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Sort Controls */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="createdAt">
                      {t("teacherPortal.assignments.sortByDate")}
                    </option>
                    <option value="title">
                      {t("teacherPortal.assignments.sortByTitle")}
                    </option>
                    <option value="dueDate">
                      {t("teacherPortal.assignments.sortByDueDate")}
                    </option>
                    <option value="submissions">
                      {t("teacherPortal.assignments.sortBySubmissions")}
                    </option>
                    <option value="status">
                      {t("teacherPortal.assignments.sortByStatus")}
                    </option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="material-icons text-sm">
                      {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Status Filters and Bulk Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {t("teacherPortal.assignments.filter")}:
                  </span>
                  {["all", "active", "completed", "overdue", "draft"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 capitalize
                          ${
                            filterStatus === status
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }
                        `}
                      >
                        {t(`teacherPortal.assignments.${status}`)}
                      </button>
                    )
                  )}
                </div>

                {/* Bulk Actions */}
                {bulkActions.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-600 self-center">
                      {bulkActions.length} selected
                    </span>
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Bulk Actions
                    </button>
                    <button
                      onClick={() => setBulkActions([])}
                      className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assignments List */}
          {selectedClass && (
            <div className="space-y-4">
              {loadingAssignments ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <span className="material-icons text-4xl text-gray-400 mb-4 block">
                    hourglass_empty
                  </span>
                  <p className="text-sm text-gray-500">
                    {t("teacherPortal.common.loading")}
                  </p>
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <span className="material-icons text-4xl text-gray-400 mb-4 block">
                    assignment_turned_in
                  </span>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {t("teacherPortal.assignments.noAssignmentsFound")}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {filterStatus === "all"
                      ? t("teacherPortal.assignments.createFirstAssignment")
                      : t(
                          "teacherPortal.assignments.noAssignmentsFoundForFilter",
                          {
                            filter: t(
                              `teacherPortal.assignments.${filterStatus}`
                            ),
                          }
                        )}
                  </p>
                </div>
              ) : (
                filteredAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Assignment Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                checked={bulkActions.includes(assignment.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBulkActions([
                                      ...bulkActions,
                                      assignment.id,
                                    ]);
                                  } else {
                                    setBulkActions(
                                      bulkActions.filter(
                                        (id) => id !== assignment.id
                                      )
                                    );
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                                {assignment.title}
                              </h3>
                              {assignment.attachments &&
                                assignment.attachments.length > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <span className="material-icons text-xs">
                                      attach_file
                                    </span>
                                    {assignment.attachments.length}
                                  </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <span className="material-icons text-sm">
                                  school
                                </span>
                                {assignment.className}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-icons text-sm">
                                  book
                                </span>
                                {assignment.subject}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-icons text-sm">
                                  category
                                </span>
                                {getAssignmentTypeTranslation(
                                  assignment.type || "HOMEWORK"
                                )}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`
                            inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
                            ${getStatusColor(assignment.status)}
                          `}
                          >
                            <span className="material-icons text-sm">
                              {getStatusIcon(assignment.status)}
                            </span>
                            {assignment.status}
                          </span>
                        </div>

                        <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2">
                          {assignment.description}
                        </p>

                        {/* Enhanced Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                              <span className="material-icons text-sm">
                                schedule
                              </span>
                              {t("teacherPortal.assignments.dueDate")}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(assignment.dueDate)}
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center gap-1 text-sm text-blue-600 mb-1">
                              <span className="material-icons text-sm">
                                people
                              </span>
                              {t("teacherPortal.assignments.submissions")}
                            </div>
                            <div className="text-sm font-medium text-blue-900">
                              {Number(assignment.submissions)}/
                              {Number(assignment.totalStudents)}
                            </div>
                            {assignment.submissionStats && (
                              <div className="text-xs text-blue-600">
                                {Number(
                                  assignment.submissionStats.submissionRate
                                ).toFixed(1)}
                                % rate
                              </div>
                            )}
                          </div>

                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex items-center gap-1 text-sm text-green-600 mb-1">
                              <span className="material-icons text-sm">
                                family
                              </span>
                              {t("teacherPortal.assignments.parentViews")}
                            </div>
                            <div className="text-sm font-medium text-green-900">
                              {Number(assignment.parentViews?.viewedCount) || 0}
                              /
                              {Number(assignment.parentViews?.totalParents) ||
                                0}
                            </div>
                            {assignment.parentViews && (
                              <div className="text-xs text-green-600">
                                {Number(
                                  assignment.parentViews.viewRate
                                ).toFixed(1)}
                                % viewed
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="material-icons text-sm">
                              calendar_today
                            </span>
                            {t("teacherPortal.assignments.created")}:{" "}
                            {formatDate(assignment.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-icons text-sm">star</span>
                            {t("teacherPortal.assignments.maxScore")}:{" "}
                            {Number(assignment.maxScore) || 100}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-icons text-sm">
                              weight
                            </span>
                            {t("teacherPortal.assignments.weight")}:{" "}
                            {Number(assignment.weight) || 1}
                          </span>
                        </div>
                      </div>

                      {/* Enhanced Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 lg:gap-6">
                        <button
                          onClick={() => handleAssignmentClick(assignment)}
                          className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <span className="material-icons text-sm">people</span>
                          {t("teacherPortal.assignments.viewStudents") ||
                            "View Students"}
                        </button>
                        <button
                          onClick={() => handleEdit(assignment)}
                          className="px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <span className="material-icons text-sm">edit</span>
                          {t("teacherPortal.assignments.edit")}
                        </button>
                        <button
                          onClick={() => handleViewAnalytics(assignment)}
                          className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <span className="material-icons text-sm">
                            analytics
                          </span>
                          {t("teacherPortal.assignments.analytics")}
                        </button>
                        <button
                          onClick={() =>
                            handleExportAssignments([assignment.id])
                          }
                          className="px-3 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <span className="material-icons text-sm">
                            download
                          </span>
                          {t("teacherPortal.assignments.export")}
                        </button>
                        <button
                          onClick={() => handleNotifyParents(assignment.id)}
                          className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                        >
                          <span className="material-icons text-sm">
                            notifications
                          </span>
                          {t("teacherPortal.assignments.notify")}
                        </button>
                        <div className="relative">
                          <select
                            value={assignment.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              console.log("Status change:", {
                                currentStatus: assignment.status,
                                newStatus,
                              });
                              handleStatusChange(assignment.id, newStatus);
                            }}
                            disabled={statusChangeLoading === assignment.id}
                            className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="draft">{t("teacherPortal.assignments.statusDraft")}</option>
                            <option value="active">{t("teacherPortal.assignments.statusActive")}</option>
                            <option value="completed">{t("teacherPortal.assignments.statusCompleted")}</option>
                            <option value="overdue">{t("teacherPortal.assignments.statusOverdue")}</option>
                          </select>
                          {statusChangeLoading === assignment.id && (
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 material-icons text-sm animate-spin text-gray-600">
                              hourglass_empty
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <AssignmentForm
          assignment={editingAssignment ? {
            id: editingAssignment.id,
            title: editingAssignment.title,
            description: editingAssignment.description,
            dueDate: editingAssignment.dueDate,
            maxScore: editingAssignment.maxScore || 100,
            status: editingAssignment.status,
            class: {
              id: editingAssignment.classId,
              name: editingAssignment.className
            },
            subject: {
              id: editingAssignment.subject,
              name: editingAssignment.subject
            },
            teacher: {
              id: user?.id || '',
              firstName: user?.firstName || '',
              lastName: user?.lastName || ''
            },
            attachments: editingAssignment.attachments
          } : null}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAssignment(null);
          }}
          onSuccess={(assignment) => {
            setShowCreateModal(false);
            setEditingAssignment(null);
            // Refresh assignments list
            if (selectedClass) {
              // Call the existing load function
              const loadAssignmentsForClass = async () => {
                try {
                  setLoadingAssignments(true);
                  const res = await api.getAssignmentsForClass(selectedClass.id);
                  if (res?.success || res?.data) {
                    setAssignments(res.data || []);
                  }
                } catch (error) {
                  console.error('Error loading assignments:', error);
                } finally {
                  setLoadingAssignments(false);
                }
              };
              loadAssignmentsForClass();
            }
          }}
          mode={editingAssignment ? 'edit' : 'create'}
          classes={classes.map(c => ({ id: c.id, name: c.name }))}
          subjects={subjects}
          selectedClassId={selectedClass?.id}
        />
      )}

      {/* Advanced Assignment Details Modal */}
      {showAdvancedModal && selectedAssignmentForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("teacherPortal.assignments.assignmentDetails")}
                </h2>
                <button
                  onClick={() => setShowAdvancedModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* {t('teacherPortal.assignments.basicInformation')} */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t("teacherPortal.assignments.basicInformation")}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>
                          {t("teacherPortal.assignments.assignmentNameLabel")}:
                        </strong>{" "}
                        {selectedAssignmentForDetails.title}
                      </div>
                      <div>
                        <strong>{t("teacherPortal.assignments.class")}:</strong>{" "}
                        {selectedAssignmentForDetails.className}
                      </div>
                      <div>
                        <strong>
                          {t("teacherPortal.assignments.subject")}:
                        </strong>{" "}
                        {selectedAssignmentForDetails.subject === "Mathematics"
                          ? t("teacherPortal.assignments.mathematics")
                          : selectedAssignmentForDetails.subject}
                      </div>
                      <div>
                        <strong>{t("teacherPortal.assignments.type")}:</strong>{" "}
                        {getAssignmentTypeTranslation(
                          selectedAssignmentForDetails.type || "HOMEWORK"
                        )}
                      </div>
                      <div>
                        <strong>
                          {t("teacherPortal.assignments.assignmentStatus")}:
                        </strong>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(
                            selectedAssignmentForDetails.status
                          )}`}
                        >
                          {String(selectedAssignmentForDetails.status || "")}
                        </span>
                      </div>
                      <div>
                        <strong>
                          {t("teacherPortal.assignments.dueDateLabel")}:
                        </strong>{" "}
                        {formatDate(selectedAssignmentForDetails.dueDate)}
                      </div>
                      <div>
                        <strong>
                          {t("teacherPortal.assignments.maxScoreLabel")}:
                        </strong>{" "}
                        {Number(selectedAssignmentForDetails.maxScore)}
                      </div>
                      <div>
                        <strong>
                          {t("teacherPortal.assignments.weightLabel")}:
                        </strong>{" "}
                        {Number(selectedAssignmentForDetails.weight)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t("teacherPortal.assignments.description")}
                    </h4>
                    <p className="text-gray-700 text-sm">
                      {selectedAssignmentForDetails.description}
                    </p>
                  </div>

                  {selectedAssignmentForDetails.attachments &&
                    selectedAssignmentForDetails.attachments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Attachments
                        </h4>
                        <div className="space-y-2">
                          {selectedAssignmentForDetails.attachments.map(
                            (attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div className="flex items-center">
                                  <span className="material-icons text-blue-500 gap-2">
                                    attach_file
                                  </span>
                                  <span className="text-sm">
                                    {attachment.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {(attachment.size / 1024).toFixed(1)} KB
                                  </span>
                                  <button
                                    onClick={() => handleDownloadAttachment(attachment)}
                                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors flex items-center gap-1"
                                  >
                                    <span className="material-icons text-xs">
                                      download
                                    </span>
                                    Download
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Statistics and Analytics */}
                <div className="space-y-4">
                  {selectedAssignmentForDetails.submissionStats && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t("teacherPortal.assignments.submissionStatistics")}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-600">
                            {t("teacherPortal.assignments.totalStudents")}
                          </div>
                          <div className="text-lg font-bold text-blue-900">
                            {Number(
                              selectedAssignmentForDetails.submissionStats
                                .totalStudents
                            )}
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-600">
                            {t("teacherPortal.assignments.submitted")}
                          </div>
                          <div className="text-lg font-bold text-green-900">
                            {Number(
                              selectedAssignmentForDetails.submissionStats
                                .submittedCount
                            )}
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-sm text-purple-600">
                            {t("teacherPortal.assignments.graded")}
                          </div>
                          <div className="text-lg font-bold text-purple-900">
                            {Number(
                              selectedAssignmentForDetails.submissionStats
                                .gradedCount
                            )}
                          </div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="text-sm text-orange-600">
                            {t("teacherPortal.assignments.averageScore")}
                          </div>
                          <div className="text-lg font-bold text-orange-900">
                            {Number(
                              selectedAssignmentForDetails.submissionStats
                                .averageScore
                            ).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedAssignmentForDetails.parentViews && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t("teacherPortal.assignments.parentEngagement")}
                      </h3>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-green-600">
                            {t("teacherPortal.assignments.parentViews")}
                          </span>
                          <span className="text-sm font-medium text-green-900">
                            {Number(
                              selectedAssignmentForDetails.parentViews
                                .viewedCount
                            )}
                            /
                            {Number(
                              selectedAssignmentForDetails.parentViews
                                .totalParents
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${Number(
                                selectedAssignmentForDetails.parentViews
                                  .viewRate
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {Number(
                            selectedAssignmentForDetails.parentViews.viewRate
                          ).toFixed(1)}
                          %{" "}
                          {t("teacherPortal.assignments.parentViewsPercentage")}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedAssignmentForDetails.analytics && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t("teacherPortal.assignments.engagementAnalytics")}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.totalViews")}:
                          </span>
                          <span className="font-medium">
                            {Number(
                              selectedAssignmentForDetails.analytics.views
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.downloads")}:
                          </span>
                          <span className="font-medium">
                            {Number(
                              selectedAssignmentForDetails.analytics.downloads
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.engagementScore")}:
                          </span>
                          <span className="font-medium">
                            {Number(
                              selectedAssignmentForDetails.analytics.engagement
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent Notes Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("teacherPortal.assignments.parentNotes") || "Parent Notes"}
                </h3>

                {loadingParentNotes ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : parentNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <span className="material-icons text-5xl mb-2">notes</span>
                    <p>
                      {t("teacherPortal.assignments.noParentNotes") ||
                        "No parent notes yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {parentNotes.map((note) => (
                      <div
                        key={note.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-gray-900">
                              {note.parent?.user?.firstName}{" "}
                              {note.parent?.user?.lastName}
                              {note.parent?.user?.dariName &&
                                ` (${note.parent.user.dariName})`}
                            </div>
                            {note.student && (
                              <div className="text-sm text-gray-600">
                                {t("teacherPortal.assignments.studentLabel") ||
                                  "Student"}
                                : {note.student.user?.firstName}{" "}
                                {note.student.user?.lastName}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {new Date(note.createdAt).toLocaleDateString()}{" "}
                              {new Date(note.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                          {!note.teacherResponse && (
                            <button
                              onClick={() => {
                                setSelectedNoteForResponse(note);
                                setShowResponseModal(true);
                              }}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              {t("teacherPortal.assignments.respond") ||
                                "Respond"}
                            </button>
                          )}
                        </div>

                        <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {t("teacherPortal.assignments.parentNote") ||
                              "Parent Note"}
                            :
                          </div>
                          <p className="text-gray-800">{note.note}</p>
                        </div>

                        {note.teacherResponse && (
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <div className="text-sm font-medium text-blue-700 mb-1">
                              {t("teacherPortal.assignments.yourResponse") ||
                                "Your Response"}
                              :
                            </div>
                            <p className="text-gray-800">
                              {note.teacherResponse}
                            </p>
                            <div className="text-xs text-blue-600 mt-2">
                              {t("teacherPortal.assignments.respondedBy") ||
                                "Responded by"}
                              : {note.teacherResponder?.firstName}{" "}
                              {note.teacherResponder?.lastName} on{" "}
                              {new Date(
                                note.teacherResponseAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAdvancedModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t("teacherPortal.assignments.close")}
                </button>
                <button
                  onClick={() =>
                    handleNotifyParents(selectedAssignmentForDetails.id)
                  }
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {t("teacherPortal.assignments.notifyParents")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Response Modal */}
      {showResponseModal && selectedNoteForResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("teacherPortal.assignments.respondToParentNote") ||
                    "Respond to Parent Note"}
                </h2>
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setTeacherResponse("");
                    setSelectedNoteForResponse(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>

              <div className="mb-4">
                <div className="font-medium text-gray-900 mb-2">
                  {t("teacherPortal.assignments.parentLabel") || "Parent"}:{" "}
                  {selectedNoteForResponse.parent?.user?.firstName}{" "}
                  {selectedNoteForResponse.parent?.user?.lastName}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {t("teacherPortal.assignments.parentNote") || "Parent Note"}
                    :
                  </div>
                  <p className="text-gray-800">
                    {selectedNoteForResponse.note}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("teacherPortal.assignments.yourResponseLabel") ||
                    "Your Response"}
                </label>
                <textarea
                  value={teacherResponse}
                  onChange={(e) => setTeacherResponse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder={
                    t("teacherPortal.assignments.enterResponsePlaceholder") ||
                    "Enter your response to the parent..."
                  }
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setTeacherResponse("");
                    setSelectedNoteForResponse(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t("teacherPortal.assignments.cancel")}
                </button>
                <button
                  onClick={handleRespondToNote}
                  disabled={!teacherResponse.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t("teacherPortal.assignments.sendResponse") ||
                    "Send Response"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && analyticsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t("teacherPortal.assignments.assignmentAnalytics")}
                  </h2>
                  {analyticsData.assignmentTitle && (
                    <p className="text-sm text-gray-600 mt-1">
                      {analyticsData.assignmentTitle} (ID:{" "}
                      {analyticsData.assignmentId})
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {t("teacherPortal.assignments.studentAnalytics")}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        {t("teacherPortal.assignments.totalStudents")}:
                      </span>
                      <span className="font-medium">
                        {Number(analyticsData.totalStudents) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("teacherPortal.assignments.submitted")}:</span>
                      <span className="font-medium">
                        {Number(analyticsData.submittedCount) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("teacherPortal.assignments.graded")}:</span>
                      <span className="font-medium">
                        {Number(analyticsData.gradedCount) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {t("teacherPortal.assignments.submissionRate")}:
                      </span>
                      <span className="font-medium">
                        {Number(analyticsData.submissionRate || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("teacherPortal.assignments.gradingRate")}:</span>
                      <span className="font-medium">
                        {Number(analyticsData.gradingRate || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">
                    {t("teacherPortal.assignments.parentEngagement")}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        {t("teacherPortal.assignments.totalParents")}:
                      </span>
                      <span className="font-medium">
                        {Number(analyticsData.totalParents) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("teacherPortal.assignments.viewed")}:</span>
                      <span className="font-medium">
                        {Number(analyticsData.parentViews) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("teacherPortal.assignments.viewRate")}:</span>
                      <span className="font-medium">
                        {Number(analyticsData.parentViewRate || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {t("teacherPortal.assignments.acknowledged")}:
                      </span>
                      <span className="font-medium">
                        {Number(analyticsData.parentAcknowledged) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {t("teacherPortal.assignments.acknowledgmentRate")}:
                      </span>
                      <span className="font-medium">
                        {Number(
                          analyticsData.parentAcknowledgmentRate || 0
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {t("teacherPortal.assignments.performanceMetrics")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {Number(analyticsData.averageScore || 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("teacherPortal.assignments.averageScore")}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Number(analyticsData.submissionRate || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("teacherPortal.assignments.submissionRate")}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Number(analyticsData.gradingRate || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("teacherPortal.assignments.gradingRate")}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {Number(
                        analyticsData.parentAcknowledgmentRate || 0
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("teacherPortal.assignments.parentEngagement")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Parent Information */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("teacherPortal.assignments.parentEngagementDetails")}
                </h3>

                {/* Parent View Details */}
                {analyticsData.parentViewDetails &&
                  analyticsData.parentViewDetails.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-green-700 mb-3 flex items-center">
                        <span className="material-icons text-sm gap-2">
                          visibility
                        </span>
                        {t("teacherPortal.assignments.parentsWhoViewed")} (
                        {analyticsData.parentViewDetails.length})
                      </h4>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="space-y-2">
                          {analyticsData.parentViewDetails.map(
                            (parent: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 px-3 bg-white rounded border"
                              >
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {parent.parentName}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    (ID: {parent.parentId})
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {new Date(parent.viewedAt).toLocaleString()}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Parent Acknowledgment Details */}
                {analyticsData.parentAcknowledgmentDetails &&
                  analyticsData.parentAcknowledgmentDetails.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-blue-700 mb-3 flex items-center">
                        <span className="material-icons text-sm gap-2">
                          check_circle
                        </span>
                        {t("teacherPortal.assignments.parentsWhoAcknowledged")}{" "}
                        ({analyticsData.parentAcknowledgmentDetails.length})
                      </h4>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="space-y-3">
                          {analyticsData.parentAcknowledgmentDetails.map(
                            (parent: any, index: number) => (
                              <div
                                key={index}
                                className="bg-white rounded border p-3"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="font-medium text-gray-900">
                                      {parent.parentName}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">
                                      (ID: {parent.parentId})
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {new Date(
                                      parent.acknowledgedAt
                                    ).toLocaleString()}
                                  </div>
                                </div>
                                {parent.notes && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-blue-400">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center">
                                      <span className="material-icons text-xs gap-1">
                                        note
                                      </span>
                                      {t(
                                        "teacherPortal.assignments.parentNotes"
                                      )}
                                      :
                                    </div>
                                    <div className="text-sm text-gray-700 italic">
                                      "{parent.notes}"
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* All Parents Status */}
                {analyticsData.allParents &&
                  analyticsData.allParents.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                        <span className="material-icons text-sm gap-2">
                          people
                        </span>
                        {t("teacherPortal.assignments.allParentsStatus")} (
                        {analyticsData.allParents.length})
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                          {analyticsData.allParents.map(
                            (parent: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 px-3 bg-white rounded border"
                              >
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-900">
                                    {parent.parentName}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-2">
                                    (ID: {parent.parentId})
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      parent.hasViewed
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {parent.hasViewed
                                      ? t("teacherPortal.assignments.viewed")
                                      : `Not ${t(
                                          "teacherPortal.assignments.viewed"
                                        )}`}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      parent.hasAcknowledged
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {parent.hasAcknowledged
                                      ? t(
                                          "teacherPortal.assignments.acknowledged"
                                        )
                                      : `Not ${t(
                                          "teacherPortal.assignments.acknowledged"
                                        )}`}
                                  </span>
                                  {parent.hasAcknowledged &&
                                    analyticsData.parentAcknowledgmentDetails &&
                                    analyticsData.parentAcknowledgmentDetails.find(
                                      (p: any) => p.parentId === parent.userId
                                    )?.notes && (
                                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 flex items-center">
                                        <span className="material-icons text-xs gap-1">
                                          note
                                        </span>
                                        Has Notes
                                      </span>
                                    )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-700 mb-2">
                      Parents Not {t("teacherPortal.assignments.viewed")}
                    </h4>
                    <div className="text-2xl font-bold text-red-600">
                      {analyticsData.parentsNotViewed || 0}
                    </div>
                    <div className="text-sm text-red-600">
                      {analyticsData.totalParents
                        ? `${(
                            (analyticsData.parentsNotViewed /
                              analyticsData.totalParents) *
                            100
                          ).toFixed(1)}% ${t(
                            "teacherPortal.assignments.ofTotalParents"
                          )}`
                        : `0% ${t("teacherPortal.assignments.ofTotalParents")}`}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-700 mb-2">
                      Parents Not {t("teacherPortal.assignments.acknowledged")}
                    </h4>
                    <div className="text-2xl font-bold text-orange-600">
                      {analyticsData.parentsNotAcknowledged || 0}
                    </div>
                    <div className="text-sm text-orange-600">
                      {analyticsData.totalParents
                        ? `${(
                            (analyticsData.parentsNotAcknowledged /
                              analyticsData.totalParents) *
                            100
                          ).toFixed(1)}% ${t(
                            "teacherPortal.assignments.ofTotalParents"
                          )}`
                        : `0% ${t("teacherPortal.assignments.ofTotalParents")}`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t("teacherPortal.assignments.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Bulk Actions
              </h2>
              <p className="text-gray-600 mb-6">
                You have selected {bulkActions.length} assignments. Choose an
                action to perform:
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleBulkAction("activate", bulkActions)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <span className="material-icons text-sm gap-2">
                    play_circle
                  </span>
                  Activate Selected
                </button>
                <button
                  onClick={() => handleBulkAction("complete", bulkActions)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <span className="material-icons text-sm gap-2">
                    check_circle
                  </span>
                  Mark as Completed
                </button>
                <button
                  onClick={() => handleExportAssignments(bulkActions)}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                >
                  <span className="material-icons text-sm gap-2">download</span>
                  Export Selected
                </button>
                <button
                  onClick={() => handleBulkAction("delete", bulkActions)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <span className="material-icons text-sm gap-2">delete</span>
                  Delete Selected
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student List Modal */}
      {showStudentListModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedAssignment.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-sm">book</span>
                      {selectedAssignment.subject}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-sm">event</span>
                      {t("teacherPortal.assignments.due")}:{" "}
                      {formatDate(selectedAssignment.dueDate)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowStudentListModal(false);
                    setSelectedAssignment(null);
                    setAssignmentStudents([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>

              {/* Loading State */}
              {loadingStudents ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="material-icons text-4xl text-gray-400 mb-4 animate-spin">
                    hourglass_empty
                  </span>
                  <p className="text-gray-600">
                    {t("teacherPortal.common.loading")}
                  </p>
                </div>
              ) : assignmentStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="material-icons text-4xl text-gray-400 mb-4">
                    people_outline
                  </span>
                  <p className="text-gray-600">
                    {t("teacherPortal.assignments.noStudentsFound") ||
                      "No students found"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-600 mb-1">
                        {t("teacherPortal.assignments.totalStudents") ||
                          "Total Students"}
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {assignmentStudents.length}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-600 mb-1">
                        {t("teacherPortal.assignments.submitted") ||
                          "Submitted"}
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {
                          assignmentStudents.filter(
                            (s) =>
                              s.submissionStatus === "submitted" ||
                              s.submissionStatus === "graded"
                          ).length
                        }
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-purple-600 mb-1">
                        {t("teacherPortal.assignments.graded") || "Graded"}
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {
                          assignmentStudents.filter(
                            (s) =>
                              s.submissionStatus === "graded" || s.grade != null
                          ).length
                        }
                      </div>
                    </div>
                  </div>

                  {/* Student List */}
                  {assignmentStudents.map((student) => {
                    const statusColors = {
                      submitted:
                        "bg-yellow-100 text-yellow-800 border-yellow-300",
                      graded: "bg-green-100 text-green-800 border-green-300",
                      not_submitted: "bg-red-100 text-red-800 border-red-300",
                    };
                    const status = student.submissionStatus || "not_submitted";

                    return (
                      <div
                        key={student.id}
                        onClick={() => handleStudentClick(student)}
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {(
                              student.user?.firstName ||
                              student.firstName ||
                              "S"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {student.user?.firstName || student.firstName}{" "}
                              {student.user?.lastName || student.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {t("teacherPortal.assignments.studentId") || "ID"}
                              : {student.studentCode || student.id}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {student.grade != null && (
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                {t("teacherPortal.assignments.grade") ||
                                  "Grade"}
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {student.grade}/
                                {selectedAssignment.maxScore || 100}
                              </div>
                            </div>
                          )}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              statusColors[status as keyof typeof statusColors]
                            }`}
                          >
                            {status === "submitted" &&
                              (t("teacherPortal.assignments.submitted") ||
                                "Submitted")}
                            {status === "graded" &&
                              (t("teacherPortal.assignments.graded") ||
                                "Graded")}
                            {status === "not_submitted" &&
                              (t("teacherPortal.assignments.notSubmitted") ||
                                "Not Submitted")}
                          </span>
                          <span className="material-icons text-gray-400">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Assignment State Modal */}
      {showStudentDetailModal &&
        selectedStudent &&
        selectedAssignment &&
        studentAssignmentState && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t("teacherPortal.assignments.studentAssignmentState") ||
                        "Student Assignment State"}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {studentAssignmentState.student.name} -{" "}
                      {studentAssignmentState.assignment.title}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowStudentDetailModal(false);
                      setSelectedStudent(null);
                      setStudentAssignmentState(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-icons">close</span>
                  </button>
                </div>

                {/* Loading State */}
                {loadingSubmission ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <span className="material-icons text-4xl text-gray-400 mb-4 animate-spin">
                      hourglass_empty
                    </span>
                    <p className="text-gray-600">
                      {t("teacherPortal.common.loading")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Student Information */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        {t("teacherPortal.assignments.studentInformation") ||
                          "Student Information"}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.studentName") ||
                              "Name"}
                            :
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.student.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.studentId") ||
                              "Student ID"}
                            :
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.student.studentId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.email") || "Email"}:
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.student.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.class") || "Class"}:
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.student.class}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {t("teacherPortal.assignments.assignmentInformation") ||
                          "Assignment Information"}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.title") || "Title"}:
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.assignment.title}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.subject") ||
                              "Subject"}
                            :
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.assignment.subject}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.due") || "Due Date"}:
                          </span>
                          <span className="font-medium">
                            {formatDate(
                              studentAssignmentState.assignment.dueDate
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.maxScore") ||
                              "Max Score"}
                            :
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.assignment.maxScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Submission Status */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">
                        {t("teacherPortal.assignments.submissionStatus") ||
                          "Submission Status"}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span>
                            {t("teacherPortal.assignments.status") || "Status"}:
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              studentAssignmentState.submission.status ===
                                "submitted" ||
                              studentAssignmentState.submission.status ===
                                "graded"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {studentAssignmentState.submission.status ===
                            "not_submitted"
                              ? t("teacherPortal.assignments.notSubmitted") ||
                                "Not Submitted"
                              : studentAssignmentState.submission.status ===
                                "graded"
                              ? t("teacherPortal.assignments.graded") ||
                                "Graded"
                              : t("teacherPortal.assignments.submitted") ||
                                "Submitted"}
                          </span>
                        </div>
                        {studentAssignmentState.submission.submittedAt && (
                          <div className="flex justify-between">
                            <span>
                              {t("teacherPortal.assignments.submittedOn") ||
                                "Submitted On"}
                              :
                            </span>
                            <span className="font-medium">
                              {new Date(
                                studentAssignmentState.submission.submittedAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {studentAssignmentState.submission.attachments &&
                          studentAssignmentState.submission.attachments.length >
                            0 && (
                            <div className="flex justify-between">
                              <span>
                                {t("teacherPortal.assignments.attachments") ||
                                  "Attachments"}
                                :
                              </span>
                              <span className="font-medium">
                                {
                                  studentAssignmentState.submission.attachments
                                    .length
                                }
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Grading Information */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-2">
                        {t("teacherPortal.assignments.gradingInformation") ||
                          "Grading Information"}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.grade") || "Grade"}:
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.grading.grade
                              ? `${studentAssignmentState.grading.grade}/${studentAssignmentState.grading.maxScore}`
                              : t("teacherPortal.assignments.notGraded") ||
                                "Not Graded"}
                          </span>
                        </div>
                        {studentAssignmentState.grading.gradedAt && (
                          <div className="flex justify-between">
                            <span>
                              {t("teacherPortal.assignments.gradedOn") ||
                                "Graded On"}
                              :
                            </span>
                            <span className="font-medium">
                              {new Date(
                                studentAssignmentState.grading.gradedAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {studentAssignmentState.grading.gradedBy && (
                          <div className="flex justify-between">
                            <span>
                              {t("teacherPortal.assignments.gradedBy") ||
                                "Graded By"}
                              :
                            </span>
                            <span className="font-medium">
                              {studentAssignmentState.grading.gradedBy}
                            </span>
                          </div>
                        )}
                        {studentAssignmentState.grading.feedback && (
                          <div className="mt-3 pt-3 border-t border-purple-200">
                            <div className="text-sm text-purple-700 mb-1">
                              {t("teacherPortal.assignments.feedback") ||
                                "Feedback"}
                              :
                            </div>
                            <div className="text-sm text-purple-900">
                              {studentAssignmentState.grading.feedback}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Parent Engagement */}
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-orange-900 mb-2">
                        {t("teacherPortal.assignments.parentEngagement") ||
                          "Parent Engagement"}
                      </h3>

                      {/* Parent Information */}
                      {studentAssignmentState.parentEngagement
                        .parentDetails && (
                        <div className="mb-4 p-3 bg-white rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium text-gray-900">
                                {
                                  studentAssignmentState.parentEngagement
                                    .parentDetails.parentName
                                }
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                (ID:{" "}
                                {
                                  studentAssignmentState.parentEngagement
                                    .parentDetails.parentId
                                }
                                )
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  studentAssignmentState.parentEngagement.viewed
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {studentAssignmentState.parentEngagement.viewed
                                  ? t("teacherPortal.assignments.viewed") ||
                                    "Viewed"
                                  : t("teacherPortal.assignments.notViewed") ||
                                    "Not Viewed"}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  studentAssignmentState.parentEngagement
                                    .acknowledged
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {studentAssignmentState.parentEngagement
                                  .acknowledged
                                  ? t(
                                      "teacherPortal.assignments.acknowledged"
                                    ) || "Acknowledged"
                                  : t(
                                      "teacherPortal.assignments.notAcknowledged"
                                    ) || "Not Acknowledged"}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>
                              Email:{" "}
                              {
                                studentAssignmentState.parentEngagement
                                  .parentDetails.parentEmail
                              }
                            </div>
                            <div>
                              Phone:{" "}
                              {
                                studentAssignmentState.parentEngagement
                                  .parentDetails.parentPhone
                              }
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Engagement Details */}
                      <div className="space-y-2 text-sm">
                        {studentAssignmentState.parentEngagement.viewedAt && (
                          <div className="flex justify-between">
                            <span>
                              {t("teacherPortal.assignments.viewedOn") ||
                                "Viewed On"}
                              :
                            </span>
                            <span className="font-medium">
                              {new Date(
                                studentAssignmentState.parentEngagement.viewedAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {studentAssignmentState.parentEngagement
                          .acknowledgedAt && (
                          <div className="flex justify-between">
                            <span>
                              {t("teacherPortal.assignments.acknowledgedOn") ||
                                "Acknowledged On"}
                              :
                            </span>
                            <span className="font-medium">
                              {new Date(
                                studentAssignmentState.parentEngagement.acknowledgedAt
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {studentAssignmentState.parentEngagement.notes && (
                          <div className="mt-3 pt-3 border-t border-orange-200">
                            <div className="text-sm text-orange-700 mb-1">
                              {t("teacherPortal.assignments.parentNotes") ||
                                "Parent Notes"}
                              :
                            </div>
                            <div className="text-sm text-orange-900 bg-white p-2 rounded border">
                              "{studentAssignmentState.parentEngagement.notes}"
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Analytics */}
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-indigo-900 mb-2">
                        {t("teacherPortal.assignments.analytics") ||
                          "Analytics"}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.timeSpent") ||
                              "Time Spent"}
                            :
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.analytics.timeSpent} minutes
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.attempts") ||
                              "Attempts"}
                            :
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.analytics.attempts}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.lastAccessed") ||
                              "Last Accessed"}
                            :
                          </span>
                          <span className="font-medium">
                            {new Date(
                              studentAssignmentState.analytics.lastAccessed
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {t("teacherPortal.assignments.device") || "Device"}:
                          </span>
                          <span className="font-medium">
                            {studentAssignmentState.analytics.device}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AssignmentManagement;
