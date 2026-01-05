import { z } from 'zod';

// ======================
// HR VALIDATION UTILITIES
// ======================

/**
 * Afghanistan phone number validation
 */
export const validateAfghanistanPhone = (phone) => {
  if (!phone) return true; // Optional field
  
  const phonePattern = /^(\+93)?[0-9]{10}$/;
  return phonePattern.test(phone.replace(/\s/g, ''));
};

/**
 * Email validation with comprehensive checks
 */
export const validateEmail = (email) => {
  if (!email) return true; // Optional field
  
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Basic format check
  if (!emailPattern.test(email)) {
    return false;
  }
  
  // Additional checks
  const [localPart, domain] = email.split('@');
  
  // Local part should not start or end with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }
  
  // No consecutive dots
  if (localPart.includes('..') || domain.includes('..')) {
    return false;
  }
  
  // Domain should have at least one dot
  if (!domain.includes('.')) {
    return false;
  }
  
  return true;
};

/**
 * Salary validation
 */
export const validateSalary = (salary) => {
  if (salary === null || salary === undefined) return true; // Optional field
  
  const numSalary = Number(salary);
  
  // Must be a positive number
  if (isNaN(numSalary) || numSalary <= 0) {
    return false;
  }
  
  // Reasonable range (1 to 10 million AFN)
  if (numSalary > 10000000) {
    return false;
  }
  
  return true;
};

/**
 * Date validation
 */
export const validateDate = (dateString) => {
  if (!dateString) return true; // Optional field
  
  const date = new Date(dateString);
  
  // Check if valid date
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // Check if date is not too far in the past or future
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago
  const maxDate = new Date(now.getFullYear() + 10, 11, 31); // 10 years in future
  
  if (date < minDate || date > maxDate) {
    return false;
  }
  
  return true;
};

/**
 * Experience validation
 */
export const validateExperience = (experience) => {
  if (experience === null || experience === undefined) return true; // Optional field
  
  const numExperience = Number(experience);
  
  // Must be a non-negative number
  if (isNaN(numExperience) || numExperience < 0) {
    return false;
  }
  
  // Reasonable range (0 to 50 years)
  if (numExperience > 50) {
    return false;
  }
  
  return true;
};

/**
 * Validate subjects array
 */
export const validateSubjectsCanTeach = (subjects) => {
  if (!Array.isArray(subjects)) return false;
  
  // Check each subject
  for (const subject of subjects) {
    if (typeof subject !== 'string' || subject.trim().length === 0) {
      return false;
    }
    
    // Subject name should be reasonable length
    if (subject.length > 100) {
      return false;
    }
  }
  
  // Maximum 10 subjects
  if (subjects.length > 10) {
    return false;
  }
  
  return true;
};

/**
 * Validate relatives info array
 */
export const validateRelativesInfo = (relatives) => {
  if (!Array.isArray(relatives)) return false;
  
  for (const relative of relatives) {
    // Check required fields
    if (!relative.name || typeof relative.name !== 'string' || relative.name.trim().length === 0) {
      return false;
    }
    
    if (!relative.phone || typeof relative.phone !== 'string' || relative.phone.trim().length === 0) {
      return false;
    }
    
    if (!relative.relation || typeof relative.relation !== 'string' || relative.relation.trim().length === 0) {
      return false;
    }
    
    // Validate phone number
    if (!validateAfghanistanPhone(relative.phone)) {
      return false;
    }
    
    // Check reasonable lengths
    if (relative.name.length > 100 || relative.relation.length > 50) {
      return false;
    }
  }
  
  // Maximum 5 relatives
  if (relatives.length > 5) {
    return false;
  }
  
  return true;
};

/**
 * Validate course assignments
 */
export const validateCourseAssignments = (assignments) => {
  if (!Array.isArray(assignments)) return false;
  
  for (const assignment of assignments) {
    // Check required courseId
    if (!assignment.courseId) {
      return false;
    }
    
    // Validate role
    const validRoles = ['teacher', 'assistant', 'coordinator'];
    if (assignment.role && !validRoles.includes(assignment.role)) {
      return false;
    }
    
    // Validate salary if provided
    if (assignment.salary) {
      if (!validateSalary(assignment.salary.amount)) {
        return false;
      }
      
      const validSalaryTypes = ['fixed', 'percentage', 'hourly'];
      if (assignment.salary.type && !validSalaryTypes.includes(assignment.salary.type)) {
        return false;
      }
    }
    
    // Validate schedule if provided
    if (assignment.schedule) {
      const validShifts = ['morning', 'evening'];
      if (assignment.schedule.shift && !validShifts.includes(assignment.schedule.shift)) {
        return false;
      }
      
      if (assignment.schedule.days && !Array.isArray(assignment.schedule.days)) {
        return false;
      }
    }
  }
  
  // Maximum 10 assignments
  if (assignments.length > 10) {
    return false;
  }
  
  return true;
};

/**
 * Validate contract dates
 */
export const validateContractDates = (contractDates) => {
  if (!contractDates) return true; // Optional field
  
  // Check if it's an object
  if (typeof contractDates !== 'object' || contractDates === null) {
    return false;
  }
  
  // Start date is required
  if (!contractDates.startDate) {
    return false;
  }
  
  // Validate start date
  if (!validateDate(contractDates.startDate)) {
    return false;
  }
  
  // Validate end date if provided
  if (contractDates.endDate && !validateDate(contractDates.endDate)) {
    return false;
  }
  
  // Check if end date is after start date
  if (contractDates.startDate && contractDates.endDate) {
    const startDate = new Date(contractDates.startDate);
    const endDate = new Date(contractDates.endDate);
    
    if (endDate <= startDate) {
      return false;
    }
  }
  
  return true;
};

/**
 * Validate salary structure
 */
export const validateSalaryStructure = (salaryStructure) => {
  if (!salaryStructure) return true; // Optional field
  
  // Check if it's an object
  if (typeof salaryStructure !== 'object' || salaryStructure === null) {
    return false;
  }
  
  // Validate type
  const validTypes = ['fixed', 'percentage', 'hourly'];
  if (!salaryStructure.type || !validTypes.includes(salaryStructure.type)) {
    return false;
  }
  
  // Validate amount
  if (!validateSalary(salaryStructure.amount)) {
    return false;
  }
  
  // Validate currency (optional, default AFN)
  if (salaryStructure.currency && typeof salaryStructure.currency !== 'string') {
    return false;
  }
  
  return true;
};

/**
 * Validate course preferences
 */
export const validateCoursePreferences = (preferences) => {
  if (!preferences) return true; // Optional field
  
  // Check if it's an object
  if (typeof preferences !== 'object' || preferences === null) {
    return false;
  }
  
  // Validate preferred shifts
  if (preferences.preferredShifts) {
    if (!Array.isArray(preferences.preferredShifts)) {
      return false;
    }
    
    const validShifts = ['morning', 'evening'];
    for (const shift of preferences.preferredShifts) {
      if (!validShifts.includes(shift)) {
        return false;
      }
    }
  }
  
  // Validate max courses per term
  if (preferences.maxCoursesPerTerm !== undefined) {
    const maxCourses = Number(preferences.maxCoursesPerTerm);
    if (isNaN(maxCourses) || maxCourses < 1 || maxCourses > 10) {
      return false;
    }
  }
  
  // Validate preferred subjects
  if (preferences.preferredSubjects) {
    if (!validateSubjectsCanTeach(preferences.preferredSubjects)) {
      return false;
    }
  }
  
  // Validate preferred room types
  if (preferences.preferredRoomTypes) {
    if (!Array.isArray(preferences.preferredRoomTypes)) {
      return false;
    }
    
    for (const roomType of preferences.preferredRoomTypes) {
      if (typeof roomType !== 'string' || roomType.trim().length === 0) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Comprehensive HR field validation
 */
export const validateHRFields = (data) => {
  const errors = [];
  
  // Validate email
  if (data.email && !validateEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate phone
  if (data.phone && !validateAfghanistanPhone(data.phone)) {
    errors.push('Invalid Afghanistan phone number format');
  }
  
  // Validate salary
  if (data.salary !== undefined && !validateSalary(data.salary)) {
    errors.push('Salary must be a positive number');
  }
  
  // Validate birth date
  if (data.birthDate && !validateDate(data.birthDate)) {
    errors.push('Invalid birth date');
  }
  
  // Validate total experience
  if (data.totalExperience !== undefined && !validateExperience(data.totalExperience)) {
    errors.push('Total experience must be a non-negative number (0-50 years)');
  }
  
  // Validate subjects can teach
  if (data.subjectsCanTeach && !validateSubjectsCanTeach(data.subjectsCanTeach)) {
    errors.push('Invalid subjects can teach format');
  }
  
  // Validate relatives info
  if (data.relativesInfo && !validateRelativesInfo(data.relativesInfo)) {
    errors.push('Invalid relatives information format');
  }
  
  // Validate course assignments
  if (data.courseAssignments && !validateCourseAssignments(data.courseAssignments)) {
    errors.push('Invalid course assignments format');
  }
  
  // Validate contract dates
  if (data.contractDates && !validateContractDates(data.contractDates)) {
    errors.push('Invalid contract dates format');
  }
  
  // Validate salary structure
  if (data.salaryStructure && !validateSalaryStructure(data.salaryStructure)) {
    errors.push('Invalid salary structure format');
  }
  
  // Validate course preferences
  if (data.coursePreferences && !validateCoursePreferences(data.coursePreferences)) {
    errors.push('Invalid course preferences format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Role-specific field validation
 */
export const validateRoleSpecificFields = (role, data) => {
  const errors = [];
  
  switch (role) {
    case 'TEACHER':
    case 'SCHOOL_ADMIN':
      // Teachers must have subjects can teach
      if (!data.subjectsCanTeach || data.subjectsCanTeach.length === 0) {
        errors.push('Subjects can teach is required for teaching roles');
      }
      
      // Teachers should have relevant experience
      if (!data.relevantExperience || data.relevantExperience.trim().length === 0) {
        errors.push('Relevant experience is required for teaching roles');
      }
      break;
      
    case 'HRM':
    case 'BRANCH_MANAGER':
      // Management roles should have total experience
      if (data.totalExperience === undefined || data.totalExperience < 2) {
        errors.push('Management roles require at least 2 years of experience');
      }
      break;
      
    case 'ACCOUNTANT':
    case 'LIBRARIAN':
    case 'CRM_MANAGER':
      // Staff roles should have designation
      if (!data.designation || data.designation.trim().length === 0) {
        errors.push('Designation is required for staff roles');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Document validation
 */
export const validateDocumentFiles = (documents) => {
  const errors = [];
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  for (const [docType, docInfo] of Object.entries(documents)) {
    if (docInfo) {
      // Check file type
      if (docInfo.type && !allowedTypes.includes(docInfo.type)) {
        errors.push(`Invalid file type for ${docType}`);
      }
      
      // Check file size
      if (docInfo.size && docInfo.size > maxSize) {
        errors.push(`File size too large for ${docType} (max 5MB)`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export all validation functions
export default {
  validateAfghanistanPhone,
  validateEmail,
  validateSalary,
  validateDate,
  validateExperience,
  validateSubjectsCanTeach,
  validateRelativesInfo,
  validateCourseAssignments,
  validateContractDates,
  validateSalaryStructure,
  validateCoursePreferences,
  validateHRFields,
  validateRoleSpecificFields,
  validateDocumentFiles
};
