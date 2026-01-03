import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import studentService from '../services/studentService';
import { Student, StudentAnalytics, StudentFilters, DashboardFilters } from '../types';
import DashboardTab from '../components/DashboardTab';
import StudentsListTab from '../components/StudentsListTab';

const StudentsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, managedContext } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StudentFilters>({
    page: 1,
    limit: 10
  });
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>(() => ({
    period: '30D',
    schoolId: managedContext.schoolId ? Number(managedContext.schoolId) : undefined,
    branchId: managedContext.branchId ? Number(managedContext.branchId) : undefined,
    courseId: managedContext.courseId ? Number(managedContext.courseId) : undefined,
  }));
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });

  // Load students data
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentService.getStudents(filters);
      if (response.success) {
        setStudents(response.data);
        
        // Update pagination info from response meta
        console.log('API Response meta:', response.meta);
        const p = (response as any).meta?.pagination || (response as any).pagination || (response as any).meta || {};
        if (p) {
          const paginationData = {
            currentPage: p.currentPage || p.page || 1,
            totalPages: p.totalPages || 1,
            totalItems: p.totalCount || p.total || 0,
            pageSize: p.limit || p.pageSize || 10
          };
          console.log('Setting pagination:', paginationData);
          setPagination(paginationData);
        } else {
          console.log('No pagination data found in response');
        }
      } else {
        setError('Failed to load students');
      }
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Error loading students');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentService.getStudentAnalytics(dashboardFilters);
      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError('Failed to load analytics');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Error loading analytics');
    } finally {
      setLoading(false);
    }
  }, [dashboardFilters]);

  useEffect(() => {
    setDashboardFilters(prev => {
      const next = {
        ...prev,
        schoolId: managedContext.schoolId ? Number(managedContext.schoolId) : undefined,
        branchId: managedContext.branchId ? Number(managedContext.branchId) : undefined,
        courseId: managedContext.courseId ? Number(managedContext.courseId) : undefined,
      };

      if (
        next.schoolId === prev.schoolId &&
        next.branchId === prev.branchId &&
        next.courseId === prev.courseId
      ) {
        return prev;
      }
      return next;
    });
  }, [managedContext.schoolId, managedContext.branchId, managedContext.courseId]);

  // Load data on component mount and when filters change
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadAnalytics();
    } else {
      loadStudents();
    }
  }, [activeTab, loadStudents, loadAnalytics]);

  // Handle tab change
  const handleTabChange = (tab: 'dashboard' | 'students') => {
    setActiveTab(tab);
  };

  // Handle filters change
  const handleFiltersChange = (newFilters: StudentFilters) => {
    setFilters(newFilters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle page size change
  const handlePageSizeChange = (pageSize: number) => {
    setFilters(prev => ({ ...prev, limit: pageSize, page: 1 }));
  };

  // Handle dashboard filters change
  const handleDashboardFiltersChange = (newFilters: DashboardFilters) => {
    setDashboardFilters(newFilters);
  };

  // Refresh data
  const handleRefresh = useCallback(async () => {
    if (activeTab === 'dashboard') {
      await loadAnalytics();
    } else {
      await loadStudents();
    }
  }, [activeTab, loadStudents, loadAnalytics]);

  // Handle student operations
  const handleStudentCreate = async (studentData: Partial<Student>) => {
    try {
      const response = await studentService.createStudent(studentData);
      if (response.success) {
        await loadStudents(); // Refresh the list
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      console.error('Error creating student:', err);
      return { success: false, error: 'Error creating student' };
    }
  };

  const handleStudentUpdate = async (id: number, studentData: Partial<Student>) => {
    try {
      const response = await studentService.updateStudent(id, studentData);
      if (response.success) {
        await loadStudents(); // Refresh the list
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      console.error('Error updating student:', err);
      return { success: false, error: 'Error updating student' };
    }
  };



  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header with tabs */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="px-6 py-3 pt-6 flex items-center gap-8">
          <h1 className="text-2xl font-semibold text-gray-800">
            {activeTab === 'dashboard' ? t('students.tabs.dashboard') : t('students.tabs.students')}
          </h1>
          <div className="flex gap-6">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`pb-2 px-3 border-b-2 font-medium text-base transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('students.tabs.dashboard')}
            </button>
            <button
              onClick={() => handleTabChange('students')}
              className={`pb-2 px-3 border-b-2 font-medium text-base transition-colors ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('students.tabs.students')}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'dashboard' ? (
          <DashboardTab
            analytics={analytics}
            loading={loading}
            error={error}
            filters={dashboardFilters}
            onFiltersChange={handleDashboardFiltersChange}
            onRefresh={handleRefresh}
          />
        ) : (
          <StudentsListTab
            students={students}
            loading={loading}
            error={error}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
            onStudentCreate={handleStudentCreate}
            onStudentUpdate={handleStudentUpdate}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </div>
  );
};

export default StudentsScreen;