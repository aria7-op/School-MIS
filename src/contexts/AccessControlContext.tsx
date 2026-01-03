import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import secureApiService from '../services/secureApiService';

// Types
export interface AccessibleComponent {
  id: string;
  name: string;
  permissions: string[];
  featureId: string;
}

export interface FilePermission {
  fileId: string;
  fileName: string;
  permissions: string[];
  userId: string;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  conditions?: any;
  context?: any;
}

export interface AccessControlContextType {
  // State
  accessibleComponents: AccessibleComponent[];
  filePermissions: FilePermission[];
  dataScopes: string[];
  loading: boolean;
  error: string | null;
  
  // Access checking methods
  checkAccess: (resource: string, action: string, context?: any) => Promise<boolean>;
  canAccessComponent: (componentId: string, action?: string) => boolean;
  canAccessFile: (fileId: string, action?: string) => boolean;
  hasDataScope: (scope: string) => boolean;
  
  // Permission checking
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  
  // Utility methods
  loadUserPermissions: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

// Context
const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

// Provider Component
export const AccessControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, hasPermission, hasRole } = useAuth();
  const [accessibleComponents, setAccessibleComponents] = useState<AccessibleComponent[]>([]);
  const [filePermissions, setFilePermissions] = useState<FilePermission[]>([]);
  const [dataScopes, setDataScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user permissions when user changes
  useEffect(() => {
    if (user) {
      loadUserPermissions();
    } else {
      // Clear permissions when user logs out
      setAccessibleComponents([]);
      setFilePermissions([]);
      setDataScopes([]);
    }
  }, [user]);

  const loadUserPermissions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Set data scopes from user object
      setDataScopes(user.dataScopes || []);

      // Load accessible components
      await fetchAccessibleComponents();

      // Load file permissions
      await fetchFilePermissions();

    } catch (error) {
      
      setError('Failed to load user permissions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAccessibleComponents = async () => {
    try {
      setLoading(true);
      const response = await secureApiService.fetchAllPermissions();
      if (response.success) {
        setAccessibleComponents(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching accessible components:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilePermissions = async () => {
    try {
      setLoading(true);
      const response = await secureApiService.fetchAllPermissions();
      if (response.success) {
        setFilePermissions(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching file permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = useCallback(async (resource: string, action: string, context: any = {}): Promise<boolean> => {
    try {

      const response = await secureApiService.checkAccess(resource, action, context);
      return response.allowed;
    } catch (error) {
      
      return false;
    }
  }, []);

  const canAccessComponent = useCallback((componentId: string, action: string = 'view'): boolean => {
    if (!user) return false;

    // Owner has access to everything
    if (user.role === 'owner') return true;

    // Check if component is in accessible components
    const component = accessibleComponents.find(c => c.id === componentId);
    if (!component) return false;

    // Check if user has the required permission
    return component.permissions.includes(action);
  }, [user, accessibleComponents]);

  const canAccessFile = useCallback((fileId: string, action: string = 'read'): boolean => {
    if (!user) return false;

    // Owner has access to everything
    if (user.role === 'owner') return true;

    // Check file permissions
    const filePermission = filePermissions.find(f => f.fileId === fileId);
    if (!filePermission) return false;

    return filePermission.permissions.includes(action);
  }, [user, filePermissions]);

  const hasDataScope = useCallback((scope: string): boolean => {
    if (!user || !user.dataScopes) return false;
    return user.dataScopes.includes('*') || user.dataScopes.includes(scope);
  }, [user]);

  const refreshPermissions = useCallback(async () => {
    await loadUserPermissions();
  }, [loadUserPermissions]);

  const contextValue: AccessControlContextType = {
    accessibleComponents,
    filePermissions,
    dataScopes,
    loading,
    error,
    checkAccess,
    canAccessComponent,
    canAccessFile,
    hasDataScope,
    hasPermission,
    hasRole,
    loadUserPermissions,
    refreshPermissions,
  };

  return (
    <AccessControlContext.Provider value={contextValue}>
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControl = (): AccessControlContextType => {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
};

export default AccessControlContext; 
