import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import AcademicYearSelector from '../../../components/AcademicYearSelector';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface Stats {
  total: number;
  byStatus?: Record<string, number>;
  byClass?: Array<{
    class: { id: string; name: string; level: number };
    count: number;
  }>;
}

const HistoricalDataViewer: React.FC = () => {
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [activeTab, setActiveTab] = useState<'enrollments' | 'stats'>('stats');

  // Fetch enrollment stats for selected session
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['academic-year-stats', selectedSessionId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/enrollments/stats/${selectedSessionId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data.data;
    },
    enabled: !!selectedSessionId && activeTab === 'stats',
  });

  // Fetch enrollments for selected session
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['session-enrollments', selectedSessionId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/enrollments/session/${selectedSessionId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      return response.data.data;
    },
    enabled: !!selectedSessionId && activeTab === 'enrollments',
  });

  const stats: Stats = statsData || { total: 0 };
  const enrollments = enrollmentsData || [];

  return (
    <div className="p-6 bg-white rounded-lg shadow" dir="auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Historical Data Viewer
        </h2>
        <p className="text-gray-600">
          View student enrollment data from any academic year
        </p>
      </div>

      {/* Academic Year Selector */}
      <div className="mb-6">
        <AcademicYearSelector
          value={selectedSessionId}
          onChange={setSelectedSessionId}
          label="Select Academic Year to View"
        />
      </div>

      {selectedSessionId ? (
        <>
          {/* Context Indicator */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-900">
                Viewing data as of selected academic year
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('stats')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveTab('enrollments')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'enrollments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Enrollments
              </button>
            </nav>
          </div>

          {/* Content */}
          {activeTab === 'stats' && (
            <div>
              {statsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading statistics...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 mb-1">Total Enrollments</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 mb-1">Enrolled</p>
                      <p className="text-2xl font-bold text-green-900">
                        {stats.byStatus?.enrolled || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-600 mb-1">Promoted</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {stats.byStatus?.promoted || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.byStatus?.completed || 0}
                      </p>
                    </div>
                  </div>

                  {/* By Class */}
                  {stats.byClass && stats.byClass.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Enrollments by Class
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.byClass.map((item) => (
                          <div
                            key={item.class.id}
                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                          >
                            <p className="font-medium text-gray-900">{item.class.name}</p>
                            <p className="text-xs text-gray-600 mb-2">
                              Level {item.class.level}
                            </p>
                            <p className="text-xl font-bold text-blue-600">{item.count}</p>
                            <p className="text-xs text-gray-500">students</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'enrollments' && (
            <div>
              {enrollmentsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-gray-600">Loading enrollments...</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-600">No enrollments found for this academic year</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Section
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Roll No
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrollments.map((enrollment: any) => (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {enrollment.student.user.firstName}{' '}
                                {enrollment.student.user.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {enrollment.student.admissionNo}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {enrollment.class.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {enrollment.section?.name || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {enrollment.rollNo || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              {enrollment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Select an Academic Year
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose an academic year from the dropdown above to view historical data
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoricalDataViewer;










