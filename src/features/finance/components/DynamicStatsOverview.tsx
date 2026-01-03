import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

interface StatsOverviewProps {
  analytics: any;
  payments: any[];
  expenses: any[];
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, onPress }) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card }]} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.value, { color: color }]}>{value}</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

const DynamicStatsOverview: React.FC<StatsOverviewProps> = ({ 
  analytics, 
  payments = [], 
  expenses = [], 
  budgets = [], 
  loading = false 
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading financial overview...
        </Text>
      </View>
    );
  }

  // Calculate stats from real data
  const totalRevenue = analytics?.totalRevenue || 0;
  const totalExpenses = analytics?.totalExpenses || 0;
  const netProfit = analytics?.netProfit || 0;
  const profitMargin = analytics?.profitMargin || 0;

  const totalPayments = payments.length;
  const completedPayments = payments.filter(p => p.status === 'completed').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const approvedExpenses = expenses.filter(e => e.status === 'approved').length;
  


  const formatCurrency = (amount: number) => {
    return `Afg ${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Financial Overview
      </Text>
      
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle={`${completedPayments} completed payments`}
          icon="trending-up"
          color="#10b981"
        />
        
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle={`${approvedExpenses} approved expenses`}
          icon="trending-down"
          color="#ef4444"
        />
        
        <StatCard
          title="Net Profit"
          value={formatCurrency(netProfit)}
          subtitle={`${formatPercentage(profitMargin)} profit margin`}
          icon="account-balance"
          color={netProfit >= 0 ? "#10b981" : "#ef4444"}
        />
        

      </View>

      {/* Payment Status Overview */}
      <View style={[styles.statusContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.statusTitle, { color: colors.text }]}>
          Payment Status
        </Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              Completed: {completedPayments}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#f59e0b' }]} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              Pending: {pendingPayments}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#6b7280' }]} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              Total: {totalPayments}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.actionsContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.actionsTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, { borderColor: colors.primary }]}>
            <Icon name="payment" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              New Payment
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { borderColor: '#f59e0b' }]}>
            <Icon name="receipt" size={20} color="#f59e0b" />
            <Text style={[styles.actionText, { color: '#f59e0b' }]}>
              Add Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { borderColor: '#3b82f6' }]}>
            <Icon name="assessment" size={20} color="#3b82f6" />
            <Text style={[styles.actionText, { color: '#3b82f6' }]}>
              View Reports
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DynamicStatsOverview;