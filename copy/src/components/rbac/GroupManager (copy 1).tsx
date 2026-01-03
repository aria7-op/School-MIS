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

interface Group {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  roles?: any[];
  users?: any[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  type: string;
}

const GroupManager: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'DEFAULT',
    isActive: true
  });

  const groupTypes = ['DEFAULT', 'CUSTOM', 'SYSTEM', 'DEPARTMENT', 'TEAM'];
  const filterTypes = ['all', 'active', 'inactive', 'system', 'custom'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsResponse, rolesResponse] = await Promise.all([
        secureApiService.get('/rbac/groups'),
        secureApiService.get('/rbac/roles')
      ]);
      
      setGroups(groupsResponse.data || []);
      setRoles(rolesResponse.data || []);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load groups and roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      setLoading(true);
      const group = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        isActive: formData.isActive
      };

      await secureApiService.post('/rbac/groups', group);
      Alert.alert('Success', 'Group created successfully');
      setShowCreateModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    try {
      setLoading(true);
      const updatedGroup = {
        ...selectedGroup,
        ...formData
      };

      await secureApiService.put(`/rbac/groups/${selectedGroup.id}`, updatedGroup);
      Alert.alert('Success', 'Group updated successfully');
      setShowEditModal(false);
      setSelectedGroup(null);
      resetForm();
      await loadData();
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await secureApiService.delete(`/rbac/groups/${groupId}`);
              Alert.alert('Success', 'Group deleted successfully');
              await loadData();
            } catch (error) {
              
              Alert.alert('Error', 'Failed to delete group');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAssignRoles = async (groupId: string, roleIds: string[]) => {
    try {
      setLoading(true);
      const assignments = roleIds.map(roleId => ({
        groupId,
        roleId,
        scope: 'global',
        priority: 1
      }));

      await secureApiService.post('/rbac/permissions/bulk-assign', { assignments });
      Alert.alert('Success', 'Roles assigned successfully');
      setShowRolesModal(false);
      await loadData();
    } catch (error) {
      
      Alert.alert('Error', 'Failed to assign roles');
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      type: group.type,
      isActive: group.isActive
    });
    setShowEditModal(true);
  };

  const handleManageRoles = (group: Group) => {
    setSelectedGroup(group);
    setShowRolesModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'DEFAULT',
      isActive: true
    });
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'active' && group.isActive) ||
                         (filterType === 'inactive' && !group.isActive) ||
                         (filterType === 'system' && group.type === 'SYSTEM') ||
                         (filterType === 'custom' && group.type === 'CUSTOM');

    return matchesSearch && matchesFilter;
  });

  const renderGroupItem = ({ item }: { item: Group }) => (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <View style={styles.groupBadges}>
            <View style={[styles.badge, styles.typeBadge]}>
              <Text style={styles.badgeText}>{item.type}</Text>
            </View>
            <View style={[styles.badge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={styles.badgeText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <Text style={styles.groupDescription}>{item.description}</Text>
      
      <View style={styles.groupDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Roles:</Text>
          <Text style={styles.detailValue}>{item.roles?.length || 0}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Users:</Text>
          <Text style={styles.detailValue}>{item.users?.length || 0}</Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rolesButton]}
          onPress={() => handleManageRoles(item)}
        >
          <Text style={styles.buttonText}>Roles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditGroup(item)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        {item.type !== 'SYSTEM' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteGroup(item.id)}
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
          <Text style={styles.modalTitle}>Create New Group</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Group Name"
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
            <Text style={styles.pickerLabel}>Group Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {groupTypes.map((type) => (
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
              onPress={handleCreateGroup}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Creating...' : 'Create Group'}
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
          <Text style={styles.modalTitle}>Edit Group</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Group Name"
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
            <Text style={styles.pickerLabel}>Group Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {groupTypes.map((type) => (
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
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowEditModal(false);
                setSelectedGroup(null);
                resetForm();
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleUpdateGroup}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Updating...' : 'Update Group'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderRolesModal = () => (
    <Modal visible={showRolesModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Manage Roles - {selectedGroup?.name}
          </Text>
          
          <Text style={styles.modalSubtitle}>
            Select roles to assign to this group
          </Text>
          
          <ScrollView style={styles.rolesList}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={styles.roleItem}
                onPress={() => {
                  // Toggle role selection
                  const isSelected = selectedGroup?.roles?.some(r => r.id === role.id);
                  if (isSelected) {
                    // Remove role
                    const updatedRoles = selectedGroup.roles.filter(r => r.id !== role.id);
                    setSelectedGroup({ ...selectedGroup, roles: updatedRoles });
                  } else {
                    // Add role
                    const updatedRoles = [...(selectedGroup?.roles || []), role];
                    setSelectedGroup({ ...selectedGroup, roles: updatedRoles });
                  }
                }}
              >
                <View style={styles.roleItemContent}>
                  <Text style={styles.roleName}>{role.name}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                  <Text style={styles.roleType}>{role.type}</Text>
                </View>
                <View style={[
                  styles.roleCheckbox,
                  selectedGroup?.roles?.some(r => r.id === role.id) && styles.roleCheckboxSelected
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
                setShowRolesModal(false);
                setSelectedGroup(null);
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => {
                if (selectedGroup) {
                  const roleIds = selectedGroup.roles?.map(r => r.id) || [];
                  handleAssignRoles(selectedGroup.id, roleIds);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Assigning...' : 'Assign Roles'}
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
        <Text style={styles.title}>👥 Group Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Create Group</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
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
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          style={styles.groupList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderCreateModal()}
      {renderEditModal()}
      {renderRolesModal()}
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
  groupList: {
    flex: 1,
  },
  groupCard: {
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadge: {
    backgroundColor: '#8B5CF6',
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
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  groupDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    width: 60,
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
  rolesButton: {
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
  rolesList: {
    maxHeight: 300,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  roleItemContent: {
    flex: 1,
  },
  roleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  roleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  roleType: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  roleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCheckboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default GroupManager; 
