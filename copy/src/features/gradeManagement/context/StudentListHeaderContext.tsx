import React from 'react';

export type StudentListHeaderFields = {
  principalName: string;
  academicManagerName: string;
  headTeacherName: string;
  supervisorName: string;
  committeeFirst: string;
  committeeSecond: string;
  committeeThird: string;
};

export interface StudentListHeaderData {
  attendanceThreshold: number;
  fields: StudentListHeaderFields;
  updatedAt?: string;
}

export const HEADER_FIELD_DEFAULTS: StudentListHeaderFields = {
  principalName: '',
  academicManagerName: '',
  headTeacherName: '',
  supervisorName: '',
  committeeFirst: '',
  committeeSecond: '',
  committeeThird: '',
};

export const DEFAULT_HEADER_DATA: StudentListHeaderData = {
  attendanceThreshold: 99,
  fields: { ...HEADER_FIELD_DEFAULTS },
};

export interface StudentListHeaderContextValue {
  classId: string;
  examType: 'MIDTERM' | 'FINAL';
  headerData: StudentListHeaderData;
  loading: boolean;
  refresh: () => Promise<void>;
  setLocalHeaderData: (updater: (prev: StudentListHeaderData) => StudentListHeaderData) => void;
}

const StudentListHeaderContext = React.createContext<StudentListHeaderContextValue | undefined>(undefined);

export const useStudentListHeader = (): StudentListHeaderContextValue => {
  const context = React.useContext(StudentListHeaderContext);
  if (!context) {
    return {
      classId: '',
      examType: 'MIDTERM',
      headerData: DEFAULT_HEADER_DATA,
      loading: false,
      refresh: async () => {},
      setLocalHeaderData: () => {},
    };
  }
  return context;
};

export const useStudentListHeaderFields = (): StudentListHeaderFields => {
  const { headerData } = useStudentListHeader();
  return headerData?.fields || HEADER_FIELD_DEFAULTS;
};

export const useAttendanceThreshold = (): number => {
  const { headerData } = useStudentListHeader();
  return headerData?.attendanceThreshold ?? 99;
};

export default StudentListHeaderContext;

