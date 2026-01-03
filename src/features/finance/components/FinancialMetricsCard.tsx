import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@react-navigation/native';

interface FinancialMetricsCardProps {
  title: string;
  value: number | null | undefined;
  currency?: string;
  trend?: number;
  icon: string;
  color?: string;
  subtitle?: string;
  format?: 'currency' | 'percentage' | 'number';
}

const FinancialMetricsCard: React.FC<FinancialMetricsCardProps> = ({
  title,
  value,
  currency = 'Afg',
  trend,
  icon,
  color,
  subtitle,
  format = 'currency',
}) => {
  const { colors } = useTheme();
  const cardColor = color || colors.primary;

  const formatValue = (val: number | null | undefined) => {
    if (val === null || val === undefined) {
      return 'N/A';
    }
    
    switch (format) {
      case 'currency':
        return `${currency}${val.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return val.toLocaleString('en-US');
      default:
        return val.toString();
    }
  };

  const getTrendIcon = (trendValue: number | undefined) => {
    if (trendValue === undefined) return 'trending-flat';
    if (trendValue > 0) return 'trending-up';
    if (trendValue < 0) return 'trending-down';
    return 'trending-flat';
  };

  const getTrendColor = (trendValue: number | undefined) => {
    if (trendValue === undefined) return colors.text;
    if (trendValue > 0) return colors.success;
    if (trendValue < 0) return colors.error;
    return colors.text;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: cardColor + '20' }]}>
          <Icon name={icon} size={24} color={cardColor} />
        </View>
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            <Icon
              name={getTrendIcon(trend)}
              size={16}
              color={getTrendColor(trend)}
            />
            <Text style={[styles.trendText, { color: getTrendColor(trend) }]}>
              {trend !== undefined ? `${Math.abs(trend).toFixed(1)}%` : 'N/A'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {formatValue(value)}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default FinancialMetricsCard; 
