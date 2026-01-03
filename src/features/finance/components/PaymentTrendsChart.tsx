import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';

interface PaymentTrendsChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }>;
  };
  colors?: any;
}

const { width } = Dimensions.get('window');

const PaymentTrendsChart: React.FC<PaymentTrendsChartProps> = ({ data, colors: propColors }) => {
  const { colors: themeColors } = useTheme();
  const colors = propColors || themeColors;

  // Safety check for data
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.placeholderText, { color: colors.text }]}>
          No payment data available
        </Text>
      </View>
    );
  }

  const statusColors = {
    'Paid': colors.success,
    'Unpaid': colors.error,
    'Partially Paid': colors.warning,
    'Overdue': colors.error,
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, Afg {opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, Afg {opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        data: data?.datasets?.[0]?.data || [],
      },
    ],
  };

  const calculatePaymentMetrics = () => {
    const paymentData = chartData.datasets[0]?.data || [];
    const totalPayments = paymentData.reduce((sum, value) => sum + (value || 0), 0);
    const paidPayments = paymentData[0] || 0;
    const unpaidPayments = paymentData[1] || 0;
    const partiallyPaidPayments = paymentData[2] || 0;
    const overduePayments = paymentData[3] || 0;

    const collectionRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
    const overdueRate = totalPayments > 0 ? (overduePayments / totalPayments) * 100 : 0;
    const pendingRate = totalPayments > 0 ? ((unpaidPayments + partiallyPaidPayments) / totalPayments) * 100 : 0;

    return {
      totalPayments,
      paidPayments,
      unpaidPayments,
      partiallyPaidPayments,
      overduePayments,
      collectionRate,
      overdueRate,
      pendingRate,
    };
  };

  const metrics = calculatePaymentMetrics();

  const getPaymentStatus = () => {
    if (metrics.collectionRate >= 90) {
      return { status: 'Excellent', color: colors.success, icon: 'check-circle' };
    } else if (metrics.collectionRate >= 75) {
      return { status: 'Good', color: colors.primary, icon: 'check' };
    } else if (metrics.collectionRate >= 60) {
      return { status: 'Fair', color: colors.warning, icon: 'warning' };
    } else {
      return { status: 'Poor', color: colors.error, icon: 'error' };
    }
  };

  const paymentStatus = getPaymentStatus();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Collection Rate</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {metrics.collectionRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Payments</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {metrics.totalPayments}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: paymentStatus.color + '20' }]}>
          <Text style={[styles.statusText, { color: paymentStatus.color }]}>
            {paymentStatus.status}
          </Text>
        </View>
      </View>

      <BarChart
        data={chartData}
        width={width - 64}
        height={220}
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero={true}
        showBarTops={true}
        showValuesOnTopOfBars={true}
        withInnerLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        withDots={false}
        segments={4}
      />

      <View style={styles.breakdown}>
        <Text style={[styles.breakdownTitle, { color: colors.text }]}>Payment Status Breakdown</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.success }]} />
            <View style={styles.breakdownContent}>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>Paid</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                {metrics.paidPayments} ({metrics.collectionRate.toFixed(1)}%)
              </Text>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.error }]} />
            <View style={styles.breakdownContent}>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>Unpaid</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                {metrics.unpaidPayments} ({metrics.pendingRate.toFixed(1)}%)
              </Text>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.warning }]} />
            <View style={styles.breakdownContent}>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>Partially Paid</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                {metrics.partiallyPaidPayments}
              </Text>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.error }]} />
            <View style={styles.breakdownContent}>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>Overdue</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                {metrics.overduePayments} ({metrics.overdueRate.toFixed(1)}%)
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.insights}>
        <Text style={[styles.insightsTitle, { color: colors.text }]}>Collection Insights</Text>
        <View style={styles.insightItem}>
          <Text style={[styles.insightText, { color: colors.textSecondary }]}>
            {metrics.overduePayments > 0 
              ? `⚠️ Afg {metrics.overduePayments} payments are overdue and require immediate attention.`
              : '✅ All payments are up to date.'
            }
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={[styles.insightText, { color: colors.textSecondary }]}>
            {metrics.pendingRate > 20 
              ? `📊 Afg {metrics.pendingRate.toFixed(1)}% of payments are pending collection.`
              : '📈 Excellent payment collection rate maintained.'
            }
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  metricsRow: {
    flex: 1,
    gap: 16,
  },
  metricItem: {
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  breakdown: {
    marginTop: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  breakdownGrid: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '400',
  },
  insights: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightItem: {
    marginBottom: 6,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default PaymentTrendsChart; 
