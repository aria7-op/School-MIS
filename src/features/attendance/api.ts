import {
  AttendanceRecord,
  User,
  Class,
  users,
  classes,
  attendanceRecords,
} from './models';
import { AttendanceFilter, AttendanceSummary } from './types';

export const fetchUsers = async (filter?: { role?: 'student' | 'teacher' | 'admin', classId?: string }): Promise<User[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return users.filter(user => {
    if (filter?.role && user.role !== filter.role) return false;
    if (filter?.classId && user.class !== filter.classId) return false;
    return true;
  });
};

export const fetchClasses = async (): Promise<Class[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return classes;
};

export const fetchAttendanceRecords = async (filter: AttendanceFilter): Promise<AttendanceRecord[]> => {
  await new Promise(resolve => setTimeout(resolve, 700));
  
  return attendanceRecords.filter(record => {
    if (filter.classId) {
      const user = users.find(u => u.id === record.userId);
      if (user?.class !== filter.classId) return false;
    }
    if (filter.userId && record.userId !== filter.userId) return false;
    if (filter.dateFrom && record.date < filter.dateFrom) return false;
    if (filter.dateTo && record.date > filter.dateTo) return false;
    if (filter.status && record.status !== filter.status) return false;
    return true;
  });
};

export const getAttendanceSummary = async (filter: AttendanceFilter): Promise<AttendanceSummary> => {
  const records = await fetchAttendanceRecords(filter);
  
  const summary: AttendanceSummary = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    excused: records.filter(r => r.status === 'excused').length,
    total: records.length,
  };
  
  return summary;
};

export const markAttendance = async (
  userId: string,
  status: 'present' | 'absent' | 'late' | 'excused',
  recordedBy: string,
  notes?: string
): Promise<AttendanceRecord> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const today = new Date().toISOString().split('T')[0];
  const newRecord: AttendanceRecord = {
    id: `record-${Date.now()}`,
    userId,
    date: today,
    status,
    notes,
    recordedBy,
    recordedAt: new Date(),
  };
  
  // In a real app, this would be added to the database
  attendanceRecords.push(newRecord);
  
  return newRecord;
};
