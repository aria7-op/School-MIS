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
import Tooltip from '../../../components/ui/Tooltip';

import { useFinance } from '../hooks/useFinance';
import { Expense as ExpenseType } from '../services/comprehensiveFinanceApi';

// Expense type based on API response
interface Expense {
  id: number;
  description?: string;
  amount?: string;
  category?: string;
  expense_date?: string;
  vendor?: string;
  payment_method?: string;
  status?: string;
  approved_by?: string;
  receipt_url?: string;
  notes?: string;
  recurring?: boolean;
  [key: string]: any;
}

interface ExpensesListProps {
  expenses: Expense[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

let MaterialIcons, MaterialCommunityIcons, Feather;
if (Platform.OS === 'web') {
  MaterialIcons = require('@expo/vector-icons').MaterialIcons;
  MaterialCommunityIcons = require('react-icons/md').MdPayment;
  Feather = require('react-icons/fi').FiSearch;
} else {
  MaterialIcons = require('@expo/vector-icons').MaterialIcons;
  MaterialCommunityIcons = require('@expo/vector-icons').MaterialCommunityIcons;
  Feather = require('@expo/vector-icons').Feather;
}

const { width } = Dimensions.get('window');

const ExpensesList: React.FC<ExpensesListProps> = ({ expenses, dateRange }) => {
  const [searchText, setSearchText] = useState<string>('');
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'recurring'>('all');
  const [exporting, setExporting] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();

  // --- KPI DATA with comprehensive backend integration ---
  const hasValidExpenses = expenses && expenses.length > 0;
  const totalExpenses = expenses?.length || 0;
  const approvedExpenses = expenses?.filter(e => e.status?.toLowerCase() === 'approved').length || 0;
  const pendingExpenses = expenses?.filter(e => e.status?.toLowerCase() === 'pending').length || 0;
  const rejectedExpenses = expenses?.filter(e => e.status?.toLowerCase() === 'rejected').length || 0;
  const recurringExpenses = expenses?.filter(e => e.recurring).length || 0;
  const totalAmount = expenses?.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0) || 0;
  const averageExpense = totalAmount / (totalExpenses || 1);

  // --- CHART DATA with comprehensive backend integration ---
  const categoryBreakdown = hasValidExpenses ? expenses.reduce((acc, e) => {
    const category = e.category || 'Other';
    acc[category] = (acc[category] || 0) + parseFloat(e.amount || '0');
    return acc;
  }, {} as Record<string, number>) : {};

  const categoryLabels = Object.keys(categoryBreakdown);
  const categoryData = categoryLabels.map(label => categoryBreakdown[label]);

  const statusBreakdown = hasValidExpenses ? expenses.reduce((acc, e) => {
    const status = e.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  const statusLabels = Object.keys(statusBreakdown);
  const statusData = statusLabels.map(label => statusBreakdown[label]);

  const methodBreakdown = hasValidExpenses ? expenses.reduce((acc, e) => {
    const method = e.payment_method || 'Other';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  const methodLabels = Object.keys(methodBreakdown);
  const methodData = methodLabels.map(label => methodBreakdown[label]);

  const dailyTrend = hasValidExpenses ? Array.from({ length: 7 }, (_, i) => {
    const date = moment().subtract(6 - i, 'days');
    const dayExpenses = expenses.filter(e => moment(e.expense_date).isSame(date, 'day'));
    return {
      date: date.format('MMM DD'),
      amount: dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0),
      count: dayExpenses.length
    };
  }) : [];

  // --- TOP EXPENSES with comprehensive backend integration ---
  const topExpenses = hasValidExpenses ? expenses
    .sort((a, b) => parseFloat(b.amount || '0') - parseFloat(a.amount || '0'))
    .slice(0, 5)
    .map(e => ({
      description: e.description || 'Unknown',
      amount: parseFloat(e.amount || '0'),
      category: e.category || 'Other',
      status: e.status || 'Unknown'
    })) : [];

  // --- VENDOR ANALYSIS ---
  const vendorBreakdown = hasValidExpenses ? expenses.reduce((acc, e) => {
    const vendor = e.vendor || 'Unknown';
    acc[vendor] = (acc[vendor] || 0) + parseFloat(e.amount || '0');
    return acc;
  }, {} as Record<string, number>) : {};

  const vendorLabels = Object.keys(vendorBreakdown).slice(0, 5);
  const vendorData = vendorLabels.map(label => vendorBreakdown[label]);

  // --- SMART INSIGHTS ---
  const insights: Array<{ type: 'warning' | 'info' | 'error' | 'success'; text: string }> = [];
  if (pendingExpenses > 0) insights.push({ type: 'warning', text: `Afg {pendingExpenses} expenses are pending approval.` });
  if (rejectedExpenses > 0) insights.push({ type: 'error', text: `Afg {rejectedExpenses} expenses were rejected.` });
  if (averageExpense > 1000) insights.push({ type: 'warning', text: `Average expense is $Afg {averageExpense.toFixed(0)} - consider reviewing.` });
  if (recurringExpenses > 0) insights.push({ type: 'info', text: `Afg {recurringExpenses} recurring expenses identified.` });
  if (categoryLabels.length > 1) insights.push({ type: 'success', text: `Expenses spread across Afg {categoryLabels.length} categories.` });
  if (!insights.length) insights.push({ type: 'success', text: 'Expenses are well managed.' });

  // --- KPI CLICK HANDLERS ---
  const handleKpiClick = (filter: 'all' | 'approved' | 'pending' | 'rejected' | 'recurring') => {
    setSelectedFilter(filter);
    setViewMode('table');
  };

  // Quick action handlers
  const handleExportCSV = () => {
    setExporting(true);
    setTimeout(() => setExporting(false), 2000);
  };

  const handleBulkApprove = () => {

  };

  const handleAddExpense = () => {

  };

  // Filter expenses based on selected KPI
  const filteredExpenses = (expenses || []).filter(expense => {
    const description = (expense.description || '').toLowerCase();
    const category = (expense.category || '').toLowerCase();
    const vendor = (expense.vendor || '').toLowerCase();
    const matchesSearch = description.includes(searchText.toLowerCase()) || 
                         category.includes(searchText.toLowerCase()) ||
                         vendor.includes(searchText.toLowerCase());
    
    const expenseDate = moment(expense.expense_date);
    const inDateRange = dateRange && dateRange.startDate && dateRange.endDate
      ? expenseDate.isSameOrAfter(dateRange.startDate) && expenseDate.isSameOrBefore(dateRange.endDate)
      : true;
    
    let matchesKpiFilter = true;
    if (selectedFilter === 'approved') {
      matchesKpiFilter = expense.status?.toLowerCase() === 'approved';
    } else if (selectedFilter === 'pending') {
      matchesKpiFilter = expense.status?.toLowerCase() === 'pending';
    } else if (selectedFilter === 'rejected') {
      matchesKpiFilter = expense.status?.toLowerCase() === 'rejected';
    } else if (selectedFilter === 'recurring') {
      matchesKpiFilter = expense.recurring;
    }
    
    return matchesSearch && inDateRange && matchesKpiFilter;
  });

  const renderDashboard = () => (
    <ScrollView style={styles.dashboardContainer}>


     

      {/* CHARTS SECTION */}
      <View style={styles.chartsSection}>
        <Text style={styles.chartsTitle}>Expense Analytics</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>By Category</Text>
            <PieChart
              data={categoryLabels.map((label, i) => ({
                name: label,
                population: categoryData[i],
                color: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#6B7280'][i % 6],
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
            <Text style={styles.chartTitle}>By Status</Text>
            <BarChart
              data={{ labels: statusLabels, datasets: [{ data: statusData }] }}
              width={220}
              height={140}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(239, 68, 68, Afg {opacity})`,
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
                color: (opacity = 1) => `rgba(239, 68, 68, Afg {opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,Afg {opacity})`,
                style: { borderRadius: 8 },
                propsForBackgroundLines: { stroke: '#e5e7eb', strokeWidth: 1 },
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          </View>
          
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Top Vendors</Text>
            <BarChart
              data={{ labels: vendorLabels, datasets: [{ data: vendorData }] }}
              width={220}
              height={140}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(245, 158, 11, Afg {opacity})`,
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

      {/* TOP EXPENSES */}
      <View style={styles.topExpensesPanel}>
        <Text style={styles.topExpensesTitle}>Top 5 Expenses</Text>
        {topExpenses.map((expense, idx) => (
          <View key={expense.description} style={styles.topExpenseRow}>
            <Text style={styles.topExpenseRank}>{idx + 1}.</Text>
            <View style={styles.topExpenseInfo}>
              <Text style={styles.topExpenseName}>{expense.description}</Text>
              <Text style={styles.topExpenseCategory}>{expense.category}</Text>
            </View>
            <View style={styles.topExpenseAmount}>
              <Text style={styles.amountText}>Afg {expense.amount.toLocaleString()}</Text>
              <View style={[styles.statusBadge, styles[`statusAfg {expense.status?.toLowerCase()}`]]}>
                <Text style={styles.statusText}>{expense.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Filter indicator */}
      {selectedFilter !== 'all' && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterIndicatorText}>
            Showing {selectedFilter} expenses ({filteredExpenses.length} results)
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
            Showing {selectedFilter} expenses ({filteredExpenses.length} results)
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
            placeholder="Search expenses..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <View style={styles.filterButtons}>
          {['all', 'approved', 'pending', 'rejected', 'recurring'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter as 'all' | 'approved' | 'pending' | 'rejected' | 'recurring')}
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
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No expenses found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your filters or search terms</Text>
          </View>
        ) : (
          filteredExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseRow}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseName}>{expense.description || 'No description'}</Text>
                <Text style={styles.expenseDate}>
                  {moment(expense.expense_date).format('MMM DD, YYYY')}
                </Text>
                <Text style={styles.expenseCategory}>{expense.category || 'Uncategorized'}</Text>
                {expense.vendor && <Text style={styles.expenseVendor}>Vendor: {expense.vendor}</Text>}
              </View>
              <View style={styles.expenseAmount}>
                <Text style={styles.amountText}>-Afg {expense.amount || '0.00'}</Text>
                <View style={[styles.statusBadge, styles[`statusAfg {expense.status?.toLowerCase()}`]]}>
                  <Text style={styles.statusText}>{expense.status || 'Unknown'}</Text>
                </View>
                {expense.recurring && (
                  <View style={styles.recurringBadge}>
                    <Text style={styles.recurringText}>Recurring</Text>
                  </View>
                )}
                {expense.payment_method && (
                  <Text style={styles.paymentMethod}>{expense.payment_method}</Text>
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
      {/* Header with View Toggle and Action Buttons */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expense Management</Text>
        <View style={styles.headerRight}>
          <View style={styles.actionButtons}>
            <Tooltip text={exporting ? "Exporting..." : "Export CSV"}>
              <TouchableOpacity style={styles.headerActionBtn} onPress={handleExportCSV}>
                <MaterialIcons 
                  name={exporting ? "hourglass-empty" : "get-app"} 
                  size={18} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </Tooltip>
            <Tooltip text="Send Reminders">
              <TouchableOpacity style={styles.headerActionBtn} onPress={handleBulkApprove}>
                <MaterialIcons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </Tooltip>
          </View>
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
    elevation: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
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
    gap: 12,
    padding: 16,
    justifyContent: 'flex-start',
  },
  quickActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
    elevation: 3,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 0,
    transform: [{ scale: 1 }],
  },
  quickActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
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
    borderColor: '#ef4444',
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
  topExpensesPanel: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  topExpensesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  topExpenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topExpenseRank: {
    width: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginRight: 8,
  },
  topExpenseInfo: {
    flex: 1,
  },
  topExpenseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  topExpenseCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  topExpenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusapproved: {
    backgroundColor: '#d1fae5',
  },
  statuspending: {
    backgroundColor: '#fef3c7',
  },
  statusrejected: {
    backgroundColor: '#fee2e2',
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
    backgroundColor: '#fef2f2',
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
    color: '#ef4444',
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
    backgroundColor: '#ef4444',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  expenseRow: {
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
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  expenseVendor: {
    fontSize: 12,
    color: '#9ca3af',
  },
  expenseAmount: {
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

export default ExpensesList;
