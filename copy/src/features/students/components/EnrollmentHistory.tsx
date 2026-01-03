import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import secureApiService from '../../../services/secureApiService';
import { FaGraduationCap, FaCalendarAlt, FaCheckCircle, FaArrowRight, FaClock } from 'react-icons/fa';

interface EnrollmentHistoryProps {
  studentId: string | number;
}

interface EnrollmentRecord {
  id: string | number;
  academicSession?: {
    id: string | number;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  };
  class?: {
    id: string | number;
    name: string;
    code?: string;
  };
  section?: {
    id: string | number;
    name: string;
  };
  rollNo?: string;
  status: string;
  enrollmentDate: string;
}

const EnrollmentHistory: React.FC<EnrollmentHistoryProps> = ({ studentId }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    
    setLoading(true);
    setError(null);
    
    secureApiService.get<{ data: EnrollmentRecord[] }>(`/enrollments/student/${studentId}`)
      .then(res => {
        const enrollments = (res.data as any)?.data || (res.data as any) || [];
        // Sort by enrollment date (newest first)
        const sorted = enrollments.sort((a: EnrollmentRecord, b: EnrollmentRecord) => {
          const dateA = new Date(a.enrollmentDate || a.academicSession?.startDate || 0);
          const dateB = new Date(b.enrollmentDate || b.academicSession?.startDate || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setData(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching enrollment history:', err);
        setError(t('enrollmentHistory.error'));
        setLoading(false);
      });
      }, [studentId, t]);

  if (!studentId) return null;

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'ENROLLED': 'bg-blue-100 text-blue-800',
      'PROMOTED': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-purple-100 text-purple-800',
      'WITHDRAWN': 'bg-red-100 text-red-800',
      'REPEATED': 'bg-yellow-100 text-yellow-800',
      'TRANSFERRED': 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    const statusLabel = t(`enrollmentHistory.statuses.${status}`, status);
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
        {statusLabel}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="mt-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <FaGraduationCap className="w-5 h-5 mr-2 text-blue-600" />
          {t('enrollmentHistory.title')}
        </h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('enrollmentHistory.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-lg font-bold mb-2 text-red-800">{t('enrollmentHistory.title')}</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mt-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <FaGraduationCap className="w-5 h-5 mr-2 text-blue-600" />
          {t('enrollmentHistory.title')}
        </h3>
        <p className="text-gray-600 text-center py-4">{t('enrollmentHistory.noRecords')}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <FaGraduationCap className="w-5 h-5 mr-2 text-blue-600" />
        {t('enrollmentHistory.title')}
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <FaCalendarAlt className="inline mr-1" />
                {t('enrollmentHistory.academicYear')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('enrollmentHistory.class')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('enrollmentHistory.section')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('enrollmentHistory.rollNo')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('enrollmentHistory.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('enrollmentHistory.enrollmentDate')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr 
                key={row.id} 
                className={`hover:bg-gray-50 ${row.academicSession?.isCurrent ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {index > 0 && <FaArrowRight className="w-3 h-3 mr-2 text-gray-400" />}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                           {row.academicSession?.name || t('enrollmentHistory.na')}
                         </div>
                         {row.academicSession?.isCurrent && (
                           <span className="text-xs text-blue-600 flex items-center mt-1">
                             <FaCheckCircle className="w-3 h-3 mr-1" />
                             {t('enrollmentHistory.currentYear')}
                           </span>
                         )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                   <div className="text-sm text-gray-900">
                     {row.class?.name || t('enrollmentHistory.na')}
                     {row.class?.code && (
                       <span className="text-xs text-gray-500 ml-1">({row.class.code})</span>
                     )}
                   </div>
                 </td>
                 <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                   {row.section?.name || t('enrollmentHistory.na')}
                 </td>
                 <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                   {row.rollNo || t('enrollmentHistory.na')}
                 </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(row.status)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <FaClock className="w-3 h-3 mr-1" />
                    {formatDate(row.enrollmentDate)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">{t('enrollmentHistory.totalYears')}:</span>
            <span className="ml-2 font-semibold text-gray-900">{data.length}</span>
          </div>
          <div>
            <span className="text-gray-600">{t('enrollmentHistory.currentClass')}:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {data.find(r => r.academicSession?.isCurrent)?.class?.name || t('enrollmentHistory.na')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">{t('enrollmentHistory.promoted')}:</span>
            <span className="ml-2 font-semibold text-green-600">
              {data.filter(r => r.status === 'PROMOTED').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">{t('enrollmentHistory.completed')}:</span>
            <span className="ml-2 font-semibold text-purple-600">
              {data.filter(r => r.status === 'COMPLETED').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentHistory;





