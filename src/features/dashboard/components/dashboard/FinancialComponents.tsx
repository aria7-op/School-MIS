import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../../contexts/TranslationContext';

const FinancialComponent: React.FC = () => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width - 32;
  const [role, setRole] = useState<'superadmin' | 'finance'>('finance');
  const { t } = useTranslation();

  // Sample data
  const transactionData = [
    // TODO: Replace with actual transaction data from API
  ];

  const financialStats = {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstandingPayments: 0,
  };

  const incomeData = [
    // TODO: Replace with actual income data from API
  ];

  const expenseData = [
    // TODO: Replace with actual expense data from API
  ];

  const monthlyTrendData = {
    labels: [],
    datasets: [
      {
        data: [],
        color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`, // income color
        strokeWidth: 2
      },
      {
        data: [],
        color: (opacity = 1) => `rgba(248, 113, 113, ${opacity})`, // expense color
        strokeWidth: 2
      }
    ],
  };

  const statusColor = (status: string) => {
    switch(status) {
      case 'completed': return '#10B981'; // green
      case 'pending': return '#F59E0B'; // amber
      case 'failed': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };

  const typeColor = (type: string) => {
    return type === 'income' ? '#10B981' : '#EF4444';
  };

  // Role switch component
  const RoleSwitch = () => (
    <View style={styles.roleSwitchContainer}>
      <Pressable 
        style={[styles.roleButton, role === 'finance' && styles.activeRoleButton]}
        onPress={() => setRole('finance')}
      >
        <Text style={[styles.roleButtonText, role === 'finance' && styles.activeRoleButtonText]}>Finance View</Text>
      </Pressable>
      <Pressable 
        style={[styles.roleButton, role === 'superadmin' && styles.activeRoleButton]}
        onPress={() => setRole('superadmin')}
      >
        <Text style={[styles.roleButtonText, role === 'superadmin' && styles.activeRoleButtonText]}>Admin View</Text>
      </Pressable>
    </View>
  );

  if (role === 'superadmin') {
    return (
      <View style={[styles.container,styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>{t('financial_transactions')}</Text>
          <RoleSwitch />
        </View>
        
        <View style={styles.card}>
          <View style={styles.listHeader}>
            <Text style={[styles.headerText, { color: colors.text }]}>{t('date')}</Text>
            <Text style={[styles.headerText, { color: colors.text }]}>{t('description')}</Text>
            <Text style={[styles.headerText, { color: colors.text }]}>{t('amount')}</Text>
            <Text style={[styles.headerText, { color: colors.text }]}>{t('status')}</Text>
          </View>
          <ScrollView>
            {transactionData.map((item) => (
              <View key={item.id} style={styles.listRow}>
                <Text style={[styles.listText, { color: colors.text }]}>{item.date}</Text>
                <Text style={[styles.listText, { color: colors.text }]}>{item.description}</Text>
                <Text style={[styles.listText, { color: typeColor(item.type) }]}>
                  {item.type === 'income' ? '+' : '-'}${item.amount}
                </Text>
                <Text style={[styles.listText, { color: statusColor(item.status) }]}>{item.status}</Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>{t('view_all_transactions')}</Text>
            <Icon name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Finance role view
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>{t('financial_dashboard')}</Text>
        <RoleSwitch />
      </View>
      
      {/* Summary Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
          <Text style={styles.summaryCardTitle}>{t('total_income')}</Text>
          <Text style={[styles.summaryCardAmount, { color: '#10B981' }]}>${financialStats.totalIncome}</Text>
          <Text style={styles.summaryCardSubtext}>{t('income_growth')}</Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2' }]}>
          <Text style={styles.summaryCardTitle}>{t('total_expenses')}</Text>
          <Text style={[styles.summaryCardAmount, { color: '#EF4444' }]}>${financialStats.totalExpenses}</Text>
          <Text style={styles.summaryCardSubtext}>{t('expenses_growth')}</Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
          <Text style={styles.summaryCardTitle}>{t('net_profit')}</Text>
          <Text style={[styles.summaryCardAmount, { color: '#3B82F6' }]}>${financialStats.netProfit}</Text>
          <Text style={styles.summaryCardSubtext}>{t('profit_growth')}</Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#FFFBEB' }]}>
          <Text style={styles.summaryCardTitle}>{t('outstanding')}</Text>
          <Text style={[styles.summaryCardAmount, { color: '#F59E0B' }]}>${financialStats.outstandingPayments}</Text>
          <Text style={styles.summaryCardSubtext}>{t('pending_payments')}</Text>
        </View>
      </ScrollView>

      {/* Charts */}
      <View style={styles.chartsRow}>
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('income_breakdown')}</Text>
          <PieChart
            data={incomeData}
            width={screenWidth / 2 - 24}
            height={160}
            chartConfig={{
              color: (opacity = 1) => `rgba(${colors.text === '#000000' ? '0,0,0' : '255,255,255'}, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
        
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>{t('expense_breakdown')}</Text>
          <PieChart
            data={expenseData}
            width={screenWidth / 2 - 24}
            height={160}
            chartConfig={{
              color: (opacity = 1) => `rgba(${colors.text === '#000000' ? '0,0,0' : '255,255,255'}, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      </View>

      {/* Monthly Trend */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('monthly_trend')}</Text>
        <LineChart
          data={monthlyTrendData}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: colors.card,
            backgroundGradientFrom: colors.card,
            backgroundGradientTo: colors.card,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(${colors.text === '#000000' ? '0,0,0' : '255,255,255'}, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(${colors.text === '#000000' ? '0,0,0' : '255,255,255'}, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: colors.primary
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4ADE80' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F87171' }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>Expenses</Text>
          </View>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('recent_transactions')}</Text>
        <View style={styles.listHeader}>
          <Text style={[styles.headerText, { color: colors.text }]}>{t('date')}</Text>
          <Text style={[styles.headerText, { color: colors.text }]}>{t('description')}</Text>
          <Text style={[styles.headerText, { color: colors.text }]}>{t('amount')}</Text>
          <Text style={[styles.headerText, { color: colors.text }]}>{t('status')}</Text>
        </View>
        <ScrollView>
          {transactionData.map((item) => (
            <View key={item.id} style={styles.listRow}>
              <Text style={[styles.listText, { color: colors.text }]}>{item.date}</Text>
              <Text style={[styles.listText, { color: colors.text }]}>{item.description}</Text>
              <Text style={[styles.listText, { color: typeColor(item.type) }]}>
                {item.type === 'income' ? '+' : '-'}${item.amount}
              </Text>
              <Text style={[styles.listText, { color: statusColor(item.status) }]}>{item.status}</Text>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>{t('view_all_transactions')}</Text>
          <Icon name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  roleSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeRoleButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeRoleButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  card: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  horizontalScroll: {
    marginBottom: 16,
  },
  summaryCard: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
  },
  summaryCardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryCardAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryCardSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartContainer: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listText: {
    fontSize: 13,
    flex: 1,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewAllText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 4,
  },
});

export default FinancialComponent;
