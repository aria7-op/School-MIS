import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions
} from 'react-native';

// Constants
import { COLORS, SPACING, FONTS } from '../../../theme';

interface LineChartProps {
  data: Array<{ x: string | number; y: number }>;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showDots?: boolean;
  showLabels?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  color = COLORS.primary,
  showGrid = true,
  showDots = true,
  showLabels = true
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.y));
  const minValue = Math.min(...data.map(d => d.y));
  const range = maxValue - minValue;

  const getYPosition = (value: number) => {
    if (range === 0) return height * 0.5;
    return height - ((value - minValue) / range) * height;
  };

  const getXPosition = (index: number) => {
    return (index / (data.length - 1)) * (Dimensions.get('window').width - SPACING.xl * 2);
  };

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
                { top: (percent / 100) * height }
              ]}
            />
          ))}
        </View>
      )}

      {/* Chart Line */}
      <View style={styles.chartContainer}>
        {data.map((point, index) => {
          if (index === 0) return null;
          
          const prevPoint = data[index - 1];
          const x1 = getXPosition(index - 1);
          const y1 = getYPosition(prevPoint.y);
          const x2 = getXPosition(index);
          const y2 = getYPosition(point.y);

          return (
            <View
              key={index}
              style={[
                styles.line,
                {
                  left: x1,
                  top: y1,
                  width: x2 - x1,
                  height: 2,
                  backgroundColor: color,
                  transform: [
                    {
                      rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad`
                    }
                  ]
                }
              ]}
            />
          );
        })}

        {/* Data Points */}
        {showDots && data.map((point, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                left: getXPosition(index) - 4,
                top: getYPosition(point.y) - 4,
                backgroundColor: color
              }
            ]}
          />
        ))}
      </View>

      {/* Labels */}
      {showLabels && (
        <View style={styles.labelsContainer}>
          {data.map((point, index) => (
            <Text
              key={index}
              style={[
                styles.label,
                {
                  left: getXPosition(index) - 20,
                  top: height + 5
                }
              ]}
              numberOfLines={1}
            >
              {point.x}
            </Text>
          ))}
        </View>
      )}
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
    bottom: 0,
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
    bottom: 0,
  },
  line: {
    position: 'absolute',
    transformOrigin: 'left center',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  labelsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  label: {
    position: 'absolute',
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    width: 40,
  },
  noDataText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: 20,
  },
}); 
