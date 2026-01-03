import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Modal,
  Animated,
  PanGestureHandler,
  State
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRole } from '../../../contexts/RoleContext';
import useMessaging, { 
  useConversations, 
  useMessages, 
  useTyping, 
  useSearch,
  usePolls,
  useFileUpload,
  useAI,
  useCalls
} from '../hooks/useMessaging';
import ConversationList from '../components/ConversationList';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import ConversationHeader from '../components/ConversationHeader';
import SearchBar from '../components/SearchBar';
import PollCreator from '../components/PollCreator';
import FileUploader from '../components/FileUploader';
import AIPanel from '../components/AIPanel';
import CallInterface from '../components/CallInterface';
import EmojiPicker from '../components/EmojiPicker';
import MessageReactions from '../components/MessageReactions';
import ConversationSettings from '../components/ConversationSettings';
import MessageSearch from '../components/MessageSearch';
import TypingIndicator from '../components/TypingIndicator';
import UnreadBadge from '../components/UnreadBadge';
import { COLORS, SPACING, FONTS } from '../../../theme';
import {
  Message,
  Conversation,
  MessageType,
  MessagePriority,
  SearchFilters,
  Poll
} from '../types';

const { width, height } = Dimensions.get('window');

const MessagingScreen: React.FC = () => {
  const { colors, dark } = useTheme();
  const { t } = useTranslation();
  const { canAccessFeature } = useRole();
  
  // Messaging hooks
  const {
    messages,
    conversations,
    currentConversation,
    unreadCount,
    isLoading,
    error,
    sendMessage,
    createConversation,
    markAsRead,
    deleteMessage,
    searchMessages,
    loadMoreMessages,
    startTyping,
    stopTyping,
    isConnected
  } = useMessaging();

  const { searchResults, isSearching, search, clearSearch } = useSearch();
  const { createPoll, votePoll } = usePolls(currentConversation?.id || null);
  const { uploading, uploadProgress, uploadFile } = useFileUpload(currentConversation?.id || null);
  const { aiResponse, isLoading: aiLoading, requestAI } = useAI(currentConversation?.id || null);
  const { currentCall, incomingCall, startCall, answerCall, declineCall, endCall } = useCalls(currentConversation?.id || null);

  // Local state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCallInterface, setShowCallInterface] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Check permissions
    if (!canAccessFeature('messaging')) {
      Alert.alert('Access Denied', 'You do not have permission to access messaging features.');
    }
  }, []);

  useEffect(() => {
    if (currentConversation) {
      setSelectedConversationId(currentConversation.id);
      // Mark messages as read when conversation is selected
      messages.forEach(message => {
        if (!message.isRead && message.senderId !== 'currentUser') {
          markAsRead(message.id);
        }
      });
    }
  }, [currentConversation, messages]);

  // Handle typing
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 2000);
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    stopTyping();
  };

  // Handle message sending
  const handleSendMessage = async (content: string, options: MessageSendOptions = {}) => {
    if (!content.trim() || !selectedConversationId) return;

    try {
      await sendMessage(content, {
        ...options,
        replyToId: replyToMessage?.id,
        metadata: {
          ...options.metadata,
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
        }
      });

      setInputText('');
      setReplyToMessage(null);
      handleTypingStop();
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
    setShowConversationList(false);
    setShowSearch(false);
    setShowPollCreator(false);
    setShowFileUploader(false);
    setShowAIPanel(false);
    setShowEmojiPicker(false);
    setShowSettings(false);
    setShowMessageSearch(false);
  };

  // Handle message actions
  const handleMessageLongPress = (message: Message) => {
    setSelectedMessage(message);
    Alert.alert(
      'Message Options',
      'What would you like to do with this message?',
      [
        { text: 'Reply', onPress: () => setReplyToMessage(message) },
        { text: 'Forward', onPress: () => handleForwardMessage(message) },
        { text: 'Copy', onPress: () => handleCopyMessage(message) },
        { text: 'Delete', onPress: () => handleDeleteMessage(message), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleForwardMessage = (message: Message) => {
    // Implementation for forwarding message
    Alert.alert('Forward', 'Select conversation to forward to...');
  };

  const handleCopyMessage = (message: Message) => {
    // Implementation for copying message
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const handleDeleteMessage = async (message: Message) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(message.id);
              setSelectedMessage(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      await uploadFile(file);
      setShowFileUploader(false);
    } catch (error) {
      Alert.alert('Upload Failed', 'Failed to upload file. Please try again.');
    }
  };

  // Handle poll creation
  const handlePollCreate = (pollData: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
    duration?: number;
    isAnonymous?: boolean;
  }) => {
    createPoll(pollData);
    setShowPollCreator(false);
  };

  // Handle AI request
  const handleAIRequest = (type: string, context: string) => {
    requestAI(type, context);
  };

  // Handle call actions
  const handleStartCall = (callType: string = 'AUDIO') => {
    startCall(callType);
    setShowCallInterface(true);
  };

  const handleAnswerCall = () => {
    if (incomingCall) {
      answerCall(incomingCall.callId);
      setShowCallInterface(true);
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall) {
      declineCall(incomingCall.callId);
    }
  };

  const handleEndCall = () => {
    endCall();
    setShowCallInterface(false);
  };

  // Render methods
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowConversationList(!showConversationList)}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('messaging')}
          </Text>
          {!isConnected && (
            <Text style={[styles.connectionStatus, { color: COLORS.error }]}>
              {t('disconnected')}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Ionicons name="search" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowMessageSearch(true)}
        >
          <Ionicons name="document-text" size={24} color={colors.text} />
        </TouchableOpacity>

        {unreadCount > 0 && (
          <UnreadBadge count={unreadCount} />
        )}
      </View>
    </View>
  );

  const renderConversationList = () => (
    <Animated.View
      style={[
        styles.conversationListContainer,
        {
          transform: [{ translateX: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-width, 0]
          })}],
          opacity: fadeAnim
        }
      ]}
    >
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onConversationSelect={handleConversationSelect}
        onConversationLongPress={(conversation) => {
          Alert.alert('Conversation Options', 'What would you like to do?', [
            { text: 'Pin', onPress: () => {} },
            { text: 'Archive', onPress: () => {} },
            { text: 'Delete', onPress: () => {}, style: 'destructive' },
            { text: 'Cancel', style: 'cancel' }
          ]);
        }}
      />
    </Animated.View>
  );

  const renderMessageArea = () => (
    <View style={[styles.messageArea, { backgroundColor: colors.background }]}>
      {currentConversation ? (
        <>
          <ConversationHeader
            conversation={currentConversation}
            onBack={() => setSelectedConversationId(null)}
            onMenuPress={() => setShowSettings(true)}
            onSearchPress={() => setShowMessageSearch(true)}
            onCallPress={() => handleStartCall()}
          />

          <MessageList
            messages={messages}
            onMessageLongPress={handleMessageLongPress}
            onMessageReaction={(messageId, reaction) => {
              // Handle message reaction
            }}
            onLoadMore={loadMoreMessages}
            isLoading={isLoading}
            ref={scrollViewRef}
          />

          {replyToMessage && (
            <View style={[styles.replyContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.replyText, { color: colors.text }]}>
                Replying to: {replyToMessage.content.substring(0, 50)}...
              </Text>
              <TouchableOpacity
                onPress={() => setReplyToMessage(null)}
                style={styles.closeReplyButton}
              >
                <Ionicons name="close" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}

          <TypingIndicator
            typingUsers={useTyping(selectedConversationId)}
            conversationId={selectedConversationId}
          />

          <MessageInput
            value={inputText}
            onChangeText={(text) => {
              setInputText(text);
              handleTypingStart();
            }}
            onSend={(content, options) => handleSendMessage(content, options)}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            onAttachmentPress={() => setShowFileUploader(true)}
            onEmojiPress={() => setShowEmojiPicker(true)}
            onPollPress={() => setShowPollCreator(true)}
            onAIPress={() => setShowAIPanel(true)}
            onCallPress={() => handleStartCall()}
            replyToMessage={replyToMessage}
            disabled={!isConnected}
            placeholder={t('typeMessage')}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={64} color={colors.text} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            {t('selectConversation')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderModals = () => (
    <>
      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SearchBar
          onSearch={search}
          onClear={clearSearch}
          isLoading={isSearching}
          onClose={() => setShowSearch(false)}
        />
      </Modal>

      {/* Poll Creator Modal */}
      <Modal
        visible={showPollCreator}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PollCreator
          onPollCreated={handlePollCreate}
          onCancel={() => setShowPollCreator(false)}
        />
      </Modal>

      {/* File Uploader Modal */}
      <Modal
        visible={showFileUploader}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <FileUploader
          onFileUploaded={handleFileUpload}
          onUploadError={(error) => Alert.alert('Upload Error', error)}
          onClose={() => setShowFileUploader(false)}
          maxFileSize={10 * 1024 * 1024} // 10MB
          allowedTypes={['image/*', 'video/*', 'audio/*', 'application/*']}
        />
      </Modal>

      {/* AI Panel Modal */}
      <Modal
        visible={showAIPanel}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AIPanel
          onAIRequest={handleAIRequest}
          response={aiResponse}
          isLoading={aiLoading}
          onClose={() => setShowAIPanel(false)}
        />
      </Modal>

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        animationType="slide"
        transparent={true}
      >
        <EmojiPicker
          onEmojiSelect={(emoji) => {
            setInputText(prev => prev + emoji);
            setShowEmojiPicker(false);
          }}
          onClose={() => setShowEmojiPicker(false)}
          visible={showEmojiPicker}
        />
      </Modal>

      {/* Conversation Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ConversationSettings
          conversation={currentConversation!}
          onSettingsUpdate={(settings) => {
            // Handle settings update
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      </Modal>

      {/* Message Search Modal */}
      <Modal
        visible={showMessageSearch}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <MessageSearch
          onSearch={search}
          onClear={clearSearch}
          results={searchResults}
          isLoading={isSearching}
          onClose={() => setShowMessageSearch(false)}
        />
      </Modal>

      {/* Call Interface */}
      {showCallInterface && (
        <CallInterface
          call={currentCall}
          onEndCall={handleEndCall}
          onClose={() => setShowCallInterface(false)}
        />
      )}

      {/* Incoming Call Alert */}
      {incomingCall && (
        <View style={styles.incomingCallContainer}>
          <View style={[styles.incomingCallCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.incomingCallText, { color: colors.text }]}>
              Incoming Call
            </Text>
            <Text style={[styles.incomingCallName, { color: colors.text }]}>
              {incomingCall.callerName}
            </Text>
            <View style={styles.incomingCallButtons}>
              <TouchableOpacity
                style={[styles.callButton, styles.answerButton]}
                onPress={handleAnswerCall}
              >
                <Ionicons name="call" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.callButton, styles.declineButton]}
                onPress={handleDeclineCall}
              >
                <Ionicons name="call-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {renderHeader()}

      <View style={styles.content}>
        {showConversationList && renderConversationList()}
        {renderMessageArea()}
      </View>

      {renderModals()}

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: COLORS.error }]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.errorRetryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  connectionStatus: {
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  conversationListContainer: {
    width: width * 0.35,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  messageArea: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.lg,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: 8,
  },
  replyText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
  },
  closeReplyButton: {
    padding: SPACING.xs,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  errorText: {
    color: 'white',
    fontSize: FONTS.sizes.sm,
    flex: 1,
  },
  errorRetryText: {
    color: 'white',
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  incomingCallContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingCallCard: {
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 300,
  },
  incomingCallText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.sm,
  },
  incomingCallName: {
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.lg,
  },
  incomingCallButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  callButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerButton: {
    backgroundColor: COLORS.success,
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
});

export default MessagingScreen; 
