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
    console.log('🔄 Loading state changed:', loading);
  }, [loading]);

  // Debug user state changes
  useEffect(() => {
    console.log('👤 User state changed:', { user: user?.id, token: !!userToken });
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
            console.log('JWT decode error during token check:', jwtError);
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
      
      console.log('🔐 Attempting login with secureApiService...');
      
      // Use secureApiService.login which handles encryption/decryption
      const response = await secureApiService.login({ email: username, password });
      
      console.log('📋 Login response:', response);
      console.log('📋 Response structure:', {
        success: response.success,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        hasToken: !!response.data?.token,
        tokenType: typeof response.data?.token,
        message: response.message
      });
      
      if (response.success && response.data?.token) {
        const token = response.data.token;
        
        // Decode JWT token to get user role
        let jwtRole = 'user';
        let userId = 'unknown';
        
        try {
          console.log('🔍 Decoding JWT token...');
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            jwtRole = payload.role || payload.userRole || 'user';
            userId = payload.userId || payload.sub || username;
            console.log('✅ JWT decoded:', { role: jwtRole, userId });
          } else {
            console.log('❌ Invalid JWT token format');
          }
        } catch (jwtError) {
          console.log('❌ Error decoding JWT token:', jwtError);
        }
        
        // Create user object from response data
        const userData: User = {
          id: userId,
          username: response.data.username || response.data.email || username,
          email: response.data.email || username,
          firstName: response.data.firstName || response.data.name?.split(' ')[0] || username.split('@')[0] || '',
          lastName: response.data.lastName || response.data.name?.split(' ').slice(1).join(' ') || '',
          role: response.data.role || response.data.userRole || jwtRole,
          permissions: response.data.permissions || response.data.metadata?.permissions || {},
          dataScopes: response.data.dataScopes || response.data.metadata?.dataScopes || ['*'],
          schoolId: response.data.schoolId || response.data.school?.id,
          department: response.data.department || response.data.metadata?.department,
          lastLogin: response.data.lastLogin || new Date().toISOString(),
          isActive: response.data.isActive || response.data.status === 'ACTIVE',
        };
        
        console.log('👤 Created user object:', userData);
        
        setUser(userData);
        setUserToken(token);
        
        // Store user data
        if (Platform.OS === 'web') {
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('userToken', token);
          console.log('💾 Stored user data in localStorage:', {
            user: localStorage.getItem('user'),
            userToken: localStorage.getItem('userToken')
          });
        } else {
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          await AsyncStorage.setItem('userToken', token);
        }
        
        // Store the new token in secureApiService
        await secureApiService.setAccessToken(token);
        
        console.log('✅ Login successful, user stored');
        console.log('🔍 Final state check:', {
          userState: userData,
          tokenState: token,
          localStorageUser: Platform.OS === 'web' ? localStorage.getItem('user') : 'N/A',
          localStorageToken: Platform.OS === 'web' ? localStorage.getItem('userToken') : 'N/A'
        });
        
        return { success: true };
      } else {
        const errorMessage = response.message || 'Login failed';
        console.log('❌ Login failed:', errorMessage);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      console.error('❌ Login error:', errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Clear all stored data using secureApiService
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
      
      console.log('✅ Logout successful');
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
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
      console.error('❌ Error updating user context:', error);
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
