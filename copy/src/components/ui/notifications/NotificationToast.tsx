import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../../contexts/NotificationContext';
import { Notification } from '../../../types/notifications';

const { width: screenWidth } = Dimensions.get('window');

interface NotificationToastProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onDismiss?: (notificationId: string) => void;
  onAction?: (action: any) => void;
  position?: 'top' | 'bottom';
  duration?: number;
  maxWidth?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onPress,
  onDismiss,
  onAction,
  position = 'top',
  duration = 5000,
  maxWidth = screenWidth - 32
}) => {
  const { getNotificationIcon, getNotificationColor, formatNotificationTime } = useNotifications();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss timer
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.(notification.id);
    });
  };

  const handlePress = () => {
    onPress?.(notification);
    handleDismiss();
  };

  const handleAction = (action: any) => {
    onAction?.(action);
    handleDismiss();
  };

  const getPriorityIcon = () => {
    switch (notification.priority) {
      case 'URGENT':
        return 'priority-high';
      case 'HIGH':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'notifications';
    }
  };

  const getPriorityColor = () => {
    return getNotificationColor(notification.priority);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
          maxWidth,
          [position === 'top' ? 'top' : 'bottom']: position === 'top' ? 50 : 100,
        }
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { borderLeftColor: getPriorityColor() }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name={getNotificationIcon(notification.type)}
              size={20}
              color={getPriorityColor()}
            />
          </View>
          
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.time}>
              {formatNotificationTime(notification.createdAt)}
            </Text>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
            >
              <MaterialIcons name="close" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {notification.actions && notification.actions.length > 0 && (
          <View style={styles.actionButtons}>
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
                onPress={() => handleAction(action)}
              >
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
        
        <View style={styles.priorityIndicator}>
          <MaterialIcons
            name={getPriorityIcon()}
            size={12}
            color={getPriorityColor()}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    alignItems: 'flex-start',
  },
  dismissButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priorityIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NotificationToast; 
