import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
let MaterialIcons;
if (Platform.OS === 'web') {
  MaterialIcons = require('react-icons/md').MdReceipt;
} else {
  MaterialIcons = require('@expo/vector-icons').MaterialIcons;
}

interface QuickActionsProps {
  onGenerateBill: () => void;
  onProcessPayroll: () => void;
  onRecordPayment: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  onGenerateBill, 
  onProcessPayroll, 
  onRecordPayment 
}) => {
  const { colors } = useTheme();

  const actions = [
    {
      icon: 'receipt',
      label: 'Generate Bill',
      color: '#4CAF50',
      onPress: onGenerateBill,
    },
    {
      icon: 'payments',
      label: 'Process Payroll',
      color: '#2196F3',
      onPress: onProcessPayroll,
    },
    {
      icon: 'attach-money',
      label: 'Record Payment',
      color: '#FF9800',
      onPress: onRecordPayment,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { backgroundColor: action.color + '22' }]}
            onPress={action.onPress}
          >
            <MaterialIcons />
            <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default QuickActions;
