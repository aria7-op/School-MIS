import apiService from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  schoolId?: string;
  department?: string;
  permissions?: string[];
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  schoolId?: string;
  department?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: string;
  schoolId?: string;
  department?: string;
  isActive?: boolean;
}

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  schoolId?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserResponse {
  success: boolean;
  data: User | User[];
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

class UserManagementService {
  /**
   * Get all users with optional filtering
   */
  async getUsers(filters?: UserFilters): Promise<UserResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.role) params.append('role', filters.role);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.schoolId) params.append('schoolId', filters.schoolId);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/users?${queryString}` : '/users';
      
      return await apiService.get(url);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(userId: string): Promise<UserResponse> {
    try {
      return await apiService.get(`/users/${userId}`);
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    try {
      return await apiService.post('/users', userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<UserResponse> {
    try {
      return await apiService.put(`/users/${userId}`, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<UserResponse> {
    try {
      return await apiService.delete(`/users/${userId}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<UserResponse> {
    try {
      return await apiService.put(`/users/${userId}/status`, { isActive });
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string, assignedBy?: string): Promise<UserResponse> {
    try {
      return await apiService.post('/users/assign-role', {
        userId,
        roleId,
        assignedBy
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string): Promise<UserResponse> {
    try {
      return await apiService.delete(`/users/${userId}/roles/${roleId}`);
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  }

  /**
   * Get user's roles
   */
  async getUserRoles(userId: string): Promise<UserResponse> {
    try {
      return await apiService.get(`/users/${userId}/roles`);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(userId: string, newPassword: string): Promise<UserResponse> {
    try {
      return await apiService.post(`/users/${userId}/reset-password`, {
        newPassword
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Bulk create users
   */
  async bulkCreateUsers(users: CreateUserRequest[]): Promise<UserResponse> {
    try {
      return await apiService.post('/users/bulk', { users });
    } catch (error) {
      console.error('Error bulk creating users:', error);
      throw error;
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(updates: Array<{ id: string; data: UpdateUserRequest }>): Promise<UserResponse> {
    try {
      return await apiService.put('/users/bulk', { updates });
    } catch (error) {
      console.error('Error bulk updating users:', error);
      throw error;
    }
  }

  /**
   * Export users to CSV
   */
  async exportUsers(filters?: UserFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.role) params.append('role', filters.role);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.schoolId) params.append('schoolId', filters.schoolId);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString();
      const url = queryString ? `/users/export?${queryString}` : '/users/export';
      
      const response = await fetch(`${apiService.baseURL}${url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiService.getToken()}`,
          'Accept': 'text/csv'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserResponse> {
    try {
      return await apiService.get('/users/stats');
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(query: string, filters?: Omit<UserFilters, 'search'>): Promise<UserResponse> {
    try {
      const searchFilters = { ...filters, search: query };
      return await this.getUsers(searchFilters);
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Validate user data
   */
  validateUserData(userData: Partial<CreateUserRequest>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!userData.username || userData.username.trim() === '') {
      errors.push('Username is required');
    } else if (userData.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (!userData.email || userData.email.trim() === '') {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Email format is invalid');
    }

    if (!userData.firstName || userData.firstName.trim() === '') {
      errors.push('First name is required');
    }

    if (!userData.lastName || userData.lastName.trim() === '') {
      errors.push('Last name is required');
    }

    if (!userData.password || userData.password === '') {
      errors.push('Password is required');
    } else if (userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!userData.role || userData.role.trim() === '') {
      errors.push('Role is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available roles
   */
  getAvailableRoles() {
    return [
      {
        id: 'admin',
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access and management',
        color: '#EF4444',
        permissions: ['*']
      },
      {
        id: 'teacher',
        name: 'teacher',
        displayName: 'Teacher',
        description: 'Academic staff with teaching responsibilities',
        color: '#3B82F6',
        permissions: ['view_students', 'manage_students', 'view_classes', 'manage_classes']
      },
      {
        id: 'staff',
        name: 'staff',
        displayName: 'Staff',
        description: 'Administrative staff and support',
        color: '#10B981',
        permissions: ['view_dashboard', 'view_reports']
      },
      {
        id: 'student',
        name: 'student',
        displayName: 'Student',
        description: 'Student access to courses and grades',
        color: '#8B5CF6',
        permissions: ['view_courses', 'view_grades']
      },
      {
        id: 'parent',
        name: 'parent',
        displayName: 'Parent',
        description: 'Parent access to child information',
        color: '#F59E0B',
        permissions: ['view_child_info', 'view_grades']
      },
      {
        id: 'accountant',
        name: 'accountant',
        displayName: 'Accountant',
        description: 'Financial management access',
        color: '#06B6D4',
        permissions: ['view_finance', 'manage_payments']
      }
    ];
  }
}

export default new UserManagementService();