export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceFilter {
  classId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: AttendanceStatus;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}
