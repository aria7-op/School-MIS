import secureApiService from '../../../services/secureApiService';
import {
  Owner,
  LoginResponse,
  PaginatedResponse,
  StatsResponse,
  ErrorResponse
} from '../types';
import { TEST_CONFIG, getAuthHeaders, isTestMode } from '../config/testConfig';

const API_BASE_URL = '/owners'; // Use relative path since apiClient has base URL

const handleError = (error: any): ErrorResponse => {
  if (error.response) {
    return error.response.data;
  }
  return { error: error.message || 'An unknown error occurred' };
};

const getHeaders = (token?: string) => {

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  return headers;
};

const ownerService = {
  // Health Check
  healthCheck: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await secureApiService.healthCheck();
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Authentication
  register: async (ownerData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    status?: string;
    timezone?: string;
    locale?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; data: { owner: Owner } }> => {
    try {
      const response = await secureApiService.post('/owners', ownerData);
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  login: async (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<LoginResponse> => {
    try {
      const response = await secureApiService.post('/owners/login', credentials);
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  refreshToken: async (refreshToken: string): Promise<{
    success: boolean;
    data: {
      accessToken: string;
      expiresIn: number;
    }
  }> => {
    try {
      const response = await secureApiService.post('/owners/refresh-token', { refreshToken });
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await secureApiService.post('/owners/logout');
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Profile Management
  getProfile: async (): Promise<{ success: boolean; data: Owner }> => {
    try {
      const response = await secureApiService.get('/owners/me');
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  updateProfile: async (updateData: Partial<Owner>): Promise<{ success: boolean; data: Owner }> => {
    try {
      const response = await secureApiService.put('/owners/me', updateData);
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await secureApiService.put('/owners/me/password', passwordData);
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Owner Management
  getAllOwners: async (params?: any): Promise<PaginatedResponse<Owner>> => {
    try {
      const response = await secureApiService.get('/owners', { params });
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  getOwnerById: async (ownerId: string): Promise<{ success: boolean; data: Owner }> => {
    try {
      const response = await secureApiService.get(`/owners/${ownerId}`);
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  createOwner: async (ownerData: Partial<Owner>): Promise<{ success: boolean; data: Owner }> => {
    try {
      const response = await secureApiService.post('/owners', ownerData);
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  updateOwner: async (ownerId: string, updateData: Partial<Owner>): Promise<{ success: boolean; data: Owner }> => {
    try {
      const response = await secureApiService.put(`/owners/${ownerId}`, updateData);
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  deleteOwner: async (ownerId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await secureApiService.delete(`/owners/${ownerId}`);
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Statistics
  getOwnerStats: async (): Promise<StatsResponse> => {
    try {
      const response = await secureApiService.get('/owners/stats');
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Bulk Operations
  bulkCreateOwners: async (owners: Partial<Owner>[]): Promise<{ success: boolean; data: Owner[] }> => {
    try {
      const response = await secureApiService.post('/owners/bulk', { owners });
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  bulkUpdateOwners: async (updates: { id: string; data: Partial<Owner> }[]): Promise<{ success: boolean; data: Owner[] }> => {
    try {
      const response = await secureApiService.put('/owners/bulk', { updates });
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  bulkDeleteOwners: async (ownerIds: string[]): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await secureApiService.delete('/owners/bulk', { data: { ownerIds } });
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Search and Filter
  searchOwners: async (query: string, filters?: any): Promise<PaginatedResponse<Owner>> => {
    try {
      const response = await secureApiService.get('/owners/search', { params: { query, ...filters } });
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Export/Import
  exportOwners: async (format: 'csv' | 'xlsx' | 'json' = 'csv'): Promise<{ success: boolean; data: string }> => {
    try {
      const response = await secureApiService.get('/owners/export', { params: { format } });
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  importOwners: async (fileData: any): Promise<{ success: boolean; data: { imported: number; errors: any[] } }> => {
    try {
      const response = await secureApiService.post('/owners/import', fileData);
      return response;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Test helpers
  getTestToken: () => TEST_CONFIG.TEST_TOKEN,
  getTestCredentials: () => TEST_CONFIG.TEST_CREDENTIALS,
  getTestOwner: () => TEST_CONFIG.TEST_OWNER
};

export default ownerService;
