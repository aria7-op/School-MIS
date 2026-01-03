import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Switch, Alert, FlatList } from 'react-native';
import apiService from '../../../services/api';

// Ultra Advanced Feature Control with RBAC + ABAC
const UltraAdvancedFeatureControl: React.FC = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showFeatureDetailModal, setShowFeatureDetailModal] = useState(false);

  // Feature Categories
  const featureCategories = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊', color: '#3B82F6' },
    { id: 'students', name: 'Students', icon: '👨‍🎓', color: '#10B981' },
    { id: 'teachers', name: 'Teachers', icon: '👨‍🏫', color: '#F59E0B' },
    { id: 'staff', name: 'Staff', icon: '👥', color: '#8B5CF6' },
    { id: 'customers', name: 'Visitors', icon: '👤', color: '#EF4444' },
    { id: 'finance', name: 'Finance', icon: '💰', color: '#059669' },
    { id: 'reports', name: 'Reports', icon: '📈', color: '#DC2626' },
    { id: 'settings', name: 'Settings', icon: '⚙️', color: '#6B7280' },
    { id: 'analytics', name: 'Analytics', icon: '📊', color: '#7C3AED' },
    { id: 'admin', name: 'Admin', icon: '👑', color: '#F97316' }
  ];

  // Component Types
  const componentTypes = [
    { id: 'view', name: 'View', icon: '👁️', color: '#3B82F6' },
    { id: 'create', name: 'Create', icon: '➕', color: '#10B981' },
    { id: 'edit', name: 'Edit', icon: '✏️', color: '#F59E0B' },
    { id: 'delete', name: 'Delete', icon: '🗑️', color: '#EF4444' },
    { id: 'export', name: 'Export', icon: '📤', color: '#8B5CF6' },
    { id: 'import', name: 'Import', icon: '📥', color: '#059669' },
    { id: 'approve', name: 'Approve', icon: '✅', color: '#10B981' },
    { id: 'reject', name: 'Reject', icon: '❌', color: '#EF4444' },
    { id: 'assign', name: 'Assign', icon: '🔗', color: '#F59E0B' },
    { id: 'unassign', name: 'Unassign', icon: '🔓', color: '#6B7280' }
  ];

  // ABAC Attributes
  const abacAttributes = [
    { id: 'time', name: 'Time-based', type: 'time', icon: '🕐' },
    { id: 'location', name: 'Location-based', type: 'location', icon: '📍' },
    { id: 'device', name: 'Device-based', type: 'device', icon: '📱' },
    { id: 'network', name: 'Network-based', type: 'network', icon: '🌐' },
    { id: 'user_role', name: 'User Role', type: 'role', icon: '👤' },
    { id: 'data_sensitivity', name: 'Data Sensitivity', type: 'sensitivity', icon: '🔒' },
    { id: 'business_hours', name: 'Business Hours', type: 'time', icon: '🏢' },
    { id: 'ip_whitelist', name: 'IP Whitelist', type: 'network', icon: '🛡️' },
    { id: 'geofencing', name: 'Geofencing', type: 'location', icon: '🗺️' },
    { id: 'risk_level', name: 'Risk Level', type: 'risk', icon: '⚠️' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fixed API endpoints - removed double /api/ prefix
      const [featuresRes, rolesRes, componentsRes, permissionsRes, policiesRes] = await Promise.all([
        apiService.get('/rbac/features'),
        apiService.get('/rbac/roles'),
        apiService.get('/rbac/components'),
        apiService.get('/rbac/permissions'),
        apiService.get('/rbac/policy')
      ]);
      
      setFeatures(Array.isArray(featuresRes.data) ? featuresRes.data : []);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      setComponents(Array.isArray(componentsRes.data) ? componentsRes.data : []);
      setPermissions(Array.isArray(permissionsRes.data) ? permissionsRes.data : []);
      setPolicies(Array.isArray(policiesRes.data) ? policiesRes.data : []);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturePermissionToggle = async (featureId: string, roleId: string, permission: string) => {
    try {
      setLoading(true);
      // Fixed RBAC endpoint
      const response = await apiService.post('/rbac/permissions', {
        resource: featureId,
        action: permission,
        roleId: roleId,
        type: 'feature'
      });
      
      if (response.success) {
        Alert.alert('Success', 'Feature permission updated successfully');
        await loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to update permission');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update feature permission');
    } finally {
      setLoading(false);
    }
  };

  const handleComponentPermissionToggle = async (componentId: string, roleId: string, permission: string) => {
    try {
      setLoading(true);
      // Fixed component permission endpoint
      const response = await apiService.post('/rbac/components/permissions', {
        componentId,
        roleId,
        permission,
        action: 'toggle'
      });
      
      if (response.success) {
        Alert.alert('Success', 'Component permission updated successfully');
        await loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to update component permission');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update component permission');
    } finally {
      setLoading(false);
    }
  };

  const handleABACPolicyCreate = async (policyData: any) => {
    try {
      setLoading(true);
      // Fixed ABAC endpoint
      const response = await apiService.post('/abac/rules', policyData);
      
      if (response.success) {
        Alert.alert('Success', 'ABAC policy created successfully');
        await loadData();
        setShowPolicyModal(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to create ABAC policy');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to create ABAC policy');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCheck = async (resource: string, action: string, context: any = {}) => {
    try {
      // Fixed access check endpoint
      const response = await apiService.post('/rbac/access/check', {
        resource,
        action,
        context
      });
      
      return response.data;
    } catch (error) {
      
      return { allowed: false, reason: 'Access check failed' };
    }
  };

  const handleManageFeature = (feature: any) => {
    setSelectedFeature(feature);
    // Show detailed feature management modal
    setShowFeatureDetailModal(true);
  };

  const handleABACTabPress = () => {
    // Switch to ABAC tab
    setActiveTab('abac');
  };

  const handleCreateABACPolicy = () => {
    setShowPolicyModal(true);
  };

  const handleFeaturePermissionChange = async (featureId: string, roleId: string, permission: string, enabled: boolean) => {
    try {
      setLoading(true);
      const response = await apiService.post('/rbac/permissions', {
        resource: featureId,
        action: permission,
        roleId: roleId,
        type: 'feature',
        enabled: enabled
      });
      
      if (response.success) {
        Alert.alert('Success', 'Feature permission updated successfully');
        await loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to update permission');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update feature permission');
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureControl = () => (
    <ScrollView style={styles.featureControlContainer}>
      {featureCategories.map(category => (
        <View key={category.id} style={styles.featureCategory}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
            <TouchableOpacity 
              style={[styles.categoryButton, { backgroundColor: category.color }]}
              onPress={() => handleManageFeature(category)}
            >
              <Text style={styles.categoryButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>
          
          {/* Role Permissions for this Feature */}
          <View style={styles.rolePermissions}>
            <Text style={styles.sectionTitle}>Role Permissions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {roles.map(role => (
                <View key={role.id} style={styles.rolePermissionCard}>
                  <Text style={styles.roleName}>{role.name}</Text>
                  <View style={styles.permissionToggles}>
                    {componentTypes.map(component => (
                      <TouchableOpacity
                        key={component.id}
                        style={[
                          styles.permissionToggle,
                          role.permissions?.includes(`${category.id}:${component.id}`) && styles.activePermission
                        ]}
                        onPress={() => handleFeaturePermissionToggle(category.id, role.id, component.id)}
                      >
                        <Text style={styles.permissionIcon}>{component.icon}</Text>
                        <Text style={styles.permissionLabel}>{component.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderABACControl = () => (
    <ScrollView style={styles.abacContainer}>
      <View style={styles.abacHeader}>
        <Text style={styles.abacTitle}>🔐 ABAC (Attribute-Based Access Control)</Text>
        <TouchableOpacity 
          style={styles.createPolicyButton}
          onPress={() => setShowPolicyModal(true)}
        >
          <Text style={styles.createPolicyButtonText}>+ Create ABAC Policy</Text>
        </TouchableOpacity>
      </View>

      {/* ABAC Attributes */}
      <View style={styles.abacAttributes}>
        <Text style={styles.sectionTitle}>Available Attributes</Text>
        <View style={styles.attributesGrid}>
          {abacAttributes.map(attribute => (
            <View key={attribute.id} style={styles.attributeCard}>
              <Text style={styles.attributeIcon}>{attribute.icon}</Text>
              <Text style={styles.attributeName}>{attribute.name}</Text>
              <Text style={styles.attributeType}>{attribute.type}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Existing ABAC Policies */}
      <View style={styles.abacPolicies}>
        <Text style={styles.sectionTitle}>Active ABAC Policies</Text>
        {policies.filter(p => p.type === 'abac').map(policy => (
          <View key={policy.id} style={styles.policyCard}>
            <Text style={styles.policyName}>{policy.name}</Text>
            <Text style={styles.policyDescription}>{policy.description}</Text>
            <View style={styles.policyConditions}>
              {Object.entries(policy.conditions || {}).map(([key, value]) => (
                <Text key={key} style={styles.conditionText}>
                  {key}: {JSON.stringify(value)}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderComponentControl = () => (
    <ScrollView style={styles.componentControlContainer}>
      {components.map(component => (
        <View key={component.id} style={styles.componentCard}>
          <View style={styles.componentHeader}>
            <Text style={styles.componentName}>{component.name}</Text>
            <Text style={styles.componentFeature}>{component.featureName}</Text>
          </View>
          
          {/* Component-specific permissions */}
          <View style={styles.componentPermissions}>
            <Text style={styles.sectionTitle}>Component Permissions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {roles.map(role => (
                <View key={role.id} style={styles.componentRoleCard}>
                  <Text style={styles.roleName}>{role.name}</Text>
                  <View style={styles.componentPermissionToggles}>
                    {componentTypes.map(compType => (
                      <TouchableOpacity
                        key={compType.id}
                        style={[
                          styles.componentPermissionToggle,
                          role.componentPermissions?.includes(`${component.id}:${compType.id}`) && styles.activeComponentPermission
                        ]}
                        onPress={() => handleComponentPermissionToggle(component.id, role.id, compType.id)}
                      >
                        <Text style={styles.componentPermissionIcon}>{compType.icon}</Text>
                        <Text style={styles.componentPermissionLabel}>{compType.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const [activeTab, setActiveTab] = useState('features');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎛️ Ultra Advanced Feature Control</Text>
        <Text style={styles.subtitle}>RBAC + ABAC + Component-level permissions</Text>
      </View>

      {/* Control Tabs */}
      <View style={styles.controlTabs}>
        <TouchableOpacity 
          style={[styles.controlTab, activeTab === 'features' && styles.activeControlTab]}
          onPress={() => setActiveTab('features')}
        >
          <Text style={[styles.controlTabText, activeTab === 'features' && styles.activeControlTabText]}>Features</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.controlTab, activeTab === 'components' && styles.activeControlTab]}
          onPress={() => setActiveTab('components')}
        >
          <Text style={[styles.controlTabText, activeTab === 'components' && styles.activeControlTabText]}>Components</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.controlTab, activeTab === 'abac' && styles.activeControlTab]}
          onPress={() => setActiveTab('abac')}
        >
          <Text style={[styles.controlTabText, activeTab === 'abac' && styles.activeControlTabText]}>ABAC</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'features' && renderFeatureControl()}
            {activeTab === 'components' && renderComponentControl()}
            {activeTab === 'abac' && renderABACControl()}
          </>
        )}
      </View>

      {/* ABAC Policy Modal */}
      <Modal visible={showPolicyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create ABAC Policy</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Policy Name"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description"
              multiline
            />

            {/* Attribute Selection */}
            <Text style={styles.sectionTitle}>Select Attributes</Text>
            <ScrollView style={styles.attributesList}>
              {abacAttributes.map(attribute => (
                <View key={attribute.id} style={styles.attributeItem}>
                  <Text style={styles.attributeIcon}>{attribute.icon}</Text>
                  <Text style={styles.attributeLabel}>{attribute.name}</Text>
                  <Switch />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowPolicyModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Create Policy</Text>
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
  controlTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  controlTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeControlTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  controlTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeControlTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  featureControlContainer: {
    flex: 1,
    padding: 20,
  },
  featureCategory: {
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rolePermissions: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  rolePermissionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
  },
  roleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  permissionToggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  permissionToggle: {
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  activePermission: {
    backgroundColor: '#3B82F6',
  },
  permissionIcon: {
    fontSize: 12,
    marginBottom: 2,
  },
  permissionLabel: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
  },
  abacContainer: {
    flex: 1,
    padding: 20,
  },
  abacHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  abacTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  createPolicyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createPolicyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  abacAttributes: {
    marginBottom: 24,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  attributeCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attributeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  attributeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  attributeType: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  abacPolicies: {
    marginBottom: 24,
  },
  policyCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  policyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  policyConditions: {
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    padding: 8,
  },
  conditionText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  componentControlContainer: {
    flex: 1,
    padding: 20,
  },
  componentCard: {
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
  componentHeader: {
    marginBottom: 16,
  },
  componentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  componentFeature: {
    fontSize: 12,
    color: '#6B7280',
  },
  componentPermissions: {
    marginTop: 12,
  },
  componentRoleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
  },
  componentPermissionToggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  componentPermissionToggle: {
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  activeComponentPermission: {
    backgroundColor: '#10B981',
  },
  componentPermissionIcon: {
    fontSize: 12,
    marginBottom: 2,
  },
  componentPermissionLabel: {
    fontSize: 8,
    color: '#6B7280',
    textAlign: 'center',
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
  attributesList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  attributeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  attributeLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
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

export default UltraAdvancedFeatureControl; 
