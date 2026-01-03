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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../../theme';
import { Conversation, ConversationParticipant } from '../types';

interface CallInterfaceProps {
  conversation: Conversation;
  callType: 'AUDIO' | 'VIDEO';
  participants: ConversationParticipant[];
  isOngoing: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  onMuteToggle: () => void;
  onCameraToggle: () => void;
  onEndCall: () => void;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
  isIncoming?: boolean;
  callStatus: string;
}

const CallInterface: React.FC<CallInterfaceProps> = ({
  conversation,
  callType,
  participants,
  isOngoing,
  isMuted,
  isCameraOn,
  onMuteToggle,
  onCameraToggle,
  onEndCall,
  onAcceptCall,
  onRejectCall,
  isIncoming = false,
  callStatus
}) => {
  const { colors } = useTheme();

  const renderParticipant = ({ item }: { item: ConversationParticipant }) => (
    <View style={styles.participantItem}>
      <Ionicons name="person-circle" size={48} color={colors.primary} />
      <Text style={[styles.participantName, { color: colors.text }]}>{item.user.name}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>  
      {/* Call Status */}
      <View style={styles.statusRow}>
        <Ionicons
          name={callType === 'VIDEO' ? 'videocam' : 'call'}
          size={28}
          color={COLORS.primary}
        />
        <Text style={[styles.statusText, { color: colors.text }]}>{callStatus}</Text>
      </View>
      {/* Participants */}
      <FlatList
        data={participants}
        renderItem={renderParticipant}
        keyExtractor={item => item.user.id}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.participantsList}
      />
      {/* Controls */}
      <View style={styles.controlsRow}>
        {isIncoming && (
          <>
            <TouchableOpacity style={[styles.controlButton, { backgroundColor: COLORS.success }]} onPress={onAcceptCall}>
              <Ionicons name="call" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, { backgroundColor: COLORS.error }]} onPress={onRejectCall}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </>
        )}
        {!isIncoming && (
          <>
            <TouchableOpacity style={styles.controlButton} onPress={onMuteToggle}>
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color={isMuted ? COLORS.error : colors.text} />
            </TouchableOpacity>
            {callType === 'VIDEO' && (
              <TouchableOpacity style={styles.controlButton} onPress={onCameraToggle}>
                <Ionicons name={isCameraOn ? 'videocam' : 'videocam-off'} size={28} color={isCameraOn ? COLORS.primary : colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.controlButton, { backgroundColor: COLORS.error }]} onPress={onEndCall}>
              <Ionicons name="call" size={28} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statusText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    marginLeft: SPACING.md,
  },
  participantsList: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  participantItem: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  participantName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
    elevation: 2,
  },
});

export default CallInterface; 
