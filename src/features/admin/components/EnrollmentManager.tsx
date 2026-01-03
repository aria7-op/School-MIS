import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface Student {
  id: string;
  admissionNo: string;
  user: {
    firstName: string;
    lastName: string;
  };
  class: {
    id: string;
    name: string;
    level: number;
  };
  section?: {
    id: string;
    name: string;
  };
}

interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface Class {
  id: string;
  name: string;
  level: number;
  capacity: number;
}

const EnrollmentManager: React.FC = () => {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [targetClassId, setTargetClassId] = useState('');
  const [targetSessionId, setTargetSessionId] = useState('');
  const [view, setView] = useState<'pending' | 'enrolled'>('pending');
  
  const queryClient = useQueryClient();

  // Fetch academic sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/enrollments/academic-year/sessions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data.data;
    },
  });

  const sessions: AcademicSession[] = sessionsData || [];
  const currentSession = sessions.find(s => s.isCurrent);

  // Fetch students needing promotion
  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['pending-promotions'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/enrollments/pending-promotions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data.data;
    },
    enabled: view === 'pending',
  });

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data.data;
    },
  });

  const classes: Class[] = classesData || [];

  // Bulk promotion mutation
  const promoteMutation = useMutation({
    mutationFn: async (data: {
      studentIds: string[];
      targetClassId: string;
      academicSessionId: string;
    }) => {
      const response = await axios.post(
        `${API_URL}/enrollments/bulk-promote`,
        data,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-promotions'] });
      setSelectedStudents(new Set());
      alert('Students promoted successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to promote students: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (!pendingData?.students) return;
    
    if (selectedStudents.size === pendingData.students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(pendingData.students.map((s: Student) => s.id)));
    }
  };

  const handleBulkPromotion = () => {
    if (selectedStudents.size === 0) {
      alert('Please select students to promote');
      return;
    }

    if (!targetClassId) {
      alert('Please select a target class');
      return;
    }

    if (!targetSessionId) {
      alert('Please select an academic session');
      return;
    }

    if (confirm(`Promote ${selectedStudents.size} students to the selected class?`)) {
      promoteMutation.mutate({
        studentIds: Array.from(selectedStudents),
        targetClassId,
        academicSessionId: targetSessionId,
      });
    }
  };

  // Group students by current class
  const groupedStudents = pendingData?.groupedByClass || [];

  return (
    <div className="p-6 bg-white rounded-lg shadow" dir="auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Student Enrollment Management
        </h2>
        <p className="text-gray-600">
          Manage student enrollments and promotions for academic years
        </p>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setView('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            view === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending Promotions
          {pendingData?.total > 0 && (
            <span className="ms-2 bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs">
              {pendingData.total}
            </span>
          )}
        </button>
      </div>

      {view === 'pending' && (
        <>
          {/* Promotion Controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Bulk Promotion</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Academic Session Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Academic Year
                </label>
                <select
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Academic Year</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name} {session.isCurrent && '(Current)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Class Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Class
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (Level {cls.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Button */}
              <div className="flex items-end">
                <button
                  onClick={handleBulkPromotion}
                  disabled={selectedStudents.size === 0 || promoteMutation.isPending}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  {promoteMutation.isPending
                    ? 'Promoting...'
                    : `Promote ${selectedStudents.size} Student${selectedStudents.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Selected: {selectedStudents.size} / {pendingData?.total || 0} students
            </div>
          </div>

          {/* Students List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : pendingData?.total === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No students need promotion
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                All students are enrolled in the current academic session.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Select All */}
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedStudents.size === pendingData?.total}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-900">
                  Select All Students
                </label>
              </div>

              {/* Grouped by Class */}
              {groupedStudents.map((group: any) => (
                <div key={group.class.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">
                      {group.class.name}
                      <span className="ms-2 text-sm font-normal text-gray-600">
                        ({group.students.length} students)
                      </span>
                    </h4>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {group.students.map((student: Student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {student.user.firstName} {student.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Admission No: {student.admissionNo}
                            {student.section && ` • Section: ${student.section.name}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnrollmentManager;










