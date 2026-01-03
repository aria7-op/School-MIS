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

const REACTIONS = [
  '👍','❤️','😂','🎉','😮','😢','🙏','🔥','👏','😡','🤔','💯','🥳','😎','🤩','🙌','😅','😆','😱','😇','😏','😬','😴','🤯','🤗','😋','😜','😝','😤','😢','😭','😳','😡','😠','🤬','😷','🤒','🤕','🤢','🤮','🥴','😇','🥳','🥺','🤠','🤡','🤥','🤫','🤭','🧐','🤓','😈','👿','👹','👺','💀','👻','👽','🤖','💩'
];

interface ReactionPickerProps {
  onSelect: (reaction: string) => void;
  onClose: () => void;
  frequentlyUsed?: string[];
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose, frequentlyUsed = [] }) => {
  const { colors } = useTheme();
  const reactionsToShow = [...new Set([...frequentlyUsed, ...REACTIONS])].slice(0, 40);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>  
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>  
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pick a Reaction</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      {/* Reaction grid */}
      <FlatList
        data={reactionsToShow}
        numColumns={8}
        keyExtractor={(item, idx) => item + idx}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.reactionButton}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.reaction}>{item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.reactionGrid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: SPACING.lg,
    maxHeight: 350,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  reactionGrid: {
    padding: SPACING.md,
  },
  reactionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: 18,
  },
  reaction: {
    fontSize: 24,
  },
});

export default ReactionPicker; 
