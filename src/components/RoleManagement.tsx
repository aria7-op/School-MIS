import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Types
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  parentRole?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userCount: number;
}

export interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
  parentRole?: string;
}

export interface UserAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  roleId: string;
  roleName: string;
  assignedAt: string;
  assignedBy: string;
}

// Role Management Component
export const RoleManagement: React.FC = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
    parentRole: '',
  });

  // Load data on mount
  useEffect(() => {
    loadRoles();
    loadUsers();
    loadAssignments();
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getRoles();
      setRoles(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await apiService.get('/users');
      if (response.success) {
        setUsers(response.data);
      }
    } catch (err) {
      
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    try {
      const response = await apiService.get('/rbac/assignments');
      if (response.success) {
        setAssignments(response.data);
      }
    } catch (err) {
      
    }
  }, []);

  const handleSubmit = useCallback(async (e: any) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const roleData = {
        ...formData,
        createdBy: user?.id,
        isActive: true,
      };

      let response;
      if (editingRole) {
        response = await apiService.put(`/rbac/roles/${editingRole.id}`, roleData);
      } else {
        response = await apiService.post('/rbac/roles', roleData);
      }

      if (response.success) {
        Alert.alert('Success', editingRole ? 'Role updated successfully' : 'Role created successfully');
        setShowForm(false);
        setEditingRole(null);
        resetForm();
        loadRoles();
      } else {
        setError(response.message || 'Failed to save role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setLoading(false);
    }
  }, [formData, editingRole, user, loadRoles]);

  const handleEdit = useCallback((role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      parentRole: role.parentRole || '',
    });
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (roleId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this role? This will affect all users assigned to this role.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await apiService.delete(`/rbac/roles/${roleId}`);
              if (response.success) {
                Alert.alert('Success', 'Role deleted successfully');
                loadRoles();
                loadAssignments();
              } else {
                setError(response.message || 'Failed to delete role');
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to delete role');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [loadRoles, loadAssignments]);

  const handleToggleActive = useCallback(async (role: Role) => {
    try {
      setLoading(true);
      const response = await apiService.put(`/rbac/roles/${role.id}`, {
        ...role,
        isActive: !role.isActive,
      });

      if (response.success) {
        loadRoles();
      } else {
        setError(response.message || 'Failed to update role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setLoading(false);
    }
  }, [loadRoles]);

  const handleAssignRole = useCallback(async (userId: string, roleId: string) => {
    try {
      setLoading(true);
      const response = await apiService.assignRoleToUser({
        userId,
        roleId,
        assignedBy: user?.id,
      });

      if (response.success) {
        Alert.alert('Success', 'Role assigned successfully');
        loadAssignments();
      } else {
        setError(response.message || 'Failed to assign role');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setLoading(false);
    }
  }, [user, loadAssignments]);

  const handleRemoveAssignment = useCallback(async (assignmentId: string) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this role assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await apiService.delete(`/rbac/assignments/${assignmentId}`);
              if (response.success) {
                Alert.alert('Success', 'Role assignment removed successfully');
                loadAssignments();
              } else {
                setError(response.message || 'Failed to remove assignment');
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to remove assignment');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [loadAssignments]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      parentRole: '',
    });
  }, []);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingRole(null);
    resetForm();
  }, [resetForm]);

  if (loading && roles.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading roles...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Role Management</Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
          onPress={() => setShowForm(true)}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Create Role</Text>
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
            {editingRole ? 'Edit Role' : 'Create New Role'}
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
                placeholder="Role name"
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
                placeholder="Role description"
                multiline
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>Parent Role (Optional)</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#DDD',
                  borderRadius: 4,
                  padding: 8,
                  backgroundColor: 'white',
                }}
                value={formData.parentRole}
                onChangeText={(text) => setFormData({ ...formData, parentRole: text })}
                placeholder="Parent role name"
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>Permissions</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#DDD',
                  borderRadius: 4,
                  padding: 8,
                  backgroundColor: 'white',
                  height: 80,
                }}
                value={formData.permissions.join(', ')}
                onChangeText={(text) => setFormData({ ...formData, permissions: text.split(',').map(p => p.trim()) })}
                placeholder="Permission1, Permission2, Permission3"
                multiline
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
                  {loading ? 'Saving...' : editingRole ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      <ScrollView>
        {roles.map((role) => (
          <View
            key={role.id}
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
                  {role.name}
                </Text>
                <Text style={{ color: '#666', marginBottom: 8 }}>{role.description}</Text>
                
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                    Permissions ({role.permissions.length}):
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {role.permissions.slice(0, 3).map((permission, index) => (
                      <View
                        key={index}
                        style={{
                          backgroundColor: '#E3F2FD',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginRight: 4,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: '#1976D2' }}>{permission}</Text>
                      </View>
                    ))}
                    {role.permissions.length > 3 && (
                      <Text style={{ fontSize: 10, color: '#666' }}>
                        +{role.permissions.length - 3} more
                      </Text>
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#999', marginRight: 8 }}>
                    Users: {role.userCount}
                  </Text>
                  {role.parentRole && (
                    <Text style={{ fontSize: 12, color: '#999' }}>
                      Parent: {role.parentRole}
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={{
                    padding: 8,
                    marginRight: 8,
                    borderRadius: 4,
                    backgroundColor: role.isActive ? '#E8F5E8' : '#F0F0F0',
                  }}
                  onPress={() => handleToggleActive(role)}
                >
                  <Text style={{ fontSize: 12, color: role.isActive ? '#2E7D32' : '#666' }}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    padding: 8,
                    marginRight: 8,
                    borderRadius: 4,
                    backgroundColor: '#007AFF',
                  }}
                  onPress={() => handleEdit(role)}
                >
                  <Text style={{ fontSize: 12, color: 'white' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    padding: 8,
                    borderRadius: 4,
                    backgroundColor: '#FF3B30',
                  }}
                  onPress={() => handleDelete(role.id)}
                >
                  <Text style={{ fontSize: 12, color: 'white' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Role Assignments Section */}
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Role Assignments</Text>
        
        <ScrollView>
          {assignments.map((assignment) => (
            <View
              key={assignment.id}
              style={{
                backgroundColor: 'white',
                padding: 12,
                borderRadius: 8,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#E0E0E0',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>{assignment.userName}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>{assignment.userEmail}</Text>
                  <Text style={{ fontSize: 12, color: '#007AFF' }}>Role: {assignment.roleName}</Text>
                </View>
                <TouchableOpacity
                  style={{
                    padding: 6,
                    borderRadius: 4,
                    backgroundColor: '#FF3B30',
                  }}
                  onPress={() => handleRemoveAssignment(assignment.id)}
                >
                  <Text style={{ fontSize: 10, color: 'white' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default RoleManagement; 
