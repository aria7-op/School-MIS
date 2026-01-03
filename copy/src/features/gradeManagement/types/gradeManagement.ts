// Grade Management Types - Matching Excel Structure

export interface SubjectMark {
  marks: number | null;
  isAbsent: boolean;
  grade: string | null;
  remarks: string | null;
}

export interface StudentGradeRow {
  rowNumber: number; // Excel ROW() formula
  studentId: string;
  admissionNo: string;
  rollNo: string | null;
  cardNo: string | null;
  name: string;
  fatherName: string;
  subjectMarks: Record<string, SubjectMark>; // keyed by subjectId
  totalMarks: number; // Excel SUM formula
  averageMarks: number; // Excel AVERAGE formula
  subjectsAttempted: number; // Excel COUNT formula
  failedSubjects: number; // Excel COUNTIF formula
  status: StudentStatus; // Excel IF formulas
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  creditHours: number;
}

export interface ClassInfo {
  className: string;
  classCode: string;
  level: number;
  section: string | null;
  capacity: number;
  shift: string | null;
}

export interface ExamInfo {
  examId: string;
  examName: string;
  examType: ExamType;
  examCode: string;
  startDate: Date;
  endDate: Date;
  totalMarks: number;
  passingMarks: number;
}

export interface GradeSheet {
  classInfo: ClassInfo;
  examInfo: ExamInfo;
  subjects: Subject[];
  students: StudentGradeRow[];
  classStatistics: ClassStatistics;
}

export interface ClassStatistics {
  totalStudents: number;
  classAverageMarks: number; // Excel AVERAGE formula
  classTotalAverage: number; // Excel AVERAGE formula
  highestTotal: number; // Excel MAX formula
  lowestTotal: number; // Excel MIN formula
  successfulCount: number; // Excel COUNTIF formula
  conditionalCount: number; // Excel COUNTIF formula
  failedCount: number; // Excel COUNTIF formula
  successPercentage: string;
  conditionalPercentage: string;
  failPercentage: string;
}

export type StudentStatus = 
  | 'ارتقا صنف'   // Promoted to next grade
  | 'موفق'        // Successful
  | 'مشروط'       // Conditional
  | 'تلاش بیشتر'  // Needs more effort
  | 'تکرار صنف'   // Repeat grade
  | 'محروم'       // Absent/Deprived
  | 'معذرتی'      // Excused
  | 'غایب'        // Absent
  | 'سه پارچه';   // Special case

export type ExamType = 
  | 'MIDTERM'     // Mid-term exam (4.5 months)
  | 'FINAL'       // Final/Annual exam
  | 'QUARTERLY'   // Quarterly
  | 'WEEKLY';     // Weekly test

export interface GradeEntry {
  studentId: string;
  subjectId: string;
  marks: number;
  isAbsent: boolean;
  remarks?: string;
}

export interface BulkGradeEntryRequest {
  grades: GradeEntry[];
}

export interface BulkGradeEntryResponse {
  gradesEntered: number;
  grades: any[];
}

export interface ReportCard {
  student: StudentInfo;
  reportCard: ExamResult[];
}

export interface StudentInfo {
  id: string;
  name: string;
  fatherName: string;
  admissionNo: string;
  rollNo: string;
  class: string;
  section: string | null;
}

export interface ExamResult {
  examId: string;
  examName: string;
  examType: ExamType;
  examDate: Date;
  subjects: SubjectResult[];
  totalMarks: number; // Excel SUM formula
  averageMarks: number; // Excel AVERAGE formula
  subjectsAttempted: number; // Excel COUNT formula
  failedSubjects: number; // Excel COUNTIF formula
  status: StudentStatus;
  message: string; // Excel IF formula-generated message
}

export interface SubjectResult {
  subject: Subject;
  marks: number;
  grade: string;
  isAbsent: boolean;
  remarks: string | null;
}

export interface ResultsSummary {
  summary: {
    totalStudents: number;
    successful: number;
    conditional: number;
    failed: number;
  };
  lists: {
    successful: StudentSummary[]; // Excel "کامیاب" sheet
    conditional: StudentSummary[]; // Excel "مشروط" sheet
    failed: StudentSummary[]; // Excel "ناکام و محروم" sheet
  };
}

export interface StudentSummary {
  studentId: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  fatherName: string;
  status: StudentStatus;
  totalMarks: number | null;
  averageMarks: number | null;
  remarks: string | null;
}

export interface SubjectStatistics {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  averageMarks: number; // Excel AVERAGE formula
  highestMarks: number; // Excel MAX formula
  lowestMarks: number; // Excel MIN formula
  totalStudents: number; // Excel COUNT formula
  passedCount: number; // Excel COUNTIF formula
  failedCount: number; // Excel COUNTIF formula
  passPercentage: string;
}

export interface TeacherClass {
  id: string;
  name: string;
  code: string;
  level: number;
  section: string | null;
  studentCount: number;
  subjects: TeacherSubject[];
}

export interface TeacherSubject {
  id: string;
  name: string;
  code: string;
}

export interface FinalResultCalculation {
  studentId: string;
  admissionNo: string;
  rollNo: string;
  subjectResults: Record<string, CombinedSubjectResult>;
  overallTotal: number; // Excel SUM formula
  overallAverage: number; // Excel AVERAGE formula
}

export interface CombinedSubjectResult {
  subjectId: string;
  subjectName: string;
  midtermMarks: number;
  annualMarks: number;
  totalMarks: number; // Excel SUM formula: midterm + annual
}

// Filter and sort options
export interface GradeFilters {
  classId?: string;
  examId?: string;
  studentId?: string;
  subjectId?: string;
  status?: StudentStatus;
  minMarks?: number;
  maxMarks?: number;
}

export interface GradeSortOptions {
  field: 'rollNo' | 'name' | 'totalMarks' | 'averageMarks' | 'status';
  order: 'asc' | 'desc';
}

// Excel export/import types
export interface ExcelExportOptions {
  classId: string;
  examId: string;
  includeFormulas: boolean;
  includeStatistics: boolean;
  format: 'xlsx' | 'csv';
}

export interface ExcelImportData {
  classId: string;
  examId: string;
  grades: GradeEntry[];
}






