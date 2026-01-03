import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Switch, Alert } from 'react-native';
import apiService from '../../../services/api';

const AdvancedComponentAccessControl: React.FC = () => {
  const [components, setComponents] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [componentForm, setComponentForm] = useState({
    name: '',
    description: '',
    featureId: '',
    path: '',
    isActive: true,
    accessLevels: [],
    permissions: [],
    conditions: {}
  });

  // Component Categories
  const componentCategories = [
    'Dashboard', 'Students', 'Teachers', 'Staff', 'Visitors',
    'Finance', 'Reports', 'Settings', 'Analytics', 'Admin'
  ];

  // Access Levels
  const accessLevels = [
    { key: 'NONE', label: 'No Access', color: '#EF4444' },
    { key: 'READ', label: 'Read Only', color: '#F59E0B' },
    { key: 'WRITE', label: 'Read & Write', color: '#3B82F6' },
    { key: 'ADMIN', label: 'Full Access', color: '#10B981' }
  ];

  // Component Permissions
  const componentPermissions = [
    'view', 'create', 'edit', 'delete', 'export', 'import',
    'approve', 'reject', 'assign', 'unassign', 'backup', 'restore'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [componentsRes, featuresRes, rolesRes] = await Promise.all([
        apiService.get('/rbac/components'),
        apiService.get('/rbac/features'),
        apiService.get('/rbac/roles')
      ]);
      
      setComponents(componentsRes.data || []);
      setFeatures(featuresRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComponent = async () => {
    if (!componentForm.name || !componentForm.featureId) {
      Alert.alert('Error', 'Name and feature are required');
      return;
    }

    setLoading(true);
    try {
      await apiService.post('/rbac/components', componentForm);
      await loadData();
      setShowModal(false);
      setComponentForm({
        name: '', description: '', featureId: '', path: '',
        isActive: true, accessLevels: [], permissions: [], conditions: {}
      });
      Alert.alert('Success', 'Component created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create component');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessLevelChange = (roleId: string, accessLevel: string) => {
    setComponentForm(prev => ({
      ...prev,
      accessLevels: prev.accessLevels.map(al => 
        al.roleId === roleId 
          ? { ...al, accessLevel }
          : al
      ).filter(al => al.accessLevel !== 'NONE')
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setComponentForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleComponentSelect = (component: any) => {
    setSelectedComponent(component);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Advanced Component Access Control</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Text style={styles.addButtonText}>+ Add Component</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Component List */}
        <View style={styles.componentList}>
          <Text style={styles.sectionTitle}>Components</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {components.map(component => (
              <TouchableOpacity
                key={component.id}
                style={[
                  styles.componentCard,
                  selectedComponent?.id === component.id && styles.selectedComponent
                ]}
                onPress={() => handleComponentSelect(component)}
              >
                <Text style={styles.componentName}>{component.name}</Text>
                <Text style={styles.componentFeature}>{component.featureName}</Text>
                <View style={[styles.statusBadge, { 
                  backgroundColor: component.isActive ? '#10B981' : '#EF4444' 
                }]}>
                  <Text style={styles.statusText}>
                    {component.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Component Details */}
        {selectedComponent && (
          <View style={styles.componentDetails}>
            <Text style={styles.detailsTitle}>{selectedComponent.name}</Text>
            <Text style={styles.detailsDescription}>{selectedComponent.description}</Text>
            
            {/* Access Levels */}
            <Text style={styles.sectionTitle}>Role Access Levels</Text>
            <ScrollView style={styles.accessLevelsContainer}>
              {roles.map(role => {
                const accessLevel = selectedComponent.accessLevels?.find(
                  (al: any) => al.roleId === role.id
                )?.accessLevel || 'NONE';
                
                return (
                  <View key={role.id} style={styles.accessLevelItem}>
                    <Text style={styles.roleName}>{role.name}</Text>
                    <View style={styles.accessLevelButtons}>
                      {accessLevels.map(level => (
                        <TouchableOpacity
                          key={level.key}
                          style={[
                            styles.accessLevelButton,
                            accessLevel === level.key && styles.selectedAccessLevel,
                            { borderColor: level.color }
                          ]}
                          onPress={() => handleAccessLevelChange(role.id, level.key)}
                        >
                          <Text style={[
                            styles.accessLevelText,
                            accessLevel === level.key && styles.selectedAccessLevelText,
                            { color: level.color }
                          ]}>
                            {level.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Permissions */}
            <Text style={styles.sectionTitle}>Component Permissions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.permissionsContainer}>
              {componentPermissions.map(permission => {
                const hasPermission = selectedComponent.permissions?.includes(permission);
                return (
                  <TouchableOpacity
                    key={permission}
                    style={[
                      styles.permissionChip,
                      hasPermission && styles.selectedPermissionChip
                    ]}
                  >
                    <Text style={[
                      styles.permissionChipText,
                      hasPermission && styles.selectedPermissionChipText
                    ]}>
                      {permission}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Component Creation Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Component</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Component Name"
              value={componentForm.name}
              onChangeText={(text) => setComponentForm(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description"
              multiline
              value={componentForm.description}
              onChangeText={(text) => setComponentForm(prev => ({ ...prev, description: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Component Path"
              value={componentForm.path}
              onChangeText={(text) => setComponentForm(prev => ({ ...prev, path: text }))}
            />

            {/* Feature Selection */}
            <Text style={styles.sectionTitle}>Feature</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featureList}>
              {features.map(feature => (
                <TouchableOpacity
                  key={feature.id}
                  style={[
                    styles.featureChip,
                    componentForm.featureId === feature.id && styles.selectedChip
                  ]}
                  onPress={() => setComponentForm(prev => ({ ...prev, featureId: feature.id }))}
                >
                  <Text style={[
                    styles.chipText,
                    componentForm.featureId === feature.id && styles.selectedChipText
                  ]}>
                    {feature.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Permissions */}
            <Text style={styles.sectionTitle}>Permissions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.permissionsList}>
              {componentPermissions.map(permission => (
                <TouchableOpacity
                  key={permission}
                  style={[
                    styles.permissionChip,
                    componentForm.permissions.includes(permission) && styles.selectedPermissionChip
                  ]}
                  onPress={() => handlePermissionToggle(permission)}
                >
                  <Text style={[
                    styles.permissionChipText,
                    componentForm.permissions.includes(permission) && styles.selectedPermissionChipText
                  ]}>
                    {permission}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateComponent}>
                <Text style={styles.saveButtonText}>Create Component</Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  componentList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  componentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedComponent: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  componentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  componentFeature: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  componentDetails: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  accessLevelsContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  accessLevelItem: {
    marginBottom: 16,
  },
  roleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  accessLevelButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  accessLevelButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  selectedAccessLevel: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  accessLevelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedAccessLevelText: {
    color: 'white',
  },
  permissionsContainer: {
    marginBottom: 20,
  },
  permissionChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedPermissionChip: {
    backgroundColor: '#3B82F6',
  },
  permissionChipText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedPermissionChipText: {
    color: 'white',
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
  featureList: {
    marginBottom: 16,
  },
  permissionsList: {
    marginBottom: 20,
  },
  featureChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#3B82F6',
  },
  chipText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedChipText: {
    color: 'white',
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

export default AdvancedComponentAccessControl; 
