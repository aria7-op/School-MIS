import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';
import { MessageReaction } from '../types';
import Avatar from '../../../components/ui/Avatar';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onReactionPress?: (reaction: string) => void;
  onReactionLongPress?: (reaction: MessageReaction) => void;
  maxDisplayCount?: number;
}

const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onReactionPress,
  onReactionLongPress,
  maxDisplayCount = 5
}) => {
  const { colors } = useTheme();

  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  const reactionItems = Object.entries(groupedReactions).map(([emoji, reactions]) => ({
    emoji,
    count: reactions.length,
    users: reactions.map(r => r.user),
    isOwnReaction: reactions.some(r => r.userId === 'currentUser') // Replace with actual user ID
  }));

  const handleReactionPress = (emoji: string) => {
    onReactionPress?.(emoji);
  };

  const handleReactionLongPress = (emoji: string, users: any[]) => {
    // Show detailed reaction view

  };

  const renderReaction = ({ item }: { item: { emoji: string; count: number; users: any[]; isOwnReaction: boolean } }) => (
    <TouchableOpacity
      style={[
        styles.reactionContainer,
        { 
          backgroundColor: item.isOwnReaction ? COLORS.primary : colors.card,
          borderColor: colors.border
        }
      ]}
      onPress={() => handleReactionPress(item.emoji)}
      onLongPress={() => handleReactionLongPress(item.emoji, item.users)}
    >
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={[
        styles.count,
        { color: item.isOwnReaction ? 'white' : colors.text }
      ]}>
        {item.count}
      </Text>
    </TouchableOpacity>
  );

  const renderUserAvatars = () => {
    const allUsers = reactions.map(r => r.user).slice(0, 3);
    return (
      <View style={styles.avatarsContainer}>
        {allUsers.map((user, index) => (
          <View key={user.id} style={[styles.avatarWrapper, { zIndex: allUsers.length - index }]}>
            <Avatar
              source={user.avatar}
              name={user.name}
              size={20}
              showOnlineStatus={false}
            />
          </View>
        ))}
        {reactions.length > 3 && (
          <View style={[styles.moreIndicator, { backgroundColor: colors.card }]}>
            <Text style={[styles.moreText, { color: colors.textSecondary }]}>
              +{reactions.length - 3}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reactionItems}
        renderItem={renderReaction}
        keyExtractor={(item) => item.emoji}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reactionsList}
      />
      {reactions.length > 0 && renderUserAvatars()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  reactionsList: {
    paddingRight: SPACING.sm,
  },
  reactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: SPACING.xs,
  },
  emoji: {
    fontSize: FONTS.sizes.sm,
    marginRight: 2,
  },
  count: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginLeft: -8,
  },
  moreIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
  },
});

export default MessageReactions; 
