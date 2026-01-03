import { ensureCsrfToken, readCsrfTokenFromCookie } from '../utils/csrf';
import { sanitizeObject } from '../utils/sanitize';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = 'https://khwanzay.school/api';
    this.token = null;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  async resolveCsrfHeader(method: string): Promise<Record<string, string>> {
    if (SAFE_METHODS.has(method)) {
      return {};
    }

    let csrfToken = readCsrfTokenFromCookie();
    if (!csrfToken) {
      csrfToken = await ensureCsrfToken();
    }

    return csrfToken ? { 'X-CSRF-Token': csrfToken } : {};
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const baseHeaders = {
      ...this.getHeaders(),
      ...(options.headers || {}),
    };
    const csrfHeader = await this.resolveCsrfHeader(method);
    const headers = {
      ...baseHeaders,
      ...csrfHeader,
    };

    // Sanitize request body for POST, PUT, PATCH requests
    let sanitizedBody = options.body;
    if (sanitizedBody && typeof sanitizedBody === 'string') {
      try {
        const parsed = JSON.parse(sanitizedBody);
        const sanitized = sanitizeObject(parsed);
        sanitizedBody = JSON.stringify(sanitized);
      } catch {
        // If body is not JSON, leave it as is (could be FormData, etc.)
      }
    }

    const config: RequestInit = {
      ...options,
      method,
      headers,
      credentials: 'include',
      body: sanitizedBody,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: { username: string; password: string }) {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async refreshToken() {
    return this.request('/auth/refresh', { method: 'POST' });
  }

  // RBAC Permissions methods - EXACTLY as backend expects
  async getPermissions() {
    return this.request('/rbac/permissions');
  }

  async createPermission(permission: {
    name: string;
    description: string;
    resourceType: string;
    resourceId: string;
    action: string;
    scope: string;
  }) {
    return this.request('/rbac/permissions', {
      method: 'POST',
      body: JSON.stringify(permission)
    });
  }

  async getPermission(id: string) {
    return this.request(`/rbac/permissions/${id}`);
  }

  async updatePermission(id: string, permission: any) {
    return this.request(`/rbac/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(permission)
    });
  }

  async deletePermission(id: string) {
    return this.request(`/rbac/permissions/${id}`, {
      method: 'DELETE'
    });
  }

  // Permission assignment - EXACTLY as backend expects
  async assignPermission(assignment: {
    userId?: string;
    roleId?: string;
    groupId?: string;
    permissionId: string;
    scope: string;
    priority: number;
    expiresAt?: string;
  }) {
    return this.request('/rbac/permissions/assign', {
      method: 'POST',
      body: JSON.stringify(assignment)
    });
  }

  async bulkAssignPermissions(assignments: any[]) {
    return this.request('/rbac/permissions/bulk-assign', {
      method: 'POST',
      body: JSON.stringify(assignments)
    });
  }

  async getUserPermissions(userId: string) {
    return this.request(`/rbac/permissions/user/${userId}/effective`);
  }

  async getPermissionAnalytics() {
    return this.request('/rbac/permissions/analytics');
  }

  async getPermissionAssignments() {
    return this.request('/rbac/permissions/assignments');
  }

  // RBAC Roles methods - EXACTLY as backend expects
  async getRoles() {
    return this.request('/rbac/roles');
  }

  async createRole(role: {
    name: string;
    description: string;
    type: string;
    isActive: boolean;
    isSystem: boolean;
    isDefault: boolean;
    priority: number;
  }) {

    // );
    
    try {
      const response = await this.request('/rbac/roles', {
        method: 'POST',
        body: JSON.stringify(role)
      });

      return response;
    } catch (error) {
      
      throw error;
    }
  }

  async getRole(id: string) {
    return this.request(`/rbac/roles/${id}`);
  }

  async updateRole(id: string, role: any) {
    return this.request(`/rbac/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(role)
    });
  }

  async deleteRole(id: string) {
    return this.request(`/rbac/roles/${id}`, {
      method: 'DELETE'
    });
  }

  // RBAC Groups methods - EXACTLY as backend expects
  async getGroups() {
    return this.request('/rbac/groups');
  }

  async createGroup(group: {
    name: string;
    description: string;
    type: string;
    isActive: boolean;
  }) {
    return this.request('/rbac/groups', {
      method: 'POST',
      body: JSON.stringify(group)
    });
  }

  async getGroup(id: string) {
    return this.request(`/rbac/groups/${id}`);
  }

  async updateGroup(id: string, group: any) {
    return this.request(`/rbac/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(group)
    });
  }

  async deleteGroup(id: string) {
    return this.request(`/rbac/groups/${id}`, {
      method: 'DELETE'
    });
  }

  // ABAC Rules methods
  async getABACRules() {
    return this.request('/abac/rules');
  }

  async createABACRule(rule: any) {
    return this.request('/abac/rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    });
  }

  async getABACRule(id: string) {
    return this.request(`/abac/rules/${id}`);
  }

  async updateABACRule(id: string, rule: any) {
    return this.request(`/abac/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule)
    });
  }

  async deleteABACRule(id: string) {
    return this.request(`/abac/rules/${id}`, {
      method: 'DELETE'
    });
  }

  // ABAC Attributes methods
  async getABACAttributes() {
    return this.request('/abac/attributes');
  }

  async createABACAttribute(attribute: any) {
    return this.request('/abac/attributes', {
      method: 'POST',
      body: JSON.stringify(attribute)
    });
  }

  async getABACAttribute(id: string) {
    return this.request(`/abac/attributes/${id}`);
  }

  async updateABACAttribute(id: string, attribute: any) {
    return this.request(`/abac/attributes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attribute)
    });
  }

  async deleteABACAttribute(id: string) {
    return this.request(`/abac/attributes/${id}`, {
      method: 'DELETE'
    });
  }

  // Audit methods
  async getAuditLogs(params?: any) {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/audit/logs${queryString}`);
  }

  async getAuditLog(id: string) {
    return this.request(`/audit/logs/${id}`);
  }

  async getUserAuditLogs(userId: string) {
    return this.request(`/audit/logs/user/${userId}`);
  }

  async getActionAuditLogs(action: string) {
    return this.request(`/audit/logs/action/${action}`);
  }

  // Access check methods
  async checkAccess(resource: string, action: string, context?: any) {
    return this.request('/rbac/access/check', {
      method: 'POST',
      body: JSON.stringify({ resource, action, context })
    });
  }

  // Feature and Component methods
  async getFeatures() {
    return this.request('/rbac/features');
  }

  async getComponents() {
    return this.request('/rbac/components');
  }

  async assignFeaturePermission(featureId: string, roleId: string, permission: string) {
    return this.request('/rbac/features/permissions', {
      method: 'POST',
      body: JSON.stringify({ featureId, roleId, permission })
    });
  }

  async assignComponentPermission(componentId: string, roleId: string, permission: string) {
    return this.request('/rbac/components/permissions', {
      method: 'POST',
      body: JSON.stringify({ componentId, roleId, permission })
    });
  }
}

export default new ApiService(); 
