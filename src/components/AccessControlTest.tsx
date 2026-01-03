import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import SecureFeature from './SecureFeature';
import { useAccessControl } from '../hooks/useAccessControl';

const AccessControlTest: React.FC = () => {
  const {
    canViewFeature,
    canEditFeature,
    canDeleteFeature,
    canViewComponent,
    canEditComponent,
    hasPermission,
    hasRole,
    hasGroup,
    userPermissions,
    userRoles,
    userGroups,
    accessibleFeatures,
    accessibleComponents
  } = useAccessControl();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔐 Access Control Test</Text>
      
      {/* User Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Your Access Information</Text>
        <Text style={styles.infoText}>Roles: {userRoles.join(', ') || 'None'}</Text>
        <Text style={styles.infoText}>Groups: {userGroups.join(', ') || 'None'}</Text>
        <Text style={styles.infoText}>Accessible Features: {accessibleFeatures.length}</Text>
        <Text style={styles.infoText}>Accessible Components: {accessibleComponents.length}</Text>
      </View>

      {/* Test Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Feature Access Tests</Text>
        
        {/* Students Feature Test */}
        <SecureFeature featureId="students">
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>✅ Students Feature - ACCESSIBLE</Text>
            <Text style={styles.testDescription}>
              You can see this because you have access to the students feature
            </Text>
            <View style={styles.actionButtons}>
              {canViewFeature('students') && (
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>View Students</Text>
                </TouchableOpacity>
              )}
              {canEditFeature('students') && (
                <TouchableOpacity style={[styles.button, styles.editButton]}>
                  <Text style={styles.buttonText}>Edit Students</Text>
                </TouchableOpacity>
              )}
              {canDeleteFeature('students') && (
                <TouchableOpacity style={[styles.button, styles.deleteButton]}>
                  <Text style={styles.buttonText}>Delete Students</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SecureFeature>

        {/* Finance Feature Test - Should be hidden for non-admin users */}
        <SecureFeature featureId="finance">
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>💰 Finance Feature - ACCESSIBLE</Text>
            <Text style={styles.testDescription}>
              You can see this because you have access to the finance feature
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>View Finance</Text>
            </TouchableOpacity>
          </View>
        </SecureFeature>

        {/* Secret Feature Test - Should be completely hidden */}
        <SecureFeature featureId="secret-feature">
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>🔒 Secret Feature - ACCESSIBLE</Text>
            <Text style={styles.testDescription}>
              You can see this because you have access to the secret feature
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Access Secret</Text>
            </TouchableOpacity>
          </View>
        </SecureFeature>
      </View>

      {/* Test Components */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Component Access Tests</Text>
        
        {/* Student List Component Test */}
        <SecureFeature featureId="students" componentId="student-list">
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>📋 Student List Component - ACCESSIBLE</Text>
            <Text style={styles.testDescription}>
              You can see this because you have access to the student-list component
            </Text>
            <View style={styles.actionButtons}>
              {canViewComponent('student-list') && (
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>View List</Text>
                </TouchableOpacity>
              )}
              {canEditComponent('student-list') && (
                <TouchableOpacity style={[styles.button, styles.editButton]}>
                  <Text style={styles.buttonText}>Edit List</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SecureFeature>

        {/* Student Form Component Test */}
        <SecureFeature featureId="students" componentId="student-form">
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>📝 Student Form Component - ACCESSIBLE</Text>
            <Text style={styles.testDescription}>
              You can see this because you have access to the student-form component
            </Text>
            <View style={styles.actionButtons}>
              {canViewComponent('student-form') && (
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>View Form</Text>
                </TouchableOpacity>
              )}
              {canEditComponent('student-form') && (
                <TouchableOpacity style={[styles.button, styles.editButton]}>
                  <Text style={styles.buttonText}>Edit Form</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SecureFeature>
      </View>

      {/* Test Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔑 Permission Tests</Text>
        
        {hasPermission('export_data') && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>📤 Export Permission - GRANTED</Text>
            <Text style={styles.testDescription}>
              You have permission to export data
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Export Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasPermission('import_data') && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>📥 Import Permission - GRANTED</Text>
            <Text style={styles.testDescription}>
              You have permission to import data
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Import Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasPermission('admin_access') && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>👑 Admin Permission - GRANTED</Text>
            <Text style={styles.testDescription}>
              You have admin-level permissions
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Admin Panel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Test Roles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Role Tests</Text>
        
        {hasRole('teacher') && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>👨‍🏫 Teacher Role - ACTIVE</Text>
            <Text style={styles.testDescription}>
              You have teacher-level access
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Teacher Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasRole('admin') && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>👑 Admin Role - ACTIVE</Text>
            <Text style={styles.testDescription}>
              You have admin-level access
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Admin Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasRole('owner') && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>👑 Owner Role - ACTIVE</Text>
            <Text style={styles.testDescription}>
              You have owner-level access (full control)
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Owner Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Test Groups */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Group Tests</Text>
        
        {hasGroup('finance') && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>💰 Finance Group - MEMBER</Text>
            <Text style={styles.testDescription}>
              You have access to financial features
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Finance Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasGroup('hr') && (
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>👥 HR Group - MEMBER</Text>
            <Text style={styles.testDescription}>
              You have access to HR features
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>HR Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Hidden Features Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚫 Hidden Features Test</Text>
        <Text style={styles.infoText}>
          The features below should be completely hidden if you don't have access:
        </Text>
        
        {/* This should be hidden for most users */}
        <SecureFeature featureId="restricted-feature">
          <View style={styles.testCard}>
            <Text style={styles.testTitle}>🔒 Restricted Feature - ACCESSIBLE</Text>
            <Text style={styles.testDescription}>
              This feature should be hidden for unauthorized users
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Access Restricted</Text>
            </TouchableOpacity>
          </View>
        </SecureFeature>
      </View>

      {/* Debug Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🐛 Debug Information</Text>
        <Text style={styles.infoText}>User Permissions: {userPermissions.length}</Text>
        <Text style={styles.infoText}>User Roles: {userRoles.join(', ')}</Text>
        <Text style={styles.infoText}>User Groups: {userGroups.join(', ')}</Text>
        <Text style={styles.infoText}>Accessible Features: {accessibleFeatures.join(', ')}</Text>
        <Text style={styles.infoText}>Accessible Components: {accessibleComponents.join(', ')}</Text>
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
    marginBottom: 20,
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
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  testDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AccessControlTest; 
