import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
// Web-only: remove react-native imports

// Import types
import {
  Notification,
  NotificationFilters,
  NotificationStats,
  NotificationPreferences,
  NotificationBadge,
  NotificationToast
} from '../types/notifications';

// Conditional imports for mobile-only features
let messaging: any = null; // not available on web

// Fallback notification service when the main service is not available
const createFallbackNotificationService = () => ({
  initialize: async (token: string) => {

    return Promise.resolve();
  },
  disconnect: () => {
  },
  getNotifications: async (filters?: any) => {
    return { data: [] };
  },
  markNotificationsAsRead: async (ids: string[]) => {
    return Promise.resolve();
  },
  markNotificationsAsArchived: async (ids: string[]) => {
    return Promise.resolve();
  },
  deleteNotifications: async (ids: string[]) => {
    return Promise.resolve();
  },
  createNotification: async (notification: any) => {
    return Promise.resolve();
  },
  getPreferences: async () => {
    return {
      email: true,
      push: true,
      sms: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  },
  updatePreferences: async (preferences: any) => {
    return Promise.resolve();
  },
  getNotificationStats: async (period?: string) => {
    return {
      total: 0,
      unread: 0,
      read: 0,
      archived: 0
    };
  }
});

// Try to import the notification service, fallback if not available
let notificationService: any = null;
// Web: avoid require; use dynamic import guarded by existence
notificationService = createFallbackNotificationService();

// Defensive wrapper for notificationService
const safeNotificationService = {
  initialize: async (token: string) => {
    try {
      if (notificationService && typeof notificationService.initialize === 'function') {
        return await notificationService.initialize(token);
      } else {
        console.warn('Notification service not available or initialize method not found');
        return Promise.resolve();
      }
    } catch (error) {
      console.warn('Notification service initialize failed:', error);
      return Promise.resolve();
    }
  },
  disconnect: () => {
    try {
      if (notificationService && typeof notificationService.disconnect === 'function') {
        notificationService.disconnect();
      }
    } catch (error) {
      console.warn('Notification service disconnect failed:', error);
    }
  },
  getNotifications: async (filters?: any) => {
    try {
      if (notificationService && typeof notificationService.getNotifications === 'function') {
        return await notificationService.getNotifications(filters);
      } else {
        console.warn('Notification service not available or getNotifications method not found');
        return { data: [] };
      }
    } catch (error) {
      console.warn('Get notifications failed:', error);
      return { data: [] };
    }
  },
  markNotificationsAsRead: async (ids: string[]) => {
    try {
      if (notificationService && typeof notificationService.markNotificationsAsRead === 'function') {
        return await notificationService.markNotificationsAsRead(ids);
      }
    } catch (error) {
      console.warn('Mark as read failed:', error);
    }
  },
  markNotificationsAsArchived: async (ids: string[]) => {
    try {
      if (notificationService && typeof notificationService.markNotificationsAsArchived === 'function') {
        return await notificationService.markNotificationsAsArchived(ids);
      }
    } catch (error) {
      console.warn('Mark as archived failed:', error);
    }
  },
  deleteNotifications: async (ids: string[]) => {
    try {
      if (notificationService && typeof notificationService.deleteNotifications === 'function') {
        return await notificationService.deleteNotifications(ids);
      }
    } catch (error) {
      console.warn('Delete notifications failed:', error);
    }
  },
  createNotification: async (notification: any) => {
    try {
      if (notificationService && typeof notificationService.createNotification === 'function') {
        return await notificationService.createNotification(notification);
      }
    } catch (error) {
      console.warn('Create notification failed:', error);
    }
  },
  getPreferences: async () => {
    try {
      if (notificationService && typeof notificationService.getPreferences === 'function') {
        return await notificationService.getPreferences();
      } else {
        console.warn('Notification service not available or getPreferences method not found');
        return {
          email: true,
          push: true,
          sms: false,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        };
      }
    } catch (error) {
      console.warn('Get preferences failed:', error);
      return {
        email: true,
        push: true,
        sms: false,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      };
    }
  },
  updatePreferences: async (preferences: any) => {
    try {
      if (notificationService && typeof notificationService.updatePreferences === 'function') {
        return await notificationService.updatePreferences(preferences);
      }
    } catch (error) {
      console.warn('Update preferences failed:', error);
    }
  },
  getNotificationStats: async (period?: string) => {
    try {
      if (notificationService && typeof notificationService.getNotificationStats === 'function') {
        return await notificationService.getNotificationStats(period);
      } else {
        console.warn('Notification service not available or getNotificationStats method not found');
        return {
          total: 0,
          unread: 0,
          read: 0,
          archived: 0,
          byType: {} as Record<string, number>,
          byPriority: { URGENT: 0, HIGH: 0, NORMAL: 0, LOW: 0 }
        };
      }
    } catch (error) {
      console.warn('Get stats failed:', error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        archived: 0,
        byType: {} as Record<string, number>,
        byPriority: { URGENT: 0, HIGH: 0, NORMAL: 0, LOW: 0 }
      };
    }
  }
};

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  preferences: NotificationPreferences | null;
  isConnected: boolean;
  isLoading: boolean;
  toasts: NotificationToast[];
  isInitialized: boolean;
  pushToken: string | null;
  
  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAsArchived: (notificationIds: string[]) => Promise<void>;
  deleteNotifications: (notificationIds: string[]) => Promise<void>;
  createNotification: (notification: any) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  showToast: (notification: Notification) => void;
  hideToast: (toastId: string) => void;
  clearAllToasts: () => void;
  
  // Real-time
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
  
  // Push notifications
  requestPushPermissions: () => Promise<boolean>;
  getPushToken: () => string | null;
  
  // Utilities
  getNotificationIcon: (type: string) => string;
  getNotificationColor: (priority: string) => string;
  formatNotificationTime: (dateString: string) => string;
  
  // Advanced features
  syncWithBackend: () => Promise<void>;
  cleanupOldNotifications: () => Promise<void>;
  getNotificationStats: (period?: string) => Promise<NotificationStats>;
  testPushNotification: () => void;
}

interface NotificationProviderProps {
  children: React.ReactNode;
  autoInitialize?: boolean;
  showToasts?: boolean;
  enablePushNotifications?: boolean;
  enableWebSocket?: boolean;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children,
  autoInitialize = false, // Temporarily disable auto-initialization
  showToasts = true,
  enablePushNotifications = false, // Temporarily disable push notifications
  enableWebSocket = false, // Temporarily disable WebSocket
  quietHours = {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
}) => {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  
  // Refs
  const appState = useRef<'active'|'inactive'|'background'>('active');
  const toastCounter = useRef(0);
  const autoHideTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize notification service
  useEffect(() => {
    if (autoInitialize) {
      // Temporarily disable notification service initialization
      // initializeNotificationService();
    }
  }, [autoInitialize]);

  const fetchStats = async () => {
    try {
      // Fetch notification statistics from backend
      const response = await safeNotificationService.getNotificationStats();
      setStats(response);
    } catch (error) {
      console.warn('Failed to fetch stats:', error);
    }
  };

  const initializeNotificationService = async () => {
    try {
      setIsLoading(true);

      // Request push permissions if enabled
      if (enablePushNotifications) {
        const hasPermission = await requestPushPermissions();
        if (hasPermission) {

        }
      }

      // Get auth token (you'll need to implement this based on your auth system)
      const token = await getAuthToken();
      if (!token) {
        console.warn('No auth token available for notifications');
        return;
      }

      // Initialize notification service using safe wrapper
      await safeNotificationService.initialize(token);
      
      // Load preferences first
      const prefs = await safeNotificationService.getPreferences();
      setPreferences(prefs);
      
      // Initialize WebSocket if enabled (web-only: skipped)
      if (enableWebSocket) {
        console.log('WebSocket initialization skipped on web platform');
      }
      
      // Load initial data
      await Promise.all([
        fetchNotifications(),
        fetchStats(),
        updateBadgeCount()
      ]);

      // Setup periodic sync
      setupPeriodicSync();
      
      // Setup automatic cleanup
      setupAutomaticCleanup();

      setIsInitialized(true);

    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const initializeWebSocket = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        // Web-only build: WebSocket initialization skipped
        console.log('WebSocket initialization skipped on web platform');
        setupWebSocketListeners();
      }
    } catch (error) {
      
    }
  };

  const setupWebSocketListeners = () => {
    try {
      // Web-only build: WebSocket listeners not available
      console.log('WebSocket setup skipped on web platform');
    } catch (error) {
      console.warn('Error setting up WebSocket listeners:', error);
    }
  };

  const handleAppStateChange = (nextAppState: 'active' | 'inactive' | 'background') => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      refreshNotifications();
    }
    appState.current = nextAppState;
  };

  const setupPeriodicSync = () => {
    if (syncInterval.current) {
      clearInterval(syncInterval.current);
    }
    syncInterval.current = setInterval(() => {
      syncWithBackend();
    }, 30000); // Sync every 30 seconds
  };

  const setupAutomaticCleanup = () => {
    if (cleanupInterval.current) {
      clearInterval(cleanupInterval.current);
    }
    cleanupInterval.current = setInterval(() => {
      cleanupOldNotifications();
    }, 300000); // Cleanup every 5 minutes
  };

  const cleanup = () => {
    try {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
      // Use safe wrapper for disconnect
      safeNotificationService.disconnect();
    } catch (error) {
      console.warn('Error during notification cleanup:', error);
    }
  };

  // Request push notification permissions
  const requestPushPermissions = async (): Promise<boolean> => {
    // Web: push permissions are not used; avoid unreachable code
    return false;
  };

  // Handle new notification
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Update unread count
    if (notification.status === 'PENDING') {
      setUnreadCount(prev => prev + 1);
    }
    
    // Show toast if enabled and not in quiet hours
    if (showToasts && !isInQuietHours()) {
      showToast(notification);
    }
  }, [showToasts]);

  // Handle updated notification
  const handleUpdatedNotification = useCallback((notification: Notification) => {
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? notification : n)
    );
  }, []);

  // Handle deleted notification
  const handleDeletedNotification = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  }, []);

  // Handle push notification action
  const handlePushNotificationAction = useCallback((data: any) => {
    const { action, notificationId } = data;
    
    switch (action) {
      case 'mark_read':
        markAsRead([notificationId]);
        break;
      case 'view':
        // Navigate to notification details
        break;
      default:

    }
  }, []);

  // Check if in quiet hours
  const isInQuietHours = (): boolean => {
    if (!quietHours.enabled) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(quietHours.start.split(':')[0]);
    const endHour = parseInt(quietHours.end.split(':')[0]);
    
    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Quiet hours span midnight
      return currentHour >= startHour || currentHour < endHour;
    }
  };

  // Toast management
  const showToast = useCallback((notification: Notification) => {
    const toastId = `toast_${toastCounter.current++}`;
    const newToast: NotificationToast = {
      id: toastId,
      notification,
      visible: true,
      autoHide: true
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      hideToast(toastId);
    }, 5000);

    autoHideTimers.current.set(toastId, timer);
  }, []);

  const hideToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
    
    const timer = autoHideTimers.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      autoHideTimers.current.delete(toastId);
    }
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
    autoHideTimers.current.forEach(timer => clearTimeout(timer));
    autoHideTimers.current.clear();
  }, []);

  // API Methods
  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    try {
      setIsLoading(true);
      const response = await safeNotificationService.getNotifications(filters);
      setNotifications(response.data);
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      await fetchNotifications();
      await fetchStats();
    } catch (error) {
      console.warn('Refresh notifications failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotifications, fetchStats]);

  const updateBadgeCount = useCallback(async () => {
    try {
      const response = await safeNotificationService.getNotificationStats();
      if (response && response.unread !== undefined) {
        const totalUnread = response.unread;
        // Update badge count on mobile platforms if available
        if (typeof window !== 'undefined' && 'navigator' in window) {
          try {
            // Web-only build: skip mobile badge functionality
            console.log('Badge count update skipped on web platform');
          } catch (error) {
            console.warn('Failed to update badge count:', error);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to update badge count:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await safeNotificationService.markNotificationsAsRead(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) 
            ? { ...n, status: 'READ', readAt: new Date().toISOString() }
            : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      
    }
  }, []);

  const markAsArchived = useCallback(async (notificationIds: string[]) => {
    try {
      await safeNotificationService.markNotificationsAsArchived(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) 
            ? { ...n, status: 'ARCHIVED', archivedAt: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      
    }
  }, []);

  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      await safeNotificationService.deleteNotifications(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.filter(n => !notificationIds.includes(n.id))
      );
      
      // Update unread count
      setUnreadCount(prev => {
        const deletedUnread = notifications.filter(n => 
          notificationIds.includes(n.id) && n.status === 'PENDING'
        ).length;
        return Math.max(0, prev - deletedUnread);
      });
    } catch (error) {
      
    }
  }, [notifications]);

  const createNotification = useCallback(async (notification: any) => {
    try {
      const newNotification = await safeNotificationService.createNotification(notification);
      setNotifications(prev => [newNotification, ...prev]);
      
      if (newNotification.status === 'PENDING') {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      
    }
  }, []);

  const updatePreferences = useCallback(async (preferences: Partial<NotificationPreferences>) => {
    try {
      await safeNotificationService.updatePreferences(preferences);
      setPreferences(prev => prev ? { ...prev, ...preferences } : null);
    } catch (error) {
      
    }
  }, []);

  // Subscription management
  const subscribeToNotifications = () => {
    try {
      // Web-only build: Event subscription not available
      console.log('Event subscription skipped on web platform');
    } catch (error) {
      console.warn('Error subscribing to notifications:', error);
    }
  };

  const unsubscribeFromNotifications = () => {
    try {
      // Web-only build: Event unsubscription not available
      console.log('Event unsubscription skipped on web platform');
    } catch (error) {
      console.warn('Error unsubscribing from notifications:', error);
    }
  };

  // Advanced features
  const syncWithBackend = useCallback(async () => {
    try {
      await fetchNotifications();
      await fetchStats();
      await updateBadgeCount();
    } catch (error) {
      
    }
  }, [fetchNotifications]);

  const cleanupOldNotifications = useCallback(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const oldNotifications = notifications.filter(n => 
        new Date(n.createdAt) < thirtyDaysAgo
      );
      
      if (oldNotifications.length > 0) {
        const oldIds = oldNotifications.map(n => n.id);
        await deleteNotifications(oldIds);

      }
    } catch (error) {
      
    }
  }, [notifications, deleteNotifications]);

  const getNotificationStats = useCallback(async (period: string = '30d') => {
    try {
      const stats = await safeNotificationService.getNotificationStats(period);
      setStats(stats);
      return stats;
    } catch (error) {
      
      throw error;
    }
  }, []);

  const testPushNotification = useCallback(() => {
    const testNotification: Notification = {
      id: `test_${Date.now()}`,
      type: 'CUSTOM_NOTIFICATION',
      title: 'Test Notification',
      message: 'This is a test push notification',
      priority: 'NORMAL',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    showToast(testNotification);
  }, [showToast]);

  // Utility functions
  const getNotificationIcon = useCallback((type: string): string => {
    const iconMap: Record<string, string> = {
      'STUDENT_CREATED': 'person-add',
      'STUDENT_UPDATED': 'person',
      'STUDENT_DELETED': 'person-remove',
      'PAYMENT_RECEIVED': 'payment',
      'PAYMENT_FAILED': 'error',
      'PAYMENT_PENDING': 'schedule',
      'EXAM_SCHEDULED': 'event',
      'EXAM_RESULTS': 'assessment',
      'ATTENDANCE_MARKED': 'check-circle',
      'SYSTEM_UPDATE': 'system-update',
      'MAINTENANCE_NOTICE': 'build',
      'CUSTOM_NOTIFICATION': 'notifications'
    };
    
    return iconMap[type] || 'notifications';
  }, []);

  const getNotificationColor = useCallback((priority: string): string => {
    const colorMap: Record<string, string> = {
      'URGENT': '#EF4444',
      'HIGH': '#F59E0B',
      'NORMAL': '#3B82F6',
      'LOW': '#6B7280'
    };
    
    return colorMap[priority] || '#3B82F6';
  }, []);

  const formatNotificationTime = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  }, []);

  // Helper functions
  const getAuthToken = async (): Promise<string | null> => {
    // Implement based on your auth system
    return 'mock-token';
  };

  const contextValue: NotificationContextType = {
    // State
    notifications: [],
    unreadCount: 0,
    stats: null,
    preferences: null,
    isConnected: false,
    isLoading: false,
    toasts: [],
    isInitialized: false,
    pushToken: null,
    
    // Actions - simplified implementations
    fetchNotifications: async () => {
      // ');
    },
    refreshNotifications: async () => {
      // ');
    },
    markAsRead: async () => {
      // ');
    },
    markAsArchived: async () => {
      // ');
    },
    deleteNotifications: async () => {
      // ');
    },
    createNotification: async () => {
      // ');
    },
    updatePreferences: async () => {
      // ');
    },
    showToast: () => {
      // ');
    },
    hideToast: () => {
      // ');
    },
    clearAllToasts: () => {
      // ');
    },
    
    // Real-time
    subscribeToNotifications: () => {
      // ');
    },
    unsubscribeFromNotifications: () => {
      // ');
    },
    
    // Push notifications
    requestPushPermissions: async () => {
      // ');
      return false;
    },
    getPushToken: () => {
      // ');
      return null;
    },
    
    // Utilities
    getNotificationIcon: () => 'notifications',
    getNotificationColor: () => '#6366f1',
    formatNotificationTime: () => 'now',
    
    // Advanced features
    syncWithBackend: async () => {
  
    },
    cleanupOldNotifications: async () => {
      // ');
    },
    getNotificationStats: async () => {
      return {
        total: 0,
        unread: 0,
        read: 0,
        archived: 0,
        byType: {} as Record<string, number>,
        byPriority: { URGENT: 0, HIGH: 0, NORMAL: 0, LOW: 0 }
      };
    },
    testPushNotification: () => {
      // ');
    }
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}; 
