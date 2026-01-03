import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  qualifications: Array<{
    degree: string;
    field: string;
    institution: string;
    year: number;
    certifications: Array<{
      name: string;
      issuer: string;
      validUntil: string;
    }>;
  }>;
  performanceMetrics: {
    studentFeedback: number;
    peerReviews: number;
    classPerformance: number;
    attendanceRate: number;
    professionalDevelopment: {
      coursesCompleted: number;
      workshopsAttended: number;
      researchPublications: number;
      conferencesPresentations: number;
    };
    evaluationHistory: Array<{
      date: string;
      evaluator: string;
      scores: {
        teachingMethodology: number;
        studentEngagement: number;
        classroomManagement: number;
        subjectKnowledge: number;
        professionalConduct: number;
      };
      comments: string;
      recommendations: string[];
    }>;
  };
  courseLoad: {
    currentCourses: Array<{
      id: string;
      name: string;
      grade: string;
      studentsCount: number;
      averagePerformance: number;
      schedule: Array<{
        day: string;
        startTime: string;
        endTime: string;
      }>;
    }>;
    historicalCourses: Array<{
      id: string;
      name: string;
      term: string;
      year: number;
      studentsCount: number;
      averagePerformance: number;
      completionRate: number;
    }>;
  };
  specializations: string[];
  responsibilities: Array<{
    role: string;
    description: string;
    startDate: string;
    endDate?: string;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    date: string;
    category: 'academic' | 'research' | 'teaching' | 'leadership';
  }>;
  professionalDevelopment: Array<{
    type: 'course' | 'workshop' | 'conference' | 'research';
    title: string;
    provider: string;
    date: string;
    duration: number;
    outcome: string;
  }>;
}

interface TeacherFilter {
  departments: string[];
  statuses: Array<Teacher['status']>;
  joinDateRange: {
    start: Date;
    end: Date;
  };
  performanceMetrics: {
    minStudentFeedback?: number;
    minPeerReview?: number;
    minClassPerformance?: number;
    minAttendanceRate?: number;
  };
  specializations: string[];
  searchQuery: string;
}

interface TeacherSort {
  field: keyof Teacher | 'performanceMetrics.studentFeedback' | 'performanceMetrics.classPerformance';
  direction: 'asc' | 'desc';
}

interface TeacherAnalytics {
  totalTeachers: number;
  activeTeachers: number;
  departmentMetrics: Array<{
    department: string;
    teacherCount: number;
    averagePerformance: number;
    studentSatisfaction: number;
  }>;
  performanceMetrics: {
    averageStudentFeedback: number;
    averagePeerReview: number;
    averageClassPerformance: number;
    averageAttendanceRate: number;
    performanceDistribution: {
      excellent: number;
      good: number;
      average: number;
      needsImprovement: number;
    };
  };
  courseMetrics: {
    totalCourses: number;
    averageStudentsPerCourse: number;
    averageCompletionRate: number;
    subjectPerformance: Array<{
      subject: string;
      averageScore: number;
      studentSatisfaction: number;
    }>;
  };
  professionalDevelopment: {
    totalActivities: number;
    activitiesByType: Record<string, number>;
    averageActivitiesPerTeacher: number;
    topAchievements: Array<{
      category: string;
      count: number;
    }>;
  };
  trends: Array<{
    month: string;
    averagePerformance: number;
    studentSatisfaction: number;
    professionalDevelopmentActivities: number;
  }>;
}

interface TeacherMetricsHook {
  teachers: Teacher[];
  analytics: TeacherAnalytics;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  filters: TeacherFilter;
  sorting: TeacherSort;
  setFilters: (filters: TeacherFilter) => void;
  setSorting: (sorting: TeacherSort) => void;
  refreshData: () => Promise<void>;
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
  generateReport: (type: 'performance' | 'department' | 'course' | 'development') => Promise<void>;
  getTeacherDetails: (teacherId: string) => Promise<Teacher>;
  updateTeacherStatus: (teacherId: string, status: Teacher['status']) => Promise<void>;
  bulkUpdateStatus: (teacherIds: string[], status: Teacher['status']) => Promise<void>;
  scheduleEvaluation: (teacherId: string) => Promise<void>;
  getDepartmentAnalytics: (department: string) => Promise<{
    performance: {
      averageStudentFeedback: number;
      averagePeerReview: number;
      averageClassPerformance: number;
    };
    trends: Array<{
      month: string;
      averagePerformance: number;
      studentSatisfaction: number;
    }>;
  }>;
}

const useTeacherMetrics = (): TeacherMetricsHook => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TeacherFilter>({
    departments: [],
    statuses: [],
    joinDateRange: {
      start: startOfMonth(subMonths(new Date(), 12)),
      end: endOfMonth(new Date()),
    },
    performanceMetrics: {},
    specializations: [],
    searchQuery: '',
  });

  const [sorting, setSorting] = useState<TeacherSort>({
    field: 'performanceMetrics.studentFeedback',
    direction: 'desc',
  });

  // Fetch teachers with filters and sorting
  const {
    data: teachers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Teacher[], Error>(
    ['teachers', filters, sorting],
    async () => {
      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, sorting }),
      });
      if (!response.ok) throw new Error('Failed to fetch teachers');
      return response.json();
    },
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  );

  // Fetch teacher analytics
  const { data: analytics = {} as TeacherAnalytics } = useQuery<TeacherAnalytics>(
    ['teacherAnalytics', filters.joinDateRange],
    async () => {
      const response = await fetch('/api/admin/teachers/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange: filters.joinDateRange }),
      });
      if (!response.ok) throw new Error('Failed to fetch teacher analytics');
      return response.json();
    },
    {
      staleTime: 300000, // 5 minutes
    }
  );

  // Update teacher status mutation
  const updateStatusMutation = useMutation(
    async ({ teacherId, status }: { teacherId: string; status: Teacher['status'] }) => {
      const response = await fetch(`/api/admin/teachers/${teacherId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update teacher status');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['teachers']);
        queryClient.invalidateQueries(['teacherAnalytics']);
      },
    }
  );

  // Bulk update status mutation
  const bulkUpdateStatusMutation = useMutation(
    async ({ teacherIds, status }: { teacherIds: string[]; status: Teacher['status'] }) => {
      const response = await fetch('/api/admin/teachers/bulk-status-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherIds, status }),
      });
      if (!response.ok) throw new Error('Failed to update teacher statuses');
      return response.json();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['teachers']);
        queryClient.invalidateQueries(['teacherAnalytics']);
      },
    }
  );

  const refreshData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const exportData = useCallback(async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const response = await fetch(`/api/admin/teachers/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      });
      if (!response.ok) throw new Error(`Failed to export data in ${format} format`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teacher_data_${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      
      throw error;
    }
  }, [filters]);

  const generateReport = useCallback(
    async (type: 'performance' | 'department' | 'course' | 'development') => {
      try {
        const response = await fetch(`/api/admin/teachers/report/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });
        if (!response.ok) throw new Error(`Failed to generate ${type} report`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teacher_${type}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        
        throw error;
      }
    },
    [filters]
  );

  const getTeacherDetails = useCallback(async (teacherId: string) => {
    const response = await fetch(`/api/admin/teachers/${teacherId}`);
    if (!response.ok) throw new Error('Failed to fetch teacher details');
    return response.json();
  }, []);

  const updateTeacherStatus = useCallback(
    async (teacherId: string, status: Teacher['status']) => {
      await updateStatusMutation.mutateAsync({ teacherId, status });
    },
    [updateStatusMutation]
  );

  const bulkUpdateStatus = useCallback(
    async (teacherIds: string[], status: Teacher['status']) => {
      await bulkUpdateStatusMutation.mutateAsync({ teacherIds, status });
    },
    [bulkUpdateStatusMutation]
  );

  const scheduleEvaluation = useCallback(async (teacherId: string) => {
    const response = await fetch(`/api/admin/teachers/${teacherId}/schedule-evaluation`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to schedule evaluation');
    return response.json();
  }, []);

  const getDepartmentAnalytics = useCallback(async (department: string) => {
    const response = await fetch(`/api/admin/teachers/department-analytics/${department}`);
    if (!response.ok) throw new Error('Failed to fetch department analytics');
    return response.json();
  }, []);

  return {
    teachers,
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
    getTeacherDetails,
    updateTeacherStatus,
    bulkUpdateStatus,
    scheduleEvaluation,
    getDepartmentAnalytics,
  };
};

export default useTeacherMetrics;
