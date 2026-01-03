import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Switch, Alert, FlatList } from 'react-native';
import apiService from '../../../services/api';

const UltraAdvancedRoleAssignment: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    userId: '',
    roleId: '',
    assignedBy: '',
    conditions: {},
    permissions: [],
    components: [],
    features: [],
    isActive: true,
    expiresAt: null,
    priority: 1
  });

  // Assignment Types
  const assignmentTypes = [
    { id: 'permanent', name: 'Permanent', icon: '♾️', color: '#10B981' },
    { id: 'temporary', name: 'Temporary', icon: '⏰', color: '#F59E0B' },
    { id: 'conditional', name: 'Conditional', icon: '🔀', color: '#8B5CF6' },
    { id: 'inherited', name: 'Inherited', icon: '👥', color: '#3B82F6' },
    { id: 'delegated', name: 'Delegated', icon: '🎭', color: '#EF4444' }
  ];

  // Permission Scopes
  const permissionScopes = [
    { id: 'global', name: 'Global', icon: '🌍', color: '#10B981' },
    { id: 'feature', name: 'Feature', icon: '🔧', color: '#3B82F6' },
    { id: 'component', name: 'Component', icon: '⚙️', color: '#F59E0B' },
    { id: 'data', name: 'Data', icon: '📊', color: '#8B5CF6' },
    { id: 'time', name: 'Time-based', icon: '🕐', color: '#EF4444' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fixed API endpoints - removed double /api/ prefix
      const [usersRes, rolesRes, assignmentsRes, analyticsRes] = await Promise.all([
        apiService.get('/users'),
        apiService.get('/rbac/roles'),
        apiService.get('/rbac/assignments'),
        apiService.get('/rbac/analytics')
      ]);
      
      setUsers(usersRes.data || []);
      setRoles(rolesRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setAnalytics(analyticsRes.data || {});
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, roleId: string, assignmentType: string = 'direct') => {
    try {
      setLoading(true);
      // Fixed role assignment endpoint
      const response = await apiService.post('/rbac/assignments', {
        userId,
        roleId,
        assignmentType,
        assignedBy: 'owner',
        assignedAt: new Date().toISOString()
      });
      
      if (response.success) {
        Alert.alert('Success', 'Role assigned successfully');
        await loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to assign role');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (assignmentId: string) => {
    try {
      setLoading(true);
      // Fixed role removal endpoint
      const response = await apiService.delete(`/rbac/assignments/${assignmentId}`);
      
      if (response.success) {
        Alert.alert('Success', 'Role removed successfully');
        await loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to remove role');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to remove role');
    } finally {
      setLoading(false);
    }
  };

  const bulkAssignRoles = async (userIds: string[], roleId: string) => {
    try {
      setLoading(true);
      // Fixed bulk assignment endpoint
      const response = await apiService.post('/rbac/assignments/bulk', {
        userIds,
        roleId,
        assignmentType: 'bulk',
        assignedBy: 'owner'
      });
      
      if (response.success) {
        Alert.alert('Success', `Roles assigned to ${userIds.length} users successfully`);
        await loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to bulk assign roles');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to bulk assign roles');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentToggle = async (assignmentId: string, isActive: boolean) => {
    try {
      // Fixed assignment update endpoint
      const response = await apiService.put(`/rbac/assignments/${assignmentId}`, { isActive });
      
      if (response.success) {
        await loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to update assignment');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update assignment');
    }
  };

  const renderUserAssignments = () => (
    <ScrollView style={styles.userAssignmentsContainer}>
      {users.map(user => (
        <View key={user.id} style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <TouchableOpacity 
              style={styles.assignButton}
              onPress={() => {
                setAssignmentForm(prev => ({ ...prev, userId: user.id }));
                setShowAssignmentModal(true);
              }}
            >
              <Text style={styles.assignButtonText}>Assign Role</Text>
            </TouchableOpacity>
          </View>
          
          {/* User's Current Assignments */}
          <View style={styles.userAssignments}>
            <Text style={styles.sectionTitle}>Current Roles</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {assignments.filter(a => a.userId === user.id).map(assignment => {
                const role = roles.find(r => r.id === assignment.roleId);
                return (
                  <View key={assignment.id} style={styles.assignmentCard}>
                    <Text style={styles.roleName}>{role?.name}</Text>
                    <Text style={styles.assignmentType}>{assignment.type}</Text>
                    <View style={styles.assignmentActions}>
                      <Switch
                        value={assignment.isActive}
                        onValueChange={(value) => handleAssignmentToggle(assignment.id, value)}
                      />
                      <TouchableOpacity style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderRoleHierarchy = () => (
    <ScrollView style={styles.roleHierarchyContainer}>
      <Text style={styles.sectionTitle}>Role Hierarchy & Inheritance</Text>
      
      {roles.map(role => (
        <View key={role.id} style={styles.roleHierarchyCard}>
          <View style={styles.roleHeader}>
            <Text style={styles.roleName}>{role.name}</Text>
            <Text style={styles.roleDescription}>{role.description}</Text>
          </View>
          
          {/* Inherited Roles */}
          {role.parentRole && (
            <View style={styles.inheritedRoles}>
              <Text style={styles.inheritedTitle}>Inherits from:</Text>
              <Text style={styles.inheritedRole}>{role.parentRole}</Text>
            </View>
          )}
          
          {/* Child Roles */}
          {roles.filter(r => r.parentRole === role.id).length > 0 && (
            <View style={styles.childRoles}>
              <Text style={styles.childTitle}>Child roles:</Text>
              {roles.filter(r => r.parentRole === role.id).map(childRole => (
                <Text key={childRole.id} style={styles.childRole}>{childRole.name}</Text>
              ))}
            </View>
          )}
          
          {/* Role Permissions */}
          <View style={styles.rolePermissions}>
            <Text style={styles.permissionsTitle}>Permissions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {role.permissions?.map((permission: string) => (
                <View key={permission} style={styles.permissionChip}>
                  <Text style={styles.permissionText}>{permission}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderAssignmentAnalytics = () => (
    <ScrollView style={styles.analyticsContainer}>
      <Text style={styles.sectionTitle}>Assignment Analytics</Text>
      
      {/* Assignment Statistics */}
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>{assignments.length}</Text>
          <Text style={styles.analyticsLabel}>Total Assignments</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {assignments.filter(a => a.isActive).length}
          </Text>
          <Text style={styles.analyticsLabel}>Active Assignments</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {assignments.filter(a => a.type === 'temporary').length}
          </Text>
          <Text style={styles.analyticsLabel}>Temporary Assignments</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>
            {assignments.filter(a => a.type === 'conditional').length}
          </Text>
          <Text style={styles.analyticsLabel}>Conditional Assignments</Text>
        </View>
      </View>
      
      {/* Role Distribution */}
      <View style={styles.roleDistribution}>
        <Text style={styles.distributionTitle}>Role Distribution</Text>
        {roles.map(role => {
          const roleAssignments = assignments.filter(a => a.roleId === role.id);
          return (
            <View key={role.id} style={styles.distributionItem}>
              <Text style={styles.distributionRole}>{role.name}</Text>
              <View style={styles.distributionBar}>
                <View 
                  style={[
                    styles.distributionFill, 
                    { width: `${(roleAssignments.length / users.length) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.distributionCount}>{roleAssignments.length}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎭 Ultra Advanced Role Assignment</Text>
        <Text style={styles.subtitle}>Granular role assignment with inheritance and conditions</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowAssignmentModal(true)}
        >
          <Text style={styles.actionButtonText}>+ New Assignment</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowBulkModal(true)}
        >
          <Text style={styles.actionButtonText}>📦 Bulk Assignment</Text>
        </TouchableOpacity>
      </View>

      {/* Content Tabs */}
      <View style={styles.contentTabs}>
        <TouchableOpacity style={[styles.contentTab, styles.activeContentTab]}>
          <Text style={styles.contentTabText}>User Assignments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contentTab}>
          <Text style={styles.contentTabText}>Role Hierarchy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contentTab}>
          <Text style={styles.contentTabText}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderUserAssignments()}
      </View>

      {/* Assignment Modal */}
      <Modal visible={showAssignmentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Role Assignment</Text>
            
            {/* User Selection */}
            <Text style={styles.sectionTitle}>Select User</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.userSelection}>
              {users.map(user => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userChip,
                    assignmentForm.userId === user.id && styles.selectedUserChip
                  ]}
                  onPress={() => setAssignmentForm(prev => ({ ...prev, userId: user.id }))}
                >
                  <Text style={[
                    styles.userChipText,
                    assignmentForm.userId === user.id && styles.selectedUserChipText
                  ]}>
                    {user.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Role Selection */}
            <Text style={styles.sectionTitle}>Select Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleSelection}>
              {roles.map(role => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleChip,
                    assignmentForm.roleId === role.id && styles.selectedRoleChip
                  ]}
                  onPress={() => setAssignmentForm(prev => ({ ...prev, roleId: role.id }))}
                >
                  <Text style={[
                    styles.roleChipText,
                    assignmentForm.roleId === role.id && styles.selectedRoleChipText
                  ]}>
                    {role.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Assignment Type */}
            <Text style={styles.sectionTitle}>Assignment Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelection}>
              {assignmentTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeChip,
                    { borderColor: type.color }
                  ]}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={styles.typeText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAssignmentModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateAssignment}>
                <Text style={styles.saveButtonText}>Create Assignment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  contentTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contentTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeContentTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  contentTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  userAssignmentsContainer: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  assignButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  userAssignments: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  assignmentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 150,
  },
  roleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  assignmentType: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 8,
  },
  assignmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roleHierarchyContainer: {
    flex: 1,
    padding: 20,
  },
  roleHierarchyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleHeader: {
    marginBottom: 12,
  },
  roleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  inheritedRoles: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  inheritedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  inheritedRole: {
    fontSize: 12,
    color: '#0369A1',
  },
  childRoles: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  childTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  childRole: {
    fontSize: 12,
    color: '#92400E',
  },
  rolePermissions: {
    marginTop: 8,
  },
  permissionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  permissionChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 10,
    color: '#6B7280',
  },
  analyticsContainer: {
    flex: 1,
    padding: 20,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  roleDistribution: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distributionRole: {
    fontSize: 14,
    color: '#374151',
    width: 100,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  distributionFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 12,
    color: '#6B7280',
    width: 30,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  userSelection: {
    marginBottom: 16,
  },
  userChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedUserChip: {
    backgroundColor: '#3B82F6',
  },
  userChipText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedUserChipText: {
    color: 'white',
  },
  roleSelection: {
    marginBottom: 16,
  },
  roleChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedRoleChip: {
    backgroundColor: '#10B981',
  },
  roleChipText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedRoleChipText: {
    color: 'white',
  },
  typeSelection: {
    marginBottom: 20,
  },
  typeChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
});

export default UltraAdvancedRoleAssignment; 
