import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  State,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';
import {
  MessageType,
  MessagePriority,
  MessageSendOptions
} from '../types';
import EmojiPicker from './EmojiPicker';
import AttachmentPicker from './AttachmentPicker';
import VoiceRecorder from './VoiceRecorder';
import AISuggestions from './AISuggestions';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (content: string, options?: MessageSendOptions) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onAttachmentPress: () => void;
  onEmojiPress: () => void;
  onPollPress: () => void;
  onAIPress: () => void;
  onCallPress: () => void;
  replyToMessage?: any;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  onSend,
  onTypingStart,
  onTypingStop,
  onAttachmentPress,
  onEmojiPress,
  onPollPress,
  onAIPress,
  onCallPress,
  replyToMessage,
  disabled = false,
  placeholder = "Type a message..."
}) => {
  const { colors, dark } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const [selectedPriority, setSelectedPriority] = useState<MessagePriority>(MessagePriority.NORMAL);

  // Refs
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Animations
  const inputAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const attachmentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate input on mount
    Animated.spring(inputAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  // Handle text change
  const handleTextChange = (text: string) => {
    onChangeText(text);
    
    // Handle typing indicators
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop();
    }, 2000);
  };

  // Handle send
  const handleSend = () => {
    if (!value.trim() || disabled) return;

    const options: MessageSendOptions = {
      priority: selectedPriority,
      replyToId: replyToMessage?.id,
      metadata: {
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        inputMethod: 'text'
      }
    };

    onSend(value.trim(), options);
    setSelectedPriority(MessagePriority.NORMAL);
  };

  // Handle voice recording
  const handleVoiceRecording = () => {
    setIsRecording(!isRecording);
  };

  // Handle attachment selection
  const handleAttachmentSelect = (type: string) => {
    setShowAttachments(false);
    switch (type) {
      case 'camera':
        // Handle camera
        break;
      case 'gallery':
        onAttachmentPress();
        break;
      case 'document':
        // Handle document picker
        break;
      case 'location':
        // Handle location
        break;
      case 'contact':
        // Handle contact picker
        break;
      case 'poll':
        onPollPress();
        break;
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    onChangeText(value + emoji);
    setShowEmojiPicker(false);
  };

  // Handle AI suggestion
  const handleAISuggestion = (suggestion: string) => {
    onChangeText(suggestion);
    setShowAISuggestions(false);
  };

  // Handle priority selection
  const handlePrioritySelect = (priority: MessagePriority) => {
    setSelectedPriority(priority);
  };

  // Handle input focus
  const handleInputFocus = () => {
    Animated.spring(buttonAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleInputBlur = () => {
    Animated.spring(buttonAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  // Render priority selector
  const renderPrioritySelector = () => (
    <View style={styles.priorityContainer}>
      {Object.values(MessagePriority).map((priority) => (
        <TouchableOpacity
          key={priority}
          style={[
            styles.priorityButton,
            selectedPriority === priority && { backgroundColor: COLORS.primary }
          ]}
          onPress={() => handlePrioritySelect(priority)}
        >
          <Text style={[
            styles.priorityText,
            selectedPriority === priority && { color: 'white' }
          ]}>
            {priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render attachment menu
  const renderAttachmentMenu = () => (
    <Modal
      visible={showAttachments}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowAttachments(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowAttachments(false)}
      >
        <Animated.View
          style={[
            styles.attachmentMenu,
            {
              backgroundColor: colors.card,
              transform: [{
                scale: attachmentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }],
              opacity: attachmentAnim
            }
          ]}
        >
          <View style={styles.attachmentGrid}>
            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={() => handleAttachmentSelect('camera')}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
              <Text style={[styles.attachmentText, { color: colors.text }]}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={() => handleAttachmentSelect('gallery')}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: COLORS.success }]}>
                <Ionicons name="images" size={20} color="white" />
              </View>
              <Text style={[styles.attachmentText, { color: colors.text }]}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={() => handleAttachmentSelect('document')}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: COLORS.warning }]}>
                <Ionicons name="document" size={20} color="white" />
              </View>
              <Text style={[styles.attachmentText, { color: colors.text }]}>Document</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={() => handleAttachmentSelect('location')}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: COLORS.info }]}>
                <Ionicons name="location" size={20} color="white" />
              </View>
              <Text style={[styles.attachmentText, { color: colors.text }]}>Location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={() => handleAttachmentSelect('contact')}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: COLORS.secondary }]}>
                <Ionicons name="person" size={20} color="white" />
              </View>
              <Text style={[styles.attachmentText, { color: colors.text }]}>Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentItem}
              onPress={() => handleAttachmentSelect('poll')}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="bar-chart" size={20} color="white" />
              </View>
              <Text style={[styles.attachmentText, { color: colors.text }]}>Poll</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Reply preview */}
      {replyToMessage && (
        <View style={[styles.replyPreview, { backgroundColor: colors.card }]}>
          <Text style={[styles.replyText, { color: colors.text }]}>
            Replying to: {replyToMessage.content.substring(0, 50)}...
          </Text>
          <TouchableOpacity
            onPress={() => {
              // Clear reply
            }}
            style={styles.closeReplyButton}
          >
            <Ionicons name="close" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Priority selector */}
      {selectedPriority !== MessagePriority.NORMAL && renderPrioritySelector()}

      {/* Input container */}
      <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        {/* Left buttons */}
        <View style={styles.leftButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { opacity: disabled ? 0.5 : 1 }]}
            onPress={() => setShowAttachments(true)}
            disabled={disabled}
          >
            <Ionicons name="add" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { opacity: disabled ? 0.5 : 1 }]}
            onPress={onEmojiPress}
            disabled={disabled}
          >
            <Ionicons name="happy" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { opacity: disabled ? 0.5 : 1 }]}
            onPress={onAIPress}
            disabled={disabled}
          >
            <Ionicons name="sparkles" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Text input */}
        <Animated.View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{
                scale: inputAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1]
                })
              }]
            }
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              {
                color: colors.text,
                height: Math.max(40, inputHeight)
              }
            ]}
            value={value}
            onChangeText={handleTextChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onContentSizeChange={(event) => {
              setInputHeight(event.nativeEvent.contentSize.height);
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            multiline={true}
            maxLength={1000}
            editable={!disabled}
          />
        </Animated.View>

        {/* Right buttons */}
        <View style={styles.rightButtons}>
          {isRecording ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.recordingButton]}
              onPress={handleVoiceRecording}
            >
              <Ionicons name="stop" size={24} color="white" />
            </TouchableOpacity>
          ) : value.trim() ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton]}
              onPress={handleSend}
              disabled={disabled}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { opacity: disabled ? 0.5 : 1 }]}
              onPress={handleVoiceRecording}
              disabled={disabled}
            >
              <Ionicons name="mic" size={24} color={colors.text} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { opacity: disabled ? 0.5 : 1 }]}
            onPress={onCallPress}
            disabled={disabled}
          >
            <Ionicons name="call" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      {renderAttachmentMenu()}

      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
          visible={showEmojiPicker}
        />
      </Modal>

      <Modal
        visible={showAISuggestions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAISuggestions(false)}
      >
        <AISuggestions
          onSuggestionSelect={handleAISuggestion}
          onClose={() => setShowAISuggestions(false)}
        />
      </Modal>

      {/* Voice recorder overlay */}
      {isRecording && (
        <VoiceRecorder
          onRecordingComplete={(audioData) => {
            setIsRecording(false);
            // Handle audio data
          }}
          onRecordingCancel={() => {
            setIsRecording(false);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  replyPreview: {
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
  priorityContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  priorityButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.light,
  },
  priorityText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  leftButtons: {
    flexDirection: 'row',
    marginRight: SPACING.sm,
  },
  rightButtons: {
    flexDirection: 'row',
    marginLeft: SPACING.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
  },
  recordingButton: {
    backgroundColor: COLORS.error,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  textInput: {
    fontSize: FONTS.sizes.md,
    lineHeight: 20,
    padding: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentMenu: {
    padding: SPACING.lg,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  attachmentItem: {
    alignItems: 'center',
    margin: SPACING.sm,
    width: 80,
  },
  attachmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  attachmentText: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
  },
});

export default MessageInput; 
