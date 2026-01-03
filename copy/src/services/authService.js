import apiService from './apiService';
import { STORAGE_KEYS, ROLE_PERMISSIONS, USER_ROLES } from '../constants';

/**
 * Authentication Service
 * Handles user authentication, session management, and token operations
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
  }

  /**
   * Initialize authentication service
   * @returns {Promise<boolean>} True if user is authenticated
   */
  async initialize() {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        this.isInitialized = true;
        return false;
      }

      // Mock token verification for development
      if (import.meta.env.DEV) {
        const userData = this.getCurrentUser();
        if (userData) {
          this.setCurrentUser(userData);
          this.isInitialized = true;
          return true;
        }
        this.isInitialized = true;
        return false;
      }

      const userData = await apiService.verifyToken();
      this.setCurrentUser(userData);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.logout();
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  async login(email, password) {
    try {
      // Call the backend login API
      const response = await apiService.login({ email, password });
      
      // The backend returns response.data with the actual user data
      if (response.data) {
        const { token, ...userData } = response.data;

        // Normalize user_type
        if (userData.type && !userData.user_type) {
          userData.user_type = Number(userData.type);
        }

        // Normalize userRole
        if (userData.userRole && !Array.isArray(userData.userRole)) {
          userData.userRole = [userData.userRole];
        }
        
        // Store tokens
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));

        // Set current user
        this.setCurrentUser(userData);

        return userData;
      } else {
        throw new Error('خطا در دریافت اطلاعات کاربر');
      }
    } catch (error) {
      // Handle specific error messages from backend
      if (error.message === 'message.M1002') {
        throw new Error('ایمیل یا رمز عبور اشتباه است');
      } else if (error.message === 'message.M1001') {
        throw new Error('حساب کاربری شما مسدود شده است');
      } else {
        throw new Error(error.message || 'خطا در ورود به سیستم');
      }
    }
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Call logout endpoint
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local data
      this.clearUserData();
    }
  }

  /**
   * Get current user
   * @returns {Object|null} Current user object
   */
  getCurrentUser() {
    if (!this.currentUser) {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    }
    return this.currentUser;
  }

  /**
   * Set current user
   * @param {Object} user - User object
   */
  setCurrentUser(user) {
    this.currentUser = user;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!token && !!this.getCurrentUser();
  }

  /**
   * Check if auth is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.isInitialized;
  }

  /**
   * Get user token
   * @returns {string|null} Auth token
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Get refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(userData) {
    try {
      const response = await apiService.put(API_ENDPOINTS.AUTH.PROFILE, userData);
      const updatedUser = response.data;
      
      this.setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      throw new Error(error.message || 'Profile update failed');
    }
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @returns {Promise<void>}
   */
  async changePassword(passwordData) {
    try {
      await apiService.post(`${API_ENDPOINTS.AUTH.PROFILE}/change-password`, passwordData);
    } catch (error) {
      throw new Error(error.message || 'Password change failed');
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async requestPasswordReset(email) {
    try {
      await apiService.post('/auth/forgot-password', { email });
    } catch (error) {
      throw new Error(error.message || 'Password reset request failed');
    }
  }

  /**
   * Reset password with token
   * @param {Object} resetData - Reset data with token and new password
   * @returns {Promise<void>}
   */
  async resetPassword(resetData) {
    try {
      await apiService.post('/auth/reset-password', resetData);
    } catch (error) {
      throw new Error(error.message || 'Password reset failed');
    }
  }

  /**
   * Verify email with token
   * @param {string} token - Email verification token
   * @returns {Promise<void>}
   */
  async verifyEmail(token) {
    try {
      await apiService.post('/auth/verify-email', { token });
    } catch (error) {
      throw new Error(error.message || 'Email verification failed');
    }
  }

  /**
   * Resend email verification
   * @returns {Promise<void>}
   */
  async resendEmailVerification() {
    try {
      await apiService.post('/auth/resend-verification');
    } catch (error) {
      throw new Error(error.message || 'Email verification resend failed');
    }
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Debug: Log user data
    // console.log('🔍 Permission Check Debug:', {
    //   permission,
    //   user,
    //   userType: user.user_type,
    //   userRoles: user.userRole,
    //   userRolesArray: Array.isArray(user.userRole) ? user.userRole : [],
    //   allUserKeys: Object.keys(user)
    // });

    // Admin users (user_type = 1) have all permissions
    if (user.user_type === USER_ROLES.ADMIN) {
      // console.log('✅ Admin user - has all permissions');
      return true;
    }

    // Get user roles from the user object - try different possible field names
    let userRoles = [];
    if (user.userRole) {
      userRoles = Array.isArray(user.userRole) ? user.userRole : [user.userRole];
    } else if (user.roles) {
      userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
    } else if (user.role_ids) {
      userRoles = Array.isArray(user.role_ids) ? user.role_ids : [user.role_ids];
    } else if (user.roleIds) {
      userRoles = Array.isArray(user.roleIds) ? user.roleIds : [user.roleIds];
    }

    // console.log('🔍 User Roles Found:', userRoles);
    
    // Check permissions based on user roles
    for (const roleId of userRoles) {
      const rolePermissions = ROLE_PERMISSIONS[roleId] || [];
      // console.log(`🔍 Checking Role ${roleId}:`, rolePermissions);
      if (rolePermissions.includes(permission)) {
        // console.log(`✅ Permission ${permission} found in role ${roleId}`);
        return true;
      }
    }

    // console.log(`❌ Permission ${permission} not found in any role`);
    return false;
  }

  /**
   * Check if user has any of the specified permissions
   * @param {Array} permissions - Array of permissions to check
   * @returns {boolean} True if user has any permission
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all specified permissions
   * @param {Array} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Get user permissions
   * @returns {Array} Array of user permissions
   */
  getUserPermissions() {
    const user = this.getCurrentUser();
    if (!user) return [];

    // Admin users have all permissions
    if (user.user_type === USER_ROLES.ADMIN) {
      return Object.values(ROLE_PERMISSIONS).flat();
    }

    const userRoles = user.userRole || [];
    const permissions = [];

    // Collect permissions from all user roles
    for (const roleId of userRoles) {
      const rolePermissions = ROLE_PERMISSIONS[roleId] || [];
      permissions.push(...rolePermissions);
    }

    // Remove duplicates and return
    return [...new Set(permissions)];
  }

  /**
   * Get user role
   * @returns {string} User role
   */
  getUserRole() {
    const user = this.getCurrentUser();
    if (!user) return 'guest';

    const userType = user.user_type;
    switch (userType) {
      case USER_ROLES.ADMIN: return 'admin';
      case USER_ROLES.IN_CAR_USER: return 'in_car_user';
      case USER_ROLES.OUT_CAR_USER: return 'out_car_user';
      case USER_ROLES.REJECT_PARKING: return 'reject_parking';
      default: return 'user';
    }
  }

  /**
   * Check if user is admin
   * @returns {boolean} True if user is admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.user_type === USER_ROLES.ADMIN;
  }

  /**
   * Check if user is in car user
   * @returns {boolean} True if user is in car user
   */
  isInCarUser() {
    const user = this.getCurrentUser();
    return user && user.user_type === USER_ROLES.IN_CAR_USER;
  }

  /**
   * Check if user is out car user
   * @returns {boolean} True if user is out car user
   */
  isOutCarUser() {
    const user = this.getCurrentUser();
    return user && user.user_type === USER_ROLES.OUT_CAR_USER;
  }

  /**
   * Check if user is reject parking user
   * @returns {boolean} True if user is reject parking user
   */
  isRejectParkingUser() {
    const user = this.getCurrentUser();
    return user && user.user_type === USER_ROLES.REJECT_PARKING;
  }

  /**
   * Get user roles as array
   * @returns {Array} Array of user role IDs
   */
  getUserRoles() {
    const user = this.getCurrentUser();
    return user?.userRole || [];
  }

  /**
   * Check if user has specific role
   * @param {number} roleId - Role ID to check
   * @returns {boolean} True if user has role
   */
  hasRole(roleId) {
    const userRoles = this.getUserRoles();
    return userRoles.includes(roleId);
  }

  /**
   * Check if user has any of the specified roles
   * @param {Array} roleIds - Array of role IDs to check
   * @returns {boolean} True if user has any role
   */
  hasAnyRole(roleIds) {
    const userRoles = this.getUserRoles();
    return roleIds.some(roleId => userRoles.includes(roleId));
  }

  /**
   * Clear user data
   */
  clearUserData() {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    rbac.clearUser();
  }

  /**
   * Get session info
   * @returns {Object} Session information
   */
  getSessionInfo() {
    const user = this.getCurrentUser();
    const token = this.getToken();
    
    return {
      isAuthenticated: this.isAuthenticated(),
      user,
      token: token ? `${token.substring(0, 10)}...` : null,
      role: user?.role,
      permissions: this.getUserPermissions(),
      lastLogin: user?.lastLoginAt
    };
  }

  /**
   * Validate session
   * @returns {Promise<boolean>} True if session is valid
   */
  async validateSession() {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }

      await apiService.verifyToken();
      return true;
    } catch (error) {
      this.clearUserData();
      return false;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService; 