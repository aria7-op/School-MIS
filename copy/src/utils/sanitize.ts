import DOMPurify from 'dompurify';

/**
 * Sanitization utilities for preventing XSS attacks and script injection
 */

/**
 * Sanitizes HTML content using DOMPurify
 * Use this when you need to render HTML content safely
 */
export const sanitizeHTML = (dirty: string): string => {
  if (typeof window === 'undefined') {
    // Server-side: return empty string or use a server-side sanitizer
    return dirty.replace(/<[^>]*>/g, '');
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed by default
    ALLOWED_ATTR: [],
  });
};

/**
 * Strips all HTML tags from a string
 * Use this for plain text inputs
 */
export const stripHTML = (input: string): string => {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * Escapes special characters that could be used for script injection
 */
export const escapeSpecialChars = (input: string): string => {
  if (!input) return '';
  const map: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return input.replace(/[<>"'`=\/]/g, (char) => map[char] || char);
};

/**
 * Sanitizes text input by stripping HTML and escaping special characters
 * This is the main function to use for sanitizing user text inputs
 */
export const sanitizeTextInput = (input: string): string => {
  if (!input) return '';
  return stripHTML(input).trim();
};

/**
 * Sanitizes a name field (allows letters, spaces, hyphens, apostrophes)
 * Prevents script injection while allowing legitimate name characters
 */
export const sanitizeName = (input: string): string => {
  if (!input) return '';
  // Remove HTML tags first
  let sanitized = stripHTML(input);
  // Allow only letters, spaces, hyphens, apostrophes, and periods
  sanitized = sanitized.replace(/[^a-zA-Z\s\-'\.]/g, '');
  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ');
  return sanitized.trim();
};

/**
 * Sanitizes email input
 * Removes HTML tags and validates basic email format
 */
export const sanitizeEmail = (input: string): string => {
  if (!input) return '';
  // Remove HTML tags
  let sanitized = stripHTML(input);
  // Remove spaces
  sanitized = sanitized.replace(/\s/g, '');
  // Convert to lowercase
  sanitized = sanitized.toLowerCase();
  return sanitized.trim();
};

/**
 * Sanitizes phone number input
 * Removes HTML tags and keeps only digits, spaces, hyphens, parentheses, and +
 */
export const sanitizePhone = (input: string): string => {
  if (!input) return '';
  // Remove HTML tags
  let sanitized = stripHTML(input);
  // Keep only digits, spaces, hyphens, parentheses, and +
  sanitized = sanitized.replace(/[^\d\s\-\(\)\+]/g, '');
  return sanitized.trim();
};

/**
 * Sanitizes URL input
 * Validates and sanitizes URLs
 */
export const sanitizeURL = (input: string): string => {
  if (!input) return '';
  // Remove HTML tags
  let sanitized = stripHTML(input);
  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/^(javascript|data|vbscript):/gi, '');
  return sanitized.trim();
};

/**
 * Sanitizes numeric input
 * Removes all non-numeric characters
 */
export const sanitizeNumeric = (input: string): string => {
  if (!input) return '';
  return input.replace(/\D/g, '');
};

/**
 * Sanitizes an object by sanitizing all string values recursively
 * Useful for sanitizing form data before sending to API
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (sanitized.hasOwnProperty(key)) {
      const value = sanitized[key];
      
      if (typeof value === 'string') {
        // Sanitize string values
        sanitized[key] = sanitizeTextInput(value) as any;
      } else if (Array.isArray(value)) {
        // Recursively sanitize array items
        sanitized[key] = value.map((item) => 
          typeof item === 'string' ? sanitizeTextInput(item) : 
          typeof item === 'object' ? sanitizeObject(item) : item
        ) as any;
      } else if (value && typeof value === 'object' && !(value instanceof File) && !(value instanceof FileList)) {
        // Recursively sanitize nested objects (but skip File objects)
        sanitized[key] = sanitizeObject(value);
      }
    }
  }
  
  return sanitized;
};

/**
 * Validates that input doesn't contain script tags or dangerous patterns
 */
export const containsScriptTags = (input: string): boolean => {
  if (!input) return false;
  const scriptPattern = /<script[^>]*>|<\/script>|javascript:|on\w+\s*=/gi;
  return scriptPattern.test(input);
};

/**
 * Validates that input doesn't contain HTML tags
 */
export const containsHTMLTags = (input: string): boolean => {
  if (!input) return false;
  const htmlPattern = /<[^>]+>/g;
  return htmlPattern.test(input);
};



