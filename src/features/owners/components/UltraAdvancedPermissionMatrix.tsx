import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput,
  Switch, Alert, FlatList, ActivityIndicator, Dimensions, Animated
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';

const { width, height } = Dimensions.get('window');

// Ultra Advanced Permission Matrix with Real-time Editing
const UltraAdvancedPermissionMatrix: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'users' | 'roles' | 'groups'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'permissions'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState<'assign' | 'remove' | 'enable' | 'disable'>('assign');
  const [fadeAnim] = useState(new Animated.Value(0));

  // Permission Scopes
  const permissionScopes = [
    { id: 'global', name: 'Global', icon: '🌍', color: '#10B981' },
    { id: 'feature', name: 'Feature', icon: '🔧', color: '#3B82F6' },
    { id: 'component', name: 'Component', icon: '⚙️', color: '#F59E0B' },
    { id: 'action', name: 'Action', icon: '🎯', color: '#8B5CF6' },
    { id: 'data', name: 'Data', icon: '📊', color: '#EF4444' },
    { id: 'time', name: 'Time-based', icon: '🕐', color: '#6B7280' }
  ];

  // Permission Categories
  const permissionCategories = {
    'Dashboard': ['view_dashboard', 'edit_dashboard', 'delete_dashboard', 'export_dashboard'],
    'Students': ['view_students', 'create_students', 'edit_students', 'delete_students', 'export_students', 'import_students'],
    'Teachers': ['view_teachers', 'create_teachers', 'edit_teachers', 'delete_teachers', 'export_teachers', 'import_teachers'],
    'Finance': ['view_finance', 'create_finance', 'edit_finance', 'delete_finance', 'export_finance', 'approve_finance'],
    'Reports': ['view_reports', 'create_reports', 'edit_reports', 'delete_reports', 'export_reports', 'schedule_reports'],
    'Settings': ['view_settings', 'edit_settings', 'delete_settings', 'system_settings'],
    'Admin': ['admin_users', 'admin_roles', 'admin_permissions', 'admin_audit', 'admin_backup']
  };

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, groupsRes, permissionsRes, assignmentsRes] = await Promise.all([
        apiService.get('/users'),
        apiService.get('/rbac/roles'),
        apiService.get('/rbac/groups'),
        apiService.get('/rbac/permissions'),
        apiService.get('/rbac/permissions/assignments')
      ]);

      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
      setPermissions(Array.isArray(permissionsRes.data) ? permissionsRes.data : []);
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load permission data');
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted entities
  const filteredEntities = useMemo(() => {
    let entities: any[] = [];
    
    if (filterType === 'all' || filterType === 'users') {
      entities.push(...users.map(u => ({ ...u, type: 'user', displayName: u.name || u.email })));
    }
    if (filterType === 'all' || filterType === 'roles') {
      entities.push(...roles.map(r => ({ ...r, type: 'role', displayName: r.name })));
    }
    if (filterType === 'all' || filterType === 'groups') {
      entities.push(...groups.map(g => ({ ...g, type: 'group', displayName: g.name })));
    }

    // Apply search filter
    if (searchQuery) {
      entities = entities.filter(entity => 
        entity.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    entities.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'permissions') {
        aValue = getEntityPermissions(a).length;
        bValue = getEntityPermissions(b).length;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return entities;
  }, [users, roles, groups, searchQuery, filterType, sortBy, sortOrder]);

  const getEntityPermissions = (entity: any) => {
    return assignments.filter(assignment => {
      if (entity.type === 'user') return assignment.userId === entity.id;
      if (entity.type === 'role') return assignment.roleId === entity.id;
      if (entity.type === 'group') return assignment.groupId === entity.id;
      return false;
    });
  };

  const hasPermission = (entity: any, permissionId: string) => {
    return getEntityPermissions(entity).some(assignment => 
      assignment.permissionId === permissionId && assignment.isActive
    );
  };

  const togglePermission = async (entity: any, permissionId: string) => {
    try {
      setLoading(true);
      
      const existingAssignment = getEntityPermissions(entity).find(
        assignment => assignment.permissionId === permissionId
      );

      if (existingAssignment) {
        // Remove permission
        await apiService.delete(`/rbac/permissions/assign/${existingAssignment.id}`);
        Alert.alert('Success', 'Permission removed successfully');
      } else {
        // Assign permission
        const assignmentData: any = {
          permissionId,
          scope: 'global',
          assignedBy: user?.id
        };

        if (entity.type === 'user') assignmentData.userId = entity.id;
        if (entity.type === 'role') assignmentData.roleId = entity.id;
        if (entity.type === 'group') assignmentData.groupId = entity.id;

        await apiService.post('/rbac/permissions/assign', assignmentData);
        Alert.alert('Success', 'Permission assigned successfully');
      }

      await loadData();
    } catch (error) {
      
      Alert.alert('Error', 'Failed to update permission');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async () => {
    if (selectedPermissions.length === 0) {
      Alert.alert('Error', 'Please select permissions to operate on');
      return;
    }

    try {
      setLoading(true);
      
      if (bulkOperation === 'assign') {
        const assignments = filteredEntities.flatMap(entity => 
          selectedPermissions.map(permissionId => ({
            permissionId,
            scope: 'global',
            assignedBy: user?.id,
            ...(entity.type === 'user' ? { userId: entity.id } : {}),
            ...(entity.type === 'role' ? { roleId: entity.id } : {}),
            ...(entity.type === 'group' ? { groupId: entity.id } : {})
          }))
        );

        await apiService.post('/rbac/permissions/assign/bulk', { assignments });
        Alert.alert('Success', `Bulk assigned ${selectedPermissions.length} permissions to ${filteredEntities.length} entities`);
      } else if (bulkOperation === 'remove') {
        const assignmentIds = filteredEntities.flatMap(entity => 
          getEntityPermissions(entity)
            .filter(assignment => selectedPermissions.includes(assignment.permissionId))
            .map(assignment => assignment.id)
        );

        for (const assignmentId of assignmentIds) {
          await apiService.delete(`/rbac/permissions/assign/${assignmentId}`);
        }
        Alert.alert('Success', `Bulk removed ${selectedPermissions.length} permissions from ${filteredEntities.length} entities`);
      }

      await loadData();
      setSelectedPermissions([]);
      setShowBulkModal(false);
    } catch (error) {
      
      Alert.alert('Error', `Failed to perform bulk ${bulkOperation}`);
    } finally {
      setLoading(false);
    }
  };

  const renderPermissionMatrix = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.matrixContainer}>
        {/* Header Row */}
        <View style={styles.matrixHeader}>
          <View style={styles.entityHeader}>
            <Text style={styles.headerText}>Entity</Text>
          </View>
          {permissions.map(permission => (
            <View key={permission.id} style={styles.permissionHeader}>
              <Text style={styles.permissionHeaderText}>{permission.name}</Text>
              <Text style={styles.permissionSubtext}>{permission.resource}</Text>
            </View>
          ))}
        </View>

        {/* Matrix Rows */}
        {filteredEntities.map(entity => (
          <View key={`${entity.type}-${entity.id}`} style={styles.matrixRow}>
            <View style={styles.entityCell}>
              <View style={styles.entityInfo}>
                <Text style={styles.entityName}>{entity.displayName}</Text>
                <Text style={styles.entityType}>{entity.type.toUpperCase()}</Text>
                <Text style={styles.entityDescription}>{entity.description}</Text>
              </View>
            </View>
            
            {permissions.map(permission => (
              <View key={permission.id} style={styles.permissionCell}>
                <TouchableOpacity
                  style={[
                    styles.permissionToggle,
                    hasPermission(entity, permission.id) && styles.activePermission
                  ]}
                  onPress={() => togglePermission(entity, permission.id)}
                  disabled={loading}
                >
                  <Text style={styles.permissionIcon}>
                    {hasPermission(entity, permission.id) ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderControls = () => (
    <View style={styles.controlsContainer}>
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search entities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filterButtons}>
          {[
            { key: 'all', label: 'All' },
            { key: 'users', label: 'Users' },
            { key: 'roles', label: 'Roles' },
            { key: 'groups', label: 'Groups' }
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                filterType === filter.key && styles.activeFilterButton
              ]}
              onPress={() => setFilterType(filter.key as any)}
            >
              <Text style={[
                styles.filterButtonText,
                filterType === filter.key && styles.activeFilterButtonText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          <Text style={styles.sortButtonText}>
            {sortBy} ({sortOrder})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowBulkModal(true)}
        >
          <Text style={styles.actionButtonText}>📦 Bulk Operations</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowAnalyticsModal(true)}
        >
          <Text style={styles.actionButtonText}>📊 Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={loadData}
        >
          <Text style={styles.actionButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBulkModal = () => (
    <Modal visible={showBulkModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Bulk Permission Operations</Text>
          
          {/* Operation Type */}
          <Text style={styles.sectionTitle}>Operation Type</Text>
          <View style={styles.operationButtons}>
            {[
              { key: 'assign', label: 'Assign', icon: '➕' },
              { key: 'remove', label: 'Remove', icon: '➖' },
              { key: 'enable', label: 'Enable', icon: '✅' },
              { key: 'disable', label: 'Disable', icon: '❌' }
            ].map(operation => (
              <TouchableOpacity
                key={operation.key}
                style={[
                  styles.operationButton,
                  bulkOperation === operation.key && styles.activeOperationButton
                ]}
                onPress={() => setBulkOperation(operation.key as any)}
              >
                <Text style={styles.operationIcon}>{operation.icon}</Text>
                <Text style={styles.operationLabel}>{operation.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Permission Selection */}
          <Text style={styles.sectionTitle}>Select Permissions</Text>
          <ScrollView style={styles.permissionSelection}>
            {Object.entries(permissionCategories).map(([category, perms]) => (
              <View key={category} style={styles.permissionCategory}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {perms.map(permission => (
                  <TouchableOpacity
                    key={permission}
                    style={[
                      styles.permissionItem,
                      selectedPermissions.includes(permission) && styles.selectedPermissionItem
                    ]}
                    onPress={() => {
                      setSelectedPermissions(prev => 
                        prev.includes(permission)
                          ? prev.filter(p => p !== permission)
                          : [...prev, permission]
                      );
                    }}
                  >
                    <Text style={styles.permissionItemText}>{permission}</Text>
                    {selectedPermissions.includes(permission) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowBulkModal(false);
                setSelectedPermissions([]);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.executeButton}
              onPress={handleBulkOperation}
              disabled={selectedPermissions.length === 0}
            >
              <Text style={styles.executeButtonText}>
                Execute ({selectedPermissions.length} permissions)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAnalyticsModal = () => (
    <Modal visible={showAnalyticsModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Permission Analytics</Text>
          
          {/* Analytics Content */}
          <ScrollView style={styles.analyticsContent}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>📊 Permission Distribution</Text>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>{assignments.length}</Text>
                  <Text style={styles.analyticsLabel}>Total Assignments</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>
                    {assignments.filter(a => a.isActive).length}
                  </Text>
                  <Text style={styles.analyticsLabel}>Active Assignments</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>{users.length}</Text>
                  <Text style={styles.analyticsLabel}>Users</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>{roles.length}</Text>
                  <Text style={styles.analyticsLabel}>Roles</Text>
                </View>
              </View>
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>🎯 Most Used Permissions</Text>
              {permissions.slice(0, 5).map(permission => {
                const assignmentCount = assignments.filter(a => a.permissionId === permission.id).length;
                return (
                  <View key={permission.id} style={styles.permissionAnalytics}>
                    <Text style={styles.permissionName}>{permission.name}</Text>
                    <View style={styles.permissionBar}>
                      <View 
                        style={[
                          styles.permissionBarFill,
                          { width: `${Math.min(assignmentCount * 10, 100)}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.permissionCount}>{assignmentCount}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAnalyticsModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>🎛️ Ultra Advanced Permission Matrix</Text>
        <Text style={styles.subtitle}>Real-time permission management with bulk operations</Text>
      </View>

      {renderControls()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading permission matrix...</Text>
        </View>
      ) : (
        <View style={styles.matrixWrapper}>
          {renderPermissionMatrix()}
        </View>
      )}

      {renderBulkModal()}
      {renderAnalyticsModal()}
    </Animated.View>
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
  controlsContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  filterButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
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
  matrixWrapper: {
    flex: 1,
  },
  matrixContainer: {
    minWidth: width * 2,
  },
  matrixHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  entityHeader: {
    width: 200,
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  permissionHeader: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    alignItems: 'center',
  },
  permissionHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
  matrixRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  entityCell: {
    width: 200,
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  entityType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  entityDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  permissionCell: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  activePermission: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  permissionIcon: {
    fontSize: 16,
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
    color: '#1F2937',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  operationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  operationButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    minWidth: 80,
  },
  activeOperationButton: {
    backgroundColor: '#3B82F6',
  },
  operationIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  operationLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  permissionSelection: {
    maxHeight: 300,
  },
  permissionCategory: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: '#F9FAFB',
  },
  selectedPermissionItem: {
    backgroundColor: '#DBEAFE',
  },
  permissionItemText: {
    fontSize: 12,
    color: '#374151',
  },
  checkmark: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
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
  executeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  executeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  analyticsContent: {
    maxHeight: 400,
  },
  analyticsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  analyticsItem: {
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 12,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  permissionAnalytics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionName: {
    fontSize: 12,
    color: '#374151',
    width: 100,
  },
  permissionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  permissionBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  permissionCount: {
    fontSize: 12,
    color: '#6B7280',
    width: 30,
    textAlign: 'right',
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default UltraAdvancedPermissionMatrix; 
