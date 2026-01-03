import { useState, useEffect, useCallback } from 'react';
import { 
  Notification, 
  NotificationFilters, 
  WebSocketNotificationEvent,
  WebSocketReadEvent,
  WebSocketDeleteEvent,
  WebSocketCountEvent
} from '../types/notification';
import { User, useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';
import websocketService from '../services/websocketService';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  loadNotifications: () => Promise<void>;
  loadMoreNotifications: (limit: number) => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useNotifications = (user: User | null): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { logout } = useAuth();

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No auth token found, skipping WebSocket connection');
        return;
      }

      // console.log('🔌 Connecting to WebSocket for notifications...', { userId: user.id, hasToken: !!token });
      
      // Connect to WebSocket server (through Caddy proxy at /socket.io)
      websocketService.connect(
        'https://khwanzay.school',
        {
          userId: user.id || '',
          schoolId: user.schoolId || '',
          role: user.role || 'TEACHER',
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        },
        {
          onConnect: () => {
            // console.log('✅ WebSocket connected');
            setIsConnected(true);
          },
          onDisconnect: () => {
            // console.log('❌ WebSocket disconnected');
            setIsConnected(false);
          },
          onNotificationNew: (notification: WebSocketNotificationEvent) => {
            // console.log('🔔 New notification received:', notification);
            // Add new notification to the list
            setNotifications(prev => [notification as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification if permission granted
            const BrowserNotification = window.Notification;
            if (BrowserNotification && BrowserNotification.permission === 'granted') {
              new BrowserNotification(notification.title, {
                body: notification.message,
                icon: '/logo.png',
                badge: '/logo.png'
              });
            }
          },
          onNotificationRead: (data: WebSocketReadEvent) => {
            // console.log('📖 Notification marked as read:', data);
            setNotifications(prev =>
              prev.map(n =>
                n.id === data.notificationId ? { ...n, isRead: true } : n
              )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
          },
          onNotificationDeleted: (data: WebSocketDeleteEvent) => {
            // console.log('🗑️ Notification deleted:', data);
            setNotifications(prev =>
              prev.filter(n => n.id !== data.notificationId)
            );
            const deletedNotif = notifications.find(n => n.id === data.notificationId);
            if (deletedNotif && !deletedNotif.isRead) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          },
          onNotificationCount: (data: WebSocketCountEvent) => {
            // console.log('🔢 Notification count updated:', data);
            setUnreadCount(data.count);
          },
          onAuthError: (error) => {
            console.error('❌ WebSocket authentication error detected, logging out user.', error);
            logout().catch((logoutError) => {
              console.error('❌ Failed to logout after WebSocket auth error:', logoutError);
            });
          }
        }
      );

      // Request browser notification permission
      const BrowserNotification = window.Notification;
      if (BrowserNotification && BrowserNotification.permission === 'default') {
        BrowserNotification.requestPermission().then(permission => {
          // console.log('Browser notification permission:', permission);
        });
      }

      // Cleanup on unmount
      return () => {
        websocketService.disconnect();
      };
    }
  }, [user, logout]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // console.log('🔄 Loading notifications...');
      const result = await notificationService.getRealtimeNotifications(20);
      // console.log('✅ Notifications loaded:', result);
      
      if (result.data) {
        setNotifications(result.data);
      } else {
        console.warn('⚠️ No notifications data in response:', result);
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadMoreNotifications = useCallback(async (limit: number) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // console.log('🔄 Loading more notifications with limit:', limit);
      const result = await notificationService.getRealtimeNotifications(limit, 0);
      // console.log('✅ More notifications loaded:', result);
      
      if (result.data) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('❌ Error loading more notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      // console.log('🔄 Loading unread count...');
      const count = await notificationService.getUnreadCount();
      // console.log('✅ Unread count loaded:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('❌ Error loading unread count:', error);
      setUnreadCount(0);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      await notificationService.markSingleNotificationAsRead(notificationId);
      
      // Emit WebSocket event for real-time sync across devices
      websocketService.markNotificationAsRead(notificationId, user.id || '');
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      await notificationService.markNotificationAsRead(unreadIds);
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }, [user, notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Emit WebSocket event for real-time sync across devices
      websocketService.deleteNotification(notificationId, user.id || '');
      
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  }, [user, notifications]);

  const refresh = useCallback(async () => {
    await Promise.all([loadNotifications(), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected, // Now properly reflects WebSocket connection status
    loadNotifications,
    loadMoreNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  };
}; 