import React from 'react';
import { TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';

interface AddButtonProps {
  onPress: () => void;
}

let MaterialIcons;
if (Platform.OS === 'web') {
  MaterialIcons = require('react-icons/md').MdAdd;
} else {
  MaterialIcons = require('@expo/vector-icons').MaterialIcons;
}

const AddButton: React.FC<AddButtonProps> = ({ onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel="Add new item"
      accessibilityHint="Opens form to add new item"
    >
      <MaterialIcons />
      <Text style={styles.buttonText}>Add</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AddButton;
