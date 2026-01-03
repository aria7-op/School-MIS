// Teacher types
export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subjectIds: string[];
  classIds: string[];
  qualification: string;
  experience: number;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
}

export interface TeacherProfile extends Teacher {
  classes: Array<{
    classId: string;
    className: string;
    subjectName: string;
  }>;
  students: number;
}
