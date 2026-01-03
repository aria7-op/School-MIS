import { useState, useCallback } from 'react';
import { secureApiService } from '../../../services/secureApiService';

export const useTeacherPortalData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTeacherClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await secureApiService.get('/classes/teacher');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      setError('Failed to fetch classes');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTeacherStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await secureApiService.get('/students/teacher');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher students:', error);
      setError('Failed to fetch students');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTeacherAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await secureApiService.get('/assignments/teacher');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher assignments:', error);
      setError('Failed to fetch assignments');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTeacherExams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await secureApiService.get('/exams/teacher');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher exams:', error);
      setError('Failed to fetch exams');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTeacherAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await secureApiService.get('/attendance/teacher');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher attendance:', error);
      setError('Failed to fetch attendance');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTeacherGrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await secureApiService.get('/grades/teacher');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher grades:', error);
      setError('Failed to fetch grades');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTeacherDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await secureApiService.get('/teachers/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher dashboard:', error);
      setError('Failed to fetch dashboard data');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        getTeacherClasses(),
        getTeacherStudents(),
        getTeacherAssignments(),
        getTeacherExams(),
        getTeacherAttendance(),
        getTeacherGrades(),
        getTeacherDashboard()
      ]);
    } catch (error) {
      console.error('Error refreshing all data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [getTeacherClasses, getTeacherStudents, getTeacherAssignments, getTeacherExams, getTeacherAttendance, getTeacherGrades, getTeacherDashboard]);

  return {
    getTeacherClasses,
    getTeacherStudents,
    getTeacherAssignments,
    getTeacherExams,
    getTeacherAttendance,
    getTeacherGrades,
    getTeacherDashboard,
    refreshAllData,
    loading,
    error
  };
}; 