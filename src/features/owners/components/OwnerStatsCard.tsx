import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../constants/colors';

interface OwnerStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  distribution: Record<string, number>;
}

interface OwnerStatsCardProps {
  stats: OwnerStats;
}

const OwnerStatsCard: React.FC<OwnerStatsCardProps> = ({ stats }) => {
  const statItems = [
    {
      label: 'Total Owners',
      value: stats.total,
      icon: 'people',
      color: colors.primary,
      bgColor: '#eef2ff',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: 'check-circle',
      color: colors.success,
      bgColor: '#f0fdf4',
    },
    {
      label: 'Inactive',
      value: stats.inactive,
      icon: 'pause-circle',
      color: colors.warning,
      bgColor: '#fffbeb',
    },
    {
      label: 'Suspended',
      value: stats.suspended,
      icon: 'block',
      color: colors.danger,
      bgColor: '#fef2f2',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Owner Statistics</Text>
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
              <Icon name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default OwnerStatsCard; 
