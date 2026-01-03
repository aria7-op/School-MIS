import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';

interface RevenueChartProps {
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

const RevenueChart: React.FC<RevenueChartProps> = ({ data, colors: propColors }) => {
  const { colors: themeColors } = useTheme();

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

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(34, 197, 94, Afg {opacity})`,
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
    labels: data.labels,
    datasets: [
      {
        data: data.datasets[0]?.data || [],
      },
    ],
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default RevenueChart; 
