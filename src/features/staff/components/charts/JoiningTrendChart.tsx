import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';

interface JoiningData {
  month: string;
  count: number;
  year: number;
}

const JoiningTrendChart: React.FC = () => {
  // Mock joining trend data for the last 12 months
  const joiningData: JoiningData[] = [
    { month: 'Jan', count: 8, year: 2024 },
    { month: 'Feb', count: 12, year: 2024 },
    { month: 'Mar', count: 15, year: 2024 },
    { month: 'Apr', count: 10, year: 2024 },
    { month: 'May', count: 18, year: 2024 },
    { month: 'Jun', count: 22, year: 2024 },
    { month: 'Jul', count: 16, year: 2024 },
    { month: 'Aug', count: 14, year: 2024 },
    { month: 'Sep', count: 20, year: 2024 },
    { month: 'Oct', count: 25, year: 2024 },
    { month: 'Nov', count: 19, year: 2024 },
    { month: 'Dec', count: 12, year: 2024 },
  ];

  const maxCount = Math.max(...joiningData.map(item => item.count));
  const totalJoined = joiningData.reduce((sum, item) => sum + item.count, 0);
  const averagePerMonth = totalJoined / joiningData.length;

  const renderMonthBar = (item: JoiningData, index: number) => {
    const barHeight = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
    
    return (
      <View key={index} style={styles.monthContainer}>
        <View style={styles.barContainer}>
          <View 
            style={[
              styles.bar, 
              { 
                height: `${barHeight}%`,
                backgroundColor: item.count > averagePerMonth ? '#28a745' : '#4a6da7'
              }
            ]} 
          />
        </View>
        <Text style={styles.monthLabel}>{item.month}</Text>
        <Text style={styles.countLabel}>{item.count}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff Joining Trends</Text>
        <Text style={styles.subtitle}>Last 12 Months</Text>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxCount}</Text>
          <Text style={styles.yAxisLabel}>{Math.round(maxCount * 0.75)}</Text>
          <Text style={styles.yAxisLabel}>{Math.round(maxCount * 0.5)}</Text>
          <Text style={styles.yAxisLabel}>{Math.round(maxCount * 0.25)}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>
        
        <View style={styles.barsContainer}>
          {joiningData.map(renderMonthBar)}
        </View>
      </View>
      
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Joined:</Text>
          <Text style={styles.summaryValue}>{totalJoined}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average/Month:</Text>
          <Text style={styles.summaryValue}>{averagePerMonth.toFixed(1)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Peak Month:</Text>
          <Text style={styles.summaryValue}>
            {joiningData.reduce((max, item) => item.count > max.count ? item : max).month}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 20,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  monthContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barContainer: {
    width: 20,
    height: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  countLabel: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
});

export default JoiningTrendChart; 
