import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import SecureFeature from '../components/SecureFeature';
import { useAccessControl } from '../hooks/useAccessControl';

// Example component showing how to use the ultra-advanced access control system
const AccessControlExample: React.FC = () => {
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
      <Text style={styles.title}>🔐 Ultra Advanced Access Control Example</Text>
      
      {/* User Access Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 Your Access Information</Text>
        <Text style={styles.infoText}>Roles: {userRoles.join(', ') || 'None'}</Text>
        <Text style={styles.infoText}>Groups: {userGroups.join(', ') || 'None'}</Text>
        <Text style={styles.infoText}>Accessible Features: {accessibleFeatures.length}</Text>
        <Text style={styles.infoText}>Accessible Components: {accessibleComponents.length}</Text>
      </View>

      {/* Feature-Level Access Control Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Feature-Level Access Control</Text>
        
        {/* Students Feature */}
        <SecureFeature featureId="students">
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>👨‍🎓 Students Management</Text>
            <Text style={styles.featureDescription}>
              Manage student information, enrollments, and records
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

        {/* Teachers Feature */}
        <SecureFeature featureId="teachers">
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>👨‍🏫 Teachers Management</Text>
            <Text style={styles.featureDescription}>
              Manage teacher information and assignments
            </Text>
            
            <View style={styles.actionButtons}>
              {canViewFeature('teachers') && (
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>View Teachers</Text>
                </TouchableOpacity>
              )}
              
              {canEditFeature('teachers') && (
                <TouchableOpacity style={[styles.button, styles.editButton]}>
                  <Text style={styles.buttonText}>Edit Teachers</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SecureFeature>

        {/* Finance Feature - Only for Admin/Owner */}
        <SecureFeature featureId="finance">
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>💰 Finance Management</Text>
            <Text style={styles.featureDescription}>
              Manage financial records and transactions
            </Text>
            
            <View style={styles.actionButtons}>
              {canViewFeature('finance') && (
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>View Finance</Text>
                </TouchableOpacity>
              )}
              
              {canEditFeature('finance') && (
                <TouchableOpacity style={[styles.button, styles.editButton]}>
                  <Text style={styles.buttonText}>Edit Finance</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SecureFeature>
      </View>

      {/* Component-Level Access Control Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Component-Level Access Control</Text>
        
        {/* Student List Component */}
        <SecureFeature featureId="students" componentId="student-list">
          <View style={styles.componentCard}>
            <Text style={styles.componentTitle}>📋 Student List Component</Text>
            <Text style={styles.componentDescription}>
              Displays list of all students
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

        {/* Student Form Component */}
        <SecureFeature featureId="students" componentId="student-form">
          <View style={styles.componentCard}>
            <Text style={styles.componentTitle}>📝 Student Form Component</Text>
            <Text style={styles.componentDescription}>
              Form for creating/editing student information
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

      {/* Permission-Based Access Control Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔑 Permission-Based Access Control</Text>
        
        {/* Export Permission */}
        {hasPermission('export_data') && (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>📤 Export Data</Text>
            <Text style={styles.permissionDescription}>
              You have permission to export data
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Export Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Import Permission */}
        {hasPermission('import_data') && (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>📥 Import Data</Text>
            <Text style={styles.permissionDescription}>
              You have permission to import data
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Import Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Permission */}
        {hasPermission('admin_access') && (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionTitle}>👑 Admin Access</Text>
            <Text style={styles.permissionDescription}>
              You have admin-level permissions
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Admin Panel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Role-Based Access Control Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Role-Based Access Control</Text>
        
        {/* Teacher Role */}
        {hasRole('teacher') && (
          <View style={styles.roleCard}>
            <Text style={styles.roleTitle}>👨‍🏫 Teacher Role</Text>
            <Text style={styles.roleDescription}>
              You have teacher-level access
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Teacher Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Role */}
        {hasRole('admin') && (
          <View style={styles.roleCard}>
            <Text style={styles.roleTitle}>👑 Admin Role</Text>
            <Text style={styles.roleDescription}>
              You have admin-level access
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Admin Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Owner Role */}
        {hasRole('owner') && (
          <View style={styles.roleCard}>
            <Text style={styles.roleTitle}>👑 Owner Role</Text>
            <Text style={styles.roleDescription}>
              You have owner-level access (full control)
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Owner Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Group-Based Access Control Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Group-Based Access Control</Text>
        
        {/* Finance Group */}
        {hasGroup('finance') && (
          <View style={styles.groupCard}>
            <Text style={styles.groupTitle}>💰 Finance Group</Text>
            <Text style={styles.groupDescription}>
              You have access to financial features
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Finance Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* HR Group */}
        {hasGroup('hr') && (
          <View style={styles.groupCard}>
            <Text style={styles.groupTitle}>👥 HR Group</Text>
            <Text style={styles.groupDescription}>
              You have access to HR features
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>HR Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Hidden Features Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚫 Hidden Features (No Access)</Text>
        
        {/* This feature will be completely hidden if user doesn't have access */}
        <SecureFeature featureId="secret-feature">
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>🔒 Secret Feature</Text>
            <Text style={styles.featureDescription}>
              This feature is only visible to authorized users
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Access Secret Feature</Text>
            </TouchableOpacity>
          </View>
        </SecureFeature>

        {/* This feature shows unauthorized message */}
        <SecureFeature 
          featureId="restricted-feature" 
          showUnauthorizedMessage={true}
        >
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>🔒 Restricted Feature</Text>
            <Text style={styles.featureDescription}>
              This feature shows unauthorized message
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Access Restricted Feature</Text>
            </TouchableOpacity>
          </View>
        </SecureFeature>
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
  featureCard: {
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
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  componentCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  componentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  componentDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  permissionCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 12,
    color: '#047857',
    marginBottom: 8,
  },
  roleCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: 8,
  },
  groupCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5B21B6',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 12,
    color: '#7C3AED',
    marginBottom: 8,
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

export default AccessControlExample; 
