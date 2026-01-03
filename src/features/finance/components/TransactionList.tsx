import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../../contexts/TranslationContext';

import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

// Transaction type based on API response
interface Transaction {
  id: number;
  description?: string;
  amount?: string;
  date?: string;
  category?: string;
  transaction_type?: 'debit' | 'credit';
  account?: string;
  reference?: string;
  status?: 'completed' | 'pending' | 'failed';
  [key: string]: any;
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;

}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  isLoading = false, 
   
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'debit' | 'credit'>('all');
  const screenWidth = Dimensions.get('window').width;

  // Use only real data, no dummy fallback
  const displayTransactions = useMemo(() => {
    return transactions || [];
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = displayTransactions;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === selectedType);
    }
    
    return filtered;
  }, [displayTransactions, selectedCategory, selectedType]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalDebits = displayTransactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
    const totalCredits = displayTransactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
    const netFlow = totalDebits - totalCredits;
    const totalTransactions = displayTransactions.length;
    const avgTransaction = totalTransactions > 0 ? (totalDebits + totalCredits) / totalTransactions : 0;
    const pendingTransactions = displayTransactions.filter(t => t.status === 'pending').length;

    return {
      totalDebits,
      totalCredits,
      netFlow,
      totalTransactions,
      avgTransaction,
      pendingTransactions
    };
  }, [displayTransactions]);

  // Chart data
  const chartData = useMemo(() => {
    const categories = [...new Set(displayTransactions.map(t => t.category || 'Uncategorized'))];
    const categoryTotals = categories.map(category => 
      displayTransactions
        .filter(t => (t.category || 'Uncategorized') === category)
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
    );

    const monthlyData = getMonthlyData(displayTransactions);

    return {
      pieChart: {
        data: categories.slice(0, 6).map((category, index) => ({
          name: category,
          population: categoryTotals[index],
          color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6],
          legendFontColor: '#7F7F7F',
          legendFontSize: 12
        }))
      },
      lineChart: {
        labels: monthlyData.labels,
        datasets: [
          {
            data: monthlyData.debits,
            color: (opacity = 1) => `rgba(16, 185, 129, Afg {opacity})`,
            strokeWidth: 2
          },
          {
            data: monthlyData.credits,
            color: (opacity = 1) => `rgba(239, 68, 68, Afg {opacity})`,
            strokeWidth: 2
          }
        ]
      }
    };
  }, [displayTransactions]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('loadingTransactions')}</Text>
      </View>
    );
  }

  if (!displayTransactions || displayTransactions.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="receipt" size={64} color="#64748b" />
        <Text style={styles.empty}>{t('noTransactionsFound')}</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>{t('addTransaction')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderKPI = (title: string, value: string, icon: string, color: string, subtitle?: string) => (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <View style={styles.kpiHeader}>
        <MaterialIcons name={icon as any} size={24} color={color} />
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{t('transactionFlow')}</Text>
        <View style={styles.chartTabs}>
          <TouchableOpacity style={[styles.chartTab, styles.activeTab]}>
            <Text style={styles.activeTabText}>{t('line')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chartTab}>
            <Text style={styles.tabText}>{t('pie')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <LineChart
        data={chartData.lineChart}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(30, 41, 59, Afg {opacity})`,
          labelColor: (opacity = 1) => `rgba(100, 116, 139, Afg {opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#4f46e5'
          }
        }}
        bezier
        style={styles.chart}
      />
      
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>{t('debits')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>{t('credits')}</Text>
        </View>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity 
          style={[styles.filterChip, selectedType === 'all' && styles.activeFilterChip]}
          onPress={() => setSelectedType('all')}
        >
          <Text style={[styles.filterText, selectedType === 'all' && styles.activeFilterText]}>
            {t('all')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, selectedType === 'debit' && styles.activeFilterChip]}
          onPress={() => setSelectedType('debit')}
        >
          <Text style={[styles.filterText, selectedType === 'debit' && styles.activeFilterText]}>
            {t('debits')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, selectedType === 'credit' && styles.activeFilterChip]}
          onPress={() => setSelectedType('credit')}
        >
          <Text style={[styles.filterText, selectedType === 'credit' && styles.activeFilterText]}>
            {t('credits')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isDebit = item.transaction_type === 'debit';
    const amount = parseFloat(item.amount || '0');
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={[styles.transactionCard, { backgroundColor: colors.card }]}
        onPress={() => {
          // TODO: Implement transaction details functionality
          console.log('View transaction details:', item.id);
        }}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={getCategoryIcon(item.category || '')} 
              size={24} 
              color={isDebit ? '#10b981' : '#ef4444'}
            />
          </View>
          
          <View style={styles.transactionInfo}>
            <Text style={[styles.title, { color: colors.text }]}>
              {item.description || t('noDescription')}
            </Text>
            <Text style={[styles.category, { color: colors.text }]}>
              {item.category || t('uncategorized')}
            </Text>
            {item.reference && (
              <Text style={styles.reference}>Ref: {item.reference}</Text>
            )}
          </View>
          
          <View style={styles.amountContainer}>
            <Text 
              style={[
                styles.amount,
                { color: isDebit ? '#10b981' : '#ef4444' }
              ]}
            >
              {isDebit ? '+' : '-'}Afg {amount.toLocaleString()}
            </Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status || 'completed'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.transactionFooter}>
          <Text style={styles.date}>
            {new Date(item.date || '').toLocaleDateString()}
          </Text>
          {item.account && (
            <Text style={styles.account}>{item.account}</Text>
          )}
        </View>

        <View style={styles.transactionActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="visibility" size={16} color="#64748b" />
            <Text style={styles.actionText}>{t('view')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="edit" size={16} color="#64748b" />
            <Text style={styles.actionText}>{t('edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="receipt" size={16} color="#64748b" />
            <Text style={styles.actionText}>{t('receipt')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          {renderKPI(
            t('totalDebits'),
            `Afg ${kpis.totalDebits.toLocaleString()}`,
            'trending-up',
            '#10b981'
          )}
          {renderKPI(
            t('totalCredits'),
            `Afg ${kpis.totalCredits.toLocaleString()}`,
            'trending-down',
            '#ef4444'
          )}
          {renderKPI(
            t('netFlow'),
            `Afg ${kpis.netFlow.toLocaleString()}`,
            'account-balance',
            kpis.netFlow >= 0 ? '#10b981' : '#ef4444'
          )}
          {renderKPI(
            t('totalTransactions'),
            kpis.totalTransactions.toString(),
            'receipt',
            '#3b82f6',
            t('transactions')
          )}
        </View>

        {/* Charts */}
        {renderChart()}

        {/* Filters */}
        {renderFilters()}

        {/* Transactions List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{t('recentTransactions')}</Text>
          <TouchableOpacity style={styles.addTransactionButton}>
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={styles.addTransactionButtonText}>{t('addTransaction')}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransactionItem}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </ScrollView>
    </View>
  );
};

// Helper functions
const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: string } = {
    'food': 'food',
    'materials': 'book',
    'financial aid': 'cash',
    'tuition': 'school',
    'salary': 'account-cash',
    'rent': 'home',
    'utilities': 'lightning-bolt',
    'equipment': 'desktop-classic',
    'maintenance': 'wrench',
    'marketing': 'bullhorn',
    'travel': 'airplane',
    'insurance': 'shield-check',
    'taxes': 'file-document',
    'fees': 'credit-card',
    'donations': 'gift',
    'grants': 'handshake'
  };
  return icons[category.toLowerCase()] || 'receipt';
};

const getStatusColor = (status?: string) => {
  const colors = {
    completed: '#10b981',
    pending: '#f59e0b',
    failed: '#ef4444'
  };
  return colors[status as keyof typeof colors] || '#10b981';
};

const getMonthlyData = (transactions: Transaction[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  // TODO: Replace with actual transaction data calculation
  const debits = months.map(() => 0);
  const credits = months.map(() => 0);
  
  return {
    labels: months,
    debits,
    credits
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  empty: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiTitle: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  kpiSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  chartTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  chartTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  tabText: {
    fontSize: 12,
    color: '#64748b',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#4f46e5',
  },
  filterText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  addTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addTransactionButtonText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  transactionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 2,
  },
  reference: {
    fontSize: 12,
    color: '#64748b',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: '#64748b',
  },
  account: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  transactionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  actionText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  separator: {
    height: 8,
  },
});

export default TransactionList;
