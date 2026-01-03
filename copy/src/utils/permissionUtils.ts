// Comprehensive Permission Utilities
import { useAuth } from '../contexts/AuthContext';

// Permission Types
export const PERMISSION_TYPES = {
  // Student permissions
  STUDENT_CREATE: 'student:create',
  STUDENT_READ: 'student:read',
  STUDENT_UPDATE: 'student:update',
  STUDENT_DELETE: 'student:delete',
  STUDENT_EXPORT: 'student:export',
  STUDENT_IMPORT: 'student:import',

  // Teacher permissions
  TEACHER_CREATE: 'teacher:create',
  TEACHER_READ: 'teacher:read',
  TEACHER_UPDATE: 'teacher:update',
  TEACHER_DELETE: 'teacher:delete',
  TEACHER_EXPORT: 'teacher:export',
  TEACHER_IMPORT: 'teacher:import',

  // Staff permissions
  STAFF_CREATE: 'staff:create',
  STAFF_READ: 'staff:read',
  STAFF_UPDATE: 'staff:update',
  STAFF_DELETE: 'staff:delete',
  STAFF_EXPORT: 'staff:export',
  STAFF_IMPORT: 'staff:import',

  // Finance permissions
  FINANCE_CREATE: 'finance:create',
  FINANCE_READ: 'finance:read',
  FINANCE_UPDATE: 'finance:update',
  FINANCE_DELETE: 'finance:delete',
  FINANCE_EXPORT: 'finance:export',
  FINANCE_IMPORT: 'finance:import',

  // Reports permissions
  REPORTS_CREATE: 'reports:create',
  REPORTS_READ: 'reports:read',
  REPORTS_UPDATE: 'reports:update',
  REPORTS_DELETE: 'reports:delete',
  REPORTS_EXPORT: 'reports:export',
  REPORTS_IMPORT: 'reports:import',

  // Settings permissions
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // System permissions
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_RESTORE: 'system:restore',

  // Data permissions
  DATA_EXPORT: 'data:export',
  DATA_IMPORT: 'data:import',
  DATA_BACKUP: 'data:backup',
  DATA_RESTORE: 'data:restore',

  // User management permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ACTIVATE: 'user:activate',
  USER_DEACTIVATE: 'user:deactivate',

  // Role management permissions
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN: 'role:assign',
  ROLE_REVOKE: 'role:revoke',

  // Group management permissions
  GROUP_CREATE: 'group:create',
  GROUP_READ: 'group:read',
  GROUP_UPDATE: 'group:update',
  GROUP_DELETE: 'group:delete',
  GROUP_ASSIGN: 'group:assign',
  GROUP_REVOKE: 'group:revoke',

  // Permission management permissions
  PERMISSION_CREATE: 'permission:create',
  PERMISSION_READ: 'permission:read',
  PERMISSION_UPDATE: 'permission:update',
  PERMISSION_DELETE: 'permission:delete',
  PERMISSION_ASSIGN: 'permission:assign',
  PERMISSION_REVOKE: 'permission:revoke',

  // Audit permissions
  AUDIT_READ: 'audit:read',
  AUDIT_EXPORT: 'audit:export',

  // Feature permissions
  FEATURE_ACCESS: 'feature:access',
  COMPONENT_ACCESS: 'component:access'
} as const;

export type PermissionType = typeof PERMISSION_TYPES[keyof typeof PERMISSION_TYPES];

// Resource Types
export const RESOURCE_TYPES = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  STAFF: 'STAFF',
  FINANCE: 'FINANCE',
  REPORTS: 'REPORTS',
  SETTINGS: 'SETTINGS',
  SYSTEM: 'SYSTEM',
  USER: 'USER',
  ROLE: 'ROLE',
  GROUP: 'GROUP',
  PERMISSION: 'PERMISSION',
  AUDIT: 'AUDIT',
  FEATURE: 'FEATURE',
  COMPONENT: 'COMPONENT',
  DATA: 'DATA'
} as const;

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];

// Action Types
export const ACTION_TYPES = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  ASSIGN: 'ASSIGN',
  REVOKE: 'REVOKE',
  ACTIVATE: 'ACTIVATE',
  DEACTIVATE: 'DEACTIVATE',
  ACCESS: 'ACCESS',
  CONFIGURE: 'CONFIGURE',
  BACKUP: 'BACKUP',
  RESTORE: 'RESTORE'
} as const;

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

// Scope Types
export const SCOPE_TYPES = {
  OWN: 'OWN',
  SCHOOL: 'SCHOOL',
  ALL: 'ALL',
  CUSTOM: 'CUSTOM'
} as const;

export type ScopeType = typeof SCOPE_TYPES[keyof typeof SCOPE_TYPES];

// Permission Structure
export interface Permission {
  id: string;
  name: string;
  description: string;
  resourceType: ResourceType;
  resourceId: string;
  action: ActionType;
  scope: ScopeType;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Permission Assignment
export interface PermissionAssignment {
  id: string;
  userId?: string;
  roleId?: string;
  groupId?: string;
  permissionId: string;
  scope: ScopeType;
  priority: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Permission Check Functions
export const hasPermission = (userPermissions: string[], requiredPermission: PermissionType): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions: string[], requiredPermissions: PermissionType[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

export const hasAllPermissions = (userPermissions: string[], requiredPermissions: PermissionType[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

export const hasRole = (userRoles: string[], requiredRole: string): boolean => {
  return userRoles.includes(requiredRole);
};

export const hasAnyRole = (userRoles: string[], requiredRoles: string[]): boolean => {
  return requiredRoles.some(role => userRoles.includes(role));
};

export const hasAllRoles = (userRoles: string[], requiredRoles: string[]): boolean => {
  return requiredRoles.every(role => userRoles.includes(role));
};

export const hasGroup = (userGroups: string[], requiredGroup: string): boolean => {
  return userGroups.includes(requiredGroup);
};

export const hasAnyGroup = (userGroups: string[], requiredGroups: string[]): boolean => {
  return requiredGroups.some(group => userGroups.includes(group));
};

export const hasAllGroups = (userGroups: string[], requiredGroups: string[]): boolean => {
  return requiredGroups.every(group => userGroups.includes(group));
};

// Role Hierarchy
export const ROLE_HIERARCHY = {
  SUPER_DUPER_ADMIN: 120,
  SUPER_ADMIN: 100,
  OWNER: 90,
  ADMIN: 80,
  SCHOOL_ADMIN: 70,
  TEACHER: 60,
  STAFF: 50,
  STUDENT: 40,
  PARENT: 30,
  GUEST: 20
} as const;

export const hasRoleOrHigher = (userRole: string, requiredRole: string): boolean => {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0;
  return userLevel >= requiredLevel;
};

// Permission Categories
export const PERMISSION_CATEGORIES = {
  STUDENT_MANAGEMENT: [
    PERMISSION_TYPES.STUDENT_CREATE,
    PERMISSION_TYPES.STUDENT_READ,
    PERMISSION_TYPES.STUDENT_UPDATE,
    PERMISSION_TYPES.STUDENT_DELETE,
    PERMISSION_TYPES.STUDENT_EXPORT,
    PERMISSION_TYPES.STUDENT_IMPORT
  ],
  TEACHER_MANAGEMENT: [
    PERMISSION_TYPES.TEACHER_CREATE,
    PERMISSION_TYPES.TEACHER_READ,
    PERMISSION_TYPES.TEACHER_UPDATE,
    PERMISSION_TYPES.TEACHER_DELETE,
    PERMISSION_TYPES.TEACHER_EXPORT,
    PERMISSION_TYPES.TEACHER_IMPORT
  ],
  STAFF_MANAGEMENT: [
    PERMISSION_TYPES.STAFF_CREATE,
    PERMISSION_TYPES.STAFF_READ,
    PERMISSION_TYPES.STAFF_UPDATE,
    PERMISSION_TYPES.STAFF_DELETE,
    PERMISSION_TYPES.STAFF_EXPORT,
    PERMISSION_TYPES.STAFF_IMPORT
  ],
  FINANCE_MANAGEMENT: [
    PERMISSION_TYPES.FINANCE_CREATE,
    PERMISSION_TYPES.FINANCE_READ,
    PERMISSION_TYPES.FINANCE_UPDATE,
    PERMISSION_TYPES.FINANCE_DELETE,
    PERMISSION_TYPES.FINANCE_EXPORT,
    PERMISSION_TYPES.FINANCE_IMPORT
  ],
  REPORTS_MANAGEMENT: [
    PERMISSION_TYPES.REPORTS_CREATE,
    PERMISSION_TYPES.REPORTS_READ,
    PERMISSION_TYPES.REPORTS_UPDATE,
    PERMISSION_TYPES.REPORTS_DELETE,
    PERMISSION_TYPES.REPORTS_EXPORT,
    PERMISSION_TYPES.REPORTS_IMPORT
  ],
  SYSTEM_ADMINISTRATION: [
    PERMISSION_TYPES.SYSTEM_ADMIN,
    PERMISSION_TYPES.SYSTEM_CONFIG,
    PERMISSION_TYPES.SYSTEM_BACKUP,
    PERMISSION_TYPES.SYSTEM_RESTORE,
    PERMISSION_TYPES.SETTINGS_READ,
    PERMISSION_TYPES.SETTINGS_UPDATE
  ],
  USER_ADMINISTRATION: [
    PERMISSION_TYPES.USER_CREATE,
    PERMISSION_TYPES.USER_READ,
    PERMISSION_TYPES.USER_UPDATE,
    PERMISSION_TYPES.USER_DELETE,
    PERMISSION_TYPES.USER_ACTIVATE,
    PERMISSION_TYPES.USER_DEACTIVATE
  ],
  ROLE_ADMINISTRATION: [
    PERMISSION_TYPES.ROLE_CREATE,
    PERMISSION_TYPES.ROLE_READ,
    PERMISSION_TYPES.ROLE_UPDATE,
    PERMISSION_TYPES.ROLE_DELETE,
    PERMISSION_TYPES.ROLE_ASSIGN,
    PERMISSION_TYPES.ROLE_REVOKE
  ],
  GROUP_ADMINISTRATION: [
    PERMISSION_TYPES.GROUP_CREATE,
    PERMISSION_TYPES.GROUP_READ,
    PERMISSION_TYPES.GROUP_UPDATE,
    PERMISSION_TYPES.GROUP_DELETE,
    PERMISSION_TYPES.GROUP_ASSIGN,
    PERMISSION_TYPES.GROUP_REVOKE
  ],
  PERMISSION_ADMINISTRATION: [
    PERMISSION_TYPES.PERMISSION_CREATE,
    PERMISSION_TYPES.PERMISSION_READ,
    PERMISSION_TYPES.PERMISSION_UPDATE,
    PERMISSION_TYPES.PERMISSION_DELETE,
    PERMISSION_TYPES.PERMISSION_ASSIGN,
    PERMISSION_TYPES.PERMISSION_REVOKE
  ],
  AUDIT_MANAGEMENT: [
    PERMISSION_TYPES.AUDIT_READ,
    PERMISSION_TYPES.AUDIT_EXPORT
  ],
  DATA_MANAGEMENT: [
    PERMISSION_TYPES.DATA_EXPORT,
    PERMISSION_TYPES.DATA_IMPORT,
    PERMISSION_TYPES.DATA_BACKUP,
    PERMISSION_TYPES.DATA_RESTORE
  ]
} as const;

export type PermissionCategory = keyof typeof PERMISSION_CATEGORIES;

// Permission Validation
export const validatePermission = (permission: Partial<Permission>): string[] => {
  const errors: string[] = [];

  if (!permission.name) {
    errors.push('Permission name is required');
  }

  if (!permission.resourceType) {
    errors.push('Resource type is required');
  }

  if (!permission.action) {
    errors.push('Action is required');
  }

  if (!permission.scope) {
    errors.push('Scope is required');
  }

  if (permission.name && !permission.name.includes(':')) {
    errors.push('Permission name must be in format "resource:action"');
  }

  return errors;
};

// Permission Generation
export const generatePermissionName = (resource: string, action: string): string => {
  return `${resource.toLowerCase()}:${action.toLowerCase()}`;
};

export const generatePermissionDescription = (resource: string, action: string): string => {
  const actionDescriptions: Record<string, string> = {
    CREATE: 'Create new',
    READ: 'View',
    UPDATE: 'Edit',
    DELETE: 'Delete',
    EXPORT: 'Export',
    IMPORT: 'Import',
    APPROVE: 'Approve',
    REJECT: 'Reject',
    ASSIGN: 'Assign',
    REVOKE: 'Revoke',
    ACTIVATE: 'Activate',
    DEACTIVATE: 'Deactivate',
    ACCESS: 'Access',
    CONFIGURE: 'Configure',
    BACKUP: 'Backup',
    RESTORE: 'Restore'
  };

  const actionDesc = actionDescriptions[action] || action.toLowerCase();
  return `${actionDesc} ${resource.toLowerCase()}`;
};

// Permission Comparison
export const comparePermissions = (a: Permission, b: Permission): number => {
  // Sort by resource type first
  if (a.resourceType !== b.resourceType) {
    return a.resourceType.localeCompare(b.resourceType);
  }
  
  // Then by action
  if (a.action !== b.action) {
    return a.action.localeCompare(b.action);
  }
  
  // Then by name
  return a.name.localeCompare(b.name);
};

// Permission Filtering
export const filterPermissionsByResource = (permissions: Permission[], resourceType: ResourceType): Permission[] => {
  return permissions.filter(permission => permission.resourceType === resourceType);
};

export const filterPermissionsByAction = (permissions: Permission[], action: ActionType): Permission[] => {
  return permissions.filter(permission => permission.action === action);
};

export const filterPermissionsByScope = (permissions: Permission[], scope: ScopeType): Permission[] => {
  return permissions.filter(permission => permission.scope === scope);
};

export const filterActivePermissions = (permissions: Permission[]): Permission[] => {
  return permissions.filter(permission => permission.isActive);
};

// Permission Grouping
export const groupPermissionsByResource = (permissions: Permission[]): Record<ResourceType, Permission[]> => {
  return permissions.reduce((groups, permission) => {
    if (!groups[permission.resourceType]) {
      groups[permission.resourceType] = [];
    }
    groups[permission.resourceType].push(permission);
    return groups;
  }, {} as Record<ResourceType, Permission[]>);
};

export const groupPermissionsByAction = (permissions: Permission[]): Record<ActionType, Permission[]> => {
  return permissions.reduce((groups, permission) => {
    if (!groups[permission.action]) {
      groups[permission.action] = [];
    }
    groups[permission.action].push(permission);
    return groups;
  }, {} as Record<ActionType, Permission[]>);
};

// Permission Statistics
export const getPermissionStats = (permissions: Permission[]) => {
  const stats = {
    total: permissions.length,
    active: permissions.filter(p => p.isActive).length,
    inactive: permissions.filter(p => !p.isActive).length,
    system: permissions.filter(p => p.isSystem).length,
    custom: permissions.filter(p => !p.isSystem).length,
    byResource: {} as Record<ResourceType, number>,
    byAction: {} as Record<ActionType, number>,
    byScope: {} as Record<ScopeType, number>
  };

  // Count by resource type
  permissions.forEach(permission => {
    stats.byResource[permission.resourceType] = (stats.byResource[permission.resourceType] || 0) + 1;
  });

  // Count by action
  permissions.forEach(permission => {
    stats.byAction[permission.action] = (stats.byAction[permission.action] || 0) + 1;
  });

  // Count by scope
  permissions.forEach(permission => {
    stats.byScope[permission.scope] = (stats.byScope[permission.scope] || 0) + 1;
  });

  return stats;
};

// Export all permission types for easy access
export {
  PERMISSION_TYPES as Permissions,
  RESOURCE_TYPES as Resources,
  ACTION_TYPES as Actions,
  SCOPE_TYPES as Scopes,
  PERMISSION_CATEGORIES as Categories
}; 
