import { USER_ROLES, PERMISSIONS } from '../constants';

// Role-Permission Mapping
const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    // Full access to all permissions
    ...Object.values(PERMISSIONS)
  ],
  [USER_ROLES.OPERATOR]: [
    // User Management (limited)
    PERMISSIONS.READ_USER,
    
    // Card Management
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.READ_CARD,
    PERMISSIONS.UPDATE_CARD,
    PERMISSIONS.ASSIGN_CARD,
    
    // Session Management
    PERMISSIONS.CREATE_SESSION,
    PERMISSIONS.READ_SESSION,
    PERMISSIONS.UPDATE_SESSION,
    
    // Zone Management (read-only)
    PERMISSIONS.READ_ZONE,
    
    // Gate Management (read-only)
    PERMISSIONS.READ_GATE,
    
    // Payment Management
    PERMISSIONS.CREATE_PAYMENT,
    PERMISSIONS.READ_PAYMENT,
    PERMISSIONS.UPDATE_PAYMENT,
    
    // Reports
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  [USER_ROLES.VIEWER]: [
    // Read-only access
    PERMISSIONS.READ_USER,
    PERMISSIONS.READ_CARD,
    PERMISSIONS.READ_SESSION,
    PERMISSIONS.READ_ZONE,
    PERMISSIONS.READ_GATE,
    PERMISSIONS.READ_PAYMENT,
    PERMISSIONS.VIEW_REPORTS
  ]
};

// Permission Groups for easier management
const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER
  ],
  CARD_MANAGEMENT: [
    PERMISSIONS.CREATE_CARD,
    PERMISSIONS.READ_CARD,
    PERMISSIONS.UPDATE_CARD,
    PERMISSIONS.DELETE_CARD,
    PERMISSIONS.ASSIGN_CARD
  ],
  SESSION_MANAGEMENT: [
    PERMISSIONS.CREATE_SESSION,
    PERMISSIONS.READ_SESSION,
    PERMISSIONS.UPDATE_SESSION,
    PERMISSIONS.DELETE_SESSION
  ],
  ZONE_MANAGEMENT: [
    PERMISSIONS.CREATE_ZONE,
    PERMISSIONS.READ_ZONE,
    PERMISSIONS.UPDATE_ZONE,
    PERMISSIONS.DELETE_ZONE
  ],
  GATE_MANAGEMENT: [
    PERMISSIONS.CREATE_GATE,
    PERMISSIONS.READ_GATE,
    PERMISSIONS.UPDATE_GATE,
    PERMISSIONS.DELETE_GATE
  ],
  PAYMENT_MANAGEMENT: [
    PERMISSIONS.CREATE_PAYMENT,
    PERMISSIONS.READ_PAYMENT,
    PERMISSIONS.UPDATE_PAYMENT,
    PERMISSIONS.DELETE_PAYMENT
  ],
  REPORTS: [
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  SYSTEM_MANAGEMENT: [
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_AUDIT_LOGS
  ]
};

/**
 * RBAC Utility Class
 * Provides comprehensive role-based access control functionality
 */
class RBAC {
  constructor() {
    this.currentUser = null;
    this.userPermissions = new Set();
  }

  /**
   * Set the current user and their permissions
   * @param {Object} user - User object with role and permissions
   */
  setCurrentUser(user) {
    this.currentUser = user;
    this.userPermissions = new Set(user?.permissions || []);
  }

  /**
   * Get current user
   * @returns {Object|null} Current user object
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    if (!this.currentUser) return false;
    
    // Admin has all permissions
    if (this.currentUser.role === USER_ROLES.ADMIN) {
      return true;
    }
    
    return this.userPermissions.has(permission);
  }

  /**
   * Check if user has any of the specified permissions
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if user has at least one permission
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   * @param {string[]} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has permission for a specific resource action
   * @param {string} resource - Resource name (e.g., 'user', 'card')
   * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
   * @returns {boolean} True if user has permission
   */
  can(resource, action) {
    const permission = `${action.toUpperCase()}_${resource.toUpperCase()}`;
    return this.hasPermission(permission);
  }

  /**
   * Get all permissions for a specific role
   * @param {string} role - Role name
   * @returns {string[]} Array of permissions for the role
   */
  getRolePermissions(role) {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Get all available permissions
   * @returns {string[]} Array of all permissions
   */
  getAllPermissions() {
    return Object.values(PERMISSIONS);
  }

  /**
   * Get permission groups
   * @returns {Object} Permission groups
   */
  getPermissionGroups() {
    return PERMISSION_GROUPS;
  }

  /**
   * Check if user can access a specific route
   * @param {Object} route - Route object with permissions array
   * @returns {boolean} True if user can access the route
   */
  canAccessRoute(route) {
    if (!route.permissions || route.permissions.length === 0) {
      return true; // No permissions required
    }
    
    return this.hasAnyPermission(route.permissions);
  }

  /**
   * Filter navigation items based on user permissions
   * @param {Array} navigationItems - Array of navigation items
   * @returns {Array} Filtered navigation items
   */
  filterNavigationItems(navigationItems) {
    return navigationItems.filter(item => {
      // Check main item permissions
      if (!this.canAccessRoute(item)) {
        return false;
      }
      
      // Check children permissions
      if (item.children) {
        item.children = this.filterNavigationItems(item.children);
        return item.children.length > 0;
      }
      
      return true;
    });
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Check if user has admin role
   * @returns {boolean} True if user is admin
   */
  isAdmin() {
    return this.currentUser?.role === USER_ROLES.ADMIN;
  }

  /**
   * Check if user has operator role
   * @returns {boolean} True if user is operator
   */
  isOperator() {
    return this.currentUser?.role === USER_ROLES.OPERATOR;
  }

  /**
   * Check if user has viewer role
   * @returns {boolean} True if user is viewer
   */
  isViewer() {
    return this.currentUser?.role === USER_ROLES.VIEWER;
  }

  /**
   * Get user's role
   * @returns {string|null} User's role
   */
  getUserRole() {
    return this.currentUser?.role || null;
  }

  /**
   * Get user's permissions
   * @returns {string[]} Array of user's permissions
   */
  getUserPermissions() {
    return Array.from(this.userPermissions);
  }

  /**
   * Check if user can perform CRUD operations on a resource
   * @param {string} resource - Resource name
   * @returns {Object} Object with CRUD permissions
   */
  getCRUDPermissions(resource) {
    return {
      canCreate: this.can(resource, 'create'),
      canRead: this.can(resource, 'read'),
      canUpdate: this.can(resource, 'update'),
      canDelete: this.can(resource, 'delete')
    };
  }

  /**
   * Validate user permissions against required permissions
   * @param {string[]} requiredPermissions - Required permissions
   * @returns {Object} Validation result
   */
  validatePermissions(requiredPermissions) {
    const missingPermissions = requiredPermissions.filter(
      permission => !this.hasPermission(permission)
    );

    return {
      isValid: missingPermissions.length === 0,
      missingPermissions,
      hasAllPermissions: this.hasAllPermissions(requiredPermissions),
      hasAnyPermission: this.hasAnyPermission(requiredPermissions)
    };
  }

  /**
   * Clear current user and permissions
   */
  clearUser() {
    this.currentUser = null;
    this.userPermissions.clear();
  }
}

// Create singleton instance
const rbac = new RBAC();

export default rbac;
export { RBAC, ROLE_PERMISSIONS, PERMISSION_GROUPS }; 