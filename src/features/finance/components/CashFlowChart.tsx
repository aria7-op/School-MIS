import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';

interface CashFlowChartProps {
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

// Utility function to convert color to function
const convertColorToFunction = (color: string | ((opacity: number) => string) | undefined, defaultColor: string = '#3b82f6') => {
  if (typeof color === 'function') {
    return color;
  }
  if (typeof color === 'string' && color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return (opacity: number) => `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return (opacity: number) => `rgba(59, 130, 246, ${opacity})`;
};

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, colors: propColors }) => {
  const { colors: themeColors } = useTheme();

  // Use prop colors if available, otherwise fall back to theme colors or defaults
  const colors = propColors || {
    card: themeColors?.card || '#ffffff',
    primary: themeColors?.primary || '#3b82f6',
    border: themeColors?.border || '#e5e7eb',
    text: themeColors?.text || '#000000',
    textSecondary: themeColors?.text || '#6b7280',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  };

  // Safety check for data
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.placeholderText, { color: colors.text }]}>
          No cash flow data available
        </Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
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
        color: convertColorToFunction(data?.datasets?.[0]?.color, '#3b82f6'),
        strokeWidth: data?.datasets?.[0]?.strokeWidth || 2,
      },
    ],
  };

  const getCashFlowStatus = () => {
    const paymentData = chartData.datasets[0]?.data || [];
    const positiveDays = paymentData.filter(value => (value || 0) > 0).length;
    const negativeDays = paymentData.filter(value => (value || 0) < 0).length;
    const totalDays = paymentData.length;

    if (positiveDays > negativeDays) {
      return { status: 'Positive', color: colors.success, percentage: totalDays > 0 ? ((positiveDays / totalDays) * 100).toFixed(1) : '0.0' };
    } else if (negativeDays > positiveDays) {
      return { status: 'Negative', color: colors.error, percentage: totalDays > 0 ? ((negativeDays / totalDays) * 100).toFixed(1) : '0.0' };
    } else {
      return { status: 'Neutral', color: colors.warning, percentage: '50.0' };
    }
  };

  const cashFlowStatus = getCashFlowStatus();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Cash Flow Status:</Text>
          <View style={[styles.statusBadge, { backgroundColor: cashFlowStatus.color + '20' }]}>
            <Text style={[styles.statusText, { color: cashFlowStatus.color }]}>
              {cashFlowStatus.status} ({cashFlowStatus.percentage}%)
            </Text>
          </View>
        </View>
      </View>

      <LineChart
        data={chartData}
        width={width - 64}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withDots={false}
        withShadow={false}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        fromZero={false}
        yAxisLabel="$"
        yAxisSuffix=""
        yLabelsOffset={10}
        xLabelsOffset={-10}
        segments={4}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Positive Days</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Negative Days</Text>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CashFlowChart; 
