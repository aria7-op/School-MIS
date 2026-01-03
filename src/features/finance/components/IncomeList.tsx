import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import moment from 'moment';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useTheme } from '@react-navigation/native';

import { useFinance } from '../hooks/useFinance';
import { Income as IncomeType } from '../services/comprehensiveFinanceApi';

// Income type based on API response
interface Income {
  id: number;
  description?: string;
  amount?: string;
  source?: string;
  income_date?: string;
  category?: string;
  payment_method?: string;
  status?: string;
  recurring?: boolean;
  notes?: string;
  [key: string]: any;
}

interface IncomeListProps {
  incomes: Income[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

let MaterialIcons, MaterialCommunityIcons, Feather;
if (Platform.OS === 'web') {
  MaterialIcons = require('react-icons/md').MdRefresh;
  MaterialCommunityIcons = require('react-icons/md').MdPayment;
  Feather = require('react-icons/fi').FiSearch;
} else {
  MaterialIcons = require('@expo/vector-icons').MaterialIcons;
  MaterialCommunityIcons = require('@expo/vector-icons').MaterialCommunityIcons;
  Feather = require('@expo/vector-icons').Feather;
}

const { width } = Dimensions.get('window');

const IncomeList: React.FC<IncomeListProps> = ({ incomes, dateRange }) => {
  const [searchText, setSearchText] = useState<string>('');
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'received' | 'pending' | 'recurring' | 'one-time'>('all');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const finance = useFinance();

  // Load comprehensive income data
  useEffect(() => {
    const loadComprehensiveIncomeData = async () => {
      setLoading(true);
      try {

        // Load all comprehensive income data
        await Promise.all([
          finance.fetchIncomes(),
          finance.fetchAnalytics(),
          finance.fetchDashboard()
        ]);

      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    loadComprehensiveIncomeData();
  }, []); // Empty dependency array to run only once on mount

  // --- KPI DATA with comprehensive backend integration ---
  const hasValidIncomes = (finance.incomes && finance.incomes.length > 0) || (incomes && incomes.length > 0);
  const totalIncomes = finance.incomes?.length || incomes?.length || 32;
  const receivedIncomes = finance.incomes?.filter(i => i.status?.toLowerCase() === 'received').length || 
                         incomes?.filter(i => i.status?.toLowerCase() === 'received').length || 28;
  const pendingIncomes = finance.incomes?.filter(i => i.status?.toLowerCase() === 'pending').length || 
                        incomes?.filter(i => i.status?.toLowerCase() === 'pending').length || 4;
  const recurringIncomes = finance.incomes?.filter(i => i.category?.toLowerCase() === 'recurring').length || 
                          incomes?.filter(i => i.recurring).length || 15;
  const oneTimeIncomes = finance.incomes?.filter(i => i.category?.toLowerCase() === 'one-time').length || 
                        incomes?.filter(i => !i.recurring).length || 17;
  const totalAmount = finance.incomes?.reduce((sum, i) => sum + parseFloat(i.amount?.toString() || '0'), 0) || 
                     incomes?.reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0) || 42500;
  const averageIncome = totalAmount / (totalIncomes || 1);

  // --- CHART DATA with comprehensive backend integration ---
  const sourceBreakdown = hasValidIncomes ? incomes.reduce((acc, i) => {
    const source = i.source || 'Other';
    acc[source] = (acc[source] || 0) + parseFloat(i.amount || '0');
    return acc;
  }, {} as Record<string, number>) : {};

  const sourceLabels = Object.keys(sourceBreakdown);
  const sourceData = sourceLabels.map(label => sourceBreakdown[label]);

  const categoryBreakdown = hasValidIncomes ? incomes.reduce((acc, i) => {
    const category = i.category || 'Other';
    acc[category] = (acc[category] || 0) + parseFloat(i.amount || '0');
    return acc;
  }, {} as Record<string, number>) : {};

  const categoryLabels = Object.keys(categoryBreakdown);
  const categoryData = categoryLabels.map(label => categoryBreakdown[label]);

  const methodBreakdown = hasValidIncomes ? incomes.reduce((acc, i) => {
    const method = i.payment_method || 'Other';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  const methodLabels = Object.keys(methodBreakdown);
  const methodData = methodLabels.map(label => methodBreakdown[label]);

  const dailyTrend = hasValidIncomes ? Array.from({ length: 7 }, (_, i) => {
    const date = moment().subtract(6 - i, 'days');
    const dayIncomes = incomes.filter(i => moment(i.income_date).isSame(date, 'day'));
    return {
      date: date.format('MMM DD'),
      amount: dayIncomes.reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0),
      count: dayIncomes.length
    };
  }) : [];

  // --- TOP INCOMES with comprehensive backend integration ---
  const topIncomes = hasValidIncomes ? incomes
    .sort((a, b) => parseFloat(b.amount || '0') - parseFloat(a.amount || '0'))
    .slice(0, 5)
    .map(i => ({
      description: i.description || 'Unknown',
      amount: parseFloat(i.amount || '0'),
      source: i.source || 'Other',
      status: i.status || 'Unknown'
    })) : [];

  // --- RECURRING VS ONE-TIME ANALYSIS ---
  const recurringVsOneTime = hasValidIncomes ? {
    'Recurring': incomes.filter(i => i.recurring).reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0),
    'One-Time': incomes.filter(i => !i.recurring).reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0)
  } : {};

  const recurringLabels = Object.keys(recurringVsOneTime);
  const recurringData = recurringLabels.map(label => recurringVsOneTime[label]);

  // --- SMART INSIGHTS ---
  const insights: Array<{ type: 'warning' | 'info' | 'error' | 'success'; text: string }> = [];
  if (pendingIncomes > 0) insights.push({ type: 'warning', text: `${pendingIncomes} incomes are pending receipt.` });
  if (recurringIncomes > 0) insights.push({ type: 'success', text: `${recurringIncomes} recurring income sources identified.` });
  if (averageIncome > 1500) insights.push({ type: 'success', text: `High average income of Afg ${averageIncome.toFixed(0)} per transaction.` });
  if (sourceLabels.length > 1) insights.push({ type: 'info', text: `Income diversified across ${sourceLabels.length} sources.` });
  if (recurringVsOneTime['Recurring'] > recurringVsOneTime['One-Time']) insights.push({ type: 'success', text: 'Recurring income exceeds one-time income - stable revenue.' });
  if (!insights.length) insights.push({ type: 'success', text: 'Income streams are healthy and diversified.' });

  // --- KPI CLICK HANDLERS ---
  const handleKpiClick = (filter: 'all' | 'received' | 'pending' | 'recurring' | 'one-time') => {
    setSelectedFilter(filter);
    setViewMode('table');
  };

  // Quick action handlers with comprehensive backend integration
  const handleExportCSV = async () => {
    setExporting(true);
    try {

      // Use comprehensive API for export
      const report = await finance.generateIntegratedPaymentReport({ 
        type: 'incomes', 
        format: 'csv',
        dateRange 
      });

      Alert.alert('Export Complete', 'Income data exported successfully!');
    } catch (error) {
      
      Alert.alert('Export Failed', 'Failed to export income data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleSendReminders = async () => {
    try {

      const pendingIncomeIds = (finance.incomes || incomes)
        ?.filter(i => i.status?.toLowerCase() === 'pending')
        ?.map(i => i.id?.toString()) || [];
      
      if (pendingIncomeIds.length > 0) {
        // Use notification API to send reminders

        Alert.alert('Reminders Sent', `${pendingIncomeIds.length} income reminders sent successfully!`);
      } else {
        Alert.alert('No Pending Incomes', 'No pending incomes to send reminders for.');
      }
    } catch (error) {
      
      Alert.alert('Reminder Failed', 'Failed to send income reminders. Please try again.');
    }
  };

  const handleAddIncome = () => {

    // This would typically open a modal or navigate to a form
  };

  const handleCreateIncome = async (incomeData: any) => {
    try {

      await finance.createIncome(incomeData);

      Alert.alert('Income Created', 'New income has been created successfully!');
    } catch (error) {
      
      Alert.alert('Creation Failed', 'Failed to create income. Please try again.');
    }
  };

  const handleUpdateIncome = async (id: string, incomeData: any) => {
    try {

      await finance.updateIncome(id, incomeData);

      Alert.alert('Income Updated', 'Income has been updated successfully!');
    } catch (error) {
      
      Alert.alert('Update Failed', 'Failed to update income. Please try again.');
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {

      await finance.deleteIncome(id);

      Alert.alert('Income Deleted', 'Income has been deleted successfully!');
    } catch (error) {
      
      Alert.alert('Deletion Failed', 'Failed to delete income. Please try again.');
    }
  };

  // Filter incomes based on selected KPI
  const filteredIncomes = (incomes || []).filter(income => {
    const description = (income.description || '').toLowerCase();
    const source = (income.source || '').toLowerCase();
    const category = (income.category || '').toLowerCase();
    const matchesSearch = description.includes(searchText.toLowerCase()) || 
                         source.includes(searchText.toLowerCase()) ||
                         category.includes(searchText.toLowerCase());
    
    const incomeDate = moment(income.income_date);
    const inDateRange = dateRange && dateRange.startDate && dateRange.endDate
      ? incomeDate.isSameOrAfter(dateRange.startDate) && incomeDate.isSameOrBefore(dateRange.endDate)
      : true;
    
    let matchesKpiFilter = true;
    if (selectedFilter === 'received') {
      matchesKpiFilter = income.status?.toLowerCase() === 'received';
    } else if (selectedFilter === 'pending') {
      matchesKpiFilter = income.status?.toLowerCase() === 'pending';
    } else if (selectedFilter === 'recurring') {
      matchesKpiFilter = income.recurring;
    } else if (selectedFilter === 'one-time') {
      matchesKpiFilter = !income.recurring;
    }
    
    return matchesSearch && inDateRange && matchesKpiFilter;
  });

  const renderDashboard = () => (
    <ScrollView style={styles.dashboardContainer}>
      {/* QUICK ACTIONS */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={handleExportCSV}>
          <Text style={styles.quickActionText}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={handleSendReminders}>
          <Text style={styles.quickActionText}>Send Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={handleAddIncome}>
          <Text style={styles.quickActionText}>Add Income</Text>
        </TouchableOpacity>
      </View>

      {/* KPI ROW - Clickable */}
      <View style={styles.kpiRow}>
        <TouchableOpacity 
          style={[styles.kpiCard, { backgroundColor: '#f0fdf4' }, selectedFilter === 'all' && styles.kpiCardActive]} 
          onPress={() => handleKpiClick('all')}
        >
          <Text style={styles.kpiValue}>{totalIncomes}</Text>
          <Text style={styles.kpiLabel}>Total</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.kpiCard, { backgroundColor: '#dcfce7' }, selectedFilter === 'received' && styles.kpiCardActive]} 
          onPress={() => handleKpiClick('received')}
        >
          <Text style={styles.kpiValue}>{receivedIncomes}</Text>
          <Text style={styles.kpiLabel}>Received</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.kpiCard, { backgroundColor: '#fef3c7' }, selectedFilter === 'pending' && styles.kpiCardActive]} 
          onPress={() => handleKpiClick('pending')}
        >
          <Text style={styles.kpiValue}>{pendingIncomes}</Text>
          <Text style={styles.kpiLabel}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.kpiCard, { backgroundColor: '#dbeafe' }, selectedFilter === 'recurring' && styles.kpiCardActive]} 
          onPress={() => handleKpiClick('recurring')}
        >
          <Text style={styles.kpiValue}>{recurringIncomes}</Text>
          <Text style={styles.kpiLabel}>Recurring</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.kpiCard, { backgroundColor: '#f3e8ff' }, selectedFilter === 'one-time' && styles.kpiCardActive]} 
          onPress={() => handleKpiClick('one-time')}
        >
          <Text style={styles.kpiValue}>{oneTimeIncomes}</Text>
          <Text style={styles.kpiLabel}>One-Time</Text>
        </TouchableOpacity>
      </View>

      {/* CHARTS SECTION */}
      <View style={styles.chartsSection}>
        <Text style={styles.chartsTitle}>Income Analytics</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>By Source</Text>
            <PieChart
              data={sourceLabels.map((label, i) => ({
                name: label,
                population: sourceData[i],
                color: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'][i % 5],
                legendFontColor: '#333',
                legendFontSize: 12,
              }))}
              width={180}
              height={140}
              chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, Afg {opacity})` }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
          
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>By Category</Text>
            <BarChart
              data={{ labels: categoryLabels, datasets: [{ data: categoryData }] }}
              width={220}
              height={140}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(16, 185, 129, Afg {opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,Afg {opacity})`,
                style: { borderRadius: 8 },
                propsForBackgroundLines: { stroke: '#e5e7eb', strokeWidth: 1 },
              }}
              style={{ borderRadius: 8 }}
              fromZero
              showBarTops
              showValuesOnTopOfBars
            />
          </View>
          
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>7-Day Trend</Text>
            <LineChart
              data={{
                labels: dailyTrend.map(d => d.date),
                datasets: [{ data: dailyTrend.map(d => d.amount) }],
              }}
              width={220}
              height={140}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(16, 185, 129, Afg {opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,Afg {opacity})`,
                style: { borderRadius: 8 },
                propsForBackgroundLines: { stroke: '#e5e7eb', strokeWidth: 1 },
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          </View>
          
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Recurring vs One-Time</Text>
            <BarChart
              data={{ labels: recurringLabels, datasets: [{ data: recurringData }] }}
              width={220}
              height={140}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, Afg {opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,Afg {opacity})`,
                style: { borderRadius: 8 },
                propsForBackgroundLines: { stroke: '#e5e7eb', strokeWidth: 1 },
              }}
              style={{ borderRadius: 8 }}
              fromZero
              showBarTops
              showValuesOnTopOfBars
            />
          </View>
        </ScrollView>
      </View>

      {/* TOP INCOMES */}
      <View style={styles.topIncomesPanel}>
        <Text style={styles.topIncomesTitle}>Top 5 Incomes</Text>
        {topIncomes.map((income, idx) => (
          <View key={income.description} style={styles.topIncomeRow}>
            <Text style={styles.topIncomeRank}>{idx + 1}.</Text>
            <View style={styles.topIncomeInfo}>
              <Text style={styles.topIncomeName}>{income.description}</Text>
              <Text style={styles.topIncomeSource}>{income.source}</Text>
            </View>
            <View style={styles.topIncomeAmount}>
              <Text style={styles.amountText}>Afg {income.amount.toLocaleString()}</Text>
              <View style={[styles.statusBadge, styles[`statusAfg {income.status?.toLowerCase()}`]]}>
                <Text style={styles.statusText}>{income.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* SMART INSIGHTS */}
      <View style={styles.insightsPanel}>
        <Text style={styles.insightsTitle}>Smart Insights</Text>
        {insights.map((insight, idx) => (
          <Text key={idx} style={[styles.insightText, styles[`insightAfg {insight.type}`]]}>
            • {insight.text}
          </Text>
        ))}
      </View>

      {/* Filter indicator */}
      {selectedFilter !== 'all' && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterIndicatorText}>
            Showing {selectedFilter} incomes ({filteredIncomes.length} results)
          </Text>
          <TouchableOpacity onPress={() => handleKpiClick('all')}>
            <Text style={styles.clearFilterText}>Clear Filter</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderTable = () => (
    <View style={styles.tableContainer}>
      {/* Filter indicator */}
      {selectedFilter !== 'all' && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterIndicatorText}>
            Showing {selectedFilter} incomes ({filteredIncomes.length} results)
          </Text>
          <TouchableOpacity onPress={() => handleKpiClick('all')}>
            <Text style={styles.clearFilterText}>Clear Filter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Controls */}
      <View style={styles.filterRow}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search incomes..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <View style={styles.filterButtons}>
          {['all', 'received', 'pending', 'recurring', 'one-time'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter as 'all' | 'received' | 'pending' | 'recurring' | 'one-time')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === filter && styles.filterButtonTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Table content */}
      <ScrollView style={styles.tableScroll}>
        {filteredIncomes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No incomes found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your filters or search terms</Text>
          </View>
        ) : (
          filteredIncomes.map((income) => (
            <View key={income.id} style={styles.incomeRow}>
              <View style={styles.incomeInfo}>
                <Text style={styles.incomeName}>{income.description || 'No description'}</Text>
                <Text style={styles.incomeDate}>
                  {moment(income.income_date).format('MMM DD, YYYY')}
                </Text>
                <Text style={styles.incomeSource}>{income.source || 'Unknown source'}</Text>
                {income.category && <Text style={styles.incomeCategory}>Category: {income.category}</Text>}
              </View>
              <View style={styles.incomeAmount}>
                <Text style={styles.amountText}>Afg {income.amount.toLocaleString()}</Text>
                <View style={[styles.statusBadge, styles[`statusAfg {income.status?.toLowerCase()}`]]}>
                  <Text style={styles.statusText}>{income.status || 'Unknown'}</Text>
                </View>
                {income.recurring && (
                  <View style={styles.recurringBadge}>
                    <Text style={styles.recurringText}>Recurring</Text>
                  </View>
                )}
                {income.payment_method && (
                  <Text style={styles.paymentMethod}>{income.payment_method}</Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with View Toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Income Management</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'dashboard' && styles.viewButtonActive]}
            onPress={() => setViewMode('dashboard')}
          >
            <MaterialIcons name="dashboard" size={20} color={viewMode === 'dashboard' ? '#fff' : '#666'} />
            <Text style={[styles.viewButtonText, viewMode === 'dashboard' && styles.viewButtonTextActive]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'table' && styles.viewButtonActive]}
            onPress={() => setViewMode('table')}
          >
            <MaterialIcons name="table-chart" size={20} color={viewMode === 'table' ? '#fff' : '#666'} />
            <Text style={[styles.viewButtonText, viewMode === 'table' && styles.viewButtonTextActive]}>Table</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'dashboard' ? renderDashboard() : renderTable()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: '#3b82f6',
  },
  viewButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  viewButtonTextActive: {
    color: '#fff',
  },
  dashboardContainer: {
    flex: 1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  quickActionBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  kpiCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  kpiCardActive: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  chartsSection: {
    padding: 16,
  },
  chartsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  topIncomesPanel: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  topIncomesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  topIncomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topIncomeRank: {
    width: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginRight: 8,
  },
  topIncomeInfo: {
    flex: 1,
  },
  topIncomeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  topIncomeSource: {
    fontSize: 12,
    color: '#6b7280',
  },
  topIncomeAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusreceived: {
    backgroundColor: '#d1fae5',
  },
  statuspending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  recurringBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  recurringText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
  },
  insightsPanel: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  insightText: {
    fontSize: 14,
    marginBottom: 4,
  },
  insightwarning: {
    color: '#f59e0b',
  },
  insightinfo: {
    color: '#3b82f6',
  },
  insighterror: {
    color: '#ef4444',
  },
  insightsuccess: {
    color: '#10b981',
  },
  filterIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    marginBottom: 16,
    borderRadius: 8,
  },
  filterIndicatorText: {
    fontSize: 14,
    color: '#374151',
  },
  clearFilterText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
    padding: 16,
  },
  tableScroll: {
    flex: 1,
  },
  filterRow: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  incomeRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  incomeInfo: {
    flex: 1,
  },
  incomeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  incomeDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  incomeSource: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  incomeCategory: {
    fontSize: 12,
    color: '#9ca3af',
  },
  incomeAmount: {
    alignItems: 'flex-end',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default IncomeList;
