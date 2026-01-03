import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import secureApiService from '../../../services/secureApiService';
import {
  AttendanceRecord,
  AttendanceSummary,
  ClassAttendanceSummary,
  AttendanceStats,
  AttendanceFilter,
  BulkAttendanceData,
  PaginatedAttendanceResponse,
  Class,
  Student,
  Teacher
} from '../types/attendance';

// API Functions using secureApiService
const api = {
  // Classes
  getClasses: async (filters?: { schoolId?: string; teacherId?: string; branchId?: string; courseId?: string }): Promise<Class[]> => {
    const ctx = (secureApiService as any).getManagedContext?.() || {};
    const params = {
      ...filters,
      ...(ctx.schoolId && !filters?.schoolId ? { schoolId: ctx.schoolId } : {}),
      ...(ctx.branchId && !filters?.branchId ? { branchId: ctx.branchId } : {}),
      ...(ctx.courseId && !filters?.courseId ? { courseId: ctx.courseId } : {}),
    };
    // Call via generic get to guarantee params are sent even if helper ignores them
    const response = await secureApiService.get('/classes', { params });
    return (response as any)?.data || response || [];
  },

  getClassById: async (classId: string): Promise<Class> => {
    const response = await secureApiService.getClassById(classId);
    return response.data;
  },

  // changed to support global search
  // Students - Get students with optional class filter, supports global search
getStudents: async (filters?: { 
  classId?: string; 
  schoolId?: string; 
  status?: string;
  searchQuery?: string;
  limit?: number;
}): Promise<Student[]> => {
  console.log('🎓 Fetching students with filters:', filters);
  
  try {
    let response;
    
    // If classId is provided, fetch class-specific students
    if (filters?.classId) {
      try {
        response = await secureApiService.get(`/classes/${filters.classId}/students`);
        console.log('🎓 Students API response (class endpoint):', response);
      } catch (classError) {
        console.log('🎓 Class endpoint failed, trying students endpoint:', classError);
        // Fallback: GET /api/students?classId=:id
        response = await secureApiService.getStudents({ 
          classId: filters.classId,
          search: filters.searchQuery 
        });
        console.log('🎓 Students API response (students endpoint):', response);
      }
    } else {
      // If NO classId, fetch from all classes with search filter
      response = await secureApiService.getStudents({
        search: filters?.searchQuery,
        limit: filters?.limit || 1000
      });
      console.log('🎓 Students API response (global search):', response);
    }
    
    // Handle different response structures
    let studentsData = [];
    if (response?.data) {
      if (Array.isArray(response.data)) {
        studentsData = response.data;
      } else if (response.data.students && Array.isArray(response.data.students)) {
        studentsData = response.data.students;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        studentsData = response.data.data;
      }
    }
    
    console.log('🎓 Processed students data:', studentsData);
    return studentsData;
  } catch (error) {
    console.error('🎓 Error fetching students:', error);
    return [];
  }
},


  // Mark in time for a student
  markInTime: async (studentId: string, date: string): Promise<any> => {
    // Validate required parameters
    if (!studentId) {
      throw new Error('studentId is required for marking in time');
    }
    if (!date) {
      throw new Error('date is required for marking in time');
    }

    console.log('🎓 Marking in time for student:', studentId, 'date:', date);
    
    // Convert studentId to number and validate
    const studentIdNumber = Number(studentId);
    if (isNaN(studentIdNumber)) {
      throw new Error(`Invalid studentId: ${studentId} cannot be converted to a number`);
    }
    
    const payload = { 
      id: studentIdNumber,
      date
    };
    
    console.log('🎓 Calling secureApiService.markInTime with payload:', payload);
    
    try {
      const response = await secureApiService.markInTime(payload);
      console.log('🎓 Mark in time response:', response);
      
      if (response && response.success) {
        return response.data;
      } else {
        throw new Error(response?.message || 'Failed to mark in time');
      }
    } catch (error: any) {
      console.error('🎓 Error marking in time:', error);
      
      // Provide more specific error messages
      if (error.response?.data?.message) {
        throw new Error(`Attendance Error: ${error.response.data.message}`);
      } else if (error.message) {
        throw new Error(`Attendance Error: ${error.message}`);
      } else {
        throw new Error('Failed to mark in time. Please try again.');
      }
    }
  },

  // Mark out time for a student
  markOutTime: async (studentId: string, date: string): Promise<any> => {
    // Validate required parameters
    if (!studentId) {
      throw new Error('studentId is required for marking out time');
    }
    if (!date) {
      throw new Error('date is required for marking out time');
    }

    console.log('🎓 Marking out time for student:', studentId, 'date:', date);
    
    // Convert studentId to number and validate
    const studentIdNumber = Number(studentId);
    if (isNaN(studentIdNumber)) {
      throw new Error(`Invalid studentId: ${studentId} cannot be converted to a number`);
    }
    
    const payload = { 
      id: studentIdNumber,
      date
    };
    
    console.log('🎓 Calling secureApiService.markOutTime with payload:', payload);
    
    try {
      const response = await secureApiService.markOutTime(payload);
      console.log('🎓 Mark out time response:', response);
      
      if (response && response.success) {
        return response.data;
      } else {
        throw new Error(response?.message || 'Failed to mark out time');
      }
    } catch (error: any) {
      console.error('🎓 Error marking out time:', error);
      
      // Provide more specific error messages
      if (error.response?.data?.message) {
        throw new Error(`Attendance Error: ${error.response.data.message}`);
      } else if (error.message) {
        throw new Error(`Attendance Error: ${error.message}`);
      } else {
        throw new Error('Failed to mark out time. Please try again.');
      }
    }
  },

  getStudentById: async (studentId: string): Promise<Student> => {
    const response = await secureApiService.getStudentById(studentId);
    return response.data;
  },

  // Teachers
  getTeachers: async (filters?: { schoolId?: string; status?: string; branchId?: string; courseId?: string }): Promise<Teacher[]> => {
    const ctx = (secureApiService as any).getManagedContext?.() || {};
    const params = {
      ...filters,
      ...(ctx.schoolId && !filters?.schoolId ? { schoolId: ctx.schoolId } : {}),
      ...(ctx.branchId && !filters?.branchId ? { branchId: ctx.branchId } : {}),
      ...(ctx.courseId && !filters?.courseId ? { courseId: ctx.courseId } : {}),
      include: 'school,subjects',
      limit: 100
    };
    const response = await secureApiService.get('/teachers', { params });
    return (response as any)?.data || response || [];
  },

  // Attendance Records
  getAttendanceRecords: async (filters: AttendanceFilter): Promise<AttendanceRecord[]> => {
    const ctx = (secureApiService as any).getManagedContext?.() || {};
    const params = {
      ...filters,
      ...(ctx.schoolId && !filters?.schoolId ? { schoolId: ctx.schoolId } : {}),
      ...(ctx.branchId && !filters?.branchId ? { branchId: ctx.branchId } : {}),
      ...(ctx.courseId && !filters?.courseId ? { courseId: ctx.courseId } : {}),
    };
    const response = await secureApiService.getAttendanceRecords(params);
    return response.data || [];
  },

  getAttendanceRecordsPaginated: async (
    filters: AttendanceFilter & { page?: number; limit?: number }
  ): Promise<PaginatedAttendanceResponse> => {
    const response = await secureApiService.getAttendanceRecords(filters);
    
    return {
      records: response.data || [],
      total: response.meta?.total || 0,
      page: response.meta?.page || 1,
      totalPages: response.meta?.totalPages || 1
    };
  },

  getAttendanceById: async (attendanceId: string): Promise<AttendanceRecord> => {
    const response = await secureApiService.get(`/attendance/${attendanceId}`);
    return response.data;
  },

  createAttendanceRecord: async (data: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    const response = await secureApiService.post('/attendances', data);
    return response.data;
  },

  markStudentLeave: async (data: {
    studentId: string;
    classId?: string;
    date: string;
    reason: string;
    remarks?: string;
    leaveDocument?: File;
  }): Promise<any> => {
    console.log('📤 Sending leave request:', data);
    console.log('📎 Document to upload:', data.leaveDocument ? data.leaveDocument.name : 'None');
    
    const formData = new FormData();
    formData.append('studentId', data.studentId);
    formData.append('date', data.date);
    formData.append('reason', data.reason);
    
    if (data.classId) {
      formData.append('classId', data.classId);
    }
    
    if (data.remarks) {
      formData.append('remarks', data.remarks);
    }
    
    if (data.leaveDocument) {
      formData.append('leaveDocument', data.leaveDocument);
      console.log('📎 Attached file:', {
        name: data.leaveDocument.name,
        size: data.leaveDocument.size,
        type: data.leaveDocument.type
      });
    }

    // Log FormData contents
    console.log('📋 FormData entries:');
    for (let pair of formData.entries()) {
      console.log(`  ${pair[0]}:`, pair[1]);
    }

    // Use raw axios instance to avoid encryption interference with FormData
    const token = localStorage.getItem('token');
    
    // CRITICAL: Delete Content-Type so browser sets it with proper boundary
    const response = await secureApiService.api.post('/attendances/mark-leave', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': undefined, // Let axios/browser set the correct multipart boundary
      },
      transformRequest: [(data) => data], // Don't transform FormData
    });
    
    console.log('📥 Response:', response.data);
    return response.data;
  },

  updateAttendanceRecord: async (attendanceId: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    const response = await secureApiService.put(`/attendance/${attendanceId}`, data);
    return response.data;
  },

  deleteAttendanceRecord: async (attendanceId: string): Promise<void> => {
    await secureApiService.delete(`/attendance/${attendanceId}`);
  },

  // Bulk Operations
  bulkCreateAttendance: async (data: BulkAttendanceData): Promise<{ success: boolean; message: string; records: AttendanceRecord[] }> => {
    const response = await secureApiService.post('/attendance/bulk', data);
    return response.data;
  },

  bulkUpdateAttendance: async (classId: string, date: string, data: BulkAttendanceData): Promise<{ success: boolean; message: string; records: AttendanceRecord[] }> => {
    const response = await secureApiService.put(`/attendance/bulk/${classId}/${date}`, data);
    return response.data;
  },

  // Summaries and Stats
  getAttendanceSummary: async (filters: AttendanceFilter): Promise<AttendanceSummary> => {
    // Use the correct endpoint that counts actual students, not attendance records
    if (filters.classId && filters.startDate) {
      // Use class-specific summary for accurate student count
      const response = await secureApiService.getClassAttendanceSummary({ 
        classId: filters.classId, 
        date: filters.startDate 
      });
      return response.data;
    } else {
      // Fallback to general summary for other cases
      // Transform filters to match backend API expectations
      const params: any = {
        classId: filters.classId,
        schoolId: filters.schoolId,
        teacherId: filters.teacherId,
        studentId: filters.studentId
      };
      
      // Convert startDate/endDate to date parameter that backend expects
      if (filters.startDate) {
        params.date = filters.startDate;
      }
      
      const response = await secureApiService.getAttendanceSummary(params);
      return response.data;
    }
  },

  getClassAttendanceSummary: async (classId: string, date: string): Promise<ClassAttendanceSummary> => {
    try {
      const response = await secureApiService.getClassAttendanceSummary({ classId, date });
      console.log('🎓 Class attendance summary response:', response);
      
      // Handle different response structures
      let summaryData = response?.data;
      if (!summaryData && response) {
        summaryData = response;
      }
      
      // Ensure we have a valid structure
      if (!summaryData) {
        return {
          classId,
          date,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
          attendanceRate: 0,
          students: []
        };
      }
      
      return summaryData;
    } catch (error) {
      console.error('🎓 Error fetching class attendance summary:', error);
      // Return default structure instead of throwing
      return {
        classId,
        date,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
        attendanceRate: 0,
        students: []
      };
    }
  },

  getAttendanceStats: async (filters: AttendanceFilter): Promise<AttendanceStats> => {
    const response = await secureApiService.getAttendanceStats(filters);
    return response.data;
  },

  getAttendanceAnalytics: async (params: any): Promise<any> => {
    const response = await secureApiService.getAttendanceAnalytics(params);
    return response.data;
  },

  // Export
  exportAttendanceData: async (filters: AttendanceFilter, format: 'pdf' | 'excel' | 'csv'): Promise<Blob> => {
    const params: any = { format };
    if (filters.classId) params.classId = filters.classId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    
    return await secureApiService.exportAttendanceData(params);
  },

  // Monthly Matrix
  getMonthlyAttendanceMatrix: async (classId: string, month: number, year: number): Promise<any> => {
    try {
      const response = await secureApiService.getMonthlyAttendanceMatrix(classId, month, year);
      console.log('🎓 Monthly attendance matrix response:', response);
      
      // Handle different response structures
      let matrixData = response?.data;
      if (!matrixData && response) {
        matrixData = response;
      }
      
      // Ensure we have a valid structure
      if (!matrixData) {
        return {
          classId,
          month,
          year,
          students: [],
          totalDays: new Date(year, month, 0).getDate()
        };
      }
      
      return matrixData;
    } catch (error) {
      console.error('🎓 Error fetching monthly attendance matrix:', error);
      // Return default structure instead of throwing
      return {
        classId,
        month,
        year,
        students: [],
        totalDays: new Date(year, month, 0).getDate()
      };
    }
  },

  // Bulk OCR Attendance
  bulkOCRAttendance: async (data: {
    studentId: string;
    classId?: string;
    image: string; // Base64 encoded image
    rowNumber: number;
    startDate: string;
    numDays: number;
  }): Promise<any> => {
    console.log('📸 Sending bulk OCR attendance request (UNENCRYPTED):', {
      studentId: data.studentId,
      classId: data.classId,
      rowNumber: data.rowNumber,
      startDate: data.startDate,
      numDays: data.numDays,
      imageLength: data.image?.length || 0,
      hasImage: !!data.image
    });

    // Ensure all required fields are present
    if (!data.studentId) {
      throw new Error('Student ID is required');
    }
    if (!data.image) {
      throw new Error('Image is required');
    }
    if (!data.rowNumber || data.rowNumber < 1) {
      throw new Error('Valid row number is required');
    }
    if (!data.startDate) {
      throw new Error('Start date is required');
    }
    if (!data.numDays || data.numDays < 1) {
      throw new Error('Number of days is required');
    }

    const payload = {
      studentId: String(data.studentId),
      classId: data.classId ? String(data.classId) : undefined,
      image: data.image,
      rowNumber: Number(data.rowNumber),
      startDate: data.startDate,
      numDays: Number(data.numDays)
    };

    console.log('📤 Final payload (unencrypted):', {
      ...payload,
      image: `${payload.image.substring(0, 50)}...` // Log only first 50 chars
    });

    // Get token for authentication
    const token = localStorage.getItem('token');
    
    // Send UNENCRYPTED request directly (image is too large for encryption)
    const response = await secureApiService.api.post('/attendances/bulk-ocr', payload, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minutes for OCR processing
    });
    
    console.log('✅ Bulk OCR attendance response:', response.data);
    return response.data;
  }
};

// Mark incomplete/blank attendance as absent for a date and optional class
export const markIncompleteAttendanceAsAbsent = async (date?: string, classId?: string) => {
  const payload: { date?: string; classId?: string } = {};
  if (date) payload.date = date;
  if (classId) payload.classId = classId;
  const resp = await secureApiService.markIncompleteAttendanceAsAbsent(payload);
  return resp?.data || resp;
};

// React Query Hooks
export const useClasses = (filters?: { schoolId?: string; teacherId?: string }) => {
  return useQuery({
    queryKey: ['classes', filters],
    queryFn: () => api.getClasses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useClass = (classId: string) => {
  return useQuery({
    queryKey: ['class', classId],
    queryFn: () => api.getClassById(classId),
    enabled: !!classId,
  });
};


//changed to support global search
export const useStudents = (filters?: { 
  classId?: string; 
  schoolId?: string; 
  status?: string;
  searchQuery?: string;
  limit?: number;
}) => {
  // Enable fetching if:
  // 1. classId is provided (class-specific search)
  // 2. OR searchQuery is provided (global search across all classes)
  const shouldFetch = !!filters?.classId || !!filters?.searchQuery;

  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => api.getStudents(filters),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};

export const useClassAttendanceSummary = (classId?: string, date?: string) => {
  return useQuery({
    queryKey: ['class-attendance-summary', classId, date],
    queryFn: () => api.getClassAttendanceSummary(classId!, date!),
    enabled: !!classId && !!date, // Only fetch when both classId and date are provided
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

export const useMarkInTime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, date }: { studentId: string; date: string }) => 
      api.markInTime(studentId, date),
    onSuccess: () => {
      // Invalidate and refetch attendance summary
      queryClient.invalidateQueries({ queryKey: ['class-attendance-summary'] });
    },
  });
};

export const useMarkOutTime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, date }: { studentId: string; date: string }) => 
      api.markOutTime(studentId, date),
    onSuccess: () => {
      // Invalidate and refetch attendance summary
      queryClient.invalidateQueries({ queryKey: ['class-attendance-summary'] });
    },
  });
};

export const useStudent = (studentId: string) => {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: () => api.getStudentById(studentId),
    enabled: !!studentId,
  });
};

export const useTeachers = (filters?: { schoolId?: string; status?: string }) => {
  return useQuery({
    queryKey: ['teachers', filters],
    queryFn: () => api.getTeachers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAttendanceRecords = (filters: AttendanceFilter) => {
  return useQuery({
    queryKey: ['attendance-records', filters],
    queryFn: () => api.getAttendanceRecords(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAttendanceRecordsPaginated = (filters: AttendanceFilter & { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['attendance-records-paginated', filters],
    queryFn: () => api.getAttendanceRecordsPaginated(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAttendanceRecord = (attendanceId: string) => {
  return useQuery({
    queryKey: ['attendance-record', attendanceId],
    queryFn: () => api.getAttendanceById(attendanceId),
    enabled: !!attendanceId,
  });
};

export const useAttendanceSummary = (filters: AttendanceFilter) => {
  return useQuery({
    queryKey: ['attendance-summary', filters],
    queryFn: () => api.getAttendanceSummary(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};


export const useAttendanceStats = (filters: AttendanceFilter) => {
  return useQuery({
    queryKey: ['attendance-stats', filters],
    queryFn: () => api.getAttendanceStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAttendanceAnalytics = (params: any) => {
  return useQuery({
    queryKey: ['attendance-analytics', params],
    queryFn: () => api.getAttendanceAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMonthlyAttendanceMatrix = (classId: string, month: number, year: number) => {
  return useQuery({
    queryKey: ['monthly-attendance-matrix', classId, month, year],
    queryFn: () => api.getMonthlyAttendanceMatrix(classId, month, year),
    enabled: !!classId && !!month && !!year,
  });
};

// Mutation Hooks
export const useCreateAttendanceRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createAttendanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
};

export const useUpdateAttendanceRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttendanceRecord> }) => 
      api.updateAttendanceRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
};

export const useDeleteAttendanceRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteAttendanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
};

export const useBulkCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.bulkCreateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
};

export const useBulkUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ classId, date, data }: { classId: string; date: string; data: BulkAttendanceData }) => 
      api.bulkUpdateAttendance(classId, date, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
  });
};

export const useBulkOCRAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      studentId: string;
      classId?: string;
      image: string;
      rowNumber: number;
      startDate: string;
      numDays: number;
    }) => api.bulkOCRAttendance(data),
    onSuccess: () => {
      // Invalidate all attendance-related queries
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['class-attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-attendance-matrix'] });
    },
  });
};


// Utility Functions
export const getDateRangeFromFilter = (dateRange: string): { startDate: string; endDate: string } => {
  const today = new Date();
  const startDate = new Date();
  const endDate = new Date();
  
  switch (dateRange) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      startDate.setDate(today.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(today.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate.setDate(today.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate.setMonth(today.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'quarter':
      startDate.setMonth(today.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      startDate.setFullYear(today.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'custom':
    default:
      // Use provided dates or defaults
      break;
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

export const formatTime = (time: string): string => {
  if (!time) return '--';
  const date = new Date(time);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

export const calculateTotalHours = (inTime: string, outTime: string): number => {
  if (!inTime || !outTime) return 0;
  const start = new Date(inTime);
  const end = new Date(outTime);
  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimal places
};

export default api;