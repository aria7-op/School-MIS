import React, { useState } from 'react';
import { FaSearch, FaFilter, FaSort, FaPlus, FaRedo, FaCheck, FaTimes } from 'react-icons/fa';
import TeacherCard from './TeacherCard';
import { Teacher, TeacherSortOptions } from '../types/teacher';

interface TeacherListProps {
  teachers: Teacher[];
  loading: boolean;
  selectedTeachers: Set<string>;
  onTeacherSelect: (teacher: Teacher) => void;
  onTeacherSelectToggle: (teacherId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sort: TeacherSortOptions;
  onSortChange: (sort: TeacherSortOptions) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onAddTeacher: () => void;
  onShowFilters: () => void;
  showSelection?: boolean;
  onToggleSelectionMode?: () => void;
}

const TeacherList: React.FC<TeacherListProps> = ({
  teachers,
  loading,
  selectedTeachers,
  onTeacherSelect,
  onTeacherSelectToggle,
  onSelectAll,
  onDeselectAll,
  pagination,
  onPageChange,
  onPageSizeChange,
  sort,
  onSortChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  onAddTeacher,
  onShowFilters,
  showSelection = false,
  onToggleSelectionMode
}) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      onDeselectAll();
    }
    onToggleSelectionMode?.();
  };

  const handleTeacherPress = (teacher: Teacher) => {
    if (isSelectionMode) {
      onTeacherSelectToggle(teacher.id);
    } else {
      onTeacherSelect(teacher);
    }
  };

  const handleTeacherLongPress = (teacher: Teacher) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      onTeacherSelectToggle(teacher.id);
    }
  };

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'department', label: 'Department' },
    { value: 'salary', label: 'Salary' },
    { value: 'experience', label: 'Experience' },
    { value: 'hireDate', label: 'Hire Date' },
  ];

  const pageSizeOptions = [10, 20, 50, 100];

  if (loading && teachers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={onShowFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaFilter className="h-4 w-4 mr-2" />
              Filters
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sort.field}-${sort.order}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  onSortChange({ field: field as any, order: order as 'asc' | 'desc' });
                }}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {sortOptions.map((option) => (
                  <React.Fragment key={option.value}>
                    <option value={`${option.value}-asc`}>
                      {option.label} (A-Z)
                    </option>
                    <option value={`${option.value}-desc`}>
                      {option.label} (Z-A)
                    </option>
                  </React.Fragment>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FaSort className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Selection Mode Toggle */}
            <button
              onClick={handleToggleSelectionMode}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isSelectionMode
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              {isSelectionMode ? (
                <>
                  <FaCheck className="h-4 w-4 mr-1" />
                  Selection Mode
                </>
              ) : (
                <>
                  <FaCheck className="h-4 w-4 mr-1" />
                  Select
                </>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaRedo className="h-4 w-4" />
            </button>

            {/* Add Teacher Button */}
            <button
              onClick={onAddTeacher}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Add Teacher
            </button>
          </div>
        </div>

        {/* Selection Toolbar */}
        {isSelectionMode && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-700">
                  {selectedTeachers.size} teacher{selectedTeachers.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={onSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={() => {
                    onDeselectAll();
                    setIsSelectionMode(false);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Selection
                </button>
              </div>
              <button
                onClick={() => setIsSelectionMode(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Teachers Grid */}
      {teachers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaSearch className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Teachers Found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'No teachers match your search criteria.' : 'Get started by adding a new teacher.'}
          </p>
          <button
            onClick={onAddTeacher}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="h-4 w-4 mr-2" />
            Add Teacher
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              isSelected={selectedTeachers.has(teacher.id)}
              onPress={() => handleTeacherPress(teacher)}
              onLongPress={() => handleTeacherLongPress(teacher)}
              onToggleSelection={() => onTeacherSelectToggle(teacher.id)}
              showSelection={isSelectionMode}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {teachers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Page Info */}
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Showing{' '}
                <span className="font-medium">
                  {Math.min((pagination.currentPage - 1) * pagination.pageSize + 1, pagination.totalItems)}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.totalItems}</span>{' '}
                results
              </span>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Show:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                        pageNum === pagination.currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherList;
