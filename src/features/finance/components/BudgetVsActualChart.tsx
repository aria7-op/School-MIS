import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';

interface BudgetVsActualChartProps {
  data?: {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }>;
  };
  colors?: any; // Make colors optional
}

const { width } = Dimensions.get('window');

const BudgetVsActualChart: React.FC<BudgetVsActualChartProps> = ({ data: propData, colors: propColors }) => {
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

  // Fallback for data
  const data = propData || { labels: [], datasets: [{ data: [] }, { data: [] }] };

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

  // Safe fallbacks for data properties
  const safeLabels = Array.isArray(data?.labels) ? data.labels : [];
  const safeDatasets = Array.isArray(data?.datasets) ? data.datasets : [{ data: [] }, { data: [] }];

  // Process budget data for chart
  const processBudgetData = () => {
    const categories = safeLabels;
    const allocated = safeDatasets[0]?.data || [];
    const spent = safeDatasets[1]?.data || [];

    return {
      labels: categories,
      datasets: [
        {
          data: allocated,
          color: (opacity = 1) => `rgba(34, 197, 94, Afg {opacity})`,
        },
        {
          data: spent,
          color: (opacity = 1) => `rgba(239, 68, 68, Afg {opacity})`,
        },
      ],
    };
  };

  const chartData = processBudgetData();

  const calculateBudgetMetrics = () => {
    // Handle empty data case
    if (safeLabels.length === 0) {
      return {
        totalAllocated: 0,
        totalSpent: 0,
        variance: 0,
        utilizationRate: 0,
        overBudgetCategories: [],
        underBudgetCategories: [],
        overBudgetCount: 0,
        underBudgetCount: 0,
      };
    }

    const totalAllocated = (safeDatasets[0]?.data || []).reduce((sum, amount) => sum + amount, 0);
    const totalSpent = (safeDatasets[1]?.data || []).reduce((sum, amount) => sum + amount, 0);
    const variance = totalAllocated - totalSpent;
    const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    const overBudgetCategories = (safeDatasets[1]?.data || []).map((spent, index) => ({
      category: safeLabels[index] || 'Unknown',
      spend_amount: spent,
      allocated_amount: (safeDatasets[0]?.data || [])[index] || 0,
    })).filter(budget => 
      Number(budget.spend_amount) > Number(budget.allocated_amount)
    );
    const underBudgetCategories = (safeDatasets[1]?.data || []).map((spent, index) => ({
      category: safeLabels[index] || 'Unknown',
      spend_amount: spent,
      allocated_amount: (safeDatasets[0]?.data || [])[index] || 0,
    })).filter(budget => 
      Number(budget.spend_amount) < Number(budget.allocated_amount)
    );

    return {
      totalAllocated,
      totalSpent,
      variance,
      utilizationRate,
      overBudgetCategories,
      underBudgetCategories,
      overBudgetCount: overBudgetCategories.length,
      underBudgetCount: underBudgetCategories.length,
    };
  };

  const metrics = calculateBudgetMetrics();

  const getBudgetStatus = () => {
    if (metrics.utilizationRate > 100) {
      return { status: 'Over Budget', color: colors.error, icon: 'warning' };
    } else if (metrics.utilizationRate > 90) {
      return { status: 'Near Limit', color: colors.warning, icon: 'warning' };
    } else if (metrics.utilizationRate > 70) {
      return { status: 'Good', color: colors.primary, icon: 'check' };
    } else {
      return { status: 'Under Budget', color: colors.success, icon: 'check-circle' };
    }
  };

  const budgetStatus = getBudgetStatus();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Allocated</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              Afg {metrics.totalAllocated.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Spent</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              Afg {metrics.totalSpent.toLocaleString()}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: budgetStatus.color + '20' }]}>
          <Text style={[styles.statusText, { color: budgetStatus.color }]}>
            {budgetStatus.status} ({metrics.utilizationRate.toFixed(1)}%)
          </Text>
        </View>
      </View>

      <BarChart
        data={{
          labels: chartData.labels,
          datasets: [
            {
              data: chartData.datasets[0].data,
            },
            {
              data: chartData.datasets[1].data,
            },
          ],
        }}
        width={width - 64}
        height={220}
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero={true}
        showBarTops={true}
        showValuesOnTopOfBars={false}
        withInnerLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        segments={4}
        yAxisLabel=""
        yAxisSuffix=""
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Allocated</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Actual Spent</Text>
        </View>
      </View>

      <View style={styles.analysis}>
        <Text style={[styles.analysisTitle, { color: colors.text }]}>Budget Analysis</Text>
        
        <View style={styles.analysisGrid}>
          <View style={styles.analysisItem}>
            <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>Variance</Text>
            <Text style={[
              styles.analysisValue, 
              { color: metrics.variance >= 0 ? colors.success : colors.error }
            ]}>
              Afg {Math.abs(metrics.variance).toLocaleString()} 
              {metrics.variance >= 0 ? ' (Under)' : ' (Over)'}
            </Text>
          </View>
          
          <View style={styles.analysisItem}>
            <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>Utilization</Text>
            <Text style={[
              styles.analysisValue, 
              { color: metrics.utilizationRate > 100 ? colors.error : colors.success }
            ]}>
              {metrics.utilizationRate.toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.analysisItem}>
            <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>Over Budget</Text>
            <Text style={[styles.analysisValue, { color: colors.error }]}>
              {metrics.overBudgetCount} categories
            </Text>
          </View>
          
          <View style={styles.analysisItem}>
            <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>Under Budget</Text>
            <Text style={[styles.analysisValue, { color: colors.success }]}>
              {metrics.underBudgetCount} categories
            </Text>
          </View>
        </View>
      </View>

      {metrics.overBudgetCategories.length > 0 && (
        <View style={styles.alerts}>
          <Text style={[styles.alertsTitle, { color: colors.error }]}>⚠️ Over Budget Categories</Text>
          {metrics.overBudgetCategories.slice(0, 3).map((budget, index) => (
            <View key={index} style={styles.alertItem}>
              <Text style={[styles.alertText, { color: colors.text }]}>
                {budget.category}: Afg {budget.spend_amount} / Afg {budget.allocated_amount}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.recommendations}>
        <Text style={[styles.recommendationsTitle, { color: colors.text }]}>Budget Recommendations</Text>
        <View style={styles.recommendationItem}>
          <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
            • Monitor over-budget categories closely
          </Text>
        </View>
        <View style={styles.recommendationItem}>
          <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
            • Consider reallocating unused budget from under-budget categories
          </Text>
        </View>
        <View style={styles.recommendationItem}>
          <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>
            • Review budget allocations quarterly based on actual spending patterns
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
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  analysis: {
    marginTop: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  analysisItem: {
    flex: 1,
    minWidth: 120,
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  alerts: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  alertItem: {
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recommendations: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationItem: {
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
});

export default BudgetVsActualChart; 
