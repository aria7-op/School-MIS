import { useCallback } from 'react';
import { useUltraAdvancedAccessControl } from '../contexts/UltraAdvancedAccessControlContext';

// Ultra Advanced Access Control Hook
export const useAccessControl = () => {
  const accessControl = useUltraAdvancedAccessControl();

  // Feature-level access control
  const canViewFeature = useCallback((featureId: string) => {
    return accessControl.canAccessFeature(featureId);
  }, [accessControl]);

  const canEditFeature = useCallback((featureId: string) => {
    return accessControl.canPerformAction(featureId, 'edit');
  }, [accessControl]);

  const canDeleteFeature = useCallback((featureId: string) => {
    return accessControl.canPerformAction(featureId, 'delete');
  }, [accessControl]);

  const canCreateFeature = useCallback((featureId: string) => {
    return accessControl.canPerformAction(featureId, 'create');
  }, [accessControl]);

  // Component-level access control
  const canViewComponent = useCallback((componentId: string) => {
    return accessControl.canAccessComponent(componentId, 'view');
  }, [accessControl]);

  const canEditComponent = useCallback((componentId: string) => {
    return accessControl.canAccessComponent(componentId, 'edit');
  }, [accessControl]);

  const canDeleteComponent = useCallback((componentId: string) => {
    return accessControl.canAccessComponent(componentId, 'delete');
  }, [accessControl]);

  const canCreateComponent = useCallback((componentId: string) => {
    return accessControl.canAccessComponent(componentId, 'create');
  }, [accessControl]);

  // Action-based access control
  const canPerformAction = useCallback((resource: string, action: string) => {
    return accessControl.canPerformAction(resource, action);
  }, [accessControl]);

  // Permission-based access control
  const hasPermission = useCallback((permission: string) => {
    return accessControl.hasPermission(permission);
  }, [accessControl]);

  // Role-based access control
  const hasRole = useCallback((role: string) => {
    return accessControl.hasRole(role);
  }, [accessControl]);

  // Group-based access control
  const hasGroup = useCallback((group: string) => {
    return accessControl.hasGroup(group);
  }, [accessControl]);

  // Advanced access checking with context
  const checkAccess = useCallback(async (resource: string, action: string, context?: any) => {
    return await accessControl.checkAccess(resource, action, context);
  }, [accessControl]);

  // Bulk permission checking
  const hasAnyPermission = useCallback((permissions: string[]) => {
    return permissions.some(permission => accessControl.hasPermission(permission));
  }, [accessControl]);

  const hasAllPermissions = useCallback((permissions: string[]) => {
    return permissions.every(permission => accessControl.hasPermission(permission));
  }, [accessControl]);

  // Role hierarchy checking
  const hasRoleOrHigher = useCallback((role: string) => {
    const roleHierarchy = ['user', 'staff', 'teacher', 'admin', 'owner'];
    const userRoleIndex = roleHierarchy.indexOf(accessControl.userRoles[0] || 'user');
    const requiredRoleIndex = roleHierarchy.indexOf(role);
    
    return userRoleIndex >= requiredRoleIndex;
  }, [accessControl.userRoles]);

  // Feature category access
  const canAccessCategory = useCallback((category: string) => {
    return accessControl.accessibleFeatures.some(feature => 
      feature.startsWith(category)
    );
  }, [accessControl.accessibleFeatures]);

  // Component type access
  const canAccessComponentType = useCallback((componentType: string) => {
    return accessControl.accessibleComponents.some(component => 
      component.startsWith(componentType)
    );
  }, [accessControl.accessibleComponents]);

  return {
    // State
    userPermissions: accessControl.userPermissions,
    userRoles: accessControl.userRoles,
    userGroups: accessControl.userGroups,
    accessibleFeatures: accessControl.accessibleFeatures,
    accessibleComponents: accessControl.accessibleComponents,
    loading: accessControl.loading,
    error: accessControl.error,

    // Feature access
    canViewFeature,
    canEditFeature,
    canDeleteFeature,
    canCreateFeature,

    // Component access
    canViewComponent,
    canEditComponent,
    canDeleteComponent,
    canCreateComponent,

    // Action access
    canPerformAction,

    // Permission access
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Role access
    hasRole,
    hasRoleOrHigher,

    // Group access
    hasGroup,

    // Category access
    canAccessCategory,
    canAccessComponentType,

    // Advanced access
    checkAccess,

    // Utility methods
    loadUserAccess: accessControl.loadUserAccess,
    refreshAccess: accessControl.refreshAccess,
  };
}; 
