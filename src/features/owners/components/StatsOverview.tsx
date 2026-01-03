import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

const { width } = Dimensions.get('window');

interface StatsOverviewProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    emailVerified: number;
    emailNotVerified: number;
    growthRate: number;
    recentActivity: number;
  };
  onStatPress?: (statType: string) => void;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, onStatPress }) => {
  const renderStatCard = (
    title: string, 
    value: string | number, 
    icon: string, 
    color: string, 
    subtitle?: string,
    trend?: 'up' | 'down' | 'neutral',
    statType?: string
  ) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={() => statType && onStatPress?.(statType)}
    >
      <View style={styles.statHeader}>
        <MaterialIcons name={icon as any} size={20} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
        {trend && (
          <MaterialIcons 
            name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'trending-flat'} 
            size={16} 
            color={trend === 'up' ? '#4CAF50' : trend === 'down' ? '#F44336' : colors.textSecondary} 
          />
        )}
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  const renderMiniChart = () => (
    <View style={styles.miniChartContainer}>
      <Text style={styles.miniChartTitle}>Recent Activity</Text>
      <View style={styles.miniChart}>
        {[20, 45, 28, 80, 99, 43, 50].map((value, index) => (
          <View key={index} style={styles.miniChartBar}>
            <View 
              style={[
                styles.miniChartBarFill, 
                { 
                  height: (value / 100) * 40,
                  backgroundColor: colors.primary 
                }
              ]} 
            />
          </View>
        ))}
      </View>
      <Text style={styles.miniChartLabel}>Last 7 days</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard(
          'Total Owners', 
          stats.total, 
          'people', 
          colors.primary,
          undefined,
          'up',
          'total'
        )}
        {renderStatCard(
          'Active', 
          stats.active, 
          'check-circle', 
          '#4CAF50',
          `${((stats.active / stats.total) * 100).toFixed(1)}% of total`,
          'up',
          'active'
        )}
        {renderStatCard(
          'Email Verified', 
          stats.emailVerified, 
          'verified', 
          '#2196F3',
          `${((stats.emailVerified / stats.total) * 100).toFixed(1)}% verified`,
          'up',
          'verified'
        )}
        {renderStatCard(
          'Growth Rate', 
          `+${stats.growthRate}%`, 
          'trending-up', 
          '#FF9800',
          'vs last month',
          'up',
          'growth'
        )}
      </View>

      {/* Secondary Stats */}
      <View style={styles.secondaryStats}>
        <View style={styles.secondaryStatItem}>
          <MaterialIcons name="pause-circle" size={16} color="#FF9800" />
          <Text style={styles.secondaryStatLabel}>Inactive</Text>
          <Text style={styles.secondaryStatValue}>{stats.inactive}</Text>
        </View>
        <View style={styles.secondaryStatItem}>
          <MaterialIcons name="block" size={16} color="#F44336" />
          <Text style={styles.secondaryStatLabel}>Suspended</Text>
          <Text style={styles.secondaryStatValue}>{stats.suspended}</Text>
        </View>
        <View style={styles.secondaryStatItem}>
          <MaterialIcons name="schedule" size={16} color="#9C27B0" />
          <Text style={styles.secondaryStatLabel}>Recent Activity</Text>
          <Text style={styles.secondaryStatValue}>{stats.recentActivity}</Text>
        </View>
      </View>

      {/* Mini Chart */}
      {renderMiniChart()}

      {/* Quick Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Quick Insights</Text>
        <View style={styles.insightsList}>
          <View style={styles.insightItem}>
            <MaterialIcons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.insightText}>
              {stats.growthRate > 0 ? `Growing by ${stats.growthRate}% this month` : 'Stable growth this month'}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <MaterialIcons name="verified" size={16} color="#2196F3" />
            <Text style={styles.insightText}>
              {((stats.emailVerified / stats.total) * 100).toFixed(1)}% email verification rate
            </Text>
          </View>
          <View style={styles.insightItem}>
            <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.insightText}>
              {((stats.active / stats.total) * 100).toFixed(1)}% active owners
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  secondaryStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  secondaryStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  secondaryStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  miniChartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  miniChartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 50,
    gap: 4,
  },
  miniChartBar: {
    width: 8,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  miniChartBarFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderRadius: 4,
  },
  miniChartLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
});

export default StatsOverview; 
