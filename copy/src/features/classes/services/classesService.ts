// copy/src/features/classes/services/classesService.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import secureApiService, { ApiResponse } from '../../../services/secureApiService';
import {
  Class,
  ClassCreateRequest,
  ClassUpdateRequest,
  ClassSearchParams,
  ClassStats,
  ClassAnalytics,
  PaginationMeta
} from '../types/classes';

// Helper to get managed context for query keys
const getManagedContext = () => {
  const context = secureApiService.getManagedContext();
  return {
    schoolId: context.schoolId || null,
    branchId: context.branchId || null,
    courseId: context.courseId || null,
  };
};

// ======================
// QUERY KEYS
// ======================

export const classesQueryKeys = {
  all: ['classes'] as const,
  lists: () => {
    const context = getManagedContext();
    return [...classesQueryKeys.all, 'list', context] as const;
  },
  list: (params: ClassSearchParams) => {
    const context = getManagedContext();
    return [...classesQueryKeys.all, 'list', context, params] as const;
  },
  details: () => {
    const context = getManagedContext();
    return [...classesQueryKeys.all, 'detail', context] as const;
  },
  detail: (id: string) => {
    const context = getManagedContext();
    return [...classesQueryKeys.details(), id] as const;
  },
  stats: () => {
    const context = getManagedContext();
    return [...classesQueryKeys.all, 'stats', context] as const;
  },
  analytics: (params: any) => {
    const context = getManagedContext();
    return [...classesQueryKeys.all, 'analytics', context, params] as const;
  },
  students: (classId: string) => {
    const context = getManagedContext();
    return [...classesQueryKeys.all, 'students', context, classId] as const;
  },
  subjects: (classId: string) => {
    const context = getManagedContext();
    return [...classesQueryKeys.all, 'subjects', context, classId] as const;
  },
  timetables: (classId: string) => {
    const context = getManagedContext();
    return [...classesQueryKeys.all, 'timetables', context, classId] as const;
  },
};

// ======================
// API FUNCTIONS
// ======================

const classesApi = {
  // Get all classes with pagination and filters
  getClasses: async (params: ClassSearchParams = {}): Promise<ApiResponse<Class[]>> => {
    // Include managed context params explicitly for servers that rely on query string instead of headers
    const context = secureApiService.getManagedContext();
    const scopedParams = {
      ...params,
      ...(context.schoolId ? { schoolId: context.schoolId } : {}),
      ...(context.branchId ? { branchId: context.branchId } : {}),
      ...(context.courseId ? { courseId: context.courseId } : {}),
    };
    const response = await secureApiService.get<Class[]>(`/classes`, { params: scopedParams });
    return response;
  },

  // Get class by ID
  getClassById: async (id: string): Promise<ApiResponse<Class>> => {
    const response = await secureApiService.get<Class>(`/classes/${id}`);
    return response;
  },

  // Create new class
  createClass: async (data: ClassCreateRequest): Promise<ApiResponse<Class>> => {
    const response = await secureApiService.createClass(data);
    return response;
  },

  // Update class
  updateClass: async (id: string, data: ClassUpdateRequest): Promise<ApiResponse<Class>> => {
    const response = await secureApiService.updateClass(id, data);
    return response;
  },

  // Delete class
  deleteClass: async (id: string): Promise<ApiResponse<void>> => {
    const response = await secureApiService.deleteClass(id);
    return response;
  },

  // Get class statistics (scoped by managed context)
  getClassStats: async (): Promise<ApiResponse<ClassStats>> => {
    const context = secureApiService.getManagedContext();
    const scopedParams = {
      ...(context.schoolId ? { schoolId: context.schoolId } : {}),
      ...(context.branchId ? { branchId: context.branchId } : {}),
      ...(context.courseId ? { courseId: context.courseId } : {}),
    };
    const response = await secureApiService.get<ClassStats>(`/classes/stats`, { params: scopedParams });
    return response;
  },

  // Get class analytics
  getClassAnalytics: async (params: any = {}): Promise<ApiResponse<ClassAnalytics>> => {
    const response = await secureApiService.get<ClassAnalytics>(`/classes/analytics`, { params });
    return response;
  },

  // Get students in a class
  getClassStudents: async (classId: string): Promise<ApiResponse<any[]>> => {
    const response = await secureApiService.get<any[]>(`/classes/${classId}/students`);
    return response;
  },

  // Get subjects in a class
  getClassSubjects: async (classId: string): Promise<ApiResponse<any[]>> => {
    const response = await secureApiService.get<any[]>(`/classes/${classId}/subjects`);
    return response;
  },

  // Get timetables for a class
  getClassTimetables: async (classId: string): Promise<ApiResponse<any[]>> => {
    const response = await secureApiService.get<any[]>(`/classes/${classId}/timetables`);
    return response;
  },

  // Move students to a class (update existing students' class assignment)
  addStudentsToClass: async (classId: string, studentIds: number[]): Promise<ApiResponse<any>> => {
    // Update each student individually to assign them to the new class
    const results = [];
    for (const studentId of studentIds) {
      try {
        const response = await secureApiService.updateStudent(studentId.toString(), {
          classId: Number(classId)
        });
        results.push({ studentId, success: true, data: response });
      } catch (error) {
        results.push({ studentId, success: false, error });
      }
    }
    
    // Return success if at least one student was updated
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      return {
        success: true,
        data: results,
        message: `Successfully moved ${successCount} out of ${studentIds.length} students to class ${classId}`
      };
    } else {
      return {
        success: false,
        data: results,
        message: 'Failed to move any students to the class'
      };
    }
  },

  // Remove students from a class
  removeStudentsFromClass: async (classId: string, studentIds: number[]): Promise<ApiResponse<void>> => {
    const response = await secureApiService.delete<void>(`/classes/${classId}/students`, {
      data: { studentIds }
    });
    return response;
  },

  // Remove a single student from a class (set classId to null)
  removeStudentFromClass: async (studentId: string, fromClassId: string): Promise<ApiResponse<any>> => {
    console.log('🔍 removeStudentFromClass called with:', { studentId, fromClassId });
    
    // Send only classId and fromClassId in body, student ID is in URL
    const response = await secureApiService.updateStudentClass(studentId, {
      classId: null,        // Set to null to unassign
      fromClassId: fromClassId // Include the current class ID for context
    });
    
    console.log('🔍 Request URL:', `/students/${studentId}`);
    console.log('🔍 Request data being sent:', { classId: null, fromClassId });
    
    console.log('🔍 removeStudentFromClass response:', response);
    return response;
  },
};

// ======================
// REACT QUERY HOOKS
// ======================

// Get all classes
export const useClasses = (params: ClassSearchParams = {}) => {
  return useQuery({
    queryKey: classesQueryKeys.list(params),
    queryFn: () => classesApi.getClasses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// Get class by ID
export const useClass = (id: string) => {
  return useQuery({
    queryKey: classesQueryKeys.detail(id),
    queryFn: () => classesApi.getClassById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// Get class statistics
export const useClassStats = () => {
  const context = getManagedContext();
  
  return useQuery({
    queryKey: classesQueryKeys.stats(), // This includes the managed context
    queryFn: () => classesApi.getClassStats(),
    staleTime: 0, // Always consider data stale, refetch when context changes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch when component mounts (e.g., when switching tabs or context changes)
    refetchOnReconnect: false,
  });
};

// Get class analytics
export const useClassAnalytics = (params: any = {}) => {
  return useQuery({
    queryKey: classesQueryKeys.analytics(params),
    queryFn: () => classesApi.getClassAnalytics(params),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// Get students in a class
export const useClassStudents = (classId: string) => {
  return useQuery({
    queryKey: classesQueryKeys.students(classId),
    queryFn: () => classesApi.getClassStudents(classId),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// Get subjects in a class
export const useClassSubjects = (classId: string) => {
  return useQuery({
    queryKey: classesQueryKeys.subjects(classId),
    queryFn: () => classesApi.getClassSubjects(classId),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// Get timetables for a class
export const useClassTimetables = (classId: string) => {
  return useQuery({
    queryKey: classesQueryKeys.timetables(classId),
    queryFn: () => classesApi.getClassTimetables(classId),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

// ======================
// MUTATION HOOKS
// ======================

// Create class mutation
export const useCreateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ClassCreateRequest) => classesApi.createClass(data),
    onSuccess: () => {
      // Invalidate ALL class queries to ensure fresh data is fetched
      // This includes all queries with the current managed context
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.all });
      // Also invalidate stats specifically since dashboard needs to update
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.stats() });
      // Also invalidate any pagination queries
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

// Update class mutation
export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClassUpdateRequest }) => 
      classesApi.updateClass(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific class and lists
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.stats() });
    },
  });
};

// Delete class mutation
export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => classesApi.deleteClass(id),
    onSuccess: () => {
      // Invalidate classes list and stats
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.stats() });
    },
  });
};

// Add students to class mutation
export const useAddStudentsToClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ classId, studentIds }: { classId: string; studentIds: number[] }) => 
      classesApi.addStudentsToClass(classId, studentIds),
    onSuccess: (_, { classId }) => {
      // Invalidate class details and students list
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.detail(classId) });
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.students(classId) });
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.stats() });
    },
  });
};

// Remove students from class mutation
export const useRemoveStudentsFromClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ classId, studentIds }: { classId: string; studentIds: number[] }) => 
      classesApi.removeStudentsFromClass(classId, studentIds),
    onSuccess: (_, { classId }) => {
      // Invalidate class details and students list
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.detail(classId) });
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.students(classId) });
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.stats() });
    },
  });
};

// Remove single student from class mutation
export const useRemoveStudentFromClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, fromClassId }: { studentId: string; fromClassId: string }) => 
      classesApi.removeStudentFromClass(studentId, fromClassId),
    onSuccess: (_, { fromClassId }) => {
      // Invalidate all class-related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: classesQueryKeys.students(fromClassId) });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};;