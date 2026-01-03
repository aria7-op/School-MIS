import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaTimes, FaUserPlus, FaSpinner, FaCheck, FaExclamationTriangle, FaBook } from 'react-icons/fa';
import secureApiService from '../../../services/secureApiService';
import { Class } from '../types/classes';

interface Teacher {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    avatar?: string;
  };
}

interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
}

interface TeacherSubjectMapping {
  teacherId: number;
  subjectIds: number[];
  isSupervisor?: boolean; // Whether this teacher should be the class supervisor
}

interface UserWithTeacher {
  id: number;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  avatar?: string;
  teacher: {
    id: number;
    userId: number;
    employeeId: string;
  };
}

interface AssignTeachersModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: Class | null;
  onTeachersAssigned?: () => void;
}

const AssignTeachersModal: React.FC<AssignTeachersModalProps> = ({
  isOpen,
  onClose,
  classData,
  onTeachersAssigned,
}) => {
  const { t } = useTranslation();
  const [selectedTeachers, setSelectedTeachers] = useState<TeacherSubjectMapping[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch teachers
  const { data: teachersData, isLoading: teachersLoading, error: teachersError } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      console.log('Fetching teachers...');
      const response = await secureApiService.get<any>('/teachers', {
        params: { include: 'user' },
      });

      if (!response.success) {
        console.error('Teachers API Error:', response);
        throw new Error(
          t('classes.assignTeachersModal.teachersApiFailed', {
            message: response.message || 'Request failed',
          }),
        );
      }

      const payload = response.data;
      const allTeachers = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      console.log('All Teachers:', allTeachers);

      return allTeachers;
    },
    enabled: true, // Always enabled, not dependent on isOpen
    retry: 1,
  });

  // Subjects - paginated loading (100 at a time)
  const [subjects, setSubjects] = useState<Subject[]>([] as any);
  const [subjectsPage, setSubjectsPage] = useState(1);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsHasMore, setSubjectsHasMore] = useState(true);
  // Per-teacher subject search text
  const [subjectSearch, setSubjectSearch] = useState<{ [teacherId: number]: string }>({});
  // Per-teacher active tab: 'teachers' | 'subjects'
  const [teacherTabs, setTeacherTabs] = useState<{ [teacherId: number]: 'teachers' | 'subjects' }>({});
  // Main modal tabs
  const [mainTab, setMainTab] = useState<'assign' | 'assigned'>('assign');
  // Active teacher tab to show subjects panel
  const [activeTeacherId, setActiveTeacherId] = useState<number | null>(null);

  const loadSubjectsPage = async (page: number) => {
    setSubjectsLoading(true);
    try {
      const result = await secureApiService.get<any>('/subjects', {
        params: { page, limit: 100 },
      });
      if (!result.success) {
        console.error('Subjects API Error:', result);
        throw new Error(result.message || 'Failed to fetch subjects');
      }
      const subjectsPageData = Array.isArray(result.data) ? result.data : result.data?.data || [];
      const pagination = result.meta || result.pagination || {};
      setSubjects(prev => [...prev, ...subjectsPageData]);
      const hasNext = typeof pagination.hasNext === 'boolean'
        ? pagination.hasNext
        : ((pagination.page ?? page) < (pagination.totalPages ?? page + (subjectsPageData.length === 100 ? 1 : 0)));
      setSubjectsHasMore(hasNext);
    } finally {
      setSubjectsLoading(false);
    }
  };

  // Reset and load first page when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubjects([]);
      setSubjectsPage(1);
      setSubjectsHasMore(true);
      loadSubjectsPage(1);
    }
  }, [isOpen]);

  // Fetch current class data with supervisor
  const { data: currentClassData } = useQuery({
    queryKey: ['class', classData?.id, 'withSupervisor'],
    queryFn: async () => {
      if (!classData?.id) return null;
      const result = await secureApiService.get<any>(`/classes/${classData.id}`, {
        params: { include: 'supervisor' },
      });
      return result.success ? result.data : null;
    },
    enabled: isOpen && !!classData?.id,
  });

  // Fetch current class teacher-subject assignments
  const { data: classTeachersData, isLoading: classTeachersLoading } = useQuery({
    queryKey: ['classTeacherSubjects', classData?.id],
    queryFn: async () => {
      if (!classData?.id) return [];
      console.log('Fetching class teacher-subject assignments for class:', classData.id);
      const result = await secureApiService.get<any>('/teacher-class-subjects', {
        params: { classId: classData.id },
      });
      
      if (!result.success) {
        console.error('Class teacher-subjects API error:', result);
        throw new Error(
          t('classes.assignTeachersModal.failedToFetchClassTeachers', {
            message: result.message || 'Request failed',
          }),
        );
      }
      
      const payload = result.data;
      return Array.isArray(payload) ? payload : payload?.data || [];
    },
    enabled: isOpen && !!classData?.id,
  });

  // Set supervisor when class data loads
  useEffect(() => {
    if (currentClassData?.supervisorId && isOpen) {
      const supervisorId = parseInt(currentClassData.supervisorId);
      // If supervisor teacher is in selectedTeachers, mark as supervisor
      setSelectedTeachers(prev => {
        const hasSupervisor = prev.some(t => t.teacherId === supervisorId);
        if (hasSupervisor) {
          return prev.map(t => ({
            ...t,
            isSupervisor: t.teacherId === supervisorId
          }));
        }
        return prev;
      });
    }
  }, [currentClassData, isOpen]);

  // Assign teachers with subjects mutation
  const assignTeachersMutation = useMutation({
    mutationFn: async (data: { assignments: { teacherId: number; subjectId: number }[], supervisorId?: number }) => {
      // Transform assignments to include classId
      const assignmentsWithClass = data.assignments.map(a => ({
        teacherId: a.teacherId,
        classId: classData?.id,
        subjectId: a.subjectId
      }));
      
      const response = await secureApiService.post('/teacher-class-subjects/bulk', {
        assignments: assignmentsWithClass,
        supervisorId: data.supervisorId,
        classId: classData?.id,
      });

      if (!response.success) {
        throw new Error(response.message || t('classes.assignTeachersModal.failedToAssignTeachers'));
      }

      // If supervisor is set, also call the supervisor endpoint
      if (data.supervisorId && classData?.id) {
        try {
          await secureApiService.put(`/classes/${classData.id}/supervisor`, {
            supervisorId: data.supervisorId,
          });
        } catch (supervisorError) {
          console.error('Error setting supervisor:', supervisorError);
          // Don't fail the entire request if supervisor assignment fails
        }
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classTeacherSubjects', classData?.id] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setSelectedTeachers([]);
      onTeachersAssigned?.();
    },
  });

  // Remove teacher-subject assignment mutation
  const removeTeacherMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      const response = await secureApiService.delete(`/teacher-class-subjects/${assignmentId}`);

      if (!response.success) {
        throw new Error(response.message || t('classes.assignTeachersModal.failedToRemoveTeacher'));
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classTeacherSubjects', classData?.id] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTeachers([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Get currently assigned teacher IDs and their subjects
  const assignedTeacherSubjects = classTeachersData?.reduce((acc: any, assignment: any) => {
    const teacherId = parseInt(assignment.teacher?.id || assignment.teacherId);
    const subjectId = parseInt(assignment.subject?.id || assignment.subjectId);
    if (!acc[teacherId]) {
      acc[teacherId] = [];
    }
    acc[teacherId].push(subjectId);
    return acc;
  }, {}) || {};

  // Filter teachers based on search (don't exclude already assigned - they can teach multiple subjects)
  const availableTeachers = teachersData?.filter((teacher: any) => {
    const user = teacher.user;
    
    return user &&
      (searchQuery === '' || 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase())));
  }) || [];

  const assignedTeacherIds = Object.keys(assignedTeacherSubjects).map(id => parseInt(id));

  // Debug logging
  console.log('teachersData:', teachersData);
  console.log('availableTeachers:', availableTeachers);
  console.log('teachersLoading:', teachersLoading);
  console.log('teachersError:', teachersError);

  const handleTeacherToggle = (teacherId: number) => {
    setSelectedTeachers(prev => {
      const exists = prev.find(t => t.teacherId === teacherId);
      if (exists) {
        return prev.filter(t => t.teacherId !== teacherId);
      } else {
        return [...prev, { teacherId, subjectIds: [], isSupervisor: false }];
      }
    });
  };

  const handleSupervisorToggle = (teacherId: number, isSupervisor: boolean) => {
    setSelectedTeachers(prev => prev.map(t => {
      if (t.teacherId === teacherId) {
        return { ...t, isSupervisor };
      } else if (isSupervisor) {
        // If setting this teacher as supervisor, unset others
        return { ...t, isSupervisor: false };
      }
      return t;
    }));
  };

  const handleSubjectChange = (teacherId: number, subjectId: number, checked: boolean) => {
    setSelectedTeachers(prev => prev.map(t => {
      if (t.teacherId !== teacherId) return t;
      const current = new Set(t.subjectIds);
      if (checked) current.add(subjectId); else current.delete(subjectId);
      return { ...t, subjectIds: Array.from(current) };
    }));
  };

  const handleAssignTeachers = () => {
    if (selectedTeachers.length > 0) {
      // Flatten to per-subject assignments
      const expanded = selectedTeachers.flatMap(t => (t.subjectIds || []).map(sid => ({ teacherId: t.teacherId, subjectId: sid })));
      if (expanded.length > 0) {
        // Find supervisor if any
        const supervisorTeacher = selectedTeachers.find(t => t.isSupervisor);
        const supervisorId = supervisorTeacher ? supervisorTeacher.teacherId : undefined;
        
        assignTeachersMutation.mutate({ 
          assignments: expanded as any,
          supervisorId 
        });
      }
    }
  };

  const handleRemoveTeacher = (assignmentId: number) => {
    if (window.confirm(t('classes.assignTeachersModal.confirmRemoveTeacher'))) {
      removeTeacherMutation.mutate(assignmentId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('classes.assignTeachersModal.title')}
            </h2>
            {classData && (
              <p className="text-sm text-gray-500 mt-1">
                {classData.name} ({classData.code})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {/* Main Tabs */}
        <div className="px-6 border-b border-gray-200">
          <nav className="flex gap-2">
            <button
              type="button"
              onClick={() => setMainTab('assign')}
              className={`px-4 py-2 text-sm rounded-t-md border ${mainTab==='assign' ? 'bg-white border-gray-300 border-b-white text-blue-600 font-semibold' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
            >
              Assign Teachers
            </button>
            <button
              type="button"
              onClick={() => setMainTab('assigned')}
              className={`px-4 py-2 text-sm rounded-t-md border ${mainTab==='assigned' ? 'bg-white border-gray-300 border-b-white text-blue-600 font-semibold' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}
            >
              Assigned Teachers
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="h-[calc(90vh-160px)] overflow-y-auto">
          {mainTab === 'assign' && (
          <div className="p-6">
            {/* Available Teachers */}
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Teachers ({availableTeachers.length})
              </h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder={t('classes.assignTeachersModal.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Teachers Horizontal Tabs */}
              <div className="overflow-x-auto pb-2">
                <div className="flex flex-nowrap gap-2 min-w-max">
                  {teachersLoading ? (
                    <div className="flex items-center py-2 px-3 text-sm text-gray-500"><FaSpinner className="h-4 w-4 animate-spin mr-2"/>Loading…</div>
                  ) : availableTeachers.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-gray-500">No teachers</div>
                  ) : (
                    availableTeachers.map((teacher: any) => {
                      const user = teacher.user;
                      const teacherId = parseInt(teacher.id);
                      const isSelected = selectedTeachers.some(t => t.teacherId === teacherId);
                      return (
                        <button
                          key={teacherId}
                          type="button"
                          onClick={() => {
                            handleTeacherToggle(teacherId);
                            setActiveTeacherId(teacherId);
                            setTeacherTabs(prev => ({ ...prev, [teacherId]: 'subjects' }));
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md border whitespace-nowrap ${isSelected ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'}`}
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <span className="text-sm font-medium">{user.displayName || `${user.firstName} ${user.lastName}`}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Active teacher subjects panel */}
              {activeTeacherId && selectedTeachers.some(t => t.teacherId === activeTeacherId) && (() => {
                const mapping = selectedTeachers.find(t => t.teacherId === activeTeacherId)!;
                const teacher = availableTeachers.find((t: any) => parseInt(t.id) === activeTeacherId);
                const isSupervisor = mapping?.isSupervisor || false;
                return (
                  <div className="mt-4">
                    <div className="mb-2 text-sm font-semibold text-gray-700">Subjects for: {teacher?.user?.displayName || `${teacher?.user?.firstName} ${teacher?.user?.lastName}`}</div>
                    
                    {/* Supervisor Checkbox */}
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSupervisor}
                          onChange={(e) => handleSupervisorToggle(activeTeacherId, e.target.checked)}
                          className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium text-gray-800">
                          نگران صنف (Class Supervisor)
                        </span>
                        <span className="text-xs text-gray-600">
                          (Only one supervisor per class)
                        </span>
                      </label>
                    </div>

                    <div className="border rounded-lg">
                      <div className="px-3 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-700 flex items-center">
                        <FaBook className="mr-1" /> Subjects
                      </div>
                      <div className="p-3 space-y-2">
                        <input
                          type="text"
                          value={subjectSearch[activeTeacherId] || ''}
                          onChange={(e) => setSubjectSearch(prev => ({ ...prev, [activeTeacherId]: e.target.value }))}
                          placeholder="Search subject..."
                          className="w-full mb-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="max-h-48 overflow-y-auto border rounded p-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {subjects
                              ?.filter((subject: Subject) =>
                                !assignedTeacherSubjects[activeTeacherId]?.includes(parseInt(subject.id.toString())) &&
                                ((subjectSearch[activeTeacherId] || '').trim() === '' ? true : (
                                  subject.name?.toLowerCase().includes((subjectSearch[activeTeacherId] || '').toLowerCase()) ||
                                  subject.code?.toLowerCase().includes((subjectSearch[activeTeacherId] || '').toLowerCase())
                                ))
                              )
                              .slice()
                              .sort((a: Subject, b: Subject) => (a.name || '').localeCompare(b.name || ''))
                              .map((subject: Subject) => {
                                const chosen = (mapping?.subjectIds || []).includes(parseInt(subject.id.toString())) || false;
                                return (
                                  <label key={subject.id} className={`flex items-center gap-2 px-2 py-1 rounded border cursor-pointer text-xs ${chosen ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                    <input
                                      type="checkbox"
                                      checked={chosen}
                                      onChange={(e) => handleSubjectChange(activeTeacherId, parseInt(subject.id.toString()), e.target.checked)}
                                      className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                                    />
                                    <span className="font-medium text-gray-700">{subject.code}</span>
                                    <span className="text-gray-500">- {subject.name}</span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>
                        {subjectsHasMore && (
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const next = subjectsPage + 1;
                                setSubjectsPage(next);
                                loadSubjectsPage(next);
                              }}
                              disabled={subjectsLoading}
                              className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                            >
                              {subjectsLoading ? 'Loading more…' : 'See more'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Assign Button */}
            <div className="mt-4">
              <button
                onClick={handleAssignTeachers}
                disabled={selectedTeachers.length === 0 || selectedTeachers.every(t => !t.subjectIds || t.subjectIds.length === 0) || assignTeachersMutation.isPending}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {assignTeachersMutation.isPending ? (
                  <>
                    <FaSpinner className="h-4 w-4 animate-spin mr-2" />
                    {t('classes.assignTeachersModal.assigning')}
                  </>
                ) : (
                  <>
                    <FaUserPlus className="h-4 w-4 mr-2" />
                  {`Assign ${selectedTeachers.filter(t => (t.subjectIds || []).length > 0).length} Teacher(s)`}
                  </>
                )}
              </button>
              {selectedTeachers.length > 0 && selectedTeachers.some(t => !t.subjectIds || t.subjectIds.length === 0) && (
                <p className="text-xs text-amber-600 mt-2 text-center">
                  Please select subjects for all selected teachers
                </p>
              )}
            </div>
          </div>
          )}

          {mainTab === 'assigned' && (
          <div className="p-6">
            {/* Assigned Teachers */}
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assigned Teachers ({assignedTeacherIds.length})
              {classTeachersData && classTeachersData.length > assignedTeacherIds.length && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({classTeachersData.length} subject assignments)
                </span>
              )}
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {classTeachersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-500">{t('classes.assignTeachersModal.loadingAssignedTeachers')}</span>
                </div>
              ) : assignedTeacherIds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('classes.assignTeachersModal.noTeachersAssignedYet')}
                </div>
              ) : (
                // Group assignments by teacher
                Object.entries(
                  classTeachersData?.reduce((acc: any, assignment: any) => {
                    const teacherId = assignment.teacher?.id || assignment.teacherId;
                    if (!acc[teacherId]) {
                      acc[teacherId] = {
                        teacher: assignment.teacher,
                        assignments: []
                      };
                    }
                    acc[teacherId].assignments.push(assignment);
                    return acc;
                  }, {}) || {}
                ).map(([teacherId, data]: [string, any]) => (
                  <div
                    key={teacherId}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center flex-1">
                        {data.teacher?.user?.avatar ? (
                          <img
                            src={data.teacher.user.avatar}
                            alt={data.teacher.user.displayName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {data.teacher?.user?.firstName?.[0]}{data.teacher?.user?.lastName?.[0]}
                            </span>
                          </div>
                        )}
                        
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {data.teacher?.user?.displayName || `${data.teacher?.user?.firstName} ${data.teacher?.user?.lastName}`}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Display Assigned Subjects */}
                    <div className="ml-11 space-y-1">
                      {data.assignments.map((assignment: any) => (
                        <div key={assignment.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center text-xs text-gray-600">
                            <FaBook className="mr-1 text-blue-500" />
                            <span className="font-medium">{assignment.subject?.name}</span>
                            <span className="ml-1 text-gray-400">({assignment.subject?.code})</span>
                          </div>
                          <button
                            onClick={() => handleRemoveTeacher(assignment.id)}
                            disabled={removeTeacherMutation.isPending}
                            className="text-red-500 hover:text-red-700 disabled:text-gray-300 transition-colors duration-200"
                            title="Remove this subject"
                          >
                            {removeTeacherMutation.isPending ? (
                              <FaSpinner className="h-3 w-3 animate-spin" />
                            ) : (
                              <FaTimes className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            {t('classes.assignTeachersModal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTeachersModal;
