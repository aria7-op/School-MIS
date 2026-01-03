import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import studentService from '../services/studentService';
import {
  Student,
  StudentCreateForm,
  StudentUpdateForm,
  StudentSearchFilters,
  StudentListResponse,
  StudentResponse,
  StudentStats,
  StudentAnalytics,
  AcademicCustomer
} from '../types';

// ======================
// MAIN STUDENTS HOOK
// ======================

export const useStudents = (initialFilters: StudentSearchFilters = {}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<StudentSearchFilters>(initialFilters);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch students
  const fetchStudents = useCallback(async (newFilters?: StudentSearchFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const currentFilters = newFilters || filters;
      const response = await studentService.getStudents(currentFilters);
      
      if (response.success) {
        setStudents(response.data.students);
        setFilteredStudents(response.data.students);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Failed to fetch students');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        
        setError(error.message || 'Failed to fetch students');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  // Refresh students
  const refreshStudents = useCallback(() => {
    setIsRefreshing(true);
    fetchStudents();
  }, [fetchStudents]);

  // Search students
  const searchStudents = useCallback(async (searchFilters: StudentSearchFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.searchStudents(searchFilters);
      
      if (response.success) {
        setFilteredStudents(response.data.students);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Failed to search students');
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to search students');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<StudentSearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchStudents(updatedFilters);
  }, [filters, fetchStudents]);

  // Load more students
  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages && !isLoading) {
      const nextPage = pagination.page + 1;
      const updatedFilters = { ...filters, page: nextPage };
      setFilters(updatedFilters);
      fetchStudents(updatedFilters);
    }
  }, [pagination, isLoading, filters, fetchStudents]);

  // Select/deselect students
  const toggleStudentSelection = useCallback((studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  const selectAllStudents = useCallback(() => {
    setSelectedStudents(students.map(student => student.id));
  }, [students]);

  const deselectAllStudents = useCallback(() => {
    setSelectedStudents([]);
  }, []);

  // Initial load
  useEffect(() => {
    fetchStudents();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    students,
    filteredStudents,
    isLoading,
    isRefreshing,
    error,
    pagination,
    filters,
    selectedStudents,
    fetchStudents,
    refreshStudents,
    searchStudents,
    updateFilters,
    loadMore,
    toggleStudentSelection,
    selectAllStudents,
    deselectAllStudents,
    setError
  };
};

// ======================
// INDIVIDUAL STUDENT HOOK
// ======================

export const useStudent = (studentId: number) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudent = useCallback(async (include: string[] = []) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.getStudentById(studentId, include);
      
      if (response.success) {
        setStudent(response.data);
      } else {
        setError(response.message || 'Failed to fetch student');
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to fetch student');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  const updateStudent = useCallback(async (studentData: StudentUpdateForm) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.updateStudent(studentId, studentData);
      
      if (response.success) {
        setStudent(response.data);
        return response;
      } else {
        setError(response.message || 'Failed to update student');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to update student');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  const deleteStudent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.deleteStudent(studentId);
      
      if (response.success) {
        setStudent(null);
        return response;
      } else {
        setError(response.message || 'Failed to delete student');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to delete student');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  const restoreStudent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.restoreStudent(studentId);
      
      if (response.success) {
        setStudent(response.data);
        return response;
      } else {
        setError(response.message || 'Failed to restore student');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to restore student');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchStudent();
    }
  }, [studentId, fetchStudent]);

  return {
    student,
    isLoading,
    error,
    fetchStudent,
    updateStudent,
    deleteStudent,
    restoreStudent,
    setError
  };
};

// ======================
// STUDENT STATS HOOK
// ======================

export const useStudentStats = (studentId: number) => {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.getStudentStats(studentId);
      setStats(response);
    } catch (error: any) {
      
      setError(error.message || 'Failed to fetch student stats');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchStats();
    }
  }, [studentId, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    setError
  };
};

// ======================
// STUDENT ANALYTICS HOOK
// ======================

export const useStudentAnalytics = (studentId: number, period: string = '30d') => {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.getStudentAnalytics(studentId, period);
      setAnalytics(response);
    } catch (error: any) {
      
      setError(error.message || 'Failed to fetch student analytics');
    } finally {
      setIsLoading(false);
    }
  }, [studentId, period]);

  useEffect(() => {
    if (studentId) {
      fetchAnalytics();
    }
  }, [studentId, period, fetchAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    fetchAnalytics,
    setError
  };
};

// ======================
// STUDENT PERFORMANCE HOOK
// ======================

export const useStudentPerformance = (studentId?: number) => {
  const [performance, setPerformance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!studentId) {

      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.getStudentPerformance(studentId);
      setPerformance(response);
    } catch (error: any) {
      
      setError(error.message || 'Failed to fetch student performance');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      fetchPerformance();
    }
  }, [studentId, fetchPerformance]);

  return {
    performance,
    isLoading,
    error,
    fetchPerformance,
    setError
  };
};

// ======================
// STUDENT CRUD HOOK
// ======================

export const useStudentCRUD = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStudent = useCallback(async (studentData: StudentCreateForm) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.createStudent(studentData);
      
      if (response.success) {
        Alert.alert('Success', 'Student created successfully');
        return response.data;
      } else {
        setError(response.message || 'Failed to create student');
        Alert.alert('Error', response.message || 'Failed to create student');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to create student');
      Alert.alert('Error', error.message || 'Failed to create student');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStudent = useCallback(async (studentId: number, studentData: StudentUpdateForm) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.updateStudent(studentId, studentData);
      
      if (response.success) {
        Alert.alert('Success', 'Student updated successfully');
        return response.data;
      } else {
        setError(response.message || 'Failed to update student');
        Alert.alert('Error', response.message || 'Failed to update student');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to update student');
      Alert.alert('Error', error.message || 'Failed to update student');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteStudent = useCallback(async (studentId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.deleteStudent(studentId);
      
      if (response.success) {
        Alert.alert('Success', 'Student deleted successfully');
        return response.data;
      } else {
        setError(response.message || 'Failed to delete student');
        Alert.alert('Error', response.message || 'Failed to delete student');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to delete student');
      Alert.alert('Error', error.message || 'Failed to delete student');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkCreateStudents = useCallback(async (students: StudentCreateForm[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.bulkCreateStudents(students);
      
      if (response.success) {
        Alert.alert('Success', `${students.length} students created successfully`);
        return response.data;
      } else {
        setError(response.message || 'Failed to bulk create students');
        Alert.alert('Error', response.message || 'Failed to bulk create students');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to bulk create students');
      Alert.alert('Error', error.message || 'Failed to bulk create students');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkUpdateStudents = useCallback(async (updates: { id: number; data: StudentUpdateForm }[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.bulkUpdateStudents(updates);
      
      if (response.success) {
        Alert.alert('Success', `${updates.length} students updated successfully`);
        return response.data;
      } else {
        setError(response.message || 'Failed to bulk update students');
        Alert.alert('Error', response.message || 'Failed to bulk update students');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to bulk update students');
      Alert.alert('Error', error.message || 'Failed to bulk update students');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkDeleteStudents = useCallback(async (studentIds: number[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.bulkDeleteStudents(studentIds);
      
      if (response.success) {
        Alert.alert('Success', `${studentIds.length} students deleted successfully`);
        return response.data;
      } else {
        setError(response.message || 'Failed to bulk delete students');
        Alert.alert('Error', response.message || 'Failed to bulk delete students');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to bulk delete students');
      Alert.alert('Error', error.message || 'Failed to bulk delete students');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
    bulkCreateStudents,
    bulkUpdateStudents,
    bulkDeleteStudents,
    setError
  };
};

// ======================
// STUDENT EXPORT/IMPORT HOOK
// ======================

export const useStudentExportImport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportStudents = useCallback(async (filters: StudentSearchFilters = {}, format: 'json' | 'csv' = 'json') => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.exportStudents(filters, format);
      
      if (format === 'csv') {
        // Handle CSV download
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON download
        const dataStr = JSON.stringify(response, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `students_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }

      Alert.alert('Success', 'Students exported successfully');
      return response;
    } catch (error: any) {
      
      setError(error.message || 'Failed to export students');
      Alert.alert('Error', error.message || 'Failed to export students');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importStudents = useCallback(async (students: StudentCreateForm[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.importStudents(students);
      
      if (response.success) {
        Alert.alert('Success', `${students.length} students imported successfully`);
        return response.data;
      } else {
        setError(response.message || 'Failed to import students');
        Alert.alert('Error', response.message || 'Failed to import students');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to import students');
      Alert.alert('Error', error.message || 'Failed to import students');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    exportStudents,
    importStudents,
    setError
  };
};

// ======================
// ACADEMIC CUSTOMERS HOOK
// ======================

export const useAcademicCustomers = () => {
  const [customers, setCustomers] = useState<AcademicCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAcademicCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.getAcademicCustomers();
      setCustomers(response);
    } catch (error: any) {
      
      setError(error.message || 'Failed to fetch academic customers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const convertCustomerToStudent = useCallback(async (customerId: number, studentData: Partial<StudentCreateForm>) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.convertCustomerToStudent(customerId, studentData);
      
      if (response.success) {
        Alert.alert('Success', 'Customer converted to student successfully');
        return response.data;
      } else {
        setError(response.message || 'Failed to convert customer to student');
        Alert.alert('Error', response.message || 'Failed to convert customer to student');
        return null;
      }
    } catch (error: any) {
      
      setError(error.message || 'Failed to convert customer to student');
      Alert.alert('Error', error.message || 'Failed to convert customer to student');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicCustomers();
  }, [fetchAcademicCustomers]);

  return {
    customers,
    isLoading,
    error,
    fetchAcademicCustomers,
    convertCustomerToStudent,
    setError
  };
};

// ======================
// STUDENT STATISTICS HOOK
// ======================

export const useStudentStatistics = (schoolId?: number) => {
  const [classStats, setClassStats] = useState<any>(null);
  const [statusStats, setStatusStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.getStudentCountByClass(schoolId);
      setClassStats(response);
    } catch (error: any) {
      
      setError(error.message || 'Failed to fetch class stats');
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  const fetchStatusStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.getStudentCountByStatus(schoolId);
      setStatusStats(response);
    } catch (error: any) {
      
      setError(error.message || 'Failed to fetch status stats');
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  const fetchAllStats = useCallback(async () => {
    await Promise.all([fetchClassStats(), fetchStatusStats()]);
  }, [fetchClassStats, fetchStatusStats]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  return {
    classStats,
    statusStats,
    isLoading,
    error,
    fetchClassStats,
    fetchStatusStats,
    fetchAllStats,
    setError
  };
};

