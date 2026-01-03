import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import ComprehensiveFinanceApiService, { Payroll } from '../services/comprehensiveFinanceApi';
import SimplePayrollChart from './SimplePayrollChart';
import FallbackChart from './FallbackChart';
import TestChart from './TestChart';

interface PayrollAnalyticsScreenProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

const PayrollAnalyticsScreen: React.FC<PayrollAnalyticsScreenProps> = ({ onRefresh, refreshing = false }) => {
  const { colors } = useTheme();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const [payrollsData, analyticsData] = await Promise.all([
        ComprehensiveFinanceApiService.getPayrolls(),
        ComprehensiveFinanceApiService.getPayrollAnalytics(),
      ]);

      setPayrolls(payrollsData);
      setAnalytics(analyticsData);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load payroll analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchPayrollData();
    onRefresh?.();
  };

  const formatCurrency = (amount: number) => {
    return `Afg ${amount.toLocaleString()}`;
  };

  // Prepare chart data from payrolls
  const prepareChartData = () => {
    if (!payrolls || payrolls.length === 0) {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0] }],
      };
    }

    // Group payrolls by month and calculate total payroll for each month
    const monthlyPayrolls: { [key: string]: number } = {};
    
    payrolls.forEach(payroll => {
      const monthKey = `${payroll.month} ${payroll.year}`;
      if (!monthlyPayrolls[monthKey]) {
        monthlyPayrolls[monthKey] = 0;
      }
      monthlyPayrolls[monthKey] += payroll.netSalary;
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyPayrolls).sort((a, b) => {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return months.indexOf(monthA) - months.indexOf(monthB);
    });

    // Take the last 6 months
    const last6Months = sortedMonths.slice(-6);
    const labels = last6Months.map(month => {
      const [monthName] = month.split(' ');
      return monthName.substring(0, 3);
    });
    
    const data = last6Months.map(month => monthlyPayrolls[month] || 0);

    return {
      labels,
      datasets: [{ data }],
    };
  };

  const chartData = prepareChartData();

  // Calculate summary statistics
  const calculateSummary = () => {
    if (!payrolls || payrolls.length === 0) {
      return {
        totalEmployees: 0,
        totalPayroll: 0,
        averageSalary: 0,
        totalPaid: 0,
        totalPending: 0,
      };
    }

    const totalEmployees = new Set(payrolls.map(p => p.employeeId)).size;
    const totalPayroll = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const averageSalary = totalPayroll / payrolls.length;
    const totalPaid = payrolls.filter(p => p.status === 'paid').length;
    const totalPending = payrolls.filter(p => p.status === 'pending').length;

    return {
      totalEmployees,
      totalPayroll,
      averageSalary,
      totalPaid,
      totalPending,
    };
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading payroll analytics...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Payroll Summary
        </Text>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="users" size={20} color={colors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {summary.totalEmployees}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Total Employees
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.success + '20' }]}>
              <Feather name="dollar-sign" size={20} color={colors.success} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(summary.totalPayroll)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Total Payroll
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.warning + '20' }]}>
              <Feather name="trending-up" size={20} color={colors.warning} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(summary.averageSalary)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Average Salary
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="check-circle" size={20} color={colors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {summary.totalPaid}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Paid
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Payroll Analytics Chart */}
      <View style={styles.chartSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Payroll Trends
        </Text>
        
        {/* Debug Info */}
        <View style={[styles.debugContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.debugTitle, { color: colors.text }]}>Debug Information</Text>
          <Text style={[styles.debugText, { color: colors.textSecondary }]}>
            Payrolls count: {payrolls.length}
          </Text>
          <Text style={[styles.debugText, { color: colors.textSecondary }]}>
            Chart labels: {JSON.stringify(chartData.labels)}
          </Text>
          <Text style={[styles.debugText, { color: colors.textSecondary }]}>
            Chart data: {JSON.stringify(chartData.datasets[0].data)}
          </Text>
        </View>
        
        <TestChart />
        
        <SimplePayrollChart />
        
        {/* Fallback Chart */}
        <View style={styles.chartSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Fallback Chart View
          </Text>
          <FallbackChart 
            data={chartData.datasets[0].data} 
            labels={chartData.labels} 
          />
        </View>
      </View>

      {/* Analytics Data */}
      {analytics && (
        <View style={styles.analyticsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Detailed Analytics
          </Text>
          
          <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.analyticsTitle, { color: colors.text }]}>
              Monthly Trends
            </Text>
            {analytics.monthlyTrends?.map((trend: any, index: number) => (
              <View key={index} style={styles.trendRow}>
                <Text style={[styles.trendMonth, { color: colors.textSecondary }]}>
                  {trend.month}
                </Text>
                <Text style={[styles.trendValue, { color: colors.text }]}>
                  {formatCurrency(trend.totalPayroll)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.analyticsTitle, { color: colors.text }]}>
              Salary Distribution
            </Text>
            {analytics.salaryDistribution?.map((dist: any, index: number) => (
              <View key={index} style={styles.distributionRow}>
                <Text style={[styles.distributionRange, { color: colors.textSecondary }]}>
                  {dist.range}
                </Text>
                <Text style={[styles.distributionCount, { color: colors.text }]}>
                  {dist.count} employees ({dist.percentage}%)
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.analyticsTitle, { color: colors.text }]}>
              Department Breakdown
            </Text>
            {analytics.departmentBreakdown?.map((dept: any, index: number) => (
              <View key={index} style={styles.departmentRow}>
                <Text style={[styles.departmentName, { color: colors.textSecondary }]}>
                  {dept.department}
                </Text>
                <Text style={[styles.departmentValue, { color: colors.text }]}>
                  {formatCurrency(dept.totalSalary)} ({dept.employeeCount} employees)
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartSection: {
    marginBottom: 24,
  },
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  trendMonth: {
    fontSize: 14,
    fontWeight: '500',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  distributionRange: {
    fontSize: 14,
    fontWeight: '500',
  },
  distributionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  departmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  departmentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  departmentValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  debugContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  debugText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PayrollAnalyticsScreen; 
