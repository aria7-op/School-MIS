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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resourceType: string;
  action: string;
  scope: string;
  source: string; // 'role', 'group', 'direct'
}

interface Role {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  type: string;
}

const UserPermissions: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all necessary data
      const [permissionsRes, rolesRes, groupsRes] = await Promise.all([
        secureApiService.get('/rbac/permissions'),
        secureApiService.get('/rbac/roles'),
        secureApiService.get('/rbac/groups')
      ]);
      
      setPermissions(permissionsRes.data || []);
      setRoles(rolesRes.data || []);
      setGroups(groupsRes.data || []);
      
      // Load users (you might need to create this endpoint)
      // For now, we'll use mock data
      setUsers([
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'TEACHER', isActive: true },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'ADMIN', isActive: true },
        { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'STUDENT', isActive: true },
      ]);
    } catch (error: any) {
      
      Alert.alert('Error', error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      setLoading(true);
      const response = await secureApiService.get(`/rbac/users/${userId}/permissions`);
      if (response.success) {
        setUserPermissions(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch user permissions');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch user permissions');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermissions = async (userId: string, permissions: any[]) => {
    try {
      setLoading(true);
      const response = await secureApiService.put(`/rbac/users/${userId}/permissions`, { permissions });
      if (response.success) {
        await fetchUserPermissions(userId);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update user permissions');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update user permissions');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkUserAccess = async (userId: string, resource: string, action: string) => {
    try {
      const response = await secureApiService.post('/rbac/access/check', {
        userId,
        resource,
        action
      });
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to check user access');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to check user access');
    }
  };

  const handleViewPermissions = async (user: User) => {
    setSelectedUser(user);
    await fetchUserPermissions(user.id);
    setShowPermissionsModal(true);
  };

  const handleAssignPermissions = async (userId: string, permissionIds: string[]) => {
    try {
      setLoading(true);
      const assignments = permissionIds.map(permissionId => ({
        userId,
        permissionId,
        scope: 'global',
        priority: 1
      }));

      await secureApiService.post('/rbac/permissions/assign', { assignments });
      Alert.alert('Success', 'Permissions assigned successfully');
      setShowPermissionsModal(false);
      await fetchUserPermissions(userId);
    } catch (error: any) {
      
      Alert.alert('Error', error.message || 'Failed to assign permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRoles = async (userId: string, roleIds: string[]) => {
    try {
      setLoading(true);
      // This would be a custom endpoint for assigning roles to users
      // For now, we'll simulate the API call
      Alert.alert('Success', 'Roles assigned successfully');
      setShowRolesModal(false);
    } catch (error: any) {
      
      Alert.alert('Error', error.message || 'Failed to assign roles');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignGroups = async (userId: string, groupIds: string[]) => {
    try {
      setLoading(true);
      // This would be a custom endpoint for assigning groups to users
      // For now, we'll simulate the API call
      Alert.alert('Success', 'Groups assigned successfully');
      setShowGroupsModal(false);
    } catch (error: any) {
      
      Alert.alert('Error', error.message || 'Failed to assign groups');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'active' && user.isActive) ||
                         (filterType === 'inactive' && !user.isActive) ||
                         user.role.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.userBadges}>
          <View style={[styles.badge, styles.roleBadge]}>
            <Text style={styles.badgeText}>{item.role}</Text>
          </View>
          <View style={[styles.badge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.badgeText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.permissionsButton]}
          onPress={() => handleViewPermissions(item)}
        >
          <Text style={styles.buttonText}>Permissions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rolesButton]}
          onPress={() => {
            setSelectedUser(item);
            setShowRolesModal(true);
          }}
        >
          <Text style={styles.buttonText}>Roles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.groupsButton]}
          onPress={() => {
            setSelectedUser(item);
            setShowGroupsModal(true);
          }}
        >
          <Text style={styles.buttonText}>Groups</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPermissionsModal = () => (
    <Modal visible={showPermissionsModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            User Permissions - {selectedUser?.name}
          </Text>
          
          <Text style={styles.modalSubtitle}>
            Current effective permissions for this user
          </Text>
          
          <ScrollView style={styles.permissionsList}>
            {userPermissions.map((permission) => (
              <View key={permission.id} style={styles.permissionItem}>
                <View style={styles.permissionItemContent}>
                  <Text style={styles.permissionName}>{permission.name}</Text>
                  <Text style={styles.permissionDescription}>{permission.description}</Text>
                  <Text style={styles.permissionAction}>{permission.action} on {permission.resourceType}</Text>
                  <Text style={styles.permissionSource}>Source: {permission.source}</Text>
                </View>
                <View style={[styles.permissionBadge, styles[`${permission.source}Badge`]]}>
                  <Text style={styles.permissionBadgeText}>{permission.source}</Text>
                </View>
              </View>
            ))}
            
            {userPermissions.length === 0 && (
              <Text style={styles.noPermissionsText}>
                No permissions assigned to this user
              </Text>
            )}
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowPermissionsModal(false);
                setSelectedUser(null);
              }}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.assignButton]}
              onPress={() => {
                // Open permission assignment modal
                Alert.alert('Info', 'Permission assignment feature coming soon');
              }}
            >
              <Text style={styles.modalButtonText}>Assign Permissions</Text>
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
            Assign Roles - {selectedUser?.name}
          </Text>
          
          <Text style={styles.modalSubtitle}>
            Select roles to assign to this user
          </Text>
          
          <ScrollView style={styles.rolesList}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={styles.roleItem}
                onPress={() => {
                  // Toggle role selection
                  Alert.alert('Info', `Role assignment feature coming soon`);
                }}
              >
                <View style={styles.roleItemContent}>
                  <Text style={styles.roleName}>{role.name}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                  <Text style={styles.roleType}>{role.type}</Text>
                </View>
                <View style={styles.roleCheckbox}>
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
                setSelectedUser(null);
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => {
                Alert.alert('Info', 'Role assignment feature coming soon');
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

  const renderGroupsModal = () => (
    <Modal visible={showGroupsModal} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Assign Groups - {selectedUser?.name}
          </Text>
          
          <Text style={styles.modalSubtitle}>
            Select groups to assign to this user
          </Text>
          
          <ScrollView style={styles.groupsList}>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupItem}
                onPress={() => {
                  // Toggle group selection
                  Alert.alert('Info', `Group assignment feature coming soon`);
                }}
              >
                <View style={styles.groupItemContent}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupDescription}>{group.description}</Text>
                  <Text style={styles.groupType}>{group.type}</Text>
                </View>
                <View style={styles.groupCheckbox}>
                  <Text style={styles.checkboxText}>✓</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowGroupsModal(false);
                setSelectedUser(null);
              }}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => {
                Alert.alert('Info', 'Group assignment feature coming soon');
              }}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Assigning...' : 'Assign Groups'}
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
        <Text style={styles.title}>👤 User Permissions</Text>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
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
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'active' && styles.filterButtonActive]}
            onPress={() => setFilterType('active')}
          >
            <Text style={[styles.filterButtonText, filterType === 'active' && styles.filterButtonTextActive]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'inactive' && styles.filterButtonActive]}
            onPress={() => setFilterType('inactive')}
          >
            <Text style={[styles.filterButtonText, filterType === 'inactive' && styles.filterButtonTextActive]}>
              Inactive
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          style={styles.userList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderPermissionsModal()}
      {renderRolesModal()}
      {renderGroupsModal()}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
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
  userList: {
    flex: 1,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  userBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadge: {
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
  permissionsButton: {
    backgroundColor: '#3B82F6',
  },
  rolesButton: {
    backgroundColor: '#F59E0B',
  },
  groupsButton: {
    backgroundColor: '#8B5CF6',
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
  assignButton: {
    backgroundColor: '#3B82F6',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  permissionsList: {
    maxHeight: 300,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  permissionItemContent: {
    flex: 1,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  permissionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  permissionAction: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  permissionSource: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  permissionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadge: {
    backgroundColor: '#F59E0B',
  },
  groupBadge: {
    backgroundColor: '#8B5CF6',
  },
  directBadge: {
    backgroundColor: '#10B981',
  },
  permissionBadgeText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noPermissionsText: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
    padding: 20,
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
  groupsList: {
    maxHeight: 300,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  groupItemContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  groupDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  groupType: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  groupCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default UserPermissions; 
