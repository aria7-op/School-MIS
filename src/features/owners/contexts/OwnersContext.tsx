import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ownerService from '../services/ownerService';
import { Owner, PaginatedResponse } from '../types';
import { TEST_CONFIG, isTestMode } from '../config/testConfig';

interface OwnersContextType {
  // State
  owners: Owner[];
  currentOwner: Owner | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: any | null;
  
  // Actions
  fetchOwners: (page?: number, search?: string, filters?: any) => Promise<void>;
  fetchOwnerById: (id: string) => Promise<Owner | null>;
  createOwner: (ownerData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updateOwner: (id: string, ownerData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteOwner: (id: string) => Promise<{ success: boolean; error?: string }>;
  fetchStats: () => Promise<void>;
  refreshOwners: () => Promise<void>;
  clearError: () => void;
  
  // Token management
  getToken: () => Promise<string | null>;
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
}

const OwnersContext = createContext<OwnersContextType | undefined>(undefined);

interface OwnersProviderProps {
  children: ReactNode;
}

export const OwnersProvider: React.FC<OwnersProviderProps> = ({ children }) => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [currentOwner, setCurrentOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState<any | null>(null);

  // Token management functions
  const getToken = async (): Promise<string | null> => {
    try {
      // In test mode, use the test token automatically
      if (isTestMode()) {
        return TEST_CONFIG.TEST_TOKEN;
      }
      
      // Otherwise, get from AsyncStorage
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      
      return null;
    }
  };

  const setToken = async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem('userToken', token);
    } catch (error) {
      
    }
  };

  const clearToken = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      
    }
  };

  // Fetch owners with pagination, search, and filtering
  const fetchOwners = useCallback(async (page = 1, search = '', filters = {}) => {
    try {

      setLoading(true);
      setError(null);
      
      const token = await getToken();

      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const queryParams: any = {
        page,
        limit: 10, // Use fixed limit instead of pagination.limit to avoid circular dependency
        sort: 'createdAt',
        order: 'desc',
        include: 'schools,createdUsers',
      };

      if (search) {
        queryParams.search = search;
      }

      if (filters.status) {
        queryParams.status = filters.status;
      }

      if (filters.emailVerified !== null && filters.emailVerified !== undefined) {
        queryParams.emailVerified = filters.emailVerified;
      }

      const response: PaginatedResponse<Owner> = await ownerService.getAllOwners(queryParams, token);

      // Validate response structure
      if (!response || !response.success) {
        throw new Error('Invalid response: request failed');
      }
      
      // Backend returns: { success: true, data: items[], pagination: {} }
      const items = response.data || [];
      const paginationData = response.pagination || { page: 1, limit: 10, total: items.length, totalPages: 1 };
      
      if (page === 1) {
        setOwners(items);
        console.log('Set initial owners:', items.length, 'items');
      } else {
        setOwners(prev => {
          const newOwners = [...prev, ...items];
          console.log('Added more owners:', newOwners.length, 'total items');
          return newOwners;
        });
      }

      setPagination(paginationData);

    } catch (error: any) {
      
      setError(error.error || 'Failed to fetch owners');
      
    } finally {
      setLoading(false);

    }
  }, []); // Remove pagination.limit from dependencies

  // Fetch single owner by ID
  const fetchOwnerById = useCallback(async (id: string): Promise<Owner | null> => {
    try {
      const token = await getToken();
      if (!token) {
        setError('No authentication token found');
        return null;
      }

      const response = await ownerService.getOwnerById(id, 'schools,createdUsers,auditLogs,sessions', token);
      return response.data;
    } catch (error: any) {
      setError(error.error || 'Failed to fetch owner details');
      
      return null;
    }
  }, []);

  // Create new owner
  const createOwner = useCallback(async (ownerData: any) => {
    try {
      setError(null);
      const response = await ownerService.register(ownerData);
      return { success: true, data: response.data };
    } catch (error: any) {
      const errorMessage = error.error || 'Failed to create owner';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update owner
  const updateOwner = useCallback(async (id: string, ownerData: any) => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await ownerService.updateOwner(id, ownerData, token);
      return { success: true, data: response.data };
    } catch (error: any) {
      const errorMessage = error.error || 'Failed to update owner';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Delete owner
  const deleteOwner = useCallback(async (id: string) => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      await ownerService.deleteOwner(id, token);
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.error || 'Failed to delete owner';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        return;
      }

      const response = await ownerService.getOwnerStats(token);
      setStats(response.data);
    } catch (error: any) {
      
    }
  }, []);

  // Refresh owners list
  const refreshOwners = useCallback(async () => {
    setRefreshing(true);
    await fetchOwners();
    await fetchStats();
    setRefreshing(false);
  }, [fetchOwners, fetchStats]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial data fetch
  useEffect(() => {

    fetchOwners();
    fetchStats();
  }, []);

  const value: OwnersContextType = {
    // State
    owners,
    currentOwner,
    loading,
    refreshing,
    error,
    pagination,
    stats,
    
    // Actions
    fetchOwners,
    fetchOwnerById,
    createOwner,
    updateOwner,
    deleteOwner,
    fetchStats,
    refreshOwners,
    clearError,
    
    // Token management
    getToken,
    setToken,
    clearToken,
  };

  return (
    <OwnersContext.Provider value={value}>
      {children}
    </OwnersContext.Provider>
  );
};

export const useOwners = () => {
  const context = React.useContext(OwnersContext);
  if (context === undefined) {
    throw new Error('useOwners must be used within an OwnersProvider');
  }
  return context;
}; 
