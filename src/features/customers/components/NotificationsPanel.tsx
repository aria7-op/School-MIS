import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, useTheme, Button, IconButton, Chip, ActivityIndicator, Switch, List } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerNotifications from '../hooks/useCustomerNotifications';

const NotificationsPanel: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  
  const {
    loading: notificationsLoading,
    error,
    notifications,
    settings,
    getNotifications,
    markNotificationsAsRead,
    updateNotificationSettings,
    getNotificationSettings,
    testNotification,
  } = useCustomerNotifications();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        getNotifications(),
        getNotificationSettings(),
      ]);
    } catch (error) {
      
    }
  };

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      await markNotificationsAsRead(notificationIds);
      Alert.alert('Success', 'Notifications marked as read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const handleTestNotification = async () => {
    try {
      await testNotification({ type: 'test', message: 'Test notification' });
      Alert.alert('Success', 'Test notification sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      await updateNotificationSettings(newSettings);
      Alert.alert('Success', 'Notification settings updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  if (notificationsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">Notifications</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manage customer notifications and alerts
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.content}>
        {/* Settings Section */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Notification Settings
            </Text>
            
            <List.Item
              title="Email Notifications"
              description="Receive notifications via email"
              right={() => <Switch value={settings?.emailEnabled || false} onValueChange={() => {}} />}
            />
            
            <List.Item
              title="SMS Notifications"
              description="Receive notifications via SMS"
              right={() => <Switch value={settings?.smsEnabled || false} onValueChange={() => {}} />}
            />
            
            <List.Item
              title="Push Notifications"
              description="Receive push notifications"
              right={() => <Switch value={settings?.pushEnabled || false} onValueChange={() => {}} />}
            />
            
            <Button mode="outlined" onPress={handleTestNotification} style={styles.testButton}>
              Test Notification
            </Button>
          </Card.Content>
        </Card>

        {/* Notifications List */}
        <Card style={styles.notificationsCard}>
          <Card.Content>
            <View style={styles.notificationsHeader}>
              <Text variant="titleMedium">Recent Notifications</Text>
              {notifications.length > 0 && (
                <Button onPress={() => handleMarkAsRead(notifications.map(n => n.id))}>
                  Mark All Read
                </Button>
              )}
            </View>
            
            {notifications.length === 0 ? (
              <View style={styles.emptyContent}>
                <MaterialIcons name="notifications-none" size={64} color={theme.colors.outline} />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No notifications
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  You're all caught up!
                </Text>
              </View>
            ) : (
              <View style={styles.notificationsList}>
                {notifications.map((notification) => (
                  <Card key={notification.id} style={styles.notificationCard}>
                    <Card.Content>
                      <View style={styles.notificationHeader}>
                        <Text variant="titleSmall">{notification.title}</Text>
                        <Chip mode="outlined" compact>
                          {notification.type}
                        </Chip>
                      </View>
                      <Text variant="bodyMedium">{notification.message}</Text>
                      <Text variant="bodySmall" style={styles.timestamp}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => handleMarkAsRead([notification.id])}>
                        Mark Read
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    elevation: 2,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  settingsCard: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  testButton: {
    marginTop: 16,
  },
  notificationsCard: {
    margin: 16,
    elevation: 2,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notificationsList: {
    gap: 8,
  },
  notificationCard: {
    marginBottom: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: {
    opacity: 0.7,
    marginTop: 8,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationsPanel; 
