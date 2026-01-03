import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';
import { colors } from '../../../constants/colors';

interface PayrollAnalyticsChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }>;
  };
  colors: any;
}

const { width } = Dimensions.get('window');

const PayrollAnalyticsChart: React.FC<PayrollAnalyticsChartProps> = ({ data, colors: propColors }) => {
  const { colors: themeColors } = useTheme();

  // Safe color access with fallbacks - use theme colors when available, otherwise use constants
  const safeColors = {
    text: themeColors?.text || colors.text,
    textSecondary: colors.textSecondary, // Not available in theme, use constant
    success: colors.success, // Not available in theme, use constant
    error: colors.error, // Not available in theme, use constant
    primary: themeColors?.primary || colors.primary,
  };

  // Ensure we have valid data
  const chartData = {
    labels: data?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: data?.datasets?.[0]?.data || [],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#3b82f6',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e5e7eb',
      strokeWidth: 1,
    },
  };

  // Calculate basic metrics
  const totalPayroll = chartData.datasets[0].data.reduce((sum, value) => sum + value, 0);
  const averagePayroll = totalPayroll / chartData.datasets[0].data.length;
  const maxPayroll = Math.max(...chartData.datasets[0].data);
  const minPayroll = Math.min(...chartData.datasets[0].data);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: safeColors.text }]}>
          Payroll Trends (Last 6 Months)
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={width - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={true}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={false}
          yAxisLabel="Afg "
          yAxisSuffix=""
          yLabelsOffset={10}
          xLabelsOffset={-10}
          segments={4}
        />
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: safeColors.textSecondary }]}>Total Payroll</Text>
            <Text style={[styles.metricValue, { color: safeColors.text }]}>
              Afg {totalPayroll.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: safeColors.textSecondary }]}>Average Monthly</Text>
            <Text style={[styles.metricValue, { color: safeColors.text }]}>
              Afg {averagePayroll.toLocaleString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: safeColors.textSecondary }]}>Peak Month</Text>
            <Text style={[styles.metricValue, { color: safeColors.success }]}>
              Afg {maxPayroll.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: safeColors.textSecondary }]}>Lowest Month</Text>
            <Text style={[styles.metricValue, { color: safeColors.error }]}>
              Afg {minPayroll.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.insightsContainer}>
        <Text style={[styles.insightsTitle, { color: safeColors.text }]}>Key Insights</Text>
        <Text style={[styles.insightText, { color: safeColors.textSecondary }]}>
          • Payroll costs show a consistent upward trend over the past 6 months
        </Text>
        <Text style={[styles.insightText, { color: safeColors.textSecondary }]}>
          • Average monthly payroll: Afg {averagePayroll.toLocaleString()}
        </Text>
        <Text style={[styles.insightText, { color: safeColors.textSecondary }]}>
          • Total payroll expenditure: Afg {totalPayroll.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  insightsContainer: {
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
});

export default PayrollAnalyticsChart; 
