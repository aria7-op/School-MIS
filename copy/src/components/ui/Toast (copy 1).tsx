import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TYPE_CONFIG = {
  info:    { color: '#2563eb', bg: '#dbeafe', icon: 'info' },
  success: { color: '#059669', bg: '#d1fae5', icon: 'check-circle' },
  warning: { color: '#b45309', bg: '#fef9c3', icon: 'warning' },
  error:   { color: '#b91c1c', bg: '#fee2e2', icon: 'error' },
};

const Toast = ({
  message,
  type = 'info',
  onClose,
  onAction,
  actionLabel,
  style,
  position = 'bottomRight', // 'topRight', 'bottomLeft', etc.
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const positionStyle =
    position === 'bottomRight'
      ? { position: 'fixed', right: 32, bottom: 40, zIndex: 2000 }
      : position === 'topRight'
      ? { position: 'fixed', right: 32, top: 40, zIndex: 2000 }
      : position === 'bottomLeft'
      ? { position: 'fixed', left: 32, bottom: 40, zIndex: 2000 }
      : { position: 'fixed', left: 32, top: 40, zIndex: 2000 };

  return (
    <View style={[styles.toast, { backgroundColor: config.bg, borderColor: config.color }, positionStyle, style]}>
      <MaterialIcons name={config.icon} size={22} color={config.color} style={{ marginRight: 10 }} />
      <Text style={[styles.toastText, { color: config.color }]}>{message}</Text>
      {onAction && actionLabel && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
          <Text style={[styles.actionText, { color: config.color }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <MaterialIcons name="close" size={20} color={config.color} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 280,
    maxWidth: 400,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  toastText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'left',
  },
  closeBtn: {
    marginLeft: 10,
    padding: 4,
  },
  actionBtn: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  actionText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Toast; 
