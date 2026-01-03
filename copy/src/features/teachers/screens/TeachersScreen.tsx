import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUsers, FaPlus, FaTrash, FaTimes, FaList, FaChartBar } from 'react-icons/fa';
import TeacherList from '../components/TeacherList';
import TeacherForm from '../components/TeacherForm';
import { useTeacherList } from '../hooks/useTeacherList';
import { useCreateTeacher, useUpdateTeacher, useDeleteTeacher, useBulkDeleteTeachers, useExportTeachers } from '../hooks/useTeachers';
import { Teacher, TeacherFormData } from '../types/teacher';

const TeachersScreen: React.FC = () => {
  const { t } = useTranslation();
  // State
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // Hooks
  const teacherList = useTeacherList({
    pageSize: 20,
    enableAutoRefresh: true,
    refreshInterval: 30000
  });

  const createTeacherMutation = useCreateTeacher();
  const updateTeacherMutation = useUpdateTeacher();
  const deleteTeacherMutation = useDeleteTeacher();
  const bulkDeleteMutation = useBulkDeleteTeachers();
  const exportMutation = useExportTeachers();

  // Handlers
  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowEditModal(true);
  };

  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    setShowAddModal(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowEditModal(true);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (teacherToDelete) {
      try {
        await deleteTeacherMutation.mutateAsync(teacherToDelete.id);
        setShowDeleteConfirm(false);
        setTeacherToDelete(null);
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      await teacherList.bulkDelete();
    } catch (error) {
      console.error('Error bulk deleting teachers:', error);
    }
  };

  const handleBulkActivate = async () => {
    try {
      await teacherList.bulkActivate();
    } catch (error) {
      console.error('Error bulk activating teachers:', error);
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await teacherList.bulkDeactivate();
    } catch (error) {
      console.error('Error bulk deactivating teachers:', error);
    }
  };

  const handleExport = async (format: string) => {
    try {
      await exportMutation.mutateAsync({
        format: format as 'json' | 'csv' | 'xlsx' | 'pdf',
        filters: teacherList.filters
      });
    } catch (error) {
      console.error('Error exporting teachers:', error);
    }
  };

  const handleFormSubmit = async (data: TeacherFormData) => {
    try {
      if (selectedTeacher) {
        // Update existing teacher
        await updateTeacherMutation.mutateAsync({
          id: selectedTeacher.id,
          data
        });
        setShowEditModal(false);
      } else {
        // Create new teacher
        await createTeacherMutation.mutateAsync(data);
        setShowAddModal(false);
      }
      setSelectedTeacher(null);
    } catch (error) {
      console.error('Error saving teacher:', error);
    }
  };

  const handleFormCancel = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedTeacher(null);
  };

  // Header simplified: bulk actions moved out of header; selection handled within list

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaUsers className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{t('teachers.title')}</h1>
                  <p className="text-sm text-gray-500">{t('teachers.subtitle')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                   <FaList className="w-4 h-4 mr-2" />
                   {t('teachers.listTab')}
                   <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                     {teacherList.teachers.length}
                   </span>
                 </div>
                </button>
                <button
                 onClick={() => setActiveTab('analytics')}
                 className={`py-2 px-1 border-b-2 font-medium text-sm ${
                   activeTab === 'analytics'
                     ? 'border-blue-500 text-blue-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
                >
                 <div className="flex items-center">
                   <FaChartBar className="w-4 h-4 mr-2" />
                   {t('teachers.analyticsTab')}
                   <span className="ml-2 bg-green-100 text-green-600 py-0.5 px-2 rounded-full text-xs">
                     {t('teachers.live')}
                   </span>
                 </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'list' && (
          <TeacherList
            teachers={teacherList.teachers}
            loading={teacherList.loading}
            selectedTeachers={teacherList.selectedTeachers}
            onTeacherSelect={handleTeacherSelect}
            onTeacherSelectToggle={teacherList.toggleTeacherSelection}
            onSelectAll={teacherList.selectAllTeachers}
            onDeselectAll={teacherList.clearSelection}
            pagination={{
              currentPage: teacherList.pagination.page,
              pageSize: teacherList.pagination.limit,
              totalPages: teacherList.totalPages,
              totalItems: teacherList.pagination.total,
            }}
            onPageChange={teacherList.setPage}
            onPageSizeChange={teacherList.setLimit}
            sort={{
              field: teacherList.sortBy as any,
              order: teacherList.sortOrder
            }}
            onSortChange={(sort) => {
              teacherList.setSortBy(sort.field);
              teacherList.setSortOrder(sort.order);
            }}
            searchQuery={teacherList.searchQuery}
            onSearchChange={teacherList.setSearchQuery}
            onRefresh={teacherList.refresh}
            onAddTeacher={handleAddTeacher}
            onShowFilters={() => setShowFilters(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{t('teachers.analyticsTitle')}</h2>
                  <p className="text-blue-100 mt-1">{t('teachers.analyticsSubtitle')}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-100">{t('teachers.lastUpdated')}</div>
                  <div className="text-lg font-semibold">{new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaUsers className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t('teachers.totalTeachers')}</p>
                    <p className="text-2xl font-semibold text-gray-900">{teacherList.teachers.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t('teachers.activeTeachers')}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {teacherList.teachers.filter(t => t.status === 'Active').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-bold">$</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t('teachers.averageSalary')}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${teacherList.teachers.length > 0 
                        ? Math.round(teacherList.teachers.reduce((sum, t) => sum + (t.salary || 0), 0) / teacherList.teachers.length)
                        : 0
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{t('teachers.departments')}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {new Set(teacherList.teachers.map(t => t.department)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Distribution */}
             <div className="bg-white rounded-lg shadow">
               <div className="px-6 py-4 border-b border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900">{t('teachers.departmentDistribution')}</h3>
               </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(
                    teacherList.teachers.reduce((acc, teacher) => {
                      const dept = teacher.department || 'Unassigned';
                      acc[dept] = (acc[dept] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([department, count]) => (
                    <div key={department} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">{department}</span>
                      </div>
                      <div className="flex items-center">
                           <span className="text-sm text-gray-500 mr-2">{count} {t('teachers.teachers')}</span>
                           <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(count / teacherList.teachers.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Overview */}
             <div className="bg-white rounded-lg shadow">
               <div className="px-6 py-4 border-b border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900">{t('teachers.performanceOverview')}</h3>
               </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {teacherList.teachers.filter(t => t.status === 'Active').length}
                    </div>
                    <div className="text-sm text-gray-500">{t('teachers.activeTeachers')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {teacherList.teachers.filter(t => t.status === 'Inactive').length}
                    </div>
                    <div className="text-sm text-gray-500">{t('teachers.inactiveTeachers')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {teacherList.teachers.filter(t => t.status === 'On Leave').length}
                    </div>
                    <div className="text-sm text-gray-500">{t('teachers.onLeave')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <TeacherForm
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={createTeacherMutation.isPending}
              errors={(createTeacherMutation.error as any)?.response?.data?.errors || {}}
            />
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTeacher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <TeacherForm
              teacher={selectedTeacher}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={updateTeacherMutation.isPending}
              errors={(updateTeacherMutation.error as any)?.response?.data?.errors || {}}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && teacherToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <FaTrash className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">{t('teachers.deleteTeacher')}</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  {t('teachers.deleteConfirmation', { name: `${teacherToDelete.firstName} ${teacherToDelete.lastName}` })}
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('teachers.cancel')}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteTeacherMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleteTeacherMutation.isPending ? t('teachers.deleting') : t('teachers.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal (Placeholder) */}
      {showFilters && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{t('teachers.filters')}</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-500">{t('teachers.filterOptions')}</p>
              <button
                onClick={() => setShowFilters(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t('teachers.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersScreen;
