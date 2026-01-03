import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';
import { Message, Conversation } from '../types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  results?: Array<Message | Conversation>;
  onClose: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  isLoading = false,
  results = [],
  onClose
}) => {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const handleSearch = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  const renderResult = ({ item }: { item: Message | Conversation }) => {
    if ('content' in item) {
      // It's a Message
      return (
        <TouchableOpacity style={[styles.resultItem, { borderBottomColor: colors.border }]}>
          <View style={styles.resultContent}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              {item.sender.name}
            </Text>
            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
              {item.content}
            </Text>
            <Text style={[styles.resultTime, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      // It's a Conversation
      return (
        <TouchableOpacity style={[styles.resultItem, { borderBottomColor: colors.border }]}>
          <View style={styles.resultContent}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              {item.name || 'Unnamed Conversation'}
            </Text>
            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
              {item.participants.length} participants
            </Text>
            <Text style={[styles.resultTime, { color: colors.textSecondary }]}>
              {new Date(item.lastActivityAt).toLocaleDateString()}
            </Text>
          </View>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Search
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search messages and conversations..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleSearch}
          autoFocus={true}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {query.length > 0 && (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContainer}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No results found
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Searching...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
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
  resultsList: {
    flex: 1,
  },
  resultsContainer: {
    paddingBottom: SPACING.lg,
  },
  resultItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  resultContent: {
    flex: 1,
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
    padding: SPACING.md,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONTS.sizes.sm,
  },
});

export default SearchBar; 
