import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';

interface AIPanelProps {
  onAIAction: (action: string, context?: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const AIPanel: React.FC<AIPanelProps> = ({
  onAIAction,
  onClose,
  isLoading = false
}) => {
  const { colors } = useTheme();
  const [customPrompt, setCustomPrompt] = useState('');

  const aiFeatures = [
    {
      id: 'summarize',
      title: 'Summarize',
      description: 'Summarize the conversation',
      icon: 'document-text',
      color: COLORS.primary
    },
    {
      id: 'translate',
      title: 'Translate',
      description: 'Translate messages',
      icon: 'language',
      color: COLORS.info
    },
    {
      id: 'sentiment',
      title: 'Sentiment Analysis',
      description: 'Analyze message sentiment',
      icon: 'analytics',
      color: COLORS.warning
    },
    {
      id: 'suggest',
      title: 'Smart Reply',
      description: 'Get reply suggestions',
      icon: 'chatbubble-ellipses',
      color: COLORS.success
    },
    {
      id: 'summarize',
      title: 'Key Points',
      description: 'Extract key points',
      icon: 'list',
      color: COLORS.secondary
    },
    {
      id: 'action',
      title: 'Action Items',
      description: 'Identify action items',
      icon: 'checkmark-circle',
      color: COLORS.error
    }
  ];

  const handleAIFeature = (featureId: string) => {
    onAIAction(featureId);
  };

  const handleCustomPrompt = () => {
    if (customPrompt.trim()) {
      onAIAction('custom', customPrompt.trim());
      setCustomPrompt('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          AI Assistant
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Features Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            AI Features
          </Text>
          
          <View style={styles.featuresGrid}>
            {aiFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={[
                  styles.featureItem,
                  { backgroundColor: colors.card, borderColor: colors.border }
                ]}
                onPress={() => handleAIFeature(feature.id)}
                disabled={isLoading}
              >
                <View style={[
                  styles.featureIcon,
                  { backgroundColor: feature.color }
                ]}>
                  <Ionicons 
                    name={feature.icon as any} 
                    size={20} 
                    color="white" 
                  />
                </View>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  {feature.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Prompt */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Custom AI Request
          </Text>
          
          <View style={[styles.customPromptContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.customPromptInput, { 
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder="Ask AI anything about the conversation..."
              placeholderTextColor={colors.textSecondary}
              value={customPrompt}
              onChangeText={setCustomPrompt}
              multiline={true}
              maxLength={500}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: customPrompt.trim() ? COLORS.primary : colors.border }
              ]}
              onPress={handleCustomPrompt}
              disabled={!customPrompt.trim() || isLoading}
            >
              <Ionicons 
                name="send" 
                size={16} 
                color={customPrompt.trim() ? "white" : colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About AI Assistant
          </Text>
          
          <View style={[styles.infoContainer, { backgroundColor: colors.card }]}>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Your data is secure and private
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="flash" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Powered by advanced AI models
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Real-time processing and responses
              </Text>
            </View>
          </View>
        </View>

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              AI is processing your request...
            </Text>
          </View>
        )}
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
  headerSpacer: {
    width: 48,
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
    marginBottom: SPACING.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    marginBottom: 2,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
  },
  customPromptContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  customPromptInput: {
    flex: 1,
    padding: SPACING.sm,
    fontSize: FONTS.sizes.md,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 0,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  infoContainer: {
    padding: SPACING.md,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.sm,
  },
});

export default AIPanel; 
