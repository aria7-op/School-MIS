import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FaPlus, 
  FaEdit, 
  FaSearch, 
  FaSpinner, 
  FaBook,
  FaCheckCircle,
  FaTimesCircle,
  FaUpload,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import SubjectFormModal from '../components/SubjectFormModal';
import SubjectDetailModal from '../components/SubjectDetailModal';
import BulkInsertModal from '../components/BulkInsertModal';
import subjectService from '../services/subjectService';
import { Subject, SubjectFormData } from '../types/subjects';

const SubjectsScreen: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBulkInsertModalOpen, setIsBulkInsertModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Fetch subjects
  const { data, isLoading, error } = useQuery({
    queryKey: ['subjects', page, searchQuery],
    queryFn: () => subjectService.getSubjects({ 
      page, 
      limit: 20, 
      search: searchQuery,
      includeInactive: true
    }),
  });

  // Debug logging
  console.log('Subjects data:', { data, isLoading, error, page, searchQuery });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: SubjectFormData) => subjectService.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsModalOpen(false);
      setSelectedSubject(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SubjectFormData> }) => 
      subjectService.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsModalOpen(false);
      setSelectedSubject(null);
    },
  });

  // Toggle status handler
  const handleToggleStatus = (subject: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;

    if (!userId) {
      console.error('User ID not found');
      return;
    }

    updateMutation.mutate({
      id: subject.id,
      data: {
        isActive: !Boolean(subject.isActive),
        updatedBy: Number(userId)
      }
    });
  };

  // Bulk insert mutation
  const bulkInsertMutation = useMutation({
    mutationFn: (subjects: SubjectFormData[]) => subjectService.bulkCreateSubjects(subjects),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsBulkInsertModalOpen(false);
    },
  });

  const handleCreateClick = () => {
    setSelectedSubject(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const handleRowClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDetailModalOpen(true);
  };

  const handleFormSubmit = async (formData: SubjectFormData) => {
    // Normalize subject code: extract numeric part (e.g., MATH10 -> 10)
    const numericCode = (formData.code || '').match(/\d+/)?.[0] || formData.code;
    const sanitized: SubjectFormData = { ...formData, code: numericCode };

    if (selectedSubject) {
      await updateMutation.mutateAsync({ id: selectedSubject.id, data: sanitized });
    } else {
      await createMutation.mutateAsync(sanitized);
    }
  };

  const handleBulkInsert = async (subjects: SubjectFormData[]) => {
    await bulkInsertMutation.mutateAsync(subjects);
  };

  const handleBulkInsertClick = () => {
    setIsBulkInsertModalOpen(true);
  };

  return (
    <div className="h-full w-full bg-gray-50 px-6 py-6">
      {/* Header */}
     <div className="mb-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
    {/* Title + subtitle */}
    <div className="flex-1 min-w-0">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
        <FaBook className="text-blue-600 flex-shrink-0" />
        <span>{t('admin.subjects.title')}</span>
      </h1>
      <p className="text-sm sm:text-base text-gray-600 mt-1">
        {t('admin.subjects.subtitle')}
      </p>
    </div>

    {/* Buttons */}
     <div className="flex flex-col w-full gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
       <button
         onClick={() => setShowInactive(!showInactive)}
         className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
           showInactive 
             ? 'bg-orange-600 text-white hover:bg-orange-700' 
             : 'bg-gray-600 text-white hover:bg-gray-700'
         }`}
         title={showInactive ? 'Hide inactive' : 'Show inactive'}
       >
         {showInactive ? 'All Subjects' : 'Active Only'}
       </button>
       <button
         onClick={handleBulkInsertClick}
         className="w-full sm:w-auto hidden items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 sm:flex"
         title="Bulk Insert Subjects"
         
       >
         <FaUpload />
         Bulk Insert
       </button>
       <button
         onClick={handleCreateClick}
         className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
       >
         <FaPlus />
         {t('admin.subjects.addSubject')}
       </button>
     </div>
  </div>

  {/* Search */}
  <div className="relative mb-6">
    <FaSearch className="absolute start-3 top-7 transform -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      placeholder={t('admin.subjects.searchPlaceholder')}
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
        setPage(1);
      }}
      className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
</div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center gap-3 justify-center py-12">
          <FaSpinner className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-gray-600">{t('admin.subjects.loading')}</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {t('admin.subjects.loadError')}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FaBook className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">{t('admin.subjects.noSubjectsFound')}</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? t('admin.subjects.noMatchSearch') : t('admin.subjects.getStarted')}
          </p>
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaPlus />
            {t('admin.subjects.addSubject')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.subjects.table.code')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.subjects.table.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.subjects.table.description')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.subjects.table.status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.subjects.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data.filter((subject: Subject) => showInactive || subject.isActive).map((subject: Subject) => (
                <tr 
                  key={subject.id} 
                  className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => handleRowClick(subject)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {subject.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {subject.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-medium ${
                        subject.isActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {subject.isActive ? t('admin.subjects.active') : t('admin.subjects.inactive')}
                      </span>
                      <button
                        onClick={(e) => handleToggleStatus(subject, e)}
                        className={`relative inline-flex h-6 w-11 items-center justify-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          subject.isActive 
                            ? 'bg-green-500 focus:ring-green-500' 
                            : 'bg-red-400 focus:ring-red-400'
                        }`}
                        title={subject.isActive ? t('admin.subjects.deactivate') : t('admin.subjects.activate')}
                      >
                        <span
                          className={`absolute h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                            subject.isActive ? 'translate-x-1' : '-translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-4 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(subject);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title={t('admin.subjects.table.edit')}
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.total > data.limit && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  {t('admin.subjects.pagination.showing', { 
                    from: ((page - 1) * data.limit) + 1, 
                    to: Math.min(page * data.limit, data.total), 
                    total: data.total 
                  })}
                </div>
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="Previous page"
                  >
                    <FaChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const totalPages = Math.ceil(data.total / data.limit);
                      const pages = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      
                      if (endPage - startPage < maxVisible - 1) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }

                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setPage(1)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="dots-start" className="px-2 py-1">...</span>
                          );
                        }
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => setPage(i)}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${
                              page === i
                                ? 'bg-blue-600 text-white border border-blue-600'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }

                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="dots-end" className="px-2 py-1">...</span>
                          );
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => setPage(totalPages)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                          >
                            {totalPages}
                          </button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * data.limit >= data.total}
                    className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    title="Next page"
                  >
                    <FaChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <SubjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSubject(null);
        }}
        subject={selectedSubject}
        onEdit={() => {
          setIsModalOpen(true);
        }}
      />

      {/* Form Modal */}
      <SubjectFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubject(null);
        }}
        onSubmit={handleFormSubmit}
        subject={selectedSubject}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Bulk Insert Modal */}
      <BulkInsertModal
        isOpen={isBulkInsertModalOpen}
        onClose={() => setIsBulkInsertModalOpen(false)}
        onBulkInsert={handleBulkInsert}
        isLoading={bulkInsertMutation.isPending}
      />
    </div>
  );
};

export default SubjectsScreen;














