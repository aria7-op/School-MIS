// ======================
// TYPES
// ======================
export * from './types';

// ======================
// SERVICES
// ======================
export { default as staffService } from './services/staffService';

// ======================
// CONTEXT & HOOKS
// ======================
export { useStaff, StaffProvider } from './contexts/StaffContext';
export {
  useStaffMember,
  useStaffStats,
  useStaffAnalytics,
  useStaffPerformance,
  useStaffCRUD,
  useStaffExportImport,
  useStaffReports,
  useStaffComparison,
  useStaffSearch
} from './hooks/useStaffApi';

// ======================
// COMPONENTS
// ======================
export { default as StaffCard } from './components/StaffCard';
export { default as StaffAnalyticsCard } from './components/StaffAnalyticsCard';
export { default as StaffCharts } from './components/StaffCharts';
export { default as BulkOperationsPanel } from './components/BulkOperationsPanel';
export { default as AdvancedSearchFilters } from './components/AdvancedSearchFilters';
export { default as StaffForm } from './components/StaffForm';

// ======================
// SCREENS
// ======================
export { default as StaffListScreen } from './screens/StaffListScreen';
export { default as StaffDetailScreen } from './screens/StaffDetailScreen';
export { default as StaffStatsScreen } from './screens/StaffStatsScreen';
export { default as StaffDashboardScreen } from './screens/StaffDashboardScreen';

// ======================
// UTILITIES
// ======================
export const STAFF_CONSTANTS = {
  GENDER_OPTIONS: [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' },
    { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' }
  ],
  
  STATUS_OPTIONS: [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Suspended', value: 'SUSPENDED' }
  ],
  
  ROLE_OPTIONS: [
    { label: 'Staff', value: 'STAFF' },
    { label: 'Teacher', value: 'TEACHER' },
    { label: 'Admin', value: 'SCHOOL_ADMIN' },
    { label: 'Accountant', value: 'ACCOUNTANT' },
    { label: 'Librarian', value: 'LIBRARIAN' }
  ],
  
  DOCUMENT_TYPES: [
    { label: 'ID Proof', value: 'ID_PROOF' },
    { label: 'Address Proof', value: 'ADDRESS_PROOF' },
    { label: 'Birth Certificate', value: 'BIRTH_CERTIFICATE' },
    { label: 'Transfer Certificate', value: 'TRANSFER_CERTIFICATE' },
    { label: 'Marksheet', value: 'MARKSHEET' },
    { label: 'Photograph', value: 'PHOTOGRAPH' },
    { label: 'Medical Certificate', value: 'MEDICAL_CERTIFICATE' },
    { label: 'Other', value: 'OTHER' }
  ],
  
  PAYMENT_METHODS: [
    { label: 'Cash', value: 'CASH' },
    { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
    { label: 'Cheque', value: 'CHEQUE' },
    { label: 'Online', value: 'ONLINE' }
  ],
  
  SALARY_RANGES: [
    { label: 'Low (< $30,000)', value: 'LOW' },
    { label: 'Medium ($30,000 - $80,000)', value: 'MEDIUM' },
    { label: 'High (> $80,000)', value: 'HIGH' }
  ],
  
  EXPORT_FORMATS: [
    { label: 'Excel (.xlsx)', value: 'excel' },
    { label: 'CSV (.csv)', value: 'csv' },
    { label: 'JSON (.json)', value: 'json' }
  ]
};

export const STAFF_VALIDATION = {
  USERNAME: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  
  EMAIL: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  PASSWORD: {
    required: true,
    minLength: 6,
    maxLength: 128
  },
  
  PHONE: {
    pattern: /^\+?[\d\s-()]+$/
  },
  
  FIRST_NAME: {
    required: true,
    minLength: 1,
    maxLength: 50
  },
  
  LAST_NAME: {
    required: true,
    minLength: 1,
    maxLength: 50
  },
  
  EMPLOYEE_ID: {
    pattern: /^[A-Z0-9]+$/
  },
  
  DESIGNATION: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  
  SALARY: {
    min: 0,
    max: 1000000
  },
  
  ACCOUNT_NUMBER: {
    pattern: /^\d{8,17}$/
  },
  
  IFSC_CODE: {
    pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/
  }
};

export const STAFF_HELPERS = {
  calculateExperience: (joiningDate: string): number => {
    if (!joiningDate) return 0;
    const joinDate = new Date(joiningDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  },

  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  formatDate: (date: string): string => {
    return new Date(date).toLocaleDateString();
  },

  getStatusColor: (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50';
      case 'INACTIVE':
        return '#F44336';
      case 'SUSPENDED':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  },

  getGenderIcon: (gender: string): string => {
    return gender === 'FEMALE' ? 'female' : 'male';
  },

  getGenderColor: (gender: string): string => {
    return gender === 'FEMALE' ? '#FF69B4' : '#1E90FF';
  },

  calculateSalaryRange: (salary: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' => {
    if (!salary) return 'UNKNOWN';
    if (salary < 30000) return 'LOW';
    if (salary < 80000) return 'MEDIUM';
    return 'HIGH';
  },

  generateEmployeeId: (firstName: string, lastName: string, designation: string): string => {
    const prefix = designation.substring(0, 3).toUpperCase();
    const nameCode = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${nameCode}${timestamp}`;
  }
}; 
