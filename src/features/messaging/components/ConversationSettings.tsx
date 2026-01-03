import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  FlatList,
  Alert
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';
import { Conversation, ConversationParticipant } from '../types';

interface ConversationSettingsProps {
  conversation: Conversation;
  onUpdate: (update: Partial<Conversation>) => void;
  onClose: () => void;
  onLeave: () => void;
  onDelete: () => void;
}

const ConversationSettings: React.FC<ConversationSettingsProps> = ({
  conversation,
  onUpdate,
  onClose,
  onLeave,
  onDelete
}) => {
  const { colors } = useTheme();
  const [name, setName] = useState(conversation.name || '');
  const [description, setDescription] = useState(conversation.description || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    conversation.settings?.notificationsEnabled ?? true
  );
  const [isEncrypted, setIsEncrypted] = useState(conversation.isEncrypted ?? false);

  const handleSave = () => {
    onUpdate({
      name: name.trim(),
      description: description.trim(),
      settings: { ...conversation.settings, notificationsEnabled },
      isEncrypted
    });
    onClose();
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Conversation',
      'Are you sure you want to leave this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: onLeave }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Conversation',
      'This will permanently delete the conversation for all participants. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete }
      ]
    );
  };

  const renderParticipant = ({ item }: { item: ConversationParticipant }) => (
    <View style={styles.participantItem}>
      <Ionicons name="person-circle" size={28} color={colors.primary} />
      <Text style={[styles.participantName, { color: colors.text }]}>{item.user.name}</Text>
      <Text style={[styles.participantRole, { color: colors.textSecondary }]}>{item.role}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>  
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>  
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Conversation Settings</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Settings Form */}
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
          placeholder="Description"
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: colors.text }]}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            thumbColor={notificationsEnabled ? COLORS.primary : colors.border}
            trackColor={{ true: COLORS.primary, false: colors.border }}
          />
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
        <Text style={[styles.participantsTitle, { color: colors.text }]}>Participants</Text>
        <FlatList
          data={conversation.participants}
          renderItem={renderParticipant}
          keyExtractor={item => item.user.id}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.participantsList}
        />
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
          <Ionicons name="exit" size={20} color={COLORS.error} />
          <Text style={[styles.leaveText, { color: COLORS.error }]}>Leave Conversation</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={COLORS.error} />
          <Text style={[styles.deleteText, { color: COLORS.error }]}>Delete Conversation</Text>
        </TouchableOpacity>
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
  closeButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  saveButton: {
    padding: SPACING.sm,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  participantsSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  participantsTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.sm,
  },
  participantsList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantItem: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  participantName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
  },
  participantRole: {
    fontSize: FONTS.sizes.xs,
  },
  dangerZone: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
    marginTop: 'auto',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  leaveText: {
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteText: {
    marginLeft: SPACING.sm,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
  },
});

export default ConversationSettings; 
