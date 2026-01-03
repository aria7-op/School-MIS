import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  State,
  Alert,
  Modal
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';
import {
  Message,
  MessageType,
  MessagePriority,
  MessageStatus,
  MessageReaction
} from '../types';
import Avatar from '../../../components/ui/Avatar';
import MessageReactions from './MessageReactions';
import { useUserStatus } from '../hooks/useMessaging';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply?: (message: Message) => void;
  onReaction?: (messageId: string, reaction: string) => void;
  onLongPress?: (event: any) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar,
  showTimestamp,
  onReply,
  onReaction,
  onLongPress
}) => {
  const { colors, dark } = useTheme();
  const [showReactions, setShowReactions] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Animations
  const scaleAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(1);

  // Get message display info
  const getMessageTime = () => {
    const messageTime = new Date(message.createdAt);
    return messageTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageDate = () => {
    const messageDate = new Date(message.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
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
    switch (message.priority) {
      case MessagePriority.HIGH:
        return <Ionicons name="alert-circle" size={12} color={COLORS.warning} />;
      case MessagePriority.URGENT:
        return <Ionicons name="warning" size={12} color={COLORS.error} />;
      default:
        return null;
    }
  };

  const getMessageContent = () => {
    switch (message.type) {
      case MessageType.IMAGE:
        return (
          <View style={styles.imageContainer}>
            <Text style={[styles.imagePlaceholder, { color: colors.textSecondary }]}>
              📷 Image
            </Text>
          </View>
        );
      case MessageType.VIDEO:
        return (
          <View style={styles.videoContainer}>
            <Text style={[styles.videoPlaceholder, { color: colors.textSecondary }]}>
              🎥 Video
            </Text>
          </View>
        );
      case MessageType.AUDIO:
        return (
          <View style={styles.audioContainer}>
            <Text style={[styles.audioPlaceholder, { color: colors.textSecondary }]}>
              🎵 Audio
            </Text>
          </View>
        );
      case MessageType.FILE:
        return (
          <View style={styles.fileContainer}>
            <Text style={[styles.filePlaceholder, { color: colors.textSecondary }]}>
              📎 File
            </Text>
          </View>
        );
      case MessageType.LOCATION:
        return (
          <View style={styles.locationContainer}>
            <Text style={[styles.locationPlaceholder, { color: colors.textSecondary }]}>
              📍 Location
            </Text>
          </View>
        );
      case MessageType.CONTACT:
        return (
          <View style={styles.contactContainer}>
            <Text style={[styles.contactPlaceholder, { color: colors.textSecondary }]}>
              👤 Contact
            </Text>
          </View>
        );
      case MessageType.POLL:
        return (
          <View style={styles.pollContainer}>
            <Text style={[styles.pollPlaceholder, { color: colors.textSecondary }]}>
              📊 Poll
            </Text>
          </View>
        );
      case MessageType.SYSTEM:
        return (
          <View style={[styles.systemContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.systemText, { color: colors.textSecondary }]}>
              {message.content}
            </Text>
          </View>
        );
      default:
        return (
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? 'white' : colors.text }
          ]}>
            {message.content}
          </Text>
        );
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

  const handleLongPress = (event: any) => {
    onLongPress?.(event);
  };

  // Handle swipe gestures for reactions
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: slideAnim } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      if (Math.abs(translationX) > 50) {
        setShowReactions(true);
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      enabled={!isOwnMessage}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { scale: scaleAnim },
              { translateX: slideAnim }
            ]
          }
        ]}
      >
        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}>
          {/* Avatar */}
          {showAvatar && !isOwnMessage && (
            <View style={styles.avatarContainer}>
              <Avatar
                source={message.sender.avatar}
                size={32}
                name={message.sender.name}
                isOnline={message.sender.status === 'online'}
              />
            </View>
          )}

          {/* Message Content */}
          <View style={[
            styles.bubbleContainer,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            {
              backgroundColor: isOwnMessage ? COLORS.primary : colors.card,
              borderColor: colors.border
            }
          ]}>
            {/* Reply to message */}
            {message.replyToMessage && (
              <View style={[
                styles.replyContainer,
                {
                  backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                }
              ]}>
                <Text style={[
                  styles.replyText,
                  { color: isOwnMessage ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                ]}>
                  {message.replyToMessage.content.substring(0, 50)}...
                </Text>
              </View>
            )}

            {/* Message content */}
            {getMessageContent()}

            {/* Message metadata */}
            <View style={styles.metadataContainer}>
              <View style={styles.metadataLeft}>
                {getPriorityIcon()}
                {message.isEncrypted && (
                  <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
                )}
              </View>
              
              <View style={styles.metadataRight}>
                {showTimestamp && (
                  <Text style={[
                    styles.timestamp,
                    { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                  ]}>
                    {getMessageTime()}
                  </Text>
                )}
                {isOwnMessage && getStatusIcon()}
              </View>
            </View>
          </View>

          {/* Avatar for own messages */}
          {showAvatar && isOwnMessage && (
            <View style={styles.avatarContainer}>
              <Avatar
                source={message.sender.avatar}
                size={32}
                name={message.sender.name}
                isOnline={message.sender.status === 'online'}
              />
            </View>
          )}
        </View>

        {/* Message reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <View style={[
            styles.reactionsContainer,
            isOwnMessage ? styles.ownReactions : styles.otherReactions
          ]}>
            <MessageReactions
              reactions={message.reactions}
              onReactionPress={(reaction) => {
                onReaction?.(message.id, reaction);
              }}
            />
          </View>
        )}

        {/* Reactions modal */}
        <Modal
          visible={showReactions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowReactions(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowReactions(false)}
          >
            <View style={[styles.reactionsContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.reactionsTitle, { color: colors.text }]}>
                Add Reaction
              </Text>
              <View style={styles.reactionsGrid}>
                {['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏'].map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.reactionButton}
                    onPress={() => {
                      onReaction?.(message.id, emoji);
                      setShowReactions(false);
                    }}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    marginHorizontal: SPACING.md,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: SPACING.xs,
  },
  bubbleContainer: {
    maxWidth: '70%',
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  replyContainer: {
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  replyText: {
    fontSize: FONTS.sizes.xs,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: FONTS.sizes.md,
    lineHeight: 20,
  },
  imageContainer: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: FONTS.sizes.sm,
  },
  videoContainer: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    fontSize: FONTS.sizes.sm,
  },
  audioContainer: {
    width: 200,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPlaceholder: {
    fontSize: FONTS.sizes.sm,
  },
  fileContainer: {
    width: 200,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filePlaceholder: {
    fontSize: FONTS.sizes.sm,
  },
  locationContainer: {
    width: 200,
    height: 120,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPlaceholder: {
    fontSize: FONTS.sizes.sm,
  },
  contactContainer: {
    width: 200,
    height: 100,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactPlaceholder: {
    fontSize: FONTS.sizes.sm,
  },
  pollContainer: {
    width: 200,
    minHeight: 100,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  pollPlaceholder: {
    fontSize: FONTS.sizes.sm,
  },
  systemContainer: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginVertical: SPACING.sm,
  },
  systemText: {
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  metadataLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: FONTS.sizes.xs,
    marginRight: SPACING.xs,
  },
  reactionsContainer: {
    marginTop: SPACING.xs,
  },
  ownReactions: {
    alignItems: 'flex-end',
  },
  otherReactions: {
    alignItems: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionsContainer: {
    padding: SPACING.lg,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reactionsTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  reactionButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: SPACING.xs,
  },
  reactionEmoji: {
    fontSize: 24,
  },
});

export default MessageBubble; 
