import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../constants/colors';
import { useOwners } from '../contexts/OwnersContext';
import { Owner } from '../types';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import BulkOperationsModal from '../components/BulkOperationsModal';
import ImportExportModal from '../components/ImportExportModal';
import SearchFilterBar from '../components/SearchFilterBar';
import StatsOverview from '../components/StatsOverview';
import OwnerManagementTab from '../components/OwnerManagementTab';

const OwnersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { owners, loading, refreshOwners, pagination } = useOwners();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'analytics' | 'management'>('list');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export'>('export');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    emailVerified: null as boolean | null,
  });

  // Calculate stats from owners data
  const calculateStats = () => {
    if (!owners) return null;
    
    const active = owners.filter(o => o.status === 'ACTIVE').length;
    const inactive = owners.filter(o => o.status === 'INACTIVE').length;
    const suspended = owners.filter(o => o.status === 'SUSPENDED').length;
    const emailVerified = owners.filter(o => o.emailVerified).length;
    const emailNotVerified = owners.length - emailVerified;
    
    return {
      total: owners.length,
      active,
      inactive,
      suspended,
      emailVerified,
      emailNotVerified,
      growthRate: 15.2, // Mock data - would come from API
      recentActivity: 23, // Mock data - would come from API
    };
  };

  const stats = calculateStats();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshOwners();
    setRefreshing(false);
  };

  const handleOwnerPress = (owner: Owner) => {
    (navigation as any).navigate('OwnerDetails', { ownerId: owner.id });
  };

  const toggleOwnerSelection = (ownerId: string) => {
    setSelectedOwners(prev =>
      prev.includes(ownerId)
        ? prev.filter(id => id !== ownerId)
        : [...prev, ownerId]
    );
  };

  const handleBulkAction = async (action: string, options?: any) => {
    try {
      // Implement bulk actions here
      Alert.alert('Success', `Bulk ${action} completed successfully`);
      setSelectedOwners([]);
      setShowBulkModal(false);
      refreshOwners();
    } catch (error) {
      Alert.alert('Error', `Failed to perform bulk ${action}`);
    }
  };

  const handleImport = async (data: string, format: string) => {
    try {
      // Implement import logic here
      Alert.alert('Success', 'Data imported successfully');
      setShowImportExportModal(false);
      refreshOwners();
    } catch (error) {
      Alert.alert('Error', 'Failed to import data');
    }
  };

  const handleExport = async (format: string, filters?: any) => {
    try {
      // Implement export logic here
      Alert.alert('Success', `Data exported as ${format.toUpperCase()}`);
      setShowImportExportModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleStatPress = (statType: string) => {
    // Handle stat card press - could filter list or show detailed view

  };

  // Search and filter handlers
  const handleSearch = () => {
    // Implement search logic here

    refreshOwners(); // This would typically include search parameters
  };

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
  };

  const handleFilterChange = (newFilters: { status: string; emailVerified: boolean | null }) => {
    setFilters(newFilters);
    // Implement filter logic here

    refreshOwners(); // This would typically include filter parameters
  };

  const renderOwnerItem = ({ item }: { item: Owner }) => (
    <TouchableOpacity
      style={styles.ownerItem}
      onPress={() => handleOwnerPress(item)}
      onLongPress={() => toggleOwnerSelection(item.id)}
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
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#4CAF50';
      case 'INACTIVE': return '#FF9800';
      case 'SUSPENDED': return '#F44336';
      default: return colors.textSecondary;
    }
  };

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('list')}
      >
        <MaterialIcons 
          name="list" 
          size={20} 
          color={viewMode === 'list' ? colors.white : colors.primary} 
        />
        <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
          List
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'analytics' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('analytics')}
      >
        <MaterialIcons 
          name="analytics" 
          size={20} 
          color={viewMode === 'analytics' ? colors.white : colors.primary} 
        />
        <Text style={[styles.viewModeText, viewMode === 'analytics' && styles.viewModeTextActive]}>
          Analytics
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'management' && styles.viewModeButtonActive]}
        onPress={() => setViewMode('management')}
      >
        <MaterialIcons 
          name="settings" 
          size={20} 
          color={viewMode === 'management' ? colors.white : colors.primary} 
        />
        <Text style={[styles.viewModeText, viewMode === 'management' && styles.viewModeTextActive]}>
          Management
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity 
        style={styles.quickActionButton}
        onPress={() => Alert.alert('Add Owner', 'Add owner functionality coming soon')}
      >
        <MaterialIcons name="person-add" size={20} color={colors.primary} />
        <Text style={styles.quickActionText}>Add Owner</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.quickActionButton}
        onPress={() => {
          setImportExportMode('import');
          setShowImportExportModal(true);
        }}
      >
        <MaterialIcons name="upload-file" size={20} color={colors.primary} />
        <Text style={styles.quickActionText}>Import</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.quickActionButton}
        onPress={() => {
          setImportExportMode('export');
          setShowImportExportModal(true);
        }}
      >
        <MaterialIcons name="download" size={20} color={colors.primary} />
        <Text style={styles.quickActionText}>Export</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.quickActionButton}
        onPress={() => setShowBulkModal(true)}
      >
        <MaterialIcons name="settings" size={20} color={colors.primary} />
        <Text style={styles.quickActionText}>Bulk Actions</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.quickActionButton}
        onPress={() => (navigation as any).navigate('UltraAdvancedPermissionManagement')}
      >
        <MaterialIcons name="security" size={20} color={colors.primary} />
        <Text style={styles.quickActionText}>Permission Management</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBulkActionsBar = () => {
    if (selectedOwners.length === 0) return null;

    return (
      <View style={styles.bulkActionsBar}>
        <Text style={styles.bulkActionsText}>
          {selectedOwners.length} owner{selectedOwners.length !== 1 ? 's' : ''} selected
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
            onPress={() => handleBulkAction('delete')}
          >
            <MaterialIcons name="delete" size={16} color="white" />
            <Text style={styles.bulkButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (viewMode === 'analytics') {
      return <AnalyticsDashboard />;
    }

    if (viewMode === 'management') {
      return <OwnerManagementTab />;
    }

    // List view with stats
    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Overview */}
        {stats && (
          <StatsOverview 
            stats={stats} 
            onStatPress={handleStatPress}
          />
        )}

        {/* Owners List */}
        <FlatList
          data={owners}
          renderItem={renderOwnerItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Owners Found</Text>
              <Text style={styles.emptySubtitle}>
                Get started by creating your first owner
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      </ScrollView>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading owners...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Owners Management</Text>
          <Text style={styles.subtitle}>
            {pagination?.total || 0} total owners • {owners?.filter(o => o.status === 'ACTIVE').length || 0} active
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* View Mode Selector */}
      {renderViewModeSelector()}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Bulk Actions Bar */}
      {renderBulkActionsBar()}

      {/* Search & Filter */}
      <SearchFilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Content */}
      {renderContent()}

      {/* Modals */}
      <BulkOperationsModal
        visible={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedCount={selectedOwners.length}
        onBulkAction={handleBulkAction}
      />

      <ImportExportModal
        visible={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        mode={importExportMode}
        onImport={handleImport}
        onExport={handleExport}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
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
  headerContent: {
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
  refreshButton: {
    padding: 8,
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: 8,
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  viewModeTextActive: {
    color: colors.white,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
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
  bulkActionsBar: {
    backgroundColor: colors.white,
    padding: 15,
    margin: 16,
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
  managementContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  managementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  managementSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  ownerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
});

export default OwnersScreen;
