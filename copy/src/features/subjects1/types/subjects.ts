export interface Subject {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description?: string;
  creditHours: number;
  isElective: boolean;
  departmentId?: number;
  schoolId: number;
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  department?: {
    id: number;
    name: string;
  };
}

export interface SubjectFormData {
  name: string;
  code: string;
  description?: string;
  creditHours: number;
  isElective: boolean;
  departmentId?: number;
}

