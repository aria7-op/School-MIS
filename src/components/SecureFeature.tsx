import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUltraAdvancedAccessControl } from '../contexts/UltraAdvancedAccessControlContext';

interface SecureFeatureProps {
  featureId: string;
  componentId?: string;
  action?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUnauthorizedMessage?: boolean;
}

const SecureFeature: React.FC<SecureFeatureProps> = ({
  featureId,
  componentId,
  action = 'view',
  children,
  fallback,
  showUnauthorizedMessage = false
}) => {
  const { canAccessFeature, canAccessComponent } = useUltraAdvancedAccessControl();

  // Check if user can access this feature
  const canAccess = componentId 
    ? canAccessComponent(componentId, action)
    : canAccessFeature(featureId);

  // If user can't access, show fallback or nothing
  if (!canAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showUnauthorizedMessage) {
      return (
        <View style={styles.unauthorizedContainer}>
          <Text style={styles.unauthorizedText}>
            🔒 You don't have permission to access this feature
          </Text>
        </View>
      );
    }
    
    return null; // Hide completely
  }

  // User has access, show the component
  return <>{children}</>;
};

const styles = StyleSheet.create({
  unauthorizedContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    margin: 10,
  },
  unauthorizedText: {
    color: '#92400E',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SecureFeature; 
