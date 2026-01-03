// Student types
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  grade: string;
  classId: string;
  parentId?: string;
  address?: string;
  emergencyContact?: string;
  medicalInfo?: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
}

export interface StudentProfile extends Student {
  attendance: {
    present: number;
    absent: number;
    late: number;
  };
  grades: {
    average: number;
    subjects: Array<{
      subjectId: string;
      subjectName: string;
      grade: number;
    }>;
  };
}
