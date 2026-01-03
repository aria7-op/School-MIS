import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { STORAGE_KEYS } from '../constants';

// Create Auth Context
const AuthContext = createContext();

export { AuthProvider, useAuth } from './AuthContext.tsx';
export { default } from './AuthContext.tsx';

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
    getUserRole
  };
}; 