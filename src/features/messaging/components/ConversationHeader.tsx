import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';
import { Conversation, UserStatus } from '../types';
import Avatar from '../../../components/ui/Avatar';

interface ConversationHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  onMenuPress: () => void;
  onSearchPress: () => void;
  onCallPress: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  onBack,
  onMenuPress,
  onSearchPress,
  onCallPress
}) => {
  const { colors, dark } = useTheme();

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'DIRECT' && conversation.participants.length > 0) {
      return conversation.participants[0].user.name;
    }
    return 'Unnamed Conversation';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'DIRECT' && conversation.participants.length > 0) {
      return conversation.participants[0].user.avatar;
    }
    return null;
  };

  const getParticipantCount = () => {
    if (conversation.type === 'DIRECT') return null;
    return `${conversation.participants.length} participants`;
  };

  const getOnlineCount = () => {
    const onlineParticipants = conversation.participants.filter(
      p => p.user.status === 'online'
    ).length;
    if (onlineParticipants === 0) return null;
    return `${onlineParticipants} online`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Left section */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.conversationInfo}>
          <Avatar
            source={getConversationAvatar()}
            size={40}
            name={getConversationName()}
            isOnline={conversation.participants.some(p => p.user.status === 'online')}
          />
          
          <View style={styles.conversationDetails}>
            <Text style={[styles.conversationName, { color: colors.text }]}>
              {getConversationName()}
            </Text>
            
            <View style={styles.conversationMeta}>
              {getParticipantCount() && (
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {getParticipantCount()}
                </Text>
              )}
              {getOnlineCount() && (
                <Text style={[styles.metaText, { color: COLORS.success }]}>
                  {getOnlineCount()}
                </Text>
              )}
              {conversation.isEncrypted && (
                <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right section */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onSearchPress}
        >
          <Ionicons name="search" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onCallPress}
        >
          <Ionicons name="call" size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onMenuPress}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  conversationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversationDetails: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  conversationName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    marginBottom: 2,
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: FONTS.sizes.xs,
    marginRight: SPACING.xs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
});

export default ConversationHeader; 
