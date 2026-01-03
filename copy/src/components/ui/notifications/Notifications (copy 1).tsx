import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../../contexts/NotificationContext';
import { useNotificationSystem } from '../../../hooks/useNotificationSystem';
import NotificationBadge from './NotificationBadge';
import NotificationCenter from './NotificationCenter';
import NotificationPreferences from './NotificationPreferences';
import NotificationToast from './NotificationToast';
import { Notification } from '../../../types/notifications';

interface NotificationsProps {
  showBadge?: boolean;
  showCenter?: boolean;
  showPreferences?: boolean;
  onNotificationPress?: (notification: Notification) => void;
}

const Notifications: React.FC<NotificationsProps> = ({
  showBadge = true,
  showCenter = true,
  showPreferences = true,
  onNotificationPress
}) => {
  const {
    notifications,
    unreadCount,
    stats,
    isConnected,
    isLoading,
    toasts,
    hideToast,
    clearAllToasts,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    markAsRead,
    markAsArchived,
    deleteNotifications,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime
  } = useNotifications();

  const {
    selectedNotifications,
    hasSelection,
    selectNotification,
    deselectNotification,
    selectAllNotifications,
    clearSelection,
    bulkMarkAsRead,
    bulkMarkAsArchived,
    bulkDelete
  } = useNotificationSystem({
    autoSubscribe: true,
    showToasts: true,
    onNotificationPress
  });

  // Helper functions for notification rendering
  const getPriorityColor = (priority: string): string => {
    const colorMap: Record<string, string> = {
      'URGENT': '#EF4444',
      'HIGH': '#F59E0B',
      'NORMAL': '#3B82F6',
      'LOW': '#6B7280'
    };
    return colorMap[priority] || '#3B82F6';
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'PENDING': '#3B82F6',
      'READ': '#9CA3AF',
      'ARCHIVED': '#6B7280'
    };
    return colorMap[status] || '#9CA3AF';
  };

  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  useEffect(() => {
    // Subscribe to notifications when component mounts
    subscribeToNotifications();

    return () => {
      // Unsubscribe when component unmounts
      unsubscribeFromNotifications();
    };
  }, []);

  const handleNotificationPress = (notification: Notification) => {
    onNotificationPress?.(notification);
  };

  const handleToastAction = (action: any) => {
    // Handle toast action

  };

  const handleOpenNotificationCenter = () => {
    setShowNotificationCenter(true);
  };

  const handleOpenPreferences = () => {
    setShowPreferencesModal(true);
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.status === 'PENDING' ? '#E0E7FF' : '#FFFFFF',
          borderLeftColor: getPriorityColor(item.priority)
        }
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationLeft}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={getNotificationIcon(item.type)}
            size={24}
            color={getPriorityColor(item.priority)}
          />
          {item.status === 'PENDING' && (
            <View style={styles.unreadIndicator} />
          )}
        </View>
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: item.status === 'PENDING' ? '#111827' : '#6B7280' }]}>
          {item.title}
        </Text>
        <Text style={[styles.notificationMessage, { color: item.status === 'PENDING' ? '#374151' : '#9CA3AF' }]}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatNotificationTime(item.createdAt)}
        </Text>
      </View>
      
      <View style={styles.notificationRight}>
        <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Notification Badge */}
      {showBadge && (
        <NotificationBadge
          onPress={handleOpenNotificationCenter}
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
          selectedNotifications={Array.from(selectedNotifications)}
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
          onRefresh={() => {}}
          onSync={() => {}}
          onCleanup={() => {}}
          onGetStats={() => {}}
          onTest={() => {}}
          onCreateTest={() => {}}
          onShowPreferences={() => setShowPreferencesModal(true)}
          onShowFilters={() => {}}
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
        />
      )}

      {/* Notification Toasts */}
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast.notification}
          onPress={handleNotificationPress}
          onDismiss={() => hideToast(toast.id)}
          onAction={handleToastAction}
          position="top"
          duration={5000}
        />
      ))}

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationLeft: {
    marginRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notificationRight: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  priorityIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  statusIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  connectionStatus: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default Notifications;
