import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
  accessDeniedMessage?: string;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  fallback = null,
  showAccessDenied = false,
  accessDeniedMessage = 'Access Denied'
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  const hasAccess = () => {
    if (requiredPermission) {
      return hasPermission(requiredPermission);
    }

    if (requiredPermissions.length > 0) {
      return requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
    }

    return true;
  };

  if (!hasAccess()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAccessDenied) {
      return (
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedTitle}>🚫 {accessDeniedMessage}</Text>
          <Text style={styles.accessDeniedText}>
            You do not have permission to access this resource.
          </Text>
          {requiredPermission && (
            <Text style={styles.requiredPermission}>
              Required permission: {requiredPermission}
            </Text>
          )}
          {requiredPermissions.length > 0 && (
            <Text style={styles.requiredPermission}>
              Required permissions: {requiredPermissions.join(', ')}
            </Text>
          )}
        </View>
      );
    }

    return null; // Hide completely
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  accessDeniedContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    margin: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  accessDeniedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 14,
    color: '#B45309',
    textAlign: 'center',
    marginBottom: 8,
  },
  requiredPermission: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PermissionGuard; 
