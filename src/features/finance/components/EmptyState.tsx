import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FinanceTab } from '../types/finance';

interface EmptyStateProps {
  activeTab: FinanceTab;
}

const EmptyState: React.FC<EmptyStateProps> = ({ activeTab }) => {
  const { colors } = useTheme();

  const getContent = () => {
    switch (activeTab) {
      case 'transactions':
        return {
          icon: 'cash-multiple',
          title: 'No Transactions',
          description: 'When you add transactions, they will appear here',
        };
      case 'analytics':
        return {
          icon: 'chart-bar',
          title: 'No Data to Display',
          description: 'Start adding transactions to see analytics',
        };
      case 'budgets':
        return {
          icon: 'wallet',
          title: 'No Budgets Created',
          description: 'Create your first budget to start tracking',
        };
      default:
        return {
          icon: 'cash',
          title: 'No Data Available',
          description: 'There is nothing to display here yet',
        };
    }
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '22' }]}>
        <MaterialCommunityIcons 
          name={content.icon} 
          size={48} 
          color={colors.primary} 
        />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text>
      <Text style={[styles.description, { color: colors.text }]}>
        {content.description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default EmptyState;
