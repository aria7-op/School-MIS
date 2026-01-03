import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Staff } from '../hooks/useStaffApi';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  INACTIVE: '#f59e0b',
  SUSPENDED: '#ef4444',
  GRADUATED: '#6366f1',
  TRANSFERRED: '#64748b',
};

// Dummy data for fallback
const dummyStaff = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@school.com',
    phone: '+1234567890',
    employeeId: 'EMP001',
    designation: 'Mathematics Teacher',
    department: { name: 'Mathematics' },
    status: 'ACTIVE',
    salary: 45000,
    joiningDate: '2023-01-15',
    avatar: null,
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@school.com',
    phone: '+1234567891',
    employeeId: 'EMP002',
    designation: 'Science Teacher',
    department: { name: 'Science' },
    status: 'ACTIVE',
    salary: 48000,
    joiningDate: '2023-02-20',
    avatar: null,
  },
  {
    id: 3,
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@school.com',
    phone: '+1234567892',
    employeeId: 'EMP003',
    designation: 'English Teacher',
    department: { name: 'English' },
    status: 'INACTIVE',
    salary: 42000,
    joiningDate: '2022-09-10',
    avatar: null,
  },
];

interface StaffListProps {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  onStaffSelect: (staff: Staff) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

const StaffList: React.FC<StaffListProps> = ({ 
  staff, 
  loading, 
  error, 
  onStaffSelect, 
  onRefresh, 
  refreshing = false,
  onSearch,
  searchQuery = '',
  setSearchQuery
}) => {
  const [showDummyData, setShowDummyData] = useState(false);

  useEffect(() => {
    // Show dummy data if there's an error and no staff data
    if (error && (!staff || staff.length === 0)) {
      setShowDummyData(true);
    } else {
      setShowDummyData(false);
    }
  }, [error, staff]);

  const handleDeleteStaff = async (staffId: number, staffName: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${staffName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // This would be handled by the parent component

            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete staff member');
            }
          },
        },
      ]
    );
  };

  const handleRestoreStaff = async (staffId: number, staffName: string) => {
    Alert.alert(
      'Confirm Restore',
      `Are you sure you want to restore ${staffName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              // This would be handled by the parent component

            } catch (err: any) {
              Alert.alert('Error', 'Failed to restore staff member');
            }
          },
        },
      ]
    );
  };

  const handleSearch = (text: string) => {
    if (setSearchQuery) {
      setSearchQuery(text);
    }
    if (onSearch) {
      onSearch(text);
    }
  };

  const renderItem = ({ item }: { item: Staff }) => (
    <TouchableOpacity style={styles.card} onPress={() => onStaffSelect(item)}>
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <MaterialIcons name="person" size={24} color="#6366f1" />
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.designation}>{item.designation}</Text>
        <Text style={styles.department}>{item.department?.name || 'No Department'}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status || 'ACTIVE'] || '#64748b' }]} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Text style={styles.employeeId}>ID: {item.employeeId}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => onStaffSelect(item)}
        >
          <MaterialIcons name="visibility" size={20} color="#6366f1" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => onStaffSelect({ ...item, mode: 'edit' } as any)}
        >
          <MaterialIcons name="edit" size={20} color="#10b981" />
        </TouchableOpacity>
        {item.status === 'ACTIVE' ? (
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleDeleteStaff(item.id, `${item.firstName} ${item.lastName}`)}
          >
            <MaterialIcons name="delete" size={20} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleRestoreStaff(item.id, `${item.firstName} ${item.lastName}`)}
          >
            <MaterialIcons name="restore" size={20} color="#10b981" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="people" size={48} color="#64748b" />
      <Text style={styles.empty}>No staff found.</Text>
      <Text style={styles.emptySubtext}>
        {error ? 'Error loading staff data' : 'Try adjusting your search criteria'}
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error" size={48} color="#ef4444" />
      <Text style={styles.error}>{error}</Text>
      {onRefresh && (
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {showDummyData && (
        <View style={styles.warningBanner}>
          <MaterialIcons name="warning" size={16} color="#f59e0b" />
          <Text style={styles.warningText}>Showing dummy data due to API error</Text>
        </View>
      )}
      
      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={20} color="#6366f1" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff by name, ID, or department..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading staff...</Text>
        </View>
      ) : error && !showDummyData ? (
        renderErrorState()
      ) : (
        <FlatList
          data={showDummyData ? dummyStaff : staff}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400e',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  designation: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 2,
  },
  department: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  employeeId: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  empty: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  error: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
});

export default StaffList;
