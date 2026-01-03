import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import authService from '../services/authService';

// Auth Context
const AuthContext = createContext();

/**
 * Auth Provider Component
 * Provides authentication context to the entire application
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const isAuth = await authService.initialize();
        const currentUser = authService.getCurrentUser();
        
        setIsAuthenticated(isAuth);
        setUser(currentUser);
      } catch (err) {
        setError(err.message);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await authService.login(credentials);
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (passwordData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.changePassword(passwordData);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Permission checking functions
  const hasPermission = useCallback((permission) => {
    return authService.hasPermission(permission);
  }, []);

  const hasAnyPermission = useCallback((permissions) => {
    return authService.hasAnyPermission(permissions);
  }, []);

  const hasAllPermissions = useCallback((permissions) => {
    return authService.hasAllPermissions(permissions);
  }, []);

  // Role checking functions
  const isAdmin = useCallback(() => {
    return authService.isAdmin();
  }, []);

  const isOperator = useCallback(() => {
    return authService.isOperator();
  }, []);

  const isViewer = useCallback(() => {
    return authService.isViewer();
  }, []);

  // Get user info functions
  const getUserRole = useCallback(() => {
    return authService.getUserRole();
  }, []);

  const getUserPermissions = useCallback(() => {
    return authService.getUserPermissions();
  }, []);

  const getSessionInfo = useCallback(() => {
    return authService.getSessionInfo();
  }, []);

  // Validate session
  const validateSession = useCallback(async () => {
    try {
      const isValid = await authService.validateSession();
      if (!isValid) {
        setUser(null);
        setIsAuthenticated(false);
      }
      return isValid;
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    logout,
    updateProfile,
    changePassword,
    clearError,
    validateSession,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Role checks
    isAdmin,
    isOperator,
    isViewer,
    
    // User info
    getUserRole,
    getUserPermissions,
    getSessionInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Provides authentication state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * usePermission Hook
 * Hook for checking specific permissions
 */
export const usePermission = (permission) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

/**
 * usePermissions Hook
 * Hook for checking multiple permissions
 */
export const usePermissions = (permissions) => {
  const { hasAnyPermission, hasAllPermissions } = useAuth();
  
  return {
    hasAny: () => hasAnyPermission(permissions),
    hasAll: () => hasAllPermissions(permissions)
  };
};

/**
 * useRole Hook
 * Hook for checking user roles
 */
export const useRole = () => {
  const { isAdmin, isOperator, isViewer, getUserRole } = useAuth();
  
  return {
    isAdmin,
    isOperator,
    isViewer,
    getRole: getUserRole
  };
};

export default useAuth; 