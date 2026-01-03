// API Configuration
export const API_CONFIG = {
  // Base URL for API calls
  BASE_URL: import.meta.env.VITE_API_URL || 'http://192.168.0.7:3000/api',
  
  // Development server configuration
  DEV_HOST: import.meta.env.VITE_DEV_HOST || '192.168.0.7',
  DEV_PORT: import.meta.env.VITE_DEV_PORT || '3000',
  
  // API endpoints
  ENDPOINTS: {
    PAYMENTS: '/payments',
    EXPENSES: '/expenses',
    PAYROLLS: '/payrolls',
    FINANCE_ANALYTICS: '/finance/analytics',
    FINANCE_STATS: '/finance/stats',
  },
  
  // Request configuration
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
};

export default API_CONFIG;