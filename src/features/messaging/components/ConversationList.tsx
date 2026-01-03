import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  PanGestureHandler,
  State,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from '../../../contexts/TranslationContext';
import { COLORS, SPACING, FONTS } from '../../../theme';
import {
  Conversation,
  ConversationType,
  UserStatus,
  MessageType
} from '../types';
import ConversationItem from './ConversationItem';
import ConversationSearch from './ConversationSearch';
import ConversationFilter from './ConversationFilter';
import CreateConversationModal from './CreateConversationModal';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (conversation: Conversation) => void;
  onConversationLongPress: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onConversationLongPress
}) => {
  const { colors, dark } = useTheme();
  const { t } = useTranslation();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ConversationType | 'ALL'>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'unread' | 'name'>('recent');

  // Animations
  const searchAnim = useRef(new Animated.Value(0)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;
  const createButtonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate create button
    Animated.spring(createButtonAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter(conversation => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = conversation.name?.toLowerCase().includes(query);
        const matchesDescription = conversation.description?.toLowerCase().includes(query);
        const matchesParticipants = conversation.participants.some(p => 
          p.user.name.toLowerCase().includes(query) || 
          p.user.email.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesDescription && !matchesParticipants) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'ALL' && conversation.type !== filterType) {
        return false;
      }

      // Archived filter
      if (!showArchived && conversation.isArchived) {
        return false;
      }

      // Pinned filter
      if (showPinned && !conversation.isPinned) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
        case 'unread':
          return (b.unreadCount || 0) - (a.unreadCount || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

  // Group conversations
  const groupedConversations = {
    pinned: filteredConversations.filter(c => c.isPinned),
    recent: filteredConversations.filter(c => !c.isPinned && c.unreadCount > 0),
    all: filteredConversations.filter(c => !c.isPinned && c.unreadCount === 0)
  };

  // Handle search toggle
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    Animated.spring(searchAnim, {
      toValue: showSearch ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  // Handle filter toggle
  const toggleFilter = () => {
    setShowFilter(!showFilter);
    Animated.spring(filterAnim, {
      toValue: showFilter ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    onConversationSelect(conversation);
  };

  // Handle conversation long press
  const handleConversationLongPress = (conversation: Conversation) => {
    Alert.alert(
      conversation.name || 'Conversation',
      'What would you like to do?',
      [
        {
          text: conversation.isPinned ? 'Unpin' : 'Pin',
          onPress: () => {
            // Handle pin/unpin
          }
        },
        {
          text: conversation.isArchived ? 'Unarchive' : 'Archive',
          onPress: () => {
            // Handle archive/unarchive
          }
        },
        {
          text: 'Mark as Read',
          onPress: () => {
            // Handle mark as read
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Conversation',
              'Are you sure you want to delete this conversation? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => {
                  // Handle delete
                }}
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Render conversation group
  const renderConversationGroup = (title: string, conversations: Conversation[]) => {
    if (conversations.length === 0) return null;

    return (
      <View style={styles.groupContainer}>
        <Text style={[styles.groupTitle, { color: colors.text }]}>
          {title}
        </Text>
        {conversations.map(conversation => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isSelected={conversation.id === selectedConversationId}
            onPress={() => handleConversationSelect(conversation)}
            onLongPress={() => handleConversationLongPress(conversation)}
          />
        ))}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.text} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        {searchQuery ? 'No conversations found' : 'No conversations yet'}
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Start a new conversation to begin messaging'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: COLORS.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>New Conversation</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('conversations')}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleSearch}
            >
              <Ionicons 
                name={showSearch ? "close" : "search"} 
                size={20} 
                color={colors.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleFilter}
            >
              <Ionicons 
                name="filter" 
                size={20} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <Animated.View
          style={[
            styles.searchContainer,
            {
              height: searchAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50]
              }),
              opacity: searchAnim
            }
          ]}
        >
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Animated.View>

        {/* Filter Bar */}
        <Animated.View
          style={[
            styles.filterContainer,
            {
              height: filterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 60]
              }),
              opacity: filterAnim
            }
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === 'ALL' && { backgroundColor: COLORS.primary }
              ]}
              onPress={() => setFilterType('ALL')}
            >
              <Text style={[
                styles.filterChipText,
                filterType === 'ALL' && { color: 'white' }
              ]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === ConversationType.DIRECT && { backgroundColor: COLORS.primary }
              ]}
              onPress={() => setFilterType(ConversationType.DIRECT)}
            >
              <Text style={[
                styles.filterChipText,
                filterType === ConversationType.DIRECT && { color: 'white' }
              ]}>
                Direct
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === ConversationType.GROUP && { backgroundColor: COLORS.primary }
              ]}
              onPress={() => setFilterType(ConversationType.GROUP)}
            >
              <Text style={[
                styles.filterChipText,
                filterType === ConversationType.GROUP && { color: 'white' }
              ]}>
                Groups
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                showArchived && { backgroundColor: COLORS.warning }
              ]}
              onPress={() => setShowArchived(!showArchived)}
            >
              <Text style={[
                styles.filterChipText,
                showArchived && { color: 'white' }
              ]}>
                Archived
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>

      {/* Conversation List */}
      <FlatList
        data={[]} // We're using custom rendering
        renderItem={() => null}
        ListHeaderComponent={() => (
          <>
            {renderConversationGroup('Pinned', groupedConversations.pinned)}
            {renderConversationGroup('Unread', groupedConversations.recent)}
            {renderConversationGroup('Recent', groupedConversations.all)}
          </>
        )}
        ListEmptyComponent={renderEmptyState}
        keyExtractor={() => 'header'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Create Conversation Button */}
      <Animated.View
        style={[
          styles.createButtonContainer,
          {
            transform: [{
              scale: createButtonAnim
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: COLORS.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Create Conversation Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <CreateConversationModal
          onConversationCreated={(conversation) => {
            setShowCreateModal(false);
            handleConversationSelect(conversation);
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    overflow: 'hidden',
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.sizes.sm,
    borderWidth: 1,
  },
  filterContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    overflow: 'hidden',
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.light,
  },
  filterChipText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
  },
  listContainer: {
    flexGrow: 1,
  },
  groupContainer: {
    marginBottom: SPACING.lg,
  },
  groupTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    marginBottom: SPACING.lg,
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.xs,
  },
});

export default ConversationList; 
