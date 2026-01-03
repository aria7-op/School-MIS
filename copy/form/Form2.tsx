import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';when 
import type { UseFormRegister } from 'react-hook-form';
import './Form2.css'

import type { FieldValues } from 'react-hook-form';
import { 
  FiUser, FiBook, FiMapPin, FiUsers, FiUserPlus, 
  FiUpload, FiCheckCircle, FiX, FiChevronRight, 
  FiChevronLeft, FiSave, FiAlertCircle, FiPhone,
  FiMail, FiBriefcase, FiHome, FiFileText, FiTrash2,
  FiEdit, FiClock, FiList
} from 'react-icons/fi';
import { HiOutlineIdentification } from 'react-icons/hi';
import { sanitizeTextInput, sanitizeName, sanitizeEmail, sanitizePhone, sanitizeNumeric } from '../src/utils/sanitize';
import { validateName, validateEmail, validatePhone, validateFileType, validateFileSize } from '../src/utils/validators';
import LoadingButton from '../src/components/LoadingButton';
import FormError from '../src/components/FormError';
import { generateAriaId } from '../src/utils/a11y';
import logger from '../src/utils/logger';
import { useToast } from '../src/contexts/ToastContext';

// ==================== TYPE DEFINITIONS ====================

interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  dariName?: string;
  phone?: string;
  gender: string;
  dob: string;
  tazkiraType: 'electronic' | 'paper';
  electronicTazkira?: string;
  paperTazkiraNo?: string;
  paperTazkiraVolume?: string;
  paperTazkiraPage?: string;
  paperTazkiraRecord?: string;
  profilePicture?: FileList;
}

interface EducationInfo {
  expectedFee?: number;
  cardNumber?: string;
  class: string;
  admissionDate: string;
  bloodGroup?: string;
  nationality: string;
  religion: string;
  ethnicity?: string;
  previousSchool?: string;
}

interface AddressInfo {
  originAddress?: string;
  originCity?: string;
  originDistrict?: string;
  originProvince?: string;
  originCountry: string;
  originPostal?: string;
  sameAsOrigin: boolean;
  currentAddress?: string;
  currentCity?: string;
  currentDistrict?: string;
  currentProvince?: string;
  currentCountry: string;
  currentPostal?: string;
}

interface ParentInfo {
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  dariName?: string;
  username?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  tazkiraType?: 'electronic' | 'paper';
  electronicTazkira?: string;
  paperTazkiraNo?: string;
  paperTazkiraVolume?: string;
  paperTazkiraPage?: string;
  paperTazkiraRecord?: string;
  occupation?: string;
  annualIncome?: number;
  educationLevel?: string;
  employer?: string;
  designation?: string;
  workPhone?: string;
  emergencyContact?: string;
  relationship: string;
  sameAsStudent: boolean;
  address?: string;
  city?: string;
  district?: string;
  province?: string;
  country: string;
  postal?: string;
  profilePicture?: FileList;
  isGuardian: boolean;
  isEmergencyContact: boolean;
}

interface Relative {
  fullName: string;
  fatherName: string;
  phone: string;
}

interface DocumentsInfo {
  studentTazkira?: FileList;
  fatherTazkira?: FileList;
  transferLetter?: FileList;
  admissionLetter?: FileList;
  academicRecord?: FileList;
}

interface StudentFormData {
  personal?: PersonalInfo;
  education?: EducationInfo;
  address?: AddressInfo;
  father?: ParentInfo;
  mother?: ParentInfo;
  fatherUncles: Relative[];
  fatherCousins: Relative[];
  motherUncles: Relative[];
  motherCousins: Relative[];
  documents?: DocumentsInfo;
  studentId?: string;
  applicationId?: string;
  admissionNumber?: string;
  isDraft: boolean;
  completedSteps: number[];
}

interface DraftMetadata {
  id: string;
  studentName: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  completionPercentage: number;
}

interface SavedDraft {
  metadata: DraftMetadata;
  formData: StudentFormData;
}

// ==================== API SERVICE (READY FOR BACKEND) ====================

interface ApiConfig {
  baseUrl: string;
  endpoints?: {
    createStudent?: string;
    updateStudent?: string;
    getStudent?: string;
    uploadDocument?: string;
  };
}

class ApiService {
  private baseUrl: string;
  private endpoints: Required<ApiConfig>['endpoints'];
  private useBackend: boolean;

  constructor(config?: ApiConfig) {
    // Safe way to get API URL without process.env
    this.baseUrl = config?.baseUrl || this.getApiUrl();
    this.endpoints = {
      createStudent: '/students',
      updateStudent: '/students/:id',
      getStudent: '/students/:id',
      uploadDocument: '/documents/upload',
      ...config?.endpoints,
    };
    // Enable backend when URL is configured
    this.useBackend = !!this.baseUrl;
  }

  // Safe method to get API URL
  private getApiUrl(): string {
    try {
      // For Vite projects
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.VITE_API_URL || '';
      }
      // For Create React App (CRA)
      if (typeof process !== 'undefined' && process.env) {
        return process.env.REACT_APP_API_URL || '';
      }
    } catch (error) {
      console.warn('Could not access environment variables');
    }
    // Default: no backend
    return '';
  }

  async createStudent(data: StudentFormData): Promise<any> {
    if (!this.useBackend) {
      // Frontend only mode
      console.log('📝 [FRONTEND ONLY] Student data ready to submit:', DataAdapter.toBackend(data));
      return Promise.resolve({ success: true, id: data.studentId });
    }

    try {
      const response = await fetch(`${this.baseUrl}${this.endpoints.createStudent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DataAdapter.toBackend(data)),
      });
      if (!response.ok) throw new Error('Failed to create student');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async updateStudent(id: string, data: StudentFormData): Promise<any> {
    if (!this.useBackend) {
      console.log('📝 [FRONTEND ONLY] Update student:', id, DataAdapter.toBackend(data));
      return Promise.resolve({ success: true, id });
    }

    try {
      const url = `${this.baseUrl}${this.endpoints.updateStudent}`.replace(':id', id);
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DataAdapter.toBackend(data)),
      });
      if (!response.ok) throw new Error('Failed to update student');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getStudent(id: string): Promise<StudentFormData> {
    if (!this.useBackend) {
      console.log('📝 [FRONTEND ONLY] Get student:', id);
      throw new Error('Backend not configured');
    }

    try {
      const url = `${this.baseUrl}${this.endpoints.getStudent}`.replace(':id', id);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to get student');
      const data = await response.json();
      return DataAdapter.toFrontend(data);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async uploadDocument(file: File, type: string): Promise<string> {
    if (!this.useBackend) {
      console.log('📝 [FRONTEND ONLY] Upload document:', file.name, type);
      return Promise.resolve(`/uploads/${file.name}`);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(`${this.baseUrl}${this.endpoints.uploadDocument}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload document');
      const data = await response.json();
      return data.url || data.path;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }
}

// ==================== DATA ADAPTER (FOR BACKEND COMPATIBILITY) ====================

class DataAdapter {
  // Transform frontend data to backend format
  static toBackend(formData: StudentFormData): any {
    return {
      student: {
        personalInfo: {
          firstName: formData.personal?.firstName,
          middleName: formData.personal?.middleName,
          lastName: formData.personal?.lastName,
          dariName: formData.personal?.dariName,
          phone: formData.personal?.phone,
          gender: formData.personal?.gender,
          dateOfBirth: formData.personal?.dob,
          tazkira: formData.personal?.tazkiraType === 'electronic' 
            ? { type: 'electronic', number: formData.personal?.electronicTazkira }
            : {
                type: 'paper',
                number: formData.personal?.paperTazkiraNo,
                volume: formData.personal?.paperTazkiraVolume,
                page: formData.personal?.paperTazkiraPage,
                record: formData.personal?.paperTazkiraRecord,
              },
        },
        educationInfo: {
          class: formData.education?.class,
          admissionDate: formData.education?.admissionDate,
          expectedFee: formData.education?.expectedFee,
          cardNumber: formData.education?.cardNumber,
          bloodGroup: formData.education?.bloodGroup,
          nationality: formData.education?.nationality,
          religion: formData.education?.religion,
          ethnicity: formData.education?.ethnicity,
          previousSchool: formData.education?.previousSchool,
        },
        address: {
          origin: {
            address: formData.address?.originAddress,
            city: formData.address?.originCity,
            district: formData.address?.originDistrict,
            province: formData.address?.originProvince,
            country: formData.address?.originCountry,
            postalCode: formData.address?.originPostal,
          },
          current: {
            address: formData.address?.currentAddress,
            city: formData.address?.currentCity,
            district: formData.address?.currentDistrict,
            province: formData.address?.currentProvince,
            country: formData.address?.currentCountry,
            postalCode: formData.address?.currentPostal,
          },
        },
        identifiers: {
          studentId: formData.studentId,
          applicationId: formData.applicationId,
          admissionNumber: formData.admissionNumber,
        },
      },
      parents: {
        father: this.transformParent(formData.father),
        mother: this.transformParent(formData.mother),
      },
      relatives: {
        fatherSide: {
          uncles: formData.fatherUncles,
          cousins: formData.fatherCousins,
        },
        motherSide: {
          uncles: formData.motherUncles,
          cousins: formData.motherCousins,
        },
      },
      status: {
        isDraft: formData.isDraft,
        completedSteps: formData.completedSteps,
      },
    };
  }

  // Transform backend data to frontend format
  static toFrontend(backendData: any): StudentFormData {
    const student = backendData.student || {};
    const personal = student.personalInfo || {};
    const education = student.educationInfo || {};
    const address = student.address || {};
    const identifiers = student.identifiers || {};
    const parents = backendData.parents || {};
    const relatives = backendData.relatives || {};
    const status = backendData.status || {};

    return {
      personal: {
        firstName: personal.firstName || '',
        middleName: personal.middleName,
        lastName: personal.lastName || '',
        dariName: personal.dariName,
        phone: personal.phone,
        gender: personal.gender || '',
        dob: personal.dateOfBirth || '',
        tazkiraType: personal.tazkira?.type || 'electronic',
        electronicTazkira: personal.tazkira?.type === 'electronic' ? personal.tazkira?.number : undefined,
        paperTazkiraNo: personal.tazkira?.type === 'paper' ? personal.tazkira?.number : undefined,
        paperTazkiraVolume: personal.tazkira?.volume,
        paperTazkiraPage: personal.tazkira?.page,
        paperTazkiraRecord: personal.tazkira?.record,
      },
      education: {
        class: education.class || '',
        admissionDate: education.admissionDate || '',
        expectedFee: education.expectedFee,
        cardNumber: education.cardNumber,
        bloodGroup: education.bloodGroup,
        nationality: education.nationality || 'Afghan',
        religion: education.religion || 'Islam',
        ethnicity: education.ethnicity,
        previousSchool: education.previousSchool,
      },
      address: {
        originAddress: address.origin?.address,
        originCity: address.origin?.city,
        originDistrict: address.origin?.district,
        originProvince: address.origin?.province,
        originCountry: address.origin?.country || 'Afghanistan',
        originPostal: address.origin?.postalCode,
        currentAddress: address.current?.address,
        currentCity: address.current?.city,
        currentDistrict: address.current?.district,
        currentProvince: address.current?.province,
        currentCountry: address.current?.country || 'Afghanistan',
        currentPostal: address.current?.postalCode,
        sameAsOrigin: false,
      },
      father: this.transformParentFromBackend(parents.father),
      mother: this.transformParentFromBackend(parents.mother),
      fatherUncles: relatives.fatherSide?.uncles || [],
      fatherCousins: relatives.fatherSide?.cousins || [],
      motherUncles: relatives.motherSide?.uncles || [],
      motherCousins: relatives.motherSide?.cousins || [],
      studentId: identifiers.studentId,
      applicationId: identifiers.applicationId,
      admissionNumber: identifiers.admissionNumber,
      isDraft: status.isDraft ?? true,
      completedSteps: status.completedSteps || [],
    };
  }

  private static transformParent(parent?: ParentInfo): any {
    if (!parent) return null;
    return {
      firstName: parent.firstName,
      lastName: parent.lastName,
      fatherName: parent.fatherName,
      dariName: parent.dariName,
      email: parent.email,
      phone: parent.phone,
      gender: parent.gender,
      dateOfBirth: parent.dob,
      tazkira: parent.tazkiraType === 'electronic'
        ? { type: 'electronic', number: parent.electronicTazkira }
        : {
            type: 'paper',
            number: parent.paperTazkiraNo,
            volume: parent.paperTazkiraVolume,
            page: parent.paperTazkiraPage,
            record: parent.paperTazkiraRecord,
          },
      occupation: parent.occupation,
      annualIncome: parent.annualIncome,
      educationLevel: parent.educationLevel,
      employer: parent.employer,
      designation: parent.designation,
      workPhone: parent.workPhone,
      emergencyContact: parent.emergencyContact,
      relationship: parent.relationship,
      address: {
        address: parent.address,
        city: parent.city,
        district: parent.district,
        province: parent.province,
        country: parent.country,
        postalCode: parent.postal,
      },
      isGuardian: parent.isGuardian,
      isEmergencyContact: parent.isEmergencyContact,
    };
  }

  private static transformParentFromBackend(parentData: any): ParentInfo | undefined {
    if (!parentData) return undefined;
    return {
      firstName: parentData.firstName,
      lastName: parentData.lastName,
      fatherName: parentData.fatherName,
      dariName: parentData.dariName,
      email: parentData.email,
      phone: parentData.phone,
      gender: parentData.gender,
      dob: parentData.dateOfBirth,
      tazkiraType: parentData.tazkira?.type || 'electronic',
      electronicTazkira: parentData.tazkira?.type === 'electronic' ? parentData.tazkira?.number : undefined,
      paperTazkiraNo: parentData.tazkira?.type === 'paper' ? parentData.tazkira?.number : undefined,
      paperTazkiraVolume: parentData.tazkira?.volume,
      paperTazkiraPage: parentData.tazkira?.page,
      paperTazkiraRecord: parentData.tazkira?.record,
      occupation: parentData.occupation,
      annualIncome: parentData.annualIncome,
      educationLevel: parentData.educationLevel,
      employer: parentData.employer,
      designation: parentData.designation,
      workPhone: parentData.workPhone,
      emergencyContact: parentData.emergencyContact,
      relationship: parentData.relationship,
      address: parentData.address?.address,
      city: parentData.address?.city,
      district: parentData.address?.district,
      province: parentData.address?.province,
      country: parentData.address?.country || 'Afghanistan',
      postal: parentData.address?.postalCode,
      isGuardian: parentData.isGuardian || false,
      isEmergencyContact: parentData.isEmergencyContact || false,
      sameAsStudent: false,
    };
  }
}

// ==================== DRAFT MANAGEMENT ====================

const DRAFTS_STORAGE_KEY = 'student_registration_drafts';
const SUBMITTED_STUDENTS_KEY = 'submitted_students'; // For frontend storage

const generateId = (prefix: string): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
};

const formatElectronicTazkira = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}-${numbers.slice(8, 13)}`;
};

const formatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 15);
};

// File validation constants
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
const ALLOWED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];

const calculateCompletionPercentage = (completedSteps: number[]): number => {
  return Math.round((completedSteps.length / 7) * 100);
};

const getStudentName = (formData: StudentFormData): string => {
  if (formData.personal?.firstName) {
    return `${formData.personal.firstName} ${formData.personal.lastName || ''}`.trim();
  }
  return 'Unnamed Student';
};

const saveDraft = (draftId: string, formData: StudentFormData, currentStep: number): void => {
  const drafts = getAllDrafts();
  const now = new Date().toISOString();
  
  const existingDraftIndex = drafts.findIndex(d => d.metadata.id === draftId);
  
  const draft: SavedDraft = {
    metadata: {
      id: draftId,
      studentName: getStudentName(formData),
      createdAt: existingDraftIndex >= 0 ? drafts[existingDraftIndex].metadata.createdAt : now,
      updatedAt: now,
      currentStep,
      completionPercentage: calculateCompletionPercentage(formData.completedSteps),
    },
    formData,
  };

  if (existingDraftIndex >= 0) {
    drafts[existingDraftIndex] = draft;
  } else {
    drafts.push(draft);
  }

  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
};

const getAllDrafts = (): SavedDraft[] => {
  const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getDraft = (draftId: string): SavedDraft | null => {
  const drafts = getAllDrafts();
  return drafts.find(d => d.metadata.id === draftId) || null;
};

const deleteDraft = (draftId: string): void => {
  const drafts = getAllDrafts();
  const filtered = drafts.filter(d => d.metadata.id !== draftId);
  localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(filtered));
};

// Store submitted students (frontend only, until backend is ready)
const saveSubmittedStudent = (formData: StudentFormData): void => {
  const students = getSubmittedStudents();
  students.push({
    ...formData,
    submittedAt: new Date().toISOString(),
  });
  localStorage.setItem(SUBMITTED_STUDENTS_KEY, JSON.stringify(students));
};

const getSubmittedStudents = (): any[] => {
  const stored = localStorage.getItem(SUBMITTED_STUDENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// ==================== MAIN APP COMPONENT ====================

function Form2() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentDraftId, setCurrentDraftId] = useState<string>('');
  const [formData, setFormData] = useState<StudentFormData>({
    isDraft: true,
    completedSteps: [],
    fatherUncles: [],
    fatherCousins: [],
    motherUncles: [],
    motherCousins: [],
  });
  const [parentTab, setParentTab] = useState<'father' | 'mother'>('father');
  
  // API service (optional - works without backend)
  const apiService = new ApiService();

  // Auto-save draft
  useEffect(() => {
    if (currentDraftId && isModalOpen) {
      saveDraft(currentDraftId, formData, currentStep);
    }
  }, [formData, currentStep, currentDraftId, isModalOpen]);

  const isStepAccessible = (step: number): boolean => {
    if (step === 1) return true;
    if (!formData.completedSteps.includes(1)) return false;
    return step <= currentStep || formData.completedSteps.includes(step);
  };

  const handleStepClick = (step: number) => {
    if (isStepAccessible(step)) {
      setCurrentStep(step);
    }
  };

  const markStepComplete = (step: number) => {
    if (!formData.completedSteps.includes(step)) {
      const updated = {
        ...formData,
        completedSteps: [...formData.completedSteps, step].sort((a, b) => a - b),
      };
      setFormData(updated);
    }
  };

  const handleSaveDraft = (data: Partial<PersonalInfo>) => {
    const updated = {
      ...formData,
      personal: { ...formData.personal, ...data } as PersonalInfo,
      isDraft: true,
    };
    setFormData(updated);
    if (currentDraftId) {
      saveDraft(currentDraftId, updated, currentStep);
    }
    logger.info('Draft saved successfully', { draftId: currentDraftId });
    // Success feedback via toast notification
  };

  const handleStep1Complete = (data: PersonalInfo) => {
    const studentId = formData.studentId || generateId('ST');
    const applicationId = formData.applicationId || generateId('APP');
    const admissionNumber = formData.admissionNumber || generateId('ADM');

    const updated = {
      ...formData,
      personal: data,
      studentId,
      applicationId,
      admissionNumber,
      isDraft: false,
    };

    setFormData(updated);
    markStepComplete(1);
    setCurrentStep(2);
  };

  const handleStepSave = (step: number, data: any) => {
    let updated = { ...formData };

    if (step === 2) updated.education = data;
    if (step === 3) updated.address = data;
    if (step === 4) {
      if (parentTab === 'father') updated.father = data;
      if (parentTab === 'mother') updated.mother = data;
    }
    if (step === 6) updated.documents = data;

    setFormData(updated);
    markStepComplete(step);
    
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      // TODO: When backend is ready, uncomment this line
      // await apiService.createStudent(formData);
      
      // For now, save to localStorage (frontend only)
      saveSubmittedStudent(formData);
      
      logger.info('Student registered successfully', { formData, backendFormat: DataAdapter.toBackend(formData) });
      
      // Success feedback will be handled by parent component via toast/notification
      
      // Delete draft after successful submission
      if (currentDraftId) {
        deleteDraft(currentDraftId);
      }
      
      // Reset form
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      logger.error('Failed to submit student registration', error);
      // Error will be displayed via error boundary or toast notification
      throw error; // Re-throw to be caught by error boundary
    }
  };

  const resetForm = () => {
    setFormData({
      isDraft: true,
      completedSteps: [],
      fatherUncles: [],
      fatherCousins: [],
      motherUncles: [],
      motherCousins: [],
    });
    setCurrentStep(1);
    setCurrentDraftId('');
  };

  const handleNewStudent = () => {
    resetForm();
    const newDraftId = generateId('DRAFT');
    setCurrentDraftId(newDraftId);
    setIsModalOpen(true);
  };

  const handleLoadDraft = (draft: SavedDraft) => {
    setFormData(draft.formData);
    setCurrentStep(draft.metadata.currentStep);
    setCurrentDraftId(draft.metadata.id);
    setIsDraftsModalOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteDraft = (draftId: string) => {
    // Use proper confirmation dialog instead of window.confirm
    const confirmed = window.confirm('Are you sure you want to delete this draft?');
    if (confirmed) {
      deleteDraft(draftId);
      setIsDraftsModalOpen(false);
      logger.info('Draft deleted', { draftId });
      // Re-render by forcing state update
      setTimeout(() => setIsDraftsModalOpen(true), 0);
    }
  };

  const handleCloseModal = () => {
    const confirmed = window.confirm('Are you sure? Progress is auto-saved in drafts.');
    if (confirmed) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <PrintStyles/>
      {/* Dashboard Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
            <p className="text-gray-600 mt-1">Manage student registrations and records</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDraftsModalOpen(true)}
              className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors shadow-lg"
            >
              <FiList className="text-xl" />
              View Drafts ({getAllDrafts().length})
            </button>
            <button
              onClick={handleNewStudent}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              <FiUserPlus className="text-xl" />
              Add New Student
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Getting Started</h2>
          <p className="text-gray-600">Click "Add New Student" to create a new registration or "View Drafts" to continue saved progress.</p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Drafts</p>
                <p className="text-2xl font-bold text-blue-600">{getAllDrafts().length}</p>
              </div>
              <FiEdit className="text-3xl text-blue-400" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-green-600">{getSubmittedStudents().length}</p>
              </div>
              <FiCheckCircle className="text-3xl text-green-400" />
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-purple-600">{getAllDrafts().length + getSubmittedStudents().length}</p>
              </div>
              <FiUsers className="text-3xl text-purple-400" />
            </div>
          </div>
        </div>

        {/* Backend Status */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Frontend Mode Active</p>
              <p className="text-xs text-gray-600 mt-1">
                Currently running without backend. Data is stored in localStorage. 
                To enable backend, set REACT_APP_API_URL in your .env file.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DRAFTS MODAL */}
      {isDraftsModalOpen && (
        <DraftsModal
          onClose={() => setIsDraftsModalOpen(false)}
          onLoadDraft={handleLoadDraft}
          onDeleteDraft={handleDeleteDraft}
        />
      )}

      {/* REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FiUserPlus className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Add New Student</h2>
                  <p className="text-sm text-gray-500">Auto-saved as draft</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            {/* Registration Info Banner */}
            {formData.studentId && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Student ID:</span>
                    <span className="font-semibold text-blue-600">{formData.studentId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Application:</span>
                    <span className="font-semibold text-blue-600">{formData.applicationId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Admission:</span>
                    <span className="font-semibold text-blue-600">{formData.admissionNumber}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Steps */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <ProgressSteps
                currentStep={currentStep}
                completedSteps={formData.completedSteps}
                onStepClick={handleStepClick}
                canNavigate={formData.completedSteps.includes(1)}
              />
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {currentStep === 1 && (
                <Step1Personal
                  defaultValues={formData.personal}
                  onSaveDraft={handleSaveDraft}
                  onNext={handleStep1Complete}
                />
              )}

              {currentStep === 2 && (
                <Step2Education
                  defaultValues={formData.education}
                  onNext={(data) => handleStepSave(2, data)}
                  onPrevious={handlePrevious}
                />
              )}

              {currentStep === 3 && (
                <Step3Address
                  defaultValues={formData.address}
                  onNext={(data) => handleStepSave(3, data)}
                  onPrevious={handlePrevious}
                />
              )}

              {currentStep === 4 && (
                <Step4Parents
                  fatherData={formData.father}
                  motherData={formData.mother}
                  studentAddress={formData.address}
                  activeTab={parentTab}
                  onTabChange={setParentTab}
                  onNext={(data) => handleStepSave(4, data)}
                  onPrevious={handlePrevious}
                />
              )}

              {currentStep === 5 && (
                <Step5Relatives
                  formData={formData}
                  setFormData={setFormData}
                  onNext={() => { markStepComplete(5); setCurrentStep(6); }}
                  onPrevious={handlePrevious}
                />
              )}

              {currentStep === 6 && (
                <Step6Documents
                  defaultValues={formData.documents}
                  onNext={(data) => handleStepSave(6, data)}
                  onPrevious={handlePrevious}
                />
              )}

              {currentStep === 7 && (
                <Step7Review
                  formData={formData}
                  onPrevious={handlePrevious}
                  onSubmit={handleSubmit}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== DRAFTS MODAL ====================

interface DraftsModalProps {
  onClose: () => void;
  onLoadDraft: (draft: SavedDraft) => void;
  onDeleteDraft: (draftId: string) => void;
}

const DraftsModal: React.FC<DraftsModalProps> = ({ onClose, onLoadDraft, onDeleteDraft }) => {
  const drafts = getAllDrafts();

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <FiList className="text-gray-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Saved Drafts</h2>
              <p className="text-sm text-gray-500">{drafts.length} draft(s) available</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <FiAlertCircle className="text-gray-400 text-5xl mx-auto mb-4" />
              <p className="text-gray-600">No saved drafts yet</p>
              <p className="text-sm text-gray-500 mt-2">Start a new registration to create a draft</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.metadata.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {draft.metadata.studentName}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FiClock className="text-gray-400" />
                          <span>Updated: {new Date(draft.metadata.updatedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiCheckCircle className="text-gray-400" />
                          <span>Step {draft.metadata.currentStep} of 7</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${draft.metadata.completionPercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {draft.metadata.completionPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => onLoadDraft(draft)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label={`Continue editing draft for ${draft.metadata.studentName}`}
                      >
                        <FiEdit aria-hidden="true" />
                        Continue
                      </button>
                      <button
                        onClick={() => onDeleteDraft(draft.metadata.id)}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        aria-label={`Delete draft for ${draft.metadata.studentName}`}
                      >
                        <FiTrash2 aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== PROGRESS STEPS ====================

interface ProgressStepsProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  canNavigate: boolean;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ 
  currentStep, 
  completedSteps, 
  onStepClick, 
  canNavigate 
}) => {
  const steps = [
    { number: 1, label: 'Personal', icon: FiUser },
    { number: 2, label: 'Education', icon: FiBook },
    { number: 3, label: 'Address', icon: FiMapPin },
    { number: 4, label: 'Parents', icon: FiUsers },
    { number: 5, label: 'Relatives', icon: FiUserPlus },
    { number: 6, label: 'Documents', icon: FiUpload },
    { number: 7, label: 'Review', icon: FiCheckCircle },
  ];

  const isStepAccessible = (stepNumber: number): boolean => {
    if (stepNumber === 1) return true;
    if (!canNavigate) return false;
    return stepNumber <= currentStep || completedSteps.includes(stepNumber);
  };

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = completedSteps.includes(step.number);
        const isClickable = isStepAccessible(step.number);
        const Icon = step.icon;

        return (
          <React.Fragment key={step.number}>
            <button
              onClick={() => isClickable && onStepClick(step.number)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-2 transition-all ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <FiCheckCircle className="text-lg" />
                ) : (
                  <Icon className="text-lg" />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  completedSteps.includes(step.number) ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ==================== STEP COMPONENTS (Same as before, just showing Step 1 for brevity) ====================

interface Step1Props {
  defaultValues?: PersonalInfo;
  onSaveDraft: (data: Partial<PersonalInfo>) => void;
  onNext: (data: PersonalInfo) => void;
}

const Step1Personal: React.FC<Step1Props> = ({ defaultValues, onSaveDraft, onNext }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<PersonalInfo>({
    defaultValues: defaultValues || { tazkiraType: 'electronic', gender: '' },
  });

  const tazkiraType = watch('tazkiraType');
  const electronicTazkira = watch('electronicTazkira');
  
  // Generate ARIA IDs for error messages
  const firstNameErrorId = generateAriaId('firstName-error');
  const lastNameErrorId = generateAriaId('lastName-error');
  const phoneErrorId = generateAriaId('phone-error');
  const electronicTazkiraErrorId = generateAriaId('electronicTazkira-error');

  useEffect(() => {
    if (tazkiraType === 'electronic' && electronicTazkira) {
      const formatted = formatElectronicTazkira(electronicTazkira);
      if (formatted !== electronicTazkira) {
        setValue('electronicTazkira', formatted);
      }
    }
  }, [electronicTazkira, tazkiraType, setValue]);

  const onSubmit = (data: PersonalInfo) => {
    // Sanitize all text inputs
    const sanitizedData: PersonalInfo = {
      ...data,
      firstName: sanitizeName(data.firstName || ''),
      middleName: data.middleName ? sanitizeName(data.middleName) : undefined,
      lastName: sanitizeName(data.lastName || ''),
      dariName: data.dariName ? sanitizeTextInput(data.dariName) : undefined,
      phone: data.phone ? sanitizePhone(data.phone) : undefined,
      electronicTazkira: data.electronicTazkira ? sanitizeNumeric(data.electronicTazkira) : undefined,
      paperTazkiraNo: data.paperTazkiraNo ? sanitizeNumeric(data.paperTazkiraNo) : undefined,
      paperTazkiraVolume: data.paperTazkiraVolume ? sanitizeTextInput(data.paperTazkiraVolume) : undefined,
      paperTazkiraPage: data.paperTazkiraPage ? sanitizeNumeric(data.paperTazkiraPage) : undefined,
      paperTazkiraRecord: data.paperTazkiraRecord ? sanitizeNumeric(data.paperTazkiraRecord) : undefined,
    };

    // Validate names - errors will be shown via form validation
    if (!validateName(sanitizedData.firstName)) {
      setValue('firstName', sanitizedData.firstName, { shouldValidate: true });
      return;
    }
    if (!validateName(sanitizedData.lastName)) {
      setValue('lastName', sanitizedData.lastName, { shouldValidate: true });
      return;
    }

    if (sanitizedData.tazkiraType === 'electronic') {
      const numbers = sanitizedData.electronicTazkira?.replace(/\D/g, '');
      if (numbers?.length !== 13) {
        setValue('electronicTazkira', sanitizedData.electronicTazkira || '', { shouldValidate: true });
        return;
      }
    }
    onNext(sanitizedData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-3 gap-4">
        <FormField label="First Name" required error={errors.firstName?.message}>
          <input
            {...register('firstName', {
              required: 'First name is required',
              maxLength: { value: 50, message: 'Maximum 50 characters allowed' },
              validate: (value) => validateName(value) || 'Name contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed.'
            })}
            id="firstName"
            type="text"
            autoComplete="given-name"
            aria-required="true"
            aria-invalid={errors.firstName ? 'true' : 'false'}
            aria-describedby={errors.firstName ? firstNameErrorId : undefined}
            className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm`}
            placeholder="مثال: احمد، محمد، فاطمه، زهرا"
            maxLength={50}
            onBlur={(e) => {
              const sanitized = sanitizeName(e.target.value);
              if (sanitized !== e.target.value) {
                setValue('firstName', sanitized);
              }
            }}
          />
          <FormError error={errors.firstName?.message} id={firstNameErrorId} />
        </FormField>

        <FormField label="Middle Name">
          <input
            {...register('middleName', {
              maxLength: { value: 50, message: 'Maximum 50 characters allowed' },
              validate: (value) => !value || validateName(value) || 'Name contains invalid characters'
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm"
            placeholder="مثال: احمد، علی (اختیاری)"
            maxLength={50}
            onBlur={(e) => {
              if (e.target.value) {
                const sanitized = sanitizeName(e.target.value);
                if (sanitized !== e.target.value) {
                  setValue('middleName', sanitized);
                }
              }
            }}
          />
        </FormField>

        <FormField label="Last Name" required error={errors.lastName?.message}>
          <input
            {...register('lastName', {
              required: 'Last name is required',
              maxLength: { value: 50, message: 'Maximum 50 characters allowed' },
              validate: (value) => validateName(value) || 'Name contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed.'
            })}
            id="lastName"
            type="text"
            autoComplete="family-name"
            aria-required="true"
            aria-invalid={errors.lastName ? 'true' : 'false'}
            aria-describedby={errors.lastName ? lastNameErrorId : undefined}
            className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm`}
            placeholder="مثال: احمدی، کریمی، احمدزی، محمودی"
            maxLength={50}
            onBlur={(e) => {
              const sanitized = sanitizeName(e.target.value);
              if (sanitized !== e.target.value) {
                setValue('lastName', sanitized);
              }
            }}
          />
          <FormError error={errors.lastName?.message} id={lastNameErrorId} />
        </FormField>
      </div>

      {/* Personal Details */}
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Dari Name">
          <input
            {...register('dariName', {
              maxLength: { value: 100, message: 'Maximum 100 characters allowed' }
            })}
            dir="rtl"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm text-right"
            placeholder="نام دری را وارد کنید (مثال: احمد خان)"
            maxLength={100}
            onBlur={(e) => {
              if (e.target.value) {
                const sanitized = sanitizeTextInput(e.target.value);
                if (sanitized !== e.target.value) {
                  setValue('dariName', sanitized);
                }
              }
            }}
          />
        </FormField>

        <FormField label="Phone Number">
          <div className="relative">
            <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              {...register('phone', {
                pattern: { value: /^[0-9]{0,15}$/, message: 'Phone number must contain only digits (max 15 digits)' },
                validate: (value) => !value || validatePhone(value) || 'Invalid phone number format'
              })}
              id="phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? phoneErrorId : undefined}
              className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm pl-10`}
              placeholder="مثال: 0700123456 یا 0799123456"
              maxLength={15}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                e.currentTarget.value = formatPhoneNumber(e.currentTarget.value);
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  const sanitized = sanitizePhone(e.target.value);
                  if (sanitized !== e.target.value) {
                    setValue('phone', sanitized);
                  }
                }
              }}
            />
          </div>
          <FormError error={errors.phone?.message} id={phoneErrorId} />
        </FormField>

        <FormField label="Gender" required error={errors.gender?.message}>
          <select 
            {...register('gender', { required: 'Required' })} 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Date of Birth" required error={errors.dob?.message}>
          <input
            {...register('dob', { required: 'Date of birth is required' })}
            id="dob"
            type="date"
            autoComplete="bday"
            aria-required="true"
            aria-invalid={errors.dob ? 'true' : 'false'}
            aria-describedby={errors.dob ? generateAriaId('dob-error') : undefined}
            className={`w-full px-3 py-2 border ${errors.dob ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm`}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dob && <FormError error={errors.dob.message} id={generateAriaId('dob-error')} />}
        </FormField>
      </div>

      {/* Tazkira Section */}
      <div className="border-t pt-6 border-gray-300">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineIdentification className="text-xl text-blue-600" />
          <h3 className="font-semibold text-gray-800">Tazkira (ID) Information</h3>
        </div>

        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              {...register('tazkiraType')}
              type="radio"
              value="electronic"
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Electronic Tazkira</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              {...register('tazkiraType')}
              type="radio"
              value="paper"
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Paper Tazkira</span>
          </label>
        </div>

        {tazkiraType === 'electronic' && (
          <FormField label="Electronic Tazkira Number" required error={errors.electronicTazkira?.message}>
            <input
              {...register('electronicTazkira', {
                required: 'Electronic Tazkira number is required',
                pattern: { value: /^\d{4}-\d{4}-\d{5}$/, message: 'Format: 0000-0000-00000' }
              })}
              id="electronicTazkira"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-required="true"
              aria-invalid={errors.electronicTazkira ? 'true' : 'false'}
              aria-describedby={errors.electronicTazkira ? electronicTazkiraErrorId : undefined}
              className={`w-full px-3 py-2 border ${errors.electronicTazkira ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm font-mono`}
              placeholder="0000-0000-00000"
              maxLength={15}
            />
            <FormError error={errors.electronicTazkira?.message} id={electronicTazkiraErrorId} />
          </FormField>
        )}

        {tazkiraType === 'paper' && (
          <div className="grid grid-cols-4 gap-4">
            <FormField label="Tazkira No" required error={errors.paperTazkiraNo?.message}>
              <input
                {...register('paperTazkiraNo', {
                  required: 'Required',
                  pattern: { value: /^[0-9]{1,20}$/, message: 'Numbers only' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm"
                maxLength={20}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                }}
              />
            </FormField>
            <FormField label="Volume" required error={errors.paperTazkiraVolume?.message}>
              <input
                {...register('paperTazkiraVolume', {
                  required: 'Required',
                  maxLength: { value: 20, message: 'Max 20' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm"
                maxLength={20}
              />
            </FormField>
            <FormField label="Page" required error={errors.paperTazkiraPage?.message}>
              <input
                {...register('paperTazkiraPage', {
                  required: 'Required',
                  pattern: { value: /^[0-9]{1,20}$/, message: 'Numbers only' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm"
                maxLength={20}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                }}
              />
            </FormField>
            <FormField label="Record" required error={errors.paperTazkiraRecord?.message}>
              <input
                {...register('paperTazkiraRecord', {
                  required: 'Required',
                  pattern: { value: /^[0-9]{1,20}$/, message: 'Numbers only' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm"
                maxLength={20}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                }}
              />
            </FormField>
          </div>
        )}
      </div>

      {/* Profile Picture */}
      <FormField label="Profile Picture">
        <input
          {...register('profilePicture', {
            validate: (files: FileList | undefined) => {
              if (!files || files.length === 0) return true; // Optional field
              const file = files[0];
              // Validate file type
              if (!validateFileType(file, ALLOWED_FILE_TYPES)) {
                return `Invalid file type. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`;
              }
              // Validate file size
              if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
                return `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`;
              }
              return true;
            }
          })}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif"
          className="w-xs px-3 py-2 border border-dashed border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (!validateFileType(file, ALLOWED_FILE_TYPES)) {
                if (typeof window !== 'undefined' && window.logger) {
                  window.logger.warn('Invalid file type selected', { fileName: file.name, allowedTypes: ALLOWED_FILE_EXTENSIONS });
                }
                // Toast will be shown via form validation
                e.target.value = '';
                return;
              }
              if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
                if (typeof window !== 'undefined' && window.logger) {
                  window.logger.warn('File size exceeds limit', { fileName: file.name, fileSize: file.size, maxSize: MAX_FILE_SIZE_MB });
                }
                // Toast will be shown via form validation
                e.target.value = '';
                return;
              }
            }
          }}
        />
        <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG, GIF (Max {MAX_FILE_SIZE_MB}MB)</p>
      </FormField>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-300">
        <LoadingButton
          type="button"
          onClick={() => onSaveDraft(watch())}
          variant="secondary"
          icon={<FiSave aria-hidden="true" />}
          aria-label="Save draft"
        >
          Save Draft
        </LoadingButton>
        <LoadingButton 
          type="submit"
          loading={isSubmitting}
          loadingText="Processing..."
          variant="primary"
          icon={<FiChevronRight aria-hidden="true" />}
          aria-label="Register and continue to next step"
        >
          Register & Continue
        </LoadingButton>
      </div>
    </form>
  );
};


// ==================== STEP 2: EDUCATION ====================

interface Step2Props {
  defaultValues?: EducationInfo;
  onNext: (data: EducationInfo) => void;
  onPrevious: () => void;
}

const Step2Education: React.FC<Step2Props> = ({ defaultValues, onNext, onPrevious }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<EducationInfo>({
    defaultValues: defaultValues || { nationality: 'Afghan', religion: 'Islam', class: '' },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <GlobalStyles />
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Expected Fee (AFN)">
          <input
            {...register('expectedFee', {
              min: { value: 0, message: 'Fee must be a positive number' }
            })}
            type="number"
            className="input"
            placeholder="مثال: 5000 افغانی"
            min={0}
          />
        </FormField>

        <FormField label="Card Number">
          <input
            {...register('cardNumber', {
              maxLength: { value: 50, message: 'Maximum 50 characters allowed' }
            })}
            className="input"
            placeholder="مثال: ST-1403-001"
            maxLength={50}
            onBlur={(e) => {
              const sanitized = sanitizeTextInput(e.target.value);
              if (sanitized !== e.target.value) {
                setValue('cardNumber', sanitized);
              }
            }}
          />
        </FormField>

        <FormField label="Class" required error={errors.class?.message}>
          <select {...register('class', { required: 'Required' })} className="input">
            <option value="">Select</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Admission Date" required error={errors.admissionDate?.message}>
          <input
            {...register('admissionDate', { required: 'Required' })}
            type="date"
            className="input"
          />
        </FormField>

        <FormField label="Blood Group">
          <select {...register('bloodGroup')} className="input">
            <option value="">Select</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Nationality">
          <input
            {...register('nationality', {
              maxLength: { value: 50, message: 'Max 50 chars' }
            })}
            className="input"
            defaultValue="Afghan"
            maxLength={50}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Religion">
          <input
            {...register('religion', {
              maxLength: { value: 50, message: 'Max 50 chars' }
            })}
            className="input"
            defaultValue="Islam"
            maxLength={50}
          />
        </FormField>

        <FormField label="Ethnicity">
          <select {...register('ethnicity')} className="input">
            <option value="">Select</option>
            {['Pashtun', 'Tajik', 'Hazara', 'Uzbek', 'Turkmen', 'Baloch', 'Other'].map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Previous School">
          <input
            {...register('previousSchool', {
              maxLength: { value: 100, message: 'Maximum 100 characters allowed' }
            })}
            className="input"
            placeholder="مثال: لیسه عالی کابل، لیسه حبیبیه (یا خالی بگذارید اگر اولین بار است)"
            maxLength={100}
            onBlur={(e) => {
              if (e.target.value) {
                const sanitized = sanitizeTextInput(e.target.value);
                if (sanitized !== e.target.value) {
                  setValue('previousSchool', sanitized);
                }
              }
            }}
          />
        </FormField>
      </div>

      <NavigationButtons onPrevious={onPrevious} isSubmitting={isSubmitting} />
    </form>
  );
};

// ==================== STEP 3: ADDRESS ====================

interface Step3Props {
  defaultValues?: AddressInfo;
  onNext: (data: AddressInfo) => void;
  onPrevious: () => void;
}

const Step3Address: React.FC<Step3Props> = ({ defaultValues, onNext, onPrevious }) => {
  const { register, handleSubmit, watch, setValue } = useForm<AddressInfo>({
    defaultValues: defaultValues || {
      sameAsOrigin: false,
      originCountry: 'Afghanistan',
      currentCountry: 'Afghanistan'
    },
  });

  const handleCopyAddress = (checked: boolean) => {
    if (checked) {
      const fields = ['Address', 'City', 'District', 'Province', 'Country', 'Postal'] as const;
      fields.forEach(field => {
        const originValue = watch(`origin${field}` as any);
        setValue(`current${field}` as any, originValue);
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Origin Address */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FiHome className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">Origin Address</h3>
        </div>
        <AddressFields register={register} prefix="origin" />
      </div>

      {/* Current Address */}
      <div className=" border-t pt-6 border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiMapPin className="text-blue-600" />
            <h3 className="font-semibold text-gray-800">Current Address</h3>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              {...register('sameAsOrigin')}
              type="checkbox"
              className="checkbox"
              onChange={(e) => handleCopyAddress(e.target.checked)}
            />
            <span className="text-gray-600">Same as origin</span>
          </label>
        </div>
        <AddressFields register={register} prefix="current" />
      </div>

      <NavigationButtons onPrevious={onPrevious} isSubmitting={isSubmitting} />
    </form>
  );
};

// ==================== STEP 4: PARENTS ====================

interface Step4Props {
  fatherData?: ParentInfo;
  motherData?: ParentInfo;
  studentAddress?: AddressInfo;
  activeTab: 'father' | 'mother';
  onTabChange: (tab: 'father' | 'mother') => void;
  onNext: (data: ParentInfo) => void;
  onPrevious: () => void;
}

const Step4Parents: React.FC<Step4Props> = ({
  fatherData,
  motherData,
  studentAddress,
  activeTab,
  onTabChange,
  onNext,
  onPrevious
}) => {
  const defaultData = activeTab === 'father' ? fatherData : motherData;

  const { register, handleSubmit, watch, setValue } = useForm<ParentInfo>({
    defaultValues: defaultData || {
      relationship: activeTab === 'father' ? 'Father' : 'Mother',
      country: 'Afghanistan',
      sameAsStudent: false,
      isGuardian: false,
      isEmergencyContact: false,
      tazkiraType: 'electronic'
    },
  });

  const tazkiraType = watch('tazkiraType');
  const electronicTazkira = watch('electronicTazkira');

  useEffect(() => {
    if (tazkiraType === 'electronic' && electronicTazkira) {
      const formatted = formatElectronicTazkira(electronicTazkira);
      if (formatted !== electronicTazkira) {
        setValue('electronicTazkira', formatted);
      }
    }
  }, [electronicTazkira, tazkiraType, setValue]);

  const handleCopyStudentAddress = (checked: boolean) => {
    if (checked && studentAddress) {
      setValue('address', studentAddress.currentAddress);
      setValue('city', studentAddress.currentCity);
      setValue('district', studentAddress.currentDistrict);
      setValue('province', studentAddress.currentProvince);
      setValue('country', studentAddress.currentCountry);
      setValue('postal', studentAddress.currentPostal);
    }
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          type="button"
          onClick={() => onTabChange('father')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'father'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Father
        </button>
        <button
          type="button"
          onClick={() => onTabChange('mother')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'mother'
              ? 'border-b-2 border-pink-600 text-pink-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Mother
        </button>
      </div>

      {/* Personal Details */}
      <div className="grid grid-cols-3 gap-4">
        <FormField label="First Name">
          <input
            {...register('firstName', {
              maxLength: { value: 50, message: 'Max 50 chars' }
            })}
            className="input"
            maxLength={50}
          />
        </FormField>
        <FormField label="Last Name">
          <input
            {...register('lastName', {
              maxLength: { value: 50, message: 'Max 50 chars' }
            })}
            className="input"
            maxLength={50}
          />
        </FormField>
        <FormField label="Father's Name">
          <input
            {...register('fatherName', {
              maxLength: { value: 50, message: 'Max 50 chars' }
            })}
            className="input"
            maxLength={50}
          />
        </FormField>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Phone">
          <div className="relative">
            <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('phone', {
                pattern: { value: /^[0-9]{0,15}$/, message: 'Phone number must contain only digits (max 15 digits)' },
                validate: (value) => !value || validatePhone(value) || 'Invalid phone number format'
              })}
              type="tel"
              className="input pl-10"
              placeholder="مثال: 0700123456 یا 0799123456"
              maxLength={15}
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                e.currentTarget.value = formatPhoneNumber(e.currentTarget.value);
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  const sanitized = sanitizePhone(e.target.value);
                  if (sanitized !== e.target.value) {
                    setValue('phone', sanitized);
                  }
                }
              }}
            />
          </div>
        </FormField>
        <FormField label="Email">
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('email', {
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
              })}
              type="email"
              className="input pl-10"
            />
          </div>
        </FormField>
        <FormField label="Occupation">
          <div className="relative">
            <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('occupation', {
                maxLength: { value: 100, message: 'Max 100 chars' }
              })}
              className="input pl-10"
              maxLength={100}
            />
          </div>
        </FormField>
      </div>

      {/* Tazkira */}
      <div>
        <div className="flex gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input {...register('tazkiraType')} type="radio" value="electronic" className="radio" />
            Electronic Tazkira
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input {...register('tazkiraType')} type="radio" value="paper" className="radio" />
            Paper Tazkira
          </label>
        </div>

        {tazkiraType === 'electronic' ? (
          <FormField label="Electronic Tazkira">
            <input
              {...register('electronicTazkira')}
              className="input font-mono"
              placeholder="0000-0000-00000"
              maxLength={15}
            />
          </FormField>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <FormField label="Tazkira No">
              <input
                {...register('paperTazkiraNo')}
                className="input"
                maxLength={20}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                }}
              />
            </FormField>
            <FormField label="Volume">
              <input {...register('paperTazkiraVolume')} className="input" maxLength={20} />
            </FormField>
            <FormField label="Page">
              <input
                {...register('paperTazkiraPage')}
                className="input"
                maxLength={20}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                }}
              />
            </FormField>
            <FormField label="Record">
              <input
                {...register('paperTazkiraRecord')}
                className="input"
                maxLength={20}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                }}
              />
            </FormField>
          </div>
        )}
      </div>

      {/* Address */}
      <div className=" border-t pt-6 border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Address</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              {...register('sameAsStudent')}
              type="checkbox"
              className="checkbox"
              onChange={(e) => handleCopyStudentAddress(e.target.checked)}
            />
            <span className="text-gray-600">Same as student</span>
          </label>
        </div>
        <AddressFields register={register} prefix="" />
      </div>

      {/* Roles */}
      <div className="flex gap-6 py-4 bg-gray-50 px-4 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input {...register('isGuardian')} type="checkbox" className="checkbox" />
          Legal Guardian
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input {...register('isEmergencyContact')} type="checkbox" className="checkbox" />
          Emergency Contact
        </label>
      </div>

      <NavigationButtons onPrevious={onPrevious} isSubmitting={isSubmitting} />
    </form>
  );
};

// ==================== STEP 5: RELATIVES ====================

interface Step5Props {
  formData: StudentFormData;
  setFormData: React.Dispatch<React.SetStateAction<StudentFormData>>;
  onNext: () => void;
  onPrevious: () => void;
}

const Step5Relatives: React.FC<Step5Props> = ({ formData, setFormData, onNext, onPrevious }) => {
  const addRelative = (type: keyof Pick<StudentFormData, 'fatherUncles' | 'fatherCousins' | 'motherUncles' | 'motherCousins'>) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { fullName: '', fatherName: '', phone: '' }]
    }));
  };

  const removeRelative = (type: keyof Pick<StudentFormData, 'fatherUncles' | 'fatherCousins' | 'motherUncles' | 'motherCousins'>, index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const updateRelative = (
    type: keyof Pick<StudentFormData, 'fatherUncles' | 'fatherCousins' | 'motherUncles' | 'motherCousins'>,
    index: number,
    field: keyof Relative,
    value: string
  ) => {
    // Sanitize input based on field type
    let sanitizedValue = value;
    if (field === 'fullName' || field === 'fatherName') {
      sanitizedValue = sanitizeName(value);
    } else if (field === 'phone') {
      sanitizedValue = sanitizePhone(value);
    } else {
      sanitizedValue = sanitizeTextInput(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((rel, i) => i === index ? { ...rel, [field]: sanitizedValue } : rel)
    }));
  };

    const handleNext = () => {
    onNext(); // Just call onNext, auto-save is already working
  };


  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start gap-2">
          <FiAlertCircle className="text-blue-600 mt-0.5" />
          <p className="text-sm text-gray-700">
            Add relatives for emergency contacts and verification. Optional but recommended.
          </p>
        </div>
      </div>

      <RelativeSection
        title="Father's Side - Uncles"
        relatives={formData.fatherUncles}
        onAdd={() => addRelative('fatherUncles')}
        onRemove={(i) => removeRelative('fatherUncles', i)}
        onUpdate={(i, f, v) => updateRelative('fatherUncles', i, f, v)}
      />

      <RelativeSection
        title="Father's Side - Cousins"
        relatives={formData.fatherCousins}
        onAdd={() => addRelative('fatherCousins')}
        onRemove={(i) => removeRelative('fatherCousins', i)}
        onUpdate={(i, f, v) => updateRelative('fatherCousins', i, f, v)}
      />

      <RelativeSection
        title="Mother's Side - Uncles"
        relatives={formData.motherUncles}
        onAdd={() => addRelative('motherUncles')}
        onRemove={(i) => removeRelative('motherUncles', i)}
        onUpdate={(i, f, v) => updateRelative('motherUncles', i, f, v)}
      />

      <RelativeSection
        title="Mother's Side - Cousins"
        relatives={formData.motherCousins}
        onAdd={() => addRelative('motherCousins')}
        onRemove={(i) => removeRelative('motherCousins', i)}
        onUpdate={(i, f, v) => updateRelative('motherCousins', i, f, v)}
      />

      <div className="flex justify-between pt-4 border-t border-gray-300 ">
        <button type="button" onClick={onPrevious} className="btn-secondary bg-gray-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2">
          <FiChevronLeft />
          Previous
        </button>
        <button type="button" onClick={handleNext} className="btn-primary bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
          Continue
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

// ==================== STEP 6: DOCUMENTS ====================

interface Step6Props {
  defaultValues?: DocumentsInfo;
  onNext: (data: DocumentsInfo) => void;
  onPrevious: () => void;
}

const Step6Documents: React.FC<Step6Props> = ({ defaultValues, onNext, onPrevious }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<DocumentsInfo>({ defaultValues });

  const validateFile = (files: FileList | undefined, required: boolean = false) => {
    if (required && (!files || files.length === 0)) {
      return 'This document is required';
    }
    if (files && files.length > 0) {
      const file = files[0];
      if (!validateFileType(file, ALLOWED_FILE_TYPES)) {
        return `Invalid file type. Allowed: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`;
      }
      if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
        return `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`;
      }
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFileType(file, ALLOWED_FILE_TYPES)) {
        if (typeof window !== 'undefined' && window.logger) {
          window.logger.warn('Invalid file type selected', { fieldName, fileName: file.name, allowedTypes: ALLOWED_FILE_EXTENSIONS });
        }
        e.target.value = '';
        return;
      }
      if (!validateFileSize(file, MAX_FILE_SIZE_MB)) {
        if (typeof window !== 'undefined' && window.logger) {
          window.logger.warn('File size exceeds limit', { fieldName, fileName: file.name, fileSize: file.size, maxSize: MAX_FILE_SIZE_MB });
        }
        e.target.value = '';
        return;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <div className="flex items-start gap-2">
          <FiAlertCircle className="text-yellow-600 mt-0.5" />
          <p className="text-sm text-gray-700">
            Upload clear scans or photos. Accepted: PDF, JPG, PNG (Max {MAX_FILE_SIZE_MB}MB each)
          </p>
        </div>
      </div>

      <div className="space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <DocumentField label="Student's Tazkira" required error={errors.studentTazkira?.message}>
          <input
            {...register('studentTazkira', { 
              required: 'Student\'s Tazkira is required',
              validate: (files) => validateFile(files, true)
            })}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="input"
            onChange={(e) => handleFileChange(e, "Student's Tazkira")}
          />
        </DocumentField>

        <DocumentField label="Father's Tazkira" required error={errors.fatherTazkira?.message}>
          <input
            {...register('fatherTazkira', { 
              required: 'Father\'s Tazkira is required',
              validate: (files) => validateFile(files, true)
            })}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="input"
            onChange={(e) => handleFileChange(e, "Father's Tazkira")}
          />
        </DocumentField>

        <DocumentField label="Transfer Letter">
          <input
            {...register('transferLetter', {
              validate: (files) => validateFile(files, false)
            })}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="input"
            onChange={(e) => handleFileChange(e, "Transfer Letter")}
          />
        </DocumentField>

        <DocumentField label="Admission Letter">
          <input
            {...register('admissionLetter', {
              validate: (files) => validateFile(files, false)
            })}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="input"
            onChange={(e) => handleFileChange(e, "Admission Letter")}
          />
        </DocumentField>

        <DocumentField label="Academic Record">
          <input
            {...register('academicRecord', {
              validate: (files) => validateFile(files, false)
            })}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="input"
            onChange={(e) => handleFileChange(e, "Academic Record")}
          />
        </DocumentField>
      </div>

      <NavigationButtons onPrevious={onPrevious} isSubmitting={isSubmitting} />
    </form>
  );
};

// ==================== STEP 7: REVIEW ====================

interface Step7Props {
  formData: StudentFormData;
  onPrevious: () => void;
  onSubmit: () => void;
}

const Step7Review: React.FC<Step7Props> = ({ formData, onPrevious, onSubmit }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatValue = (value: any): string => {
    if (value === undefined || value === null || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded print:hidden">
        <div className="flex items-start gap-2">
          <FiCheckCircle className="text-green-600 mt-0.5" />
          <p className="text-sm text-gray-700">
            Review all information before final submission. You can go back to make changes.
          </p>
        </div>
      </div>

      {/* Print Header (only visible when printing) */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Student Registration Form</h1>
        <p className="text-sm text-gray-600 mt-2">
          Generated on: {new Date().toLocaleString()}
        </p>
        {formData.studentId && (
          <div className="mt-3 text-sm">
            <span className="font-semibold">Student ID:</span> {formData.studentId} | 
            <span className="font-semibold ml-3">Application ID:</span> {formData.applicationId} | 
            <span className="font-semibold ml-3">Admission Number:</span> {formData.admissionNumber}
          </div>
        )}
      </div>

      {/* Personal Information */}
      <ReviewSection title="Personal Information">
        <ReviewField label="First Name" value={formData.personal?.firstName} />
        <ReviewField label="Middle Name" value={formData.personal?.middleName} />
        <ReviewField label="Last Name" value={formData.personal?.lastName} />
        <ReviewField label="Dari Name" value={formData.personal?.dariName} />
        <ReviewField label="Phone Number" value={formData.personal?.phone} />
        <ReviewField label="Gender" value={formData.personal?.gender} />
        <ReviewField label="Date of Birth" value={formData.personal?.dob} />
        <ReviewField label="Tazkira Type" value={formData.personal?.tazkiraType} />
        {formData.personal?.tazkiraType === 'electronic' ? (
          <ReviewField label="Electronic Tazkira Number" value={formData.personal?.electronicTazkira} />
        ) : (
          <>
            <ReviewField label="Paper Tazkira Number" value={formData.personal?.paperTazkiraNo} />
            <ReviewField label="Paper Tazkira Volume" value={formData.personal?.paperTazkiraVolume} />
            <ReviewField label="Paper Tazkira Page" value={formData.personal?.paperTazkiraPage} />
            <ReviewField label="Paper Tazkira Record" value={formData.personal?.paperTazkiraRecord} />
          </>
        )}
        <ReviewField 
          label="Profile Picture" 
          value={formData.personal?.profilePicture?.[0]?.name} 
        />
      </ReviewSection>

      {/* Education Information */}
      <ReviewSection title="Education Information">
        <ReviewField label="Class" value={formData.education?.class} />
        <ReviewField label="Admission Date" value={formData.education?.admissionDate} />
        <ReviewField label="Expected Fee (AFN)" value={formData.education?.expectedFee} />
        <ReviewField label="Card Number" value={formData.education?.cardNumber} />
        <ReviewField label="Blood Group" value={formData.education?.bloodGroup} />
        <ReviewField label="Nationality" value={formData.education?.nationality} />
        <ReviewField label="Religion" value={formData.education?.religion} />
        <ReviewField label="Ethnicity" value={formData.education?.ethnicity} />
        <ReviewField label="Previous School" value={formData.education?.previousSchool} />
      </ReviewSection>

      {/* Origin Address */}
      <ReviewSection title="Origin Address">
        <ReviewField label="Address Line" value={formData.address?.originAddress} />
        <ReviewField label="District" value={formData.address?.originDistrict} />
        <ReviewField label="City" value={formData.address?.originCity} />
        <ReviewField label="Province" value={formData.address?.originProvince} />
        <ReviewField label="Country" value={formData.address?.originCountry} />
        <ReviewField label="Postal Code" value={formData.address?.originPostal} />
      </ReviewSection>

      {/* Current Address */}
      <ReviewSection title="Current Address">
        <ReviewField label="Address Line" value={formData.address?.currentAddress} />
        <ReviewField label="District" value={formData.address?.currentDistrict} />
        <ReviewField label="City" value={formData.address?.currentCity} />
        <ReviewField label="Province" value={formData.address?.currentProvince} />
        <ReviewField label="Country" value={formData.address?.currentCountry} />
        <ReviewField label="Postal Code" value={formData.address?.currentPostal} />
      </ReviewSection>

      {/* Father Information */}
      <ReviewSection title="Father Information">
        <ReviewField label="First Name" value={formData.father?.firstName} />
        <ReviewField label="Last Name" value={formData.father?.lastName} />
        <ReviewField label="Father's Name" value={formData.father?.fatherName} />
        <ReviewField label="Dari Name" value={formData.father?.dariName} />
        <ReviewField label="Phone" value={formData.father?.phone} />
        <ReviewField label="Email" value={formData.father?.email} />
        <ReviewField label="Gender" value={formData.father?.gender} />
        <ReviewField label="Date of Birth" value={formData.father?.dob} />
        <ReviewField label="Occupation" value={formData.father?.occupation} />
        <ReviewField label="Annual Income" value={formData.father?.annualIncome} />
        <ReviewField label="Education Level" value={formData.father?.educationLevel} />
        <ReviewField label="Employer" value={formData.father?.employer} />
        <ReviewField label="Designation" value={formData.father?.designation} />
        <ReviewField label="Work Phone" value={formData.father?.workPhone} />
        <ReviewField label="Emergency Contact" value={formData.father?.emergencyContact} />
        <ReviewField label="Tazkira Type" value={formData.father?.tazkiraType} />
        {formData.father?.tazkiraType === 'electronic' ? (
          <ReviewField label="Electronic Tazkira" value={formData.father?.electronicTazkira} />
        ) : (
          <>
            <ReviewField label="Paper Tazkira Number" value={formData.father?.paperTazkiraNo} />
            <ReviewField label="Paper Tazkira Volume" value={formData.father?.paperTazkiraVolume} />
            <ReviewField label="Paper Tazkira Page" value={formData.father?.paperTazkiraPage} />
            <ReviewField label="Paper Tazkira Record" value={formData.father?.paperTazkiraRecord} />
          </>
        )}
        <ReviewField label="Address" value={formData.father?.address} />
        <ReviewField label="District" value={formData.father?.district} />
        <ReviewField label="City" value={formData.father?.city} />
        <ReviewField label="Province" value={formData.father?.province} />
        <ReviewField label="Country" value={formData.father?.country} />
        <ReviewField label="Postal Code" value={formData.father?.postal} />
        <ReviewField label="Is Guardian" value={formData.father?.isGuardian} />
        <ReviewField label="Is Emergency Contact" value={formData.father?.isEmergencyContact} />
      </ReviewSection>

      {/* Mother Information */}
      <ReviewSection title="Mother Information">
        <ReviewField label="First Name" value={formData.mother?.firstName} />
        <ReviewField label="Last Name" value={formData.mother?.lastName} />
        <ReviewField label="Father's Name" value={formData.mother?.fatherName} />
        <ReviewField label="Dari Name" value={formData.mother?.dariName} />
        <ReviewField label="Phone" value={formData.mother?.phone} />
        <ReviewField label="Email" value={formData.mother?.email} />
        <ReviewField label="Gender" value={formData.mother?.gender} />
        <ReviewField label="Date of Birth" value={formData.mother?.dob} />
        <ReviewField label="Occupation" value={formData.mother?.occupation} />
        <ReviewField label="Annual Income" value={formData.mother?.annualIncome} />
        <ReviewField label="Education Level" value={formData.mother?.educationLevel} />
        <ReviewField label="Employer" value={formData.mother?.employer} />
        <ReviewField label="Designation" value={formData.mother?.designation} />
        <ReviewField label="Work Phone" value={formData.mother?.workPhone} />
        <ReviewField label="Emergency Contact" value={formData.mother?.emergencyContact} />
        <ReviewField label="Tazkira Type" value={formData.mother?.tazkiraType} />
        {formData.mother?.tazkiraType === 'electronic' ? (
          <ReviewField label="Electronic Tazkira" value={formData.mother?.electronicTazkira} />
        ) : (
          <>
            <ReviewField label="Paper Tazkira Number" value={formData.mother?.paperTazkiraNo} />
            <ReviewField label="Paper Tazkira Volume" value={formData.mother?.paperTazkiraVolume} />
            <ReviewField label="Paper Tazkira Page" value={formData.mother?.paperTazkiraPage} />
            <ReviewField label="Paper Tazkira Record" value={formData.mother?.paperTazkiraRecord} />
          </>
        )}
        <ReviewField label="Address" value={formData.mother?.address} />
        <ReviewField label="District" value={formData.mother?.district} />
        <ReviewField label="City" value={formData.mother?.city} />
        <ReviewField label="Province" value={formData.mother?.province} />
        <ReviewField label="Country" value={formData.mother?.country} />
        <ReviewField label="Postal Code" value={formData.mother?.postal} />
        <ReviewField label="Is Guardian" value={formData.mother?.isGuardian} />
        <ReviewField label="Is Emergency Contact" value={formData.mother?.isEmergencyContact} />
      </ReviewSection>

      {/* Relatives */}
      <ReviewSection title="Relatives Information">
        <div className="col-span-2">
          <h4 className="font-semibold text-gray-700 mb-2">Father's Side - Uncles</h4>
          {formData.fatherUncles.length > 0 ? (
            <div className="space-y-2">
              {formData.fatherUncles.map((uncle, idx) => (
                <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{idx + 1}.</span> {uncle.fullName || '-'} 
                  {' | Father: '}{uncle.fatherName || '-'}
                  {' | Phone: '}{uncle.phone || '-'}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No uncles added</p>
          )}
        </div>

        <div className="col-span-2">
          <h4 className="font-semibold text-gray-700 mb-2 mt-3">Father's Side - Cousins</h4>
          {formData.fatherCousins.length > 0 ? (
            <div className="space-y-2">
              {formData.fatherCousins.map((cousin, idx) => (
                <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{idx + 1}.</span> {cousin.fullName || '-'} 
                  {' | Father: '}{cousin.fatherName || '-'}
                  {' | Phone: '}{cousin.phone || '-'}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No cousins added</p>
          )}
        </div>

        <div className="col-span-2">
          <h4 className="font-semibold text-gray-700 mb-2 mt-3">Mother's Side - Uncles</h4>
          {formData.motherUncles.length > 0 ? (
            <div className="space-y-2">
              {formData.motherUncles.map((uncle, idx) => (
                <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{idx + 1}.</span> {uncle.fullName || '-'} 
                  {' | Father: '}{uncle.fatherName || '-'}
                  {' | Phone: '}{uncle.phone || '-'}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No uncles added</p>
          )}
        </div>

        <div className="col-span-2">
          <h4 className="font-semibold text-gray-700 mb-2 mt-3">Mother's Side - Cousins</h4>
          {formData.motherCousins.length > 0 ? (
            <div className="space-y-2">
              {formData.motherCousins.map((cousin, idx) => (
                <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{idx + 1}.</span> {cousin.fullName || '-'} 
                  {' | Father: '}{cousin.fatherName || '-'}
                  {' | Phone: '}{cousin.phone || '-'}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No cousins added</p>
          )}
        </div>
      </ReviewSection>

      {/* Documents */}
      <ReviewSection title="Documents Uploaded">
        <ReviewField 
          label="Student's Tazkira" 
          value={formData.documents?.studentTazkira?.[0]?.name} 
        />
        <ReviewField 
          label="Father's Tazkira" 
          value={formData.documents?.fatherTazkira?.[0]?.name} 
        />
        <ReviewField 
          label="Transfer Letter" 
          value={formData.documents?.transferLetter?.[0]?.name} 
        />
        <ReviewField 
          label="Admission Letter" 
          value={formData.documents?.admissionLetter?.[0]?.name} 
        />
        <ReviewField 
          label="Academic Record" 
          value={formData.documents?.academicRecord?.[0]?.name} 
        />
      </ReviewSection>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-300 print:hidden">
        <button 
          type="button" 
          onClick={onPrevious} 
          className="bg-gray-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <FiChevronLeft />
          Previous
        </button>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FiFileText />
            Print Form
          </button>
          
          <button
            type="button"
            onClick={onSubmit}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FiCheckCircle />
            Submit Registration
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== REUSABLE COMPONENTS ====================

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <FiAlertCircle className="text-sm" />
        {error}
      </p>
    )}
  </div>
);

const DocumentField: React.FC<FormFieldProps> = ({ label, required, error, children }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 " >
    <div className="flex items-center gap-2 mb-2">
      <FiFileText className="text-gray-600" />
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
    {children}
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <FiAlertCircle className="text-sm" />
        {error}
      </p>
    )}
  </div>
);

interface AddressFieldsProps {
  register: UseFormRegister<any>;
  prefix: string;
}

const AddressFields: React.FC<AddressFieldsProps> = ({ register, prefix }) => {
  const getFieldName = (field: string) => prefix ? `${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}` : field;

  return (
    <div className="space-y-4">
      <FormField label="Address Line">
        <input
          {...register(getFieldName('address'), {
            maxLength: { value: 200, message: 'Max 200 chars' }
          })}
          className="input"
          placeholder="House No, Street Name"
          maxLength={200}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="District">
          <input
            {...register(getFieldName('district'), {
              maxLength: { value: 50, message: 'Maximum 50 characters allowed' }
            })}
            type="text"
            autoComplete="address-level2"
            className="input"
            placeholder="مثال: دشت برچی، کارته سخی، پغمان"
            maxLength={50}
          />
        </FormField>
        <FormField label="City">
          <input
            {...register(getFieldName('city'), {
              maxLength: { value: 50, message: 'Maximum 50 characters allowed' }
            })}
            type="text"
            autoComplete="address-level1"
            className="input"
            placeholder="مثال: کابل، هرات، مزار شریف، قندهار"
            maxLength={50}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Province">
          <input
            {...register(getFieldName('province'), {
              maxLength: { value: 50, message: 'Maximum 50 characters allowed' }
            })}
            type="text"
            autoComplete="address-level1"
            className="input"
            placeholder="مثال: کابل، هرات، بلخ، قندهار، ننگرهار"
            maxLength={50}
          />
        </FormField>
        <FormField label="Postal Code">
          <input
            {...register(getFieldName('postal'), {
              maxLength: { value: 10, message: 'Maximum 10 characters allowed' }
            })}
            type="text"
            autoComplete="postal-code"
            inputMode="numeric"
            className="input"
            placeholder="مثال: 1001 (اختیاری)"
            maxLength={10}
          />
        </FormField>
      </div>
    </div>
  );
};

interface RelativeSectionProps {
  title: string;
  relatives: Relative[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Relative, value: string) => void;
}

const RelativeSection: React.FC<RelativeSectionProps> = ({ title, relatives, onAdd, onRemove, onUpdate }) => (
  <div className="border rounded-lg p-4 border-gray-300">
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <button
        type="button"
        onClick={onAdd}
        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
      >
        <FiUserPlus className="text-sm" />
        Add
      </button>
    </div>

    {relatives.length === 0 ? (
      <p className="text-sm text-gray-500 text-center">No relatives added yet</p>
    ) : (
      <div className="space-y-3">
        {relatives.map((rel, i) => (
          <div key={i} className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-3 gap-3 mb-2">
              <input
                value={rel.fullName}
                onChange={(e) => onUpdate(i, 'fullName', e.target.value)}
                placeholder="مثال: احمد احمدی، فاطمه کریمی"
                className="input text-sm"
                maxLength={100}
                onBlur={(e) => {
                  const sanitized = sanitizeName(e.target.value);
                  if (sanitized !== e.target.value) {
                    onUpdate(i, 'fullName', sanitized);
                  }
                }}
              />
              <input
                value={rel.fatherName}
                onChange={(e) => onUpdate(i, 'fatherName', e.target.value)}
                placeholder="مثال: محمد احمدی، علی کریمی"
                className="input text-sm"
                maxLength={100}
                onBlur={(e) => {
                  const sanitized = sanitizeName(e.target.value);
                  if (sanitized !== e.target.value) {
                    onUpdate(i, 'fatherName', sanitized);
                  }
                }}
              />
              <input
                value={rel.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  onUpdate(i, 'phone', formatted);
                }}
                placeholder="Enter phone number"
                className="input text-sm"
                maxLength={15}
                onBlur={(e) => {
                  const sanitized = sanitizePhone(e.target.value);
                  if (sanitized !== e.target.value) {
                    onUpdate(i, 'phone', sanitized);
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-red-600 text-xs hover:text-red-800 flex items-center gap-1"
            >
              <FiX className="text-sm" />
              Remove
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ==================== REVIEW COMPONENTS ====================

interface ReviewSectionProps {
  title: string;
  children: React.ReactNode;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ title, children }) => (
  <div className="border rounded-lg p-4 border-gray-300 break-inside-avoid">
    <h4 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300 text-lg">{title}</h4>
    <div className="grid grid-cols-2 gap-3">
      {children}
    </div>
  </div>
);

interface ReviewFieldProps {
  label: string;
  value: any;
}

const ReviewField: React.FC<ReviewFieldProps> = ({ label, value }) => {
  const formatValue = (val: any): string => {
    if (val === undefined || val === null || val === '') return '-';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number') return val.toString();
    return String(val);
  };

  return (
    <div className="text-sm break-inside-avoid">
      
      <span className="text-gray-600 font-medium">{label}:</span>
      <p className="text-gray-900 mt-0.5">{formatValue(value)}</p>
    </div>
  );
};

const NavigationButtons: React.FC<{ onPrevious: () => void }> = ({ onPrevious }) => (
  <div className="flex justify-between pt-4 border-t border-gray-300">
    <button type="button" onClick={onPrevious} className="btn-secondary bg-gray-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2">
      <FiChevronLeft />
      Previous
    </button>
    <button type="submit" className="btn-primary bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
      Continue
      <FiChevronRight />
    </button>
  </div>
);

// ==================== GLOBAL STYLES ====================

const GlobalStyles = () => (
  <style>{`
    .input {
      @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all text-sm;
    }
    .btn-primary {
      @apply bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2;
    }
    .btn-secondary {
      @apply bg-gray-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2;
    }
    .radio {
      @apply w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500;
    }
    .checkbox {
      @apply w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500;
    }
  `}</style>
);

// ==================== PRINT STYLES ====================

const PrintStyles = () => (
  <style>{`
    @media print {
      /* Hide everything except the review content */
      body * {
        visibility: hidden;
      }
      
      .print-container,
      .print-container * {
        visibility: visible;
      }
      
      .print-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }

      /* Hide print button and navigation */
      .print\\:hidden {
        display: none !important;
      }

      /* Show print-only elements */
      .print\\:block {
        display: block !important;
      }

      /* Page breaks */
      .break-inside-avoid {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      /* Adjust margins for print */
      @page {
        margin: 1cm;
      }

      /* Better table/grid printing */
      .grid {
        display: block !important;
      }

      .grid > div {
        display: inline-block;
        width: 48%;
        margin-bottom: 0.5rem;
        vertical-align: top;
      }

      /* Ensure borders print */
      .border,
      .border-gray-300,
      .border-b {
        border-color: #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Print backgrounds */
      .bg-gray-50 {
        background-color: #f9fafb !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `}</style>
);

export default Form2;