import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../../contexts/TranslationContext';

import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

// Account type for display
interface AccountRow {
  id: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Income' | 'Expense' | 'Equity';
  balance: number;
  currency?: string;
  code?: string;
  description?: string;
  lastTransaction?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

interface AccountsListProps {
  transactions: any[];
  budgets: any[];
  expenses: any[];
  isLoading?: boolean;

}

const ACCOUNTS_MAP: { [key: string]: { type: AccountRow['type']; display: string } } = {
  tuition: { type: 'Income', display: 'Tuition Income' },
  stationery: { type: 'Expense', display: 'Stationery' },
  equipment: { type: 'Asset', display: 'Equipment' },
  loans: { type: 'Liability', display: 'Loans Payable' },
  cash: { type: 'Asset', display: 'Cash & Cash Equivalents' },
  accounts_receivable: { type: 'Asset', display: 'Accounts Receivable' },
  accounts_payable: { type: 'Liability', display: 'Accounts Payable' },
  salaries: { type: 'Expense', display: 'Salaries & Wages' },
  utilities: { type: 'Expense', display: 'Utilities' },
  rent: { type: 'Expense', display: 'Rent Expense' },
  insurance: { type: 'Expense', display: 'Insurance' },
  maintenance: { type: 'Expense', display: 'Maintenance' },
  marketing: { type: 'Expense', display: 'Marketing' },
  technology: { type: 'Expense', display: 'Technology' },
  training: { type: 'Expense', display: 'Training' },
  fees: { type: 'Income', display: 'Service Fees' },
  grants: { type: 'Income', display: 'Grants' },
  donations: { type: 'Income', display: 'Donations' },
  investments: { type: 'Asset', display: 'Investments' },
  buildings: { type: 'Asset', display: 'Buildings' },
  vehicles: { type: 'Asset', display: 'Vehicles' },
  furniture: { type: 'Asset', display: 'Furniture & Fixtures' },
  equity: { type: 'Equity', display: 'Owner Equity' },
  retained_earnings: { type: 'Equity', display: 'Retained Earnings' },
};

const AccountsList: React.FC<AccountsListProps> = ({ 
  transactions, 
  budgets, 
  expenses, 
  isLoading = false, 
   
}) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<'all' | AccountRow['type']>('all');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'type'>('name');
  const screenWidth = Dimensions.get('window').width;

  // Use only real data, no dummy fallback
  const accounts = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    // Process real data here
    const accountMap = new Map<string, AccountRow>();
    
    // Process transactions
    transactions.forEach(transaction => {
      const accountName = transaction.account || 'cash';
      const accountInfo = ACCOUNTS_MAP[accountName] || { type: 'Asset' as AccountRow['type'], display: accountName };
      
      if (!accountMap.has(accountName)) {
        accountMap.set(accountName, {
          id: accountName,
          name: accountInfo.display,
          type: accountInfo.type,
          balance: 0,
          currency: 'Afg',
          code: accountName.toUpperCase(),
          description: `Afg {accountInfo.type} account for Afg {accountInfo.display}`,
          lastTransaction: new Date().toISOString(),
          status: 'active'
        });
      }
      
      const account = accountMap.get(accountName)!;
      account.balance += transaction.amount || 0;
    });
    
    return Array.from(accountMap.values());
  }, [transactions]);

  // Filter and sort accounts
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(account => account.type === selectedType);
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return Math.abs(b.balance) - Math.abs(a.balance);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return filtered;
  }, [accounts, selectedType, sortBy]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = accounts.filter(a => a.type === 'Liability').reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const totalEquity = accounts.filter(a => a.type === 'Equity').reduce((sum, a) => sum + a.balance, 0);
    const totalIncome = accounts.filter(a => a.type === 'Income').reduce((sum, a) => sum + a.balance, 0);
    const totalExpenses = accounts.filter(a => a.type === 'Expense').reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const netIncome = totalIncome - totalExpenses;
    const workingCapital = totalAssets - totalLiabilities;

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalIncome,
      totalExpenses,
      netIncome,
      workingCapital,
      currency: 'USD'
    };
  }, [accounts]);

  // Chart data
  const chartData = useMemo(() => {
    const typeData = ['Asset', 'Liability', 'Income', 'Expense', 'Equity'].map(type => {
      const accountsOfType = accounts.filter(a => a.type === type);
      const totalBalance = accountsOfType.reduce((sum, a) => sum + Math.abs(a.balance), 0);
      return { type, balance: totalBalance };
    });

    return {
      pieChart: {
        data: typeData.map((item, index) => ({
          name: item.type,
          population: item.balance,
          color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][index],
          legendFontColor: '#7F7F7F',
          legendFontSize: 12
        }))
      },
      barChart: {
        labels: accounts.slice(0, 8).map(a => a.name.substring(0, 8)),
        datasets: [{
          data: accounts.slice(0, 8).map(a => Math.abs(a.balance))
        }]
      }
    };
  }, [accounts]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('loadingAccounts')}</Text>
      </View>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="account-balance" size={64} color="#64748b" />
        <Text style={styles.empty}>{t('noAccountDataFound')}</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>{t('addAccount')}</Text>
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
        <Text style={styles.chartTitle}>{t('accountDistribution')}</Text>
        <View style={styles.chartTabs}>
          <TouchableOpacity style={[styles.chartTab, styles.activeTab]}>
            <Text style={styles.activeTabText}>{t('pie')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chartTab}>
            <Text style={styles.tabText}>{t('bar')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <PieChart
        data={chartData.pieChart.data}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          color: (opacity = 1) => `rgba(30, 41, 59, Afg {opacity})`,
          labelColor: (opacity = 1) => `rgba(100, 116, 139, Afg {opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );

  const renderAccountItem = ({ item }: { item: AccountRow }) => {
    const isPositive = item.balance >= 0;
    const typeColor = getTypeColor(item.type);

    return (
      <View style={[styles.accountCard, { borderLeftColor: typeColor }]}>
        <View style={styles.accountHeader}>
          <View style={styles.accountInfo}>
            <View style={styles.accountCode}>
              <Text style={styles.codeText}>{item.code}</Text>
            </View>
            <View style={styles.accountDetails}>
              <Text style={styles.accountName}>{item.name}</Text>
              <Text style={styles.accountType}>{item.type}</Text>
            </View>
          </View>
          <View style={styles.accountBalance}>
            <Text style={[styles.balanceAmount, { color: isPositive ? '#10b981' : '#ef4444' }]}>
              {item.currency} {Math.abs(item.balance).toLocaleString()}
            </Text>
            <Text style={styles.balanceLabel}>
              {isPositive ? t('credit') : t('debit')}
            </Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.accountDescription}>{item.description}</Text>
        )}
        
        <View style={styles.accountFooter}>
          <View style={styles.accountStatus}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.lastTransaction}>
            {t('lastTransaction')}: {new Date(item.lastTransaction || '').toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.accountActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="visibility" size={16} color="#64748b" />
            <Text style={styles.actionText}>{t('view')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="edit" size={16} color="#64748b" />
            <Text style={styles.actionText}>{t('edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="trending-up" size={16} color="#64748b" />
            <Text style={styles.actionText}>{t('analyze')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        {(['Asset', 'Liability', 'Income', 'Expense', 'Equity'] as const).map(type => (
          <TouchableOpacity 
            key={type}
            style={[styles.filterChip, selectedType === type && styles.activeFilterChip]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={[styles.filterText, selectedType === type && styles.activeFilterText]}>
              {t(type.toLowerCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          {renderKPI(
            t('totalAssets'),
            `Afg {kpis.currency} Afg {kpis.totalAssets.toLocaleString()}`,
            'account-balance',
            '#3b82f6'
          )}
          {renderKPI(
            t('totalLiabilities'),
            `Afg {kpis.currency} Afg {kpis.totalLiabilities.toLocaleString()}`,
            'account-balance-wallet',
            '#ef4444'
          )}
          {renderKPI(
            t('netIncome'),
            `Afg {kpis.currency} Afg {kpis.netIncome.toLocaleString()}`,
            'trending-up',
            kpis.netIncome >= 0 ? '#10b981' : '#ef4444'
          )}
          {renderKPI(
            t('workingCapital'),
            `Afg {kpis.currency} Afg {kpis.workingCapital.toLocaleString()}`,
            'savings',
            kpis.workingCapital >= 0 ? '#10b981' : '#f59e0b'
          )}
        </View>

        {/* Charts */}
        {renderChart()}

        {/* Filters */}
        {renderFilters()}

        {/* Accounts List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{t('chartOfAccounts')}</Text>
          <TouchableOpacity style={styles.addAccountButton}>
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={styles.addAccountButtonText}>{t('addAccount')}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredAccounts}
          keyExtractor={(item) => item.id}
          renderItem={renderAccountItem}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      </ScrollView>
    </View>
  );
};

// Helper functions
const getTypeColor = (type: AccountRow['type']) => {
  const colors = {
    Asset: '#3b82f6',
    Liability: '#ef4444',
    Income: '#10b981',
    Expense: '#f59e0b',
    Equity: '#8b5cf6'
  };
  return colors[type];
};

const getStatusColor = (status?: string) => {
  const colors = {
    active: '#10b981',
    inactive: '#64748b',
    suspended: '#ef4444'
  };
  return colors[status as keyof typeof colors] || '#64748b';
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
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addAccountButtonText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  accountCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountCode: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 12,
    color: '#64748b',
  },
  accountBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  balanceLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  accountDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  lastTransaction: {
    fontSize: 12,
    color: '#64748b',
  },
  accountActions: {
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
});

export default AccountsList; 
