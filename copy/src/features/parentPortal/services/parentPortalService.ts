import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import secureApiService from '../../../services/secureApiService';
import {
  Child,
  Notification,
  AttendanceRecord,
  AttendanceStats,
  GradeRecord,
  SubjectProgress,
  AssignmentRecord,
  ExamRecord,
  FeeRecord,
  ParentDashboardData,
  Message,
  ParentSettings,
} from '../types/parentPortal';

// API Functions using secureApiService
const api = {
  // Children Data
  getParentChildren: async (): Promise<Child[]> => {
    const response = await secureApiService.get('/parents/children');
    return response.data?.data || response.data || [];
  },

  // Notifications
  getParentNotifications: async (): Promise<Notification[]> => {
    const response = await secureApiService.get('/parents/notifications');
    return response.data?.data || response.data || [];
  },

  // Dashboard
  getParentDashboard: async (): Promise<ParentDashboardData> => {
    const response = await secureApiService.get('/parents/dashboard');
    return response.data;
  },

  // Attendance - Using correct attendance endpoints
  getStudentAttendance: async (studentId: string, filters?: { month?: number; year?: number; startDate?: string; endDate?: string }): Promise<AttendanceRecord[]> => {
    try {
      // console.log('🔍 Fetching attendance for student:', studentId, 'with filters:', filters);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('studentId', studentId);
      
      // Handle different filter types
      if (filters?.startDate && filters?.endDate) {
        // Direct date range filtering (for "all months" or custom ranges)
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
        // console.log('📅 Using direct date range:', { startDate: filters.startDate, endDate: filters.endDate });
      } else if (filters?.month !== undefined && filters?.year) {
        // For specific month filtering - get ALL days of the month
        // JavaScript months are 0-indexed, so filters.month is correct
        // September = month 8, so we want: startDate = 2025-09-01, endDate = 2025-09-30
        
        // Create start date: first day of the month
        const startDate = new Date(filters.year, filters.month, 1);
        
        // Create end date: last day of the month
        // new Date(year, month + 1, 0) gives us the last day of the current month
        const endDate = new Date(filters.year, filters.month + 1, 0);
        
        // Verify the calculation is correct
        // console.log('🔍 Date calculation verification:', {
        //   inputMonth: filters.month,
        //   inputYear: filters.year,
        //   monthName: new Date(0, filters.month).toLocaleString('default', { month: 'long' }),
        //   startDateCalculation: `new Date(${filters.year}, ${filters.month}, 1)`,
        //   endDateCalculation: `new Date(${filters.year}, ${filters.month + 1}, 0)`,
        //   startDateResult: startDate,
        //   endDateResult: endDate,
        //   expectedStartDate: `${filters.year}-${String(filters.month + 1).padStart(2, '0')}-01`,
        //   expectedEndDate: `${filters.year}-${String(filters.month + 1).padStart(2, '0')}-${endDate.getDate()}`
        // });
        
        // Format dates as YYYY-MM-DD to avoid timezone issues
        const startDateStr = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}-01`;
        const endDateStr = `${filters.year}-${String(filters.month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        // console.log('📅 Manual date formatting:', {
        //   startDateStr,
        //   endDateStr,
        //   startDateISO: startDate.toISOString().split('T')[0],
        //   endDateISO: endDate.toISOString().split('T')[0]
        // });
        
        // console.log('📅 Month filtering - full month range:', {
        //   month: filters.month,
        //   year: filters.year,
        //   startDate: startDateStr,
        //   endDate: endDateStr,
        //   monthName: new Date(0, filters.month).toLocaleString('default', { month: 'long' }),
        //   daysInMonth: endDate.getDate(),
        //   startDateObj: startDate,
        //   endDateObj: endDate
        // });
        
        params.append('startDate', startDateStr);
        params.append('endDate', endDateStr);
      }
      // If no filters provided, don't add date filters - get all records for the student
      
      const queryString = params.toString();
      const url = `/attendances?${queryString}`;
      
      const response = await secureApiService.get(url);
      // console.log('✅ Attendance API response:', response);
      
      // Normalize to a flat array of attendance records
      const payload = response.data?.data ?? response.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.attendances)) return payload.attendances;
      return [];
    } catch (error: any) {
      console.error('❌ Attendance API error:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  getStudentAttendanceStats: async (studentId: string): Promise<AttendanceStats> => {
    try {
      // console.log('🔍 Fetching attendance stats for student:', studentId);
      const response = await secureApiService.get(`/attendances/stats?studentId=${studentId}`);
      // console.log('✅ Attendance stats API response:', response);
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('❌ Attendance stats API error:', error);
      throw error;
    }
  },

  // Academic Progress
  getStudentGrades: async (studentId: string): Promise<GradeRecord[]> => {
    const response = await secureApiService.get(`/students/${studentId}/grades`);
    return response.data?.data || response.data || [];
  },

  getStudentSubjectProgress: async (studentId: string): Promise<SubjectProgress[]> => {
    const response = await secureApiService.get(`/students/${studentId}/academic-progress`);
    return response.data?.data || response.data || [];
  },

  // Exams
  getStudentExams: async (studentId: string): Promise<ExamRecord[]> => {
    const response = await secureApiService.get(`/students/${studentId}/exams`);
    return response.data?.data || response.data || [];
  },

  getUpcomingExams: async (studentId: string): Promise<ExamRecord[]> => {
    const response = await secureApiService.get(`/students/${studentId}/exams/upcoming`);
    return response.data?.data || response.data || [];
  },

  // Fees - Updated to use parent-specific endpoints
  getStudentFees: async (studentId: string, parentId: string): Promise<FeeRecord[]> => {
    const response = await secureApiService.get(`/parents/${parentId}/students/${studentId}/payments`);
    return response.data?.data || response.data || [];
  },

  getFeeHistory: async (studentId: string, parentId: string): Promise<FeeRecord[]> => {
    const response = await secureApiService.get(`/parents/${parentId}/students/${studentId}/payments?status=COMPLETED`);
    return response.data?.data || response.data || [];
  },

  // New comprehensive financial endpoints
  getFinancialSummary: async (studentId: string, parentId: string) => {
    const response = await secureApiService.get(`/parents/${parentId}/students/${studentId}/financial-summary`);
    return response.data;
  },

  getFeeStructure: async (studentId: string, parentId: string) => {
    const response = await secureApiService.get(`/parents/${parentId}/students/${studentId}/fee-structure`);
    return response.data;
  },

  getFinancialAnalytics: async (studentId: string, parentId: string, period: string = 'year') => {
    const response = await secureApiService.get(`/parents/${parentId}/students/${studentId}/financial-analytics?period=${period}`);
    return response.data;
  },

  getStudentPayments: async (studentId: string, parentId: string, filters: any = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await secureApiService.get(`/parents/${parentId}/students/${studentId}/payments?${queryParams}`);
    return response.data;
  },
};

// React Query Hooks
export const useParentChildren = () => {
  return useQuery({
    queryKey: ['parent-children'],
    queryFn: api.getParentChildren,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useParentNotifications = () => {
  return useQuery({
    queryKey: ['parent-notifications'],
    queryFn: api.getParentNotifications,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useParentDashboard = () => {
  return useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: api.getParentDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStudentAttendance = (studentId: string, filters?: { month?: number; year?: number; startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['student-attendance', studentId, filters],
    queryFn: () => api.getStudentAttendance(studentId, filters),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStudentAttendanceStats = (studentId: string) => {
  return useQuery({
    queryKey: ['student-attendance-stats', studentId],
    queryFn: () => api.getStudentAttendanceStats(studentId),
    enabled: !!studentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useStudentGrades = (studentId: string) => {
  return useQuery({
    queryKey: ['student-grades', studentId],
    queryFn: () => api.getStudentGrades(studentId),
    enabled: !!studentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useStudentSubjectProgress = (studentId: string) => {
  return useQuery({
    queryKey: ['student-subject-progress', studentId],
    queryFn: () => api.getStudentSubjectProgress(studentId),
    enabled: !!studentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useStudentExams = (studentId: string) => {
  return useQuery({
    queryKey: ['student-exams', studentId],
    queryFn: () => api.getStudentExams(studentId),
    enabled: !!studentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpcomingExams = (studentId: string) => {
  return useQuery({
    queryKey: ['upcoming-exams', studentId],
    queryFn: () => api.getUpcomingExams(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStudentFees = (studentId: string, parentId: string) => {
  return useQuery({
    queryKey: ['student-fees', studentId, parentId],
    queryFn: () => api.getStudentFees(studentId, parentId),
    enabled: !!studentId && !!parentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useFeeHistory = (studentId: string, parentId: string) => {
  return useQuery({
    queryKey: ['fee-history', studentId, parentId],
    queryFn: () => api.getFeeHistory(studentId, parentId),
    enabled: !!studentId && !!parentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// New comprehensive financial hooks
export const useFinancialSummary = (studentId: string, parentId: string) => {
  return useQuery({
    queryKey: ['financial-summary', studentId, parentId],
    queryFn: () => api.getFinancialSummary(studentId, parentId),
    enabled: !!studentId && !!parentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFeeStructure = (studentId: string, parentId: string) => {
  return useQuery({
    queryKey: ['fee-structure', studentId, parentId],
    queryFn: () => api.getFeeStructure(studentId, parentId),
    enabled: !!studentId && !!parentId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useFinancialAnalytics = (studentId: string, parentId: string, period: string = 'year') => {
  return useQuery({
    queryKey: ['financial-analytics', studentId, parentId, period],
    queryFn: () => api.getFinancialAnalytics(studentId, parentId, period),
    enabled: !!studentId && !!parentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useStudentPayments = (studentId: string, parentId: string, filters: any = {}) => {
  return useQuery({
    queryKey: ['student-payments', studentId, parentId, filters],
    queryFn: () => api.getStudentPayments(studentId, parentId, filters),
    enabled: !!studentId && !!parentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};