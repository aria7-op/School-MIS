import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { 
  BellIcon, 
  XMarkIcon, 
  CheckIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../types/notification';
import { User } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useToast } from '../contexts/ToastContext';
import pushNotificationService from '../services/pushNotificationService';

interface NotificationCenterProps {
  user: User | null;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ user }) => {
  const { t } = useTranslation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isRTL, setIsRTL] = useState(document.documentElement.dir === 'rtl');
  const [loadingLimit, setLoadingLimit] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const toast = useToast();
  
  // Don't render if no user
  if (!user) {
    return null;
  }
  
  const hookResult = useNotifications(user);
  
  const {
    notifications = [],
    unreadCount = 0,
    isLoading = false,
    isConnected = false,
    loadNotifications = async () => {},
    loadMoreNotifications = async () => {},
    loadUnreadCount = async () => {},
    markAsRead = async () => {},
    markAllAsRead = async () => {},
    deleteNotification = async () => {},
    refresh = async () => {}
  } = hookResult || {};

  // Handle load more button click
  const handleLoadMore = async () => {
    const newLimit = loadingLimit + 20;
    setIsLoadingMore(true);
    await loadMoreNotifications(newLimit);
    setLoadingLimit(newLimit);
    setIsLoadingMore(false);
  };
  
  // Debug: Log hook result
  // useEffect(() => {
  //   console.log('🔍 NotificationCenter: useNotifications hook result:', hookResult);
  //   console.log('🔍 NotificationCenter: isConnected:', isConnected);
  //   console.log('🔍 NotificationCenter: notifications:', notifications);
  //   console.log('🔍 NotificationCenter: unreadCount:', unreadCount);
  //   console.log('🔍 NotificationCenter: isLoading:', isLoading);
  // }, [hookResult, isConnected, user, notifications, unreadCount, isLoading]);

  // Listen for RTL changes
  useEffect(() => {
    const handleDirChange = () => {
      setIsRTL(document.documentElement.dir === 'rtl');
    };

    // Listen for changes to the document direction
    const observer = new MutationObserver(handleDirChange);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['dir'] 
    });

    return () => observer.disconnect();
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isPanelOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside the button and panel
      if (
        buttonRef.current && 
        !buttonRef.current.contains(target) &&
        !document.querySelector('.notification-panel')?.contains(target)
      ) {
        setIsPanelOpen(false);
      }
    };

    // Use setTimeout to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isModalOpen]);

  const handleNewNotification = useCallback((notification: Notification) => {
    // Show toast for new notifications
    const toastType = notification.priority === 'HIGH' || notification.priority === 'URGENT' ? 'warning' : 'info';
    toast[toastType](notification.title, notification.message);
    
    // Also show desktop push notification for high priority
    if (notification.priority === 'HIGH' || notification.priority === 'URGENT') {
      pushNotificationService.showFromNotificationData({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        metadata: notification.metadata as any
      });
    }
  }, [toast]);

  const handleNotificationRead = useCallback(async (notificationId: string) => {
    await markAsRead(notificationId);
    toast.success('Marked as Read', 'Notification has been marked as read');
  }, [markAsRead, toast]);


  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
    toast.success('All Read', 'All notifications have been marked as read');
  }, [markAllAsRead, toast]);

  const handleRefresh = useCallback(async () => {
    await refresh();
    toast.info('Refreshed', 'Notifications have been refreshed');
  }, [refresh, toast]);

  const handleViewAll = useCallback(() => {
    setIsPanelOpen(false);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'WARNING':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'ERROR':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50 hover:bg-gray-100';
    
    switch (type) {
      case 'SUCCESS':
        return 'bg-green-50 hover:bg-green-100';
      case 'WARNING':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'ERROR':
        return 'bg-red-50 hover:bg-red-100';
      default:
        return 'bg-blue-50 hover:bg-blue-100';
    }
  };

  const getNotificationTextColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'text-green-800';
      case 'WARNING':
        return 'text-yellow-800';
      case 'ERROR':
        return 'text-red-800';
      default:
        return 'text-blue-800';
    }
  };

  const formatTime = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (isPanelOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 320; // w-80 = 320px
      
      // Calculate top position - appears directly below the button
      const topPosition = rect.bottom + window.scrollY + 8;
      
      let adjustedRight: number;
      
      if (isRTL) {
        // RTL mode: open to the RIGHT of the icon, align with button's right edge
        adjustedRight = window.innerWidth - rect.right - panelWidth;
      } else {
        // LTR mode: open to the LEFT of the icon, align with button's left edge
        adjustedRight = window.innerWidth - rect.left;
      }
      
      setPanelPosition({
        top: topPosition,
        right: adjustedRight,
      });
    }
  }, [isPanelOpen, isRTL]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsPanelOpen(!isPanelOpen);
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
        title={t('common.notifications', 'Notifications')}
      >
        <BellIcon className="h-6 w-6" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection Status Indicator */}
        <div className="absolute -bottom-1 -right-1">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </button>

      {/* Notification Panel */}
      {isPanelOpen && panelPosition && createPortal(
        <div 
          className="notification-panel fixed bg-white rounded-lg shadow-xl border border-gray-200 w-80"
          style={{ 
            top: `${panelPosition.top}px`,
            right: `${panelPosition.right}px`,
            zIndex: 9999,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('notifications.title', 'Notifications')}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title={t('notifications.refresh', 'Refresh')}
              >
                <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
                title={t('notifications.close', 'Close')}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={isConnected ? 'text-green-700' : 'text-red-700'}>
                  {isConnected ? t('notifications.connected', 'Connected') : t('notifications.disconnected', 'Disconnected')}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {t('notifications.count', '{{count}} notifications • {{unread}} unread', { 
                  count: notifications.length, 
                  unread: unreadCount 
                })}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                {t('notifications.loading', 'Loading notifications...')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                {t('notifications.noNotifications', 'No notifications')}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${getNotificationBgColor(notification.type, notification.isRead)} transition-colors`}
                  >
                    <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${getNotificationTextColor(notification.type)}`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        {notification.message && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} mt-2`}>
                          {!notification.isRead && (
                            <button
                              onClick={() => handleNotificationRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {t('notifications.markAsRead', 'Mark as read')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
              <button
                onClick={handleViewAll}
                className="w-full px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors"
              >
                {t('notifications.viewAll', 'View all notifications')}
              </button>
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckIcon className={`h-4 w-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('notifications.markAllAsRead', 'Mark all as read')}
              </button>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* View All Notifications Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('notifications.allNotifications', 'All Notifications')}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  title={t('notifications.refresh', 'Refresh')}
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  title={t('notifications.close', 'Close')}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={isConnected ? 'text-green-700' : 'text-red-700'}>
                    {isConnected ? t('notifications.connected', 'Connected') : t('notifications.disconnected', 'Disconnected')}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {t('notifications.count', '{{count}} notifications • {{unread}} unread', { 
                    count: notifications.length, 
                    unread: unreadCount 
                  })}
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                  {t('notifications.loading', 'Loading notifications...')}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  {t('notifications.noNotifications', 'No notifications')}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 ${getNotificationBgColor(notification.type, notification.isRead)} transition-colors`}
                    >
                      <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${getNotificationTextColor(notification.type)}`}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          {notification.message && (
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          )}
                          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} mt-2`}>
                            {!notification.isRead && (
                              <button
                                onClick={() => handleNotificationRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {t('notifications.markAsRead', 'Mark as read')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoadingMore ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      {t('notifications.loadingMore', 'Loading...')}
                    </>
                  ) : (
                    <>
                      <span className="material-icons text-base mr-2">expand_more</span>
                      {t('notifications.seeMore', 'See More')}
                    </>
                  )}
                </button>
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className={`h-4 w-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('notifications.markAllAsRead', 'Mark all as read')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 