// Validation utilities with script injection prevention
import { containsScriptTags, containsHTMLTags, sanitizeTextInput } from './sanitize';

/**
 * Validates that input doesn't contain script tags or dangerous patterns
 * Returns true if input is safe, false if it contains dangerous content
 */
export const validateNoScriptTags = (input: string): boolean => {
  if (!input) return true;
  return !containsScriptTags(input);
};

/**
 * Validates that input doesn't contain HTML tags
 */
export const validateNoHTMLTags = (input: string): boolean => {
  if (!input) return true;
  return !containsHTMLTags(input);
};

/**
 * Enhanced email validation with sanitization check
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  // Check for script tags first
  if (containsScriptTags(email) || containsHTMLTags(email)) {
    return false;
  }
  
  // Enhanced email regex - more strict
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Enhanced phone validation with sanitization check
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  
  // Check for script tags first
  if (containsScriptTags(phone) || containsHTMLTags(phone)) {
    return false;
  }
  
  // Remove spaces, hyphens, parentheses for validation
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(cleaned);
};

/**
 * Enhanced password validation with script injection check
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  // Check for script tags
  if (containsScriptTags(password)) {
    errors.push('Password cannot contain script tags or dangerous characters');
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special characters (but allow them in passwords)
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates required field with script injection check
 */
export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    // Check for script tags
    return !containsScriptTags(trimmed);
  }
  return value !== null && value !== undefined;
};

/**
 * Validates minimum length with script injection check
 */
export const validateMinLength = (value: string, minLength: number): boolean => {
  if (!value) return false;
  if (containsScriptTags(value)) return false;
  return value.length >= minLength;
};

/**
 * Validates maximum length with script injection check
 */
export const validateMaxLength = (value: string, maxLength: number): boolean => {
  if (!value) return true;
  if (containsScriptTags(value)) return false;
  return value.length <= maxLength;
};

/**
 * Validates name field (letters, spaces, hyphens, apostrophes only)
 */
export const validateName = (name: string): boolean => {
  if (!name) return false;
  
  // Check for script tags
  if (containsScriptTags(name) || containsHTMLTags(name)) {
    return false;
  }
  
  // Allow letters, spaces, hyphens, apostrophes, and periods
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  return nameRegex.test(name.trim());
};

/**
 * Validates username (alphanumeric and underscore only)
 */
export const validateUsername = (username: string): boolean => {
  if (!username) return false;
  
  // Check for script tags
  if (containsScriptTags(username) || containsHTMLTags(username)) {
    return false;
  }
  
  // Username: 3-50 chars, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
};

/**
 * Validates URL with protocol check
 */
export const validateURL = (url: string): boolean => {
  if (!url) return false;
  
  // Check for script tags
  if (containsScriptTags(url) || containsHTMLTags(url)) {
    return false;
  }
  
  // Check for dangerous protocols
  if (/^(javascript|data|vbscript):/gi.test(url)) {
    return false;
  }
  
  // URL validation
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validates numeric input
 */
export const validateNumeric = (value: string): boolean => {
  if (!value) return false;
  if (containsScriptTags(value)) return false;
  return /^\d+$/.test(value);
};

/**
 * Validates file type
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  if (!file || !allowedTypes.length) return false;
  
  // Check MIME type
  const mimeTypeValid = allowedTypes.some(type => {
    if (type.includes('*')) {
      // Handle wildcards like 'image/*'
      const baseType = type.split('/')[0];
      return file.type.startsWith(baseType + '/');
    }
    return file.type === type;
  });
  
  // Also check file extension as secondary validation
  const extension = file.name.split('.').pop()?.toLowerCase();
  const extensionValid = allowedTypes.some(type => {
    const ext = type.split('.').pop()?.toLowerCase();
    return ext === extension;
  });
  
  return mimeTypeValid || extensionValid;
};

/**
 * Validates file size
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  if (!file) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Comprehensive text input validation
 */
export const validateTextInput = (
  value: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    allowHTML?: boolean;
    pattern?: RegExp;
  } = {}
): { isValid: boolean; error?: string } => {
  const { required = false, minLength, maxLength, allowHTML = false, pattern } = options;
  
  if (required && (!value || value.trim().length === 0)) {
    return { isValid: false, error: 'This field is required' };
  }
  
  if (!value) {
    return { isValid: true };
  }
  
  // Check for script tags unless HTML is explicitly allowed
  if (!allowHTML && (containsScriptTags(value) || containsHTMLTags(value))) {
    return { isValid: false, error: 'Input contains invalid characters' };
  }
  
  if (minLength !== undefined && value.length < minLength) {
    return { isValid: false, error: `Minimum length is ${minLength} characters` };
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    return { isValid: false, error: `Maximum length is ${maxLength} characters` };
  }
  
  if (pattern && !pattern.test(value)) {
    return { isValid: false, error: 'Input format is invalid' };
  }
  
  return { isValid: true };
};
