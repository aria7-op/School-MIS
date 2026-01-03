export interface StaffMember {
  id: string;
  name: string;
  position: string;
  salary: number;
  contact_number: string;
  email: string;
  address: string;
  joining_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher extends StaffMember {
  specialization: string;
  teaching_subjects: string[];
  teaching_experience: number;
  qualification: string;
}

export interface StaffFormType {
  name: string;
  position: string;
  salary: string;
  contact_number: string;
  email: string;
  address: string;
  joining_date: string;
  specialization: string;
  teaching_subjects: string[];
  teaching_experience: string;
  qualification: string;
  staffType: 'staff' | 'teacher';
}

export function convertToStaffMember(form: StaffFormType): StaffMember {
  return {
    id: Date.now().toString(),
    name: form.name,
    position: form.position,
    salary: Number(form.salary),
    contact_number: form.contact_number,
    email: form.email,
    address: form.address,
    joining_date: form.joining_date,
    created_by: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function convertToTeacher(form: StaffFormType): Teacher {
  return {
    id: Date.now().toString(),
    name: form.name,
    position: form.position,
    salary: Number(form.salary),
    contact_number: form.contact_number,
    email: form.email,
    address: form.address,
    joining_date: form.joining_date,
    specialization: form.specialization,
    teaching_subjects: form.teaching_subjects,
    teaching_experience: Number(form.teaching_experience),
    qualification: form.qualification,
    created_by: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
