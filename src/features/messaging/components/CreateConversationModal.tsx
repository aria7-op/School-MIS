import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';
import { User, ConversationType } from '../types';

interface CreateConversationModalProps {
  onClose: () => void;
  onCreate: (conversationData: {
    name: string;
    description: string;
    type: ConversationType;
    participants: string[];
    isEncrypted: boolean;
  }) => void;
  availableUsers: User[];
  isLoading?: boolean;
}

const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  onClose,
  onCreate,
  availableUsers,
  isLoading = false
}) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ConversationType>('DIRECT');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isEncrypted, setIsEncrypted] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a conversation name');
      return;
    }

    if (type === 'DIRECT' && selectedParticipants.length !== 1) {
      Alert.alert('Error', 'Direct conversations must have exactly one participant');
      return;
    }

    if (type === 'GROUP' && selectedParticipants.length < 2) {
      Alert.alert('Error', 'Group conversations must have at least 2 participants');
      return;
    }

    onCreate({
      name: name.trim(),
      description: description.trim(),
      type,
      participants: selectedParticipants,
      isEncrypted
    });
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        { backgroundColor: colors.card, borderColor: colors.border },
        selectedParticipants.includes(item.id) && { borderColor: COLORS.primary }
      ]}
      onPress={() => toggleParticipant(item.id)}
    >
      <Ionicons 
        name="person-circle" 
        size={40} 
        color={selectedParticipants.includes(item.id) ? COLORS.primary : colors.textSecondary} 
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.userStatus, { color: colors.textSecondary }]}>{item.status}</Text>
      </View>
      {selectedParticipants.includes(item.id) && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Conversation</Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: COLORS.primary }]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Name</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder="Conversation name"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor={colors.textSecondary}
          multiline={true}
        />

        <Text style={[styles.label, { color: colors.text }]}>Type</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              type === 'DIRECT' && { borderColor: COLORS.primary }
            ]}
            onPress={() => setType('DIRECT')}
          >
            <Ionicons 
              name="person" 
              size={20} 
              color={type === 'DIRECT' ? COLORS.primary : colors.text} 
            />
            <Text style={[styles.typeText, { color: type === 'DIRECT' ? COLORS.primary : colors.text }]}>
              Direct
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              type === 'GROUP' && { borderColor: COLORS.primary }
            ]}
            onPress={() => setType('GROUP')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={type === 'GROUP' ? COLORS.primary : colors.text} 
            />
            <Text style={[styles.typeText, { color: type === 'GROUP' ? COLORS.primary : colors.text }]}>
              Group
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: colors.text }]}>Encrypted</Text>
          <Switch
            value={isEncrypted}
            onValueChange={setIsEncrypted}
            thumbColor={isEncrypted ? COLORS.primary : colors.border}
            trackColor={{ true: COLORS.primary, false: colors.border }}
          />
        </View>
      </View>

      {/* Participants */}
      <View style={styles.participantsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Select Participants ({selectedParticipants.length})
        </Text>
        <FlatList
          data={availableUsers}
          renderItem={renderUser}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.participantsList}
        />
      </View>
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
  form: {
    padding: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.md,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: SPACING.xs,
  },
  typeText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  participantsSection: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.sm,
  },
  participantsList: {
    paddingBottom: SPACING.lg,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  userName: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    marginBottom: 2,
  },
  userStatus: {
    fontSize: FONTS.sizes.sm,
  },
});

export default CreateConversationModal; 
