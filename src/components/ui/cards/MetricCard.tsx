import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';

// Components
import { Icon } from '../Icon';

// Constants
import { COLORS, SPACING, FONTS } from '../../../theme';

interface MetricCardProps {
  title: string;
  value: string;
  icon?: string;
  iconColor?: string;
  trend?: number;
  trendColor?: string;
  trendIcon?: string;
  percentage?: number;
  subtitle?: string;
  style?: any;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  iconColor = COLORS.primary,
  trend,
  trendColor,
  trendIcon,
  percentage,
  subtitle,
  style
}) => {
  const getTrendDisplay = () => {
    if (trend === undefined || trend === null) return null;
    
    const sign = trend > 0 ? '+' : '';
    const formattedTrend = `${sign}${trend.toFixed(1)}%`;
    
    return (
      <View style={styles.trendContainer}>
        <Icon 
          name={trendIcon || 'trending-up'} 
          size={12} 
          color={trendColor || COLORS.textSecondary} 
        />
        <Text style={[
          styles.trendText,
          { color: trendColor || COLORS.textSecondary }
        ]}>
          {formattedTrend}
        </Text>
      </View>
    );
  };

  const getPercentageDisplay = () => {
    if (percentage === undefined || percentage === null) return null;
    
    return (
      <View style={styles.percentageContainer}>
        <Text style={styles.percentageText}>
          {percentage.toFixed(1)}%
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Icon name={icon} size={20} color={iconColor} />
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Value */}
      <View style={styles.valueContainer}>
        <Text style={styles.value}>
          {value}
        </Text>
        {getPercentageDisplay()}
      </View>

      {/* Trend */}
      {getTrendDisplay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textTertiary,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  percentageContainer: {
    marginLeft: SPACING.sm,
  },
  percentageText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  trendText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '500',
  },
}); 
