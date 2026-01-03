import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../../contexts/NotificationContext';
import { Notification, NotificationFilters, NotificationStatus } from '../../../types/notifications';
import NotificationItem from './NotificationItem';
import NotificationFiltersModal from './NotificationFiltersModal';
import NotificationPreferences from './NotificationPreferences';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: Notification) => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  selectedNotifications: string[];
  hasSelection: boolean;
  onSelectNotification: (id: string) => void;
  onDeselectNotification: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onMarkAsRead: (ids: string[]) => void;
  onMarkAsArchived: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onBulkMarkAsRead: () => void;
  onBulkMarkAsArchived: () => void;
  onBulkDelete: () => void;
  onRefresh: () => void;
  onSync: () => void;
  onCleanup: () => void;
  onGetStats: () => void;
  onTest: () => void;
  onCreateTest: () => void;
  onShowPreferences: () => void;
  onShowFilters: () => void;
  getNotificationIcon: (type: string) => string;
  getNotificationColor: (priority: string) => string;
  formatNotificationTime: (dateString: string) => string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible,
  onClose,
  onNotificationPress,
  notifications,
  unreadCount,
  isLoading,
  isConnected,
  selectedNotifications,
  hasSelection,
  onSelectNotification,
  onDeselectNotification,
  onSelectAll,
  onClearSelection,
  onMarkAsRead,
  onMarkAsArchived,
  onDelete,
  onBulkMarkAsRead,
  onBulkMarkAsArchived,
  onBulkDelete,
  onRefresh,
  onSync,
  onCleanup,
  onGetStats,
  onTest,
  onCreateTest,
  onShowPreferences,
  onShowFilters,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime
}) => {
  const {
    fetchNotifications,
    markAsRead,
    markAsArchived,
    deleteNotifications,
    getNotificationIcon: useNotificationsGetNotificationIcon,
    getNotificationColor: useNotificationsGetNotificationColor,
    formatNotificationTime: useNotificationsFormatNotificationTime
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchNotifications({ status: 'PENDING', limit: 20, page: 1 });
    }
  }, [visible, fetchNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    fetchNotifications({ status: 'PENDING', limit: 20, page: 1, search: query });
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback((notification: Notification) => {
    if (hasSelection) {
      if (selectedNotifications.includes(notification.id)) {
        onDeselectNotification(notification.id);
      } else {
        onSelectNotification(notification.id);
      }
    } else {
      if (notification.status === 'PENDING') {
        markAsRead([notification.id]);
      }
      onNotificationPress?.(notification);
    }
  }, [hasSelection, selectedNotifications, onSelectNotification, onDeselectNotification, markAsRead, onNotificationPress]);

  const handleNotificationLongPress = useCallback((notification: Notification) => {
    if (selectedNotifications.includes(notification.id)) {
      onDeselectNotification(notification.id);
    } else {
      onSelectNotification(notification.id);
    }
  }, [selectedNotifications, onSelectNotification, onDeselectNotification]);

  const handleBulkAction = useCallback((action: 'read' | 'archive' | 'delete') => {
    if (!hasSelection) return;

    const selectedIds = selectedNotifications;
    
    switch (action) {
      case 'read':
        onMarkAsRead(selectedIds);
        break;
      case 'archive':
        onMarkAsArchived(selectedIds);
        break;
      case 'delete':
        Alert.alert(
          'Confirm Delete',
          `Are you sure you want to delete ${selectedIds.length} notifications?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => onDelete(selectedIds)
            }
          ]
        );
        break;
    }
  }, [hasSelection, selectedNotifications, onMarkAsRead, onMarkAsArchived, onDelete]);

  const filteredNotifications = useCallback(() => {
    let filtered = notifications;

    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(n => n.status === 'PENDING');
        break;
      case 'archived':
        filtered = filtered.filter(n => n.status === 'ARCHIVED');
        break;
      default:
        // Show all
        break;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, activeTab, searchQuery]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          {hasSelection ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onClearSelection}
            >
              <MaterialIcons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowFilters(true)}
              >
                <MaterialIcons name="filter-list" size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowPreferences(true)}
              >
                <MaterialIcons name="settings" size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowAdvancedMenu(!showAdvancedMenu)}
              >
                <MaterialIcons name="more-vert" size={20} color="#6B7280" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.connectionStatus}>
          <MaterialIcons name="wifi-off" size={16} color="#EF4444" />
          <Text style={styles.connectionText}>Offline - Some features may be limited</Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notifications..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => handleSearch('')}
          >
            <MaterialIcons name="close" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'archived' && styles.activeTab]}
          onPress={() => setActiveTab('archived')}
        >
          <Text style={[styles.tabText, activeTab === 'archived' && styles.activeTabText]}>
            Archived ({notifications.filter(n => n.status === 'ARCHIVED').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selection Mode Actions */}
      {hasSelection && (
        <View style={styles.selectionActions}>
          <Text style={styles.selectionText}>
            {selectedNotifications.length} selected
          </Text>
          <View style={styles.selectionButtons}>
            <TouchableOpacity
              style={[styles.selectionButton, styles.readButton]}
              onPress={() => handleBulkAction('read')}
            >
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
              <Text style={styles.selectionButtonText}>Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectionButton, styles.archiveButton]}
              onPress={() => handleBulkAction('archive')}
            >
              <MaterialIcons name="archive" size={16} color="#FFFFFF" />
              <Text style={styles.selectionButtonText}>Archive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectionButton, styles.deleteButton]}
              onPress={() => handleBulkAction('delete')}
            >
              <MaterialIcons name="delete" size={16} color="#FFFFFF" />
              <Text style={styles.selectionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Advanced Menu */}
      {showAdvancedMenu && !hasSelection && (
        <View style={styles.advancedMenu}>
          <TouchableOpacity
            style={styles.advancedMenuItem}
            onPress={() => {
              setShowAdvancedMenu(false);
              onSync();
            }}
          >
            <MaterialIcons name="sync" size={16} color="#6B7280" />
            <Text style={styles.advancedMenuItemText}>Sync with Backend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.advancedMenuItem}
            onPress={() => {
              setShowAdvancedMenu(false);
              onCleanup();
            }}
          >
            <MaterialIcons name="cleaning-services" size={16} color="#6B7280" />
            <Text style={styles.advancedMenuItemText}>Cleanup Old</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.advancedMenuItem}
            onPress={() => {
              setShowAdvancedMenu(false);
              onGetStats();
            }}
          >
            <MaterialIcons name="analytics" size={16} color="#6B7280" />
            <Text style={styles.advancedMenuItemText}>View Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.advancedMenuItem}
            onPress={() => {
              setShowAdvancedMenu(false);
              onTest();
            }}
          >
            <MaterialIcons name="notifications" size={16} color="#6B7280" />
            <Text style={styles.advancedMenuItemText}>Test Notification</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.advancedMenuItem}
            onPress={() => {
              setShowAdvancedMenu(false);
              onCreateTest();
            }}
          >
            <MaterialIcons name="add" size={16} color="#6B7280" />
            <Text style={styles.advancedMenuItemText}>Create Test</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [
    hasSelection,
    selectedNotifications.length,
    showAdvancedMenu,
    isConnected,
    searchQuery,
    activeTab,
    notifications.length,
    unreadCount,
    onClearSelection,
    setShowFilters,
    setShowPreferences,
    setShowAdvancedMenu,
    setSearchQuery,
    setActiveTab,
    handleBulkAction,
    onSync,
    onCleanup,
    onGetStats,
    onTest,
    onCreateTest
  ]);

  const renderNotificationItem = useCallback(({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      isSelected={selectedNotifications.includes(item.id)}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleNotificationLongPress(item)}
      getNotificationIcon={getNotificationIcon}
      getNotificationColor={getNotificationColor}
      formatNotificationTime={formatNotificationTime}
      showSelectionIndicator={hasSelection}
    />
  ), [selectedNotifications, handleNotificationPress, handleNotificationLongPress, hasSelection, getNotificationIcon, getNotificationColor, formatNotificationTime]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <MaterialIcons
        name="notifications-none"
        size={64}
        color="#9CA3AF"
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No notifications found' : 'No notifications'}
      </Text>
      <Text style={styles.emptyMessage}>
        {searchQuery
          ? 'Try adjusting your search terms'
          : 'You\'re all caught up! New notifications will appear here.'}
      </Text>
    </View>
  ), [searchQuery]);

  const renderFooter = () => {
    if (isLoading) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.footerText}>Loading...</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {renderHeader()}
        
        <FlatList
          data={filteredNotifications()}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
        
        <NotificationFiltersModal
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApplyFilters={(filters) => {
            setShowFilters(false);
            // Handle filters
          }}
          onClearFilters={() => {
            setShowFilters(false);
            // Handle clear filters
          }}
        />

        <NotificationPreferences
          visible={showPreferences}
          onClose={() => setShowPreferences(false)}
          onUpdatePreferences={(preferences) => {
            setShowPreferences(false);
            // Handle preferences update
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  connectionText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  clearSearchButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectionText: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '500',
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  readButton: {
    backgroundColor: '#10B981',
  },
  archiveButton: {
    backgroundColor: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  selectionButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  advancedMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  advancedMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  advancedMenuItemText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default NotificationCenter; 
export default NotificationCenter; 
