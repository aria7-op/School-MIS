import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';
import { Message, Conversation } from '../types';

interface MessageSearchProps {
  onClose: () => void;
  onSelectMessage: (message: Message) => void;
  onSelectConversation: (conversation: Conversation) => void;
  isLoading?: boolean;
  results?: Array<Message | Conversation>;
  onSearch: (query: string, filters: any) => void;
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'media', label: 'Media' },
  { key: 'files', label: 'Files' },
  { key: 'links', label: 'Links' },
  { key: 'polls', label: 'Polls' },
  { key: 'ai', label: 'AI' },
];

const MessageSearch: React.FC<MessageSearchProps> = ({
  onClose,
  onSelectMessage,
  onSelectConversation,
  isLoading = false,
  results = [],
  onSearch
}) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const handleSearch = (text: string) => {
    setQuery(text);
    onSearch(text, { filter: activeFilter });
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    onSearch(query, { filter });
  };

  const renderResult = ({ item }: { item: Message | Conversation }) => {
    if ('content' in item) {
      // Message
      return (
        <TouchableOpacity style={styles.resultItem} onPress={() => onSelectMessage(item)}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>{item.sender.name}</Text>
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{item.content}</Text>
          <Text style={[styles.resultTime, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleString()}</Text>
        </TouchableOpacity>
      );
    } else {
      // Conversation
      return (
        <TouchableOpacity style={styles.resultItem} onPress={() => onSelectConversation(item)}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>{item.name || 'Unnamed Conversation'}</Text>
          <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>{item.participants.length} participants</Text>
          <Text style={[styles.resultTime, { color: colors.textSecondary }]}>{new Date(item.lastActivityAt).toLocaleString()}</Text>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>  
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>  
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Search Messages</Text>
        <View style={styles.headerSpacer} />
      </View>
      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>  
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search messages, files, links..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleSearch}
          autoFocus={true}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {/* Filters */}
      <View style={styles.filtersRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterButton, activeFilter === f.key && { backgroundColor: COLORS.primary }]}
            onPress={() => handleFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && { color: 'white' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={item => ('content' in item ? item.id : item.id)}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No results found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  closeButton: { padding: SPACING.sm },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  headerSpacer: { width: 48 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    fontSize: FONTS.sizes.md,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.border,
  },
  filterText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
  },
  resultsList: { flex: 1 },
  resultsContainer: { paddingBottom: SPACING.lg },
  resultItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: FONTS.sizes.sm,
    marginBottom: 2,
  },
  resultTime: {
    fontSize: FONTS.sizes.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
});

export default MessageSearch; 
