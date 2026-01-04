// Single canonical utilities & types for student registration

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  localLastName?: string;
  dariName?: string;
  gender: string;
}

export interface EducationInfo {
  expectedFee?: number;
  class: string;
  admissionDate: string;
}

export interface ParentInfo {
  fatherName?: string;
  phone?: string;
  relationship: string;
  occupation?: string;
  isGuardian: boolean;
  isEmergencyContact: boolean;
}

export interface Relative {
  fullName: string;
  fatherName: string;
  phone: string;
}

export interface DocumentsInfo {
  studentTazkira?: FileList | any; // FileList for new uploads, document object for existing
  fatherTazkira?: FileList | any;
  transferLetter?: FileList | any;
  admissionLetter?: FileList | any;
  academicRecord?: FileList | any;
  existing?: any[]; // existing uploaded docs for edit mode display
}

export interface StudentFormData {
  personal?: PersonalInfo;
  education?: EducationInfo;
  father?: ParentInfo;
  studentId?: string;
  applicationId?: string;
  admissionNumber?: string;
  isDraft: boolean;
  completedSteps: number[];
}

export interface DraftMetadata {
  id: string;
  studentName: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  completionPercentage: number;
}

export interface SavedDraft {
  metadata: DraftMetadata;
  formData: StudentFormData;
}

export const DRAFTS_STORAGE_KEY = "student_registration_drafts";
export const SUBMITTED_STUDENTS_KEY = "submitted_students";

export const generateId = (prefix: string): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${year}-${random}`;
};

export const formatElectronicTazkira = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}-${numbers.slice(
    8,
    13
  )}`;
};

export const formatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, "").slice(0, 15);
};

export const calculateCompletionPercentage = (
  completedSteps: number[]
): number => {
  return Math.round((completedSteps.length / 4) * 100);
};

export const getStudentName = (formData: StudentFormData): string => {
  if (formData.personal?.firstName) {
    return `${formData.personal.firstName} ${
      formData.personal.lastName || ""
    }`.trim();
  }
  return "Unnamed Student";
};

import draftManager from "../services/draftManager";

export const saveDraft = (
  draftId: string,
  formData: StudentFormData,
  currentStep: number
): void => {
  try {
    draftManager.saveDraft(draftId, formData, currentStep);
  } catch (e) {
    console.error("saveDraft wrapper error:", e);
  }
};

export const getAllDrafts = (): SavedDraft[] => {
  try {
    return draftManager.getAllDrafts();
  } catch (e) {
    console.error("getAllDrafts wrapper error:", e);
    return [];
  }
};

export const getDraft = (draftId: string): SavedDraft | null => {
  try {
    return draftManager.getDraft(draftId);
  } catch (e) {
    console.error("getDraft wrapper error:", e);
    return null;
  }
};

export const deleteDraft = (draftId: string): void => {
  try {
    draftManager.deleteDraft(draftId);
  } catch (e) {
    console.error("deleteDraft wrapper error:", e);
  }
};

export const saveSubmittedStudent = (formData: StudentFormData): void => {
  const students = getSubmittedStudents();
  students.push({
    ...formData,
    submittedAt: new Date().toISOString(),
  });
  localStorage.setItem(SUBMITTED_STUDENTS_KEY, JSON.stringify(students));
};

export const getSubmittedStudents = (): any[] => {
  const stored = localStorage.getItem(SUBMITTED_STUDENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};
