import { useState, useCallback, useEffect } from 'react';
import { useRole } from '../contexts/RoleContext';
import { useAuth } from '../contexts/AuthContext';

// Granular Access Control Hooks

// Feature Access Hook
export const useFeatureAccess = (featureId: string, action: string = 'view') => {
  const { canAccessFeature, getAccessibleFeatures } = useRole();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const access = canAccessFeature(featureId, action);
        setHasAccess(access);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Access check failed');
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [featureId, action, user, canAccessFeature]);

  return { hasAccess, loading, error };
};

// Component Access Hook
export const useComponentAccess = (componentId: string, action: string = 'view') => {
  const { canAccessComponent, getAccessibleComponents } = useRole();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const access = canAccessComponent(componentId, action);
        setHasAccess(access);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Access check failed');
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [componentId, action, user, canAccessComponent]);

  return { hasAccess, loading, error };
};

// Feature List Hook
export const useFeatureList = () => {
  const { getAccessibleFeatures, features } = useRole();
  const { user } = useAuth();
  const [accessibleFeatures, setAccessibleFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccessibleFeatures([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const features = getAccessibleFeatures();
      setAccessibleFeatures(features);
    } catch (err) {
      
      setAccessibleFeatures([]);
    } finally {
      setLoading(false);
    }
  }, [user, getAccessibleFeatures]);

  return { accessibleFeatures, allFeatures: features, loading };
};

// Component List Hook
export const useComponentList = (featureId?: string) => {
  const { getAccessibleComponents, components } = useRole();
  const { user } = useAuth();
  const [accessibleComponents, setAccessibleComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccessibleComponents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const components = getAccessibleComponents(featureId);
      setAccessibleComponents(components);
    } catch (err) {
      
      setAccessibleComponents([]);
    } finally {
      setLoading(false);
    }
  }, [user, featureId, getAccessibleComponents]);

  return { accessibleComponents, allComponents: components, loading };
};

// Role Management Hook
export const useRoleManagement = () => {
  const { roles, selectedRole, setSelectedRole, getRoleById } = useRole();
  const { user } = useAuth();
  const [canManageRoles, setCanManageRoles] = useState(false);

  useEffect(() => {
    if (user) {
      setCanManageRoles(user.role === 'admin' || user.role === 'owner');
    }
  }, [user]);

  const selectRole = useCallback((roleId: string) => {
    const role = getRoleById(roleId);
    setSelectedRole(role || null);
  }, [getRoleById, setSelectedRole]);

  const clearSelectedRole = useCallback(() => {
    setSelectedRole(null);
  }, [setSelectedRole]);

  return {
    roles,
    selectedRole,
    canManageRoles,
    selectRole,
    clearSelectedRole,
    getRoleById,
  };
};

// Granular Conditional Rendering Hook
export const useGranularConditionalRender = () => {
  const { canAccessFeature, canAccessComponent } = useRole();

  const renderFeatureIf = useCallback((
    featureId: string, 
    action: string, 
    component: React.ReactNode, 
    fallback: React.ReactNode = null
  ) => {
    return canAccessFeature(featureId, action) ? component : fallback;
  }, [canAccessFeature]);

  const renderComponentIf = useCallback((
    componentId: string, 
    action: string, 
    component: React.ReactNode, 
    fallback: React.ReactNode = null
  ) => {
    return canAccessComponent(componentId, action) ? component : fallback;
  }, [canAccessComponent]);

  const renderFeatureWithComponents = useCallback((
    featureId: string,
    components: Array<{
      componentId: string;
      action: string;
      component: React.ReactNode;
      fallback?: React.ReactNode;
    }>
  ) => {
    if (!canAccessFeature(featureId, 'view')) {
      return null;
    }

    return components.map(({ componentId, action, component, fallback }) => 
      canAccessComponent(componentId, action) ? component : fallback
    );
  }, [canAccessFeature, canAccessComponent]);

  return {
    renderFeatureIf,
    renderComponentIf,
    renderFeatureWithComponents,
  };
};

// Advanced Access Control Hook
export const useAdvancedAccessControl = () => {
  const { user } = useAuth();
  const { roles, features, components } = useRole();
  const [accessMatrix, setAccessMatrix] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(false);

  const buildAccessMatrix = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const matrix = new Map<string, boolean>();

    // Build feature access matrix
    features.forEach(feature => {
      const hasAccess = roles.some(role => 
        role.name === user.role && 
        role.features.some(f => f.featureId === feature.id && f.accessLevel !== 'none')
      );
      matrix.set(`feature:${feature.id}`, hasAccess);
    });

    // Build component access matrix
    components.forEach(component => {
      const hasAccess = roles.some(role => 
        role.name === user.role && 
        role.components.some(c => c.componentId === component.id && c.accessLevel !== 'none')
      );
      matrix.set(`component:${component.id}`, hasAccess);
    });

    setAccessMatrix(matrix);
    setLoading(false);
  }, [user, roles, features, components]);

  useEffect(() => {
    buildAccessMatrix();
  }, [buildAccessMatrix]);

  const checkAccess = useCallback((resourceType: 'feature' | 'component', resourceId: string, action: string = 'view') => {
    const key = `${resourceType}:${resourceId}`;
    return accessMatrix.get(key) || false;
  }, [accessMatrix]);

  const getAccessibleResources = useCallback((resourceType: 'feature' | 'component') => {
    const resources: string[] = [];
    accessMatrix.forEach((hasAccess, key) => {
      if (key.startsWith(`${resourceType}:`) && hasAccess) {
        const resourceId = key.split(':')[1];
        resources.push(resourceId);
      }
    });
    return resources;
  }, [accessMatrix]);

  return {
    checkAccess,
    getAccessibleResources,
    accessMatrix,
    loading,
    refreshAccessMatrix: buildAccessMatrix,
  };
};

// Role-Based Navigation Hook
export const useRoleBasedNavigation = () => {
  const { getAccessibleFeatures, getAccessibleComponents } = useRole();
  const { user } = useAuth();

  const getNavigationItems = useCallback(() => {
    if (!user) return [];

    const accessibleFeatures = getAccessibleFeatures();
    const navigationItems = accessibleFeatures.map(feature => ({
      id: feature.id,
      name: feature.name,
      path: feature.path,
      icon: feature.icon,
      components: getAccessibleComponents(feature.id),
    }));

    return navigationItems;
  }, [user, getAccessibleFeatures, getAccessibleComponents]);

  const canNavigateTo = useCallback((path: string) => {
    if (!user) return false;

    // Admin/owner can navigate anywhere
    if (user.role === 'admin' || user.role === 'owner') return true;

    const accessibleFeatures = getAccessibleFeatures();
    return accessibleFeatures.some(feature => feature.path === path);
  }, [user, getAccessibleFeatures]);

  return {
    getNavigationItems,
    canNavigateTo,
  };
};

// Permission Debug Hook
export const usePermissionDebug = () => {
  const { user } = useAuth();
  const { roles, features, components } = useRole();

  const getDebugInfo = useCallback(() => {
    if (!user) return null;

    const userRole = roles.find(role => role.name === user.role);
    
    return {
      user: {
        id: user.id,
        role: user.role,
        permissions: user.permissions,
      },
      role: userRole,
      accessibleFeatures: features.filter(f => 
        userRole?.features.some(rf => rf.featureId === f.id && rf.accessLevel !== 'none')
      ),
      accessibleComponents: components.filter(c => 
        userRole?.components.some(rc => rc.componentId === c.id && rc.accessLevel !== 'none')
      ),
      allFeatures: features,
      allComponents: components,
    };
  }, [user, roles, features, components]);

  return {
    getDebugInfo,
    user,
    roles,
    features,
    components,
  };
}; 
