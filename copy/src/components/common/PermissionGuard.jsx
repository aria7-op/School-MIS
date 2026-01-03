import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../constants';

/**
 * PermissionGuard Component
 * Renders children only if user has the required permissions
 */
const PermissionGuard = ({ 
  children, 
  permissions = [], 
  roles = [], 
  requireAll = false,
  fallback = null,
  showError = false 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = useAuth();

  // Check permissions
  const hasRequiredPermissions = () => {
    if (permissions.length === 0) return true;
    
    if (requireAll) {
      return hasAllPermissions(permissions);
    } else {
      return hasAnyPermission(permissions);
    }
  };

  // Check roles
  const hasRequiredRoles = () => {
    if (roles.length === 0) return true;
    return hasAnyRole(roles);
  };

  // Check if user has access
  const hasAccess = hasRequiredPermissions() && hasRequiredRoles();

  if (!hasAccess) {
    if (showError) {
      return (
        <div style={{
          padding: '16px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          margin: '8px 0'
        }}>
          <strong>خطا در دسترسی:</strong> شما مجوز لازم برای مشاهده این بخش را ندارید.
        </div>
      );
    }
    return fallback;
  }

  return <>{children}</>;
};

/**
 * usePermission Hook
 * Hook for checking permissions in components
 */
export const usePermission = () => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    getUserRoles,
    getUserPermissions,
    isAdmin,
    isInCarUser,
    isOutCarUser,
    isRejectParkingUser
  } = useAuth();

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Role checks
    hasRole,
    hasAnyRole,
    getUserRoles,
    
    // User type checks
    isAdmin,
    isInCarUser,
    isOutCarUser,
    isRejectParkingUser,
    
    // User info
    getUserPermissions,
    
    // Common permission checks
    canViewUsers: () => hasPermission(PERMISSIONS.VIEW_USERS),
    canCreateUser: () => hasPermission(PERMISSIONS.CREATE_USER),
    canEditUser: () => hasPermission(PERMISSIONS.EDIT_USER),
    canDeleteUser: () => hasPermission(PERMISSIONS.DELETE_USER),
    canManageUsers: () => hasPermission(PERMISSIONS.MANAGE_USERS),
    
    canViewCarTypes: () => hasPermission(PERMISSIONS.VIEW_CAR_TYPES),
    canCreateCarType: () => hasPermission(PERMISSIONS.CREATE_CAR_TYPE),
    canEditCarType: () => hasPermission(PERMISSIONS.EDIT_CAR_TYPE),
    canDeleteCarType: () => hasPermission(PERMISSIONS.DELETE_CAR_TYPE),
    canManageCarTypes: () => hasPermission(PERMISSIONS.MANAGE_CAR_TYPES),
    
    canViewCarTypeFees: () => hasPermission(PERMISSIONS.VIEW_CAR_TYPE_FEES),
    canCreateCarTypeFee: () => hasPermission(PERMISSIONS.CREATE_CAR_TYPE_FEE),
    canEditCarTypeFee: () => hasPermission(PERMISSIONS.EDIT_CAR_TYPE_FEE),
    canDeleteCarTypeFee: () => hasPermission(PERMISSIONS.DELETE_CAR_TYPE_FEE),
    canManageCarTypeFees: () => hasPermission(PERMISSIONS.MANAGE_CAR_TYPE_FEES),
    
    canViewParkingTypes: () => hasPermission(PERMISSIONS.VIEW_PARKING_TYPES),
    canCreateParkingType: () => hasPermission(PERMISSIONS.CREATE_PARKING_TYPE),
    canEditParkingType: () => hasPermission(PERMISSIONS.EDIT_PARKING_TYPE),
    canDeleteParkingType: () => hasPermission(PERMISSIONS.DELETE_PARKING_TYPE),
    canManageParkingTypes: () => hasPermission(PERMISSIONS.MANAGE_PARKING_TYPES),
    
    canViewIncome: () => hasPermission(PERMISSIONS.VIEW_INCOME),
    canCreateIncome: () => hasPermission(PERMISSIONS.CREATE_INCOME),
    canEditIncome: () => hasPermission(PERMISSIONS.EDIT_INCOME),
    canDeleteIncome: () => hasPermission(PERMISSIONS.DELETE_INCOME),
    canManageIncome: () => hasPermission(PERMISSIONS.MANAGE_INCOME),
    
    canViewReports: () => hasPermission(PERMISSIONS.VIEW_REPORTS),
    canViewParkingReports: () => hasPermission(PERMISSIONS.VIEW_PARKING_REPORTS),
    canViewUserReports: () => hasPermission(PERMISSIONS.VIEW_USER_REPORTS),
    canViewIncomeReports: () => hasPermission(PERMISSIONS.VIEW_INCOME_REPORTS),
    canViewDetailedReports: () => hasPermission(PERMISSIONS.VIEW_DETAILED_REPORTS),
    canViewCarReports: () => hasPermission(PERMISSIONS.VIEW_CAR_REPORTS),
    canViewAnalysisReports: () => hasPermission(PERMISSIONS.VIEW_ANALYSIS_REPORTS),
    
    canViewParking: () => hasPermission(PERMISSIONS.VIEW_PARKING),
    canCreateParking: () => hasPermission(PERMISSIONS.CREATE_PARKING),
    canEditParking: () => hasPermission(PERMISSIONS.EDIT_PARKING),
    canDeleteParking: () => hasPermission(PERMISSIONS.DELETE_PARKING),
    canManageParking: () => hasPermission(PERMISSIONS.MANAGE_PARKING),
    
    canManageSystem: () => hasPermission(PERMISSIONS.MANAGE_SYSTEM),
    canViewSettings: () => hasPermission(PERMISSIONS.VIEW_SETTINGS),
    canEditSettings: () => hasPermission(PERMISSIONS.EDIT_SETTINGS)
  };
};

export default PermissionGuard; 