// ============================================================================
// API CONFIGURATION - SECURITY SETTINGS
// ============================================================================

export const API_CONFIG = {
  // Base URLs
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://khwanzay.school/api',
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || 'wss://khwanzay.school:4000',
  
  // Encryption Settings
  ENCRYPTION_KEY: import.meta.env.VITE_API_ENCRYPTION_KEY || 'your-secure-encryption-key-here',
  ENCRYPTION_ALGORITHM: 'AES-256-CBC',
  
  // Security Headers
  SECURITY_HEADERS: {
    'X-Client-Version': '1.0.0',
    'X-Request-Source': 'school-mis-frontend',
    'X-Security-Level': 'high',
  },
  
  // Timeout Settings
  TIMEOUTS: {
    REQUEST: 10000, // 10 seconds
    ANDROID_REQUEST: 30000, // 30 seconds for Android
    WEBSOCKET: 20000, // 20 seconds
  },
  
  // Retry Settings
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second
    BACKOFF_MULTIPLIER: 2,
  },
  
  // Cache Settings
  CACHE: {
    ENABLED: true,
    TTL: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 100, // Maximum number of cached items
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    ENABLED: true,
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_REQUESTS_PER_HOUR: 1000,
  },
  
  // Logging
  LOGGING: {
    ENABLED: import.meta.env.MODE === 'development',
    LEVEL: import.meta.env.MODE === 'development' ? 'debug' : 'error',
    SENSITIVE_FIELDS: ['password', 'token', 'secret', 'key'],
  },
  
  // Feature Flags
  FEATURES: {
    ENCRYPTION_ENABLED: true,
    COMPRESSION_ENABLED: true,
    CACHING_ENABLED: true,
    RETRY_ENABLED: true,
    RATE_LIMITING_ENABLED: true,
  },
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/users/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      PROFILE: '/auth/profile',
    },
    CUSTOMERS: {
      BASE: '/customers',
      ANALYTICS: '/customers/analytics',
      CONVERSION: '/customers/conversion-analytics',
    },
    STUDENTS: {
      BASE: '/students',
      CONVERSION: '/students/conversion-analytics',
      STATS: '/students/conversion-stats',
    },
    STAFF: {
      BASE: '/users',
      COLLABORATION: '/staff',
      DOCUMENTS: '/staff',
      TASKS: '/staff',
    },
    FINANCE: {
      PAYMENTS: '/payments',
      PAYROLLS: '/payrolls',
      EXPENSES: '/expenses',
      INCOMES: '/incomes',
      BUDGETS: '/budgets',
      FEE_STRUCTURES: '/fee-structures',
    },
    MESSAGING: {
      MESSAGES: '/messages',
      CONVERSATIONS: '/conversations',
    },
    ATTENDANCE: {
      BASE: '/attendance',
      ANALYTICS: '/attendance/analytics',
    },
    CLASSES: {
      BASE: '/classes',
    },
    ASSIGNMENTS: {
      BASE: '/assignments',
    },
    TEACHERS: {
      BASE: '/teachers',
    },
    OWNERS: {
      BASE: '/owners',
    },
    REPORTS: {
      BASE: '/reports',
      GENERATE: '/reports/generate',
      EXPORT: '/reports/export',
    },
    SETTINGS: {
      BASE: '/settings',
      SYSTEM: '/settings/system',
    },
    ANNOUNCEMENTS: {
      BASE: '/announcements',
    },
    GRADES: {
      BASE: '/grades',
    },
    EXAMS: {
      BASE: '/exams',
    },
    TIMETABLES: {
      BASE: '/timetables',
    },
    SUBJECTS: {
      BASE: '/subjects',
    },
    SCHOOLS: {
      BASE: '/schools',
    },
    RESOURCES: {
      BASE: '/resources',
    },
    PAYMENTS: {
      METHODS: '/payments/methods',
    },
    AUDIT: {
      LOGS: '/audit/logs',
    },
    RBAC: {
      PERMISSIONS: '/rbac/permissions',
      ROLES: '/rbac/roles',
      GROUPS: '/rbac/groups',
      ACCESS_CHECK: '/rbac/access/check',
    },
    HEALTH: '/health',
  },
};

// Environment-specific configurations
export const getApiConfig = () => {
  const isDevelopment = import.meta.env.MODE === 'development';
  const isProduction = import.meta.env.MODE === 'production';
  
  return {
    ...API_CONFIG,
    LOGGING: {
      ...API_CONFIG.LOGGING,
      ENABLED: isDevelopment,
      LEVEL: isDevelopment ? 'debug' : 'error',
    },
    FEATURES: {
      ...API_CONFIG.FEATURES,
      ENCRYPTION_ENABLED: isProduction,
      COMPRESSION_ENABLED: isProduction,
    },
  };
};

// Export default configuration
export default API_CONFIG; 