import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import apiService from '../services/api';

const AccessControlDebug: React.FC = () => {
  const { user, userToken } = useAuth();
  const { userPermissions, loading, error, forceReloadPermissions } = useRole();
  const [testResults, setTestResults] = useState<any>(null);

  const runComprehensiveTest = async () => {
    const results: any = {};
    
    try {
      // Test 1: Check token
      const token = await apiService.getAccessToken();
      results.tokenTest = {
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'None'
      };

      // Test 2: Check user
      results.userTest = {
        hasUser: !!user,
        userId: user?.id,
        userRole: user?.role
      };

      // Test 3: Test RBAC API directly
      if (user?.id) {
        try {
          const rbacResponse = await apiService.fetchUserPermissions(user.id);
          results.rbacTest = {
            success: rbacResponse.success,
            data: rbacResponse.data,
            dataType: typeof rbacResponse.data,
            isArray: Array.isArray(rbacResponse.data)
          };
        } catch (error: any) {
          results.rbacTest = {
            success: false,
            error: error.message,
            status: error.response?.status
          };
        }
      }

      // Test 4: Check current permissions state
      results.permissionsTest = {
        permissionsCount: userPermissions.length,
        permissions: userPermissions,
        loading,
        error
      };

      // Test 5: Test backend connection
  
      try {
        const connectionTest = await apiService.testBackendConnection();
        results.connectionTest = connectionTest;
      } catch (error: any) {
        results.connectionTest = {
          success: false,
          error: error.message
        };
      }

      setTestResults(results);
      } catch (error: any) {
      setTestResults({ error: error.message });
    }
  };

  const testRBACDetailed = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user available for testing');
      return;
    }
    
    try {
      const result = await (window as any).testRBACPermissionsDetailed(user.id);
      Alert.alert('RBAC Test', `Success: ${result.success}\nMessage: ${result.message}`);
    } catch (error: any) {
      Alert.alert('Error', `RBAC test failed: ${error.message}`);
    }
  };

  const forceReload = async () => {
    try {
  
      await forceReloadPermissions();
      Alert.alert('Success', 'Permissions reloaded');
    } catch (error: any) {
      Alert.alert('Error', `Failed to reload: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Access Control Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current State</Text>
        <Text>User: {user?.id || 'None'}</Text>
        <Text>Role: {user?.role || 'None'}</Text>
        <Text>Token: {userToken ? 'Present' : 'Missing'}</Text>
        <Text>Permissions: {userPermissions.length}</Text>
        <Text>Loading: {loading ? 'Yes' : 'No'}</Text>
        <Text>Error: {error || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Actions</Text>
        
        <TouchableOpacity style={styles.button} onPress={runComprehensiveTest}>
          <Text style={styles.buttonText}>🧪 Run Comprehensive Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testRBACDetailed}>
          <Text style={styles.buttonText}>🔍 Test RBAC Detailed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={forceReload}>
          <Text style={styles.buttonText}>🔄 Force Reload Permissions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => (window as any).debugRoleContext()}>
          <Text style={styles.buttonText}>📊 Debug RoleContext</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={() => (window as any).debugLoginStatus()}>
          <Text style={styles.buttonText}>🔐 Debug Login Status</Text>
        </TouchableOpacity>
      </View>

      {testResults && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <Text style={styles.jsonText}>{JSON.stringify(testResults, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  jsonText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default AccessControlDebug; 
