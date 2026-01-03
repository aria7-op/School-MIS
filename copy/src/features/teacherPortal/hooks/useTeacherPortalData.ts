import { useState, useCallback } from 'react';
import secureApiService from '../../../services/secureApiService';
import { useDemoUserBypass } from './useDemoUserBypass';

const resolveTeacherId = (): string | null => {
  try {
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    return (
      user?.teacherId ||
      localStorage.getItem('teacherId') ||
      user?.id ||
      null
    );
  } catch (error) {
    console.warn('Failed to resolve teacher ID from storage', error);
    return localStorage.getItem('teacherId');
  }
};

export const useTeacherPortalData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { withDemoBypass } = useDemoUserBypass();

  const getTeacherClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await withDemoBypass(
        () => secureApiService.get('/classes/teacher'),
        { data: [] }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      setError('Failed to fetch classes');
      return [];
    } finally {
      setLoading(false);
    }
  }, [withDemoBypass]);

  const getTeacherStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await withDemoBypass(
        () => secureApiService.get('/students/teacher'),
        { data: [] }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher students:', error);
      setError('Failed to fetch students');
      return [];
    } finally {
      setLoading(false);
    }
  }, [withDemoBypass]);

  const getTeacherAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teacherId = resolveTeacherId();
      if (!teacherId) {
        throw new Error('Teacher ID is required to load assignments');
      }
      
      const response = await withDemoBypass(
        () => secureApiService.get(`/assignments/teacher/${teacherId}`, {
          params: {
            limit: 100,
            include: 'submissions,class,subject',
          },
        }),
        { data: [] }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher assignments:', error);
      setError('Failed to fetch assignments');
      return [];
    } finally {
      setLoading(false);
    }
  }, [withDemoBypass]);

  const getTeacherExams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await withDemoBypass(
        () => secureApiService.get('/exams/teacher'),
        { data: [] }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher exams:', error);
      setError('Failed to fetch exams');
      return [];
    } finally {
      setLoading(false);
    }
  }, [withDemoBypass]);

  const getTeacherAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teacherId = resolveTeacherId();
      if (!teacherId) {
        throw new Error('Teacher ID is required to load attendance');
      }
      
      const response = await withDemoBypass(
        () => secureApiService.get('/attendances/summary', {
          params: { teacherId, include: 'student,class' }
        }),
        { data: [] }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher attendance:', error);
      setError('Failed to fetch attendance');
      return [];
    } finally {
      setLoading(false);
    }
  }, [withDemoBypass]);

  const getTeacherGrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await withDemoBypass(
        () => secureApiService.get('/grades/teacher'),
        { data: [] }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher grades:', error);
      setError('Failed to fetch grades');
      return [];
    } finally {
      setLoading(false);
    }
  }, [withDemoBypass]);

  const getTeacherDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await withDemoBypass(
        () => secureApiService.get('/teachers/dashboard'),
        { data: null }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher dashboard:', error);
      setError('Failed to fetch dashboard data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [withDemoBypass]);

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