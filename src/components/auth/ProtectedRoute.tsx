import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGuard from '../permissions/PermissionGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  redirectTo?: string;
  showAccessDenied?: boolean;
  accessDeniedMessage?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  redirectTo = '/login',
  showAccessDenied = true,
  accessDeniedMessage = 'Access Denied'
}) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    // In a real app, you would navigate to the login screen
    // For now, we'll show a login message
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>🔐 Authentication Required</Text>
        <Text style={styles.authMessage}>
          Please log in to access this resource.
        </Text>
      </View>
    );
  }

  // If no permission requirements, render children
  if (!requiredPermission && requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Check permissions using PermissionGuard
  return (
    <PermissionGuard
      requiredPermission={requiredPermission}
      requiredPermissions={requiredPermissions}
      requireAll={requireAll}
      showAccessDenied={showAccessDenied}
      accessDeniedMessage={accessDeniedMessage}
    >
      {children}
    </PermissionGuard>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  authMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ProtectedRoute; 
