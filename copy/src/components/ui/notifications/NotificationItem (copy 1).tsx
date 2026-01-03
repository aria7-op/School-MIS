import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../../contexts/NotificationContext';
import { Notification, NotificationAction } from '../../../types/notifications';

interface NotificationItemProps {
  notification: Notification;
  isSelected?: boolean;
  onPress?: (notification: Notification) => void;
  onLongPress?: () => void;
  onToggleSelection?: () => void;
  showActions?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  isSelected = false,
  onPress,
  onLongPress,
  onToggleSelection,
  showActions = true
}) => {
  const { getNotificationIcon, getNotificationColor, formatNotificationTime } = useNotifications();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePress = () => {
    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.(notification);
  };

  const handleLongPress = () => {
    onLongPress?.();
  };

  const handleActionPress = (action: NotificationAction) => {
    // Handle different action types
    if (action.url) {
      // Navigate to URL

    } else if (action.action) {
      // Handle custom action

    }
  };

  const getStatusColor = () => {
    switch (notification.status) {
      case 'PENDING':
        return '#3B82F6';
      case 'READ':
        return '#9CA3AF';
      case 'ARCHIVED':
        return '#6B7280';
      default:
        return '#9CA3AF';
    }
  };

  const getPriorityColor = () => {
    return getNotificationColor(notification.priority);
  };

  const isUnread = notification.status === 'PENDING';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: isSelected ? '#E0E7FF' : '#FFFFFF',
          borderLeftColor: getPriorityColor(),
        }
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        {isSelected && (
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={onToggleSelection}
          >
            <MaterialIcons
              name="check-circle"
              size={20}
              color="#3B82F6"
            />
          </TouchableOpacity>
        )}

        <View style={styles.iconContainer}>
          <MaterialIcons
            name={getNotificationIcon(notification.type)}
            size={24}
            color={getPriorityColor()}
          />
          {isUnread && (
            <View style={[styles.unreadIndicator, { backgroundColor: getStatusColor() }]} />
          )}
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: isUnread ? '#111827' : '#6B7280' }]}>
              {notification.title}
            </Text>
            <Text style={styles.time}>
              {formatNotificationTime(notification.createdAt)}
            </Text>
          </View>

          <Text style={[styles.message, { color: isUnread ? '#374151' : '#9CA3AF' }]}>
            {notification.message}
          </Text>

          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <View style={styles.metadataContainer}>
              {Object.entries(notification.metadata).slice(0, 2).map(([key, value]) => (
                <View key={key} style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>{key}:</Text>
                  <Text style={styles.metadataValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
          )}

          {notification.actions && notification.actions.length > 0 && showActions && (
            <View style={styles.actionsContainer}>
              {notification.actions.slice(0, 2).map((action, index) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: action.type === 'PRIMARY' ? getPriorityColor() : '#F3F4F6',
                      marginRight: index < notification.actions!.length - 1 ? 8 : 0,
                    }
                  ]}
                  onPress={() => handleActionPress(action)}
                >
                  {action.icon && (
                    <MaterialIcons
                      name={action.icon as any}
                      size={14}
                      color={action.type === 'PRIMARY' ? '#FFFFFF' : '#374151'}
                      style={styles.actionIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.actionText,
                      { color: action.type === 'PRIMARY' ? '#FFFFFF' : '#374151' }
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <MaterialIcons
            name={getPriorityIcon()}
            size={12}
            color={getPriorityColor()}
            style={styles.priorityIcon}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getPriorityIcon = () => {
  return 'notifications'; // Default icon, can be customized based on priority
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  selectionButton: {
    marginRight: 12,
    padding: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    marginRight: 12,
    marginBottom: 4,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 60,
  },
  actionIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  statusIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  priorityIcon: {
    opacity: 0.6,
  },
});

export default NotificationItem; 
