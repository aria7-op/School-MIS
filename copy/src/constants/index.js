/**
 * Application Constants
 * Centralized configuration for the parking management system
 */

// User Roles (matching backend user_type)
export const USER_ROLES = {
  ADMIN: 1,           // Admin user (user_type = 1)
  IN_CAR_USER: 2,     // In car user (user_type = 2) 
  OUT_CAR_USER: 3,    // Out car user (user_type = 3)
  REJECT_PARKING: 4   // Reject parking user (user_type = 4)
};

// Backend Role IDs and their permissions
export const ROLE_PERMISSIONS = {
  // Role 4 - Parking Type Management
  4: ['view_parking_types', 'create_parking_type', 'edit_parking_type'],
  
  // Role 5 - Parking Type Management  
  5: ['view_parking_types', 'edit_parking_type'],
  
  // Role 6 - Parking Type View
  6: ['view_parking_types'],
  
  // Role 7 - Car Type Management
  7: ['view_car_types', 'create_car_type', 'edit_car_type', 'delete_car_type'],
  
  // Role 8 - Car Type Edit
  8: ['view_car_types', 'edit_car_type'],
  
  // Role 9 - Car Type View
  9: ['view_car_types'],
  
  // Role 11 - Car Type Fee Management
  11: ['view_car_type_fees', 'create_car_type_fee', 'edit_car_type_fee', 'delete_car_type_fee'],
  
  // Role 12 - Car Type Fee Edit
  12: ['view_car_type_fees', 'edit_car_type_fee'],
  
  // Role 14 - Income Management
  14: ['manage_income', 'view_income', 'create_income', 'edit_income', 'delete_income'],
  
  // Role 17 - Parking Reports
  17: ['view_parking_reports', 'view_reports'],
  
  // Role 19 - User Reports
  19: ['view_user_reports', 'view_reports'],
  
  // Role 20 - Income Reports
  20: ['view_income_reports', 'view_reports'],
  
  // Role 21 - Detailed Reports
  21: ['view_detailed_reports', 'view_reports'],
  
  // Role 22 - Car Reports
  22: ['view_car_reports', 'view_reports'],
  
  // Role 28 - Analysis Reports
  28: ['view_analysis_reports', 'view_reports']
};

// Permissions (Frontend permission names)
export const PERMISSIONS = {
  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  MANAGE_USERS: 'manage_users',
  
  // Car Type Management
  VIEW_CAR_TYPES: 'view_car_types',
  CREATE_CAR_TYPE: 'create_car_type',
  EDIT_CAR_TYPE: 'edit_car_type',
  DELETE_CAR_TYPE: 'delete_car_type',
  MANAGE_CAR_TYPES: 'manage_car_types',
  
  // Car Type Fee Management
  VIEW_CAR_TYPE_FEES: 'view_car_type_fees',
  CREATE_CAR_TYPE_FEE: 'create_car_type_fee',
  EDIT_CAR_TYPE_FEE: 'edit_car_type_fee',
  DELETE_CAR_TYPE_FEE: 'delete_car_type_fee',
  MANAGE_CAR_TYPE_FEES: 'manage_car_type_fees',
  
  // Parking Type Management
  VIEW_PARKING_TYPES: 'view_parking_types',
  CREATE_PARKING_TYPE: 'create_parking_type',
  EDIT_PARKING_TYPE: 'edit_parking_type',
  DELETE_PARKING_TYPE: 'delete_parking_type',
  MANAGE_PARKING_TYPES: 'manage_parking_types',
  
  // Income Management
  VIEW_INCOME: 'view_income',
  CREATE_INCOME: 'create_income',
  EDIT_INCOME: 'edit_income',
  DELETE_INCOME: 'delete_income',
  MANAGE_INCOME: 'manage_income',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  VIEW_PARKING_REPORTS: 'view_parking_reports',
  VIEW_USER_REPORTS: 'view_user_reports',
  VIEW_INCOME_REPORTS: 'view_income_reports',
  VIEW_DETAILED_REPORTS: 'view_detailed_reports',
  VIEW_CAR_REPORTS: 'view_car_reports',
  VIEW_ANALYSIS_REPORTS: 'view_analysis_reports',
  
  // Parking Management
  VIEW_PARKING: 'view_parking',
  CREATE_PARKING: 'create_parking',
  EDIT_PARKING: 'edit_parking',
  DELETE_PARKING: 'delete_parking',
  MANAGE_PARKING: 'manage_parking',
  
  // System Management
  MANAGE_SYSTEM: 'manage_system',
  VIEW_SETTINGS: 'view_settings',
  EDIT_SETTINGS: 'edit_settings'
};

// Card Types
export const CARD_TYPES = {
  REGULAR: 'regular',
  VIP: 'vip',
  TEMPORARY: 'temporary',
  DISABLED: 'disabled'
};

// Session Status
export const SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE: 'mobile',
  ONLINE: 'online'
};

const resolveApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const url =
      import.meta.env.VITE_API_URL ||
      import.meta.env.API_BASE_URL;
    if (url) {
      return url;
    }
  }

  if (typeof process !== 'undefined' && process.env) {
    const url =
      process.env.VITE_API_URL ||
      process.env.API_BASE_URL ||
      process.env.REACT_APP_API_BASE_URL;
    if (url) {
      return url;
    }
  }

  // Fallback to localhost for development
  console.warn('⚠️ Missing API base URL environment variable (set VITE_API_URL). Using fallback: http://localhost:3000');
  return 'http://localhost:3000';
};

// API Configuration
export const API_BASE_URL = resolveApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/users/login',
    LOGOUT: '/user/logout',
    PROFILE: '/user/user',
    REFRESH_TOKEN: '/auth/refresh'
  },
  USERS: '/users',
  USER: '/user',
  PARKING: '/parking',
  CAR_TYPES: '/cartype',
  CAR_TYPE_FEES: '/cartypefee',
  PARKING_TYPES: '/parkingtype',
  INCOME: '/income',
  NOTIFICATIONS: '/notification',
  REPORTS: '/report',
  IN_PARKING: '/inparking',
  OUT_PARKING: '/outparking',
  // Report endpoints
  REPORT_TOTAL_PARKING_STATUS_TRUE: '/report/total-parking-status-true',
  REPORT_TOTAL_PARKING_STATUS_FALSE: '/report/total-parking-status-false',
  REPORT_PARKING_STATUS_CARTYPE_TRUE: '/report/parking-status-cartype-true',
  REPORT_PARKING_STATUS_CARTYPE_FALSE: '/report/parking-status-cartype-false',
  REPORT_USER_STATUS_WORK_IN_SHIFT: '/report/user-status-work-in-shift',
  REPORT_USER_STATUS_WORK_OUT_SHIFT: '/report/user-status-work-out-shift',
  REPORT_PARKING_STATUS: '/report/parking-status',
  REPORT_USER_GET_ALL_RECORD: '/report/user-get-all-record',
  REPORT_DAILY_INCOME_USER_BASE: '/report/daily-income-user-base',
  REPORT_REPORT: '/report/report',
  REPORT_USER_LOG: '/report/user-log',
  REPORT_RECORD_ANALYSIS: '/report/record-analysis'
};

// Routes (for internal navigation)
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  CARDS: '/cards',
  SESSIONS: '/sessions',
  ZONES: '/zones',
  GATES: '/gates',
  PAYMENTS: '/payments',
  REPORTS: '/reports',
  AUDIT: '/audit',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  // Waziri specific routes
  CAR_SCANNER: '/car-scanner',
  CAMERA_CONTROL: '/camera-control'
};

// Navigation Items (Component-based)
export const NAVIGATION_ITEMS = {
  ADMIN: [
    {
      id: 'dashboard',
      title: 'داشبورد',
      icon: 'dashboard',
      component: 'Dashboard',
      permissions: []
    },
    {
      id: 'users',
      title: 'مدیریت کاربران',
      icon: 'users',
      component: 'UserManagement',
      permissions: [PERMISSIONS.VIEW_USERS]
    },
    {
      id: 'cards',
      title: 'مدیریت پارکینگ',
      icon: 'parking',
      component: 'CardManagement',
      permissions: [PERMISSIONS.VIEW_CARDS]
    },
    {
      id: 'sessions',
      title: 'مدیریت کتکوری موتر ها',
      icon: 'category',
      component: 'SessionManagement',
      permissions: [PERMISSIONS.VIEW_SESSIONS]
    },
    {
      id: 'zones',
      title: 'مدیریت نرخ کتکوری ها',
      icon: 'rates',
      component: 'ZoneManagement',
      permissions: [PERMISSIONS.VIEW_ZONES]
    },
    {
      id: 'payments',
      title: 'عواید',
      icon: 'revenue',
      component: 'PaymentManagement',
      permissions: [PERMISSIONS.VIEW_PAYMENTS]
    },
    {
      id: 'reports',
      title: 'گزارشات',
      icon: 'reports',
      component: 'Reports',
      permissions: [PERMISSIONS.VIEW_REPORTS]
    },
    {
      id: 'settings',
      title: 'تنظیمات',
      icon: 'settings',
      component: 'SystemSettings',
      permissions: [PERMISSIONS.MANAGE_SYSTEM]
    }
  ],
  WAZIRI: [
    {
      id: 'vehicle-scanner',
      title: 'اسکنر موتر',
      icon: 'camera',
      component: 'VehicleScanner',
      permissions: [PERMISSIONS.VIEW_CAR_SCANNER]
    },
    {
      id: 'camera-management',
      title: 'کنترل کمره',
      icon: 'camera-control',
      component: 'CameraManagement',
      permissions: [PERMISSIONS.CONTROL_CAMERA_1, PERMISSIONS.CONTROL_CAMERA_2]
    },
    {
      id: 'scanner-reports',
      title: 'گزارشات',
      icon: 'reports',
      component: 'ScannerReports',
      permissions: [PERMISSIONS.VIEW_REPORTS]
    }
  ]
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  PHONE: {
    PATTERN: /^\+?[\d\s\-\(\)]+$/
  },
  CARD_NUMBER: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 20,
    PATTERN: /^[A-Z0-9]+$/
  }
};

// System Configuration
export const SYSTEM_CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
  },
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf']
  }
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Theme Configuration
export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: '#0d6efd',
    SECONDARY: '#6c757d',
    SUCCESS: '#198754',
    DANGER: '#dc3545',
    WARNING: '#ffc107',
    INFO: '#0dcaf0',
    LIGHT: '#f8f9fa',
    DARK: '#212529'
  },
  FONTS: {
    PRIMARY: 'Calibri',
    SECONDARY: 'Arial, sans-serif'
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  }
};

// Camera Configuration (Waziri specific)
export const CAMERA_CONFIG = {
  CAMERA_1: {
    id: 'camera_1',
    name: 'کمره 1',
    type: 'webcam',
    permissions: [PERMISSIONS.CONTROL_CAMERA_1]
  },
  CAMERA_2: {
    id: 'camera_2',
    name: 'کمره 2',
    type: 'ip_camera',
    permissions: [PERMISSIONS.CONTROL_CAMERA_2]
  }
};

// Car Scanner States
export const SCANNER_STATES = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error'
}; 