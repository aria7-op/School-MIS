import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  schoolId?: string;
  status?: string;
}

// Simple JWT decoder (since we don't want to add extra dependencies)
function decodeJWT(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const decoded = JSON.parse(jsonPayload);
    return {
      id: decoded.id || decoded.userId || decoded.sub || 'unknown',
      username: decoded.username || decoded.email || 'unknown',
      email: decoded.email || 'unknown',
      role: decoded.role || decoded.userRole || 'USER',
      firstName: decoded.firstName || decoded.name || '',
      lastName: decoded.lastName || '',
      schoolId: decoded.schoolId || '',
      status: decoded.status || 'ACTIVE'
    };
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

export function useAuth() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      setAuthToken(token);
      
      if (token) {
        // Decode the JWT token to get user info
        const decoded = decodeJWT(token);
        setUser(decoded);
        console.log('🔐 User decoded from token:', decoded);
      } else {
        setUser(null);
        console.log('❌ No token found');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (token: string) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setAuthToken(token);
      
      const decoded = decodeJWT(token);
      setUser(decoded);
      console.log('✅ Login successful, user:', decoded);
      
      return { success: true, user: decoded };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setAuthToken(null);
      setUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { 
    authToken, 
    user, 
    loading, 
    login,
    logout,
    refreshAuth: checkAuth 
  };
}
