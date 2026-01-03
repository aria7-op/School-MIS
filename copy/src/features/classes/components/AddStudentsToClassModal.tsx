import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaUserPlus, FaCheck, FaUsers } from 'react-icons/fa';
import { Class, Student } from '../types/classes';
import studentService from '../../students/services/studentService';
import { useAddStudentsToClass } from '../services/classesService';
import SearchableDropdown from '../../finance/components/SearchableDropdown';

interface AddStudentsToClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class | null;
  onStudentsAdded: (studentIds: number[]) => void;
}

const AddStudentsToClassModal: React.FC<AddStudentsToClassModalProps> = ({
  isOpen,
  onClose,
  classData,
  onStudentsAdded
}) => {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentSearchValue, setStudentSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  
  // Use the mutation hook
  const addStudentsMutation = useAddStudentsToClass();

  // Load students when modal opens
  useEffect(() => {
    if (isOpen && classData) {
      loadStudents();
    }
  }, [isOpen, classData]);

  // Debounce search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(studentSearchValue);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [studentSearchValue]);

  // Memoize student options to prevent unnecessary recalculations
  const studentOptions = useMemo(() => {
    return students.map((student: any) => {
      // Handle different student data structures
      const firstName = student.firstName || student.user?.firstName || student.name?.split(' ')[0] || 'Unknown';
      const lastName = student.lastName || student.user?.lastName || student.name?.split(' ').slice(1).join(' ') || '';
      const email = student.email || student.user?.email || t('classes.addStudentsModal.noEmail');
      const studentId = student.user?.id || student.studentId || student.admissionNo || student.id || t('classes.addStudentsModal.noId');
      const grade = student.grade || student.class?.name || t('classes.addStudentsModal.noGrade');
      const parentFirstName = student.parent?.user?.firstName || '';
      
      // Create label with parent name if available
      const baseLabel = `${firstName} ${lastName}`.trim();
      const labelWithParent = parentFirstName 
        ? `${baseLabel} (${t('classes.addStudentsModal.parent')}: ${parentFirstName})`
        : baseLabel;
      
      return {
        id: student.id,
        label: labelWithParent,
        subtitle: [
          email && `${t('classes.addStudentsModal.email')}: ${email}`,
          studentId && `${t('classes.addStudentsModal.id')}: ${studentId}`,
          grade && `${t('classes.addStudentsModal.grade')}: ${grade}`
        ].filter(Boolean).join(' • '),
        data: student,
      };
    });
  }, [students]);

  // Memoize filtered options to prevent unnecessary filtering
  const filteredStudentOptions = useMemo(() => {
    if (!debouncedSearchValue.trim()) {
      return studentOptions;
    }
    
    const searchTerm = debouncedSearchValue.toLowerCase();
    return studentOptions.filter(option => 
      option.label.toLowerCase().includes(searchTerm) ||
      option.subtitle.toLowerCase().includes(searchTerm)
    );
  }, [studentOptions, debouncedSearchValue]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all students with pagination
      let allStudents: any[] = [];
      let page = 1;
      let hasMore = true;
      const limit = 100; // Load 100 at a time
      
      // First, get total count if available
      const firstResponse = await studentService.getStudents({ 
        limit: 1,
        page: 1 
      });
      
      let totalPages = 1;
      if (firstResponse.success && firstResponse.meta?.total) {
        totalPages = Math.ceil(firstResponse.meta.total / limit);
        setLoadingProgress({ current: 0, total: totalPages });
      }
      
      // Reset to load all students
      page = 1;
      allStudents = [];
      
      while (hasMore) {
        setLoadingProgress({ current: page, total: totalPages });
        
        const response = await studentService.getStudents({ 
          limit,
          page
        });
        
        if (response.success && response.data) {
          allStudents = [...allStudents, ...response.data];
          
          // Debug: Log parent data for first student
          if (response.data.length > 0) {
            console.log('First student parent data:', response.data[0].parent);
            console.log('First student full data:', response.data[0]);
          }
          
          // Check if we got less than the limit, meaning we're done
          if (response.data.length < limit) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }
      setStudents(allStudents);
      
    } catch (err) {
      console.error('Error loading students:', err);
      setError(t('classes.addStudentsModal.errorLoadingStudents'));
    } finally {
      setLoading(false);
    }
  };

  // Handle student search change with useCallback for performance
  const handleStudentSearchChange = useCallback((value: string) => {
    setStudentSearchValue(value);
  }, []);

  // Handle student selection from dropdown
  const handleStudentSelect = (option: any) => {
    const studentId = option.id;
    
    // Toggle selection - if already selected, remove it; if not selected, add it
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Handle removing a selected student
  const handleRemoveStudent = (studentId: number) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      newSet.delete(studentId);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedStudents.size === 0) {
      setError(t('classes.addStudentsModal.selectAtLeastOneStudent'));
      return;
    }

    if (!classData) {
      setError(t('classes.addStudentsModal.noClassSelected'));
      return;
    }

    try {
      setError(null);
      const studentIds = Array.from(selectedStudents);
      
      // Call the API to add students to the class
      await addStudentsMutation.mutateAsync({
        classId: classData.id,
        studentIds
      });
      
      // Call the callback
      onStudentsAdded(studentIds);
      
      // Reset form
      setSelectedStudents(new Set());
      setStudentSearchValue('');
      onClose();
    } catch (err) {
      console.error('Error adding students to class:', err);
      setError(t('classes.addStudentsModal.errorAddingStudents'));
    }
  };

  const handleClose = () => {
    setSelectedStudents(new Set());
    setStudentSearchValue('');
    setSelectedStudent(null);
    setError(null);
    onClose();
  };

  if (!isOpen || !classData) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FaUserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {t('classes.addStudentsModal.title')}
              </h3>
              <p className="text-sm text-gray-500">
                {classData.name} - {classData.code}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Student Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('classes.addStudentsModal.addStudents')}
            </label>
            <button
              onClick={() => setStudentSearchValue('')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {t('classes.addStudentsModal.showAllStudents')}
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder={t('classes.addStudentsModal.searchPlaceholder')}
              value={studentSearchValue}
              onChange={(e) => setStudentSearchValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md bg-white">
              {loading ? (
                <div className="px-3 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">
                      {t('classes.addStudentsModal.loadingStudents')} {loadingProgress.total > 0 && `(${loadingProgress.current}/${loadingProgress.total} ${t('classes.addStudentsModal.pages')})`}
                    </span>
                  </div>
                  {loadingProgress.total > 0 && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {filteredStudentOptions.map(option => (
                      <div
                        key={option.id}
                        onClick={() => handleStudentSelect(option)}
                        className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                          selectedStudents.has(option.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.subtitle}</div>
                        </div>
                        {selectedStudents.has(option.id) && (
                          <div className="ml-2">
                            <FaCheck className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                      </div>
                    ))
                  }
                  {filteredStudentOptions.length === 0 && !loading && (
                    <div className="px-3 py-4 text-center text-gray-500">
                      {studentSearchValue ? t('classes.addStudentsModal.noStudentsMatch') : t('classes.addStudentsModal.noStudentsAvailable')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>


        {/* Selected Students */}
        {selectedStudents.size > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">
                {t('classes.addStudentsModal.selectedStudents', { count: selectedStudents.size })}
              </h4>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedStudents.size === students.length ? t('classes.addStudentsModal.deselectAll') : t('classes.addStudentsModal.selectAll')}
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Array.from(selectedStudents).map(studentId => {
                const student = students.find(s => s.id === studentId);
                
                if (!student) {
                  return (
                    <div
                      key={studentId}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">
                          {t('classes.addStudentsModal.studentId')}: {studentId} ({t('classes.addStudentsModal.dataNotFound')})
                        </p>
                        <p className="text-xs text-red-500">
                          {t('classes.addStudentsModal.dataMayBeRemoved')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(studentId)}
                        className="ml-3 p-1 text-red-400 hover:text-red-600 transition-colors duration-200"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }
                
                // Handle different student data structures
                const firstName = (student as any).firstName || (student as any).user?.firstName || (student as any).name?.split(' ')[0] || t('classes.addStudentsModal.unknown');
                const lastName = (student as any).lastName || (student as any).user?.lastName || (student as any).name?.split(' ').slice(1).join(' ') || '';
                const email = (student as any).email || (student as any).user?.email || t('classes.addStudentsModal.noEmail');
                const studentIdDisplay = (student as any).user?.id || (student as any).studentId || (student as any).admissionNo || student.id || t('classes.addStudentsModal.noId');
                const parentFirstName = (student as any).parent?.user?.firstName || '';
                
                // Create display name with parent if available
                const baseName = `${firstName} ${lastName}`.trim();
                const displayName = parentFirstName 
                  ? `${baseName} (${t('classes.addStudentsModal.parent')}: ${parentFirstName})`
                  : baseName;
                
                return (
                  <div
                    key={studentId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {email} • {t('classes.addStudentsModal.id')}: {studentIdDisplay}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(studentId)}
                      className="ml-3 p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {students.length === 0 && !loading && (
          <div className="text-center py-8">
            <FaUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('classes.addStudentsModal.noStudentsAvailable')}</h3>
            <p className="text-gray-500">
              {t('classes.addStudentsModal.noStudentsToAdd')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('classes.addStudentsModal.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedStudents.size === 0 || addStudentsMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {addStudentsMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('classes.addStudentsModal.adding')}</span>
              </>
            ) : (
              <>
                <FaUserPlus className="w-4 h-4" />
                <span>{t('classes.addStudentsModal.addStudentsCount', { count: selectedStudents.size })}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentsToClassModal;
