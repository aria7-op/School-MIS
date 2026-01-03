import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from 'native-base';
import classService from '../services/classService';
import { Class, ClassSearchParams, ClassCreateRequest, ClassUpdateRequest } from '../types';

interface UseEnhancedClassesState {
  classes: Class[];
  selectedClass: Class | null;
  students: any[];
  subjects: any[];
  timetables: any[];
  exams: any[];
  assignments: any[];
  attendances: any[];
  stats: any;
  analytics: any;
  performance: any;
  loading: boolean;
  studentsLoading: boolean;
  subjectsLoading: boolean;
  timetablesLoading: boolean;
  examsLoading: boolean;
  assignmentsLoading: boolean;
  attendancesLoading: boolean;
  statsLoading: boolean;
  analyticsLoading: boolean;
  performanceLoading: boolean;
  error: string | null;
  refreshing: boolean;
}

interface UseEnhancedClassesActions {
  // Class operations
  fetchClasses: (params?: ClassSearchParams) => Promise<void>;
  fetchClassById: (id: number) => Promise<void>;
  createClass: (data: ClassCreateRequest) => Promise<void>;
  updateClass: (id: number, data: ClassUpdateRequest) => Promise<void>;
  deleteClass: (id: number) => Promise<void>;
  
  // Class selection and navigation
  selectClass: (classItem: Class) => void;
  clearSelectedClass: () => void;
  
  // Related data fetching
  fetchClassStudents: (classId: number, params?: any) => Promise<void>;
  fetchClassSubjects: (classId: number, params?: any) => Promise<void>;
  fetchClassTimetables: (classId: number, params?: any) => Promise<void>;
  fetchClassExams: (classId: number, params?: any) => Promise<void>;
  fetchClassAssignments: (classId: number, params?: any) => Promise<void>;
  fetchClassAttendances: (classId: number, params?: any) => Promise<void>;
  
  // Analytics and stats
  fetchClassStats: (params?: any) => Promise<void>;
  fetchClassAnalytics: (params?: any) => Promise<void>;
  fetchClassPerformance: (classId: number, params?: any) => Promise<void>;
  
  // Bulk operations
  bulkCreateClasses: (data: any) => Promise<void>;
  bulkUpdateClasses: (data: any) => Promise<void>;
  bulkDeleteClasses: (classIds: number[]) => Promise<void>;
  
  // Batch operations
  batchAssignTeacher: (classIds: number[], teacherId: number) => Promise<void>;
  batchUpdateCapacity: (classIds: number[], capacity: number) => Promise<void>;
  batchTransferStudents: (fromClassId: number, toClassId: number, studentIds: number[]) => Promise<void>;
  
  // Utility functions
  searchClasses: (params: any) => Promise<void>;
  getClassesBySchool: (schoolId: number, params?: any) => Promise<void>;
  getClassesByLevel: (level: number, params?: any) => Promise<void>;
  getClassesByTeacher: (teacherId: number, params?: any) => Promise<void>;
  
  // Refresh and cache
  refreshAll: () => Promise<void>;
  refreshClassData: (classId: number) => Promise<void>;
  clearCache: () => Promise<void>;
}

export const useEnhancedClasses = (): UseEnhancedClassesState & UseEnhancedClassesActions => {
  const toast = useToast();
  
  // State
  const [state, setState] = useState<UseEnhancedClassesState>({
    classes: [],
    selectedClass: null,
    students: [],
    subjects: [],
    timetables: [],
    exams: [],
    assignments: [],
    attendances: [],
    stats: null,
    analytics: null,
    performance: null,
    loading: false,
    studentsLoading: false,
    subjectsLoading: false,
    timetablesLoading: false,
    examsLoading: false,
    assignmentsLoading: false,
    attendancesLoading: false,
    statsLoading: false,
    analyticsLoading: false,
    performanceLoading: false,
    error: null,
    refreshing: false,
  });

  // Helper function to update state
  const updateState = useCallback((updates: Partial<UseEnhancedClassesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper function to show error toast
  const showError = useCallback((message: string) => {
    updateState({ error: message });
    toast.show({
      description: message,
      status: 'error',
      duration: 3000,
    });
  }, [toast, updateState]);

  // Helper function to show success toast
  const showSuccess = useCallback((message: string) => {
    toast.show({
      description: message,
      status: 'success',
      duration: 2000,
    });
  }, [toast]);

  // ======================
  // CLASS OPERATIONS
  // ======================

  const fetchClasses = useCallback(async (params: ClassSearchParams = {}) => {
    updateState({ loading: true, error: null });
    try {
      const response = await classService.getAllClasses(params);
      updateState({ 
        classes: response.data || response, 
        loading: false 
      });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch classes');
      updateState({ loading: false });
    }
  }, [updateState, showError]);

  const fetchClassById = useCallback(async (id: number) => {
    updateState({ loading: true, error: null });
    try {
      const classData = await classService.getClassById(id, 'students,subjects,timetables');
      updateState({ 
        selectedClass: classData,
        loading: false 
      });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch class details');
      updateState({ loading: false });
    }
  }, [updateState, showError]);

  const createClass = useCallback(async (data: ClassCreateRequest) => {
    updateState({ loading: true, error: null });
    try {
      const newClass = await classService.createClass(data);
      updateState(prev => ({ 
        classes: [...prev.classes, newClass],
        loading: false 
      }));
      showSuccess('Class created successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to create class');
      updateState({ loading: false });
    }
  }, [updateState, showError, showSuccess]);

  const updateClass = useCallback(async (id: number, data: ClassUpdateRequest) => {
    updateState({ loading: true, error: null });
    try {
      const updatedClass = await classService.updateClass(id, data);
      updateState(prev => ({ 
        classes: prev.classes.map(c => c.id === id ? updatedClass : c),
        selectedClass: prev.selectedClass?.id === id ? updatedClass : prev.selectedClass,
        loading: false 
      }));
      showSuccess('Class updated successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to update class');
      updateState({ loading: false });
    }
  }, [updateState, showError, showSuccess]);

  const deleteClass = useCallback(async (id: number) => {
    updateState({ loading: true, error: null });
    try {
      await classService.deleteClass(id);
      updateState(prev => ({ 
        classes: prev.classes.filter(c => c.id !== id),
        selectedClass: prev.selectedClass?.id === id ? null : prev.selectedClass,
        loading: false 
      }));
      showSuccess('Class deleted successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to delete class');
      updateState({ loading: false });
    }
  }, [updateState, showError, showSuccess]);

  // ======================
  // CLASS SELECTION
  // ======================

  const selectClass = useCallback((classItem: Class) => {
    updateState({ selectedClass: classItem });
    // Automatically fetch related data when a class is selected
    if (classItem.id) {
      fetchClassStudents(classItem.id);
      fetchClassSubjects(classItem.id);
      fetchClassTimetables(classItem.id);
      fetchClassExams(classItem.id);
      fetchClassAssignments(classItem.id);
      fetchClassAttendances(classItem.id);
      fetchClassPerformance(classItem.id);
    }
  }, [updateState]);

  const clearSelectedClass = useCallback(() => {
    updateState({ 
      selectedClass: null,
      students: [],
      subjects: [],
      timetables: [],
      exams: [],
      assignments: [],
      attendances: [],
      performance: null
    });
  }, [updateState]);

  // ======================
  // RELATED DATA FETCHING
  // ======================

  const fetchClassStudents = useCallback(async (classId: number, params: any = {}) => {
    updateState({ studentsLoading: true });
    try {
      const students = await classService.getClassStudents(classId, params);
      updateState({ students, studentsLoading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch students');
      updateState({ studentsLoading: false });
    }
  }, [updateState, showError]);

  const fetchClassSubjects = useCallback(async (classId: number, params: any = {}) => {
    updateState({ subjectsLoading: true });
    try {
      const subjects = await classService.getClassSubjects(classId, params);
      updateState({ subjects, subjectsLoading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch subjects');
      updateState({ subjectsLoading: false });
    }
  }, [updateState, showError]);

  const fetchClassTimetables = useCallback(async (classId: number, params: any = {}) => {
    updateState({ timetablesLoading: true });
    try {
      const timetables = await classService.getClassTimetables(classId, params);
      updateState({ timetables, timetablesLoading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch timetables');
      updateState({ timetablesLoading: false });
    }
  }, [updateState, showError]);

  const fetchClassExams = useCallback(async (classId: number, params: any = {}) => {
    updateState({ examsLoading: true });
    try {
      const exams = await classService.getClassExams(classId, params);
      updateState({ exams, examsLoading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch exams');
      updateState({ examsLoading: false });
    }
  }, [updateState, showError]);

  const fetchClassAssignments = useCallback(async (classId: number, params: any = {}) => {
    updateState({ assignmentsLoading: true });
    try {
      const assignments = await classService.getClassAssignments(classId, params);
      updateState({ assignments, assignmentsLoading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch assignments');
      updateState({ assignmentsLoading: false });
    }
  }, [updateState, showError]);

  const fetchClassAttendances = useCallback(async (classId: number, params: any = {}) => {
    updateState({ attendancesLoading: true });
    try {
      const attendances = await classService.getClassAttendances(classId, params);
      updateState({ attendances, attendancesLoading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch attendances');
      updateState({ attendancesLoading: false });
    }
  }, [updateState, showError]);

  // ======================
  // ANALYTICS AND STATS
  // ======================

  const fetchClassStats = useCallback(async (params: any = {}) => {
    updateState({ statsLoading: true });
    try {
      const stats = await classService.getClassStats(params);
      updateState({ stats, statsLoading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch stats');
      updateState({ statsLoading: false });
    }
  }, [updateState, showError]);

  const fetchClassAnalytics = useCallback(async (params: any = {}) => {
    updateState({ analyticsLoading: true });
    try {
      const analytics = await classService.getClassAnalytics(params);
      updateState({ analytics, analyticsLoading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch analytics');
      updateState({ analyticsLoading: false });
    }
  }, [updateState, showError]);

  const fetchClassPerformance = useCallback(async (classId: number, params: any = {}) => {
    updateState({ performanceLoading: true });
    try {
      const performance = await classService.getClassPerformance(classId, params);
      updateState({ performance, performanceLoading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch performance');
      updateState({ performanceLoading: false });
    }
  }, [updateState, showError]);

  // ======================
  // BULK OPERATIONS
  // ======================

  const bulkCreateClasses = useCallback(async (data: any) => {
    updateState({ loading: true });
    try {
      await classService.bulkCreateClasses(data);
      await fetchClasses(); // Refresh classes list
      showSuccess('Classes created successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to create classes');
      updateState({ loading: false });
    }
  }, [updateState, showError, showSuccess, fetchClasses]);

  const bulkUpdateClasses = useCallback(async (data: any) => {
    updateState({ loading: true });
    try {
      await classService.bulkUpdateClasses(data);
      await fetchClasses(); // Refresh classes list
      showSuccess('Classes updated successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to update classes');
      updateState({ loading: false });
    }
  }, [updateState, showError, showSuccess, fetchClasses]);

  const bulkDeleteClasses = useCallback(async (classIds: number[]) => {
    updateState({ loading: true });
    try {
      await classService.bulkDeleteClasses(classIds);
      updateState(prev => ({
        classes: prev.classes.filter(c => !classIds.includes(c.id)),
        loading: false
      }));
      showSuccess('Classes deleted successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to delete classes');
      updateState({ loading: false });
    }
  }, [updateState, showError, showSuccess]);

  // ======================
  // BATCH OPERATIONS
  // ======================

  const batchAssignTeacher = useCallback(async (classIds: number[], teacherId: number) => {
    updateState({ loading: true });
    try {
      await classService.batchAssignTeacher({ classIds, teacherId });
      await fetchClasses(); // Refresh classes list
      showSuccess('Teacher assigned successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to assign teacher');
      updateState({ loading: false });
    }
  }, [updateState, showError, showSuccess, fetchClasses]);

  const batchUpdateCapacity = useCallback(async (classIds: number[], capacity: number) => {
    updateState({ loading: true });
    try {
      await classService.batchUpdateCapacity({ classIds, capacity });
      await fetchClasses(); // Refresh classes list
      showSuccess('Capacity updated successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to update capacity');
      updateState({ loading: false });
    }
  }, [updateState, showError, showSuccess, fetchClasses]);

  const batchTransferStudents = useCallback(async (fromClassId: number, toClassId: number, studentIds: number[]) => {
    updateState({ loading: true });
    try {
      await classService.batchTransferStudents({ fromClassId, toClassId, studentIds });
      // Refresh students for both classes
      if (state.selectedClass?.id === fromClassId || state.selectedClass?.id === toClassId) {
        await fetchClassStudents(state.selectedClass.id);
      }
      showSuccess('Students transferred successfully!');
      updateState({ loading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to transfer students');
      updateState({ loading: false });
    }
  }, [updateState, showError, showSuccess, fetchClassStudents, state.selectedClass]);

  // ======================
  // UTILITY FUNCTIONS
  // ======================

  const searchClasses = useCallback(async (params: any) => {
    updateState({ loading: true });
    try {
      const response = await classService.searchClasses(params);
      updateState({ classes: response.data || response, loading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to search classes');
      updateState({ loading: false });
    }
  }, [updateState, showError]);

  const getClassesBySchool = useCallback(async (schoolId: number, params: any = {}) => {
    updateState({ loading: true });
    try {
      const response = await classService.getClassesBySchool(schoolId, params);
      updateState({ classes: response.data || response, loading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch classes by school');
      updateState({ loading: false });
    }
  }, [updateState, showError]);

  const getClassesByLevel = useCallback(async (level: number, params: any = {}) => {
    updateState({ loading: true });
    try {
      const response = await classService.getClassesByLevel(level, params);
      updateState({ classes: response.data || response, loading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch classes by level');
      updateState({ loading: false });
    }
  }, [updateState, showError]);

  const getClassesByTeacher = useCallback(async (teacherId: number, params: any = {}) => {
    updateState({ loading: true });
    try {
      const response = await classService.getClassesByTeacher(teacherId, params);
      updateState({ classes: response.data || response, loading: false });
    } catch (error: any) {
      showError(error.message || 'Failed to fetch classes by teacher');
      updateState({ loading: false });
    }
  }, [updateState, showError]);

  // ======================
  // REFRESH AND CACHE
  // ======================

  const refreshAll = useCallback(async () => {
    updateState({ refreshing: true });
    try {
      await Promise.all([
        fetchClasses(),
        fetchClassStats(),
        fetchClassAnalytics(),
      ]);
    } catch (error: any) {
      showError('Failed to refresh data');
    } finally {
      updateState({ refreshing: false });
    }
  }, [updateState, fetchClasses, fetchClassStats, fetchClassAnalytics, showError]);

  const refreshClassData = useCallback(async (classId: number) => {
    updateState({ refreshing: true });
    try {
      await Promise.all([
        fetchClassById(classId),
        fetchClassStudents(classId),
        fetchClassSubjects(classId),
        fetchClassTimetables(classId),
        fetchClassExams(classId),
        fetchClassAssignments(classId),
        fetchClassAttendances(classId),
        fetchClassPerformance(classId),
      ]);
    } catch (error: any) {
      showError('Failed to refresh class data');
    } finally {
      updateState({ refreshing: false });
    }
  }, [updateState, fetchClassById, fetchClassStudents, fetchClassSubjects, fetchClassTimetables, fetchClassExams, fetchClassAssignments, fetchClassAttendances, fetchClassPerformance, showError]);

  const clearCache = useCallback(async () => {
    try {
      await classService.clearCache();
      showSuccess('Cache cleared successfully!');
    } catch (error: any) {
      showError('Failed to clear cache');
    }
  }, [showError, showSuccess]);

  // ======================
  // INITIAL LOAD
  // ======================

  useEffect(() => {
    fetchClasses();
    fetchClassStats();
    fetchClassAnalytics();
  }, []);

  // ======================
  // MEMOIZED VALUES
  // ======================

  const actions = useMemo(() => ({
    fetchClasses,
    fetchClassById,
    createClass,
    updateClass,
    deleteClass,
    selectClass,
    clearSelectedClass,
    fetchClassStudents,
    fetchClassSubjects,
    fetchClassTimetables,
    fetchClassExams,
    fetchClassAssignments,
    fetchClassAttendances,
    fetchClassStats,
    fetchClassAnalytics,
    fetchClassPerformance,
    bulkCreateClasses,
    bulkUpdateClasses,
    bulkDeleteClasses,
    batchAssignTeacher,
    batchUpdateCapacity,
    batchTransferStudents,
    searchClasses,
    getClassesBySchool,
    getClassesByLevel,
    getClassesByTeacher,
    refreshAll,
    refreshClassData,
    clearCache,
  }), [
    fetchClasses, fetchClassById, createClass, updateClass, deleteClass,
    selectClass, clearSelectedClass, fetchClassStudents, fetchClassSubjects,
    fetchClassTimetables, fetchClassExams, fetchClassAssignments, fetchClassAttendances,
    fetchClassStats, fetchClassAnalytics, fetchClassPerformance,
    bulkCreateClasses, bulkUpdateClasses, bulkDeleteClasses,
    batchAssignTeacher, batchUpdateCapacity, batchTransferStudents,
    searchClasses, getClassesBySchool, getClassesByLevel, getClassesByTeacher,
    refreshAll, refreshClassData, clearCache
  ]);

  return {
    ...state,
    ...actions,
  };
}; 
