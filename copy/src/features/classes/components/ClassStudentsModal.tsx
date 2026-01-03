import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaIdCard, FaGraduationCap, FaTrash } from 'react-icons/fa';
import { Class } from '../types/classes';
import { useClassStudents, useRemoveStudentFromClass } from '../services/classesService';

interface ClassStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class | null;
}

const ClassStudentsModal: React.FC<ClassStudentsModalProps> = ({
  isOpen,
  onClose,
  classData,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [studentToRemove, setStudentToRemove] = useState<any>(null);

  // Fetch students for the class
  const { 
    data: studentsData, 
    isLoading: studentsLoading, 
    error: studentsError,
    refetch: refetchStudents
  } = useClassStudents(classData?.id || '', {
    enabled: isOpen && !!classData?.id
  });

  // Remove student mutation
  const removeStudentMutation = useRemoveStudentFromClass();

  const students = React.useMemo(() => studentsData?.data || [], [studentsData?.data]);

  // Filter students based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter((student: any) => {
        const fullName = `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.toLowerCase();
        const email = student.user?.email || '';
        const rollNo = student.rollNo || '';
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query) || 
               email.includes(query) || 
               rollNo.includes(query);
      });
      setFilteredStudents(filtered);
    }
  }, [students, searchQuery]);

  // Handle remove student
  const handleRemoveStudent = (student: any) => {
    setStudentToRemove(student);
  };

  const confirmRemoveStudent = () => {
    if (studentToRemove && classData) {
      console.log('🔍 confirmRemoveStudent called with student:', studentToRemove);
      console.log('🔍 Student ID being passed:', studentToRemove.id.toString());
      console.log('🔍 Class ID being passed:', classData.id);
      
      removeStudentMutation.mutate({
        studentId: studentToRemove.id.toString(),
        fromClassId: classData.id
      }, {
        onSuccess: () => {
          console.log('✅ Student removed successfully');
          setStudentToRemove(null);
          refetchStudents(); // Refresh the student list
        },
        onError: (error) => {
          console.error('❌ Error removing student from class:', error);
        },
      });
    }
  };

  const cancelRemoveStudent = () => {
    setStudentToRemove(null);
  };

  if (!isOpen || !classData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {t('classes.studentsModal.title', { className: classData.name })}
                </h3>
                <p className="text-sm text-gray-500">
                  {classData.code} • {t('classes.level')} {classData.level}
                  {classData.section && ` • ${t('classes.section')} ${classData.section}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder={t('classes.studentsModal.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {studentsLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">{t('classes.studentsModal.loadingStudents')}</span>
              </div>
            ) : studentsError ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">
                  <FaUser className="h-12 w-12 mx-auto mb-2" />
                </div>
                <p className="text-gray-600">{t('classes.studentsModal.errorLoading')}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {studentsError?.message || t('classes.studentsModal.somethingWentWrong')}
                </p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <FaUser className="h-12 w-12 mx-auto mb-2" />
                </div>
                <p className="text-gray-600">
                  {searchQuery ? t('classes.studentsModal.noStudentsFound') : t('classes.studentsModal.noStudentsInClass')}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-gray-500 mt-1">
                    {t('classes.studentsModal.addStudentsHint')}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student: any) => (
                  <div
                    key={student.id}
                    className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {student.user?.firstName?.[0] || 'S'}{student.user?.lastName?.[0] || 'T'}
                        </span>
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {student.user?.firstName} {student.user?.lastName}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            {student.user?.id && (
                              <div className="flex items-center text-xs text-gray-500">
                                <FaIdCard className="h-3 w-3 mr-1" />
                                {t('classes.studentsModal.userId')}: {student.user.id}
                              </div>
                            )}
                            {student.rollNo && (
                              <div className="flex items-center text-xs text-gray-500">
                                <FaIdCard className="h-3 w-3 mr-1" />
                                {t('classes.studentsModal.roll')}: {student.rollNo}
                              </div>
                            )}
                            {student.user?.email && (
                              <div className="flex items-center text-xs text-gray-500">
                                <FaEnvelope className="h-3 w-3 mr-1" />
                                {student.user.email}
                              </div>
                            )}
                            {student.user?.phone && (
                              <div className="flex items-center text-xs text-gray-500">
                                <FaPhone className="h-3 w-3 mr-1" />
                                {student.user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Status and Actions */}
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.isActive !== false 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.isActive !== false ? t('classes.studentsModal.active') : t('classes.studentsModal.inactive')}
                          </span>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveStudent(student)}
                            disabled={removeStudentMutation.isPending}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('classes.studentsModal.removeFromClass')}
                          >
                            <FaTrash className="w-3 h-3 mr-1" />
                            {t('classes.studentsModal.remove')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {searchQuery ? (
                  <span>
                    {t('classes.studentsModal.showingResults', { showing: filteredStudents.length, total: students.length })}
                  </span>
                ) : (
                  <span>
                    {t('classes.studentsModal.studentsInClass', { count: students.length })}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                {t('classes.studentsModal.close')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {studentToRemove && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={cancelRemoveStudent}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaTrash className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {t('classes.studentsModal.removeStudentTitle')}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {t('classes.studentsModal.removeStudentConfirm', { 
                          studentName: `${studentToRemove.user?.firstName} ${studentToRemove.user?.lastName}`,
                          className: classData.name 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmRemoveStudent}
                  disabled={removeStudentMutation.isPending}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removeStudentMutation.isPending ? t('classes.studentsModal.removing') : t('classes.studentsModal.remove')}
                </button>
                <button
                  type="button"
                  onClick={cancelRemoveStudent}
                  disabled={removeStudentMutation.isPending}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('classes.studentsModal.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassStudentsModal;
