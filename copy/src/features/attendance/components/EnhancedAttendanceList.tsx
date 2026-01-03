import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUser, FaCheckCircle, FaTimesCircle, FaClock, FaInfoCircle, FaSignInAlt, FaSignOutAlt, FaChevronDown, FaChevronUp, FaRedo } from 'react-icons/fa';

interface Student {
  id: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  classId: string;
  className: string;
  schoolId: string;
  status: 'active' | 'inactive' | 'graduated';
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  academicSessionId?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY';
  inTime?: string;
  outTime?: string;
  remarks?: string;
}

interface ClassAttendanceSummary {
  classId: string;
  className: string;
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  halfDay: number;
  attendanceRate: number;
  students: Array<{
    studentId: string;
    studentName: string;
    studentRollNo: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY';
    inTime?: string;
    outTime?: string;
    remarks?: string;
  }>;
}

interface EnhancedAttendanceListProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  attendanceSummary?: ClassAttendanceSummary;
  onMarkInTime: (studentId: string) => void;
  onMarkOutTime: (studentId: string) => void;
  onEditRecord: (recordId: string) => void;
  onRefresh?: () => void;
  selectedClassName?: string;
  isMarkingIn?: boolean;
  isMarkingOut?: boolean;
  loading?: boolean;
}

const EnhancedAttendanceList: React.FC<EnhancedAttendanceListProps> = ({
  students,
  attendanceRecords,
  attendanceSummary,
  onMarkInTime,
  onMarkOutTime,
  onEditRecord,
  onRefresh,
  selectedClassName,
  isMarkingIn = false,
  isMarkingOut = false,
  loading = false,
}) => {
  const { t, i18n } = useTranslation();
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Helper function to get student name based on selected language
  const getStudentName = (student: any): string => {
    // Check if current language is Dari (fa-AF) or Pashto (ps-AF)
    const isDariOrPashto = i18n.language === "fa-AF" || i18n.language === "ps-AF";
    
    // If Dari or Pashto and dariName exists, use it
    if (isDariOrPashto && student.user?.dariName) {
      return student.user.dariName.trim();
    }
    
    // For English, use fullName, user's firstName/lastName, or student's firstName/lastName
    const englishName = student.fullName || 
      `${student.user?.firstName || student.firstName || ""} ${student.user?.lastName || student.lastName || ""}`.trim();
    
    if (englishName) {
      return englishName;
    }
    
    // Final fallback to attendanceSummary studentName or Unknown
    return "Unknown Student";
  };

  const getAttendanceRecord = (studentId: string) => {
    // First try to get from attendance summary (current day data)
    if (attendanceSummary?.students) {
      const summaryRecord = attendanceSummary.students.find(record => record.studentId === studentId);
      if (summaryRecord) {
        const student = students.find(s => s.id === studentId);
        return {
          id: `${studentId}-${new Date().toISOString().split('T')[0]}`,
          studentId: studentId,
          studentName: student ? getStudentName(student) : 'Unknown',
          studentRollNo: student?.rollNo || 'N/A',
          date: new Date().toISOString().split('T')[0],
          status: summaryRecord.status as any,
          inTime: summaryRecord.inTime,
          outTime: summaryRecord.outTime,
          remarks: summaryRecord.remarks
        };
      }
    }
    
    // Fallback to attendance records
    return attendanceRecords.find(record => record.studentId === studentId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'text-green-600 bg-green-100';
      case 'ABSENT':
        return 'text-red-600 bg-red-100';
      case 'LATE':
        return 'text-orange-600 bg-orange-100';
      case 'EXCUSED':
        return 'text-purple-600 bg-purple-100';
      case 'HALF_DAY':
        return 'text-pink-600 bg-pink-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return FaCheckCircle;
      case 'ABSENT':
        return FaTimesCircle;
      case 'LATE':
        return FaClock;
      case 'EXCUSED':
        return FaInfoCircle;
      case 'HALF_DAY':
        return FaClock;
      default:
        return FaClock;
    }
  };

  const calculateTotalHours = (inTime: string, outTime: string) => {
    if (!inTime || !outTime) return 0;
    const start = new Date(inTime);
    const end = new Date(outTime);
    const diffMs = end.getTime() - start.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const toggleExpanded = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const handleMarkInTime = (studentId: string) => {
    if (window.confirm(t('attendance.list.confirm.markPresent'))) {
      onMarkInTime(studentId);
    }
  };

  const handleMarkOutTime = (studentId: string) => {
    if (window.confirm(t('attendance.list.confirm.markDeparted'))) {
      onMarkOutTime(studentId);
    }
  };

  // Debug logging
  console.log('🔍 EnhancedAttendanceList Debug:', {
    students: students,
    studentsLength: students.length,
    attendanceRecords: attendanceRecords,
    recordsLength: attendanceRecords.length,
    attendanceSummary: attendanceSummary,
    firstStudent: students[0],
    firstRecord: attendanceRecords[0],
    summaryStudents: attendanceSummary?.students
  });

  // Calculate summary statistics
  const presentCount = attendanceSummary?.present || attendanceRecords.filter(r => r.status === 'PRESENT').length;
  const absentCount = attendanceSummary?.absent || attendanceRecords.filter(r => r.status === 'ABSENT').length;
  const lateCount = attendanceSummary?.late || attendanceRecords.filter(r => r.status === 'LATE').length;
  const excusedCount = attendanceSummary?.excused || attendanceRecords.filter(r => r.status === 'EXCUSED').length;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('attendance.list.loading')}</p>
        </div>
      </div>
    );
  }

  // Show error state if no students
  if (!students || students.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('attendance.list.noStudents')}</h3>
          <p className="text-gray-500">{t('attendance.list.noStudentsDescription')}</p>
          <div className="mt-4 text-sm text-gray-400">
            Debug: Students array length: {students?.length || 0}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('attendance.list.title')}</h3>
            <p className="text-gray-600 text-xs sm:text-[15px] ">
              {students.length} {t('attendance.list.subtitle')}
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaRedo className="w-4 h-4 " />
              <span className="text-sm font-medium hidden sm:inline-block">{t('attendance.list.refresh')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{presentCount}</div>
            <div className="text-sm font-medium text-gray-600">{t('attendance.list.summary.present')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">{absentCount}</div>
            <div className="text-sm font-medium text-gray-600">{t('attendance.list.summary.absent')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{lateCount}</div>
            <div className="text-sm font-medium text-gray-600">{t('attendance.list.summary.late')}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{attendanceRate}%</div>
            <div className="text-sm font-medium text-gray-600">{t('attendance.list.summary.rate')}</div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-4">
        {students.map((student) => {
          const attendanceRecord = getAttendanceRecord(student.id);
          const isExpanded = expandedStudent === student.id;
          const totalHours = attendanceRecord ? 
            calculateTotalHours(attendanceRecord.inTime || '', attendanceRecord.outTime || '') : 0;
          const canMarkIn = !(attendanceRecord && attendanceRecord.inTime);
          const canMarkOut = !!(attendanceRecord && attendanceRecord.inTime) && !(attendanceRecord && attendanceRecord.outTime);
          const StatusIcon = attendanceRecord ? getStatusIcon(attendanceRecord.status) : FaClock;

          return (
            <div key={student.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Student Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(student.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {student.avatar ? (
                        <img 
                          src={student.avatar} 
                          alt={student.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <FaUser className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Student Info */}
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {getStudentName(student)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t('attendance.list.student.roll')}: {student.rollNo || (attendanceSummary?.students?.find(s => s.studentId === student.id)?.studentRollNo ?? t('common.na'))} • {t('attendance.list.student.class')}: {student.className || selectedClassName || attendanceSummary?.className || t('common.na')}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      {attendanceRecord ? (
                        <>
                          <StatusIcon className={`w-6 h-6 ${getStatusColor(attendanceRecord.status).split(' ')[0]}`} />
                          <p className={`text-xs font-medium mt-1 ${getStatusColor(attendanceRecord.status)}`}>
                            {attendanceRecord.status}
                          </p>
                        </>
                      ) : (
                        <>
                          <FaClock className="w-6 h-6 text-gray-400" />
                          <p className="text-xs font-medium text-gray-400 mt-1">{t('attendance.list.student.notMarked')}</p>
                        </>
                      )}
                    </div>
                    
                    {/* Expand Icon */}
                    {isExpanded ? (
                      <FaChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <FaChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {/* Time Information */}
                  <div className="p-6">
                    <h5 className="text-sm font-semibold text-gray-900 mb-4">{t('attendance.list.timeDetails')}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <FaSignInAlt className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600">{t('attendance.list.inTime')}</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {attendanceRecord?.inTime ? formatTime(attendanceRecord.inTime) : '--'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <FaSignOutAlt className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600">{t('attendance.list.outTime')}</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {attendanceRecord?.outTime ? formatTime(attendanceRecord.outTime) : '--'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <FaClock className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-medium text-gray-600">{t('attendance.list.totalHours')}</p>
                          <p className="text-sm font-semibold text-gray-900">{totalHours}h</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-6 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-900 mb-4">{t('moduleInfo.quickActions')}</h5>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleMarkInTime(student.id)}
                        disabled={!canMarkIn || isMarkingIn}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaSignInAlt className="w-4 h-4" />
                        <span className="text-sm font-medium">{t('teacherPortal.attendance.table.actions.markIn')}</span>
                      </button>
                      
                      <button
                        onClick={() => handleMarkOutTime(student.id)}
                        disabled={!canMarkOut || isMarkingOut}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaSignOutAlt className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {t('teacherPortal.attendance.table.actions.markOut')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Remarks */}
                  {attendanceRecord?.remarks && (
                    <div className="p-6 border-t border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">{t('attendance.list.remarks')}</h5>
                      <p className="text-sm text-gray-700 italic">{attendanceRecord.remarks}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {students.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('attendance.list.noStudents')}</h3>
          <p className="text-gray-500">{t('attendance.list.noStudentsDescription')}</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedAttendanceList;