import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../../../../constants/colors';

const { width } = Dimensions.get('window');

interface OwnersGrowthChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
}

const OwnersGrowthChart: React.FC<OwnersGrowthChartProps> = ({ data }) => {
  const chartConfig = {
    backgroundColor: colors.white,
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Owners Growth Trend</Text>
      <LineChart
        data={data}
        width={width - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Growth</Text>
          <Text style={styles.statValue}>+{data.datasets[0].data[data.datasets[0].data.length - 1] - data.datasets[0].data[0]}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Growth Rate</Text>
          <Text style={styles.statValue}>+15.2%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current Total</Text>
          <Text style={styles.statValue}>{data.datasets[0].data[data.datasets[0].data.length - 1]}</Text>
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default OwnersGrowthChart; 
