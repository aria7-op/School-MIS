import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaClock, FaBook, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { Subject } from '../types/subjects';
import secureApiService from '../../../services/secureApiService';

interface SubjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  onEdit?: () => void;
}

interface Class {
  id: number;
  name: string;
  level: number;
  section?: string;
}

const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  isOpen,
  onClose,
  subject,
  onEdit,
}) => {
  const { t } = useTranslation();

  // Fetch classes to display names
  const { data: classesData } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: async () => {
      const response = await secureApiService.get<Class[]>('/classes', {
        params: { limit: 100 }
      });
      return response.data || [];
    },
    enabled: isOpen && !!subject?.weeklyHoursPerClass,
  });

  if (!isOpen || !subject) return null;

  const getClassName = (classId: string): string => {
    const cls = classesData?.find(c => c.id.toString() === classId);
    return cls ? `${cls.name}${cls.section ? ` (${cls.section})` : ''}` : `Class ${classId}`;
  };

  const weeklyHoursEntries = subject.weeklyHoursPerClass 
    ? Object.entries(subject.weeklyHoursPerClass).filter(([_, hours]) => hours > 0)
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <FaBook className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{subject.name}</h2>
              <p className="text-sm text-gray-600">Subject Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-white rounded-lg"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Subject Code</label>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {subject.code}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Subject Name</label>
                  <p className="text-gray-900 font-medium">{subject.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Type</label>
                  {subject.isElective ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      <FaCheckCircle />
                      Elective
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <FaTimesCircle />
                      Core
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Credit Hours</label>
                  <p className="text-gray-900 font-medium">{subject.creditHours} hours</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {subject.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">{subject.description}</p>
              </div>
            )}

            {/* Weekly Hours Per Class */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FaClock className="text-blue-600" />
                Weekly Hours Per Class
              </h3>
              {weeklyHoursEntries.length > 0 ? (
                <div className="space-y-2">
                  {weeklyHoursEntries.map(([classId, hours]) => (
                    <div 
                      key={classId} 
                      className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {getClassName(classId)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600">{hours}</span>
                        <span className="text-sm text-gray-500">hrs/week</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaClock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500">No weekly hours configured yet</p>
                  <p className="text-sm text-gray-400 mt-1">Edit the subject to set weekly hours per class</p>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-gray-500 font-medium">Subject ID</label>
                  <p className="text-gray-900">{subject.id}</p>
                </div>
                <div>
                  <label className="text-gray-500 font-medium">UUID</label>
                  <p className="text-gray-900 font-mono text-xs">{subject.uuid}</p>
                </div>
                {subject.department && (
                  <div>
                    <label className="text-gray-500 font-medium">Department</label>
                    <p className="text-gray-900">{subject.department.name}</p>
                  </div>
                )}
                <div>
                  <label className="text-gray-500 font-medium">Created At</label>
                  <p className="text-gray-900">{new Date(subject.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-gray-500 font-medium">Last Updated</label>
                  <p className="text-gray-900">{new Date(subject.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Subject
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectDetailModal;


