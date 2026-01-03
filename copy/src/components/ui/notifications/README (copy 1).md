# Advanced Notification System

A comprehensive, real-time notification system for React Native applications with WebSocket support, push notifications, and advanced filtering capabilities.

## Features

- ✅ **Real-time Notifications** - WebSocket integration for instant updates
- ✅ **Push Notifications** - Native push notification support
- ✅ **Notification Badge** - Animated badge with unread count
- ✅ **Notification Center** - Full-featured notification management
- ✅ **Toast Notifications** - In-app toast notifications
- ✅ **Advanced Filtering** - Filter by status, priority, type, date range
- ✅ **Bulk Actions** - Mark multiple notifications as read/archived
- ✅ **Preferences Management** - Customizable notification settings
- ✅ **Quiet Hours** - Configure notification quiet hours
- ✅ **Offline Support** - Cached notifications when offline
- ✅ **TypeScript Support** - Full TypeScript definitions
- ✅ **Performance Optimized** - Efficient rendering and state management

## Quick Start

### 1. Setup Provider

Wrap your app with the `NotificationProvider`:

```tsx
import { NotificationProvider } from './src/components/ui/notifications';

const App = () => {
  return (
    <NotificationProvider>
      {/* Your app components */}
    </NotificationProvider>
  );
};
```

### 2. Basic Usage

```tsx
import { Notifications, useNotificationSystem } from './src/components/ui/notifications';

const MyComponent = () => {
  const { unreadCount, notifications } = useNotificationSystem();

  return (
    <View>
      <Notifications 
        showBadge={true}
        showCenter={true}
        onNotificationPress={(notification) => {
          console.log('Notification pressed:', notification);
        }}
      />
    </View>
  );
};
```

## Components

### NotificationBadge

Animated badge component showing unread count:

```tsx
import { NotificationBadge } from './src/components/ui/notifications';

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
import { NotificationCenter } from './src/components/ui/notifications';

<NotificationCenter
  visible={showCenter}
  onClose={() => setShowCenter(false)}
  onNotificationPress={handleNotificationPress}
/>
```

### NotificationToast

In-app toast notifications:

```tsx
import { NotificationToast } from './src/components/ui/notifications';

<NotificationToast
  notification={notification}
  onPress={handlePress}
  onDismiss={handleDismiss}
  position="top"
  duration={5000}
/>
```

## Hooks

### useNotificationSystem

Main hook for notification functionality:

```tsx
import { useNotificationSystem } from './src/components/ui/notifications';

const {
  notifications,
  unreadCount,
  isConnected,
  fetchNotifications,
  markAsRead,
  createNotification
} = useNotificationSystem({
  autoSubscribe: true,
  showToasts: true,
  onNotificationPress: handlePress
});
```

### Specialized Hooks

```tsx
import {
  useNotificationBadge,
  useNotificationToast,
  useNotificationCenter,
  useNotificationPreferences,
  useNotificationStats
} from './src/components/ui/notifications';

// Badge hook
const { unreadCount, isConnected, hasNotifications } = useNotificationBadge();

// Toast hook
const { toasts, hideToast, clearAllToasts } = useNotificationToast();

// Center hook
const { notifications, hasUnread, markAsRead } = useNotificationCenter();

// Preferences hook
const { preferences, updatePreferences } = useNotificationPreferences();

// Stats hook
const { stats, totalNotifications, unreadNotifications } = useNotificationStats();
```

## API Integration

### Service Usage

```tsx
import { notificationService } from './src/components/ui/notifications';

// Initialize WebSocket
await notificationService.initializeWebSocket(token);

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
```

## Configuration

### Notification Types

```tsx
type NotificationType = 
  | 'STUDENT_CREATED' | 'STUDENT_UPDATED' | 'STUDENT_DELETED'
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

## Advanced Features

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

await fetchNotifications(filters);
```

### Bulk Actions

```tsx
// Mark multiple as read
await markAsRead(['id1', 'id2', 'id3']);

// Archive multiple
await markAsArchived(['id1', 'id2']);

// Delete multiple
await deleteNotifications(['id1', 'id2']);
```

### Preferences Management

```tsx
const preferences: NotificationPreferences = {
  email: true,
  push: true,
  inApp: true,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  },
  types: {
    'STUDENT_CREATED': true,
    'PAYMENT_RECEIVED': true,
    'SYSTEM_UPDATE': false
  }
};

await updatePreferences(preferences);
```

## Styling

### Custom Themes

```tsx
const customStyles = {
  badge: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF'
  },
  toast: {
    backgroundColor: '#FFFFFF',
    borderColor: '#3B82F6'
  },
  center: {
    backgroundColor: '#F9FAFB'
  }
};
```

### Animation Configuration

```tsx
<NotificationBadge
  animated={true}
  size="large"
  position="top-right"
/>
```

## Performance Optimization

### Lazy Loading

```tsx
const { fetchNotifications } = useNotificationSystem({
  filters: { limit: 10 }
});

// Load more when needed
const loadMore = () => {
  fetchNotifications({ page: nextPage, limit: 10 });
};
```

### Caching

The system automatically caches notifications and preferences in AsyncStorage for offline access.

### Memory Management

```tsx
// Cleanup on unmount
useEffect(() => {
  return () => {
    unsubscribeFromNotifications();
    clearAllToasts();
  };
}, []);
```

## Error Handling

```tsx
try {
  await fetchNotifications();
} catch (error) {
  console.error('Failed to fetch notifications:', error);
  // Show fallback UI
}

// Handle WebSocket connection errors
notificationService.on('connect_error', (error) => {
  console.error('WebSocket connection failed:', error);
  // Show offline indicator
});
```

## Testing

### Unit Tests

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { NotificationProvider, Notifications } from './src/components/ui/notifications';

test('renders notification badge', () => {
  const { getByTestId } = render(
    <NotificationProvider>
      <Notifications />
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

## Troubleshooting

### Common Issues

1. **WebSocket not connecting**
   - Check authentication token
   - Verify server URL configuration
   - Check network connectivity

2. **Notifications not showing**
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

## API Reference

### NotificationService Methods

- `initializeWebSocket(token: string)` - Initialize WebSocket connection
- `getNotifications(filters?: NotificationFilters)` - Fetch notifications
- `markNotificationsAsRead(ids: string[])` - Mark as read
- `markNotificationsAsArchived(ids: string[])` - Mark as archived
- `deleteNotifications(ids: string[])` - Delete notifications
- `createNotification(notification: CreateNotificationRequest)` - Create notification
- `getNotificationStats(period?: string)` - Get statistics
- `getPreferences()` - Get user preferences
- `updatePreferences(preferences: Partial<NotificationPreferences>)` - Update preferences

### Event Types

- `notification:new` - New notification received
- `notification:updated` - Notification updated
- `notification:deleted` - Notification deleted
- `connection:established` - WebSocket connected
- `connection:lost` - WebSocket disconnected
- `badge:updated` - Badge count updated
- `push:show` - Show push notification

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 