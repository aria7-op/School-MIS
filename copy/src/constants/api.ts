// API Configuration Constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://khwanzay.school/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'wss://khwanzay.school';

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  
  // Messaging
  MESSAGING: {
    CONVERSATIONS: '/conversations',
    MESSAGES: '/messages',
    GROUPS: '/groups',
  },
  
  // Students
  STUDENTS: {
    LIST: '/students',
    DETAILS: '/students/:id',
    CREATE: '/students',
    UPDATE: '/students/:id',
    DELETE: '/students/:id',
  },
  
  // Classes
  CLASSES: {
    LIST: '/classes',
    DETAILS: '/classes/:id',
    CREATE: '/classes',
    UPDATE: '/classes/:id',
    DELETE: '/classes/:id',
  },
  
  // Finance
  FINANCE: {
    PAYMENTS: '/payments',
    INVOICES: '/invoices',
    REPORTS: '/finance/reports',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Request Timeouts
export const TIMEOUTS = {
  DEFAULT: 10000, // 10 seconds
  UPLOAD: 30000,  // 30 seconds
  LONG_RUNNING: 60000, // 1 minute
} as const;
