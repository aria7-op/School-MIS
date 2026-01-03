import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  onPress?: () => void;
}

interface StatsOverviewProps {
  activeTab: string;
  payments: any[];
  transactions: any[];
  budgets: any[];
  expenses: any[];
  installments: any[];
  incomes: any[];
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

const StatsOverview: React.FC<StatsOverviewProps> = ({ activeTab, payments, transactions, budgets, expenses, installments, incomes }) => {
  const { t } = useTranslation();
  // Show loading if any prop is undefined
  if ([payments, transactions, budgets, expenses, installments, incomes].some(arr => typeof arr === 'undefined')) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#4f46e5" />;
  }

  // Show empty state if all are empty
  if ([payments, transactions, budgets, expenses, installments, incomes].every(arr => Array.isArray(arr) && arr.length === 0)) {
    return <View style={styles.center}><Text style={styles.empty}>{t('no_finance_data_found')}</Text></View>;
  }

  // Example stats (replace with real aggregation as needed)
  const totalPayments = payments.length;
  const totalTransactions = transactions.length;
  const totalBudgets = budgets.length;
  const totalExpenses = expenses.length;
  const totalInstallments = installments.length;
  const totalIncomes = incomes.length;

  return (
    <View style={styles.statsContainer}>
      {activeTab === 'payments' && (
        <StatCard title={t('payments')} value={totalPayments.toString()} subtitle={t('total_payments')} />
      )}
      {activeTab === 'transactions' && (
        <StatCard title={t('transactions')} value={totalTransactions.toString()} subtitle={t('total_transactions')} />
      )}
      {activeTab === 'budgets' && (
        <StatCard title={t('budgets')} value={totalBudgets.toString()} subtitle={t('total_budgets')} />
      )}
      {activeTab === 'expenses' && (
        <StatCard title={t('expenses')} value={totalExpenses.toString()} subtitle={t('total_expenses')} />
      )}
      {activeTab === 'installments' && (
        <StatCard title={t('installments')} value={totalInstallments.toString()} subtitle={t('total_installments')} />
      )}
      {activeTab === 'accounts' && (
        <StatCard title={t('incomes')} value={totalIncomes.toString()} subtitle={t('total_incomes')} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal:10,
    paddingBottom: 16,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  error: {
    fontSize: 16,
    color: '#e63946',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    paddingBottom: 16,
  },
  empty: {
    fontSize: 16,
    color: '#e63946',
  },
});

export default StatsOverview;
