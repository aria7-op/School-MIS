import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FaSchool, FaUsers, FaChalkboardTeacher, FaBook, FaTimes, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import superadminService from '../../services/superadminService';

interface SchoolsDetailViewProps {
  dateRange: { startDate: string; endDate: string };
  selectedSchoolId?: string | null;
  selectedBranchId?: string | null;
  selectedCourseId?: string | null;
  onClose: () => void;
}

const SchoolsDetailView: React.FC<SchoolsDetailViewProps> = ({ dateRange, selectedSchoolId, selectedBranchId, selectedCourseId, onClose }) => {
  const { t } = useTranslation();

  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ['schools-detail', dateRange, selectedSchoolId, selectedBranchId, selectedCourseId],
    queryFn: () => superadminService.getSchoolsOverview({
      ...dateRange,
      schoolId: selectedSchoolId || undefined,
      branchId: selectedBranchId || undefined,
      courseId: selectedCourseId || undefined,
    })
  });

  const schools = schoolsData?.data?.schools || schoolsData?.schools || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-blue-600  text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaSchool className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">{t('superadmin.details.allSchools', 'All Schools')}</h2>
              <p className="text-blue-100 mt-1">{t('superadmin.details.comprehensiveSchoolData', 'Comprehensive school data and statistics')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : schools.length === 0 ? (
            <div className="text-center py-12">
              <FaSchool className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('superadmin.details.noSchools', 'No schools found')}</p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-medium text-blue-600">{t('superadmin.details.totalSchools', 'Total Schools')}</p>
                  <p className="text-3xl font-bold text-blue-700 mt-2">{schools.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-600">{t('superadmin.details.totalStudents', 'Total Students')}</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {schools.reduce((sum: number, s: any) => sum + (s.students || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm font-medium text-purple-600">{t('superadmin.details.totalTeachers', 'Total Teachers')}</p>
                  <p className="text-3xl font-bold text-purple-700 mt-2">
                    {schools.reduce((sum: number, s: any) => sum + (s.teachers || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm font-medium text-orange-600">{t('superadmin.details.totalClasses', 'Total Classes')}</p>
                  <p className="text-3xl font-bold text-orange-700 mt-2">
                    {schools.reduce((sum: number, s: any) => sum + (s.classes || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Schools Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {schools.map((school: any) => (
                  <div key={school.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FaSchool className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{school.name}</h3>
                            <p className="text-sm text-gray-600">{t('superadmin.details.code', 'Code')}: {school.code}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          {t('superadmin.details.active', 'Active')}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Statistics */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <FaUsers className="w-5 h-5 text-green-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-gray-900">{school.students || 0}</p>
                          <p className="text-xs text-gray-600">{t('superadmin.details.students', 'Students')}</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <FaChalkboardTeacher className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-gray-900">{school.teachers || 0}</p>
                          <p className="text-xs text-gray-600">{t('superadmin.details.teachers', 'Teachers')}</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <FaBook className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-gray-900">{school.classes || 0}</p>
                          <p className="text-xs text-gray-600">{t('superadmin.details.classes', 'Classes')}</p>
                        </div>
                      </div>

                      {/* Contact Information */}
                      {(school.address || school.phone || school.email) && (
                        <div className="space-y-2 pt-3 border-t border-gray-100">
                          {school.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                              <span>{school.address}</span>
                            </div>
                          )}
                          {school.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaPhone className="w-4 h-4 text-gray-400" />
                              <span>{school.phone}</span>
                            </div>
                          )}
                          {school.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaEnvelope className="w-4 h-4 text-gray-400" />
                              <span>{school.email}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Staff Info */}
                      {school.staff !== undefined && school.staff > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{t('superadmin.details.staffMembers', 'Staff Members')}</span>
                            <span className="text-sm font-semibold text-gray-900">{school.staff}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolsDetailView;



