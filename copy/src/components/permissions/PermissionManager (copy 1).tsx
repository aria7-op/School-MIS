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

interface Permission {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  resourceId: string;
  action: string;
  scope: string;
  isActive: boolean;
}

const PermissionManager: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resourceType: '',
    resourceId: '',
    action: 'READ',
    scope: 'ALL'
  });

  const resourceTypes = [
    'STUDENT', 'TEACHER', 'STAFF', 'FINANCE', 'REPORTS', 
    'SETTINGS', 'ADMIN', 'SYSTEM', 'CUSTOM'
  ];

  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'];
  const scopes = ['OWN', 'SCHOOL', 'ALL', 'CUSTOM'];

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await secureApiService.get('/rbac/permissions');
      if (response.success) {
        setPermissions(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch permissions');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  const createPermission = async (permissionData: any) => {
    try {
      setLoading(true);
      const response = await secureApiService.post('/rbac/permissions', permissionData);
      if (response.success) {
        await fetchPermissions();
        Alert.alert('Success', 'Permission created successfully');
        setShowCreateModal(false);
        resetForm();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create permission');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create permission');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (permissionId: string, updateData: any) => {
    try {
      setLoading(true);
      const response = await secureApiService.put(`/rbac/permissions/${permissionId}`, updateData);
      if (response.success) {
        await fetchPermissions();
        Alert.alert('Success', 'Permission updated successfully');
        setShowEditModal(false);
        setSelectedPermission(null);
        resetForm();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update permission');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update permission');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deletePermission = async (permissionId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this permission?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await secureApiService.delete(`/rbac/permissions/${permissionId}`);
              await fetchPermissions();
              Alert.alert('Success', 'Permission deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete permission');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditPermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description,
      resourceType: permission.resourceType,
      resourceId: permission.resourceId,
      action: permission.action,
      scope: permission.scope
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      resourceType: '',
      resourceId: '',
      action: 'READ',
      scope: 'ALL'
    });
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         permission.resourceType === filterType ||
                         permission.action === filterType;

    return matchesSearch && matchesFilter;
  });

  const renderPermissionItem = ({ item }: { item: Permission }) => (
    <View style={styles.permissionCard}>
      <View style={styles.permissionHeader}>
        <Text style={styles.permissionName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      
      <Text style={styles.permissionDescription}>{item.description}</Text>
      
      <View style={styles.permissionDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Resource:</Text>
          <Text style={styles.detailValue}>{item.resourceType}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Action:</Text>
          <Text style={styles.detailValue}>{item.action}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Scope:</Text>
          <Text style={styles.detailValue}>{item.scope}</Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditPermission(item)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deletePermission(item.id)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Permission</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Permission Name (e.g., student:read)"
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
            <Text style={styles.pickerLabel}>Resource Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {resourceTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    formData.resourceType === type && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, resourceType: type })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.resourceType === type && styles.pickerOptionTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Action:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action}
                  style={[
                    styles.pickerOption,
                    formData.action === action && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, action })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.action === action && styles.pickerOptionTextSelected
                  ]}>
                    {action}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Scope:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {scopes.map((scope) => (
                <TouchableOpacity
                  key={scope}
                  style={[
                    styles.pickerOption,
                    formData.scope === scope && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, scope })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.scope === scope && styles.pickerOptionTextSelected
                  ]}>
                    {scope}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
              onPress={() => createPermission(formData)}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Creating...' : 'Create Permission'}
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
          <Text style={styles.modalTitle}>Edit Permission</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Permission Name"
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
            <Text style={styles.pickerLabel}>Resource Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {resourceTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    formData.resourceType === type && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, resourceType: type })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.resourceType === type && styles.pickerOptionTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Action:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action}
                  style={[
                    styles.pickerOption,
                    formData.action === action && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, action })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.action === action && styles.pickerOptionTextSelected
                  ]}>
                    {action}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Scope:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {scopes.map((scope) => (
                <TouchableOpacity
                  key={scope}
                  style={[
                    styles.pickerOption,
                    formData.scope === scope && styles.pickerOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, scope })}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    formData.scope === scope && styles.pickerOptionTextSelected
                  ]}>
                    {scope}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowEditModal(false);
                setSelectedPermission(null);
                resetForm();
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => updatePermission(selectedPermission!.id, formData)}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Updating...' : 'Update Permission'}
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
        <Text style={styles.title}>🔑 Permission Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Create Permission</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search permissions..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {resourceTypes.slice(0, 4).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterButtonText, filterType === type && styles.filterButtonTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading permissions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPermissions}
          renderItem={renderPermissionItem}
          keyExtractor={(item) => item.id}
          style={styles.permissionList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderCreateModal()}
      {renderEditModal()}
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
  permissionList: {
    flex: 1,
  },
  permissionCard: {
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
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  permissionDetails: {
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
});

export default PermissionManager; 
