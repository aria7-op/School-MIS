import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import secureApiService from '../services/secureApiService';

// Types for Granular Access Control
export interface Feature {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  isActive: boolean;
  components: Component[];
  permissions: string[];
  roles: string[];
}

export interface Component {
  id: string;
  name: string;
  description: string;
  path: string;
  featureId: string;
  isActive: boolean;
  permissions: string[];
  roles: string[];
  accessLevel: 'public' | 'restricted' | 'admin-only';
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  features: FeatureAccess[];
  components: ComponentAccess[];
  permissions: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureAccess {
  featureId: string;
  featureName: string;
  accessLevel: 'none' | 'view' | 'edit' | 'admin';
  components: ComponentAccess[];
}

export interface ComponentAccess {
  componentId: string;
  componentName: string;
  featureId: string;
  accessLevel: 'none' | 'view' | 'edit' | 'admin';
}

export interface RoleContextType {
  // State
  roles: Role[];
  features: Feature[];
  components: Component[];
  selectedRole: Role | null;
  loading: boolean;
  error: string | null;
  userPermissions: string[];
  
  // Access Checking
  canAccessFeature: (featureId: string, action?: string) => boolean;
  canAccessComponent: (componentId: string, action?: string) => boolean;
  getAccessibleFeatures: () => Feature[];
  getAccessibleComponents: (featureId?: string) => Component[];
  
  // Role Selection
  setSelectedRole: (role: Role | null) => void;
  getRoleById: (roleId: string) => Role | undefined;
  
  // Utility Functions
  getRoleDisplayName: (role: Role | null) => string;
  getRoleColor: (role: Role | null) => string;
  getRoleIcon: (role: Role | null) => string;
  
  // Permission Management
  loadUserPermissions: (user: any) => Promise<void>;
  retryPermissionsLoad: () => Promise<void>;
  forceReloadPermissions: () => Promise<void>;
}

// Helper functions
const getIconForResource = (resourceType: string): string => {
  const iconMap: { [key: string]: string } = {
    'STUDENT': 'account-group',
    'TEACHER': 'account-tie',
    'STAFF': 'account-multiple',
    'FINANCE': 'currency-usd',
    'MESSAGING': 'chatbubble',
    'DASHBOARD': 'view-dashboard',
    'SETTINGS': 'settings',
    'REPORTS': 'chart-bar',
    'ADMIN': 'shield-account',
    'SUPER_ADMIN': 'shield-crown',
    'SCHOOL_ADMIN': 'shield-account',
    'PARENT': 'account-child',
    'ACCOUNTANT': 'calculator',
    'LIBRARIAN': 'book-open'
  };
  return iconMap[resourceType] || 'cog';
};

// Default features based on permissions
const getDefaultFeatures = (): Feature[] => [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Main dashboard',
    path: '/dashboard',
    icon: 'view-dashboard',
          isActive: true,
          components: [],
    permissions: ['dashboard:view', 'student:read'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF', 'STUDENT']
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Academic management',
    path: '/academic',
    icon: 'school',
              isActive: true,
              components: [],
    permissions: ['student:read'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF', 'STUDENT']
  },
  {
    id: 'students',
    name: 'Students',
    description: 'Student management',
    path: '/students',
    icon: 'account-group',
          isActive: true,
          components: [],
    permissions: ['student:read', 'student:create', 'student:update', 'student:delete', 'student:export'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF', 'STUDENT']
  },
  {
    id: 'teachers',
    name: 'Teachers',
    description: 'Teacher management',
    path: '/teachers',
    icon: 'account-tie',
    isActive: true,
    components: [],
    permissions: ['teacher:read', 'teacher:create', 'teacher:update', 'teacher:delete'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN']
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Staff management',
    path: '/staff',
    icon: 'account-multiple',
    isActive: true,
    components: [],
    permissions: ['staff:read', 'staff:create', 'staff:update', 'staff:delete'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN']
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial management',
    path: '/finance',
    icon: 'currency-usd',
    isActive: true,
    components: [],
    permissions: ['finance:read', 'finance:create', 'finance:update', 'finance:delete'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT']
  },
  {
    id: 'messaging',
    name: 'Messaging',
    description: 'Internal messaging',
    path: '/messaging',
    icon: 'chatbubble',
    isActive: true,
    components: [],
    permissions: ['messaging:read', 'messaging:create'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF']
  },
  {
    id: 'classes',
    name: 'Classes',
    description: 'Class management',
    path: '/classes',
    icon: 'school',
    isActive: true,
    components: [],
    permissions: ['class:read', 'class:create', 'class:update', 'class:delete'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']
  },
  {
    id: 'subjects',
    name: 'Subjects',
    description: 'Subject management',
    path: '/subjects',
    icon: 'book-open',
    isActive: true,
    components: [],
    permissions: ['subject:read', 'subject:create', 'subject:update', 'subject:delete'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']
  },
  {
    id: 'attendance',
    name: 'Attendance',
    description: 'Attendance management',
    path: '/attendance',
    icon: 'calendar-check',
    isActive: true,
    components: [],
    permissions: ['attendance:read', 'attendance:create', 'attendance:update'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF']
  },
  {
    id: 'exams',
    name: 'Exams',
    description: 'Exam management',
    path: '/exams',
    icon: 'clipboard-text',
    isActive: true,
    components: [],
    permissions: ['exam:read', 'exam:create', 'exam:update', 'exam:delete'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Reports and analytics',
    path: '/reports',
    icon: 'chart-bar',
    isActive: true,
    components: [],
    permissions: ['report:read', 'report:create'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'System settings',
    path: '/settings',
    icon: 'settings',
    isActive: true,
    components: [],
    permissions: ['settings:read', 'settings:update'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'CRM_MANAGER']
  },
  {
    id: 'customers',
    name: 'Visitors',
    description: 'Visitor management',
    path: '/customers',
    icon: 'people',
    isActive: true,
    components: [],
    permissions: ['customer:read', 'customer:create', 'customer:update', 'customer:delete'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF', 'CRM_MANAGER', 'TEACHER']
  },
  {
    id: 'resources',
    name: 'Resources',
    description: 'Resource management',
    path: '/resources',
    icon: 'folder',
    isActive: true,
    components: [],
    permissions: ['resource:read', 'resource:create', 'resource:update'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF']
  },
  {
    id: 'documents',
    name: 'Documents',
    description: 'Document management',
    path: '/documents',
    icon: 'file-document',
    isActive: true,
    components: [],
    permissions: ['document:read', 'document:create', 'document:update'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF']
        },
        {
          id: 'admin',
    name: 'Admin Panel',
    description: 'Administrative panel',
    path: '/admin',
    icon: 'shield-crown',
          isActive: true,
          components: [],
    permissions: ['admin:read', 'admin:create', 'admin:update'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN']
  },
  {
    id: 'quantum-analytics',
    name: 'Quantum Analytics',
    description: 'Advanced analytics',
    path: '/quantum-analytics',
    icon: 'atom',
          isActive: true,
          components: [],
    permissions: ['analytics:read', 'analytics:create'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN']
  },
  {
    id: 'schools',
    name: 'Schools',
    description: 'School management',
    path: '/schools',
    icon: 'domain',
          isActive: true,
          components: [],
    permissions: ['school:read', 'school:create', 'school:update'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN']
  },
  {
    id: 'owners',
    name: 'Owners',
    description: 'Owner management',
    path: '/owners',
    icon: 'account',
    isActive: true,
    components: [],
    permissions: ['owner:read', 'owner:create', 'owner:update'],
    roles: ['SUPER_ADMIN']
  }
];

// Default components
const getDefaultComponents = (): Component[] => [
  {
    id: 'student-list',
    name: 'Student List',
    description: 'List of students',
    path: '/students/list',
    featureId: 'students',
    isActive: true,
    permissions: ['student:read'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF'],
    accessLevel: 'restricted'
  },
  {
    id: 'student-form',
    name: 'Student Form',
    description: 'Add/edit student',
    path: '/students/form',
    featureId: 'students',
    isActive: true,
    permissions: ['student:create', 'student:update'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF'],
    accessLevel: 'restricted'
  },
  {
    id: 'student-export',
    name: 'Student Export',
    description: 'Export student data',
    path: '/students/export',
    featureId: 'students',
    isActive: true,
    permissions: ['student:export'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF'],
    accessLevel: 'restricted'
  },
  {
    id: 'teacher-list',
    name: 'Teacher List',
    description: 'List of teachers',
    path: '/teachers/list',
    featureId: 'teachers',
    isActive: true,
    permissions: ['teacher:read'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
    accessLevel: 'restricted'
  },
  {
    id: 'finance-dashboard',
    name: 'Finance Dashboard',
    description: 'Financial overview',
    path: '/finance/dashboard',
    featureId: 'finance',
    isActive: true,
    permissions: ['finance:read'],
    roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'],
    accessLevel: 'restricted'
  }
];

// Context
const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Provider Component
export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [features, setFeatures] = useState<Feature[]>(getDefaultFeatures());
  const [components, setComponents] = useState<Component[]>(getDefaultComponents());
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  // Use ref to prevent infinite loops
  const permissionsLoadedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Load user permissions when user changes
  useEffect(() => {
    // Don't proceed if user is not available
    if (!user) {
      return;
    }
    
    if (!user.id) {
      return;
    }
    
    // Reset permissions loaded flag when user changes
    if (user && user.id && userIdRef.current !== user.id) {
      permissionsLoadedRef.current = false;
      userIdRef.current = user.id;
      retryCountRef.current = 0;
    }
    
    if (user && user.id && !permissionsLoadedRef.current) {
      // Add a longer delay to ensure user is fully set and token is available
      const timer = setTimeout(() => {
        loadUserPermissions(user);
      }, 500); // Increased delay to 500ms
      
      return () => clearTimeout(timer);
    }
  }, [user]); // Changed from [user?.id] to [user]

  // Retry mechanism for permissions loading
  useEffect(() => {
    const retryPermissions = async () => {
      if (user && user.id && !permissionsLoadedRef.current && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        
        // Wait a bit before retrying
        setTimeout(() => {
          loadUserPermissions(user);
        }, 2000 * retryCountRef.current); // Exponential backoff
      }
    };

    // Set up retry when error occurs
    if (error && error.includes('Authentication required') && retryCountRef.current < maxRetries) {
      retryPermissions();
    }
  }, [error, user]);

  // Set selected role based on user's role when user changes
  useEffect(() => {
    if (user && user.role) {
      const normalizedRoleName = (user.role || '').toUpperCase();
      // Set userPermissions from login response permissions object
      if (user.permissions && typeof user.permissions === 'object') {
        const perms = Object.keys(user.permissions).filter(key => user.permissions[key]);
        setUserPermissions(perms);
      }
      const userRole: Role = {
        id: normalizedRoleName,
        name: normalizedRoleName,
        description: `${normalizedRoleName} role`,
        isActive: true,
        features: [],
        components: [],
        permissions: userPermissions,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSelectedRole(userRole);
      
      // If user is set but permissions are not loaded, try to load them
      if (user.id && userPermissions.length === 0 && !permissionsLoadedRef.current) {
        setTimeout(() => {
          loadUserPermissions(user);
        }, 1000); // Wait a bit longer to ensure everything is ready
      }
      
      // If permissions are still not loaded after a while, use fallback permissions
      if (user.id && userPermissions.length === 0) {
        const fallbackPermissions = getFallbackPermissions(user.role);
        setUserPermissions(fallbackPermissions);
        permissionsLoadedRef.current = true;
      }
    }
  }, [user]);

  // Load user permissions from backend or use fallback
  const loadUserPermissions = useCallback(async (currentUser: any) => {
    
    if (!currentUser || permissionsLoadedRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, check if we have stored permissions as fallback
      const storedPermissions = secureApiService.getUserPermissions();

      // First, check if we have a valid token
      const token = await secureApiService.getAccessToken();
      if (!token) {
        
        // Use stored permissions as fallback
        if (storedPermissions && storedPermissions.permissions) {
          const fallbackPermissions = Object.keys(storedPermissions.permissions);
          setUserPermissions(fallbackPermissions);
          permissionsLoadedRef.current = true;
          setError(null);
          return;
        }
        
        setError('No authentication token available. Please login first.');
        // Don't set permissionsLoadedRef to true so it can retry when token becomes available
        return;
      }

      // Validate token format
      if (!secureApiService.isTokenValid()) {
        setError('Invalid authentication token. Please login again.');
        // Don't set permissionsLoadedRef to true so it can retry when token becomes available
        return;
      }

      // Try to fetch user permissions from the RBAC endpoint
      
      const response = await secureApiService.fetchUserPermissions(currentUser.id);
      
      if (response.success && response.data) {
        // Extract permission names from the response
        const permissionsArray = Array.isArray(response.data) ? response.data : [];
        
        const permissions = permissionsArray.map((p: any) => {
          // Handle the nested permission structure from backend
          if (p.permission && p.permission.name) {
            return p.permission.name;
          } else if (p.name) {
            return p.name;
          } else {
            return null;
          }
        }).filter(Boolean); // Remove null values
        
        if (permissions.length > 0) {
          setUserPermissions(permissions);
          permissionsLoadedRef.current = true;
          setError(null);
        } else {
          const fallbackPermissions = getFallbackPermissions(currentUser.role);
          setUserPermissions(fallbackPermissions);
          permissionsLoadedRef.current = true;
          setError(null);
        }
      } else {
        // Try to use stored permissions as fallback
        if (storedPermissions && storedPermissions.permissions) {
          const fallbackPermissions = Object.keys(storedPermissions.permissions);
          setUserPermissions(fallbackPermissions);
          permissionsLoadedRef.current = true;
          setError(null);
          return;
        }
        
        setError('Failed to load permissions from server');
        // Don't set permissionsLoadedRef to true so it can retry
        return;
      }
    } catch (error: any) {
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        setError('Authentication required. Please login to access permissions.');
        // Don't set permissionsLoadedRef to true so it can retry when user logs in
        return;
      }
      
      if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view permissions.');
        // Don't set permissionsLoadedRef to true so it can retry when permissions change
        return;
      }
      
      // For other errors, try to use stored permissions as fallback
      const storedPermissions = secureApiService.getUserPermissions();
      if (storedPermissions && storedPermissions.permissions) {
        const fallbackPermissions = Object.keys(storedPermissions.permissions);
        setUserPermissions(fallbackPermissions);
        permissionsLoadedRef.current = true;
        setError(null);
        return;
      }
      
      // For other errors, set a temporary error but allow fallback
      setError(`Failed to load permissions: ${error.message}`);
      const fallbackPermissions = getFallbackPermissions(currentUser.role);
      setUserPermissions(fallbackPermissions);
      permissionsLoadedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, []); // Keep empty dependency array to prevent infinite loops

  // Get fallback permissions based on user role
  const getFallbackPermissions = (role: string): string[] => {
    const rolePermissions: { [key: string]: string[] } = {
      'SUPER_ADMIN': [
        // Dashboard
        'dashboard:view',
        
        // Academic Management
        'student:read', 'student:create', 'student:update', 'student:delete', 'student:export',
        'teacher:read', 'teacher:create', 'teacher:update', 'teacher:delete', 'teacher:export',
        'class:read', 'class:create', 'class:update', 'class:delete', 'class:export',
        'attendance:read', 'attendance:create', 'attendance:update', 'attendance:export',
        'exam:read', 'exam:create', 'exam:update', 'exam:delete', 'exam:export',
        
        // Financial Management
        'finance:read', 'finance:create', 'finance:update', 'finance:delete', 'finance:export',
        'payment:read', 'payment:create', 'payment:update', 'payment:delete',
        
        // Communication
        'messaging:read', 'messaging:create', 'messaging:update', 'messaging:delete',
        
        // Content Management
        'subject:read', 'subject:create', 'subject:update', 'subject:delete',
        'resource:read', 'resource:create', 'resource:update', 'resource:delete',
        'document:read', 'document:create', 'document:update', 'document:delete',
        
        // Administrative
        'staff:read', 'staff:create', 'staff:update', 'staff:delete',
        'customer:read', 'customer:create', 'customer:update', 'customer:delete',
        'admin:read', 'admin:create', 'admin:update', 'admin:delete',
        
        // Analytics & Reporting
        'report:read', 'report:create', 'report:export',
        'analytics:read', 'analytics:create', 'analytics:export',
        
        // System Management
        'settings:read', 'settings:update',
        'audit:read', 'audit:export',
        'user:read', 'user:create', 'user:update', 'user:delete',
        'role:read', 'role:create', 'role:update', 'role:delete',
        'permission:read', 'permission:create', 'permission:update', 'permission:delete'
      ],
      'owner': [
        // Dashboard
        'dashboard:view',
        
        // Academic Management
        'student:read', 'student:create', 'student:update', 'student:delete', 'student:export',
        'teacher:read', 'teacher:create', 'teacher:update', 'teacher:delete', 'teacher:export',
        'class:read', 'class:create', 'class:update', 'class:delete', 'class:export',
        'attendance:read', 'attendance:create', 'attendance:update', 'attendance:export',
        'exam:read', 'exam:create', 'exam:update', 'exam:delete', 'exam:export',
        
        // Financial Management
        'finance:read', 'finance:create', 'finance:update', 'finance:delete', 'finance:export',
        'payment:read', 'payment:create', 'payment:update', 'payment:delete',
        
        // Communication
        'messaging:read', 'messaging:create', 'messaging:update', 'messaging:delete',
        
        // Content Management
        'subject:read', 'subject:create', 'subject:update', 'subject:delete',
        'resource:read', 'resource:create', 'resource:update', 'resource:delete',
        'document:read', 'document:create', 'document:update', 'document:delete',
        
        // Administrative
        'staff:read', 'staff:create', 'staff:update', 'staff:delete',
        'customer:read', 'customer:create', 'customer:update', 'customer:delete',
        'admin:read', 'admin:create', 'admin:update', 'admin:delete',
        
        // Analytics & Reporting
        'report:read', 'report:create', 'report:export',
        'analytics:read', 'analytics:create', 'analytics:export',
        
        // System Management
        'settings:read', 'settings:update',
        'audit:read', 'audit:export',
        'user:read', 'user:create', 'user:update', 'user:delete',
        'role:read', 'role:create', 'role:update', 'role:delete',
        'permission:read', 'permission:create', 'permission:update', 'permission:delete'
      ],
      'SCHOOL_ADMIN': [
        'dashboard:view',
        'student:read', 'student:create', 'student:update', 'student:export',
        'teacher:read', 'teacher:create', 'teacher:update',
        'class:read', 'class:create', 'class:update',
        'attendance:read', 'attendance:create', 'attendance:update',
        'exam:read', 'exam:create', 'exam:update',
        'finance:read', 'finance:create', 'finance:update',
        'messaging:read', 'messaging:create',
        'subject:read', 'subject:create', 'subject:update',
        'resource:read', 'resource:create', 'resource:update',
        'document:read', 'document:create', 'document:update',
        'staff:read', 'staff:create', 'staff:update',
        'customer:read', 'customer:create', 'customer:update',
        'report:read', 'report:create',
        'settings:read', 'settings:update'
      ],
      'TEACHER': [
        'dashboard:view',
        'student:read', 'student:create', 'student:update',
        'teacher:read', 'teacher:create', 'teacher:update', 'teacher:delete', 'teacher:restore',
        'teacher:bulk_create', 'teacher:bulk_update', 'teacher:bulk_delete',
        'teacher:export', 'teacher:import', 'teacher:analytics', 'teacher:stats',
        'teacher:search', 'teacher:performance',
        'class:read', 'class:create', 'class:update',
        'attendance:read', 'attendance:create', 'attendance:update',
        'exam:read', 'exam:create', 'exam:update',
        'messaging:read', 'messaging:create',
        'subject:read',
        'resource:read', 'resource:create', 'resource:update',
        'document:read', 'document:create', 'document:update',
        'report:read', 'report:create',
        'customer:read', 'customer:create', 'customer:update',
        'settings:read', 'settings:update'
      ],
      'STAFF': [
        'dashboard:view',
        'student:read',
        'attendance:read', 'attendance:create',
        'messaging:read', 'messaging:create',
        'resource:read',
        'document:read'
      ],
      'STUDENT': [
        'dashboard:view',
        'messaging:read', 'messaging:create'
      ],
      'ACCOUNTANT': [
        'dashboard:view',
        'finance:read', 'finance:create', 'finance:update',
        'payment:read', 'payment:create', 'payment:update',
        'report:read'
      ]
    };

    const permissions = rolePermissions[role] || [];
    return permissions;
  };

  // Access Checking based on actual user permissions
  const canAccessFeature = useCallback((featureId: string, action: string = 'view'): boolean => {
    if (!userPermissions.length) {
      return false;
    }
    if (userPermissions.includes('*')) return true;
    
      const feature = features.find(f => f.id === featureId);
    if (!feature) {
      return false;
    }

    // Check if user has any of the feature's permissions
    const hasPermission = feature.permissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    // If user has any of the feature's permissions, they can access it
    // The action parameter is not used in this implementation since we're checking feature-level permissions
    return hasPermission;
  }, [userPermissions, features]);

  const canAccessComponent = useCallback((componentId: string, action: string = 'view'): boolean => {
    if (!userPermissions.length) return false;
    if (userPermissions.includes('*')) return true;
    
      const component = components.find(c => c.id === componentId);
    if (!component) return false;
    
    // Check if user has any of the component's permissions
    const hasPermission = component.permissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) return false;
    
    // Check specific action permission
    const actionPermission = `${componentId}:${action}`;
    return userPermissions.includes(actionPermission) || userPermissions.includes('*');
  }, [userPermissions, components]);

  const getAccessibleFeatures = useCallback((): Feature[] => {
    
    const accessibleFeatures = features.filter(feature => {
      const canAccess = canAccessFeature(feature.id);
      return canAccess;
    });
    
    return accessibleFeatures;
  }, [features, canAccessFeature]);

  const getAccessibleComponents = useCallback((featureId?: string): Component[] => {
    let filteredComponents = components.filter(component => canAccessComponent(component.id));
    
    if (featureId) {
      filteredComponents = filteredComponents.filter(component => component.featureId === featureId);
    }
    
    return filteredComponents;
  }, [components, canAccessComponent]);

  // Role Selection
  const getRoleById = useCallback((roleId: string): Role | undefined => {
    return roles.find(role => role.id === roleId);
  }, [roles]);

  // Utility Functions
  const getRoleDisplayName = useCallback((role: Role | null): string => {
    if (!role) return 'Unknown Role';
    return role.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  const getRoleColor = useCallback((role: Role | null): string => {
    if (!role) return '#6B7280';
    
    const colorMap: { [key: string]: string } = {
      'SUPER_ADMIN': '#DC2626',
      'SCHOOL_ADMIN': '#2563EB',
      'TEACHER': '#059669',
      'STAFF': '#7C3AED',
      'STUDENT': '#EA580C',
      'PARENT': '#DB2777',
      'ACCOUNTANT': '#0891B2',
      'LIBRARIAN': '#65A30D'
    };
    
    return colorMap[role.name] || '#6B7280';
  }, []);

  const getRoleIcon = useCallback((role: Role | null): string => {
    if (!role) return 'account';
    return getIconForResource(role.name);
  }, []);

  const retryPermissionsLoad = useCallback(async () => {
    if (user && user.id) {
      if (!permissionsLoadedRef.current && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        
        // Wait a bit before retrying
        setTimeout(() => {
          loadUserPermissions(user);
        }, 2000 * retryCountRef.current); // Exponential backoff
      } else {
        return;
      }
    } else {
      return;
    }
  }, [user, loadUserPermissions, maxRetries]);

  // Debug function to force reload permissions
  const forceReloadPermissions = useCallback(async () => {
    
    if (user && user.id) {
      // Reset the loaded flag to force reload
      permissionsLoadedRef.current = false;
      retryCountRef.current = 0;
      setUserPermissions([]);
      setError(null);
      
      await loadUserPermissions(user);
    } else {
      return;
    }
  }, [user, userPermissions, loadUserPermissions]);

  const value: RoleContextType = {
    // State
    roles,
    features,
    components,
    selectedRole,
    loading,
    error,
    userPermissions,
    
    // Access Checking
    canAccessFeature,
    canAccessComponent,
    getAccessibleFeatures,
    getAccessibleComponents,
    
    // Role Selection
    setSelectedRole,
    getRoleById,
    
    // Utility Functions
    getRoleDisplayName,
    getRoleColor,
    getRoleIcon,
    
    // Permission Management
    loadUserPermissions,
    retryPermissionsLoad,
    forceReloadPermissions,
  };

  // Add global debug functions
  if (typeof window !== 'undefined') {
    (window as any).forceReloadPermissions = forceReloadPermissions;
    (window as any).debugRoleContext = () => {
      // Debug logging disabled
    };
    
    (window as any).manualLoadPermissions = async () => {
      if (user && user.id) {
        // Reset and force reload
        permissionsLoadedRef.current = false;
        retryCountRef.current = 0;
        setUserPermissions([]);
        setError(null);
        
        await loadUserPermissions(user);
      }
    };
    
    (window as any).checkStoredPermissions = () => {
      const stored = secureApiService.getUserPermissions();
      return stored;
    };
    
    (window as any).forceFallbackPermissions = () => {
      if (user && user.role) {
        const fallbackPermissions = getFallbackPermissions(user.role);
        setUserPermissions(fallbackPermissions);
        permissionsLoadedRef.current = true;
        return fallbackPermissions;
      } else {
        return null;
      }
    };
    
    (window as any).checkUserState = () => {
      return {
        userExists: !!user,
        userId: user?.id,
        userRole: user?.role,
        permissionsCount: userPermissions.length,
        permissionsLoaded: permissionsLoadedRef.current
      };
    };
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
