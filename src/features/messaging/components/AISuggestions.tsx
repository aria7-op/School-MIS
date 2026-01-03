import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';

interface AISuggestion {
  id: string;
  text: string;
  type: 'reply' | 'question' | 'action' | 'emotion';
  confidence: number;
  context?: string;
}

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onSuggestionPress: (suggestion: AISuggestion) => void;
  isLoading?: boolean;
  onClose?: () => void;
  maxSuggestions?: number;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({
  suggestions,
  onSuggestionPress,
  isLoading = false,
  onClose,
  maxSuggestions = 3
}) => {
  const { colors } = useTheme();
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'reply':
        return 'chatbubble-ellipses';
      case 'question':
        return 'help-circle';
      case 'action':
        return 'flash';
      case 'emotion':
        return 'heart';
      default:
        return 'bulb';
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'reply':
        return COLORS.primary;
      case 'question':
        return COLORS.info;
      case 'action':
        return COLORS.warning;
      case 'emotion':
        return COLORS.error;
      default:
        return COLORS.secondary;
    }
  };

  const handleSuggestionPress = (suggestion: AISuggestion) => {
    setSelectedSuggestion(suggestion.id);
    onSuggestionPress(suggestion);
  };

  const renderSuggestion = ({ item }: { item: AISuggestion }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: selectedSuggestion === item.id ? 2 : 1
        }
      ]}
      onPress={() => handleSuggestionPress(item)}
    >
      <View style={styles.suggestionHeader}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getSuggestionColor(item.type) }
        ]}>
          <Ionicons 
            name={getSuggestionIcon(item.type) as any} 
            size={16} 
            color="white" 
          />
        </View>
        <Text style={[styles.suggestionType, { color: colors.textSecondary }]}>
          {item.type.toUpperCase()}
        </Text>
        <View style={styles.confidenceContainer}>
          <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
            {Math.round(item.confidence * 100)}%
          </Text>
        </View>
      </View>
      
      <Text style={[styles.suggestionText, { color: colors.text }]}>
        {item.text}
      </Text>
      
      {item.context && (
        <Text style={[styles.contextText, { color: colors.textSecondary }]}>
          Based on: {item.context}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            AI is thinking...
          </Text>
        </View>
      </View>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={20} color={COLORS.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            AI Suggestions
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={suggestions.slice(0, maxSuggestions)}
        renderItem={renderSuggestion}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    maxHeight: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.sm,
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
  suggestionsList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  suggestionItem: {
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  suggestionType: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    flex: 1,
  },
  confidenceContainer: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
  },
  suggestionText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    marginBottom: SPACING.xs,
  },
  contextText: {
    fontSize: FONTS.sizes.xs,
    fontStyle: 'italic',
  },
});

export default AISuggestions; 
