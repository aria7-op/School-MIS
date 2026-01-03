// Customer Feature Exports
export { default as customerService } from './services/customerService';
export { default as useCustomerApi } from './hooks/useCustomerApi';
export { default as CustomerServiceExample } from './components/CustomerServiceExample';

// Types
export type {
  Customer,
  CustomerResponse,
  CustomerFilters,
  CustomerPagination,
  CustomerAnalytics,
  CustomerCategory,
  CustomerEvent,
  CustomerConversionAnalytics,
  CustomerConversionStats,
  CustomerFormData,
  ApiResponse
} from './types/customer';

// Utils
export {
  decryptCustomerData,
  processCustomerAnalytics,
  getCustomerStats,
  filterCustomers,
  sortCustomers
} from './utils/customerDataUtils';
