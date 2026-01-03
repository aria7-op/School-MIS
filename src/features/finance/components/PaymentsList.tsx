import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import moment from 'moment';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import Tooltip from '../../../components/ui/Tooltip';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useTheme } from '@react-navigation/native';

import { useFinance } from '../hooks/useFinance';
import { Payment as PaymentType } from '../services/comprehensiveFinanceApi';

export interface Payment {
  id: number;
  final_amount: string;
  payment_status: string;
  payment_date: string;
  student?: {
    firstName: string;
    lastName: string;
    phone: string;
    class?: { class_name: string };
  };
  fees: string;
  payment_method: string;
  overdue: boolean;
  d_path?: string;
  file_path?: string;
  payment_type?: string;
}

interface PaymentListProps {
  payments: Payment[];
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

const PaymentsList: React.FC<PaymentListProps> = ({ payments, dateRange }) => {
  const [searchText, setSearchText] = useState<string>('');
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending' | 'overdue' | 'failed'>('all');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const finance = useFinance();

  // Load comprehensive payment data
  useEffect(() => {
    const loadComprehensiveData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          finance.fetchPayments(),
          finance.fetchAnalytics(),
          finance.fetchDashboard()
        ]);
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    loadComprehensiveData();
  }, []); // Empty dependency array to run only once on mount

  // Helper functions for safe access to student properties
  const getStudentName = (payment: Payment): string => {
    const firstName = payment.student?.firstName || '';
    const lastName = payment.student?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Student';
  };

  const getStudentFirstName = (payment: Payment): string => {
    return payment.student?.firstName || 'Unknown';
  };

  const getStudentLastName = (payment: Payment): string => {
    return payment.student?.lastName || 'Student';
  };

  const getStudentPhone = (payment: Payment): string => {
    return payment.student?.phone || '';
  };

  // --- KPI DATA with comprehensive backend integration ---
  const totalPayments = finance.payments?.length || payments?.length || 0;
  const completedPayments = finance.payments?.filter(p => p.status?.toLowerCase() === 'paid' || p.status?.toLowerCase() === 'completed').length || 
                           payments?.filter(p => p.payment_status?.toLowerCase() === 'paid' || p.payment_status?.toLowerCase() === 'completed').length || 0;
  const pendingPayments = finance.payments?.filter(p => p.status?.toLowerCase() === 'pending').length || 
                         payments?.filter(p => p.payment_status?.toLowerCase() === 'pending').length || 0;
  const overduePayments = finance.payments?.filter(p => p.status?.toLowerCase() === 'overdue').length || 
                         payments?.filter(p => p.overdue).length || 0;
  const failedPayments = finance.payments?.filter(p => p.status?.toLowerCase() === 'failed').length || 
                        payments?.filter(p => p.payment_status?.toLowerCase() === 'failed').length || 0;
  const totalAmount = finance.payments?.reduce((sum, p) => sum + parseFloat(p.total?.toString() || '0'), 0) || 
                     payments?.reduce((sum, p) => sum + parseFloat(p.final_amount || '0'), 0) || 0;

  // --- CHART DATA with comprehensive backend integration ---
  const hasValidPayments = (finance.payments && finance.payments.length > 0) || (payments && payments.length > 0);
  
  // Use comprehensive backend data for method breakdown
  const methodBreakdown = hasValidPayments ? (finance.payments || payments).reduce((acc, p) => {
    const method = p.method || p.payment_method || 'Other';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};
  
  const methodLabels = Object.keys(methodBreakdown);
  const methodData = methodLabels.map(label => methodBreakdown[label]);

  const statusBreakdown = hasValidPayments ? (finance.payments || payments).reduce((acc, p) => {
    const status = p.status || p.payment_status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};
  
  const statusLabels = Object.keys(statusBreakdown);
  const statusData = statusLabels.map(label => statusBreakdown[label]);

  const dailyTrend = hasValidPayments ? Array.from({ length: 7 }, (_, i) => {
    const date = moment().subtract(6 - i, 'days');
    const dayPayments = payments.filter(p => moment(p.payment_date).isSame(date, 'day'));
    return {
      date: date.format('MMM DD'),
      amount: dayPayments.reduce((sum, p) => sum + parseFloat(p.final_amount || '0'), 0)
    };
  }) : [];

  // --- TOP 5 PAYERS with comprehensive backend integration ---
  const topPayers = hasValidPayments ? Object.entries(
    payments.reduce((acc, p) => {
      const name = getStudentName(p);
      acc[name] = (acc[name] || 0) + parseFloat(p.final_amount || '0');
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5) : [];

  // Debug logging

  // --- SMART INSIGHTS ---
  const insights: Array<{ type: 'warning' | 'info' | 'error' | 'success'; text: string }> = [];
  if (overduePayments > 0) insights.push({ type: 'warning', text: `${overduePayments} payments are overdue.` });
  if (pendingPayments > 0) insights.push({ type: 'info', text: `${pendingPayments} payments are pending.` });
  if (completedPayments / (totalPayments || 1) < 0.8) insights.push({ type: 'error', text: 'Completion rate is below 80%.' });
  if (methodLabels.length > 1) insights.push({ type: 'success', text: `Multiple payment methods used. Most popular: ${methodLabels[0]}` });
  if (!insights.length) insights.push({ type: 'success', text: 'Payments are healthy.' });

  // --- KPI CLICK HANDLERS ---
  const handleKpiClick = (filter: 'all' | 'completed' | 'pending' | 'overdue' | 'failed') => {
    setSelectedFilter(filter);
    setViewMode('table'); // Switch to table view
  };

  // Quick action handlers
  const handleExportCSV = () => {
    setExporting(true);
    // Simulate export
    setTimeout(() => {
      setExporting(false);
      // Here you would implement actual CSV export
    }, 2000);
  };

  const handleSendReminders = () => {
    // Here you would implement reminder sending logic

  };

  const handleAddPayment = () => {
    // Here you would navigate to add payment screen

  };

  // Filter payments based on selected KPI
  const filteredPayments = (payments || []).filter(payment => {
    // Search filter
    const studentName = getStudentName(payment).toLowerCase();
    const studentPhone = getStudentPhone(payment);
    const matchesSearch = studentName.includes(searchText.toLowerCase()) || studentPhone.includes(searchText);
    
    // Date filter
    const paymentDate = moment(payment.payment_date);
    const inDateRange = paymentDate.isSameOrAfter(dateRange.startDate) && paymentDate.isSameOrBefore(dateRange.endDate);
    
    // KPI filter
    let matchesKpiFilter = true;
    if (selectedFilter === 'completed') {
      matchesKpiFilter = payment.payment_status?.toLowerCase() === 'paid' || payment.payment_status?.toLowerCase() === 'completed';
    } else if (selectedFilter === 'pending') {
      matchesKpiFilter = payment.payment_status?.toLowerCase() === 'pending';
    } else if (selectedFilter === 'overdue') {
      matchesKpiFilter = payment.overdue;
    } else if (selectedFilter === 'failed') {
      matchesKpiFilter = payment.payment_status?.toLowerCase() === 'failed';
    }
    
    return matchesSearch && inDateRange && matchesKpiFilter;
  });

  // Add the missing renderKPI function
  const renderKPI = (title: string, value: string, icon: string, color: string) => (
    <TouchableOpacity
      style={[styles.kpiCard, { borderLeftColor: color }]}
      onPress={() => handleKpiClick(title.toLowerCase() as any)}
    >
      <View style={styles.kpiContent}>
        <Text style={styles.kpiTitle}>{title}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
      </View>
      <View style={[styles.kpiIcon, { backgroundColor: color }]}>
        <Feather name={icon as any} size={16} color="white" />
      </View>
    </TouchableOpacity>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.dashboardContainer}>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        {renderKPI(
          t('totalPayments'),
          `Afg ${totalPayments.toLocaleString()}`,
          'payment',
          '#3b82f6'
        )}
        {renderKPI(
          t('pendingPayments'),
          `Afg ${pendingPayments.toLocaleString()}`,
          'schedule',
          '#f59e0b'
        )}
        {renderKPI(
          t('completedPayments'),
          `Afg ${completedPayments.toLocaleString()}`,
          'check-circle',
          '#10b981'
        )}
        {renderKPI(
          t('failedPayments'),
          `Afg ${failedPayments.toLocaleString()}`,
          'error',
          '#ef4444'
        )}
      </View>

      {/* CHARTS - Always with data */}
      <View style={styles.chartsSection}>
        <Text style={styles.chartsTitle}>Payment Analytics</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>By Method</Text>
            <BarChart
              data={{ labels: methodLabels, datasets: [{ data: methodData }] }}
              width={220}
              height={140}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
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
            <Text style={styles.chartTitle}>Status</Text>
            <PieChart
              data={statusLabels.map((label, i) => ({
                name: label,
                population: statusData[i],
                color: ['#10B981', '#F59E0B', '#EF4444', '#6B7280'][i % 4],
                legendFontColor: '#333',
                legendFontSize: 12,
              }))}
              width={180}
              height={140}
              chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
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
                color: (opacity = 1) => `rgba(59, 130, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                style: { borderRadius: 8 },
                propsForBackgroundLines: { stroke: '#e5e7eb', strokeWidth: 1 },
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          </View>
        </ScrollView>
      </View>

      {/* TOP 5 PAYERS */}
      <View style={styles.topPayersPanel}>
        <Text style={styles.topPayersTitle}>Top 5 Payers</Text>
        {topPayers.map(([name, amount], idx) => (
          <View key={name} style={styles.topPayerRow}>
            <Text style={styles.topPayerRank}>{idx + 1}.</Text>
            <Text style={styles.topPayerName}>{name}</Text>
            <Text style={styles.topPayerAmount}>Afg {Number(amount).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Filter indicator */}
      {selectedFilter !== 'all' && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterIndicatorText}>
            Showing {selectedFilter} payments ({filteredPayments.length} results)
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
            Showing {selectedFilter} payments ({filteredPayments.length} results)
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
            placeholder={t('searchStudents')}
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <View style={styles.filterButtons}>
          {['all', 'overdue', 'pending', 'completed'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter as 'all' | 'completed' | 'pending' | 'overdue' | 'failed')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === filter && styles.filterButtonTextActive]}>
                {t(filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Table content */}
      <ScrollView style={styles.tableScroll}>
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No payments found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your filters or search terms</Text>
          </View>
        ) : (
          filteredPayments.map((payment) => (
            <View key={payment.id} style={styles.paymentRow}>
              <View style={styles.paymentInfo}>
                <Text style={styles.studentName}>{getStudentName(payment)}</Text>
                <Text style={styles.paymentDate}>
                  {moment(payment.payment_date).format('MMM DD, YYYY')}
                </Text>
                <Text style={styles.paymentMethod}>{payment.payment_method}</Text>
              </View>
              <View style={styles.paymentAmount}>
                <Text style={styles.amountText}>Afg {payment.final_amount}</Text>
                <View style={[styles.statusBadge, (styles as any)[`status${payment.payment_status?.toLowerCase()}`]]}>
                  <Text style={styles.statusText}>{payment.payment_status}</Text>
                </View>
                {payment.overdue && (
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueText}>Overdue</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  // Return the appropriate view
  return (
    <View style={styles.container}>
      {/* Header with Action Buttons and View Toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment Management</Text>
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
              <TouchableOpacity style={styles.headerActionBtn} onPress={handleSendReminders}>
                <MaterialIcons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </Tooltip>
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  kpiContent: {
    flex: 1,
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  kpiSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  kpiIcon: {
    opacity: 0.8,
  },
  chartsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  insightsSection: {
    padding: 16,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  insightwarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  insighterror: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  insightsuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  insightinfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginLeft: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  prioritycritical: {
    backgroundColor: '#fee2e2',
  },
  priorityhigh: {
    backgroundColor: '#fef3c7',
  },
  prioritymedium: {
    backgroundColor: '#dbeafe',
  },
  prioritylow: {
    backgroundColor: '#d1fae5',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  insightAction: {
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  insightActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  analyticsSection: {
    padding: 16,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  topPayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topPayerRank: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  topPayerName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  topPayerAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  forecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forecastLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  forecastValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  riskHigh: {
    backgroundColor: '#fee2e2',
  },
  riskMedium: {
    backgroundColor: '#fef3c7',
  },
  riskLow: {
    backgroundColor: '#d1fae5',
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
    padding: 16,
  },
  tableScroll: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#fff',
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
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  placeholderText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 50,
  },
  topPayersPanel: {
    padding: 16,
  },
  topPayersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  topPayersEmpty: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
  },
  insightsPanel: {
    padding: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
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

  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
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
  reminderBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  reminderBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  kpiCardActive: {
    borderWidth: 2,
    borderColor: '#3b82f6',
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
  topPayersPanel: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  topPayersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  topPayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topPayerRank: {
    width: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginRight: 8,
  },
  topPayerName: {
    flex: 1,
    color: '#374151',
  },
  topPayerAmount: {
    fontWeight: 'bold',
    color: '#10b981',
  },
  insightsPanel: {
    margin: 16,
    padding: 16,
    backgroundColor: '#e3f2fd',
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
    color: '#3b82f6',
    fontWeight: '600',
  },
  // Table styles
  paymentRow: {
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
  paymentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#9ca3af',
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
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
  statuspaid: {
    backgroundColor: '#d1fae5',
  },
  statuscompleted: {
    backgroundColor: '#d1fae5',
  },
  statuspending: {
    backgroundColor: '#fef3c7',
  },
  statusfailed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  overdueBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
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

export default PaymentsList;
