import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';

// Constants
import { COLORS, SPACING, FONTS } from '../../../theme';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 200,
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

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = (Dimensions.get('window').width - SPACING.xl * 2) / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 40;

  const renderPieSlice = (item: PieChartData, startAngle: number, endAngle: number, index: number) => {
    const percentage = (item.value / total) * 100;
    
    return (
      <View key={index} style={styles.sliceContainer}>
        {/* Simple circle representation for now */}
        <View
          style={[
            styles.slice,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              backgroundColor: item.color,
              opacity: 0.8,
            }
          ]}
        />
        
        {/* Label */}
        {showLabels && (
          <View style={styles.labelContainer}>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <Text style={styles.label} numberOfLines={1}>
              {item.name}
            </Text>
            {showValues && (
              <Text style={styles.value}>
                {percentage.toFixed(1)}%
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Chart Area */}
      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const startAngle = (index / data.length) * 360;
          const endAngle = ((index + 1) / data.length) * 360;
          return renderPieSlice(item, startAngle, endAngle, index);
        })}
      </View>

      {/* Legend */}
      {showLabels && (
        <View style={styles.legend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {item.name}
              </Text>
              {showValues && (
                <Text style={styles.legendValue}>
                  {item.value}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
  },
  chartArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  sliceContainer: {
    alignItems: 'center',
  },
  slice: {
    marginBottom: SPACING.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  label: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    flex: 1,
  },
  legendValue: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  noDataText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: 20,
  },
}); 
