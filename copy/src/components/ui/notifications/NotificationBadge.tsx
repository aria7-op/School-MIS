import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../../contexts/NotificationContext';

interface NotificationBadgeProps {
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  maxCount?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  animated?: boolean;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  onPress,
  size = 'medium',
  showCount = true,
  maxCount = 99,
  position = 'top-right',
  animated = true
}) => {
  const { unreadCount, isConnected } = useNotifications();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (animated && unreadCount > 0) {
      // Scale animation for new notifications
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for urgent notifications
      if (unreadCount > 10) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [unreadCount, animated, scaleAnim, pulseAnim]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 16, height: 16 },
          text: { fontSize: 10 },
          icon: { fontSize: 12 }
        };
      case 'large':
        return {
          container: { width: 24, height: 24 },
          text: { fontSize: 14 },
          icon: { fontSize: 16 }
        };
      default:
        return {
          container: { width: 20, height: 20 },
          text: { fontSize: 12 },
          icon: { fontSize: 14 }
        };
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: -5, left: -5 };
      case 'bottom-right':
        return { bottom: -5, right: -5 };
      case 'bottom-left':
        return { bottom: -5, left: -5 };
      default:
        return { top: -5, right: -5 };
    }
  };

  const getBadgeColor = () => {
    if (unreadCount === 0) return '#9CA3AF';
    if (unreadCount > 10) return '#EF4444'; // Red for urgent
    if (unreadCount > 5) return '#F59E0B'; // Orange for high
    return '#3B82F6'; // Blue for normal
  };

  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();

  const sizeStyles = getSizeStyles();
  const positionStyles = getPositionStyles();

  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons 
          name="notifications" 
          size={sizeStyles.icon.fontSize} 
          color={isConnected ? '#3B82F6' : '#9CA3AF'} 
        />
        
        {unreadCount > 0 && (
          <Animated.View
            style={[
              styles.badge,
              sizeStyles.container,
              positionStyles,
              {
                backgroundColor: getBadgeColor(),
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) }
                ]
              }
            ]}
          >
            {showCount && (
              <Text style={[styles.badgeText, sizeStyles.text]}>
                {displayCount}
              </Text>
            )}
          </Animated.View>
        )}
        
        {!isConnected && (
          <View style={[styles.connectionIndicator, positionStyles]}>
            <View style={styles.connectionDot} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  connectionIndicator: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});

export default NotificationBadge; 
