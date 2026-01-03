import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import classService from '../services/classService';
import { 
  Class, 
  ClassCreateRequest, 
  ClassUpdateRequest, 
  ClassSearchParams, 
  ClassAdvancedSearchParams,
  ClassBulkCreateRequest,
  ClassBulkUpdateRequest,
  ClassListResponse,
  ClassStats,
  ClassAnalytics,
  ClassPerformance,
  BulkAssignTeacherRequest,
  BulkUpdateCapacityRequest,
  BulkTransferStudentsRequest,
  CacheStats,
  CacheHealth,
  ClassCodeGenerationRequest,
  ClassSectionGenerationRequest,
  ClassNameSuggestion,
  ClassCodeSuggestion,
  ClassExportOptions,
  ClassImportOptions,
  Student,
  Subject,
  Timetable,
  Exam,
  Assignment,
  Attendance
} from '../types';

interface UseClassApiState {
  classes: Class[];
  loading: boolean;
  error: string | null;
  pagination: any;
  selectedClasses: number[];
  searchQuery: string;
  filters: ClassSearchParams;
  stats: ClassStats | null;
  analytics: ClassAnalytics | null;
  performance: ClassPerformance | null;
  cacheStats: CacheStats | null;
  cacheHealth: CacheHealth | null;
  relatedData: {
    students: Student[];
    subjects: Subject[];
    timetables: Timetable[];
    exams: Exam[];
    assignments: Assignment[];
    attendances: Attendance[];
  };
}

export interface UseClassApiReturn extends UseClassApiState {
  // CRUD Operations
  createClass: (data: ClassCreateRequest) => Promise<Class | null>;
  updateClass: (id: number, data: ClassUpdateRequest) => Promise<Class | null>;
  deleteClass: (id: number) => Promise<boolean>;
  getClassById: (id: number, include?: string) => Promise<Class | null>;  
  getClasses: (params?: ClassSearchParams) => Promise<ClassListResponse | null>;
  
  // List Operations
  loadClasses: (params?: ClassSearchParams) => Promise<void>;
  searchClasses: (params: ClassAdvancedSearchParams) => Promise<void>;
  refreshClasses: () => Promise<void>;
  loadMoreClasses: () => Promise<void>;
  
  // School/Level/Teacher specific
  getClassesBySchool: (schoolId: number, include?: string) => Promise<Class[] | null>;
  getClassesByLevel: (level: number, include?: string) => Promise<Class[] | null>;
  getClassesByTeacher: (teacherId: number, include?: string) => Promise<Class[] | null>;
  
  // Bulk Operations
  bulkCreateClasses: (data: ClassBulkCreateRequest) => Promise<boolean>;
  bulkUpdateClasses: (data: ClassBulkUpdateRequest) => Promise<boolean>;
  bulkDeleteClasses: (classIds: number[]) => Promise<boolean>;
  
  // Analytics & Statistics
  getClassStats: (params?: any) => Promise<ClassStats | null>;
  getClassAnalytics: (params?: any) => Promise<ClassAnalytics | null>;
  getClassPerformance: (id: number, params?: any) => Promise<ClassPerformance | null>;
  loadStats: (params?: any) => Promise<void>;
  loadAnalytics: (params?: any) => Promise<void>;
  loadPerformance: (id: number, params?: any) => Promise<void>;
  
  // Export & Import
  exportClasses: (options: ClassExportOptions) => Promise<boolean>;
  importClasses: (options: ClassImportOptions) => Promise<boolean>;
  
  // Utility Methods
  generateClassCode: (params: ClassCodeGenerationRequest) => Promise<string | null>;
  generateClassSections: (params: ClassSectionGenerationRequest) => Promise<Class[] | null>;
  getClassCount: (params?: any) => Promise<number | null>;
  getClassNameSuggestions: (query: string) => Promise<ClassNameSuggestion[]>;
  getClassCodeSuggestions: (query: string) => Promise<ClassCodeSuggestion[]>;
  
  // Cache Management
  clearCache: (key?: string) => Promise<void>;
  getCacheStats: () => Promise<CacheStats | null>;
  getCacheHealth: () => Promise<CacheHealth | null>;
  
  // Relationship Methods
  getClassStudents: (id: number, include?: string) => Promise<Student[] | null>;
  getClassSubjects: (id: number, include?: string) => Promise<Subject[] | null>;
  getClassTimetables: (id: number, include?: string) => Promise<Timetable[] | null>;
  getClassExams: (id: number, include?: string) => Promise<Exam[] | null>;
  getClassAssignments: (id: number, include?: string) => Promise<Assignment[] | null>;
  getClassAttendances: (id: number, include?: string) => Promise<Attendance[] | null>;
  
  // Batch Operations
  assignTeacher: (data: BulkAssignTeacherRequest) => Promise<boolean>;
  assignStudents: (data: BulkTransferStudentsRequest) => Promise<boolean>;
  removeStudents: (data: BulkTransferStudentsRequest) => Promise<boolean>;
  batchUpdateCapacity: (data: BulkUpdateCapacityRequest) => Promise<boolean>;
  batchTransferStudents: (data: BulkTransferStudentsRequest) => Promise<boolean>;
  
  // Selection Management
  selectClass: (id: number) => void;
  selectAllClasses: () => void;
  deselectClass: (id: number) => void;
  deselectAllClasses: () => void;
  toggleClassSelection: (id: number) => void;
  
  // Filter Management
  updateFilters: (filters: Partial<ClassSearchParams>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
}

const initialState: UseClassApiState = {
  classes: [],
  loading: false,
  error: null,
  pagination: null,
  selectedClasses: [],
  searchQuery: '',
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc',
  },
  stats: null,
  analytics: null,
  performance: null,
  cacheStats: null,
  cacheHealth: null,
  relatedData: {
    students: [],
    subjects: [],
    timetables: [],
    exams: [],
    assignments: [],
    attendances: [],
  },
};

export const useClassApi = (): UseClassApiReturn => {
  const [state, setState] = useState<UseClassApiState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);

  // ======================
  // UTILITY FUNCTIONS
  // ======================
  
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
    loadingRef.current = loading;
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const handleApiError = useCallback((error: any, operation: string) => {
    
    const errorMessage = error.message || `Failed to ${operation} classes`;
    setError(errorMessage);
    
    if (operation !== 'fetch' && operation !== 'search') {
      Alert.alert('Error', errorMessage);
    }
  }, [setError]);

  // ======================
  // CRUD OPERATIONS
  // ======================
  
  const createClass = useCallback(async (data: ClassCreateRequest): Promise<Class | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const newClass = await classService.createClass(data);
      
      setState(prev => ({
        ...prev,
        classes: [newClass, ...prev.classes],
        stats: null, // Invalidate stats
      }));
      
      return newClass;
    } catch (error) {
      handleApiError(error, 'create');
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  const updateClass = useCallback(async (id: number, data: ClassUpdateRequest): Promise<Class | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedClass = await classService.updateClass(id, data);
      
      setState(prev => ({
        ...prev,
        classes: prev.classes.map(cls => 
          cls.id === id ? updatedClass : cls
        ),
        stats: null, // Invalidate stats
      }));
      
      return updatedClass;
    } catch (error) {
      handleApiError(error, 'update');
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  const deleteClass = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await classService.deleteClass(id);
      
      setState(prev => ({
        ...prev,
        classes: prev.classes.filter(cls => cls.id !== id),
        selectedClasses: prev.selectedClasses.filter(selectedId => selectedId !== id),
        stats: null, // Invalidate stats
      }));
      
      return true;
    } catch (error) {
      handleApiError(error, 'delete');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  const getClassById = useCallback(async (id: number, include?: string): Promise<Class | null> => {
    try {
      setError(null);
      
      const classData = await classService.getClassById(id, include);
      return classData;
    } catch (error) {
      handleApiError(error, 'fetch by ID');
      return null;
    }
  }, [handleApiError]);

  const getClasses = useCallback(async (params?: ClassSearchParams): Promise<ClassListResponse | null> => {
    try {
      setError(null);
      
      const response = await classService.getAllClasses(params);
      return response;
    } catch (error) {
      handleApiError(error, 'fetch');
      return null;
    }
  }, [handleApiError]);

  // ======================
  // LIST OPERATIONS
  // ======================
  
  const loadClasses = useCallback(async (params?: ClassSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = { ...state.filters, ...params };
      const response = await classService.getAllClasses(searchParams);
      
      setState(prev => ({
        ...prev,
        classes: response.data,
        pagination: response.pagination,
        filters: searchParams,
      }));
    } catch (error) {
      handleApiError(error, 'load');
    } finally {
      setLoading(false);
    }
  }, [state.filters, setLoading, setError, handleApiError]);

  const searchClasses = useCallback(async (params: ClassAdvancedSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await classService.searchClasses(params);
      
      setState(prev => ({
        ...prev,
        classes: response.data,
        pagination: response.pagination,
      }));
    } catch (error) {
      handleApiError(error, 'search');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  const refreshClasses = useCallback(async () => {
    await loadClasses(state.filters);
  }, [loadClasses, state.filters]);

  const loadMoreClasses = useCallback(async () => {
    if (!state.pagination?.hasNext || loadingRef.current) return;
    
    try {
      setLoading(true);
      const nextPageParams = { ...state.filters, page: state.pagination.page + 1 };
      const response = await classService.getAllClasses(nextPageParams);
      
      setState(prev => ({
        ...prev,
        classes: [...prev.classes, ...response.data],
        pagination: response.pagination,
      }));
    } catch (error) {
      handleApiError(error, 'load more');
    } finally {
      setLoading(false);
    }
  }, [state.filters, state.pagination, setLoading, handleApiError]);

  // ======================
  // SCHOOL/LEVEL/TEACHER SPECIFIC
  // ======================

  const getClassesBySchool = useCallback(async (schoolId: number, include?: string): Promise<Class[] | null> => {
    try {
      setError(null);
      return await classService.getClassesBySchool(schoolId, include);
    } catch (error) {
      handleApiError(error, 'fetch by school');
      return null;
    }
  }, [handleApiError]);

  const getClassesByLevel = useCallback(async (level: number, include?: string): Promise<Class[] | null> => {
    try {
      setError(null);
      return await classService.getClassesByLevel(level, include);
    } catch (error) {
      handleApiError(error, 'fetch by level');
      return null;
    }
  }, [handleApiError]);

  const getClassesByTeacher = useCallback(async (teacherId: number, include?: string): Promise<Class[] | null> => {
    try {
      setError(null);
      return await classService.getClassesByTeacher(teacherId, include);
    } catch (error) {
      handleApiError(error, 'fetch by teacher');
      return null;
    }
  }, [handleApiError]);

  // ======================
  // BULK OPERATIONS
  // ======================
  
  const bulkCreateClasses = useCallback(async (data: ClassBulkCreateRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const newClasses = await classService.bulkCreateClasses(data);
      
      setState(prev => ({
        ...prev,
        classes: [...newClasses, ...prev.classes],
        stats: null, // Invalidate stats
      }));
      
      return true;
    } catch (error) {
      handleApiError(error, 'bulk create');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  const bulkUpdateClasses = useCallback(async (data: ClassBulkUpdateRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedClasses = await classService.bulkUpdateClasses(data);
      
      setState(prev => ({
        ...prev,
        classes: prev.classes.map(cls => {
          const updated = updatedClasses.find(u => u.id === cls.id);
          return updated || cls;
        }),
        stats: null, // Invalidate stats
      }));
      
      return true;
    } catch (error) {
      handleApiError(error, 'bulk update');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  const bulkDeleteClasses = useCallback(async (classIds: number[]): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await classService.bulkDeleteClasses(classIds);
      
      setState(prev => ({
        ...prev,
        classes: prev.classes.filter(cls => !classIds.includes(cls.id)),
        selectedClasses: prev.selectedClasses.filter(id => !classIds.includes(id)),
        stats: null, // Invalidate stats
      }));
      
      return true;
    } catch (error) {
      handleApiError(error, 'bulk delete');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  // ======================
  // ANALYTICS & STATISTICS
  // ======================

  const getClassStats = useCallback(async (params?: any): Promise<ClassStats | null> => {
    try {
      setError(null);
      return await classService.getClassStats(params);
    } catch (error) {
      handleApiError(error, 'fetch stats');
      return null;
    }
  }, [handleApiError]);

  const getClassAnalytics = useCallback(async (params?: any): Promise<ClassAnalytics | null> => {
    try {
      setError(null);
      return await classService.getClassAnalytics(params);
    } catch (error) {
      handleApiError(error, 'fetch analytics');
      return null;
    }
  }, [handleApiError]);

  const getClassPerformance = useCallback(async (id: number, params?: any): Promise<ClassPerformance | null> => {
    try {
      setError(null);
      return await classService.getClassPerformance(id, params);
    } catch (error) {
      handleApiError(error, 'fetch performance');
      return null;
    }
  }, [handleApiError]);

  const loadStats = useCallback(async (params?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await classService.getClassStats(params);
      
      setState(prev => ({ ...prev, stats }));
    } catch (error) {
      handleApiError(error, 'load stats');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  const loadAnalytics = useCallback(async (params?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const analytics = await classService.getClassAnalytics(params);
      
      setState(prev => ({ ...prev, analytics }));
    } catch (error) {
      handleApiError(error, 'load analytics');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  const loadPerformance = useCallback(async (id: number, params?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const performance = await classService.getClassPerformance(id, params);
      
      setState(prev => ({ ...prev, performance }));
    } catch (error) {
      handleApiError(error, 'load performance');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  // ======================
  // EXPORT & IMPORT
  // ======================

  const exportClasses = useCallback(async (options: ClassExportOptions): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await classService.exportClasses(options);
      return true;
    } catch (error) {
      handleApiError(error, 'export');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError]);

  const importClasses = useCallback(async (options: ClassImportOptions): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await classService.importClasses(options);
      
      // Refresh classes after import
      await loadClasses();
      
      return true;
    } catch (error) {
      handleApiError(error, 'import');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError, loadClasses]);

  // ======================
  // UTILITY METHODS
  // ======================

  const generateClassCode = useCallback(async (params: ClassCodeGenerationRequest): Promise<string | null> => {
    try {
      setError(null);
      return await classService.generateClassCode(params);
    } catch (error) {
      handleApiError(error, 'generate code');
      return null;
    }
  }, [handleApiError]);

  const generateClassSections = useCallback(async (params: ClassSectionGenerationRequest): Promise<Class[] | null> => {
    try {
      setError(null);
      return await classService.generateClassSections(params);
    } catch (error) {
      handleApiError(error, 'generate sections');
      return null;
    }
  }, [handleApiError]);

  const getClassCount = useCallback(async (params?: any): Promise<number | null> => {
    try {
      setError(null);
      return await classService.getClassCount(params);
    } catch (error) {
      handleApiError(error, 'get count');
      return null;
    }
  }, [handleApiError]);

  const getClassNameSuggestions = useCallback(async (query: string): Promise<ClassNameSuggestion[]> => {
    try {
      setError(null);
      return await classService.getClassNameSuggestions(query);
    } catch (error) {
      handleApiError(error, 'get name suggestions');
      return [];
    }
  }, [handleApiError]);

  const getClassCodeSuggestions = useCallback(async (query: string): Promise<ClassCodeSuggestion[]> => {
    try {
      setError(null);
      return await classService.getClassCodeSuggestions(query);
    } catch (error) {
      handleApiError(error, 'get code suggestions');
      return [];
    }
  }, [handleApiError]);

  // ======================
  // CACHE MANAGEMENT
  // ======================

  const clearCache = useCallback(async (key?: string) => {
    try {
      setError(null);
      await classService.clearClassCache(key);
    } catch (error) {
      handleApiError(error, 'clear cache');
    }
  }, [handleApiError]);

  const getCacheStats = useCallback(async (): Promise<CacheStats | null> => {
    try {
      setError(null);
      const stats = await classService.getClassCacheStats();
      setState(prev => ({ ...prev, cacheStats: stats }));
      return stats;
    } catch (error) {
      handleApiError(error, 'get cache stats');
      return null;
    }
  }, [handleApiError]);

  const getCacheHealth = useCallback(async (): Promise<CacheHealth | null> => {
    try {
      setError(null);
      const health = await classService.checkClassCacheHealth();
      setState(prev => ({ ...prev, cacheHealth: health }));
      return health;
    } catch (error) {
      handleApiError(error, 'check cache health');
      return null;
    }
  }, [handleApiError]);

  // ======================
  // RELATIONSHIP METHODS
  // ======================

  const getClassStudents = useCallback(async (id: number, include?: string): Promise<Student[] | null> => {
    try {
      setError(null);
      const students = await classService.getClassStudents(id, include);
      setState(prev => ({ 
        ...prev, 
        relatedData: { ...prev.relatedData, students } 
      }));
      return students;
    } catch (error) {
      handleApiError(error, 'fetch class students');
      return null;
    }
  }, [handleApiError]);

  const getClassSubjects = useCallback(async (id: number, include?: string): Promise<Subject[] | null> => {
    try {
      setError(null);
      const subjects = await classService.getClassSubjects(id, include);
      setState(prev => ({ 
        ...prev, 
        relatedData: { ...prev.relatedData, subjects } 
      }));
      return subjects;
    } catch (error) {
      handleApiError(error, 'fetch class subjects');
      return null;
    }
  }, [handleApiError]);

  const getClassTimetables = useCallback(async (id: number, include?: string): Promise<Timetable[] | null> => {
    try {
      setError(null);
      const timetables = await classService.getClassTimetables(id, include);
      setState(prev => ({ 
        ...prev, 
        relatedData: { ...prev.relatedData, timetables } 
      }));
      return timetables;
    } catch (error) {
      handleApiError(error, 'fetch class timetables');
      return null;
    }
  }, [handleApiError]);

  const getClassExams = useCallback(async (id: number, include?: string): Promise<Exam[] | null> => {
    try {
      setError(null);
      const exams = await classService.getClassExams(id, include);
      setState(prev => ({ 
        ...prev, 
        relatedData: { ...prev.relatedData, exams } 
      }));
      return exams;
    } catch (error) {
      handleApiError(error, 'fetch class exams');
      return null;
    }
  }, [handleApiError]);

  const getClassAssignments = useCallback(async (id: number, include?: string): Promise<Assignment[] | null> => {
    try {
      setError(null);
      const assignments = await classService.getClassAssignments(id, include);
      setState(prev => ({ 
        ...prev, 
        relatedData: { ...prev.relatedData, assignments } 
      }));
      return assignments;
    } catch (error) {
      handleApiError(error, 'fetch class assignments');
      return null;
    }
  }, [handleApiError]);

  const getClassAttendances = useCallback(async (id: number, include?: string): Promise<Attendance[] | null> => {
    try {
      setError(null);
      const attendances = await classService.getClassAttendances(id, include);
      setState(prev => ({ 
        ...prev, 
        relatedData: { ...prev.relatedData, attendances } 
      }));
      return attendances;
    } catch (error) {
      handleApiError(error, 'fetch class attendances');
      return null;
    }
  }, [handleApiError]);

  // ======================
  // BATCH OPERATIONS
  // ======================

  const assignTeacher = useCallback(async (data: BulkAssignTeacherRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await classService.batchAssignTeacher(data);
      
      // Refresh classes after assignment
      await loadClasses();
      
      return true;
    } catch (error) {
      handleApiError(error, 'assign teacher');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError, loadClasses]);

  const assignStudents = useCallback(async (data: BulkTransferStudentsRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await classService.batchTransferStudents(data);
      
      // Refresh classes after assignment
      await loadClasses();
      
      return true;
    } catch (error) {
      handleApiError(error, 'assign students');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError, loadClasses]);

  const removeStudents = useCallback(async (data: BulkTransferStudentsRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await classService.batchTransferStudents(data);
      
      // Refresh classes after removal
      await loadClasses();
      
      return true;
    } catch (error) {
      handleApiError(error, 'remove students');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError, loadClasses]);

  const batchUpdateCapacity = useCallback(async (data: BulkUpdateCapacityRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await classService.batchUpdateCapacity(data);
      
      // Refresh classes after update
      await loadClasses();
      
      return true;
    } catch (error) {
      handleApiError(error, 'batch update capacity');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError, loadClasses]);

  const batchTransferStudents = useCallback(async (data: BulkTransferStudentsRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await classService.batchTransferStudents(data);
      
      // Refresh classes after transfer
      await loadClasses();
      
      return true;
    } catch (error) {
      handleApiError(error, 'batch transfer students');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, handleApiError, loadClasses]);

  // ======================
  // SELECTION MANAGEMENT
  // ======================
  
  const selectClass = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      selectedClasses: [...prev.selectedClasses, id],
    }));
  }, []);

  const selectAllClasses = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedClasses: prev.classes.map(cls => cls.id),
    }));
  }, []);

  const deselectClass = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.filter(selectedId => selectedId !== id),
    }));
  }, []);

  const deselectAllClasses = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedClasses: [],
    }));
  }, []);

  const toggleClassSelection = useCallback((id: number) => {
    setState(prev => {
      const isSelected = prev.selectedClasses.includes(id);
      return {
        ...prev,
        selectedClasses: isSelected
          ? prev.selectedClasses.filter(selectedId => selectedId !== id)
          : [...prev.selectedClasses, id],
      };
    });
  }, []);

  // ======================
  // FILTER MANAGEMENT
  // ======================
  
  const updateFilters = useCallback((filters: Partial<ClassSearchParams>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters, page: 1 }, // Reset page when filters change
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      },
      searchQuery: '',
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      filters: { ...prev.filters, search: query, page: 1 },
    }));
  }, []);

  // ======================
  // CLEANUP
  // ======================
  
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    // CRUD Operations
    createClass,
    updateClass,
    deleteClass,
    getClassById,
    getClasses,
    // List Operations
    loadClasses,
    searchClasses,
    refreshClasses,
    loadMoreClasses,
    // School/Level/Teacher specific
    getClassesBySchool,
    getClassesByLevel,
    getClassesByTeacher,
    // Bulk Operations
    bulkCreateClasses,
    bulkUpdateClasses,
    bulkDeleteClasses,
    // Analytics & Statistics
    getClassStats,
    getClassAnalytics,
    getClassPerformance,
    loadStats,
    loadAnalytics,
    loadPerformance,
    // Export & Import
    exportClasses,
    importClasses,
    // Utility Methods
    generateClassCode,
    generateClassSections,
    getClassCount,
    getClassNameSuggestions,
    getClassCodeSuggestions,
    // Cache Management
    clearCache,
    getCacheStats,
    getCacheHealth,
    // Relationship Methods
    getClassStudents,
    getClassSubjects,
    getClassTimetables,
    getClassExams,
    getClassAssignments,
    getClassAttendances,
    // Batch Operations
    assignTeacher,
    assignStudents,
    removeStudents,
    batchUpdateCapacity,
    batchTransferStudents,
    // Selection Management
    selectClass,
    selectAllClasses,
    deselectClass,
    deselectAllClasses,
    toggleClassSelection,
    // Filter Management
    updateFilters,
    clearFilters,
    setSearchQuery,
  };
}; 
