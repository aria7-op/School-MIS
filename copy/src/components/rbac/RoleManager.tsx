import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
  Switch
} from 'react-native';
import secureApiService from '../../services/secureApiService';

interface Role {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  permissions?: any[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  action: string;
}

const RoleManager: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'STAFF',
    isActive: true,
    isSystem: false,
    isDefault: false,
    priority: 0
  });

  const roleTypes = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'STAFF', 'PARENT', 'ACCOUNTANT', 'LIBRARIAN'];
  const filterTypes = ['all', 'active', 'inactive', 'system', 'custom'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        secureApiService.get('/rbac/roles'),
        secureApiService.get('/rbac/permissions')
      ]);
      
      setRoles(rolesResponse.data || []);
      setPermissions(permissionsResponse.data || []);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter a role name');
      return;
    }

    try {
      setLoading(true);
      const role = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        isActive: formData.isActive,
        isSystem: formData.isSystem,
        isDefault: formData.isDefault,
        priority: formData.priority
      };

      await secureApiService.post('/rbac/roles', role);
      Alert.alert('Success', 'Role created successfully');
      setShowCreateModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      
      Alert.alert('Error', 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      const updatedRole = {
        ...selectedRole,
        ...formData
      };

      await secureApiService.put(`/rbac/roles/${selectedRole.id}`, updatedRole);
      Alert.alert('Success', 'Role updated successfully');
      setShowEditModal(false);
      setSelectedRole(null);
      resetForm();
      await loadData();
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this role? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await secureApiService.delete(`/rbac/roles/${roleId}`);
              Alert.alert('Success', 'Role deleted successfully');
              await loadData();
            } catch (error) {
              
              Alert.alert('Error', 'Failed to delete role');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAssignPermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      setLoading(true);
      const assignments = permissionIds.map(permissionId => ({
        roleId,
        permissionId,
        scope: 'global',
        priority: 1
      }));

      await secureApiService.post('/rbac/permissions/bulk-assign', { roleId, assignments });
      Alert.alert('Success', 'Permissions assigned successfully');
      setShowPermissionsModal(false);
      await loadData();
    } catch (error) {
      
      Alert.alert('Error', 'Failed to assign permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      type: role.type,
      isActive: role.isActive,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      priority: role.priority
    });
    setShowEditModal(true);
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'STAFF',
      isActive: true,
      isSystem: false,
      isDefault: false,
      priority: 0
    });
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'active' && role.isActive) ||
                         (filterType === 'inactive' && !role.isActive) ||
                         (filterType === 'system' && role.isSystem) ||
                         (filterType === 'custom' && !role.isSystem);

    return matchesSearch && matchesFilter;
  });

  const renderRoleItem = ({ item }: { item: Role }) => (
    <View style={styles.roleCard}>
      <View style={styles.roleHeader}>
        <View style={styles.roleInfo}>
          <Text style={styles.roleName}>{item.name}</Text>
          <View style={styles.roleBadges}>
            {item.isSystem && (
              <View style={[styles.badge, styles.systemBadge]}>
                <Text style={styles.badgeText}>System</Text>
              </View>
            )}
            {item.isDefault && (
              <View style={[styles.badge, styles.defaultBadge]}>
                <Text style={styles.badgeText}>Default</Text>
              </View>
            )}
            <View style={[styles.badge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={styles.badgeText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.roleType}>{item.type}</Text>
      </View>
      
      <Text style={styles.roleDescription}>{item.description}</Text>
      
      <View style={styles.roleDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Priority:</Text>
          <Text style={styles.detailValue}>{item.priority}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Permissions:</Text>
          <Text style={styles.detailValue}>{item.permissions?.length || 0}</Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.permissionsButton]}
          onPress={() => handleManagePermissions(item)}
        >
          <Text style={styles.buttonText}>Permissions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditRole(item)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        {!item.isSystem && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRole(item.id)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Role</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Role Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
          />
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Role Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {roleTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    formData.type === type && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.type === type && styles.pickerOptionTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData({ ...formData, isActive: value })}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>System Role</Text>
            <Switch
              value={formData.isSystem}
              onValueChange={(value) => setFormData({ ...formData, isSystem: value })}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Default Role</Text>
            <Switch
              value={formData.isDefault}
              onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
            />
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Priority (0-100)"
            value={formData.priority.toString()}
            onChangeText={(text) => setFormData({ ...formData, priority: parseInt(text) || 0 })}
            keyboardType="numeric"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleCreateRole}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Creating...' : 'Create Role'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal visible={showEditModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Role</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Role Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
          />
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Role Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {roleTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    formData.type === type && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.type === type && styles.pickerOptionTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData({ ...formData, isActive: value })}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>System Role</Text>
            <Switch
              value={formData.isSystem}
              onValueChange={(value) => setFormData({ ...formData, isSystem: value })}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Default Role</Text>
            <Switch
              value={formData.isDefault}
              onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
            />
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Priority (0-100)"
            value={formData.priority.toString()}
            onChangeText={(text) => setFormData({ ...formData, priority: parseInt(text) || 0 })}
            keyboardType="numeric"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowEditModal(false);
                setSelectedRole(null);
                resetForm();
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleUpdateRole}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Updating...' : 'Update Role'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPermissionsModal = () => (
    <Modal visible={showPermissionsModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Manage Permissions - {selectedRole?.name}
          </Text>
          
          <Text style={styles.modalSubtitle}>
            Select permissions to assign to this role
          </Text>
          
          <ScrollView style={styles.permissionsList}>
            {permissions.map((permission) => (
              <TouchableOpacity
                key={permission.id}
                style={styles.permissionItem}
                onPress={() => {
                  // Toggle permission selection
                  const isSelected = selectedRole?.permissions?.some(p => p.id === permission.id);
                  if (isSelected) {
                    // Remove permission
                    const updatedPermissions = selectedRole.permissions.filter(p => p.id !== permission.id);
                    setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
                  } else {
                    // Add permission
                    const updatedPermissions = [...(selectedRole?.permissions || []), permission];
                    setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
                  }
                }}
              >
                <View style={styles.permissionItemContent}>
                  <Text style={styles.permissionName}>{permission.name}</Text>
                  <Text style={styles.permissionDescription}>{permission.description}</Text>
                  <Text style={styles.permissionAction}>{permission.action} on {permission.resourceType}</Text>
                </View>
                <View style={[
                  styles.permissionCheckbox,
                  selectedRole?.permissions?.some(p => p.id === permission.id) && styles.permissionCheckboxSelected
                ]}>
                  <Text style={styles.checkboxText}>✓</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowPermissionsModal(false);
                setSelectedRole(null);
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => {
                if (selectedRole) {
                  const permissionIds = selectedRole.permissions?.map(p => p.id) || [];
                  handleAssignPermissions(selectedRole.id, permissionIds);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Assigning...' : 'Assign Permissions'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Role Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Create Role</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search roles..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        
        <View style={styles.filterButtons}>
          {filterTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterButtonText, filterType === type && styles.filterButtonTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading roles...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRoles}
          renderItem={renderRoleItem}
          keyExtractor={(item) => item.id}
          style={styles.roleList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderCreateModal()}
      {renderEditModal()}
      {renderPermissionsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filters: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  roleList: {
    flex: 1,
  },
  roleCard: {
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
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  roleBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemBadge: {
    backgroundColor: '#8B5CF6',
  },
  defaultBadge: {
    backgroundColor: '#F59E0B',
  },
  activeBadge: {
    backgroundColor: '#10B981',
  },
  inactiveBadge: {
    backgroundColor: '#EF4444',
  },
  badgeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  roleType: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  roleDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  permissionsButton: {
    backgroundColor: '#8B5CF6',
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
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  pickerOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  pickerOptionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  pickerOptionTextSelected: {
    color: '#FFFFFF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  permissionsList: {
    maxHeight: 300,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  permissionItemContent: {
    flex: 1,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  permissionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  permissionAction: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  permissionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCheckboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default RoleManager; 
