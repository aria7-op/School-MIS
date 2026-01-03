# 🚀 Advanced Notification System

A comprehensive, production-ready notification system for React Native applications with real-time updates, push notifications, and advanced features.

## ✨ Features

### 🔔 Core Features
- **Real-time Notifications** - WebSocket integration for instant updates
- **Push Notifications** - Native push notification support with Firebase
- **Notification Badge** - Animated badge with unread count
- **Notification Center** - Full-featured notification management
- **Toast Notifications** - In-app toast notifications
- **Advanced Filtering** - Filter by status, priority, type, date range
- **Bulk Operations** - Mark multiple notifications as read/archived
- **Preferences Management** - Customizable notification settings
- **Quiet Hours** - Configure notification quiet hours
- **Offline Support** - Cached notifications when offline
- **TypeScript Support** - Full TypeScript definitions
- **Performance Optimized** - Efficient rendering and state management

### 🔥 Advanced Features
- **Automatic Backend Integration** - Seamless API integration
- **Real-time Sync** - Automatic synchronization with backend
- **Push Permission Management** - Automatic permission requests
- **Background Message Handling** - Handle notifications when app is closed
- **Foreground Message Handling** - Handle notifications when app is open
- **Notification Channels** - Android notification channels
- **Automatic Cleanup** - Clean up old notifications
- **Statistics & Analytics** - Detailed notification statistics
- **Search Functionality** - Search through notifications
- **Selection Mode** - Multi-select notifications for bulk operations
- **Advanced Settings** - Comprehensive configuration options

## 🚀 Quick Start

### 1. Setup Provider

Wrap your app with the `NotificationProvider`:

```tsx
import { NotificationProvider } from './src/components/ui/notifications';

const App = () => {
  return (
    <NotificationProvider
      autoInitialize={true}
      showToasts={true}
      enablePushNotifications={true}
      enableWebSocket={true}
      quietHours={{
        enabled: false,
        start: '22:00',
        end: '08:00'
      }}
    >
      {/* Your app components */}
    </NotificationProvider>
  );
};
```

### 2. Basic Usage

```tsx
import { AdvancedNotificationSystem, useNotificationSystem } from './src/components/ui/notifications';

const MyComponent = () => {
  const { unreadCount, notifications, isConnected } = useNotificationSystem();

  return (
    <View>
      <AdvancedNotificationSystem 
        showBadge={true}
        showCenter={true}
        autoInitialize={true}
        enablePushNotifications={true}
        onNotificationPress={(notification) => {
          console.log('Notification pressed:', notification);
        }}
      />
    </View>
  );
};
```

## 📱 Components

### AdvancedNotificationSystem

The main component that provides all notification functionality:

```tsx
<AdvancedNotificationSystem
  showBadge={true}
  showCenter={true}
  showPreferences={true}
  showFilters={true}
  autoInitialize={true}
  enablePushNotifications={true}
  enableWebSocket={true}
  quietHours={{
    enabled: false,
    start: '22:00',
    end: '08:00'
  }}
  onNotificationPress={(notification) => {
    // Handle notification press
  }}
  onPushPermissionGranted={() => {
    console.log('Push notifications enabled');
  }}
  onPushPermissionDenied={() => {
    console.log('Push notifications denied');
  }}
/>
```

### NotificationBadge

Animated badge component showing unread count:

```tsx
<NotificationBadge
  onPress={() => setShowCenter(true)}
  size="medium"
  showCount={true}
  animated={true}
/>
```

### NotificationCenter

Full-featured notification management center:

```tsx
<NotificationCenter
  visible={showCenter}
  onClose={() => setShowCenter(false)}
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
  onCreateTest={createTestNotification}
  onShowPreferences={() => setShowPreferences(true)}
  onShowFilters={() => setShowFilters(true)}
  getNotificationIcon={getNotificationIcon}
  getNotificationColor={getNotificationColor}
  formatNotificationTime={formatNotificationTime}
/>
```

### NotificationToast

In-app toast notifications:

```tsx
<NotificationToast
  notification={notification}
  onPress={handlePress}
  onDismiss={handleDismiss}
  position="top"
  duration={5000}
/>
```

## 🎣 Hooks

### useNotificationSystem

Main hook for notification functionality:

```tsx
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
  showToasts: true,
  onNotificationPress: handlePress,
  onPushPermissionGranted: handleGranted,
  onPushPermissionDenied: handleDenied
});
```

### Specialized Hooks

```tsx
import {
  useNotificationBadge,
  useNotificationToast,
  useNotificationCenter,
  useNotificationPreferences,
  useNotificationStats,
  useNotificationFilters,
  useNotificationSearch,
  useNotificationBulkOperations,
  useNotificationRealTime
} from './src/components/ui/notifications';

// Badge hook
const { unreadCount, isConnected, isInitialized, hasNotifications, isOnline } = useNotificationBadge();

// Toast hook
const { toasts, showToast, hideToast, clearAllToasts, hasToasts } = useNotificationToast();

// Center hook
const { notifications, unreadCount, isLoading, hasUnread, markAsRead, markAsArchived, deleteNotifications, fetchNotifications } = useNotificationCenter();

// Preferences hook
const { preferences, updatePreferences, hasPreferences } = useNotificationPreferences();

// Stats hook
const { stats, getNotificationStats, hasStats, totalNotifications, unreadNotifications, readNotifications, archivedNotifications } = useNotificationStats();

// Filters hook
const { filters, applyFilters, clearFilters } = useNotificationFilters();

// Search hook
const { searchQuery, setSearchQuery, searchResults, hasSearchQuery } = useNotificationSearch();

// Bulk operations hook
const { selectedNotifications, hasSelection, selectionCount, selectNotification, deselectNotification, selectAll, clearSelection, bulkMarkAsRead, bulkMarkAsArchived, bulkDelete } = useNotificationBulkOperations();

// Real-time hook
const { isConnected, connectionStatus, lastUpdate, connect, disconnect, updateLastUpdate } = useNotificationRealTime();
```

## 🔧 API Integration

### Service Usage

```tsx
import { notificationService } from './src/components/ui/notifications';

// Initialize the complete system
await notificationService.initialize(token);

// Fetch notifications
const response = await notificationService.getNotifications({
  status: 'PENDING',
  limit: 20,
  page: 1
});

// Mark as read
await notificationService.markNotificationsAsRead(['id1', 'id2']);

// Create notification
await notificationService.createNotification({
  type: 'CUSTOM_NOTIFICATION',
  title: 'Custom Title',
  message: 'Custom message',
  priority: 'NORMAL'
});

// Get statistics
const stats = await notificationService.getNotificationStats('30d');

// Update preferences
await notificationService.updatePreferences({
  email: true,
  push: true,
  inApp: true,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  }
});
```

### Event Listeners

```tsx
// Listen for new notifications
notificationService.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});

// Listen for connection status
notificationService.on('connection:established', () => {
  console.log('WebSocket connected');
});

// Listen for badge updates
notificationService.on('badge:updated', (count) => {
  console.log('Badge count:', count);
});

// Listen for push notifications
notificationService.on('push:received', (notification) => {
  console.log('Push notification received:', notification);
});

// Listen for push notification actions
notificationService.on('push:action', (data) => {
  console.log('Push notification action:', data);
});
```

## 📊 Configuration

### Notification Types

```tsx
type NotificationType = 
  | 'STUDENT_CREATED' | 'STUDENT_UPDATED' | 'STUDENT_DELETED' | 'STUDENT_STATUS_CHANGED'
  | 'CUSTOMER_CREATED' | 'CUSTOMER_UPDATED' | 'CUSTOMER_DELETED'
  | 'TEACHER_CREATED' | 'TEACHER_UPDATED' | 'TEACHER_DELETED'
  | 'FEE_STRUCTURE_CREATED' | 'FEE_STRUCTURE_UPDATED' | 'FEE_STRUCTURE_DELETED'
  | 'CLASS_CREATED' | 'CLASS_UPDATED' | 'CLASS_DELETED'
  | 'STUDENT_BULK_CREATE' | 'CUSTOMER_BULK_UPDATE' | 'CLASS_BULK_DELETE'
  | 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'PAYMENT_PENDING'
  | 'EXAM_SCHEDULED' | 'EXAM_RESULTS' | 'EXAM_CANCELLED'
  | 'ATTENDANCE_MARKED' | 'ATTENDANCE_REMINDER'
  | 'SYSTEM_UPDATE' | 'MAINTENANCE_NOTICE'
  | 'CUSTOM_NOTIFICATION';
```

### Priority Levels

```tsx
type NotificationPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
```

### Status Types

```tsx
type NotificationStatus = 'PENDING' | 'READ' | 'ARCHIVED';
```

## 🔥 Advanced Features

### Custom Filters

```tsx
const filters: NotificationFilters = {
  status: 'PENDING',
  priority: 'HIGH',
  type: 'PAYMENT_RECEIVED',
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-01-31T23:59:59Z',
  entityType: 'student',
  entityId: '123',
  search: 'payment',
  page: 1,
  limit: 20
};

applyFilters(filters);
```

### Bulk Operations

```tsx
// Select notifications
selectNotification('notification-id');
selectAllNotifications();

// Bulk actions
await bulkMarkAsRead();
await bulkMarkAsArchived();
await bulkDelete();
```

### Push Notifications

```tsx
// Request permissions
const granted = await requestPushPermissions();

// Get push token
const token = getPushToken();

// Test push notification
testNotificationSystem();
```

### Real-time Updates

```tsx
// Subscribe to updates
subscribeToNotifications();

// Unsubscribe from updates
unsubscribeFromNotifications();

// Refresh notifications
await refreshNotifications();

// Sync with backend
await syncWithBackend();
```

### Statistics & Analytics

```tsx
// Get notification statistics
const stats = await getNotificationStats('30d');

// Cleanup old notifications
await cleanupOldNotifications();
```

## 🎨 Customization

### Custom Notification Icons

```tsx
const getNotificationIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    'STUDENT_CREATED': 'person-add',
    'PAYMENT_RECEIVED': 'payment',
    'EXAM_SCHEDULED': 'event',
    'CUSTOM_NOTIFICATION': 'notifications'
  };
  
  return iconMap[type] || 'notifications';
};
```

### Custom Notification Colors

```tsx
const getNotificationColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    'URGENT': '#EF4444',
    'HIGH': '#F59E0B',
    'NORMAL': '#3B82F6',
    'LOW': '#6B7280'
  };
  
  return colorMap[priority] || '#3B82F6';
};
```

### Custom Time Formatting

```tsx
const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return date.toLocaleDateString();
};
```

## 🧪 Testing

### Unit Tests

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { NotificationProvider, AdvancedNotificationSystem } from './src/components/ui/notifications';

test('renders notification badge', () => {
  const { getByTestId } = render(
    <NotificationProvider>
      <AdvancedNotificationSystem />
    </NotificationProvider>
  );
  
  expect(getByTestId('notification-badge')).toBeTruthy();
});
```

### Integration Tests

```tsx
test('marks notification as read', async () => {
  const { markAsRead } = useNotificationSystem();
  
  await markAsRead(['test-id']);
  
  // Verify notification status changed
  expect(mockApi.markAsRead).toHaveBeenCalledWith(['test-id']);
});
```

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket not connecting**
   - Check authentication token
   - Verify server URL configuration
   - Check network connectivity

2. **Push notifications not showing**
   - Verify provider is wrapped around app
   - Check notification permissions
   - Verify API endpoints are correct

3. **Performance issues**
   - Implement pagination
   - Use React.memo for components
   - Limit notification list size

### Debug Mode

```tsx
// Enable debug logging
notificationService.on('*', (event, data) => {
  console.log('Notification event:', event, data);
});
```

## 📚 API Reference

### NotificationService Methods

- `initialize(token: string)` - Initialize the complete system
- `getNotifications(filters?: NotificationFilters)` - Fetch notifications
- `markNotificationsAsRead(ids: string[])` - Mark as read
- `markNotificationsAsArchived(ids: string[])` - Mark as archived
- `deleteNotifications(ids: string[])` - Delete notifications
- `createNotification(notification: CreateNotificationRequest)` - Create notification
- `getNotificationStats(period?: string)` - Get statistics
- `getPreferences()` - Get user preferences
- `updatePreferences(preferences: Partial<NotificationPreferences>)` - Update preferences
- `requestPushPermissions()` - Request push permissions
- `getPushToken()` - Get push token
- `testNotificationSystem()` - Test notification system
- `syncWithBackend()` - Sync with backend
- `cleanupOldNotifications()` - Cleanup old notifications

### Event Types

- `notification:new` - New notification received
- `notification:updated` - Notification updated
- `notification:deleted` - Notification deleted
- `connection:established` - WebSocket connected
- `connection:lost` - WebSocket disconnected
- `badge:updated` - Badge count updated
- `push:received` - Push notification received
- `push:foreground` - Foreground push notification
- `push:background` - Background push notification
- `push:action` - Push notification action

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

## 🎯 Example Usage

See `AdvancedNotificationExample.tsx` for a complete example of all features in action.

This advanced notification system provides everything you need for a production-ready notification system with real-time updates, push notifications, and comprehensive management features. 