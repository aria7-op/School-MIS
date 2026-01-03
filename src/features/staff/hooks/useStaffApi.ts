import { useState, useCallback } from 'react';
import { staffApi } from '../../../services/api/client';

// Types
export interface Staff {
  id: number;
  username: string;
  email: string;
  phone: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate?: string;
  avatar?: string;
  bio?: string;
  employeeId: string;
  departmentId: number;
  designation: string;
  joiningDate: string;
  salary: number;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  schoolId: number;
  timezone?: string;
  locale?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  department?: any;
  attendances?: any[];
  payrolls?: any[];
  documents?: any[];
  bookIssues?: any[];
  school?: any;
}

export interface CreateStaffData {
  username: string;
  email: string;
  phone: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate?: string;
  avatar?: string;
  bio?: string;
  employeeId: string;
  departmentId: number;
  designation: string;
  joiningDate: string;
  salary: number;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  schoolId: number;
  timezone?: string;
  locale?: string;
  metadata?: Record<string, any>;
}

export interface UpdateStaffData {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate?: string;
  avatar?: string;
  bio?: string;
  designation?: string;
  salary?: number;
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  timezone?: string;
  locale?: string;
  metadata?: Record<string, any>;
}

export interface StaffFilters {
  search?: string;
  designation?: string;
  departmentId?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  minSalary?: number;
  maxSalary?: number;
  joiningDateAfter?: string;
  joiningDateBefore?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  include?: string;
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  suspendedStaff: number;
  averageSalary: number;
  totalSalary: number;
  departmentStats: Array<{
    departmentId: number;
    departmentName: string;
    count: number;
  }>;
  designationStats: Array<{
    designation: string;
    count: number;
  }>;
  genderStats: Array<{
    gender: string;
    count: number;
  }>;
  joiningTrend: Array<{
    month: string;
    count: number;
  }>;
}

export interface StaffAnalytics {
  attendanceRate: number;
  averageWorkingHours: number;
  performanceScore: number;
  salaryGrowth: number;
  departmentRanking: number;
  recentActivities: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

export interface StaffPerformance {
  attendanceScore: number;
  taskCompletionRate: number;
  feedbackScore: number;
  salaryEfficiency: number;
  overallRating: number;
  strengths: string[];
  areasForImprovement: string[];
}

export interface StaffDashboard {
  quickStats: {
    totalDaysWorked: number;
    totalHoursWorked: number;
    currentMonthAttendance: number;
    upcomingEvents: number;
  };
  recentPayrolls: Array<{
    id: number;
    amount: number;
    date: string;
    status: string;
  }>;
  upcomingEvents: Array<{
    id: number;
    title: string;
    date: string;
    type: string;
  }>;
  notifications: Array<{
    id: number;
    message: string;
    type: string;
    date: string;
  }>;
}

export interface BulkCreateStaffData {
  staff: CreateStaffData[];
  skipDuplicates?: boolean;
}

export interface BulkUpdateStaffData {
  updates: Array<{
    id: number;
    data: UpdateStaffData;
  }>;
}

export interface BulkDeleteStaffData {
  staffIds: number[];
}

export interface ImportStaffData {
  staff: CreateStaffData[];
  user: {
    id: number;
    role: string;
  };
}

export interface ExportOptions {
  format: 'json' | 'csv';
  departmentId?: number;
  status?: string;
  joiningDateAfter?: string;
  joiningDateBefore?: string;
}

export interface StaffReport {
  summary: {
    totalStaff: number;
    activeStaff: number;
    totalSalary: number;
    averageSalary: number;
  };
  departmentBreakdown: Array<{
    departmentName: string;
    count: number;
    totalSalary: number;
    averageSalary: number;
  }>;
  designationBreakdown: Array<{
    designation: string;
    count: number;
    totalSalary: number;
    averageSalary: number;
  }>;
  joiningTrend: Array<{
    month: string;
    count: number;
  }>;
  salaryDistribution: Array<{
    range: string;
    count: number;
  }>;
}

export interface StaffComparison {
  staff: Array<{
    id: number;
    name: string;
    designation: string;
    department: string;
    salary: number;
    joiningDate: string;
    attendanceRate: number;
    performanceScore: number;
  }>;
  comparison: {
    salaryRange: {
      min: number;
      max: number;
      average: number;
    };
    attendanceRange: {
      min: number;
      max: number;
      average: number;
    };
    performanceRange: {
      min: number;
      max: number;
      average: number;
    };
  };
}

export interface CacheStats {
  totalKeys: number;
  hitRate: number;
  missRate: number;
  memoryUsage: number;
  lastWarmed: string;
}

export interface EmployeeIdSuggestion {
  suggestions: string[];
  nextAvailable: string;
}

const useStaffApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestFn();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Basic CRUD Operations
  const createStaff = useCallback(async (data: CreateStaffData): Promise<Staff> => {
    return handleRequest(async () => {
      const response = await staffApi.createStaff(data);
      return response.data;
    });
  }, [handleRequest]);

  const getStaff = useCallback(async (filters?: StaffFilters): Promise<{ data: Staff[]; meta: any }> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaff(filters);
      return response;
    });
  }, [handleRequest]);

  const getStaffById = useCallback(async (id: number, include?: string): Promise<Staff> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffById(id.toString(), { include });
      return response.data;
    });
  }, [handleRequest]);

  const updateStaff = useCallback(async (id: number, data: UpdateStaffData): Promise<Staff> => {
    return handleRequest(async () => {
      const response = await staffApi.updateStaff(id.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const deleteStaff = useCallback(async (id: number): Promise<void> => {
    return handleRequest(async () => {
      await staffApi.deleteStaff(id.toString());
    });
  }, [handleRequest]);

  const restoreStaff = useCallback(async (id: number): Promise<Staff> => {
    return handleRequest(async () => {
      const response = await staffApi.restoreStaff(id.toString());
      return response.data;
    });
  }, [handleRequest]);

  // Statistics & Analytics
  const getStaffStats = useCallback(async (id: number): Promise<StaffStats> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffStats(id.toString());
      return response.data;
    });
  }, [handleRequest]);

  const getStaffAnalytics = useCallback(async (id: number, period?: string): Promise<StaffAnalytics> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffAnalytics(id.toString(), { period });
      return response.data;
    });
  }, [handleRequest]);

  const getStaffPerformance = useCallback(async (id: number): Promise<StaffPerformance> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffPerformance(id.toString());
      return response.data;
    });
  }, [handleRequest]);

  const getStaffDashboard = useCallback(async (id: number): Promise<StaffDashboard> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffDashboard(id.toString());
      return response.data;
    });
  }, [handleRequest]);

  // Bulk Operations
  const bulkCreateStaff = useCallback(async (data: BulkCreateStaffData): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.bulkCreateStaff(data);
      return response;
    });
  }, [handleRequest]);

  const bulkUpdateStaff = useCallback(async (data: BulkUpdateStaffData): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.bulkUpdateStaff(data);
      return response;
    });
  }, [handleRequest]);

  const bulkDeleteStaff = useCallback(async (data: BulkDeleteStaffData): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.bulkDeleteStaff(data);
      return response;
    });
  }, [handleRequest]);

  // Search & Filter
  const searchStaff = useCallback(async (query: string, include?: string): Promise<{ data: Staff[]; meta: any }> => {
    return handleRequest(async () => {
      const response = await staffApi.searchStaff({ q: query, include });
      return response;
    });
  }, [handleRequest]);

  // Export & Import
  const exportStaff = useCallback(async (options: ExportOptions): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.exportStaff(options);
      return response;
    });
  }, [handleRequest]);

  const importStaff = useCallback(async (data: ImportStaffData): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.importStaff(data);
      return response;
    });
  }, [handleRequest]);

  // Utility Endpoints
  const getEmployeeIdSuggestions = useCallback(async (designation?: string): Promise<EmployeeIdSuggestion> => {
    return handleRequest(async () => {
      const response = await staffApi.getEmployeeIdSuggestions({ designation });
      return response.data;
    });
  }, [handleRequest]);

  const getStaffCountByDepartment = useCallback(async (): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffCountByDepartment();
      return response.data;
    });
  }, [handleRequest]);

  const getStaffCountByDesignation = useCallback(async (): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffCountByDesignation();
      return response.data;
    });
  }, [handleRequest]);

  const getStaffBySchool = useCallback(async (schoolId: number, include?: string): Promise<{ data: Staff[]; meta: any }> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffBySchool(schoolId.toString(), { include });
      return response;
    });
  }, [handleRequest]);

  const getStaffByDepartment = useCallback(async (departmentId: number, include?: string): Promise<{ data: Staff[]; meta: any }> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffByDepartment(departmentId.toString(), { include });
      return response;
    });
  }, [handleRequest]);

  // Advanced Features
  const generateStaffReport = useCallback(async (filters?: {
    departmentId?: number;
    status?: string;
    joiningDateAfter?: string;
    joiningDateBefore?: string;
  }): Promise<StaffReport> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffReport(filters);
      return response.data;
    });
  }, [handleRequest]);

  const compareStaff = useCallback(async (staffIds: number[]): Promise<StaffComparison> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffComparison({ staffIds });
      return response.data;
    });
  }, [handleRequest]);

  // Cache Management
  const getCacheStats = useCallback(async (): Promise<CacheStats> => {
    return handleRequest(async () => {
      const response = await staffApi.getCacheStats();
      return response.data;
    });
  }, [handleRequest]);

  const warmCache = useCallback(async (data: { staffId?: number; schoolId?: number }): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.warmCache(data);
      return response;
    });
  }, [handleRequest]);

  const clearCache = useCallback(async (): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.clearCache();
      return response;
    });
  }, [handleRequest]);

  // ======================
  // COLLABORATION API
  // ======================
  const getStaffCollaboration = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffCollaboration(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const createStaffCollaboration = useCallback(async (staffId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.createStaffCollaboration(staffId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const updateStaffCollaboration = useCallback(async (staffId: number, collaborationId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.updateStaffCollaboration(staffId.toString(), collaborationId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const deleteStaffCollaboration = useCallback(async (staffId: number, collaborationId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.deleteStaffCollaboration(staffId.toString(), collaborationId.toString());
      return response;
    });
  }, [handleRequest]);

  const getStaffProjects = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffProjects(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const createStaffProject = useCallback(async (staffId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.createStaffProject(staffId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const getStaffTeams = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffTeams(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const assignStaffToTeam = useCallback(async (staffId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.assignStaffToTeam(staffId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const getStaffMeetings = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffMeetings(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const scheduleStaffMeeting = useCallback(async (staffId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.scheduleStaffMeeting(staffId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  // ======================
  // DOCUMENTS API
  // ======================
  const getStaffDocuments = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffDocuments(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const uploadStaffDocument = useCallback(async (staffId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.uploadStaffDocument(staffId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const getStaffDocument = useCallback(async (staffId: number, documentId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffDocument(staffId.toString(), documentId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const updateStaffDocument = useCallback(async (staffId: number, documentId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.updateStaffDocument(staffId.toString(), documentId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const deleteStaffDocument = useCallback(async (staffId: number, documentId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.deleteStaffDocument(staffId.toString(), documentId.toString());
      return response;
    });
  }, [handleRequest]);

  const getDocumentCategories = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getDocumentCategories(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const createDocumentCategory = useCallback(async (staffId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.createDocumentCategory(staffId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const searchStaffDocuments = useCallback(async (staffId: number, params?: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.searchStaffDocuments(staffId.toString(), params);
      return response.data;
    });
  }, [handleRequest]);

  const verifyStaffDocument = useCallback(async (staffId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.verifyStaffDocument(staffId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const getExpiringDocuments = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getExpiringDocuments(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  // ======================
  // TASKS API
  // ======================
  const getStaffTasks = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffTasks(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const createStaffTask = useCallback(async (staffId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.createStaffTask(staffId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const getStaffTask = useCallback(async (staffId: number, taskId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getStaffTask(staffId.toString(), taskId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const updateStaffTask = useCallback(async (staffId: number, taskId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.updateStaffTask(staffId.toString(), taskId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const deleteStaffTask = useCallback(async (staffId: number, taskId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.deleteStaffTask(staffId.toString(), taskId.toString());
      return response;
    });
  }, [handleRequest]);

  const assignStaffTask = useCallback(async (staffId: number, taskId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.assignStaffTask(staffId.toString(), taskId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  const completeStaffTask = useCallback(async (staffId: number, taskId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.completeStaffTask(staffId.toString(), taskId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const getOverdueTasks = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getOverdueTasks(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const getCompletedTasks = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getCompletedTasks(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const getTaskStatistics = useCallback(async (staffId: number): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.getTaskStatistics(staffId.toString());
      return response.data;
    });
  }, [handleRequest]);

  const bulkAssignTasks = useCallback(async (staffId: number, data: any): Promise<any> => {
    return handleRequest(async () => {
      const response = await staffApi.bulkAssignTasks(staffId.toString(), data);
      return response.data;
    });
  }, [handleRequest]);

  return {
    loading,
    error,
    // Basic CRUD
    createStaff,
    getStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    restoreStaff,
    // Statistics & Analytics
    getStaffStats,
    getStaffAnalytics,
    getStaffPerformance,
    getStaffDashboard,
    // Bulk Operations
    bulkCreateStaff,
    bulkUpdateStaff,
    bulkDeleteStaff,
    // Search & Filter
    searchStaff,
    // Export & Import
    exportStaff,
    importStaff,
    // Utility Endpoints
    getEmployeeIdSuggestions,
    getStaffCountByDepartment,
    getStaffCountByDesignation,
    getStaffBySchool,
    getStaffByDepartment,
    // Advanced Features
    generateStaffReport,
    compareStaff,
    // Cache Management
    getCacheStats,
    warmCache,
    clearCache,
    // Collaboration
    getStaffCollaboration,
    createStaffCollaboration,
    updateStaffCollaboration,
    deleteStaffCollaboration,
    getStaffProjects,
    createStaffProject,
    getStaffTeams,
    assignStaffToTeam,
    getStaffMeetings,
    scheduleStaffMeeting,
    // Documents
    getStaffDocuments,
    uploadStaffDocument,
    getStaffDocument,
    updateStaffDocument,
    deleteStaffDocument,
    getDocumentCategories,
    createDocumentCategory,
    searchStaffDocuments,
    verifyStaffDocument,
    getExpiringDocuments,
    // Tasks
    getStaffTasks,
    createStaffTask,
    getStaffTask,
    updateStaffTask,
    deleteStaffTask,
    assignStaffTask,
    completeStaffTask,
    getOverdueTasks,
    getCompletedTasks,
    getTaskStatistics,
    bulkAssignTasks,
  };
};

export default useStaffApi; 
