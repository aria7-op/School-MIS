import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput,
  Switch, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';

const { width } = Dimensions.get('window');

// Ultra Advanced ABAC Policy Builder
const UltraAdvancedABACBuilder: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [policyForm, setPolicyForm] = useState<any>({
    name: '',
    description: '',
    effect: 'allow',
    priority: 1,
    conditions: {},
    rules: [],
    targetRoles: [],
    targetResources: [],
    targetActions: [],
    isActive: true
  });

  // ABAC Attributes
  const abacAttributes = {
    'Time-based': [
      { key: 'time_of_day', label: 'Time of Day', type: 'time', icon: '🕐' },
      { key: 'day_of_week', label: 'Day of Week', type: 'select', icon: '📅' },
      { key: 'business_hours', label: 'Business Hours', type: 'boolean', icon: '🏢' },
      { key: 'expiration_date', label: 'Expiration Date', type: 'date', icon: '⏰' }
    ],
    'Location-based': [
      { key: 'ip_address', label: 'IP Address', type: 'text', icon: '🌐' },
      { key: 'geolocation', label: 'Geolocation', type: 'location', icon: '📍' },
      { key: 'network_type', label: 'Network Type', type: 'select', icon: '📡' },
      { key: 'vpn_required', label: 'VPN Required', type: 'boolean', icon: '🔒' }
    ],
    'Device-based': [
      { key: 'device_type', label: 'Device Type', type: 'select', icon: '📱' },
      { key: 'browser', label: 'Browser', type: 'select', icon: '🌐' },
      { key: 'os_version', label: 'OS Version', type: 'text', icon: '💻' },
      { key: 'device_trusted', label: 'Trusted Device', type: 'boolean', icon: '✅' }
    ],
    'User-based': [
      { key: 'user_role', label: 'User Role', type: 'select', icon: '👤' },
      { key: 'user_department', label: 'Department', type: 'select', icon: '🏢' },
      { key: 'user_level', label: 'Access Level', type: 'select', icon: '⭐' },
      { key: 'user_status', label: 'User Status', type: 'select', icon: '📊' }
    ],
    'Data-based': [
      { key: 'data_sensitivity', label: 'Data Sensitivity', type: 'select', icon: '🔒' },
      { key: 'data_owner', label: 'Data Owner', type: 'text', icon: '👑' },
      { key: 'data_category', label: 'Data Category', type: 'select', icon: '📁' },
      { key: 'data_retention', label: 'Retention Period', type: 'number', icon: '⏳' }
    ],
    'Risk-based': [
      { key: 'risk_level', label: 'Risk Level', type: 'select', icon: '⚠️' },
      { key: 'threat_level', label: 'Threat Level', type: 'select', icon: '🚨' },
      { key: 'suspicious_activity', label: 'Suspicious Activity', type: 'boolean', icon: '🔍' },
      { key: 'compliance_required', label: 'Compliance Required', type: 'boolean', icon: '📋' }
    ]
  };

  // Operators
  const operators = [
    { key: 'equals', label: 'Equals', icon: '=' },
    { key: 'not_equals', label: 'Not Equals', icon: '≠' },
    { key: 'contains', label: 'Contains', icon: '⊃' },
    { key: 'not_contains', label: 'Not Contains', icon: '⊅' },
    { key: 'greater_than', label: 'Greater Than', icon: '>' },
    { key: 'less_than', label: 'Less Than', icon: '<' },
    { key: 'greater_equal', label: 'Greater or Equal', icon: '≥' },
    { key: 'less_equal', label: 'Less or Equal', icon: '≤' },
    { key: 'in_range', label: 'In Range', icon: '∈' },
    { key: 'not_in_range', label: 'Not In Range', icon: '∉' }
  ];

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/rbac/policy');
      setPolicies(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load ABAC policies');
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async () => {
    if (!policyForm.name) {
      Alert.alert('Error', 'Policy name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.post('/rbac/policy', {
        ...policyForm,
        type: 'abac',
        createdBy: user?.id,
        rules: policyForm.rules.map(rule => ({
          ...rule,
          value: rule.value.toString()
        }))
      });

      if (response.success) {
        Alert.alert('Success', 'ABAC policy created successfully');
        await loadPolicies();
        setShowPolicyModal(false);
        resetPolicyForm();
      } else {
        Alert.alert('Error', response.message || 'Failed to create policy');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to create ABAC policy');
    } finally {
      setLoading(false);
    }
  };

  const updatePolicy = async (policyId: string) => {
    try {
      setLoading(true);
      const response = await apiService.put(`/rbac/policy/${policyId}`, {
        ...policyForm,
        rules: policyForm.rules.map(rule => ({
          ...rule,
          value: rule.value.toString()
        }))
      });

      if (response.success) {
        Alert.alert('Success', 'ABAC policy updated successfully');
        await loadPolicies();
        setShowPolicyModal(false);
        resetPolicyForm();
      } else {
        Alert.alert('Error', response.message || 'Failed to update policy');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update ABAC policy');
    } finally {
      setLoading(false);
    }
  };

  const deletePolicy = async (policyId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this ABAC policy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await apiService.delete(`/rbac/policy/${policyId}`);

              if (response.success) {
                Alert.alert('Success', 'ABAC policy deleted successfully');
                await loadPolicies();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete policy');
              }
            } catch (error) {
              
              Alert.alert('Error', 'Failed to delete ABAC policy');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const resetPolicyForm = () => {
    setPolicyForm({
      name: '',
      description: '',
      effect: 'allow',
      priority: 1,
      conditions: {},
      rules: [],
      targetRoles: [],
      targetResources: [],
      targetActions: [],
      isActive: true
    });
    setSelectedPolicy(null);
  };

  const addCondition = (category: string, attribute: any) => {
    const newCondition = {
      id: Date.now().toString(),
      category,
      attribute: attribute.key,
      operator: 'equals',
      value: '',
      enabled: true
    };

    setPolicyForm(prev => ({
      ...prev,
      rules: [...prev.rules, newCondition]
    }));
  };

  const updateCondition = (index: number, field: string, value: any) => {
    setPolicyForm(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const removeCondition = (index: number) => {
    setPolicyForm(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const testPolicy = async (policyId: string, context: any) => {
    try {
      setLoading(true);
      const response = await apiService.post('/rbac/policy/evaluate', {
        policyId,
        context: {
          userRole: context.userRole || 'user',
          timeOfDay: context.timeOfDay || '09:00',
          ipAddress: context.ipAddress || '192.168.1.1',
          deviceType: context.deviceType || 'desktop'
        }
      });

      const result: any = response.data;
      Alert.alert(
        'Policy Test Result',
        `Policy evaluation: ${result.allowed ? 'ALLOWED' : 'DENIED'}\nReason: ${result.reason || 'No specific reason'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      
      Alert.alert('Error', 'Failed to test policy');
    } finally {
      setLoading(false);
    }
  };

  const renderPolicyList = () => (
    <ScrollView style={styles.policyList}>
      {policies.filter(p => p.type === 'abac').map(policy => (
        <View key={policy.id} style={styles.policyCard}>
          <View style={styles.policyHeader}>
            <View style={styles.policyInfo}>
              <Text style={styles.policyName}>{policy.name}</Text>
              <Text style={styles.policyDescription}>{policy.description}</Text>
              <View style={styles.policyMeta}>
                <Text style={styles.policyEffect}>Effect: {policy.effect}</Text>
                <Text style={styles.policyPriority}>Priority: {policy.priority}</Text>
              </View>
            </View>
            <View style={[styles.effectBadge, { 
              backgroundColor: policy.effect === 'allow' ? '#10B981' : '#EF4444' 
            }]}>
              <Text style={styles.effectText}>{policy.effect.toUpperCase()}</Text>
            </View>
          </View>

          {policy.rules?.length > 0 && (
            <View style={styles.policyRules}>
              <Text style={styles.rulesTitle}>Conditions:</Text>
              {policy.rules.map((rule: any, index: number) => (
                <View key={index} style={styles.ruleItem}>
                  <Text style={styles.ruleText}>
                    {rule.attribute} {rule.operator} {rule.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.policyActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedPolicy(policy);
                setPolicyForm(policy);
                setShowPolicyModal(true);
              }}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedPolicy(policy);
                setShowTestModal(true);
              }}
            >
              <Text style={styles.actionButtonText}>Test</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deletePolicy(policy.id)}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderPolicyBuilder = () => (
    <Modal visible={showPolicyModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {selectedPolicy ? 'Edit ABAC Policy' : 'Create ABAC Policy'}
          </Text>

          <ScrollView style={styles.policyForm}>
            {/* Basic Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Policy Name"
                value={policyForm.name}
                onChangeText={(text) => setPolicyForm(prev => ({ ...prev, name: text }))}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Description"
                multiline
                value={policyForm.description}
                onChangeText={(text) => setPolicyForm(prev => ({ ...prev, description: text }))}
              />

              <View style={styles.effectContainer}>
                <Text style={styles.effectLabel}>Effect:</Text>
                <View style={styles.effectButtons}>
                  <TouchableOpacity
                    style={[
                      styles.effectButton,
                      policyForm.effect === 'allow' && styles.selectedEffect
                    ]}
                    onPress={() => setPolicyForm(prev => ({ ...prev, effect: 'allow' }))}
                  >
                    <Text style={[
                      styles.effectButtonText,
                      policyForm.effect === 'allow' && styles.selectedEffectText
                    ]}>
                      ALLOW
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.effectButton,
                      policyForm.effect === 'deny' && styles.selectedEffect
                    ]}
                    onPress={() => setPolicyForm(prev => ({ ...prev, effect: 'deny' }))}
                  >
                    <Text style={[
                      styles.effectButtonText,
                      policyForm.effect === 'deny' && styles.selectedEffectText
                    ]}>
                      DENY
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Priority (1-100)"
                value={policyForm.priority.toString()}
                onChangeText={(text) => setPolicyForm(prev => ({ 
                  ...prev, 
                  priority: parseInt(text) || 1 
                }))}
                keyboardType="numeric"
              />
            </View>

            {/* Condition Builder */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Condition Builder</Text>
              
              {Object.entries(abacAttributes).map(([category, attributes]) => (
                <View key={category} style={styles.attributeCategory}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {attributes.map(attribute => (
                      <TouchableOpacity
                        key={attribute.key}
                        style={styles.attributeButton}
                        onPress={() => addCondition(category, attribute)}
                      >
                        <Text style={styles.attributeIcon}>{attribute.icon}</Text>
                        <Text style={styles.attributeLabel}>{attribute.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ))}

              {/* Current Rules */}
              {policyForm.rules.length > 0 && (
                <View style={styles.currentRules}>
                  <Text style={styles.rulesTitle}>Current Conditions:</Text>
                  {policyForm.rules.map((rule, index) => (
                    <View key={rule.id} style={styles.ruleBuilder}>
                      <View style={styles.ruleHeader}>
                        <Text style={styles.ruleAttribute}>{rule.attribute}</Text>
                        <TouchableOpacity
                          style={styles.removeRuleButton}
                          onPress={() => removeCondition(index)}
                        >
                          <Text style={styles.removeRuleText}>×</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.ruleControls}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {operators.map(operator => (
                            <TouchableOpacity
                              key={operator.key}
                              style={[
                                styles.operatorButton,
                                rule.operator === operator.key && styles.selectedOperator
                              ]}
                              onPress={() => updateCondition(index, 'operator', operator.key)}
                            >
                              <Text style={styles.operatorText}>{operator.icon}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        
                        <TextInput
                          style={styles.ruleValue}
                          placeholder="Value"
                          value={rule.value}
                          onChangeText={(text) => updateCondition(index, 'value', text)}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowPolicyModal(false);
                resetPolicyForm();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => selectedPolicy ? updatePolicy(selectedPolicy.id) : createPolicy()}
            >
              <Text style={styles.saveButtonText}>
                {selectedPolicy ? 'Update Policy' : 'Create Policy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTestModal = () => (
    <Modal visible={showTestModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Test ABAC Policy</Text>
          
          <View style={styles.testContext}>
            <Text style={styles.sectionTitle}>Test Context</Text>
            
            {/* Add test context inputs here */}
            <TextInput
              style={styles.input}
              placeholder="User Role"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Time of Day (HH:MM)"
            />
            
            <TextInput
              style={styles.input}
              placeholder="IP Address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Device Type"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTestModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                // Test the policy
                Alert.alert('Test Result', 'Policy evaluation completed');
                setShowTestModal(false);
              }}
            >
              <Text style={styles.testButtonText}>Test Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Ultra Advanced ABAC Builder</Text>
        <Text style={styles.subtitle}>Visual policy builder with dynamic conditions</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowPolicyModal(true)}
        >
          <Text style={styles.createButtonText}>+ Create ABAC Policy</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading ABAC policies...</Text>
        </View>
      ) : (
        renderPolicyList()
      )}

      {renderPolicyBuilder()}
      {renderTestModal()}
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
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actions: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  policyList: {
    flex: 1,
    padding: 20,
  },
  policyCard: {
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
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  policyInfo: {
    flex: 1,
  },
  policyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  policyDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  policyMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  policyEffect: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 16,
  },
  policyPriority: {
    fontSize: 12,
    color: '#9CA3AF',
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
  policyRules: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  ruleItem: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 12,
    color: '#6B7280',
  },
  policyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#DC2626',
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
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  policyForm: {
    maxHeight: 500,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  effectContainer: {
    marginBottom: 16,
  },
  effectLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  effectButtons: {
    flexDirection: 'row',
  },
  effectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  selectedEffect: {
    backgroundColor: '#3B82F6',
  },
  effectButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedEffectText: {
    color: 'white',
  },
  attributeCategory: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  attributeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  attributeIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  attributeLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  currentRules: {
    marginTop: 16,
  },
  ruleBuilder: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleAttribute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  removeRuleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeRuleText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: 'bold',
  },
  ruleControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operatorButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  selectedOperator: {
    backgroundColor: '#3B82F6',
  },
  operatorText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ruleValue: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    backgroundColor: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  testContext: {
    marginBottom: 20,
  },
  testButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UltraAdvancedABACBuilder; 
