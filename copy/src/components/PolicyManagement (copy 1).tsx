import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Types
export interface Policy {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions: any;
  effect: 'allow' | 'deny';
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface PolicyFormData {
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions: any;
  effect: 'allow' | 'deny';
  priority: number;
}

// Policy Management Component
export const PolicyManagement: React.FC = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState<PolicyFormData>({
    name: '',
    description: '',
    resource: '',
    action: '',
    conditions: {},
    effect: 'allow',
    priority: 1,
  });

  // Load policies on mount
  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get('/rbac/policies');
      if (response.success) {
        setPolicies(response.data);
      } else {
        setError(response.message || 'Failed to load policies');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async (e: any) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const policyData = {
        ...formData,
        createdBy: user?.id,
        isActive: true,
      };

      let response;
      if (editingPolicy) {
        response = await apiService.put(`/rbac/policies/${editingPolicy.id}`, policyData);
      } else {
        response = await apiService.post('/rbac/policies', policyData);
      }

      if (response.success) {
        Alert.alert('Success', editingPolicy ? 'Policy updated successfully' : 'Policy created successfully');
        setShowForm(false);
        setEditingPolicy(null);
        resetForm();
        loadPolicies();
      } else {
        setError(response.message || 'Failed to save policy');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setLoading(false);
    }
  }, [formData, editingPolicy, user]);

  const handleEdit = useCallback((policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description,
      resource: policy.resource,
      action: policy.action,
      conditions: policy.conditions,
      effect: policy.effect,
      priority: policy.priority,
    });
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (policyId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this policy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await apiService.delete(`/rbac/policies/${policyId}`);
              if (response.success) {
                Alert.alert('Success', 'Policy deleted successfully');
                loadPolicies();
              } else {
                setError(response.message || 'Failed to delete policy');
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete policy');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [loadPolicies]);

  const handleToggleActive = useCallback(async (policy: Policy) => {
    try {
      setLoading(true);
      const response = await apiService.put(`/rbac/policies/${policy.id}`, {
        ...policy,
        isActive: !policy.isActive,
      });

      if (response.success) {
        loadPolicies();
      } else {
        setError(response.message || 'Failed to update policy');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update policy');
    } finally {
      setLoading(false);
    }
  }, [loadPolicies]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      resource: '',
      action: '',
      conditions: {},
      effect: 'allow',
      priority: 1,
    });
  }, []);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingPolicy(null);
    resetForm();
  }, [resetForm]);

  if (loading && policies.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading policies...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Policy Management</Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
          onPress={() => setShowForm(true)}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Create Policy</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={{ backgroundColor: '#FFE5E5', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ color: '#D32F2F' }}>{error}</Text>
        </View>
      )}

      {showForm && (
        <View style={{ backgroundColor: '#F5F5F5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
          </Text>

          <ScrollView>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>Name</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#DDD',
                  borderRadius: 4,
                  padding: 8,
                  backgroundColor: 'white',
                }}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Policy name"
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>Description</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#DDD',
                  borderRadius: 4,
                  padding: 8,
                  backgroundColor: 'white',
                  height: 80,
                }}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Policy description"
                multiline
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>Resource</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#DDD',
                  borderRadius: 4,
                  padding: 8,
                  backgroundColor: 'white',
                }}
                value={formData.resource}
                onChangeText={(text) => setFormData({ ...formData, resource: text })}
                placeholder="e.g., users, files, components"
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>Action</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#DDD',
                  borderRadius: 4,
                  padding: 8,
                  backgroundColor: 'white',
                }}
                value={formData.action}
                onChangeText={(text) => setFormData({ ...formData, action: text })}
                placeholder="e.g., read, write, delete"
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>Effect</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 8,
                    marginRight: 8,
                    borderRadius: 4,
                    backgroundColor: formData.effect === 'allow' ? '#007AFF' : '#F0F0F0',
                  }}
                  onPress={() => setFormData({ ...formData, effect: 'allow' })}
                >
                  <Text style={{ textAlign: 'center', color: formData.effect === 'allow' ? 'white' : 'black' }}>
                    Allow
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 8,
                    borderRadius: 4,
                    backgroundColor: formData.effect === 'deny' ? '#FF3B30' : '#F0F0F0',
                  }}
                  onPress={() => setFormData({ ...formData, effect: 'deny' })}
                >
                  <Text style={{ textAlign: 'center', color: formData.effect === 'deny' ? 'white' : 'black' }}>
                    Deny
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>Priority</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#DDD',
                  borderRadius: 4,
                  padding: 8,
                  backgroundColor: 'white',
                }}
                value={formData.priority.toString()}
                onChangeText={(text) => setFormData({ ...formData, priority: parseInt(text) || 1 })}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  marginRight: 8,
                  borderRadius: 8,
                  backgroundColor: '#6C757D',
                }}
                onPress={handleCancel}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: '#007AFF',
                }}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                  {loading ? 'Saving...' : editingPolicy ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      <ScrollView>
        {policies.map((policy) => (
          <View
            key={policy.id}
            style={{
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 8,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E0E0E0',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                  {policy.name}
                </Text>
                <Text style={{ color: '#666', marginBottom: 8 }}>{policy.description}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                  <View
                    style={{
                      backgroundColor: policy.effect === 'allow' ? '#E8F5E8' : '#FFE5E5',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      marginRight: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: policy.effect === 'allow' ? '#2E7D32' : '#D32F2F',
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {policy.effect.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    {policy.resource}:{policy.action}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#999' }}>
                  Priority: {policy.priority} | Created: {new Date(policy.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={{
                    padding: 8,
                    marginRight: 8,
                    borderRadius: 4,
                    backgroundColor: policy.isActive ? '#E8F5E8' : '#F0F0F0',
                  }}
                  onPress={() => handleToggleActive(policy)}
                >
                  <Text style={{ fontSize: 12, color: policy.isActive ? '#2E7D32' : '#666' }}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    padding: 8,
                    marginRight: 8,
                    borderRadius: 4,
                    backgroundColor: '#007AFF',
                  }}
                  onPress={() => handleEdit(policy)}
                >
                  <Text style={{ fontSize: 12, color: 'white' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    padding: 8,
                    borderRadius: 4,
                    backgroundColor: '#FF3B30',
                  }}
                  onPress={() => handleDelete(policy.id)}
                >
                  <Text style={{ fontSize: 12, color: 'white' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default PolicyManagement; 
