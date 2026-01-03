import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../contexts/TranslationContext';

interface PrintTokenButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export default function PrintTokenButton({ onPress, disabled = false }: PrintTokenButtonProps) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="print" size={14} color="#fff" />
      </View>
      <Text style={styles.text}>{t('print_token')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  disabled: {
    backgroundColor: '#cccccc',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
