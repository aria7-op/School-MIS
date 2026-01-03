// Comprehensive Audit Logger Utility
import secureApiService from '../services/secureApiService';

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  errorMessage?: string;
  sessionId?: string;
  requestId?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'SUCCESS' | 'FAILURE' | 'PENDING';
  limit?: number;
  offset?: number;
}

// Audit Actions
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  
  // User Management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ACTIVATE: 'USER_ACTIVATE',
  USER_DEACTIVATE: 'USER_DEACTIVATE',
  
  // Permission Management
  PERMISSION_CREATE: 'PERMISSION_CREATE',
  PERMISSION_UPDATE: 'PERMISSION_UPDATE',
  PERMISSION_DELETE: 'PERMISSION_DELETE',
  PERMISSION_ASSIGN: 'PERMISSION_ASSIGN',
  PERMISSION_REVOKE: 'PERMISSION_REVOKE',
  
  // Role Management
  ROLE_CREATE: 'ROLE_CREATE',
  ROLE_UPDATE: 'ROLE_UPDATE',
  ROLE_DELETE: 'ROLE_DELETE',
  ROLE_ASSIGN: 'ROLE_ASSIGN',
  ROLE_REVOKE: 'ROLE_REVOKE',
  
  // Group Management
  GROUP_CREATE: 'GROUP_CREATE',
  GROUP_UPDATE: 'GROUP_UPDATE',
  GROUP_DELETE: 'GROUP_DELETE',
  GROUP_ASSIGN: 'GROUP_ASSIGN',
  GROUP_REVOKE: 'GROUP_REVOKE',
  
  // Data Operations
  DATA_CREATE: 'DATA_CREATE',
  DATA_READ: 'DATA_READ',
  DATA_UPDATE: 'DATA_UPDATE',
  DATA_DELETE: 'DATA_DELETE',
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT',
  
  // System Operations
  SYSTEM_CONFIG_UPDATE: 'SYSTEM_CONFIG_UPDATE',
  SYSTEM_BACKUP: 'SYSTEM_BACKUP',
  SYSTEM_RESTORE: 'SYSTEM_RESTORE',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  
  // Security Events
  ACCESS_DENIED: 'ACCESS_DENIED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_ATTEMPT: 'BRUTE_FORCE_ATTEMPT',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  
  // Feature Access
  FEATURE_ACCESS: 'FEATURE_ACCESS',
  FEATURE_DENIED: 'FEATURE_DENIED',
  COMPONENT_ACCESS: 'COMPONENT_ACCESS',
  COMPONENT_DENIED: 'COMPONENT_DENIED'
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

// Audit Resources
export const AUDIT_RESOURCES = {
  // System Resources
  SYSTEM: 'SYSTEM',
  AUTH: 'AUTH',
  USER: 'USER',
  PERMISSION: 'PERMISSION',
  ROLE: 'ROLE',
  GROUP: 'GROUP',
  
  // Business Resources
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  STAFF: 'STAFF',
  FINANCE: 'FINANCE',
  REPORTS: 'REPORTS',
  SETTINGS: 'SETTINGS',
  
  // Features
  FEATURE: 'FEATURE',
  COMPONENT: 'COMPONENT',
  
  // Data
  DATA: 'DATA',
  FILE: 'FILE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT'
} as const;

export type AuditResource = typeof AUDIT_RESOURCES[keyof typeof AUDIT_RESOURCES];

// Audit Logger
export class AuditLogger {
  private static instance: AuditLogger;
  private logs: any[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  // Log an audit event
  async logEvent(event: {
    action: string;
    resource: string;
    resourceId?: string;
    userId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: Date;
  }): Promise<void> {
    try {
      const auditEvent = {
        ...event,
        timestamp: event.timestamp || new Date(),
        ipAddress: event.ipAddress || this.getClientIP(),
        userAgent: event.userAgent || this.getUserAgent(),
      };

      // Add to local logs
      this.logs.push(auditEvent);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }

      // Send to backend
      await secureApiService.post('/audit/logs', auditEvent);
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  // Get audit logs
  async getAuditLogs(params?: any): Promise<any> {
    try {
      const response = await secureApiService.getAuditLogs(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  // Get user audit logs
  async getUserAuditLogs(userId: string): Promise<any> {
    try {
      const response = await secureApiService.getUserAuditLogs(userId);
      return response.data;
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      return [];
    }
  }

  // Get local logs
  getLocalLogs(): any[] {
    return [...this.logs];
  }

  // Clear local logs
  clearLocalLogs(): void {
    this.logs = [];
  }

  // Get client IP (simplified)
  private getClientIP(): string {
    // In a real app, you'd get this from the request headers
    return 'unknown';
  }

  // Get user agent (simplified)
  private getUserAgent(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return 'unknown';
  }
}

// Export singleton instance
export default AuditLogger.getInstance();

// Export convenience functions
const auditLogger = AuditLogger.getInstance();

export const logAuth = (action: string, userId?: string, details?: any) => 
  auditLogger.logEvent({ action, resource: AUDIT_RESOURCES.AUTH, userId, details });

export const logPermission = (action: AuditAction, resourceId: string, details?: any) => 
  auditLogger.logEvent({ action, resource: AUDIT_RESOURCES.PERMISSION, resourceId, details });

export const logRole = (action: AuditAction, resourceId: string, details?: any) => 
  auditLogger.logEvent({ action, resource: AUDIT_RESOURCES.ROLE, resourceId, details });

export const logGroup = (action: AuditAction, resourceId: string, details?: any) => 
  auditLogger.logEvent({ action, resource: AUDIT_RESOURCES.GROUP, resourceId, details });

export const logAccessDenied = (userId: string, resource: string, action: string, details?: any) => 
  auditLogger.logEvent({ action: AUDIT_ACTIONS.ACCESS_DENIED, userId, resource, details });

export const logFeatureAccess = (userId: string, featureId: string, granted: boolean, details?: any) => 
  auditLogger.logEvent({ action: granted ? AUDIT_ACTIONS.FEATURE_ACCESS : AUDIT_ACTIONS.FEATURE_DENIED, userId, resource: AUDIT_RESOURCES.FEATURE, resourceId: featureId, details });

export const logComponentAccess = (userId: string, componentId: string, granted: boolean, details?: any) => 
  auditLogger.logEvent({ action: granted ? AUDIT_ACTIONS.COMPONENT_ACCESS : AUDIT_ACTIONS.COMPONENT_DENIED, userId, resource: AUDIT_RESOURCES.COMPONENT, resourceId: componentId, details });

export const logSuspiciousActivity = (userId: string, details: any) => 
  auditLogger.logEvent({ action: AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY, userId, resource: AUDIT_RESOURCES.SYSTEM, details }); 
