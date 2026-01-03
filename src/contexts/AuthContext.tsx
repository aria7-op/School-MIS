import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import secureApiService from '../services/secureApiService';
import sessionManager from '../services/sessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: Record<string, boolean>;
  dataScopes: string[];
  schoolId?: string;
  department?: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAccessToken: (context?: any) => Promise<string>;
  updateUserContext: (context: any) => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasDataScope: (scope: string) => boolean;
  userToken: string | null;
  checkStoredTokens: () => Promise<void>;
}

export interface LoginCredentials {
  username: string;
  password: string;
  role?: string;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Debug loading state changes
  useEffect(() => {
    }, [loading]);

  // Debug user state changes
  useEffect(() => {
    }, [user, userToken]);

  const checkStoredTokens = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      const token = await secureApiService.getAccessToken();
      
      if (token) {
        // Try to get user data from storage
        let userData: User | null = null;
        
        if (Platform.OS === 'web') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            userData = JSON.parse(storedUser);
          }
        } else {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            userData = JSON.parse(storedUser);
          }
        }
        
        if (userData) {
          // Decode JWT token to get current role and update user data
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const jwtRole = payload.role || 'user';
              // Update user role if it's different
              if (userData.role !== jwtRole) {
                userData.role = jwtRole;
                
                // Update stored user data
                if (Platform.OS === 'web') {
                  localStorage.setItem('user', JSON.stringify(userData));
                } else {
                  await AsyncStorage.setItem('user', JSON.stringify(userData));
                }
              }
            }
          } catch (jwtError) {
            }
          
          setUser(userData);
          setUserToken(token);
          return;
        } else {
          // Clear invalid token
          await secureApiService.clearAccessToken();
          setUser(null);
          setUserToken(null);
          return;
        }
      } else {
        setUser(null);
        setUserToken(null);
        return;
      }
    } catch (error) {
      setUser(null);
      setUserToken(null);
      return;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    checkStoredTokens();
  }, [checkStoredTokens]);

  const login = async (username: string, password: string, role?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await secureApiService.login({ email: username, password });
      // The actual response structure has token and user at the top level
      // response = { success: true, message: "Login successful", token: "...", user: {...} }
      const token = (response as any).token || (response as any).data?.token || (response as any).data?.accessToken || (response as any).data?.jwt;
      
      if (response.success && token) {
        // Decode JWT token to get user role
        let jwtRole = 'user';
        try {
          console.log('Decoding JWT token...');
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            jwtRole = payload.role || 'user';
          } else {
            console.log('Invalid JWT token format');
          }
        } catch (jwtError) {
          console.log('Error decoding JWT token:', jwtError);
        }
        
        const userData: User = {
          id: (response as any).user?.id || (response as any).data?.id || (response as any).data?.userId || 'unknown',
          username: (response as any).user?.email || (response as any).data?.username || username,
          email: (response as any).user?.email || (response as any).data?.email || (response as any).data?.username || username,
          firstName: (response as any).user?.firstName || (response as any).data?.firstName || (response as any).data?.name?.split(' ')[0] || (response as any).data?.name || '',
          lastName: (response as any).user?.lastName || (response as any).data?.lastName || (response as any).data?.name?.split(' ').slice(1).join(' ') || '',
          role: (response as any).user?.role || (response as any).data?.role || (response as any).data?.userRole || jwtRole,
          permissions: (response as any).user?.permissions || (response as any).data?.permissions || (response as any).data?.metadata?.permissions || {},
          dataScopes: (response as any).user?.dataScopes || (response as any).data?.dataScopes || (response as any).data?.metadata?.dataScopes || ['*'],
          schoolId: (response as any).user?.schoolId || (response as any).data?.schoolId || (response as any).data?.school?.id || undefined,
          department: (response as any).user?.department || (response as any).data?.department || (response as any).data?.metadata?.department,
          lastLogin: (response as any).user?.lastLogin || (response as any).data?.lastLogin || new Date().toISOString(),
          isActive: (response as any).user?.isActive || (response as any).data?.isActive || (response as any).data?.status === 'ACTIVE',
        };
        
        console.log('Role debugging:', {
          responseUserRole: (response as any).user?.role,
          responseDataRole: (response as any).data?.role,
          responseDataUserRole: (response as any).data?.userRole,
          jwtRole: jwtRole,
          finalRole: userData.role
        });
        
        setUser(userData);
        setUserToken(token);
        
        // Ensure we have a valid user object even if the API didn't return complete user data
        if (!userData.id || userData.id === 'unknown') {
          const fallbackUserData: User = {
            ...userData,
            id: username, // Use username as ID if no ID provided
            username: username,
            email: username,
            firstName: username.split('@')[0] || username,
            lastName: '',
            role: jwtRole, // Use JWT role instead of 'user'
            permissions: {},
            dataScopes: ['*'],
            isActive: true,
          };
          setUser(fallbackUserData);
          }
        
        // Store user data
        if (Platform.OS === 'web') {
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('userToken', token);
          } else {
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          await AsyncStorage.setItem('userToken', token);
          }
        
        // Store the new token FIRST
        await secureApiService.setAccessToken(token);
        
        // Store user permissions for auto-login
        const permissionsToStore = {
          permissions: userData.permissions,
          dataScopes: userData.dataScopes,
          role: userData.role,
          userId: userData.id,
          schoolId: userData.schoolId,
          department: userData.department,
          lastLogin: userData.lastLogin,
          isActive: userData.isActive,
        };
        
        try {
          secureApiService.setUserPermissions(permissionsToStore);
        } catch (storageError) {
          // Failed to store user permissions
        }
        
        // Test backend connection after login
        try {
          await secureApiService.testBackendConnection();
        } catch (testError) {
          // Backend connection test failed
        }
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Clear all stored data using AsyncStorage
      await secureApiService.clearAccessToken();
      
      // Clear all storage data
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userToken');
        localStorage.removeItem('token');
        localStorage.removeItem('userPermissions');
        sessionStorage.clear();
      }
      
      setUser(null);
      setUserToken(null);
      setError(null);
      
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAccessToken = useCallback(async (context?: any): Promise<string> => {
    try {
      // Since the RBAC access token endpoint doesn't exist, we'll use the regular token refresh
      const token = await secureApiService.getAccessToken();
      if (token) {
        return token;
      } else {
        throw new Error('No access token available');
      }
    } catch (error) {
      throw new Error('Failed to refresh access token');
    }
  }, []);

  const updateUserContext = useCallback(async (context: any) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      await secureApiService.generateAccessToken({
        ...context,
        userId: user.id,
        contextUpdate: true,
      });
    } catch (error) {
      
      throw error;
    }
  }, [user]);

  // Permission checking methods
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions[permission] === true;
  }, [user]);

  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  const hasDataScope = useCallback((scope: string): boolean => {
    if (!user || !user.dataScopes) return false;
    return user.dataScopes.includes('*') || user.dataScopes.includes(scope);
  }, [user]);

  const isAuthenticated = !!user && !!userToken;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
        login,
        logout,
      refreshAccessToken,
      updateUserContext,
      isAuthenticated,
      hasPermission,
      hasRole,
      hasDataScope,
      userToken,
      checkStoredTokens,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
