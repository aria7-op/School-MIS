import { useCallback, useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import {
  Notification,
  NotificationFilters,
  NotificationStats,
  NotificationPreferences,
  NotificationBadge,
  NotificationToast
} from '../types/notifications';

// Main notification system hook
export const useNotificationSystem = (options: {
  autoSubscribe?: boolean;
  showToasts?: boolean;
  onNotificationPress?: (notification: Notification) => void;
  onPushPermissionGranted?: () => void;
  onPushPermissionDenied?: () => void;
} = {}) => {
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
    fetchNotifications,
    markAsRead,
    markAsArchived,
    deleteNotifications,
    createNotification,
    updatePreferences,
    showToast,
    hideToast,
    clearAllToasts,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    requestPushPermissions,
    getPushToken,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime,
    syncWithBackend,
    cleanupOldNotifications,
    getNotificationStats,
    testPushNotification
  } = useNotifications();

  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Auto-subscribe to notifications
  useEffect(() => {
    if (options.autoSubscribe && isInitialized) {
      subscribeToNotifications();
    }

    return () => {
      if (options.autoSubscribe) {
        unsubscribeFromNotifications();
      }
    };
  }, [options.autoSubscribe, isInitialized, subscribeToNotifications, unsubscribeFromNotifications]);

  // Filter notifications based on search query
  const filteredNotifications = useCallback(() => {
    if (!searchQuery) return notifications;

    const query = searchQuery.toLowerCase();
    return notifications.filter(notification =>
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query) ||
      notification.type.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  // Bulk operations
  const selectNotification = useCallback((notificationId: string) => {
    setSelectedNotifications(prev => new Set([...prev, notificationId]));
  }, []);

  const deselectNotification = useCallback((notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  }, []);

  const selectAllNotifications = useCallback(() => {
    setSelectedNotifications(new Set(notifications.map(n => n.id)));
  }, [notifications]);

  const clearSelection = useCallback(() => {
    setSelectedNotifications(new Set());
  }, []);

  const bulkMarkAsRead = useCallback(async () => {
    const selectedIds = Array.from(selectedNotifications);
    if (selectedIds.length > 0) {
      await markAsRead(selectedIds);
      clearSelection();
    }
  }, [selectedNotifications, markAsRead, clearSelection]);

  const bulkMarkAsArchived = useCallback(async () => {
    const selectedIds = Array.from(selectedNotifications);
    if (selectedIds.length > 0) {
      await markAsArchived(selectedIds);
      clearSelection();
    }
  }, [selectedNotifications, markAsArchived, clearSelection]);

  const bulkDelete = useCallback(async () => {
    const selectedIds = Array.from(selectedNotifications);
    if (selectedIds.length > 0) {
      await deleteNotifications(selectedIds);
      clearSelection();
    }
  }, [selectedNotifications, deleteNotifications, clearSelection]);

  // Request push permissions with callbacks
  const requestPushPermissionsWithCallbacks = useCallback(async () => {
    try {
      const granted = await requestPushPermissions();
      if (granted && options.onPushPermissionGranted) {
        options.onPushPermissionGranted();
      } else if (!granted && options.onPushPermissionDenied) {
        options.onPushPermissionDenied();
      }
      return granted;
    } catch (error) {
      
      if (options.onPushPermissionDenied) {
        options.onPushPermissionDenied();
      }
      return false;
    }
  }, [requestPushPermissions, options]);

  // Enhanced notification creation with automatic triggers
  const createNotificationWithTriggers = useCallback(async (
    notification: any,
    triggers?: {
      showToast?: boolean;
      updateBadge?: boolean;
      syncWithBackend?: boolean;
    }
  ) => {
    try {
      const newNotification = await createNotification(notification);
      
      if (triggers?.showToast && options.showToasts) {
        showToast(newNotification);
      }
      
      if (triggers?.syncWithBackend) {
        await syncWithBackend();
      }
      
      return newNotification;
    } catch (error) {
      
      throw error;
    }
  }, [createNotification, showToast, syncWithBackend, options.showToasts]);

  // Advanced filtering
  const applyFilters = useCallback((newFilters: NotificationFilters) => {
    setFilters(newFilters);
    fetchNotifications(newFilters);
  }, [fetchNotifications]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    fetchNotifications();
  }, [fetchNotifications]);

  // Search functionality
  const searchNotifications = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Real-time sync
  const refreshNotifications = useCallback(async () => {
    await syncWithBackend();
  }, [syncWithBackend]);

  // Notification statistics
  const getNotificationStatsForPeriod = useCallback(async (period: string = '30d') => {
    return await getNotificationStats(period);
  }, [getNotificationStats]);

  // Test functionality
  const testNotificationSystem = useCallback(() => {
    testPushNotification();
  }, [testPushNotification]);

  return {
    // State
    notifications: filteredNotifications(),
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
    selectedNotifications: Array.from(selectedNotifications),
    hasSelection: selectedNotifications.size > 0,
    
    // Actions
    fetchNotifications,
    markAsRead,
    markAsArchived,
    deleteNotifications,
    createNotification: createNotificationWithTriggers,
    updatePreferences,
    showToast,
    hideToast,
    clearAllToasts,
    
    // Selection
    selectNotification,
    deselectNotification,
    selectAllNotifications,
    clearSelection,
    
    // Bulk operations
    bulkMarkAsRead,
    bulkMarkAsArchived,
    bulkDelete,
    
    // Push notifications
    requestPushPermissions: requestPushPermissionsWithCallbacks,
    getPushToken,
    
    // Filtering and search
    applyFilters,
    clearFilters,
    searchNotifications,
    
    // Real-time
    subscribeToNotifications,
    unsubscribeFromNotifications,
    refreshNotifications,
    
    // Advanced features
    syncWithBackend,
    cleanupOldNotifications,
    getNotificationStats: getNotificationStatsForPeriod,
    testNotificationSystem,
    
    // Utilities
    getNotificationIcon,
    getNotificationColor,
    formatNotificationTime
  };
};

// Specialized hooks
export const useNotificationBadge = () => {
  const { unreadCount, isConnected, isInitialized } = useNotifications();
  
  return {
    unreadCount,
    isConnected,
    isInitialized,
    hasNotifications: unreadCount > 0,
    isOnline: isConnected
  };
};

export const useNotificationToast = () => {
  const { toasts, showToast, hideToast, clearAllToasts } = useNotifications();
  
  return {
    toasts,
    showToast,
    hideToast,
    clearAllToasts,
    hasToasts: toasts.length > 0
  };
};

export const useNotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAsArchived,
    deleteNotifications,
    fetchNotifications
  } = useNotifications();
  
  return {
    notifications,
    unreadCount,
    isLoading,
    hasUnread: unreadCount > 0,
    markAsRead,
    markAsArchived,
    deleteNotifications,
    fetchNotifications
  };
};

export const useNotificationPreferences = () => {
  const { preferences, updatePreferences } = useNotifications();
  
  return {
    preferences,
    updatePreferences,
    hasPreferences: preferences !== null
  };
};

export const useNotificationStats = () => {
  const { stats, getNotificationStats } = useNotifications();
  
  return {
    stats,
    getNotificationStats,
    hasStats: stats !== null,
    totalNotifications: stats?.total || 0,
    unreadNotifications: stats?.unread || 0,
    readNotifications: stats?.read || 0,
    archivedNotifications: stats?.archived || 0
  };
};

// Advanced hooks for specific use cases
export const useNotificationFilters = () => {
  const [filters, setFilters] = useState<NotificationFilters>({});
  const { fetchNotifications } = useNotifications();
  
  const applyFilters = useCallback((newFilters: NotificationFilters) => {
    setFilters(newFilters);
    fetchNotifications(newFilters);
  }, [fetchNotifications]);
  
  const clearFilters = useCallback(() => {
    setFilters({});
    fetchNotifications();
  }, [fetchNotifications]);
  
  return {
    filters,
    applyFilters,
    clearFilters
  };
};

export const useNotificationSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { notifications } = useNotifications();
  
  const searchResults = useCallback(() => {
    if (!searchQuery) return notifications;
    
    const query = searchQuery.toLowerCase();
    return notifications.filter(notification =>
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query) ||
      notification.type.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);
  
  return {
    searchQuery,
    setSearchQuery,
    searchResults: searchResults(),
    hasSearchQuery: searchQuery.length > 0
  };
};

export const useNotificationBulkOperations = () => {
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const { markAsRead, markAsArchived, deleteNotifications } = useNotifications();
  
  const selectNotification = useCallback((notificationId: string) => {
    setSelectedNotifications(prev => new Set([...prev, notificationId]));
  }, []);
  
  const deselectNotification = useCallback((notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  }, []);
  
  const selectAll = useCallback((notifications: Notification[]) => {
    setSelectedNotifications(new Set(notifications.map(n => n.id)));
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedNotifications(new Set());
  }, []);
  
  const bulkMarkAsRead = useCallback(async () => {
    const selectedIds = Array.from(selectedNotifications);
    if (selectedIds.length > 0) {
      await markAsRead(selectedIds);
      clearSelection();
    }
  }, [selectedNotifications, markAsRead, clearSelection]);
  
  const bulkMarkAsArchived = useCallback(async () => {
    const selectedIds = Array.from(selectedNotifications);
    if (selectedIds.length > 0) {
      await markAsArchived(selectedIds);
      clearSelection();
    }
  }, [selectedNotifications, markAsArchived, clearSelection]);
  
  const bulkDelete = useCallback(async () => {
    const selectedIds = Array.from(selectedNotifications);
    if (selectedIds.length > 0) {
      await deleteNotifications(selectedIds);
      clearSelection();
    }
  }, [selectedNotifications, deleteNotifications, clearSelection]);
  
  return {
    selectedNotifications: Array.from(selectedNotifications),
    hasSelection: selectedNotifications.size > 0,
    selectionCount: selectedNotifications.size,
    selectNotification,
    deselectNotification,
    selectAll,
    clearSelection,
    bulkMarkAsRead,
    bulkMarkAsArchived,
    bulkDelete
  };
};

export const useNotificationRealTime = () => {
  const { isConnected, subscribeToNotifications, unsubscribeFromNotifications } = useNotifications();
  
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);
  
  const connect = useCallback(() => {
    setConnectionStatus('connecting');
    subscribeToNotifications();
  }, [subscribeToNotifications]);
  
  const disconnect = useCallback(() => {
    setConnectionStatus('disconnected');
    unsubscribeFromNotifications();
  }, [unsubscribeFromNotifications]);
  
  const updateLastUpdate = useCallback(() => {
    setLastUpdate(new Date());
  }, []);
  
  return {
    isConnected,
    connectionStatus,
    lastUpdate,
    connect,
    disconnect,
    updateLastUpdate
  };
}; 
