import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import moment from 'moment';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useTheme } from '@react-navigation/native';

import { useFinance } from '../hooks/useFinance';
import { Installment as InstallmentType } from '../services/comprehensiveFinanceApi';

// Installment type based on API response
interface Installment {
  id: number;
  student?: { firstName: string; lastName: string; phone: string; class?: { class_name: string } };
  amount: string;
  due_date: string;
  status: string;
  payment_method?: string;
  paid_date?: string;
  overdue?: boolean;
  notes?: string;
  [key: string]: any;
}

interface InstallmentsListProps {
  installments: Installment[];
  dateRange: { startDate: string; endDate: string };
}

let MaterialIcons, Feather;
if (Platform.OS === 'web') {
  MaterialIcons = require('react-icons/md').MdRefresh;
  Feather = require('react-icons/fi').FiSearch;
} else {
  MaterialIcons = require('@expo/vector-icons').MaterialIcons;
  Feather = require('@expo/vector-icons').Feather;
}

const { width } = Dimensions.get('window');

const InstallmentsList: React.FC<InstallmentsListProps> = ({ installments, dateRange }) => {
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'failed'>('all');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const finance = useFinance();

  // Load comprehensive installment data
  useEffect(() => {
    const loadComprehensiveInstallmentData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          finance.fetchInstallments(),
          finance.getInstallmentStatistics(),
          finance.getInstallmentAnalytics(),
          finance.getInstallmentDashboard(),
        ]);
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };
    loadComprehensiveInstallmentData();
  }, []); // Empty dependency array to run only once on mount

  // Helper functions for safe access to student properties
  const getStudentName = (installment: Installment): string => {
    const firstName = installment.student?.firstName || '';
    const lastName = installment.student?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Student';
  };

  // --- KPI DATA with comprehensive backend integration ---
  const hasValidInstallments = (finance.installments && finance.installments.length > 0) || (installments && installments.length > 0);
  const totalInstallments = finance.installments?.length || installments?.length || 0;
  const paidInstallments = finance.installments?.filter(i => i.status?.toLowerCase() === 'paid').length ||
                          installments?.filter(i => i.status?.toLowerCase() === 'paid').length || 0;
  const pendingInstallments = finance.installments?.filter(i => i.status?.toLowerCase() === 'pending').length ||
                             installments?.filter(i => i.status?.toLowerCase() === 'pending').length || 0;
  const overdueInstallments = finance.installments?.filter(i => i.status?.toLowerCase() === 'overdue').length ||
                             installments?.filter(i => i.status?.toLowerCase() === 'overdue').length || 0;
  const failedInstallments = finance.installments?.filter(i => i.status?.toLowerCase() === 'failed').length ||
                            installments?.filter(i => i.status?.toLowerCase() === 'failed').length || 0;
  const totalAmount = finance.installments?.reduce((sum, i) => sum + parseFloat(i.amount?.toString() || '0'), 0) ||
                     installments?.reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0) || 0;

  // --- CHART DATA ---
  const statusBreakdown = hasValidInstallments ? (finance.installments || installments).reduce((acc, i) => {
    const status = i.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};
  const statusLabels = Object.keys(statusBreakdown);
  const statusData = statusLabels.map(label => statusBreakdown[label]);

  const methodBreakdown = hasValidInstallments ? (finance.installments || installments).reduce((acc, i) => {
    const method = i.payment_method || 'Other';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};
  const methodLabels = Object.keys(methodBreakdown);
  const methodData = methodLabels.map(label => methodBreakdown[label]);

  const dailyTrend = hasValidInstallments ? Array.from({ length: 7 }, (_, i) => {
    const date = moment().subtract(6 - i, 'days');
    const dayInstallments = installments.filter(i => moment(i.due_date).isSame(date, 'day'));
    return {
      date: date.format('MMM DD'),
      amount: dayInstallments.reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0),
      count: dayInstallments.length,
    };
  }) : [];

  // --- ACTION HANDLERS ---
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const report = await finance.generateIntegratedPaymentReport({
        type: 'installments',
        format: 'csv',
        dateRange,
      });
      Alert.alert('Export Complete', 'Installment data exported successfully!');
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export installment data.');
    } finally {
      setExporting(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    try {
      const pendingIds = (finance.installments || installments)
        .filter(i => i.status?.toLowerCase() === 'pending')
        .map(i => i.id?.toString());
      if (pendingIds.length > 0) {
        await finance.bulkUpdateInstallments({ ids: pendingIds, status: 'PAID' });
        Alert.alert('Bulk Mark Paid', `${pendingIds.length} installments marked as paid.`);
      } else {
        Alert.alert('No Pending Installments', 'No pending installments to mark as paid.');
      }
    } catch (error) {
      Alert.alert('Bulk Mark Paid Failed', 'Failed to mark installments as paid.');
    }
  };

  // --- FILTERED INSTALLMENTS ---
  const filteredInstallments = (finance.installments || installments || []).filter(installment => {
    const studentName = getStudentName(installment).toLowerCase();
    const matchesSearch = studentName.includes(searchText.toLowerCase());
    const dueDate = moment(installment.due_date);
    const inDateRange = dueDate.isSameOrAfter(dateRange.startDate) && dueDate.isSameOrBefore(dateRange.endDate);
    let matchesKpiFilter = true;
    if (selectedFilter === 'paid') {
      matchesKpiFilter = installment.status?.toLowerCase() === 'paid';
    } else if (selectedFilter === 'pending') {
      matchesKpiFilter = installment.status?.toLowerCase() === 'pending';
    } else if (selectedFilter === 'overdue') {
      matchesKpiFilter = installment.status?.toLowerCase() === 'overdue';
    } else if (selectedFilter === 'failed') {
      matchesKpiFilter = installment.status?.toLowerCase() === 'failed';
    }
    return matchesSearch && inDateRange && matchesKpiFilter;
  });

  // --- RENDERERS ---
  const renderKPI = (title: string, value: string, icon: string, color: string) => (
    <TouchableOpacity
      style={[styles.kpiCard, { borderLeftColor: color }]}
      onPress={() => setSelectedFilter(title.toLowerCase() as any)}
    >
      <View style={styles.kpiContent}>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiLabel}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.dashboardContainer}>
      {/* QUICK ACTIONS */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={handleExportCSV}>
          <Text style={styles.quickActionText}>{exporting ? 'Exporting...' : 'Export CSV'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={handleBulkMarkPaid}>
          <Text style={styles.quickActionText}>Mark All Paid</Text>
        </TouchableOpacity>
      </View>
      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        {renderKPI('Total', `${totalInstallments}`, 'list', '#3b82f6')}
        {renderKPI('Paid', `${paidInstallments}`, 'check-circle', '#10b981')}
        {renderKPI('Pending', `${pendingInstallments}`, 'schedule', '#f59e0b')}
        {renderKPI('Overdue', `${overdueInstallments}`, 'error', '#ef4444')}
        {renderKPI('Failed', `${failedInstallments}`, 'close', '#a21caf')}
      </View>
      {/* CHARTS SECTION */}
      <View style={styles.chartsSection}>
        <Text style={styles.chartsTitle}>Installment Analytics</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>By Status</Text>
            <PieChart
              data={statusLabels.map((label, idx) => ({
                name: label,
                population: statusData[idx],
                color: ['#10b981', '#f59e0b', '#ef4444', '#a21caf'][idx % 4],
                legendFontColor: '#7F7F7F',
                legendFontSize: 12,
              }))}
              width={220}
              height={140}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
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
              }}
            />
          </View>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Daily Trend</Text>
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
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              }}
            />
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );

  const renderTable = () => (
    <ScrollView style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderCell}>Student</Text>
        <Text style={styles.tableHeaderCell}>Amount</Text>
        <Text style={styles.tableHeaderCell}>Due Date</Text>
        <Text style={styles.tableHeaderCell}>Status</Text>
        <Text style={styles.tableHeaderCell}>Method</Text>
      </View>
      {filteredInstallments.map(installment => (
        <View key={installment.id} style={styles.tableRow}>
          <Text style={styles.tableCell}>{getStudentName(installment)}</Text>
          <Text style={styles.tableCell}>{installment.amount}</Text>
          <Text style={styles.tableCell}>{moment(installment.due_date).format('YYYY-MM-DD')}</Text>
          <Text style={styles.tableCell}>{installment.status}</Text>
          <Text style={styles.tableCell}>{installment.payment_method || '-'}</Text>
        </View>
      ))}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('loadingInstallments')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchByStudent')}
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.toggleBtn} onPress={() => setViewMode(viewMode === 'dashboard' ? 'table' : 'dashboard')}>
          <Text style={styles.toggleBtnText}>{viewMode === 'dashboard' ? t('Table') : t('Dashboard')}</Text>
        </TouchableOpacity>
      </View>
      {viewMode === 'dashboard' ? renderDashboard() : renderTable()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, marginRight: 8 },
  toggleBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  toggleBtnText: { color: '#fff', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  dashboardContainer: { flex: 1, padding: 12 },
  quickActionsRow: { flexDirection: 'row', marginBottom: 12 },
  quickActionBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, marginRight: 8 },
  quickActionText: { color: '#1e293b', fontWeight: 'bold' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  kpiCard: { flex: 1, minWidth: 120, margin: 4, backgroundColor: '#f9fafb', borderRadius: 8, borderLeftWidth: 5, padding: 12 },
  kpiContent: { alignItems: 'flex-start' },
  kpiValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  kpiLabel: { fontSize: 14, color: '#64748b' },
  chartsSection: { marginBottom: 16 },
  chartsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  chartCard: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginRight: 12, minWidth: 240 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  tableContainer: { flex: 1, padding: 12 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8, marginBottom: 4 },
  tableHeaderCell: { flex: 1, fontWeight: 'bold', color: '#1e293b' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 8 },
  tableCell: { flex: 1, color: '#334155' },
});

export default InstallmentsList; 
