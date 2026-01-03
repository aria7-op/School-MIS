import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import secureApiService from '../../services/secureApiService';
import { 
  HiOutlineChatBubbleLeftRight, 
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlinePaperAirplane,
  HiOutlineChevronDown,
  HiOutlineBookOpen,
  HiOutlineUsers
} from 'react-icons/hi2';

interface ParentNote {
  id: string;
  uuid: string;
  assignmentId: string;
  parentId: string;
  studentId: string;
  note: string;
  teacherResponse?: string;
  teacherResponseAt?: string;
  teacherResponderId?: string;
  acknowledgedAt: string;
  createdAt: string;
  updatedAt: string;
  parent: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      dariName?: string;
    };
  };
  student: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      dariName?: string;
    };
  };
  teacherResponder?: {
    id: string;
    firstName: string;
    lastName: string;
    dariName?: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  className: string;
  subjectName: string;
}

interface Class {
  id: string;
  name: string;
}

interface AssignmentNotesResponse {
  success: boolean;
  data: {
    assignment: Assignment;
    notes: ParentNote[];
  };
}

const AssignmentNotesManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notes, setNotes] = useState<ParentNote[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'RESPONDED'>('ALL');
  const [selectedNote, setSelectedNote] = useState<ParentNote | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load classes
  const loadClasses = async () => {
    try {
      const response = await secureApiService.get('/classes');

      if (response.success && Array.isArray(response.data)) {
        const classesData = response.data.map((cls: any) => ({
          id: cls.id,
          name: cls.name || cls.className || `Class ${cls.id}`
        }));
        setClasses(classesData);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  // Load assignments for selected class
  const loadAssignments = async (classId: string) => {
    if (!classId) {
      setAssignments([]);
      return;
    }

    try {
      const response = await secureApiService.get('/assignments', {
        params: { classId }
      });

      if (response.success && Array.isArray(response.data)) {
        const assignmentsData = response.data.map((assignment: any) => ({
          id: assignment.id,
          title: assignment.title,
          className: assignment.className || assignment.class?.name || 'Unknown Class',
          subjectName: assignment.subjectName || assignment.subject?.name || 'Unknown Subject'
        }));
        setAssignments(assignmentsData);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setError('Failed to load assignments');
    }
  };

  // Load assignment notes
  const loadAssignmentNotes = async (assignmentId: string) => {
    if (!assignmentId) {
      setNotes([]);
      setLoadingNotes(false);
      return;
    }

    try {
      setLoadingNotes(true);
      setError(null);

      const response = await secureApiService.get<AssignmentNotesResponse>(`/assignments/${assignmentId}/parent-notes`);
      
      if (response.success && response.data && Array.isArray(response.data.notes)) {
        setNotes(response.data.notes);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error loading assignment notes:', err);
      setError(err.message || 'Failed to load assignment notes');
      setNotes([]); // Clear notes instead of showing sample data
    } finally {
      setLoadingNotes(false);
    }
  };

  // Submit teacher response
  const handleSubmitResponse = async () => {
    if (!selectedNote || !responseText.trim()) {
      alert(t('assignmentNotes.messages.pleaseEnterResponse'));
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await secureApiService.post(
        `/assignments/${selectedNote.assignmentId}/parent-notes/${selectedNote.id}/respond`,
        {
          response: responseText,
          responderId: user?.id,
          responderName: `${user?.firstName || 'Admin'} ${user?.lastName || 'User'}`
        }
      );

      if (response.success) {
        // Update local state
        setNotes(prev => prev.map(note => 
          note.id === selectedNote.id
            ? {
                ...note,
                teacherResponse: responseText,
                teacherResponseAt: new Date().toISOString(),
                teacherResponder: {
                  id: user?.id || '',
                  firstName: user?.firstName || 'Admin',
                  lastName: user?.lastName || 'User',
                  dariName: null
                },
                teacherResponderId: user?.id || '',
                updatedAt: new Date().toISOString()
              }
            : note
        ));
        
        setShowResponseModal(false);
        setResponseText('');
        setSelectedNote(null);
        alert(t('assignmentNotes.messages.responseSubmitted'));
      } else {
        throw new Error('Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert(t('assignmentNotes.messages.failedToSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadAssignments(selectedClass);
      setSelectedAssignment('');
      setNotes([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedAssignment) {
      loadAssignmentNotes(selectedAssignment);
    }
  }, [selectedAssignment]);

  // Filter notes based on search and status
  const filteredNotes = notes.filter(note => {
    const parentName = `${note.parent.user.firstName} ${note.parent.user.lastName}`;
    const studentName = `${note.student.user.firstName} ${note.student.user.lastName}`;
    const teacherName = note.teacherResponder ? `${note.teacherResponder.firstName} ${note.teacherResponder.lastName}` : '';
    
    const matchesSearch = searchQuery.trim() === '' || 
      parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.note.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || 
      (filterStatus === 'PENDING' && !note.teacherResponse) ||
      (filterStatus === 'RESPONDED' && note.teacherResponse);
    
    return matchesSearch && matchesStatus;
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (note: ParentNote) => {
    if (!note.teacherResponse) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <HiOutlineClock className="w-4 h-4" style={{ marginInlineEnd: '0.25rem' }} />
          {t('assignmentNotes.status.pendingResponse')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <HiOutlineCheckCircle className="w-4 h-4" style={{ marginInlineEnd: '0.25rem' }} />
        {t('assignmentNotes.status.responded')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-gray-600">{t('assignmentNotes.messages.loadingNotes')}</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <HiOutlineChatBubbleLeftRight className="w-7 h-7 text-blue-600" style={{ marginInlineEnd: '0.75rem' }} />
            {t('assignmentNotes.title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('assignmentNotes.subtitle')}</p>
        </div>
        <button
          onClick={() => selectedAssignment && loadAssignmentNotes(selectedAssignment)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('assignmentNotes.refresh')}
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {/* Class and Assignment Selection */}
      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <HiOutlineUsers className="w-5 h-5 text-blue-600" style={{ marginInlineEnd: '0.5rem' }} />
          {t('assignmentNotes.selection.title')}
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
          {/* Class Selection */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('assignmentNotes.selection.selectClass')}:
            </label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm"
              >
                <option value="">{t('assignmentNotes.selection.chooseClass')}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <HiOutlineChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Assignment Selection */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('assignmentNotes.selection.selectAssignment')}:
            </label>
            <div className="relative">
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                disabled={!selectedClass}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              >
                <option value="">{t('assignmentNotes.selection.chooseAssignment')}</option>
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title} ({assignment.subjectName})
                  </option>
                ))}
              </select>
              <HiOutlineChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {selectedAssignment && (
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('assignmentNotes.stats.totalNotes')}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{notes.length}</p>
              </div>
              <HiOutlineChatBubbleLeftRight className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('assignmentNotes.stats.pendingResponses')}</p>
                <p className="text-2xl font-semibold text-yellow-600 mt-1">
                  {notes.filter(n => !n.teacherResponse).length}
                </p>
              </div>
              <HiOutlineClock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('assignmentNotes.stats.responded')}</p>
                <p className="text-2xl font-semibold text-green-600 mt-1">
                  {notes.filter(n => n.teacherResponse).length}
                </p>
              </div>
              <HiOutlineCheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {selectedAssignment && (
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('assignmentNotes.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('assignmentNotes.filters.all')} ({notes.length})
              </button>
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'PENDING'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('assignmentNotes.filters.pending')} ({notes.filter(n => !n.teacherResponse).length})
              </button>
              <button
                onClick={() => setFilterStatus('RESPONDED')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'RESPONDED'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('assignmentNotes.filters.responded')} ({notes.filter(n => n.teacherResponse).length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {!selectedAssignment ? (
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <HiOutlineBookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('assignmentNotes.messages.selectAssignment')}</h3>
          <p className="text-gray-500">{t('assignmentNotes.messages.selectAssignmentDescription')}</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <HiOutlineChatBubbleLeftRight className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('assignmentNotes.messages.noNotesFound')}</h3>
          <p className="text-gray-500">
            {searchQuery || filterStatus !== 'ALL'
              ? t('assignmentNotes.messages.tryAdjustingFilters')
              : t('assignmentNotes.messages.notesWillAppear')}
          </p>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(note)}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>👤 {t('assignmentNotes.parent.label')}: {note.parent.user.firstName} {note.parent.user.lastName}</span>
                    <span>👨‍🎓 {t('assignmentNotes.parent.student')}: {note.student.user.firstName} {note.student.user.lastName}</span>
                  </div>
                </div>
              </div>

              {/* Parent Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      💬 {t('assignmentNotes.parent.note')}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="text-gray-800 mt-2">{note.note}</p>
              </div>

              {/* Teacher Response */}
              {note.teacherResponse ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        ✅ {t('assignmentNotes.status.responded')} {t('assignmentNotes.parent.label')}: {note.teacherResponder ? `${note.teacherResponder.firstName} ${note.teacherResponder.lastName}` : 'Teacher'}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {note.teacherResponseAt && formatDate(note.teacherResponseAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-800 mt-2">{note.teacherResponse}</p>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedNote(note);
                      setResponseText('');
                      setShowResponseModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <HiOutlinePaperAirplane className="w-4 h-4" style={{ marginInlineEnd: '0.5rem' }} />
                    {t('assignmentNotes.actions.respondToParent')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">{t('assignmentNotes.modal.respondToParentNote')}</h2>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiOutlineXCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Assignment Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600 space-y-1">
                  <p>👤 {t('assignmentNotes.parent.label')}: {selectedNote.parent.user.firstName} {selectedNote.parent.user.lastName}</p>
                  <p>👨‍🎓 {t('assignmentNotes.parent.student')}: {selectedNote.student.user.firstName} {selectedNote.student.user.lastName}</p>
                </div>
              </div>

              {/* Parent Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-2">{t('assignmentNotes.modal.parentNote')}:</p>
                <p className="text-gray-800">{selectedNote.note}</p>
                <p className="text-xs text-blue-600 mt-2">{formatDate(selectedNote.createdAt)}</p>
              </div>

              {/* Response Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('assignmentNotes.modal.yourResponse')}:
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={t('assignmentNotes.modal.enterResponse')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  {t('assignmentNotes.actions.cancel')}
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submitting || !responseText.trim()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" style={{ marginInlineEnd: '0.5rem' }}></div>
                      {t('assignmentNotes.actions.submitting')}
                    </>
                  ) : (
                    <>
                      <HiOutlinePaperAirplane className="w-4 h-4" style={{ marginInlineEnd: '0.5rem' }} />
                      {t('assignmentNotes.actions.sendResponse')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentNotesManagement;