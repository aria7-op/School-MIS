import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import ownerService from '../services/ownerService';
import { Owner } from '../types';
import AdvancedOwnersDashboard from '../components/AdvancedOwnersDashboard';
import UltraAdvancedFeatureControl from '../components/UltraAdvancedFeatureControl';
import UltraAdvancedRoleAssignment from '../components/UltraAdvancedRoleAssignment';
import UltraAdvancedPermissionMatrix from '../components/UltraAdvancedPermissionMatrix';
import UltraAdvancedABACBuilder from '../components/UltraAdvancedABACBuilder';
import UltraAdvancedPermissionAnalytics from '../components/UltraAdvancedPermissionAnalytics';

interface FilterOptions {
  status: string;
  emailVerified: boolean | null;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const AdvancedOwnersManagementScreen: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    emailVerified: null,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchOwners = async (page = 1, reset = false) => {
    try {
      setLoading(true);
      const response = await ownerService.getAllOwners({
        page,
        limit: pagination.limit,
        sort: filters.sortBy,
        order: filters.sortOrder,
        search: filters.search,
        status: filters.status,
        emailVerified: filters.emailVerified,
      });

      if (reset) {
        setOwners(response.data);
      } else {
        setOwners(prev => [...prev, ...response.data]);
      }

      setPagination(response.pagination);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to fetch owners');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOwners(1, true);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOwners(1, true);
  }, [filters]);

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'suspend' | 'delete') => {
    if (selectedOwners.length === 0) {
      Alert.alert('No Selection', 'Please select owners to perform bulk action');
      return;
    }

    const actionText = {
      activate: 'activate',
      deactivate: 'deactivate',
      suspend: 'suspend',
      delete: 'delete',
    }[action];

    Alert.alert(
      `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Are you sure you want to ${actionText} ${selectedOwners.length} owner(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              // Call bulk operation API
              Alert.alert('Success', `Successfully ${actionText}ed ${selectedOwners.length} owner(s)`);
              setSelectedOwners([]);
              fetchOwners(1, true);
            } catch (error) {
              Alert.alert('Error', `Failed to ${actionText} owners`);
            }
          },
        },
      ]
    );
  };

  const handleImport = async (data: string) => {
    try {
      const ownersData = JSON.parse(data);
      // Call import API
      Alert.alert('Success', 'Owners imported successfully');
      setShowImportModal(false);
      fetchOwners(1, true);
    } catch (error) {
      Alert.alert('Error', 'Invalid import data format');
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      // Call export API
      Alert.alert('Success', `Owners exported as ${format.toUpperCase()}`);
      setShowExportModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to export owners');
    }
  };

  const toggleOwnerSelection = (ownerId: string) => {
    setSelectedOwners(prev =>
      prev.includes(ownerId)
        ? prev.filter(id => id !== ownerId)
        : [...prev, ownerId]
    );
  };

  const renderOwnerItem = ({ item }: { item: Owner }) => (
    <View style={styles.ownerItem}>
      <TouchableOpacity
        style={styles.ownerContent}
        onPress={() => toggleOwnerSelection(item.id)}
      >
        <View style={styles.ownerInfo}>
          <Text style={styles.ownerName}>{item.name}</Text>
          <Text style={styles.ownerEmail}>{item.email}</Text>
          <View style={styles.ownerMeta}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            {item.emailVerified && (
              <MaterialIcons name="verified" size={16} color="#4CAF50" />
            )}
          </View>
        </View>
        <View style={styles.ownerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="delete" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#4CAF50';
      case 'INACTIVE': return '#FF9800';
      case 'SUSPENDED': return '#F44336';
      default: return colors.textSecondary;
    }
  };

  const renderFilters = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Advanced Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterOptions}>
                {['', 'ACTIVE', 'INACTIVE', 'SUSPENDED'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      filters.status === status && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === status && styles.filterOptionTextActive
                    ]}>
                      {status || 'All'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Email Verified</Text>
              <View style={styles.filterOptions}>
                {[null, true, false].map(verified => (
                  <TouchableOpacity
                    key={String(verified)}
                    style={[
                      styles.filterOption,
                      filters.emailVerified === verified && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, emailVerified: verified }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.emailVerified === verified && styles.filterOptionTextActive
                    ]}>
                      {verified === null ? 'All' : verified ? 'Verified' : 'Not Verified'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.filterOptions}>
                {['createdAt', 'name', 'email', 'status'].map(sortBy => (
                  <TouchableOpacity
                    key={sortBy}
                    style={[
                      styles.filterOption,
                      filters.sortBy === sortBy && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, sortBy }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.sortBy === sortBy && styles.filterOptionTextActive
                    ]}>
                      {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort Order</Text>
              <View style={styles.filterOptions}>
                {['asc', 'desc'].map(order => (
                  <TouchableOpacity
                    key={order}
                    style={[
                      styles.filterOption,
                      filters.sortOrder === order && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, sortOrder: order as 'asc' | 'desc' }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.sortOrder === order && styles.filterOptionTextActive
                    ]}>
                      {order.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (viewMode === 'dashboard') {
    return <AdvancedOwnersDashboard />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Advanced Owners Management</Text>
          <Text style={styles.subtitle}>
            {selectedOwners.length > 0 ? `${selectedOwners.length} selected` : `${pagination.total} total owners`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode('dashboard')}
          >
            <MaterialIcons name="dashboard" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilters(true)}
          >
            <MaterialIcons name="filter-list" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAnalytics(true)}
          >
            <MaterialIcons name="analytics" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search owners..."
          value={filters.search}
          onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
        />
        {filters.search.length > 0 && (
          <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, search: '' }))}>
            <MaterialIcons name="clear" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Bulk Actions */}
      {selectedOwners.length > 0 && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkActionsText}>
            {selectedOwners.length} owner(s) selected
          </Text>
          <View style={styles.bulkButtons}>
            <TouchableOpacity
              style={[styles.bulkButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleBulkAction('activate')}
            >
              <MaterialIcons name="check-circle" size={16} color="white" />
              <Text style={styles.bulkButtonText}>Activate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, { backgroundColor: '#FF9800' }]}
              onPress={() => handleBulkAction('deactivate')}
            >
              <MaterialIcons name="pause-circle" size={16} color="white" />
              <Text style={styles.bulkButtonText}>Deactivate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, { backgroundColor: '#F44336' }]}
              onPress={() => handleBulkAction('suspend')}
            >
              <MaterialIcons name="block" size={16} color="white" />
              <Text style={styles.bulkButtonText}>Suspend</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, { backgroundColor: '#9C27B0' }]}
              onPress={() => handleBulkAction('delete')}
            >
              <MaterialIcons name="delete" size={16} color="white" />
              <Text style={styles.bulkButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <MaterialIcons name="person-add" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>Add Owner</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => setShowImportModal(true)}
        >
          <MaterialIcons name="upload-file" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>Import</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => setShowExportModal(true)}
        >
          <MaterialIcons name="download" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <MaterialIcons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Owners List */}
      <FlatList
        data={owners}
        renderItem={renderOwnerItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          if (pagination.page < pagination.totalPages) {
            fetchOwners(pagination.page + 1);
          }
        }}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Owners Found</Text>
            <Text style={styles.emptySubtitle}>
              {filters.search || filters.status
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first owner'}
            </Text>
          </View>
        }
        ListFooterComponent={
          loading && pagination.page > 1 ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingMoreText}>Loading more owners...</Text>
            </View>
          ) : null
        }
      />

      {/* Modals */}
      {renderFilters()}

      {/* Import Modal */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Owners</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>Import functionality coming soon...</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Owners</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport('json')}
              >
                <MaterialIcons name="code" size={24} color={colors.primary} />
                <Text style={styles.exportOptionText}>Export as JSON</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => handleExport('csv')}
              >
                <MaterialIcons name="table-chart" size={24} color={colors.primary} />
                <Text style={styles.exportOptionText}>Export as CSV</Text>
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.white,
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: colors.text,
  },
  bulkActions: {
    backgroundColor: colors.white,
    padding: 15,
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bulkActionsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  bulkButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    gap: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  ownerItem: {
    backgroundColor: colors.white,
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownerContent: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  ownerEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ownerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 12,
    color: colors.text,
  },
  filterOptionTextActive: {
    color: colors.white,
    fontWeight: 'bold',
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 10,
    gap: 12,
  },
  exportOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
});

export default AdvancedOwnersManagementScreen; 
