// copy/src/features/classes/screens/ClassesScreen.tsx
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useClassStats, useCreateClass, useUpdateClass, useDeleteClass } from '../services/classesService';
import { useClassesSimplePagination } from '../hooks/useClassesSimplePagination';
import { Class, ClassCreateRequest, ClassUpdateRequest } from '../types/classes';
import ClassesHeader from '../components/ClassesHeader';
import SegmentedControl from '../components/SegmentedControl';
import ClassesDashboard from '../components/ClassesDashboard';
import ClassesList from '../components/ClassesList';
import CreateClassModal from '../components/CreateClassModal';

const ClassesScreen: React.FC = () => {
  const { t } = useTranslation();
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  // API Hooks
  const {
    classes,
    loading: classesLoading,
    error: classesError,
    pagination,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    refetch: refetchClasses
  } = useClassesSimplePagination(filters);
  
  const { data: statsData, isLoading: statsLoading, error: statsError } = useClassStats();
  
  
  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();
  const deleteClassMutation = useDeleteClass();

  // Tab configuration
  const tabs = [
    {
      id: 'dashboard',
      label: t('classes.tabs.dashboard'),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'list',
      label: t('classes.tabs.classes'),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
  }, []);

  const handleAddClass = useCallback(() => {
    setEditingClass(null);
    setShowCreateModal(true);
  }, []);

  const handleEditClass = useCallback((classData: Class) => {
    setEditingClass(classData);
    setShowCreateModal(true);
  }, []);

  const handleDeleteClass = useCallback((id: string) => {
    if (window.confirm(t('classes.confirmDelete'))) {
      deleteClassMutation.mutate(id, {
        onSuccess: () => {
          console.log('Class deleted successfully');
        },
        onError: (error) => {
          console.error('Error deleting class:', error);
        },
      });
    }
  }, [deleteClassMutation]);

  const handleViewClass = useCallback((id: string) => {
    // TODO: Navigate to class details
    console.log('View class:', id);
  }, []);

  const handleCreateClass = useCallback((data: ClassCreateRequest) => {
    if (editingClass) {
      // Update existing class
      updateClassMutation.mutate(
        { id: editingClass.id, data: data as ClassUpdateRequest },
        {
          onSuccess: () => {
            setShowCreateModal(false);
            setEditingClass(null);
          },
          onError: (error) => {
            console.error('Error updating class:', error);
          },
        }
      );
    } else {
      // Create new class
      createClassMutation.mutate(data, {
        onSuccess: () => {
          setShowCreateModal(false);
        },
        onError: (error) => {
          console.error('Error creating class:', error);
        },
      });
    }
  }, [editingClass, createClassMutation, updateClassMutation]);

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
    setEditingClass(null);
  }, []);

  const handleStudentsAdded = useCallback((classId: string, studentIds: number[]) => {
    console.log(`Added ${studentIds.length} students to class ${classId}`);
    // The mutation will automatically invalidate the queries and refresh the data
  }, []);

  const handleToggleStatus = useCallback((classId: string, currentStatus: boolean | number) => {
    // Convert current status to boolean properly (handles 0, 1, true, false)
    const isCurrentlyActive = Boolean(currentStatus);
    const newStatus = !isCurrentlyActive;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;

    if (!userId) {
      console.error('User ID not found');
      return;
    }

    console.log(`Toggling class ${classId} from ${isCurrentlyActive} to ${newStatus}`);

    updateClassMutation.mutate(
      { 
        id: classId, 
        data: { 
          isActive: newStatus,
          updatedBy: Number(userId)
        } 
      },
      {
        onSuccess: () => {
          console.log(`Class ${classId} status changed to ${newStatus ? 'active' : 'inactive'}`);
        },
        onError: (error) => {
          console.error('Error toggling class status:', error);
        },
      }
    );
  }, [updateClassMutation]);

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ClassesDashboard
            stats={statsData?.data || null}
            loading={statsLoading}
            error={statsError?.message || null}
          />
        );
      case 'list':
        return (
          <ClassesList
            classes={classes}
            loading={classesLoading}
            error={classesError}
            pagination={pagination}
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onPageChange={goToPage}
            onNextPage={nextPage}
            onPrevPage={prevPage}
            onEditClass={handleEditClass}
            onDeleteClass={handleDeleteClass}
            onViewClass={handleViewClass}
            onStudentsAdded={handleStudentsAdded}
            onToggleStatus={handleToggleStatus}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-gray-50">
      {/* Header */}
      <ClassesHeader
        onSearch={handleSearch}
        onAddClass={handleAddClass}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Tab Navigation */}
      <SegmentedControl
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* Create/Edit Modal */}
      <CreateClassModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateClass}
        loading={createClassMutation.isPending || updateClassMutation.isPending}
        editData={editingClass}
      />
    </div>
  );
};

export default ClassesScreen;