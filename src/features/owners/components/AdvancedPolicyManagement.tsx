import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Switch, Alert } from 'react-native';
import apiService from '../../../services/api';

const AdvancedPolicyManagement: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    effect: 'allow',
    priority: 1,
    conditions: {},
    rules: [],
    isActive: true,
    targetRoles: [],
    targetResources: [],
    targetActions: []
  });

  // Policy Conditions
  const conditionTypes = [
    { key: 'time', label: 'Time Condition', type: 'time' },
    { key: 'location', label: 'Location Condition', type: 'location' },
    { key: 'device', label: 'Device Condition', type: 'device' },
    { key: 'network', label: 'Network Condition', type: 'network' },
    { key: 'user_attributes', label: 'User Attributes', type: 'attributes' },
    { key: 'resource_attributes', label: 'Resource Attributes', type: 'attributes' },
    { key: 'environment', label: 'Environment', type: 'environment' }
  ];

  // Policy Rules
  const ruleTypes = [
    { key: 'ip_whitelist', label: 'IP Whitelist', type: 'list' },
    { key: 'ip_blacklist', label: 'IP Blacklist', type: 'list' },
    { key: 'time_window', label: 'Time Window', type: 'time' },
    { key: 'location_radius', label: 'Location Radius', type: 'location' },
    { key: 'device_type', label: 'Device Type', type: 'device' },
    { key: 'user_role', label: 'User Role', type: 'role' },
    { key: 'data_sensitivity', label: 'Data Sensitivity', type: 'sensitivity' }
  ];

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      // Fixed API endpoints - removed double /api/ prefix
      const response = await apiService.get('/rbac/policy');
      setPolicies(response.data || []);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async (policyData: any) => {
    try {
      setLoading(true);
      // Fixed policy creation endpoint
      const response = await apiService.post('/rbac/policy', policyData);
      
      if (response.success) {
        Alert.alert('Success', 'Policy created successfully');
        await loadPolicies();
        setShowModal(false);
      } else {
        Alert.alert('Error', response.message || 'Failed to create policy');
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  const handleConditionToggle = (conditionKey: string) => {
    setPolicyForm(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [conditionKey]: !prev.conditions[conditionKey]
      }
    }));
  };

  const handleRuleAdd = (ruleType: string) => {
    setPolicyForm(prev => ({
      ...prev,
      rules: [...prev.rules, { type: ruleType, value: '', enabled: true }]
    }));
  };

  const handleRuleChange = (index: number, field: string, value: any) => {
    setPolicyForm(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const handleRuleRemove = (index: number) => {
    setPolicyForm(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const handlePolicyEvaluate = async (policyId: string, context: any) => {
    try {
      // Fixed policy evaluation endpoint
      const response = await apiService.post('/rbac/policy/evaluate', {
        policyId,
        context
      });
      
      return response.data;
    } catch (error) {
      
      return { allowed: false, reason: 'Policy evaluation failed' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚖️ Advanced Policy Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Text style={styles.addButtonText}>+ Create Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Policy List */}
      <ScrollView style={styles.policyList}>
        {policies.map(policy => (
          <View key={policy.id} style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <Text style={styles.policyName}>{policy.name}</Text>
              <View style={[styles.effectBadge, { 
                backgroundColor: policy.effect === 'allow' ? '#10B981' : '#EF4444' 
              }]}>
                <Text style={styles.effectText}>{policy.effect.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.policyDescription}>{policy.description}</Text>
            <Text style={styles.policyPriority}>Priority: {policy.priority}</Text>
            {policy.rules?.length > 0 && (
              <View style={styles.policyRules}>
                <Text style={styles.rulesTitle}>Rules:</Text>
                {policy.rules.map((rule: any, index: number) => (
                  <Text key={index} style={styles.ruleText}>• {rule.type}: {rule.value}</Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Policy Creation Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Policy</Text>
            
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

            {/* Priority */}
            <Text style={styles.sectionTitle}>Priority</Text>
            <TextInput
              style={styles.input}
              placeholder="Priority (1-100)"
              value={policyForm.priority.toString()}
              onChangeText={(text) => setPolicyForm(prev => ({ ...prev, priority: parseInt(text) || 1 }))}
              keyboardType="numeric"
            />

            {/* Effect Selection */}
            <Text style={styles.sectionTitle}>Effect</Text>
            <View style={styles.effectContainer}>
              <TouchableOpacity
                style={[
                  styles.effectButton,
                  policyForm.effect === 'allow' && styles.selectedEffect
                ]}
                onPress={() => setPolicyForm(prev => ({ ...prev, effect: 'allow' }))}
              >
                <Text style={[
                  styles.effectText,
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
                  styles.effectText,
                  policyForm.effect === 'deny' && styles.selectedEffectText
                ]}>
                  DENY
                </Text>
              </TouchableOpacity>
            </View>

            {/* Conditions */}
            <Text style={styles.sectionTitle}>Conditions</Text>
            <ScrollView style={styles.conditionsContainer}>
              {conditionTypes.map(condition => (
                <View key={condition.key} style={styles.conditionItem}>
                  <Switch
                    value={policyForm.conditions[condition.key] || false}
                    onValueChange={() => handleConditionToggle(condition.key)}
                  />
                  <Text style={styles.conditionLabel}>{condition.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Rules */}
            <Text style={styles.sectionTitle}>Rules</Text>
            <ScrollView style={styles.rulesContainer}>
              {policyForm.rules.map((rule, index) => (
                <View key={index} style={styles.ruleItem}>
                  <Text style={styles.ruleType}>{rule.type}</Text>
                  <TextInput
                    style={styles.ruleInput}
                    placeholder="Rule value"
                    value={rule.value}
                    onChangeText={(text) => handleRuleChange(index, 'value', text)}
                  />
                  <Switch
                    value={rule.enabled}
                    onValueChange={(value) => handleRuleChange(index, 'enabled', value)}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRuleRemove(index)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {/* Add Rule Buttons */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.addRuleContainer}>
                {ruleTypes.map(ruleType => (
                  <TouchableOpacity
                    key={ruleType.key}
                    style={styles.addRuleButton}
                    onPress={() => handleRuleAdd(ruleType.key)}
                  >
                    <Text style={styles.addRuleButtonText}>+ {ruleType.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={() => createPolicy(policyForm)}>
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
  policyList: {
    flex: 1,
    padding: 20,
  },
  policyCard: {
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
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  policyName: {
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
  policyDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  policyPriority: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  policyRules: {
    marginTop: 8,
  },
  rulesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  ruleText: {
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
  conditionsContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4B5563',
  },
  rulesContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
  },
  ruleType: {
    fontSize: 12,
    color: '#6B7280',
    width: 80,
  },
  ruleInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    padding: 4,
    marginHorizontal: 8,
    fontSize: 12,
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
  addRuleContainer: {
    marginTop: 12,
  },
  addRuleButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  addRuleButtonText: {
    color: '#3B82F6',
    fontSize: 12,
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

export default AdvancedPolicyManagement; 
