import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, TextInput, FlatList, Alert, Switch } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';

// Advanced Role Management with Granular Permissions
const AdvancedRoleManagement: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    isActive: true,
    permissions: [],
    components: [],
    features: [],
    dataScopes: [],
    conditions: {}
  });

  // Permission Categories
  const permissionCategories = {
    'Dashboard': ['view_dashboard', 'edit_dashboard', 'delete_dashboard'],
    'Students': ['view_students', 'create_students', 'edit_students', 'delete_students', 'export_students'],
    'Teachers': ['view_teachers', 'create_teachers', 'edit_teachers', 'delete_teachers', 'export_teachers'],
    'Finance': ['view_finance', 'create_finance', 'edit_finance', 'delete_finance', 'export_finance'],
    'Reports': ['view_reports', 'create_reports', 'edit_reports', 'delete_reports', 'export_reports'],
    'Settings': ['view_settings', 'edit_settings', 'delete_settings'],
    'System': ['system_admin', 'system_backup', 'system_restore', 'system_logs']
  };

  // Component Access Levels
  const accessLevels = ['NONE', 'READ', 'WRITE', 'ADMIN'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Using correct API endpoints from guideaccess.txt
      const [rolesRes, componentsRes, featuresRes, permissionsRes] = await Promise.all([
        apiService.get('/rbac/roles'),
        apiService.get('/rbac/components'),
        apiService.get('/rbac/features'),
        apiService.get('/rbac/permissions')
      ]);
      
      setRoles(rolesRes.data || []);
      setComponents(componentsRes.data || []);
      setFeatures(featuresRes.data || []);
      setPermissions(permissionsRes.data || []);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!roleForm.name.trim()) {
      Alert.alert('Error', 'Role name is required');
      return;
    }

    setLoading(true);
    try {
      // Prepare role data according to backend expectations
      const roleData = {
        name: roleForm.name,
        description: roleForm.description,
        type: 'STAFF', // Default type, you can add a type field to the form
        isActive: roleForm.isActive,
        isSystem: false,
        isDefault: false,
        priority: 0
      };

      // Use the createRole method from api.ts
      const response = await apiService.createRole(roleData);

      if (response.success) {
        Alert.alert('Success', 'Role created successfully');
        await loadData();
        setShowRoleModal(false);
        setRoleForm({ name: '', description: '', isActive: true, permissions: [], components: [], features: [], dataScopes: [], conditions: {} });
      } else {
        Alert.alert('Error', response.message || 'Failed to create role');
      }
    } catch (error: any) {
      
      Alert.alert('Error', error.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleComponentAccessChange = async (componentId: string, accessLevel: string) => {
    try {
      // Fixed component permission endpoint
      const response = await apiService.post('/rbac/components/permissions', {
        componentId,
        accessLevel,
        roleId: selectedRole?.id
      });
      
      if (response.success) {
        await loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to update component access');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update component access');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Advanced Role Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowRoleModal(true)}>
          <Text style={styles.addButtonText}>+ Create Role</Text>
        </TouchableOpacity>
      </View>

      {/* Role List */}
      <ScrollView style={styles.roleList}>
        {roles.map(role => (
          <TouchableOpacity 
            key={role.id} 
            style={[styles.roleCard, selectedRole?.id === role.id && styles.selectedRole]}
            onPress={() => setSelectedRole(role)}
          >
            <View style={styles.roleHeader}>
              <Text style={styles.roleName}>{role.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: role.isActive ? '#10B981' : '#EF4444' }]}>
                <Text style={styles.statusText}>{role.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            <Text style={styles.roleDescription}>{role.description}</Text>
            <Text style={styles.roleStats}>
              {role.permissions?.length || 0} permissions • {role.components?.length || 0} components
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Role Creation Modal */}
      <Modal visible={showRoleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Role</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Role Name"
              value={roleForm.name}
              onChangeText={(text) => setRoleForm(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description"
              multiline
              value={roleForm.description}
              onChangeText={(text) => setRoleForm(prev => ({ ...prev, description: text }))}
            />

            {/* Permissions Section */}
            <Text style={styles.sectionTitle}>Permissions</Text>
            <ScrollView style={styles.permissionsContainer}>
              {Object.entries(permissionCategories).map(([category, perms]) => (
                <View key={category} style={styles.permissionCategory}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  {perms.map(permission => (
                    <View key={permission} style={styles.permissionItem}>
                      <Switch
                        value={roleForm.permissions.includes(permission)}
                        onValueChange={() => handlePermissionToggle(permission)}
                      />
                      <Text style={styles.permissionText}>{permission}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowRoleModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateRole}>
                <Text style={styles.saveButtonText}>Create Role</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  roleList: {
    flex: 1,
    padding: 20,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRole: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  roleStats: {
    fontSize: 12,
    color: '#9CA3AF',
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
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  permissionsContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  permissionCategory: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4B5563',
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

export default AdvancedRoleManagement; 
