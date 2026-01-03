import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';

interface PollCreatorProps {
  onPollCreated: (pollData: {
    question: string;
    options: string[];
    allowMultiple: boolean;
    duration?: number;
    isAnonymous: boolean;
  }) => void;
  onCancel: () => void;
}

const PollCreator: React.FC<PollCreatorProps> = ({
  onPollCreated,
  onCancel
}) => {
  const { colors } = useTheme();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [duration, setDuration] = useState<number | undefined>(undefined);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    const validOptions = options.filter(option => option.trim());
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please enter at least 2 options');
      return;
    }

    onPollCreated({
      question: question.trim(),
      options: validOptions,
      allowMultiple,
      duration,
      isAnonymous
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Create Poll
        </Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: COLORS.primary }]}
          onPress={handleCreate}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Question
          </Text>
          <TextInput
            style={[styles.questionInput, { 
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Ask a question..."
            placeholderTextColor={colors.textSecondary}
            value={question}
            onChangeText={setQuestion}
            multiline={true}
            maxLength={200}
          />
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Options
          </Text>
          {options.map((option, index) => (
            <View key={index} style={styles.optionContainer}>
              <TextInput
                style={[styles.optionInput, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder={`Option ${index + 1}`}
                placeholderTextColor={colors.textSecondary}
                value={option}
                onChangeText={(value) => updateOption(index, value)}
                maxLength={100}
              />
              {options.length > 2 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeOption(index)}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {options.length < 6 && (
            <TouchableOpacity
              style={[styles.addButton, { borderColor: colors.border }]}
              onPress={addOption}
            >
              <Ionicons name="add" size={20} color={colors.text} />
              <Text style={[styles.addButtonText, { color: colors.text }]}>
                Add Option
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Settings
          </Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setAllowMultiple(!allowMultiple)}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Allow multiple votes
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Users can select multiple options
              </Text>
            </View>
            <View style={[
              styles.checkbox,
              allowMultiple && { backgroundColor: COLORS.primary }
            ]}>
              {allowMultiple && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Anonymous poll
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Hide who voted for what
              </Text>
            </View>
            <View style={[
              styles.checkbox,
              isAnonymous && { backgroundColor: COLORS.primary }
            ]}>
              {isAnonymous && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: SPACING.sm,
  },
  cancelText: {
    fontSize: FONTS.sizes.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  createButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.sm,
  },
  questionInput: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: FONTS.sizes.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  optionInput: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: FONTS.sizes.md,
  },
  removeButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: FONTS.sizes.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PollCreator; 
