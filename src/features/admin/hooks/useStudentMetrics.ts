import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
  grade: string;
  department: string;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  academicPerformance: {
    gpa: number;
    attendance: number;
    assignments: {
      completed: number;
      total: number;
      onTime: number;
    };
    examScores: Array<{
      examId: string;
      subject: string;
      score: number;
      date: string;
    }>;
    skillAssessments: Array<{
      skillId: string;
      name: string;
      level: 'beginner' | 'intermediate' | 'advanced';
      lastAssessed: string;
    }>;
  };
  financialStatus: {
    tuitionStatus: 'paid' | 'pending' | 'overdue';
    lastPaymentDate: string;
    outstandingBalance: number;
    paymentHistory: Array<{
      id: string;
      amount: number;
      date: string;
      status: 'completed' | 'pending' | 'failed';
    }>;
  };
  demographics: {
    age: number;
    gender: string;
    location: string;
    previousEducation: string;
  };
  engagementMetrics: {
    classParticipation: number;
    extracurricularActivities: string[];
    counselingSessions: number;
    lastActivityDate: string;
  };
  learningPreferences: {
    preferredLearningStyle: string;
    accommodations: string[];
    interests: string[];
  };
}

interface StudentFilter {
  grades: string[];
  departments: string[];
  statuses: Array<Student['status']>;
  enrollmentDateRange: {
    start: Date;
    end: Date;
  };
  performanceMetrics: {
    minGPA?: number;
    maxGPA?: number;
    minAttendance?: number;
    assignmentCompletion?: number;
  };
  financialStatus?: Array<Student['financialStatus']['tuitionStatus']>;
  searchQuery: string;
}

interface StudentSort {
  field: keyof Student | 'academicPerformance.gpa' | 'financialStatus.outstandingBalance';
  direction: 'asc' | 'desc';
}

interface StudentAnalytics {
  totalStudents: number;
  activeStudents: number;
  enrollmentTrends: Array<{
    month: string;
    newEnrollments: number;
    graduations: number;
    dropouts: number;
  }>;
  performanceMetrics: {
    averageGPA: number;
    averageAttendance: number;
    assignmentCompletionRate: number;
    gradeDistribution: Record<string, number>;
  };
  demographicBreakdown: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
  };
  financialMetrics: {
    totalOutstandingBalance: number;
    paymentComplianceRate: number;
    revenueByMonth: Array<{
      month: string;
      revenue: number;
      pendingPayments: number;
    }>;
  };
  engagementMetrics: {
    averageParticipation: number;
    topActivities: Array<{
      activity: string;
      participationRate: number;
    }>;
    counselingUtilization: number;
  };
  academicProgress: {
    skillLevelDistribution: Record<string, number>;
    subjectPerformance: Array<{
      subject: string;
      averageScore: number;
      improvementRate: number;
    }>;
  };
}

interface StudentMetricsHook {
  students: Student[];
  analytics: StudentAnalytics;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  filters: StudentFilter;
  sorting: StudentSort;
  setFilters: (filters: StudentFilter) => void;
  setSorting: (sorting: StudentSort) => void;
  refreshData: () => Promise<void>;
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
  generateReport: (type: 'performance' | 'financial' | 'engagement' | 'demographic') => Promise<void>;
  getStudentDetails: (studentId: string) => Promise<Student>;
  updateStudentStatus: (studentId: string, status: Student['status']) => Promise<void>;
  bulkUpdateStatus: (studentIds: string[], status: Student['status']) => Promise<void>;
  generateTranscript: (studentId: string) => Promise<void>;
  scheduleEvaluation: (studentId: string) => Promise<void>;
  getGradeAnalytics: (grade: string) => Promise<{
    performance: {
      averageGPA: number;
      attendanceRate: number;
      assignmentCompletion: number;
    };
    trends: Array<{
      month: string;
      averageScore: number;
      participationRate: number;
    }>;
  }>;
}

const useStudentMetrics = (): StudentMetricsHook => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<StudentFilter>({
    grades: [],
    departments: [],
    statuses: [],
    enrollmentDateRange: {
      start: startOfMonth(subMonths(new Date(), 12)),
      end: endOfMonth(new Date()),
    },
    performanceMetrics: {},
    searchQuery: '',
  });

  const [sorting, setSorting] = useState<StudentSort>({
    field: 'enrollmentDate',
    direction: 'desc',
  });

  // Fetch students with filters and sorting
  const {
    data: students = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Student[], Error>(
    ['students', filters, sorting],
    async () => {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, sorting }),
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  );

  // Fetch student analytics
  const { data: analytics = {} as StudentAnalytics } = useQuery<StudentAnalytics>(
    ['studentAnalytics', filters.enrollmentDateRange],
    async () => {
      const response = await fetch('/api/admin/students/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange: filters.enrollmentDateRange }),
      });
      if (!response.ok) throw new Error('Failed to fetch student analytics');
      return response.json();
    },
    {
      staleTime: 300000, // 5 minutes
    }
  );

  // Update student status mutation
  const updateStatusMutation = useMutation(
    async ({ studentId, status }: { studentId: string; status: Student['status'] }) => {
      const response = await fetch(`/api/admin/students/${studentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update student status');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['students']);
        queryClient.invalidateQueries(['studentAnalytics']);
      },
    }
  );

  // Bulk update status mutation
  const bulkUpdateStatusMutation = useMutation(
    async ({ studentIds, status }: { studentIds: string[]; status: Student['status'] }) => {
      const response = await fetch('/api/admin/students/bulk-status-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds, status }),
      });
      if (!response.ok) throw new Error('Failed to update student statuses');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['students']);
        queryClient.invalidateQueries(['studentAnalytics']);
      },
    }
  );

  const refreshData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const exportData = useCallback(async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const response = await fetch(`/api/admin/students/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      if (!response.ok) throw new Error(`Failed to export data in ${format} format`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_data_${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      
      throw error;
    }
  }, [filters]);

  const generateReport = useCallback(
    async (type: 'performance' | 'financial' | 'engagement' | 'demographic') => {
      try {
        const response = await fetch(`/api/admin/students/report/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });
        if (!response.ok) throw new Error(`Failed to generate ${type} report`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_${type}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        
        throw error;
      }
    },
    [filters]
  );

  const getStudentDetails = useCallback(async (studentId: string) => {
    const response = await fetch(`/api/admin/students/${studentId}`);
    if (!response.ok) throw new Error('Failed to fetch student details');
    return response.json();
  }, []);

  const updateStudentStatus = useCallback(
    async (studentId: string, status: Student['status']) => {
      await updateStatusMutation.mutateAsync({ studentId, status });
    },
    [updateStatusMutation]
  );

  const bulkUpdateStatus = useCallback(
    async (studentIds: string[], status: Student['status']) => {
      await bulkUpdateStatusMutation.mutateAsync({ studentIds, status });
    },
    [bulkUpdateStatusMutation]
  );

  const generateTranscript = useCallback(async (studentId: string) => {
    try {
      const response = await fetch(`/api/admin/students/${studentId}/transcript`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to generate transcript');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${studentId}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      
      throw error;
    }
  }, []);

  const scheduleEvaluation = useCallback(async (studentId: string) => {
    const response = await fetch(`/api/admin/students/${studentId}/schedule-evaluation`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to schedule evaluation');
    return response.json();
  }, []);

  const getGradeAnalytics = useCallback(async (grade: string) => {
    const response = await fetch(`/api/admin/students/grade-analytics/${grade}`);
    if (!response.ok) throw new Error('Failed to fetch grade analytics');
    return response.json();
  }, []);

  return {
    students,
    analytics,
    isLoading,
    isError,
    error,
    filters,
    sorting,
    setFilters,
    setSorting,
    refreshData,
    exportData,
    generateReport,
    getStudentDetails,
    updateStudentStatus,
    bulkUpdateStatus,
    generateTranscript,
    scheduleEvaluation,
    getGradeAnalytics,
  };
};

export default useStudentMetrics;
