import React from 'react';
import { useQuery } from '@tantml:react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface Enrollment {
  id: string;
  rollNo?: string;
  enrollmentDate: string;
  status: string;
  remarks?: string;
  class: {
    id: string;
    name: string;
    level: number;
  };
  section?: {
    id: string;
    name: string;
  };
  academicSession: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  };
}

interface EnrollmentHistoryProps {
  studentId: string;
}

const statusColors = {
  ENROLLED: 'bg-green-100 text-green-800',
  PROMOTED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  WITHDRAWN: 'bg-red-100 text-red-800',
  REPEATED: 'bg-yellow-100 text-yellow-800',
  TRANSFERRED: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  ENROLLED: 'Enrolled',
  PROMOTED: 'Promoted',
  COMPLETED: 'Completed',
  WITHDRAWN: 'Withdrawn',
  REPEATED: 'Repeated',
  TRANSFERRED: 'Transferred',
};

const EnrollmentHistory: React.FC<EnrollmentHistoryProps> = ({ studentId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['enrollment-history', studentId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/enrollments/student/${studentId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data.data;
    },
  });

  const enrollments: Enrollment[] = data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <span className="ms-3 text-gray-600">Loading enrollment history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Failed to load enrollment history</p>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollment history</h3>
        <p className="mt-1 text-sm text-gray-500">
          This student has no recorded enrollment history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Enrollment History</h3>
        <p className="text-sm text-gray-600">
          Complete academic record across all years
        </p>
      </div>

      <div className="space-y-4">
        {enrollments.map((enrollment, index) => (
          <div
            key={enrollment.id}
            className={`border rounded-lg overflow-hidden transition-shadow hover:shadow-md ${
              enrollment.academicSession.isCurrent
                ? 'border-blue-500 shadow-sm'
                : 'border-gray-200'
            }`}
          >
            {/* Header */}
            <div
              className={`px-4 py-3 ${
                enrollment.academicSession.isCurrent
                  ? 'bg-blue-50 border-b border-blue-200'
                  : 'bg-gray-50 border-b border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {enrollment.academicSession.name}
                    {enrollment.academicSession.isCurrent && (
                      <span className="ms-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                        Current
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {new Date(enrollment.academicSession.startDate).toLocaleDateString()} -{' '}
                    {new Date(enrollment.academicSession.endDate).toLocaleDateString()}
                  </p>
                </div>
                
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[enrollment.status as keyof typeof statusColors] ||
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {statusLabels[enrollment.status as keyof typeof statusLabels] || enrollment.status}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="px-4 py-3 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Class</p>
                  <p className="text-sm font-medium text-gray-900">
                    {enrollment.class.name}
                  </p>
                  <p className="text-xs text-gray-600">Level {enrollment.class.level}</p>
                </div>

                {enrollment.section && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Section</p>
                    <p className="text-sm font-medium text-gray-900">
                      {enrollment.section.name}
                    </p>
                  </div>
                )}

                {enrollment.rollNo && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Roll Number</p>
                    <p className="text-sm font-medium text-gray-900">{enrollment.rollNo}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-1">Enrollment Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {enrollment.remarks && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Remarks</p>
                  <p className="text-sm text-gray-700">{enrollment.remarks}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Academic Years:</span>
          <span className="font-semibold text-gray-900">{enrollments.length}</span>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentHistory;










