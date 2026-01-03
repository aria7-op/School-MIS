import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUltraAdvancedAccessControl } from '../contexts/UltraAdvancedAccessControlContext';
import { useConditionalRender } from '../hooks/useAccessControl';
import SecureComponent from './SecureComponent';
import SecureFile from './SecureFileViewer';
import PolicyManagement from './PolicyManagement';
import RoleManagement from './RoleManagement';
import AccessControlDebug from './AccessControlDebug';

// Demo Component
export const AdvancedAccessControlDemo: React.FC = () => {
  const { user, hasPermission, hasRole, hasDataScope } = useAuth();
  const { checkAccess, canAccessComponent, canAccessFile } = useUltraAdvancedAccessControl();
  const { renderComponentIf, renderPermissionIf, renderRoleIf } = useConditionalRender();
  const [activeTab, setActiveTab] = useState('overview');
  const [testResults, setTestResults] = useState<any[]>([]);

  const runAccessTests = async () => {
    const tests = [
      { resource: 'users', action: 'read', context: { deviceType: 'web' } },
      { resource: 'files', action: 'write', context: { location: 'office' } },
      { resource: 'components', action: 'view', context: { time: 'business-hours' } },
      { resource: 'financial-data', action: 'access', context: { role: 'manager' } },
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await checkAccess(test.resource, test.action, test.context);
        results.push({ ...test, result });
      } catch (error) {
        results.push({ ...test, result: { allowed: false, reason: 'Test failed' } });
      }
    }
    setTestResults(results);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'components', name: 'Secure Components', icon: '🔒' },
    { id: 'files', name: 'File Access', icon: '📁' },
    { id: 'policies', name: 'Policy Management', icon: '⚙️' },
    { id: 'roles', name: 'Role Management', icon: '👥' },
    { id: 'debug', name: 'Debug Tools', icon: '🐛' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          Advanced Access Control Demo
        </Text>
        <Text style={{ color: '#666', fontSize: 14 }}>
          Comprehensive RBAC + ABAC + File/Component Security System
        </Text>
      </View>

      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: 'white', paddingVertical: 8 }}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginHorizontal: 4,
              borderRadius: 20,
              backgroundColor: activeTab === tab.id ? '#007AFF' : '#F0F0F0',
            }}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={{ color: activeTab === tab.id ? 'white' : '#666', fontWeight: '600' }}>
              {tab.icon} {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {activeTab === 'overview' && (
          <View>
            {/* User Info */}
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>👤 User Information</Text>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>Name:</Text>
                <Text>{user?.firstName} {user?.lastName}</Text>
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>Role:</Text>
                <Text>{user?.role}</Text>
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>Permissions:</Text>
                <Text>{Object.keys(user?.permissions || {}).length} permissions</Text>
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>Data Scopes:</Text>
                <Text>{user?.dataScopes?.length || 0} scopes</Text>
              </View>
            </View>

            {/* Quick Access Tests */}
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>🧪 Quick Access Tests</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#007AFF',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
                onPress={runAccessTests}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                  Run Access Tests
                </Text>
              </TouchableOpacity>

              {testResults.length > 0 && (
                <View>
                  <Text style={{ fontWeight: '600', marginBottom: 8 }}>Test Results:</Text>
                  {testResults.map((test, index) => (
                    <View
                      key={index}
                      style={{
                        padding: 8,
                        marginBottom: 4,
                        backgroundColor: test.result.allowed ? '#E8F5E8' : '#FFE5E5',
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ fontWeight: '600' }}>
                        {test.resource}:{test.action}
                      </Text>
                      <Text style={{ color: test.result.allowed ? '#2E7D32' : '#D32F2F' }}>
                        {test.result.allowed ? '✅ ALLOWED' : '❌ DENIED'}
                      </Text>
                      {test.result.reason && (
                        <Text style={{ fontSize: 12, color: '#666' }}>
                          Reason: {test.result.reason}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Permission Matrix */}
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>🔐 Permission Matrix</Text>
              
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>Component Access:</Text>
                <Text>Dashboard: {canAccessComponent('dashboard', 'VIEW') ? '✅' : '❌'}</Text>
                <Text>Admin Panel: {canAccessComponent('admin-panel', 'VIEW') ? '✅' : '❌'}</Text>
                <Text>Financial Data: {canAccessComponent('financial-data', 'VIEW') ? '✅' : '❌'}</Text>
              </View>

              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>File Access:</Text>
                <Text>Confidential Report: {canAccessFile('confidential-report.pdf', 'READ') ? '✅' : '❌'}</Text>
                <Text>Public Document: {canAccessFile('public-document.pdf', 'READ') ? '✅' : '❌'}</Text>
              </View>

              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>Role Checks:</Text>
                <Text>Admin Role: {hasRole('admin') ? '✅' : '❌'}</Text>
                <Text>Manager Role: {hasRole('manager') ? '✅' : '❌'}</Text>
                <Text>User Role: {hasRole('user') ? '✅' : '❌'}</Text>
              </View>

              <View>
                <Text style={{ fontWeight: '600' }}>Permission Checks:</Text>
                <Text>User Management: {hasPermission('users:manage') ? '✅' : '❌'}</Text>
                <Text>File Upload: {hasPermission('files:upload') ? '✅' : '❌'}</Text>
                <Text>System Admin: {hasPermission('system:admin') ? '✅' : '❌'}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'components' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>🔒 Secure Components Demo</Text>
            
            {/* Secure Component Examples */}
            <SecureComponent componentId="financial-dashboard" action="VIEW" fallback={
              <View style={{ backgroundColor: '#FFE5E5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>Access Denied</Text>
                <Text style={{ color: '#666' }}>You don't have permission to view the financial dashboard.</Text>
              </View>
            }>
              <View style={{ backgroundColor: '#E8F5E8', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', color: '#2E7D32' }}>Financial Dashboard</Text>
                <Text style={{ color: '#666' }}>This is a secure financial dashboard component.</Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  Only users with financial data access can see this.
                </Text>
              </View>
            </SecureComponent>

            <SecureComponent componentId="admin-panel" action="VIEW" fallback={
              <View style={{ backgroundColor: '#FFE5E5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: '#D32F2F', fontWeight: 'bold' }}>Access Denied</Text>
                <Text style={{ color: '#666' }}>You don't have permission to view the admin panel.</Text>
              </View>
            }>
              <View style={{ backgroundColor: '#E3F2FD', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', color: '#1976D2' }}>Admin Panel</Text>
                <Text style={{ color: '#666' }}>This is a secure admin panel component.</Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  Only administrators can see this.
                </Text>
              </View>
            </SecureComponent>

            {/* Conditional Rendering Examples */}
            <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Conditional Rendering</Text>
              
              {renderComponentIf('user-management', 'VIEW', 
                <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 6, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '600', color: '#E65100' }}>User Management</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Conditionally rendered component</Text>
                </View>
              )}

              {renderPermissionIf('files:upload', 
                <View style={{ backgroundColor: '#F3E5F5', padding: 12, borderRadius: 6, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '600', color: '#7B1FA2' }}>File Upload</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Permission-based rendering</Text>
                </View>
              )}

              {renderRoleIf('admin', 
                <View style={{ backgroundColor: '#E8F5E8', padding: 12, borderRadius: 6, marginBottom: 8 }}>
                  <Text style={{ fontWeight: '600', color: '#2E7D32' }}>Admin Features</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Role-based rendering</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'files' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>📁 Secure File Access Demo</Text>
            
            {/* File Access Examples */}
            <SecureFile fileId="confidential-report.pdf" fileName="Confidential Report">
              <View style={{ backgroundColor: '#E8F5E8', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', color: '#2E7D32' }}>Confidential Report</Text>
                <Text style={{ color: '#666' }}>This is a secure file viewer for confidential documents.</Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  Only authorized users can access this file.
                </Text>
              </View>
            </SecureFile>

            <SecureFile fileId="public-document.pdf" fileName="Public Document">
              <View style={{ backgroundColor: '#E3F2FD', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', color: '#1976D2' }}>Public Document</Text>
                <Text style={{ color: '#666' }}>This is a secure file viewer for public documents.</Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  This file has different access controls.
                </Text>
              </View>
            </SecureFile>
          </View>
        )}

        {activeTab === 'policies' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>⚙️ Policy Management</Text>
            <PolicyManagement />
          </View>
        )}

        {activeTab === 'roles' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>👥 Role Management</Text>
            <RoleManagement />
          </View>
        )}

        {activeTab === 'debug' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>🐛 Debug Tools</Text>
            <AccessControlDebug />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AdvancedAccessControlDemo; 
