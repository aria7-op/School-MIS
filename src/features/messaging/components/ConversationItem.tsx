import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  State
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';
import {
  Conversation,
  ConversationType,
  UserStatus,
  MessageType,
  MessagePriority
} from '../types';
import Avatar from '../../../components/ui/Avatar';
import UnreadBadge from './UnreadBadge';
import TypingIndicator from './TypingIndicator';
import { useUserStatus } from '../hooks/useMessaging';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onPress: (conversation: Conversation) => void;
  onLongPress: (conversation: Conversation) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onPress,
  onLongPress
}) => {
  const { colors, dark } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [showSwipeActions, setShowSwipeActions] = useState(false);
  
  // Animations
  const scaleAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(1);

  // Get conversation display info
  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    if (conversation.type === ConversationType.DIRECT && conversation.participants.length > 0) {
      return conversation.participants[0].user.name;
    }
    return 'Unnamed Conversation';
  };

  const getConversationAvatar = () => {
    if (conversation.type === ConversationType.DIRECT && conversation.participants.length > 0) {
      return conversation.participants[0].user.avatar;
    }
    return null;
  };

  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { lastMessage } = conversation;
    let preview = lastMessage.content;
    
    // Truncate long messages
    if (preview.length > 50) {
      preview = preview.substring(0, 50) + '...';
    }
    
    // Add message type indicators
    switch (lastMessage.type) {
      case MessageType.IMAGE:
        return '📷 Image';
      case MessageType.VIDEO:
        return '🎥 Video';
      case MessageType.AUDIO:
        return '🎵 Audio';
      case MessageType.FILE:
        return '📎 File';
      case MessageType.LOCATION:
        return '📍 Location';
      case MessageType.CONTACT:
        return '👤 Contact';
      case MessageType.POLL:
        return '📊 Poll';
      case MessageType.SYSTEM:
        return '🔔 System message';
      default:
        return preview;
    }
  };

  const getLastMessageTime = () => {
    if (!conversation.lastMessage) return '';
    
    const now = new Date();
    const messageTime = new Date(conversation.lastMessage.createdAt);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return messageTime.toLocaleDateString();
  };

  const getMessageStatusIcon = () => {
    if (!conversation.lastMessage) return null;
    
    const { lastMessage } = conversation;
    const isOwnMessage = lastMessage.senderId === 'currentUser'; // Replace with actual user ID
    
    if (!isOwnMessage) return null;
    
    switch (lastMessage.status) {
      case 'SENDING':
        return <Ionicons name="time-outline" size={12} color={colors.textSecondary} />;
      case 'SENT':
        return <Ionicons name="checkmark" size={12} color={colors.textSecondary} />;
      case 'DELIVERED':
        return <Ionicons name="checkmark-done" size={12} color={colors.textSecondary} />;
      case 'READ':
        return <Ionicons name="checkmark-done" size={12} color={COLORS.primary} />;
      case 'FAILED':
        return <Ionicons name="close-circle" size={12} color={COLORS.error} />;
      default:
        return null;
    }
  };

  const getPriorityIcon = () => {
    if (!conversation.lastMessage) return null;
    
    switch (conversation.lastMessage.priority) {
      case MessagePriority.HIGH:
        return <Ionicons name="alert-circle" size={12} color={COLORS.warning} />;
      case MessagePriority.URGENT:
        return <Ionicons name="warning" size={12} color={COLORS.error} />;
      default:
        return null;
    }
  };

  const getConversationTypeIcon = () => {
    switch (conversation.type) {
      case ConversationType.GROUP:
        return <Ionicons name="people" size={12} color={colors.textSecondary} />;
      case ConversationType.BROADCAST:
        return <Ionicons name="megaphone" size={12} color={colors.textSecondary} />;
      case ConversationType.CHANNEL:
        return <Ionicons name="radio" size={12} color={colors.textSecondary} />;
      default:
        return null;
    }
  };

  // Handle press animations
  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    onPress(conversation);
  };

  const handleLongPress = () => {
    onLongPress(conversation);
  };

  // Handle swipe gestures
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: slideAnim } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      if (translationX < -50) {
        setShowSwipeActions(true);
        Animated.spring(slideAnim, {
          toValue: -80,
          useNativeDriver: true,
        }).start();
      } else {
        setShowSwipeActions(false);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: isSelected ? colors.primary + '20' : colors.background,
            transform: [
              { scale: scaleAnim },
              { translateX: slideAnim }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.touchable}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Avatar
              source={getConversationAvatar()}
              size={48}
              name={getConversationName()}
              isOnline={conversation.participants.some(p => p.user.status === 'online')}
            />
            {conversation.isPinned && (
              <View style={[styles.pinIndicator, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="pin" size={8} color="white" />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <Text
                style={[
                  styles.name,
                  { color: colors.text },
                  conversation.unreadCount > 0 && { fontWeight: FONTS.weights.bold }
                ]}
                numberOfLines={1}
              >
                {getConversationName()}
              </Text>
              
              <View style={styles.headerRight}>
                {getPriorityIcon()}
                {getConversationTypeIcon()}
                <Text style={[styles.time, { color: colors.textSecondary }]}>
                  {getLastMessageTime()}
                </Text>
              </View>
            </View>

            <View style={styles.messageContainer}>
              <View style={styles.messageContent}>
                {conversation.isEncrypted && (
                  <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
                )}
                <Text
                  style={[
                    styles.message,
                    { color: colors.textSecondary },
                    conversation.unreadCount > 0 && { color: colors.text }
                  ]}
                  numberOfLines={1}
                >
                  {getLastMessagePreview()}
                </Text>
                {getMessageStatusIcon()}
              </View>
              
              <View style={styles.messageRight}>
                {conversation.unreadCount > 0 && (
                  <UnreadBadge count={conversation.unreadCount} />
                )}
              </View>
            </View>

            {/* Typing Indicator */}
            {conversation.id && (
              <TypingIndicator
                typingUsers={new Set()} // This should be passed from parent
                conversationId={conversation.id}
                compact={true}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Swipe Actions */}
        {showSwipeActions && (
          <Animated.View
            style={[
              styles.swipeActions,
              {
                opacity: slideAnim.interpolate({
                  inputRange: [-80, 0],
                  outputRange: [1, 0]
                })
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.swipeAction, { backgroundColor: COLORS.primary }]}
              onPress={() => {
                // Handle pin/unpin
                setShowSwipeActions(false);
                Animated.spring(slideAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                }).start();
              }}
            >
              <Ionicons name="pin" size={16} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.swipeAction, { backgroundColor: COLORS.warning }]}
              onPress={() => {
                // Handle archive
                setShowSwipeActions(false);
                Animated.spring(slideAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                }).start();
              }}
            >
              <Ionicons name="archive" size={16} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.swipeAction, { backgroundColor: COLORS.error }]}
              onPress={() => {
                // Handle delete
                setShowSwipeActions(false);
                Animated.spring(slideAnim, {
                  toValue: 0,
                  useNativeDriver: true,
                }).start();
              }}
            >
              <Ionicons name="trash" size={16} color="white" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  touchable: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  pinIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    flex: 1,
    marginRight: SPACING.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: FONTS.sizes.xs,
    marginLeft: SPACING.xs,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  message: {
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  messageRight: {
    alignItems: 'flex-end',
  },
  swipeActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConversationItem; 
