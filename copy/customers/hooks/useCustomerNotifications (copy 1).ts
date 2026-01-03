import { useState, useCallback } from 'react';
import { customerNotificationsApi } from '../../../services/api/client';

const useCustomerNotifications = (customerId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<any | null>(null);

  // Get notifications
  const getNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerNotificationsApi.getNotifications();
      setNotifications(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notifications as read
  const markNotificationsAsRead = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerNotificationsApi.markNotificationsAsRead(data);
      await getNotifications();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to mark notifications as read');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getNotifications]);

  // Update notification settings
  const updateNotificationSettings = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerNotificationsApi.updateNotificationSettings(data);
      await getNotificationSettings();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to update notification settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get notification settings
  const getNotificationSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerNotificationsApi.getNotificationSettings();
      setSettings(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notification settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Test notification
  const testNotification = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerNotificationsApi.testNotification(data);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to test notification');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    notifications,
    settings,
    getNotifications,
    markNotificationsAsRead,
    updateNotificationSettings,
    getNotificationSettings,
    testNotification,
  };
};

export default useCustomerNotifications; 
