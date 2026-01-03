import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import secureApiService from '../services/secureApiService';

// Ultra Advanced Access Control Context
interface AccessControlContextType {
  // State
  userPermissions: any[];
  userRoles: string[];
  userGroups: string[];
  accessibleFeatures: string[];
  accessibleComponents: string[];
  loading: boolean;
  error: string | null;
  
  // Access checking methods
  canAccessFeature: (featureId: string) => boolean;
  canAccessComponent: (componentId: string, action?: string) => boolean;
  canPerformAction: (resource: string, action: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasGroup: (group: string) => boolean;
  
  // Utility methods
  loadUserAccess: () => Promise<void>;
  refreshAccess: () => Promise<void>;
  checkAccess: (resource: string, action: string, context?: any) => Promise<boolean>;
}

const UltraAdvancedAccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export const UltraAdvancedAccessControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [accessibleFeatures, setAccessibleFeatures] = useState<string[]>([]);
  const [accessibleComponents, setAccessibleComponents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user access when user changes
  useEffect(() => {
    if (user) {
      loadUserAccess();
    } else {
      // Clear access when user logs out
      setUserPermissions([]);
      setUserRoles([]);
      setUserGroups([]);
      setAccessibleFeatures([]);
      setAccessibleComponents([]);
    }
  }, [user]);

  const loadUserAccess = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load user's effective permissions
      const permissionsResponse = await secureApiService.fetchUserPermissions(user.id);
      setUserPermissions(permissionsResponse.data || []);

      // Load user's roles
      const rolesResponse = await secureApiService.fetchAllRoles();
      const userRolesData = rolesResponse.data || [];
      setUserRoles(userRolesData.map((role: any) => role.name));

      // Load user's groups
      const groupsResponse = await secureApiService.fetchAllPermissions();
      const userGroupsData = groupsResponse.data || [];
      setUserGroups(userGroupsData.map((group: any) => group.name));

      // Determine accessible features and components
      const accessibleFeaturesList = userPermissions
        .filter((perm: any) => perm.resource && perm.isActive)
        .map((perm: any) => perm.resource);
      setAccessibleFeatures([...new Set(accessibleFeaturesList)]);

      const accessibleComponentsList = userPermissions
        .filter((perm: any) => perm.componentId && perm.isActive)
        .map((perm: any) => perm.componentId);
      setAccessibleComponents([...new Set(accessibleComponentsList)]);

    } catch (error) {
      
      setError('Failed to load user access');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const canAccessFeature = useCallback((featureId: string): boolean => {
    if (!user) return false;

    // Owner has access to everything
    if (user.role === 'owner' || user.role === 'admin') return true;

    // Check if feature is in accessible features
    return accessibleFeatures.includes(featureId);
  }, [user, accessibleFeatures]);

  const canAccessComponent = useCallback((componentId: string, action: string = 'view'): boolean => {
    if (!user) return false;

    // Owner has access to everything
    if (user.role === 'owner' || user.role === 'admin') return true;

    // Check if component is accessible and user has the required action
    const hasComponentAccess = accessibleComponents.includes(componentId);
    const hasActionPermission = userPermissions.some((perm: any) => 
      perm.componentId === componentId && 
      perm.action === action && 
      perm.isActive
    );

    return hasComponentAccess && hasActionPermission;
  }, [user, accessibleComponents, userPermissions]);

  const canPerformAction = useCallback((resource: string, action: string): boolean => {
    if (!user) return false;

    // Owner can perform all actions
    if (user.role === 'owner' || user.role === 'admin') return true;

    // Check if user has permission for this resource and action
    return userPermissions.some((perm: any) => 
      perm.resource === resource && 
      perm.action === action && 
      perm.isActive
    );
  }, [user, userPermissions]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;

    // Owner has all permissions
    if (user.role === 'owner' || user.role === 'admin') return true;

    // Check if user has the specific permission
    return userPermissions.some((perm: any) => 
      perm.name === permission && perm.isActive
    );
  }, [user, userPermissions]);

  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;

    // Owner has all roles
    if (user.role === 'owner' || user.role === 'admin') return true;

    return userRoles.includes(role);
  }, [user, userRoles]);

  const hasGroup = useCallback((group: string): boolean => {
    if (!user) return false;

    // Owner is in all groups
    if (user.role === 'owner' || user.role === 'admin') return true;

    return userGroups.includes(group);
  }, [user, userGroups]);

  const checkAccess = useCallback(async (resource: string, action: string, context: any = {}): Promise<boolean> => {
    try {

      const response = await secureApiService.checkAccess(resource, action, context);
      
      return response.data?.allowed || false;
    } catch (error) {
      
      return false;
    }
  }, [user]);

  const refreshAccess = useCallback(async () => {
    await loadUserAccess();
  }, [loadUserAccess]);

  const value: AccessControlContextType = {
    userPermissions,
    userRoles,
    userGroups,
    accessibleFeatures,
    accessibleComponents,
    loading,
    error,
    canAccessFeature,
    canAccessComponent,
    canPerformAction,
    hasPermission,
    hasRole,
    hasGroup,
    loadUserAccess,
    refreshAccess,
    checkAccess
  };

  return (
    <UltraAdvancedAccessControlContext.Provider value={value}>
      {children}
    </UltraAdvancedAccessControlContext.Provider>
  );
};

export const useUltraAdvancedAccessControl = () => {
  const context = useContext(UltraAdvancedAccessControlContext);
  if (context === undefined) {
    throw new Error('useUltraAdvancedAccessControl must be used within an UltraAdvancedAccessControlProvider');
  }
  return context;
}; 
