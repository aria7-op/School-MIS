import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotificationSystem } from '../../../hooks/useNotificationSystem';
import { Notification, NotificationFilters } from '../../../types/notifications';
import NotificationBadge from './NotificationBadge';
import NotificationCenter from './NotificationCenter';
import NotificationToast from './NotificationToast';
import NotificationPreferences from './NotificationPreferences';
import NotificationFiltersModal from './NotificationFiltersModal';

// Conditional import for mobile-only features
let messaging: any = null;

if (Platform.OS !== 'web') {
  try {
    messaging = require('@react-native-firebase/messaging').default;
  } catch (error) {
    console.warn('Firebase messaging not available:', error);
  }
}

interface AdvancedNotificationSystemProps {
  showBadge?: boolean;
  showCenter?: boolean;
  showPreferences?: boolean;
  showFilters?: boolean;
  autoInitialize?: boolean;
  enablePushNotifications?: boolean;
  enableWebSocket?: boolean;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  onNotificationPress?: (notification: Notification) => void;
  onPushPermissionGranted?: () => void;
  onPushPermissionDenied?: () => void;
}

const AdvancedNotificationSystem: React.FC<AdvancedNotificationSystemProps> = ({
  showBadge = true,
  showCenter = true,
  showPreferences = true,
  showFilters = true,
  autoInitialize = true,
  enablePushNotifications = true,
  enableWebSocket = true,
  quietHours = {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  onNotificationPress,
  onPushPermissionGranted,
  onPushPermissionDenied
}) => {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const {
    notifications,
    unreadCount,
    stats,
    preferences,
    isConnected,
    isLoading,
    toasts,
    isInitialized,
    pushToken,
    filters,
    searchQuery,
    selectedNotifications,
    hasSelection,
    fetchNotifications,
    markAsRead,
    markAsArchived,
    deleteNotifications,
    createNotification,
    updatePreferences,
    showToast,
    hideToast,
    clearAllToasts,
    selectNotification,
    deselectNotification,
    selectAllNotifications,
    clearSelection,
    bulkMarkAsRead,
    bulkMarkAsArchived,
    bulkDelete,
    requestPushPermissions,
    getPushToken,
    applyFilters,
    clearFilters,
    searchNotifications,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    refreshNotifications,
    syncWithBackend,
    cleanupOldNotifications,
    getNotificationStats,
    testNotificationSystem,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime
  } = useNotificationSystem({
    autoSubscribe: autoInitialize,
    showToasts: true,
    onNotificationPress,
    onPushPermissionGranted,
    onPushPermissionDenied
  });

  // Auto-initialize push notifications
  useEffect(() => {
    if (enablePushNotifications && isInitialized) {
      initializePushNotifications();
    }
  }, [enablePushNotifications, isInitialized]);

  // Auto-subscribe to real-time updates
  useEffect(() => {
    if (enableWebSocket && isInitialized) {
      subscribeToNotifications();
    }

    return () => {
      if (enableWebSocket) {
        unsubscribeFromNotifications();
      }
    };
  }, [enableWebSocket, isInitialized, subscribeToNotifications, unsubscribeFromNotifications]);

  // Initialize push notifications
  const initializePushNotifications = async () => {
    try {

      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                       authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (enabled) {

          onPushPermissionGranted?.();
        } else {

          onPushPermissionDenied?.();
        }
      } else if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {

          onPushPermissionGranted?.();
        } else {

          onPushPermissionDenied?.();
        }
      }

      // Get push token
      const token = await messaging().getToken();
      if (token) {

      }
    } catch (error) {
      
      onPushPermissionDenied?.();
    }
  };

  // Handle notification press
  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read automatically
    if (notification.status === 'PENDING') {
      markAsRead([notification.id]);
    }
    
    // Call custom handler
    onNotificationPress?.(notification);
  }, [markAsRead, onNotificationPress]);

  // Handle toast press
  const handleToastPress = useCallback((notification: Notification) => {
    hideToast(notification.id);
    handleNotificationPress(notification);
  }, [hideToast, handleNotificationPress]);

  // Handle toast dismiss
  const handleToastDismiss = useCallback((toastId: string) => {
    hideToast(toastId);
  }, [hideToast]);

  // Test notification system
  const handleTestNotification = useCallback(() => {
    testNotificationSystem();
  }, [testNotificationSystem]);

  // Sync with backend
  const handleSyncWithBackend = useCallback(async () => {
    try {
      await syncWithBackend();
      Alert.alert('Success', 'Notifications synced with backend');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync with backend');
    }
  }, [syncWithBackend]);

  // Cleanup old notifications
  const handleCleanupOldNotifications = useCallback(async () => {
    try {
      await cleanupOldNotifications();
      Alert.alert('Success', 'Old notifications cleaned up');
    } catch (error) {
      Alert.alert('Error', 'Failed to cleanup old notifications');
    }
  }, [cleanupOldNotifications]);

  // Get notification stats
  const handleGetStats = useCallback(async () => {
    try {
      const stats = await getNotificationStats();
      Alert.alert(
        'Notification Stats',
        `Total: ${stats.total}\nUnread: ${stats.unread}\nRead: ${stats.read}\nArchived: ${stats.archived}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get notification stats');
    }
  }, [getNotificationStats]);

  // Create test notification
  const handleCreateTestNotification = useCallback(async () => {
    try {
      const testNotification = {
        type: 'CUSTOM_NOTIFICATION' as const,
        title: 'Test Notification',
        message: 'This is a test notification from the advanced system',
        priority: 'NORMAL' as const,
        recipients: [],
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      };

      await createNotification(testNotification, {
        showToast: true,
        syncWithBackend: true
      });

      Alert.alert('Success', 'Test notification created');
    } catch (error) {
      Alert.alert('Error', 'Failed to create test notification');
    }
  }, [createNotification]);

  // Bulk operations
  const handleBulkMarkAsRead = useCallback(async () => {
    if (hasSelection) {
      await bulkMarkAsRead();
      Alert.alert('Success', `${selectedNotifications.length} notifications marked as read`);
    } else {
      Alert.alert('Info', 'No notifications selected');
    }
  }, [hasSelection, selectedNotifications.length, bulkMarkAsRead]);

  const handleBulkMarkAsArchived = useCallback(async () => {
    if (hasSelection) {
      await bulkMarkAsArchived();
      Alert.alert('Success', `${selectedNotifications.length} notifications archived`);
    } else {
      Alert.alert('Info', 'No notifications selected');
    }
  }, [hasSelection, selectedNotifications.length, bulkMarkAsArchived]);

  const handleBulkDelete = useCallback(async () => {
    if (hasSelection) {
      Alert.alert(
        'Confirm Delete',
        `Are you sure you want to delete ${selectedNotifications.length} notifications?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await bulkDelete();
              Alert.alert('Success', `${selectedNotifications.length} notifications deleted`);
            }
          }
        ]
      );
    } else {
      Alert.alert('Info', 'No notifications selected');
    }
  }, [hasSelection, selectedNotifications.length, bulkDelete]);

  // Advanced settings
  const handleAdvancedSettings = useCallback(() => {
    setShowAdvancedSettings(!showAdvancedSettings);
  }, [showAdvancedSettings]);

  return (
    <View style={styles.container}>
      {/* Notification Badge */}
      {showBadge && (
        <NotificationBadge
          onPress={() => setShowNotificationCenter(true)}
          size="medium"
          showCount={true}
          animated={true}
        />
      )}

      {/* Notification Center */}
      {showCenter && (
        <NotificationCenter
          visible={showNotificationCenter}
          onClose={() => setShowNotificationCenter(false)}
          onNotificationPress={handleNotificationPress}
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          isConnected={isConnected}
          selectedNotifications={selectedNotifications}
          hasSelection={hasSelection}
          onSelectNotification={selectNotification}
          onDeselectNotification={deselectNotification}
          onSelectAll={selectAllNotifications}
          onClearSelection={clearSelection}
          onMarkAsRead={markAsRead}
          onMarkAsArchived={markAsArchived}
          onDelete={deleteNotifications}
          onBulkMarkAsRead={handleBulkMarkAsRead}
          onBulkMarkAsArchived={handleBulkMarkAsArchived}
          onBulkDelete={handleBulkDelete}
          onRefresh={refreshNotifications}
          onSync={handleSyncWithBackend}
          onCleanup={handleCleanupOldNotifications}
          onGetStats={handleGetStats}
          onTest={handleTestNotification}
          onCreateTest={handleCreateTestNotification}
          onShowPreferences={() => setShowPreferencesModal(true)}
          onShowFilters={() => setShowFiltersModal(true)}
          getNotificationIcon={getNotificationIcon}
          getNotificationColor={getNotificationColor}
          formatNotificationTime={formatNotificationTime}
        />
      )}

      {/* Notification Preferences */}
      {showPreferences && (
        <NotificationPreferences
          visible={showPreferencesModal}
          onClose={() => setShowPreferencesModal(false)}
          preferences={preferences}
          onUpdatePreferences={updatePreferences}
          quietHours={quietHours}
        />
      )}

      {/* Notification Filters */}
      {showFilters && (
        <NotificationFiltersModal
          visible={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          filters={filters}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          searchQuery={searchQuery}
          onSearch={searchNotifications}
        />
      )}

      {/* Notification Toasts */}
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast.notification}
          onPress={handleToastPress}
          onDismiss={() => handleToastDismiss(toast.id)}
          position="top"
          duration={5000}
        />
      ))}

      {/* Advanced Settings Panel */}
      {showAdvancedSettings && (
        <View style={styles.advancedSettings}>
          <Text style={styles.advancedSettingsTitle}>Advanced Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Connection Status:</Text>
            <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.statusText}>{isConnected ? 'Connected' : 'Disconnected'}</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Token:</Text>
            <Text style={styles.settingValue} numberOfLines={1}>
              {pushToken ? `${pushToken.substring(0, 20)}...` : 'Not available'}
            </Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Initialized:</Text>
            <Text style={styles.settingValue}>{isInitialized ? 'Yes' : 'No'}</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Unread Count:</Text>
            <Text style={styles.settingValue}>{unreadCount}</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Total Notifications:</Text>
            <Text style={styles.settingValue}>{notifications.length}</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Active Toasts:</Text>
            <Text style={styles.settingValue}>{toasts.length}</Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSyncWithBackend}
            >
              <MaterialIcons name="sync" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Sync</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCleanupOldNotifications}
            >
              <MaterialIcons name="cleaning-services" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Cleanup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleGetStats}
            >
              <MaterialIcons name="analytics" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Stats</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTestNotification}
            >
              <MaterialIcons name="notifications" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Test</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCreateTestNotification}
            >
              <MaterialIcons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Create</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={clearAllToasts}
            >
              <MaterialIcons name="clear-all" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Clear Toasts</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Connection Status Indicator */}
      {!isConnected && (
        <View style={styles.connectionStatus}>
          <MaterialIcons name="wifi-off" size={16} color="#EF4444" />
          <Text style={styles.connectionText}>Offline</Text>
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingSpinner}>
            <MaterialIcons name="refresh" size={24} color="#3B82F6" />
          </View>
        </View>
      )}

      {/* Advanced Settings Toggle */}
      <TouchableOpacity
        style={styles.advancedToggle}
        onPress={handleAdvancedSettings}
      >
        <MaterialIcons 
          name={showAdvancedSettings ? "expand-less" : "expand-more"} 
          size={24} 
          color="#6B7280" 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  advancedSettings: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  advancedSettingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  connectionText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  advancedToggle: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AdvancedNotificationSystem; 
