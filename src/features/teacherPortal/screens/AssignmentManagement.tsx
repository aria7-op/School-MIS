import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import AssignmentForm from '../../assignments/components/AssignmentForm';
import assignmentService from '../../assignments/services/assignmentService';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  DocumentPlusIcon,
  CalendarIcon,
  UserIcon,
  BookOpenIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  status: string;
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  attachments?: Array<{
    id: string;
    name: string;
    path: string;
    mimeType: string;
    size: number;
  }>;
  submissionCount?: number;
  createdAt: string;
}

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

const AssignmentManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Load assignments
  const loadAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getTeacherAssignments({
        search: searchQuery,
        classId: selectedClass,
        subjectId: selectedSubject,
      });
      
      if (response.success) {
        setAssignments(response.data);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Load classes
  const loadClasses = async () => {
    try {
      const response = await assignmentService.getClasses();
      if (response.success) {
        setClasses(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load classes:', error);
    }
  };

  // Load subjects
  const loadSubjects = async () => {
    try {
      const response = await assignmentService.getSubjects();
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load subjects:', error);
    }
  };

  // Create assignment
  const handleCreateAssignment = async (assignmentData: any, files?: File[]) => {
    try {
      const response = await assignmentService.createAssignment(assignmentData, files);
      if (response.success) {
        setAssignments((prev: Assignment[]) => [response.data, ...prev]);
        setShowForm(false);
        setSelectedAssignment(null);
        setFormMode('create');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to create assignment');
    }
  };

  // Update assignment
  const handleUpdateAssignment = async (assignmentData: any, files?: File[]) => {
    if (!selectedAssignment) return;
    
    try {
      const response = await assignmentService.updateAssignment(selectedAssignment.id, assignmentData, files);
      if (response.success) {
        setAssignments((prev: Assignment[]) => prev.map((a: Assignment) => a.id === selectedAssignment.id ? response.data : a));
        setShowForm(false);
        setSelectedAssignment(null);
        setFormMode('create');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update assignment');
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const response = await assignmentService.deleteAssignment(assignmentId);
      if (response.success) {
        setAssignments(prev => prev.filter((a: Assignment) => a.id !== assignmentId));
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete assignment');
    }
  };

  // Handle form success
  const handleFormSuccess = (assignment: Assignment) => {
    if (formMode === 'create') {
      setAssignments((prev: Assignment[]) => [assignment, ...prev]);
    } else {
      setAssignments((prev: Assignment[]) => prev.map((a: Assignment) => a.id === assignment.id ? assignment : a));
    }
    setShowForm(false);
    setSelectedAssignment(null);
    setFormMode('create');
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'COMPLETED':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment: Assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !selectedClass || assignment.class.id === selectedClass;
    const matchesSubject = !selectedSubject || assignment.subject.id === selectedSubject;
    
    return matchesSearch && matchesClass && matchesSubject;
  });

  useEffect(() => {
    loadAssignments();
    loadClasses();
    loadSubjects();
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [searchQuery, selectedClass, selectedSubject]);

  if (showForm) {
    return (
      <AssignmentForm
        assignment={selectedAssignment}
        onClose={() => {
          setShowForm(false);
          setSelectedAssignment(null);
          setFormMode('create');
        }}
        onSuccess={handleFormSuccess}
        mode={formMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <DocumentPlusIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Assignment Management</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create Assignment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <DocumentPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first assignment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment: Assignment) => (
              <div key={assignment.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{assignment.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <BookOpenIcon className="h-4 w-4" />
                        <span>{assignment.subject.name}</span>
                        <span>•</span>
                        <span>{assignment.class.name}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {assignment.description}
                  </p>

                  {/* Meta Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Due: {formatDate(assignment.dueDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Max Score: {assignment.maxScore}
                    </div>
                    {assignment.attachments && assignment.attachments.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <DocumentPlusIcon className="h-4 w-4 mr-2" />
                        {assignment.attachments.length} attachment{assignment.attachments.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setFormMode('edit');
                          setShowForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit assignment"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete assignment"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(assignment.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentManagement;