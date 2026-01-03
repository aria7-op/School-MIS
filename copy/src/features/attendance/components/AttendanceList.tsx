import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  AttendanceRecord, 
  Student, 
  AttendanceStatus,
  AttendanceListProps 
} from '../types/attendance';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle, FaEdit, FaPlus, FaFileAlt } from 'react-icons/fa';
import secureApiService from '../../../services/secureApiService';
import SMSStatusIndicator from '../../../components/attendance/SMSStatusIndicator';

const AttendanceList: React.FC<AttendanceListProps> = ({ 
  records, 
  students, 
  onEdit, 
  onAdd, 
  onLoadMore, 
  hasMore, 
  loading,
  onStatusChange
}) => {
  const { t, i18n } = useTranslation();
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return t('attendance.messages.noData');
    
    // Check if current language is Dari (fa-AF) or Pashto (ps-AF)
    const isDariOrPashto = i18n.language === "fa-AF" || i18n.language === "ps-AF";
    
    // If Dari or Pashto and dariName exists, use it; otherwise use firstName + lastName
    if (isDariOrPashto && student.user?.dariName) {
      return student.user.dariName.trim();
    }
    
    return student.fullName || `${student.firstName} ${student.lastName}`;
  };

  const getStudentRollNo = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.rollNo : t('common.na');
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT': return 'text-green-600 bg-green-100';
      case 'ABSENT': return 'text-red-600 bg-red-100';
      case 'LATE': return 'text-yellow-600 bg-yellow-100';
      case 'EXCUSED': return 'text-blue-600 bg-blue-100';
      case 'HALF_DAY': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT': return <FaCheckCircle className="w-4 h-4" />;
      case 'ABSENT': return <FaTimesCircle className="w-4 h-4" />;
      case 'LATE': return <FaClock className="w-4 h-4" />;
      case 'EXCUSED': return <FaFileAlt className="w-4 h-4" />;
      case 'HALF_DAY': return <FaClock className="w-4 h-4" />;
      default: return <FaClock className="w-4 h-4" />;
    }
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '--';
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="divide-y divide-gray-200">
        {records.map((record) => (
          <div key={record.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {getStudentName(record.studentId)}
                      </h4>
                      <span className="text-xs text-gray-500">
                        #{getStudentRollNo(record.studentId)}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatDate(record.date)}</span>
                      <span>•</span>
                      <span>In: {formatTime(record.inTime)}</span>
                      {record.outTime && (
                        <>
                          <span>•</span>
                          <span>Out: {formatTime(record.outTime)}</span>
                        </>
                      )}
                    </div>
                    
                    {/* SMS Status Indicators */}
                    {record.id && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {record.inTime && (
                          <SMSStatusIndicator
                            attendanceId={Number(record.id)}
                            smsType="in"
                            status={(record as any).smsInStatus || 'PENDING'}
                            error={(record as any).smsInError}
                            sentAt={(record as any).smsInSentAt}
                            attempts={(record as any).smsInAttempts || 0}
                            onResendSuccess={() => {
                              // Trigger refresh
                              window.location.reload();
                            }}
                          />
                        )}
                        {record.outTime && (
                          <SMSStatusIndicator
                            attendanceId={Number(record.id)}
                            smsType="out"
                            status={(record as any).smsOutStatus || 'PENDING'}
                            error={(record as any).smsOutError}
                            sentAt={(record as any).smsOutSentAt}
                            attempts={(record as any).smsOutAttempts || 0}
                            onResendSuccess={() => {
                              // Trigger refresh
                              window.location.reload();
                            }}
                          />
                        )}
                      </div>
                    )}
                    
                    {record.remarks && (
                      <p className="mt-1 text-sm text-gray-600 italic">
                        "{record.remarks}"
                      </p>
                    )}
                    
                    {/* Show leave document button if available */}
                    {record.status === 'EXCUSED' && (record as any).leaveDocumentPath && (
                      <button
                        onClick={async () => {
                          try {
                            const response = await secureApiService.api.get(
                              `/attendances/${record.id}/leave-document`,
                              { responseType: 'blob' }
                            );
                            
                            const blobUrl = URL.createObjectURL(response.data);
                            window.open(blobUrl, '_blank');
                            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                          } catch (error) {
                            console.error('Error opening document:', error);
                            alert('Failed to open document');
                          }
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <FaFileAlt className="w-3 h-3" />
                        View Leave Document
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
                
                {onEdit && (
                  <button
                    onClick={() => onEdit(record.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit attendance"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;
