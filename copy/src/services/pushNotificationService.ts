/**
 * Push Notification Service for Browser Notifications
 * Handles desktop notifications using the Web Notifications API
 */

class PushNotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'Notification' in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      console.log('Push notification permission:', this.permission);
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a desktop notification
   */
  async showNotification(title: string, options?: NotificationOptions & { onClick?: () => void }) {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return null;
    }

    // Request permission if not granted
    if (this.permission !== 'granted') {
      const newPermission = await this.requestPermission();
      if (newPermission !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
        ...options,
      });

      // Handle click event
      if (options?.onClick) {
        notification.onclick = () => {
          options.onClick!();
          notification.close();
          window.focus();
        };
      } else {
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }

      // Auto close after 10 seconds if not manually closed
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show notification from notification data
   */
  async showFromNotificationData(notificationData: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    metadata?: any;
  }) {
    const { title, message, type, priority, metadata } = notificationData;

    // Determine icon based on type
    let icon = '/logo.png';
    if (type?.includes('GRADE')) icon = '📊';
    if (type?.includes('PAYMENT')) icon = '💰';
    if (type?.includes('ATTENDANCE')) icon = '📅';
    if (type?.includes('LATE')) icon = '⏰';
    if (type?.includes('ABSENT')) icon = '❌';

    const options: NotificationOptions = {
      body: message,
      tag: type || 'default',
      requireInteraction: priority === 'URGENT' || priority === 'HIGH',
      data: metadata,
    };

    return this.showNotification(title, options);
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Check if permission is granted
   */
  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;

