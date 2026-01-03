import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Staff, StaffSearchFilters, StaffDashboard } from '../types';
import StaffCard from '../components/StaffCard';
import AdvancedSearchFilters from '../components/AdvancedSearchFilters';
import BulkOperationsPanel from '../components/BulkOperationsPanel';
import { useStaff } from '../hooks/useStaffApi';
import { useAuth } from '../../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const StaffListScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    staff,
    loading,
    error,
    dashboard,
    fetchStaff,
    fetchDashboard,
    deleteStaff,
    bulkCreateStaff,
    bulkUpdateStaff,
    bulkDeleteStaff,
    exportStaff,
  } = useStaff();

  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [filters, setFilters] = useState<StaffSearchFilters>({});
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Sample departments for demo
  const departments = [
    { id: 1, name: 'Administration' },
    { id: 2, name: 'IT Department' },
    { id: 3, name: 'Human Resources' },
    { id: 4, name: 'Finance' },
    { id: 5, name: 'Maintenance' },
  ];

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchStaff(filters),
        fetchDashboard(),
      ]);
    } catch (error) {
      
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [filters]);

  const handleStaffPress = (staff: Staff) => {
    navigation.navigate('StaffDetail' as never, { staffId: staff.id } as never);
  };

  const handleEditStaff = (staff: Staff) => {
    navigation.navigate('EditStaff' as never, { staffId: staff.id } as never);
  };

  const handleDeleteStaff = (staff: Staff) => {
    Alert.alert(
      'Delete Staff',
      `Are you sure you want to delete ${staff.user?.firstName} ${staff.user?.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStaff(staff.id);
              Alert.alert('Success', 'Staff deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete staff');
            }
          },
        },
      ]
    );
  };

  const handleViewStats = (staff: Staff) => {
    navigation.navigate('StaffStats' as never, { staffId: staff.id } as never);
  };

  const handleStaffSelect = (staffId: number, selected: boolean) => {
    if (selected) {
      setSelectedStaff(prev => [...prev, staffId]);
    } else {
      setSelectedStaff(prev => prev.filter(id => id !== staffId));
    }
  };

  const handleBulkCreate = async (data: any) => {
    try {
      await bulkCreateStaff(data);
      Alert.alert('Success', 'Staff created successfully');
      setShowBulkPanel(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to create staff');
    }
  };

  const handleBulkUpdate = async (data: any) => {
    try {
      await bulkUpdateStaff(data);
      Alert.alert('Success', 'Staff updated successfully');
      setShowBulkPanel(false);
      setSelectedStaff([]);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update staff');
    }
  };

  const handleBulkDelete = async (staffIds: number[]) => {
    try {
      await bulkDeleteStaff(staffIds);
      Alert.alert('Success', 'Staff deleted successfully');
      setShowBulkPanel(false);
      setSelectedStaff([]);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete staff');
    }
  };

  const handleExport = async (format: string) => {
    try {
      await exportStaff(format);
      Alert.alert('Success', `Staff data exported as ${format.toUpperCase()}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to export staff data');
    }
  };

  const renderDashboardStats = () => {
    if (!dashboard) return null;

    return (
      <View style={styles.dashboardContainer}>
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          style={styles.dashboardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.dashboardTitle}>Staff Overview</Text>
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={() => navigation.navigate('StaffDashboard' as never)}
          >
            <Text style={styles.dashboardButtonText}>View Dashboard</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialCommunityIcons name="account-group" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{dashboard.overview.totalStaff}</Text>
            <Text style={styles.statLabel}>Total Staff</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{dashboard.overview.activeStaff}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons name="trending-up" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{dashboard.overview.newThisMonth}</Text>
            <Text style={styles.statLabel}>New This Month</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <FontAwesome5 name="dollar-sign" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>
              ${(dashboard.overview.averageSalary / 1000).toFixed(0)}k
            </Text>
            <Text style={styles.statLabel}>Avg Salary</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <Text style={styles.headerSubtitle}>
          {staff.length} staff members • {selectedStaff.length} selected
        </Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
        >
          <MaterialIcons
            name={viewMode === 'list' ? 'grid-view' : 'view-list'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowBulkPanel(true)}
        >
          <MaterialIcons name="settings" size={20} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, selectedStaff.length > 0 && styles.addButtonDisabled]}
          onPress={() => navigation.navigate('AddStaff' as never)}
          disabled={selectedStaff.length > 0}
        >
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStaffItem = ({ item }: { item: Staff }) => (
    <StaffCard
      staff={item}
      onPress={() => handleStaffPress(item)}
      onEdit={() => handleEditStaff(item)}
      onDelete={() => handleDeleteStaff(item)}
      onViewStats={() => handleViewStats(item)}
      selected={selectedStaff.includes(item.id)}
      onSelect={(selected) => handleStaffSelect(item.id, selected)}
      showSelection={selectedStaff.length > 0}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="account-group-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Staff Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        {Object.keys(filters).length > 0
          ? 'Try adjusting your filters'
          : 'Add your first staff member to get started'}
      </Text>
      {Object.keys(filters).length === 0 && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('AddStaff' as never)}
        >
          <Text style={styles.emptyStateButtonText}>Add Staff</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={loadData}>
          <Text style={styles.errorButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderDashboardStats()}
      
      <AdvancedSearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({})}
        departments={departments}
      />

      <FlatList
        data={staff}
        renderItem={renderStaffItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <BulkOperationsPanel
        visible={showBulkPanel}
        onClose={() => setShowBulkPanel(false)}
        onBulkCreate={handleBulkCreate}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
        onExport={handleExport}
        selectedStaff={selectedStaff}
        totalStaff={staff.length}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  dashboardContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dashboardButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    marginRight: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyStateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default StaffListScreen; 
