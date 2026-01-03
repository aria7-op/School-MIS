import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';

interface QuickActionsPanelProps {
  onAction: (action: string) => void;
  colors?: any;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onAction,
  colors = {},
}) => {
  const actions = [
    {
      id: 'add_payment',
      title: 'Add Payment',
      subtitle: 'Record new payment',
      icon: 'payment',
      color: colors.success || '#10b981',
    },
    {
      id: 'add_expense',
      title: 'Add Expense',
      subtitle: 'Record new expense',
      icon: 'money-off',
      color: colors.error || '#ef4444',
    },
    {
      id: 'add_budget',
      title: 'Add Budget',
      subtitle: 'Create new budget',
      icon: 'account-balance',
      color: colors.primary || '#3b82f6',
    },
    {
      id: 'generate_report',
      title: 'Generate Report',
      subtitle: 'Create financial report',
      icon: 'assessment',
      color: colors.info || colors.primary || '#06b6d4',
    },
    {
      id: 'export_data',
      title: 'Export Data',
      subtitle: 'Export financial data',
      icon: 'file-download',
      color: colors.warning || '#f59e0b',
    },
    {
      id: 'view_analytics',
      title: 'View Analytics',
      subtitle: 'Advanced analytics',
      icon: 'analytics',
      color: colors.secondary || colors.primary || '#8b5cf6',
    },
    {
      id: 'manage_payroll',
      title: 'Manage Payroll',
      subtitle: 'Payroll management',
      icon: 'account-balance-wallet',
      color: colors.purple || colors.primary || '#a855f7',
    },
    {
      id: 'review_budgets',
      title: 'Review Budgets',
      subtitle: 'Budget analysis',
      icon: 'pie-chart',
      color: colors.orange || colors.warning || '#f97316',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card || '#ffffff' }]}>
      <Text style={[styles.title, { color: colors.text || '#1f2937' }]}>Quick Actions</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, { backgroundColor: colors.background || '#f9fafb' }]}
            onPress={() => onAction(action.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
              <Icon name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.text || '#1f2937' }]}>
              {action.title}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary || '#6b7280' }]}>
              {action.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  actionCard: {
    width: 120,
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 12,
  },
});

export default QuickActionsPanel; 
