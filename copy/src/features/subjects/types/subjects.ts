export interface Subject {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description?: string;
  creditHours: number;
  isElective: boolean;
  isActive?: boolean | number;
  weeklyHoursPerClass?: Record<string, number>;
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
  isActive?: boolean;
  updatedBy?: number;
  departmentId?: number;
  weeklyHoursPerClass?: Record<string, number>;
}














