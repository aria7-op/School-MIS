import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Notifications,
  NotificationBadge,
  NotificationCenter,
  NotificationPreferences,
  useNotificationSystem,
  notificationService
} from './index';

const NotificationExample: React.FC = () => {
  const [showCenter, setShowCenter] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const {
    notifications,
    unreadCount,
    isConnected,
    createNotification,
    markAsRead,
    deleteNotifications
  } = useNotificationSystem({
    autoSubscribe: true,
    showToasts: true,
    onNotificationPress: (notification) => {
      Alert.alert('Notification Pressed', notification.title);
    }
  });

  const handleCreateTestNotification = async () => {
    try {
      await createNotification({
        type: 'CUSTOM_NOTIFICATION',
        title: 'Test Notification',
        message: 'This is a test notification created at ' + new Date().toLocaleTimeString(),
        priority: 'NORMAL',
        recipients: ['SCHOOL_ADMIN'],
        actions: [
          {
            id: 'view',
            label: 'View Details',
            type: 'PRIMARY',
            url: '/test-details'
          },
          {
            id: 'dismiss',
            label: 'Dismiss',
            type: 'SECONDARY',
            action: 'dismiss'
          }
        ]
      });
      Alert.alert('Success', 'Test notification created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => n.status === 'PENDING')
      .map(n => n.id);
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
      Alert.alert('Success', `Marked ${unreadIds.length} notifications as read`);
    } else {
      Alert.alert('Info', 'No unread notifications to mark');
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length > 0) {
      Alert.alert(
        'Delete All Notifications',
        `Are you sure you want to delete all ${notifications.length} notifications?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const allIds = notifications.map(n => n.id);
              await deleteNotifications(allIds);
              Alert.alert('Success', 'All notifications deleted');
            }
          }
        ]
      );
    } else {
      Alert.alert('Info', 'No notifications to delete');
    }
  };

  const handleTestWebSocket = () => {
    if (isConnected) {
      Alert.alert('WebSocket Status', 'WebSocket is connected and working!');
    } else {
      Alert.alert('WebSocket Status', 'WebSocket is disconnected. Check your connection.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification System Demo</Text>
      
      {/* Status Display */}
      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <MaterialIcons 
            name={isConnected ? 'wifi' : 'wifi-off'} 
            size={20} 
            color={isConnected ? '#10B981' : '#EF4444'} 
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <MaterialIcons name="notifications" size={20} color="#3B82F6" />
          <Text style={styles.statusText}>
            {notifications.length} notifications
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <MaterialIcons name="mark-email-unread" size={20} color="#F59E0B" />
          <Text style={styles.statusText}>
            {unreadCount} unread
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowCenter(true)}
        >
          <MaterialIcons name="notifications" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Open Center</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowPreferences(true)}
        >
          <MaterialIcons name="settings" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCreateTestNotification}
        >
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Create Test</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleMarkAllAsRead}
        >
          <MaterialIcons name="check" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Mark All Read</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleDeleteAll}
        >
          <MaterialIcons name="delete" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Delete All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.infoButton]}
          onPress={handleTestWebSocket}
        >
          <MaterialIcons name="wifi" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Test Connection</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Badge Example */}
      <View style={styles.badgeContainer}>
        <Text style={styles.sectionTitle}>Notification Badge</Text>
        <View style={styles.badgeExamples}>
          <NotificationBadge
            onPress={() => setShowCenter(true)}
            size="small"
            showCount={true}
            animated={true}
          />
          <NotificationBadge
            onPress={() => setShowCenter(true)}
            size="medium"
            showCount={true}
            animated={true}
          />
          <NotificationBadge
            onPress={() => setShowCenter(true)}
            size="large"
            showCount={true}
            animated={true}
          />
        </View>
      </View>

      {/* Recent Notifications Preview */}
      {notifications.length > 0 && (
        <View style={styles.previewContainer}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {notifications.slice(0, 3).map((notification) => (
            <View key={notification.id} style={styles.previewItem}>
              <MaterialIcons
                name="notifications"
                size={16}
                color={notification.status === 'PENDING' ? '#3B82F6' : '#9CA3AF'}
              />
              <Text style={styles.previewText} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.previewTime}>
                {new Date(notification.createdAt).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Modals */}
      <NotificationCenter
        visible={showCenter}
        onClose={() => setShowCenter(false)}
        onNotificationPress={(notification) => {
          Alert.alert('Notification Details', notification.message);
        }}
      />

      <NotificationPreferences
        visible={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#10B981',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  infoButton: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  badgeContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  badgeExamples: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  previewTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default NotificationExample; 
