import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Switch,
  TextInput,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotificationSystem } from '../../../hooks/useNotificationSystem';
import { Notification, NotificationFilters } from '../../../types/notifications';
import AdvancedNotificationSystem from './AdvancedNotificationSystem';
import NotificationBadge from './NotificationBadge';
import NotificationCenter from './NotificationCenter';
import NotificationToast from './NotificationToast';

const AdvancedNotificationExample: React.FC = () => {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showCreateNotification, setShowCreateNotification] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'CUSTOM_NOTIFICATION' as const,
    priority: 'NORMAL' as const,
    recipients: ''
  });

  // Settings state
  const [settings, setSettings] = useState({
    enablePushNotifications: true,
    enableWebSocket: true,
    showToasts: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

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
    autoSubscribe: true,
    showToasts: settings.showToasts,
    onNotificationPress: handleNotificationPress,
    onPushPermissionGranted: handlePushPermissionGranted,
    onPushPermissionDenied: handlePushPermissionDenied
  });

  // Handle notification press
  function handleNotificationPress(notification: Notification) {
    Alert.alert(
      'Notification Pressed',
      `Title: ${notification.title}\nMessage: ${notification.message}\nType: ${notification.type}`,
      [
        { text: 'Mark as Read', onPress: () => markAsRead([notification.id]) },
        { text: 'Archive', onPress: () => markAsArchived([notification.id]) },
        { text: 'Delete', onPress: () => deleteNotifications([notification.id]) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  // Handle push permission granted
  function handlePushPermissionGranted() {
    Alert.alert('Success', 'Push notifications enabled!');
  }

  // Handle push permission denied
  function handlePushPermissionDenied() {
    Alert.alert('Permission Denied', 'Push notifications are disabled. You can enable them in settings.');
  }

  // Create test notification
  const handleCreateTestNotification = async () => {
    try {
      const testNotification = {
        type: notificationForm.type,
        title: notificationForm.title || 'Test Notification',
        message: notificationForm.message || 'This is a test notification',
        priority: notificationForm.priority,
        recipients: notificationForm.recipients ? notificationForm.recipients.split(',') : [],
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
          createdBy: 'AdvancedNotificationExample'
        }
      };

      await createNotification(testNotification, {
        showToast: true,
        syncWithBackend: true
      });

      Alert.alert('Success', 'Test notification created successfully!');
      setShowCreateNotification(false);
      setNotificationForm({
        title: '',
        message: '',
        type: 'CUSTOM_NOTIFICATION',
        priority: 'NORMAL',
        recipients: ''
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create test notification');
    }
  };

  // Test notification system
  const handleTestNotificationSystem = () => {
    testNotificationSystem();
    Alert.alert('Test', 'Test notification sent!');
  };

  // Sync with backend
  const handleSyncWithBackend = async () => {
    try {
      await syncWithBackend();
      Alert.alert('Success', 'Notifications synced with backend!');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync with backend');
    }
  };

  // Cleanup old notifications
  const handleCleanupOldNotifications = async () => {
    try {
      await cleanupOldNotifications();
      Alert.alert('Success', 'Old notifications cleaned up!');
    } catch (error) {
      Alert.alert('Error', 'Failed to cleanup old notifications');
    }
  };

  // Get notification stats
  const handleGetNotificationStats = async () => {
    try {
      const stats = await getNotificationStats();
      setShowStatsPanel(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to get notification stats');
    }
  };

  // Request push permissions
  const handleRequestPushPermissions = async () => {
    try {
      const granted = await requestPushPermissions();
      if (granted) {
        Alert.alert('Success', 'Push notifications enabled!');
      } else {
        Alert.alert('Permission Denied', 'Push notifications are disabled.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request push permissions');
    }
  };

  // Bulk operations
  const handleBulkMarkAsRead = async () => {
    if (hasSelection) {
      await bulkMarkAsRead();
      Alert.alert('Success', `${selectedNotifications.length} notifications marked as read`);
    } else {
      Alert.alert('Info', 'No notifications selected');
    }
  };

  const handleBulkMarkAsArchived = async () => {
    if (hasSelection) {
      await bulkMarkAsArchived();
      Alert.alert('Success', `${selectedNotifications.length} notifications archived`);
    } else {
      Alert.alert('Info', 'No notifications selected');
    }
  };

  const handleBulkDelete = async () => {
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
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Advanced Notification System</Text>
        <Text style={styles.subtitle}>Comprehensive notification management with real-time updates</Text>
      </View>

      {/* Status Overview */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <MaterialIcons name="notifications" size={24} color="#3B82F6" />
            <Text style={styles.statusLabel}>Total</Text>
            <Text style={styles.statusValue}>{notifications.length}</Text>
          </View>
          <View style={styles.statusItem}>
            <MaterialIcons name="mark-email-unread" size={24} color="#EF4444" />
            <Text style={styles.statusLabel}>Unread</Text>
            <Text style={styles.statusValue}>{unreadCount}</Text>
          </View>
          <View style={styles.statusItem}>
            <MaterialIcons name="wifi" size={24} color={isConnected ? "#10B981" : "#EF4444"} />
            <Text style={styles.statusLabel}>Connection</Text>
            <Text style={styles.statusValue}>{isConnected ? 'Online' : 'Offline'}</Text>
          </View>
          <View style={styles.statusItem}>
            <MaterialIcons name="check-circle" size={24} color={isInitialized ? "#10B981" : "#F59E0B"} />
            <Text style={styles.statusLabel}>Initialized</Text>
            <Text style={styles.statusValue}>{isInitialized ? 'Yes' : 'No'}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowNotificationCenter(true)}
          >
            <MaterialIcons name="notifications" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Open Center</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRequestPushPermissions}
          >
            <MaterialIcons name="notifications-active" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Enable Push</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTestNotificationSystem}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCreateNotification(true)}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Advanced Features */}
      <View style={styles.advancedSection}>
        <Text style={styles.sectionTitle}>Advanced Features</Text>
        
        <TouchableOpacity
          style={styles.advancedButton}
          onPress={handleSyncWithBackend}
        >
          <MaterialIcons name="sync" size={20} color="#3B82F6" />
          <Text style={styles.advancedButtonText}>Sync with Backend</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.advancedButton}
          onPress={handleCleanupOldNotifications}
        >
          <MaterialIcons name="cleaning-services" size={20} color="#F59E0B" />
          <Text style={styles.advancedButtonText}>Cleanup Old Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.advancedButton}
          onPress={handleGetNotificationStats}
        >
          <MaterialIcons name="analytics" size={20} color="#10B981" />
          <Text style={styles.advancedButtonText}>View Statistics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.advancedButton}
          onPress={() => setShowAdvancedSettings(true)}
        >
          <MaterialIcons name="settings" size={20} color="#6B7280" />
          <Text style={styles.advancedButtonText}>Advanced Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Bulk Operations */}
      {hasSelection && (
        <View style={styles.bulkSection}>
          <Text style={styles.sectionTitle}>Bulk Operations ({selectedNotifications.length} selected)</Text>
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={[styles.bulkButton, styles.readButton]}
              onPress={handleBulkMarkAsRead}
            >
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
              <Text style={styles.bulkButtonText}>Mark as Read</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bulkButton, styles.archiveButton]}
              onPress={handleBulkMarkAsArchived}
            >
              <MaterialIcons name="archive" size={16} color="#FFFFFF" />
              <Text style={styles.bulkButtonText}>Archive</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bulkButton, styles.deleteButton]}
              onPress={handleBulkDelete}
            >
              <MaterialIcons name="delete" size={16} color="#FFFFFF" />
              <Text style={styles.bulkButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Recent Notifications */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Notifications</Text>
        {notifications.slice(0, 5).map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={styles.notificationItem}
            onPress={() => handleNotificationPress(notification)}
          >
            <View style={styles.notificationHeader}>
              <MaterialIcons
                name={getNotificationIcon(notification.type)}
                size={20}
                color={getNotificationColor(notification.priority)}
              />
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationTime}>
                {formatNotificationTime(notification.createdAt)}
              </Text>
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            {notification.status === 'PENDING' && (
              <View style={styles.unreadIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Notification Badge */}
      <NotificationBadge
        onPress={() => setShowNotificationCenter(true)}
        size="large"
        showCount={true}
        animated={true}
      />

      {/* Notification Center */}
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
        onBulkMarkAsRead={bulkMarkAsRead}
        onBulkMarkAsArchived={bulkMarkAsArchived}
        onBulkDelete={bulkDelete}
        onRefresh={refreshNotifications}
        onSync={syncWithBackend}
        onCleanup={cleanupOldNotifications}
        onGetStats={getNotificationStats}
        onTest={testNotificationSystem}
        onCreateTest={handleCreateTestNotification}
        onShowPreferences={() => setShowAdvancedSettings(true)}
        onShowFilters={() => {}}
        getNotificationIcon={getNotificationIcon}
        getNotificationColor={getNotificationColor}
        formatNotificationTime={formatNotificationTime}
      />

      {/* Create Notification Modal */}
      <Modal
        visible={showCreateNotification}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Test Notification</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCreateNotification(false)}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.formInput}
                value={notificationForm.title}
                onChangeText={(text) => setNotificationForm(prev => ({ ...prev, title: text }))}
                placeholder="Enter notification title"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={notificationForm.message}
                onChangeText={(text) => setNotificationForm(prev => ({ ...prev, message: text }))}
                placeholder="Enter notification message"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Type</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={[styles.pickerOption, notificationForm.type === 'CUSTOM_NOTIFICATION' && styles.pickerOptionActive]}
                  onPress={() => setNotificationForm(prev => ({ ...prev, type: 'CUSTOM_NOTIFICATION' }))}
                >
                  <Text style={[styles.pickerOptionText, notificationForm.type === 'CUSTOM_NOTIFICATION' && styles.pickerOptionTextActive]}>
                    Custom
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickerOption, notificationForm.type === 'SYSTEM_UPDATE' && styles.pickerOptionActive]}
                  onPress={() => setNotificationForm(prev => ({ ...prev, type: 'SYSTEM_UPDATE' }))}
                >
                  <Text style={[styles.pickerOptionText, notificationForm.type === 'SYSTEM_UPDATE' && styles.pickerOptionTextActive]}>
                    System
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={[styles.pickerOption, notificationForm.priority === 'LOW' && styles.pickerOptionActive]}
                  onPress={() => setNotificationForm(prev => ({ ...prev, priority: 'LOW' }))}
                >
                  <Text style={[styles.pickerOptionText, notificationForm.priority === 'LOW' && styles.pickerOptionTextActive]}>
                    Low
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickerOption, notificationForm.priority === 'NORMAL' && styles.pickerOptionActive]}
                  onPress={() => setNotificationForm(prev => ({ ...prev, priority: 'NORMAL' }))}
                >
                  <Text style={[styles.pickerOptionText, notificationForm.priority === 'NORMAL' && styles.pickerOptionTextActive]}>
                    Normal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickerOption, notificationForm.priority === 'HIGH' && styles.pickerOptionActive]}
                  onPress={() => setNotificationForm(prev => ({ ...prev, priority: 'HIGH' }))}
                >
                  <Text style={[styles.pickerOptionText, notificationForm.priority === 'HIGH' && styles.pickerOptionTextActive]}>
                    High
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickerOption, notificationForm.priority === 'URGENT' && styles.pickerOptionActive]}
                  onPress={() => setNotificationForm(prev => ({ ...prev, priority: 'URGENT' }))}
                >
                  <Text style={[styles.pickerOptionText, notificationForm.priority === 'URGENT' && styles.pickerOptionTextActive]}>
                    Urgent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Recipients (comma-separated)</Text>
              <TextInput
                style={styles.formInput}
                value={notificationForm.recipients}
                onChangeText={(text) => setNotificationForm(prev => ({ ...prev, recipients: text }))}
                placeholder="user1@example.com, user2@example.com"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateNotification(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateTestNotification}
            >
              <Text style={styles.createButtonText}>Create Notification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Advanced Settings Modal */}
      <Modal
        visible={showAdvancedSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Advanced Settings</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAdvancedSettings(false)}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Enable push notifications for real-time updates</Text>
              </View>
              <Switch
                value={settings.enablePushNotifications}
                onValueChange={(value) => setSettings(prev => ({ ...prev, enablePushNotifications: value }))}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>WebSocket Connection</Text>
                <Text style={styles.settingDescription}>Enable real-time WebSocket connection</Text>
              </View>
              <Switch
                value={settings.enableWebSocket}
                onValueChange={(value) => setSettings(prev => ({ ...prev, enableWebSocket: value }))}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Show Toast Notifications</Text>
                <Text style={styles.settingDescription}>Display in-app toast notifications</Text>
              </View>
              <Switch
                value={settings.showToasts}
                onValueChange={(value) => setSettings(prev => ({ ...prev, showToasts: value }))}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Quiet Hours</Text>
                <Text style={styles.settingDescription}>Enable quiet hours to suppress notifications</Text>
              </View>
              <Switch
                value={settings.quietHours.enabled}
                onValueChange={(value) => setSettings(prev => ({ 
                  ...prev, 
                  quietHours: { ...prev.quietHours, enabled: value }
                }))}
              />
            </View>

            {settings.quietHours.enabled && (
              <View style={styles.quietHoursSettings}>
                <Text style={styles.settingSubLabel}>Quiet Hours Time</Text>
                <View style={styles.timeInputContainer}>
                  <TextInput
                    style={styles.timeInput}
                    value={settings.quietHours.start}
                    onChangeText={(text) => setSettings(prev => ({ 
                      ...prev, 
                      quietHours: { ...prev.quietHours, start: text }
                    }))}
                    placeholder="22:00"
                  />
                  <Text style={styles.timeSeparator}>to</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={settings.quietHours.end}
                    onChangeText={(text) => setSettings(prev => ({ 
                      ...prev, 
                      quietHours: { ...prev.quietHours, end: text }
                    }))}
                    placeholder="08:00"
                  />
                </View>
              </View>
            )}

            <View style={styles.systemInfo}>
              <Text style={styles.systemInfoTitle}>System Information</Text>
              <View style={styles.systemInfoItem}>
                <Text style={styles.systemInfoLabel}>Connection Status:</Text>
                <Text style={[styles.systemInfoValue, { color: isConnected ? '#10B981' : '#EF4444' }]}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
              <View style={styles.systemInfoItem}>
                <Text style={styles.systemInfoLabel}>Initialized:</Text>
                <Text style={styles.systemInfoValue}>{isInitialized ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.systemInfoItem}>
                <Text style={styles.systemInfoLabel}>Push Token:</Text>
                <Text style={styles.systemInfoValue} numberOfLines={1}>
                  {pushToken ? `${pushToken.substring(0, 20)}...` : 'Not available'}
                </Text>
              </View>
              <View style={styles.systemInfoItem}>
                <Text style={styles.systemInfoLabel}>Platform:</Text>
                <Text style={styles.systemInfoValue}>{Platform.OS}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAdvancedSettings(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                updatePreferences(settings);
                setShowAdvancedSettings(false);
              }}
            >
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        visible={showStatsPanel}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notification Statistics</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowStatsPanel(false)}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {stats && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Notifications</Text>
                  <Text style={styles.statValue}>{stats.total}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Unread</Text>
                  <Text style={styles.statValue}>{stats.unread}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Read</Text>
                  <Text style={styles.statValue}>{stats.read}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Archived</Text>
                  <Text style={styles.statValue}>{stats.archived}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast.notification}
          onPress={() => handleNotificationPress(toast.notification)}
          onDismiss={() => hideToast(toast.id)}
          position="top"
          duration={5000}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  actionsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
    minWidth: '45%',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  advancedSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    gap: 12,
  },
  advancedButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  bulkSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
    flex: 1,
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
  bulkButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  recentSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    marginLeft: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 28,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  pickerOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerOptionTextActive: {
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingSubLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  quietHoursSettings: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 14,
    color: '#6B7280',
  },
  systemInfo: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  systemInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  systemInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  systemInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  systemInfoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  statsContainer: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});

export default AdvancedNotificationExample; 
