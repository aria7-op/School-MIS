// Attendance types
export interface Attendance {
  id: string;
  studentId: string;
  academicSessionId?: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  academicSessionId?: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
