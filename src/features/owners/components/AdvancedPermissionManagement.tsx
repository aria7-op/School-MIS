import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Switch, Alert } from 'react-native';
import apiService from '../../../services/api';

const AdvancedPermissionManagement: React.FC = () => {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    name: '',
    description: '',
    resource: '',
    action: '',
    conditions: {},
    effect: 'allow',
    isActive: true,
    priority: 1,
    contextRules: []
  });

  // Resource Types
  const resourceTypes = [
    'dashboard', 'students', 'teachers', 'staff', 'customers', 
    'classes', 'attendance', 'exams', 'finance', 'payments',
    'resources', 'documents', 'schools', 'reports', 'settings'
  ];

  // Action Types
  const actionTypes = [
    'view', 'create', 'edit', 'delete', 'export', 'import',
    'approve', 'reject', 'assign', 'unassign', 'backup', 'restore'
  ];

  // Context Rules
  const contextRules = [
    { key: 'time', label: 'Time-based', type: 'time' },
    { key: 'location', label: 'Location-based', type: 'location' },
    { key: 'device', label: 'Device-based', type: 'device' },
    { key: 'network', label: 'Network-based', type: 'network' },
    { key: 'user_role', label: 'User Role', type: 'role' },
    { key: 'data_scope', label: 'Data Scope', type: 'scope' }
  ];

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      // Fixed API endpoints - removed double /api/ prefix
      const response = await apiService.get('/rbac/permissions');
      setPermissions(response.data || []);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const createPermission = async (permissionData: any) => {
    try {
      setLoading(true);
      // Fixed permission creation endpoint
      const response = await apiService.post('/rbac/permissions', permissionData);
      
      if (response.success) {
        Alert.alert('Success', 'Permission created successfully');
        await loadPermissions();
        setShowModal(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to create permission');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to create permission');
    } finally {
      setLoading(false);
    }
  };

  const handleContextRuleToggle = (ruleKey: string) => {
    setPermissionForm(prev => ({
      ...prev,
      contextRules: prev.contextRules.includes(ruleKey)
        ? prev.contextRules.filter(r => r !== ruleKey)
        : [...prev.contextRules, ruleKey]
    }));
  };

  const handleConditionChange = (key: string, value: any) => {
    setPermissionForm(prev => ({
      ...prev,
      conditions: { ...prev.conditions, [key]: value }
    }));
  };

  const handleRuleAdd = (ruleType: string) => {
    setPermissionForm(prev => ({
      ...prev,
      rules: [...prev.rules, { type: ruleType, value: '', enabled: true }]
    }));
  };

  const handleRuleChange = (index: number, field: string, value: any) => {
    setPermissionForm(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const handleRuleRemove = (index: number) => {
    setPermissionForm(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔒 Advanced Permission Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Text style={styles.addButtonText}>+ Create Permission</Text>
        </TouchableOpacity>
      </View>

      {/* Permission List */}
      <ScrollView style={styles.permissionList}>
        {permissions.map(permission => (
          <View key={permission.id} style={styles.permissionCard}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionName}>{permission.name}</Text>
              <View style={[styles.effectBadge, { 
                backgroundColor: permission.effect === 'allow' ? '#10B981' : '#EF4444' 
              }]}>
                <Text style={styles.effectText}>{permission.effect.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.permissionDescription}>{permission.description}</Text>
            <Text style={styles.permissionResource}>
              {permission.resource}:{permission.action}
            </Text>
            {permission.contextRules?.length > 0 && (
              <View style={styles.contextRules}>
                <Text style={styles.contextTitle}>Context Rules:</Text>
                {permission.contextRules.map((rule: string) => (
                  <Text key={rule} style={styles.contextRule}>• {rule}</Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Permission Creation Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Permission</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Permission Name"
              value={permissionForm.name}
              onChangeText={(text) => setPermissionForm(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description"
              multiline
              value={permissionForm.description}
              onChangeText={(text) => setPermissionForm(prev => ({ ...prev, description: text }))}
            />

            {/* Resource Selection */}
            <Text style={styles.sectionTitle}>Resource</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.resourceList}>
              {resourceTypes.map(resource => (
                <TouchableOpacity
                  key={resource}
                  style={[
                    styles.resourceChip,
                    permissionForm.resource === resource && styles.selectedChip
                  ]}
                  onPress={() => setPermissionForm(prev => ({ ...prev, resource }))}
                >
                  <Text style={[
                    styles.chipText,
                    permissionForm.resource === resource && styles.selectedChipText
                  ]}>
                    {resource}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Action Selection */}
            <Text style={styles.sectionTitle}>Action</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionList}>
              {actionTypes.map(action => (
                <TouchableOpacity
                  key={action}
                  style={[
                    styles.actionChip,
                    permissionForm.action === action && styles.selectedChip
                  ]}
                  onPress={() => setPermissionForm(prev => ({ ...prev, action }))}
                >
                  <Text style={[
                    styles.chipText,
                    permissionForm.action === action && styles.selectedChipText
                  ]}>
                    {action}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Context Rules */}
            <Text style={styles.sectionTitle}>Context Rules</Text>
            <ScrollView style={styles.contextRulesContainer}>
              {contextRules.map(rule => (
                <View key={rule.key} style={styles.contextRuleItem}>
                  <Switch
                    value={permissionForm.contextRules.includes(rule.key)}
                    onValueChange={() => handleContextRuleToggle(rule.key)}
                  />
                  <Text style={styles.contextRuleLabel}>{rule.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Effect Selection */}
            <Text style={styles.sectionTitle}>Effect</Text>
            <View style={styles.effectContainer}>
              <TouchableOpacity
                style={[
                  styles.effectButton,
                  permissionForm.effect === 'allow' && styles.selectedEffect
                ]}
                onPress={() => setPermissionForm(prev => ({ ...prev, effect: 'allow' }))}
              >
                <Text style={[
                  styles.effectText,
                  permissionForm.effect === 'allow' && styles.selectedEffectText
                ]}>
                  ALLOW
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.effectButton,
                  permissionForm.effect === 'deny' && styles.selectedEffect
                ]}
                onPress={() => setPermissionForm(prev => ({ ...prev, effect: 'deny' }))}
              >
                <Text style={[
                  styles.effectText,
                  permissionForm.effect === 'deny' && styles.selectedEffectText
                ]}>
                  DENY
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={() => createPermission(permissionForm)}>
                <Text style={styles.saveButtonText}>Create Permission</Text>
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
  permissionList: {
    flex: 1,
    padding: 20,
  },
  permissionCard: {
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
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  effectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  effectText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  permissionResource: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  contextRules: {
    marginTop: 8,
  },
  contextTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  contextRule: {
    fontSize: 11,
    color: '#6B7280',
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
  resourceList: {
    marginBottom: 16,
  },
  actionList: {
    marginBottom: 16,
  },
  resourceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  actionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#3B82F6',
  },
  chipText: {
    color: '#6B7280',
    fontSize: 14,
  },
  selectedChipText: {
    color: 'white',
  },
  contextRulesContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  contextRuleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contextRuleLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4B5563',
  },
  effectContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  effectButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedEffect: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  selectedEffectText: {
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

export default AdvancedPermissionManagement; 
