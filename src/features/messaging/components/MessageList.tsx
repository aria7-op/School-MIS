import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
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
import MessageBubble from './MessageBubble';
import MessageReactions from './MessageReactions';
import MessageContextMenu from './MessageContextMenu';
import DateSeparator from './DateSeparator';
import { useUserStatus } from '../hooks/useMessaging';

interface MessageListProps {
  messages: Message[];
  onMessageLongPress: (message: Message) => void;
  onMessageReaction: (messageId: string, reaction: string) => void;
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore?: boolean;
}

export interface MessageListRef {
  scrollToBottom: () => void;
  scrollToMessage: (messageId: string) => void;
}

const MessageList = forwardRef<MessageListRef, MessageListProps>(({
  messages,
  onMessageLongPress,
  onMessageReaction,
  onLoadMore,
  isLoading,
  hasMore = true
}, ref) => {
  const { colors, dark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showReactions, setShowReactions] = useState(false);
  const [selectedMessageForReactions, setSelectedMessageForReactions] = useState<Message | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const scrollToBottomAnim = useRef(new Animated.Value(0)).current;

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (messages.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    },
    scrollToMessage: (messageId: string) => {
      const index = messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5
        });
      }
    }
  }));

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  // Flatten grouped messages with separators
  const renderData = Object.entries(groupedMessages).flatMap(([date, messages]) => [
    { type: 'separator', date, id: `separator-${date}` },
    ...messages.map(message => ({ type: 'message', message, id: message.id }))
  ]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onLoadMore();
    } finally {
      setRefreshing(false);
    }
  };

  // Handle message long press
  const handleMessageLongPress = (message: Message, event: any) => {
    setSelectedMessage(message);
    
    // Get position for context menu
    event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setContextMenuPosition({ x: pageX, y: pageY });
      setShowContextMenu(true);
    });
  };

  // Handle message reaction
  const handleMessageReaction = (messageId: string, reaction: string) => {
    onMessageReaction(messageId, reaction);
    setShowReactions(false);
    setSelectedMessageForReactions(null);
  };

  // Handle context menu actions
  const handleContextMenuAction = (action: string) => {
    if (!selectedMessage) return;

    switch (action) {
      case 'reply':
        // Handle reply
        break;
      case 'forward':
        // Handle forward
        break;
      case 'copy':
        // Handle copy
        break;
      case 'react':
        setSelectedMessageForReactions(selectedMessage);
        setShowReactions(true);
        setShowContextMenu(false);
        break;
      case 'delete':
        Alert.alert(
          'Delete Message',
          'Are you sure you want to delete this message?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: () => {
                onMessageLongPress(selectedMessage);
              }
            }
          ]
        );
        break;
    }
    setShowContextMenu(false);
  };

  // Render message item
  const renderMessageItem = ({ item }: { item: any }) => {
    if (item.type === 'separator') {
      return (
        <DateSeparator
          date={new Date(item.date)}
          key={item.id}
        />
      );
    }

    const message = item.message;
    const isOwnMessage = message.senderId === 'currentUser'; // Replace with actual user ID
    const showAvatar = !isOwnMessage;
    const showTimestamp = true;

    return (
      <MessageBubble
        key={message.id}
        message={message}
        isOwnMessage={isOwnMessage}
        showAvatar={showAvatar}
        showTimestamp={showTimestamp}
        onReply={() => {
          // Handle reply
        }}
        onReaction={(reaction) => {
          handleMessageReaction(message.id, reaction);
        }}
        onLongPress={(event) => handleMessageLongPress(message, event)}
      />
    );
  };

  // Render loading indicator
  const renderLoadingIndicator = () => {
    if (!isLoading || !hasMore) return null;

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading more messages...
        </Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        No messages yet
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
        Start the conversation by sending a message
      </Text>
    </View>
  );

  // Handle end reached
  const handleEndReached = () => {
    if (hasMore && !isLoading) {
      onLoadMore();
    }
  };

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage.senderId === 'currentUser';
      
      // Auto-scroll for own messages or if near bottom
      if (isOwnMessage) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  }, [messages]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={renderData}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={renderLoadingIndicator}
        ListEmptyComponent={renderEmptyState}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={20}
        getItemLayout={(data, index) => ({
          length: 80, // Approximate item height
          offset: 80 * index,
          index,
        })}
      />

      {/* Scroll to bottom button */}
      {messages.length > 10 && (
        <Animated.View
          style={[
            styles.scrollToBottomButton,
            {
              transform: [{
                translateY: scrollToBottomAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0]
                })
              }],
              opacity: scrollToBottomAnim
            }
          ]}
        >
          <TouchableOpacity
            style={[styles.scrollButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
          >
            <Ionicons name="arrow-down" size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Context Menu */}
      <Modal
        visible={showContextMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContextMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowContextMenu(false)}
        >
          <View
            style={[
              styles.contextMenu,
              {
                backgroundColor: colors.card,
                left: contextMenuPosition.x,
                top: contextMenuPosition.y - 100
              }
            ]}
          >
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => handleContextMenuAction('reply')}
            >
              <Ionicons name="arrow-undo" size={16} color={colors.text} />
              <Text style={[styles.contextMenuText, { color: colors.text }]}>Reply</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => handleContextMenuAction('forward')}
            >
              <Ionicons name="arrow-forward" size={16} color={colors.text} />
              <Text style={[styles.contextMenuText, { color: colors.text }]}>Forward</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => handleContextMenuAction('copy')}
            >
              <Ionicons name="copy" size={16} color={colors.text} />
              <Text style={[styles.contextMenuText, { color: colors.text }]}>Copy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => handleContextMenuAction('react')}
            >
              <Ionicons name="happy" size={16} color={colors.text} />
              <Text style={[styles.contextMenuText, { color: colors.text }]}>React</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.contextMenuItem}
              onPress={() => handleContextMenuAction('delete')}
            >
              <Ionicons name="trash" size={16} color={COLORS.error} />
              <Text style={[styles.contextMenuText, { color: COLORS.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reactions Modal */}
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
                  onPress={() => handleMessageReaction(selectedMessageForReactions!.id, emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: SPACING.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  loadingText: {
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyStateSubtitle: {
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
  },
  scrollButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  contextMenu: {
    position: 'absolute',
    borderRadius: 8,
    padding: SPACING.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  contextMenuText: {
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.sm,
  },
  reactionsContainer: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.lg,
    right: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
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

export default MessageList; 
