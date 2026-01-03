import { StaffMember, Teacher } from './staff';

export interface StaffFormType {
  staffType: 'staff' | 'teacher';
  name: string;
  email: string;
  phone: string;
  contact_number: string;
  address: string;
  position: string;
  specialization: string;
  teaching_subjects: string[];
  teaching_experience: string;
  qualification: string;
  salary: string;
  joining_date: string;
  status: string;
}

export const convertToStaffMember = (formData: StaffFormType): StaffMember => ({
  ...formData,
  salary: Number(formData.salary),
  joining_date: new Date(formData.joining_date).toISOString(),
  id: Date.now().toString(),
  created_by: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

export const convertToTeacher = (formData: StaffFormType): Teacher => ({
  ...formData,
  salary: Number(formData.salary),
  teaching_experience: Number(formData.teaching_experience),
  joining_date: new Date(formData.joining_date).toISOString(),
  id: Date.now().toString(),
  created_by: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});
