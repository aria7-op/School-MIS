import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';

interface ExpenseBreakdownChartProps {
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

const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({ data: propData, colors: propColors }) => {
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

  // Fallback for data
  const data = propData || { labels: [], datasets: [{ data: [] }] };

  const chartColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const safeLabels = Array.isArray(data?.labels) ? data.labels : [];
  const safeDatasets = Array.isArray(data?.datasets) ? data.datasets : [{ data: [] }];

  const chartData = safeLabels.map((label, index) => ({
    name: label,
    population: safeDatasets[0]?.data[index] || 0,
    color: chartColors[index % chartColors.length],
    legendFontColor: colors.text,
    legendFontSize: 12,
  }));

  const totalExpenses = chartData.reduce((sum, item) => sum + item.population, 0);

  const calculateExpenseMetrics = () => {
    // Handle empty data case
    if (chartData.length === 0) {
      return {
        totalExpenses: 0,
        averageExpense: 0,
        largestCategory: { name: 'No Data', population: 0 },
        smallestCategory: { name: 'No Data', population: 0 },
        largestPercentage: 0,
        categoryCount: 0,
      };
    }

    const sortedExpenses = [...chartData].sort((a, b) => b.population - a.population);
    const largestCategory = sortedExpenses[0];
    const smallestCategory = sortedExpenses[sortedExpenses.length - 1];
    
    const averageExpense = totalExpenses / chartData.length;
    const largestPercentage = totalExpenses > 0 ? (largestCategory.population / totalExpenses) * 100 : 0;

    return {
      totalExpenses,
      averageExpense,
      largestCategory,
      smallestCategory,
      largestPercentage,
      categoryCount: chartData.length,
    };
  };

  const metrics = calculateExpenseMetrics();

  const getExpenseInsight = () => {
    if (metrics.largestPercentage > 50) {
      return {
        insight: 'High concentration in one category',
        recommendation: 'Consider diversifying expenses',
        color: colors.warning,
      };
    } else if (metrics.largestPercentage > 30) {
      return {
        insight: 'Moderate expense distribution',
        recommendation: 'Monitor largest expense category',
        color: colors.primary,
      };
    } else {
      return {
        insight: 'Well-distributed expenses',
        recommendation: 'Good expense management',
        color: colors.success,
      };
    }
  };

  const expenseInsight = getExpenseInsight();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.summary}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            Afg {metrics.totalExpenses.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.insightBadge, { backgroundColor: expenseInsight.color + '20' }]}>
          <Text style={[styles.insightText, { color: expenseInsight.color }]}>
            {metrics.categoryCount} Categories
          </Text>
        </View>
      </View>

      <PieChart
        data={chartData}
        width={width - 64}
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, Afg {opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />

      <View style={styles.insights}>
        <Text style={[styles.insightsTitle, { color: colors.text }]}>Expense Analysis</Text>
        
        <View style={styles.insightRow}>
          <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Largest Category:</Text>
          <Text style={[styles.insightValue, { color: colors.text }]}>
            {metrics.largestCategory.name} ({metrics.largestPercentage.toFixed(1)}%)
          </Text>
        </View>

        <View style={styles.insightRow}>
          <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Average per Category:</Text>
          <Text style={[styles.insightValue, { color: colors.text }]}>
            Afg {metrics.averageExpense.toLocaleString()}
          </Text>
        </View>

        <View style={styles.recommendation}>
          <Text style={[styles.recommendationTitle, { color: expenseInsight.color }]}>
            {expenseInsight.insight}
          </Text>
          <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
            {expenseInsight.recommendation}
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendTitle, { color: colors.text }]}>Category Breakdown</Text>
        <View style={styles.legendItems}>
          {chartData.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {item.name}: Afg {item.population.toLocaleString()}
              </Text>
            </View>
          ))}
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
  summary: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  insightBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '600',
  },
  insights: {
    marginTop: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendation: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    fontWeight: '400',
  },
  legend: {
    marginTop: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItems: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ExpenseBreakdownChart; 
