import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { colors } from '../../../../constants/colors';

const { width } = Dimensions.get('window');

interface OwnersStatusChartProps {
  data: {
    active: number;
    inactive: number;
    suspended: number;
  };
}

const OwnersStatusChart: React.FC<OwnersStatusChartProps> = ({ data }) => {
  const total = data.active + data.inactive + data.suspended;
  
  const chartData = [
    {
      name: 'Active',
      population: data.active,
      color: '#4CAF50',
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Inactive',
      population: data.inactive,
      color: '#FF9800',
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Suspended',
      population: data.suspended,
      color: '#F44336',
      legendFontColor: colors.text,
      legendFontSize: 12,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Owner Status Distribution</Text>
      <PieChart
        data={chartData}
        width={width - 40}
        height={200}
        chartConfig={{
          backgroundColor: colors.white,
          backgroundGradientFrom: colors.white,
          backgroundGradientTo: colors.white,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>{data.active}</Text>
          <Text style={styles.statPercentage}>{((data.active / total) * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.statLabel}>Inactive</Text>
          <Text style={styles.statValue}>{data.inactive}</Text>
          <Text style={styles.statPercentage}>{((data.inactive / total) * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.statLabel}>Suspended</Text>
          <Text style={styles.statValue}>{data.suspended}</Text>
          <Text style={styles.statPercentage}>{((data.suspended / total) * 100).toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statPercentage: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});

export default OwnersStatusChart; 
