import { useState, useEffect, useCallback } from 'react';
import userManagementService, { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserFilters 
} from '../services/userManagementService';

interface UseUserManagementReturn {
  // State
  users: User[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  
  // Actions
  loadUsers: (filters?: UserFilters) => Promise<void>;
  createUser: (userData: CreateUserRequest) => Promise<boolean>;
  updateUser: (userId: string, userData: UpdateUserRequest) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  toggleUserStatus: (userId: string, isActive: boolean) => Promise<boolean>;
  assignRole: (userId: string, roleId: string) => Promise<boolean>;
  removeRole: (userId: string, roleId: string) => Promise<boolean>;
  resetPassword: (userId: string, newPassword: string) => Promise<boolean>;
  searchUsers: (query: string, filters?: Omit<UserFilters, 'search'>) => Promise<void>;
  exportUsers: (filters?: UserFilters) => Promise<Blob | null>;
  getUserStats: () => Promise<any>;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
  validateUserData: (userData: Partial<CreateUserRequest>) => { isValid: boolean; errors: string[] };
  getAvailableRoles: () => any[];
}

export const useUserManagement = (): UseUserManagementReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadUsers = useCallback(async (filters?: UserFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userManagementService.getUsers(filters);
      
      if (response.success) {
        setUsers(Array.isArray(response.data) ? response.data : []);
        setTotal(response.total || 0);
        setCurrentPage(response.page || 1);
      } else {
        setError(response.message || 'Failed to load users');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: CreateUserRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Validate user data
      const validation = userManagementService.validateUserData(userData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return false;
      }

      const response = await userManagementService.createUser(userData);
      
      if (response.success) {
        // Reload users to show the new user
        await loadUsers();
        return true;
      } else {
        setError(response.message || 'Failed to create user');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      console.error('Error creating user:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  const updateUser = useCallback(async (userId: string, userData: UpdateUserRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userManagementService.updateUser(userId, userData);
      
      if (response.success) {
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, ...userData }
              : user
          )
        );
        return true;
      } else {
        setError(response.message || 'Failed to update user');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      console.error('Error updating user:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userManagementService.deleteUser(userId);
      
      if (response.success) {
        // Remove the user from local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setTotal(prevTotal => Math.max(0, prevTotal - 1));
        return true;
      } else {
        setError(response.message || 'Failed to delete user');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      console.error('Error deleting user:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleUserStatus = useCallback(async (userId: string, isActive: boolean): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userManagementService.toggleUserStatus(userId, isActive);
      
      if (response.success) {
        // Update the user status in local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, isActive }
              : user
          )
        );
        return true;
      } else {
        setError(response.message || 'Failed to update user status');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      setError(errorMessage);
      console.error('Error toggling user status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignRole = useCallback(async (userId: string, roleId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userManagementService.assignRole(userId, roleId);
      
      if (response.success) {
        // Update the user's role in local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, role: roleId }
              : user
          )
        );
        return true;
      } else {
        setError(response.message || 'Failed to assign role');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      setError(errorMessage);
      console.error('Error assigning role:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeRole = useCallback(async (userId: string, roleId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userManagementService.removeRole(userId, roleId);
      
      if (response.success) {
        // Reload users to get updated role information
        await loadUsers();
        return true;
      } else {
        setError(response.message || 'Failed to remove role');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
      setError(errorMessage);
      console.error('Error removing role:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  const resetPassword = useCallback(async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await userManagementService.resetPassword(userId, newPassword);
      
      if (response.success) {
        return true;
      } else {
        setError(response.message || 'Failed to reset password');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      console.error('Error resetting password:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchUsers = useCallback(async (query: string, filters?: Omit<UserFilters, 'search'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userManagementService.searchUsers(query, filters);
      
      if (response.success) {
        setUsers(Array.isArray(response.data) ? response.data : []);
        setTotal(response.total || 0);
        setCurrentPage(response.page || 1);
      } else {
        setError(response.message || 'Search failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Error searching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportUsers = useCallback(async (filters?: UserFilters): Promise<Blob | null> => {
    try {
      setLoading(true);
      setError(null);

      const blob = await userManagementService.exportUsers(filters);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      console.error('Error exporting users:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserStats = useCallback(async () => {
    try {
      setError(null);
      const response = await userManagementService.getUserStats();
      return response.success ? response.data : null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user stats';
      setError(errorMessage);
      console.error('Error getting user stats:', err);
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadUsers();
  }, [loadUsers]);

  const validateUserData = useCallback((userData: Partial<CreateUserRequest>) => {
    return userManagementService.validateUserData(userData);
  }, []);

  const getAvailableRoles = useCallback(() => {
    return userManagementService.getAvailableRoles();
  }, []);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    // State
    users,
    loading,
    error,
    total,
    currentPage,
    
    // Actions
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    assignRole,
    removeRole,
    resetPassword,
    searchUsers,
    exportUsers,
    getUserStats,
    
    // Utilities
    clearError,
    refresh,
    validateUserData,
    getAvailableRoles
  };
};

export default useUserManagement;