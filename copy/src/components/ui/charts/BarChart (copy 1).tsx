import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';

// Constants
import { COLORS, SPACING, FONTS } from '../../../theme';

interface BarChartProps {
  data: Array<{ x: string | number; y: number }>;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  showValues?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  color = COLORS.primary,
  showGrid = true,
  showLabels = true,
  showValues = true
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.y));
  const chartHeight = height - 60; // Account for labels and values

  const getBarHeight = (value: number) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * chartHeight;
  };

  const barWidth = (Dimensions.get('window').width - SPACING.xl * 2) / data.length - 10;

  return (
    <View style={[styles.container, { height }]}>
      {/* Grid Lines */}
      {showGrid && (
        <View style={styles.gridContainer}>
          {[0, 25, 50, 75, 100].map(percent => (
            <View
              key={percent}
              style={[
                styles.gridLine,
                { top: (percent / 100) * chartHeight }
              ]}
            />
          ))}
        </View>
      )}

      {/* Bars */}
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const barHeight = getBarHeight(item.y);
          
          return (
            <View key={index} style={styles.barContainer}>
              {/* Bar */}
              <View
                style={[
                  styles.bar,
                  {
                    width: barWidth,
                    height: barHeight,
                    backgroundColor: color,
                    bottom: 0,
                  }
                ]}
              />

              {/* Value Label */}
              {showValues && (
                <Text style={styles.valueLabel}>
                  {item.y}
                </Text>
              )}

              {/* X-Axis Label */}
              {showLabels && (
                <Text style={styles.xAxisLabel} numberOfLines={1}>
                  {item.x}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 60, // Space for labels
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.3,
  },
  chartContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.sm,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    borderRadius: 2,
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  xAxisLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    width: 60,
  },
  noDataText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: 20,
  },
}); 
