// Grade types
export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  grade: number;
  maxGrade: number;
  type: 'assignment' | 'exam' | 'quiz' | 'project';
  date: string;
  notes?: string;
}

export interface GradeCategory {
  id: string;
  name: string;
  weight: number;
  color: string;
}
