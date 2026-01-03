import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors } from '../../../../constants/colors';

const { width } = Dimensions.get('window');

interface OwnersActivityChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
}

const OwnersActivityChart: React.FC<OwnersActivityChartProps> = ({ data }) => {
  const chartConfig = {
    backgroundColor: colors.white,
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.7,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Activity</Text>
      <BarChart
        data={data}
        width={width - 40}
        height={220}
        chartConfig={chartConfig}
        style={styles.chart}
        verticalLabelRotation={0}
      />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg Daily</Text>
          <Text style={styles.statValue}>
            {Math.round(data.datasets[0].data.reduce((a, b) => a + b, 0) / data.datasets[0].data.length)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Peak Day</Text>
          <Text style={styles.statValue}>
            {data.labels[data.datasets[0].data.indexOf(Math.max(...data.datasets[0].data))]}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Week</Text>
          <Text style={styles.statValue}>
            {data.datasets[0].data.reduce((a, b) => a + b, 0)}
          </Text>
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

export default OwnersActivityChart; 
