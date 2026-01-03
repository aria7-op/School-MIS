import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import SecureComponent from './SecureComponent';

interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  features: any[];
  components: any[];
  permissions: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const AdvancedRoleManagement: React.FC = () => {
  const { user } = useAuth();
  const { roles, features, components, createRole, updateRole, deleteRole, assignFeatureToRole, assignComponentToRole } = useRole();
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  // Owner-only access check
  if (!user || !['owner', 'admin'].includes(user.role)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#666' }}>Access Denied - Admin/Owner Only</Text>
      </View>
    );
  }

  const canManageRoles = user.role === 'owner' || (user.role === 'admin' && selectedRole?.name !== 'owner');

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) return;
    
    try {
      await createRole({
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        isActive: true,
      });
      
      setNewRole({ name: '', description: '', permissions: [] });
      setShowCreateForm(false);
    } catch (error) {
      
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!canManageRoles) return;
    
    try {
      await deleteRole(roleId);
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
      }
    } catch (error) {
      
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={{ padding: 20 }}>
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
            🔐 Role Management
          </Text>
          <Text style={{ fontSize: 16, color: '#666' }}>
            Manage roles and permissions with granular access control
          </Text>
          {user.role === 'owner' && (
            <View style={{
              backgroundColor: '#FFF3CD',
              borderWidth: 1,
              borderColor: '#FFEAA7',
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
            }}>
              <Text style={{ color: '#856404', fontSize: 14, fontWeight: '600' }}>
                👑 Owner Mode: Full control over all roles and permissions
              </Text>
            </View>
          )}
        </View>

        {/* Create New Role */}
        <SecureComponent componentId="role-creator" action="view">
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                ➕ Create New Role
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: showCreateForm ? '#DC3545' : '#007AFF',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
                onPress={() => setShowCreateForm(!showCreateForm)}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                  {showCreateForm ? 'Cancel' : 'Create Role'}
                </Text>
              </TouchableOpacity>
            </View>

            {showCreateForm && (
              <View>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    marginBottom: 12,
                  }}
                  placeholder="Role Name"
                  value={newRole.name}
                  onChangeText={(text) => setNewRole({ ...newRole, name: text })}
                />
                
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    marginBottom: 12,
                  }}
                  placeholder="Role Description"
                  value={newRole.description}
                  onChangeText={(text) => setNewRole({ ...newRole, description: text })}
                  multiline
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: '#28A745',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={handleCreateRole}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                    Create Role
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SecureComponent>

        {/* Roles List */}
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
            📋 Roles ({roles.length})
          </Text>
          
          <ScrollView style={{ maxHeight: 300 }}>
            {roles.map((role) => (
              <View
                key={role.id}
                style={{
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  backgroundColor: selectedRole?.id === role.id ? '#F8F9FA' : 'white',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                      {role.name}
                      {role.name === 'owner' && (
                        <Text style={{ color: '#FFD700', marginLeft: 8 }}>👑</Text>
                      )}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
                      {role.description}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: selectedRole?.id === role.id ? '#007AFF' : '#F0F0F0',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                      onPress={() => setSelectedRole(role)}
                    >
                      <Text style={{ 
                        color: selectedRole?.id === role.id ? 'white' : '#666',
                        fontSize: 12,
                        fontWeight: '600'
                      }}>
                        Select
                      </Text>
                    </TouchableOpacity>
                    
                    {canManageRoles && role.name !== 'owner' && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#DC3545',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                        }}
                        onPress={() => handleDeleteRole(role.id)}
                      >
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{
                    backgroundColor: role.isActive ? '#28A745' : '#6C757D',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                      {role.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    {role.features.length} features, {role.components.length} components
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Selected Role Details */}
        {selectedRole && (
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
              ⚙️ Role Details: {selectedRole.name}
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Features ({selectedRole.features.length})
              </Text>
              {selectedRole.features.map((feature: any, index: number) => (
                <View key={index} style={{ 
                  backgroundColor: '#F8F9FA',
                  padding: 8,
                  borderRadius: 6,
                  marginBottom: 4,
                }}>
                  <Text style={{ fontSize: 14, color: '#333' }}>
                    {feature.featureName} - {feature.accessLevel}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Components ({selectedRole.components.length})
              </Text>
              {selectedRole.components.map((component: any, index: number) => (
                <View key={index} style={{ 
                  backgroundColor: '#F8F9FA',
                  padding: 8,
                  borderRadius: 6,
                  marginBottom: 4,
                }}>
                  <Text style={{ fontSize: 14, color: '#333' }}>
                    {component.componentName} - {component.accessLevel}
                  </Text>
                </View>
              ))}
            </View>
            
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
                Permissions ({selectedRole.permissions.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {selectedRole.permissions.map((permission: string, index: number) => (
                  <View key={index} style={{
                    backgroundColor: '#007AFF',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                      {permission}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Feature Assignment */}
        <SecureComponent componentId="role-editor" action="view">
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
              🔗 Feature Assignment
            </Text>
            
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
              Assign features and components to roles
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#007AFF',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                  Assign Features
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#28A745',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                  Assign Components
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SecureComponent>

        {/* Audit Log */}
        {user.role === 'owner' && (
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
              📋 Role Management Audit
            </Text>
            
            <View style={{ backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                Recent role management activities:
              </Text>
              
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#333' }}>
                  • Role "Teacher" created by owner@school.com (2 hours ago)
                </Text>
              </View>
              
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#333' }}>
                  • Feature "Students" assigned to "Teacher" role (1 hour ago)
                </Text>
              </View>
              
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 12, color: '#333' }}>
                  • Role "Student" permissions updated (30 minutes ago)
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default AdvancedRoleManagement; 
