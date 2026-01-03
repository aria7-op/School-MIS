import secureApiService from '../../../services/secureApiService';
import { Customer } from '../types/customer';

// Simple Customer Service for React + Vite
export class CustomerService {
  
  /**
   * Get all customers with optional parameters
   */
  async getAllCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    priority?: string;
    source?: string;
  }) {
    try {
      // Add cache-busting parameter to ensure fresh data
      const cacheBust = Date.now();
      const paramsWithCache = {
        ...params,
        _t: cacheBust // Cache busting timestamp
      };
      
      console.log('🔧 CustomerService: Fetching customers with cache bust:', cacheBust);
      const response = await secureApiService.getCustomers(paramsWithCache);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
        meta: response.meta
      };
    } catch (error: any) {
      console.error('❌ Error fetching customers:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch customers',
        meta: null
      };
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string | number) {
    try {
      const response = await secureApiService.getCustomerById(String(id));
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      console.error('❌ Error fetching customer by ID:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch customer'
      };
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(customerData: Partial<Customer>) {
    try {
      const response = await secureApiService.createCustomer(customerData);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      console.error('❌ Error creating customer:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to create customer'
      };
    }
  }

  /**
   * Update existing customer
   */
  async updateCustomer(id: string | number, customerData: Partial<Customer>) {
    try {
      const response = await secureApiService.updateCustomer(String(id), customerData);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      console.error('❌ Error updating customer:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to update customer'
      };
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string | number) {
    try {
      const response = await secureApiService.deleteCustomer(String(id));
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      console.error('❌ Error deleting customer:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to delete customer'
      };
    }
  }

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(params?: any) {
    try {
      const response = await secureApiService.getCustomerAnalytics(params);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      console.error('❌ Error fetching customer analytics:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch customer analytics'
      };
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string, filters?: any) {
    try {
      const params = {
        search: query,
        ...filters
      };
      const response = await secureApiService.getCustomers(params);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
        meta: response.meta
      };
    } catch (error: any) {
      console.error('❌ Error searching customers:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to search customers',
        meta: null
      };
    }
  }

  /**
   * Get customer conversion analytics
   */
  async getCustomerConversionAnalytics(period: string = 'monthly') {
    try {
      const response = await secureApiService.getCustomerConversionAnalytics(period);
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error: any) {
      console.error('❌ Error fetching conversion analytics:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch conversion analytics'
      };
    }
  }

  /**
   * Get unconverted customers
   */
  async getUnconvertedCustomers(page: number = 1, limit: number = 20) {
    try {
      const response = await secureApiService.getUnconvertedCustomers(page, limit);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
        meta: response.meta
      };
    } catch (error: any) {
      console.error('❌ Error fetching unconverted customers:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch unconverted customers',
        meta: null
      };
    }
  }
}

// Export singleton instance
export const customerService = new CustomerService();

// Export default
export default customerService;

