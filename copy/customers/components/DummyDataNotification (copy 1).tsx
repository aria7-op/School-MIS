import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

interface DummyDataNotificationProps {
  visible: boolean;
  onDismiss?: () => void;
  message?: string;
}

const DummyDataNotification: React.FC<DummyDataNotificationProps> = ({
  visible,
  onDismiss,
  message = 'Showing sample data due to connection issues'
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="info-outline" size={20} color={colors.warning} />
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <MaterialIcons name="close" size={16} color={colors.warning} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  text: {
    flex: 1,
    marginLeft: 8,
    color: colors.warning,
    fontSize: 14,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
  },
});

export default DummyDataNotification; 
