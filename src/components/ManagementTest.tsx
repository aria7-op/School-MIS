import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import apiService from '../services/apiService';

const ManagementTest: React.FC = () => {
  const testCreatePermission = async () => {
    try {
      const permission = {
        name: 'test:permission',
        description: 'Test permission for verification',
        resourceType: 'TEST',
        resourceId: 'test',
        action: 'READ',
        scope: 'ALL',
        isActive: true
      };

      const response = await apiService.createPermission(permission);
      Alert.alert('Success', 'Permission created successfully!');

    } catch (error) {
      Alert.alert('Error', 'Failed to create permission. Check console for details.');
      
    }
  };

  const testCreateRole = async () => {
    try {
      const role = {
        name: 'Test Role',
        description: 'Test role for verification',
        type: 'STAFF',
        isActive: true,
        isSystem: false,
        isDefault: false,
        priority: 0
      };

      const response = await apiService.createRole(role);
      Alert.alert('Success', 'Role created successfully!');

    } catch (error) {
      Alert.alert('Error', 'Failed to create role. Check console for details.');
      
    }
  };

  const testCreateGroup = async () => {
    try {
      const group = {
        name: 'Test Group',
        description: 'Test group for verification',
        type: 'CUSTOM',
        isActive: true
      };

      const response = await apiService.createGroup(group);
      Alert.alert('Success', 'Group created successfully!');

    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Check console for details.');
      
    }
  };

  const testGetPermissions = async () => {
    try {
      const response = await apiService.getPermissions();
      Alert.alert('Success', `Found ${response.data?.length || 0} permissions`);

    } catch (error) {
      Alert.alert('Error', 'Failed to get permissions. Check console for details.');
      
    }
  };

  const testGetRoles = async () => {
    try {
      const response = await apiService.getRoles();
      Alert.alert('Success', `Found ${response.data?.length || 0} roles`);

    } catch (error) {
      Alert.alert('Error', 'Failed to get roles. Check console for details.');
      
    }
  };

  const testGetGroups = async () => {
    try {
      const response = await apiService.getGroups();
      Alert.alert('Success', `Found ${response.data?.length || 0} groups`);

    } catch (error) {
      Alert.alert('Error', 'Failed to get groups. Check console for details.');
      
    }
  };

  const testAssignPermission = async () => {
    try {
      const assignment = {
        userId: '1', // Test user ID
        permissionId: '1', // Test permission ID
        scope: 'global',
        priority: 1
      };

      const response = await apiService.assignPermission(assignment);
      Alert.alert('Success', 'Permission assigned successfully!');

    } catch (error) {
      Alert.alert('Error', 'Failed to assign permission. Check console for details.');
      
    }
  };

  const testCheckAccess = async () => {
    try {
      const response = await apiService.checkAccess('students', 'read', {
        userId: '1',
        userRole: 'teacher'
      });
      Alert.alert('Success', `Access check result: ${response.data?.allowed ? 'Allowed' : 'Denied'}`);

    } catch (error) {
      Alert.alert('Error', 'Failed to check access. Check console for details.');
      
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Management System Test</Text>
      <Text style={styles.subtitle}>Test all management features</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔑 Permission Tests</Text>
        
        <TouchableOpacity style={styles.testButton} onPress={testCreatePermission}>
          <Text style={styles.buttonText}>Create Test Permission</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testGetPermissions}>
          <Text style={styles.buttonText}>Get All Permissions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testAssignPermission}>
          <Text style={styles.buttonText}>Assign Permission</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎭 Role Tests</Text>
        
        <TouchableOpacity style={styles.testButton} onPress={testCreateRole}>
          <Text style={styles.buttonText}>Create Test Role</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testGetRoles}>
          <Text style={styles.buttonText}>Get All Roles</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Group Tests</Text>
        
        <TouchableOpacity style={styles.testButton} onPress={testCreateGroup}>
          <Text style={styles.buttonText}>Create Test Group</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.testButton} onPress={testGetGroups}>
          <Text style={styles.buttonText}>Get All Groups</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Access Tests</Text>
        
        <TouchableOpacity style={styles.testButton} onPress={testCheckAccess}>
          <Text style={styles.buttonText}>Test Access Check</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Available Features</Text>
        
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>✅ Create Permissions</Text>
          <Text style={styles.featureItem}>✅ Edit Permissions</Text>
          <Text style={styles.featureItem}>✅ Delete Permissions</Text>
          <Text style={styles.featureItem}>✅ Assign Permissions</Text>
          <Text style={styles.featureItem}>✅ Create Roles</Text>
          <Text style={styles.featureItem}>✅ Edit Roles</Text>
          <Text style={styles.featureItem}>✅ Delete Roles</Text>
          <Text style={styles.featureItem}>✅ Assign Roles</Text>
          <Text style={styles.featureItem}>✅ Create Groups</Text>
          <Text style={styles.featureItem}>✅ Edit Groups</Text>
          <Text style={styles.featureItem}>✅ Delete Groups</Text>
          <Text style={styles.featureItem}>✅ Assign Groups</Text>
          <Text style={styles.featureItem}>✅ View User Permissions</Text>
          <Text style={styles.featureItem}>✅ Check Access</Text>
          <Text style={styles.featureItem}>✅ Audit Logging</Text>
          <Text style={styles.featureItem}>✅ Error Handling</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 How to Access</Text>
        
        <Text style={styles.instruction}>
          1. Navigate to the Owner Management screen
        </Text>
        <Text style={styles.instruction}>
          2. Use the tabs to access different management features:
        </Text>
        <Text style={styles.instruction}>   • Permissions - Create and manage permissions</Text>
        <Text style={styles.instruction}>   • Roles - Create and manage roles</Text>
        <Text style={styles.instruction}>   • Groups - Create and manage groups</Text>
        <Text style={styles.instruction}>   • Users - View and manage user permissions</Text>
        <Text style={styles.instruction}>   • Feature Control - Control feature access</Text>
        <Text style={styles.instruction}>   • Analytics - View usage analytics</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  featureItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default ManagementTest; 
