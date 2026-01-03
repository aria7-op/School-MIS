import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';

interface SalaryRange {
  range: string;
  count: number;
  min: number;
  max: number;
}

const SalaryDistributionChart: React.FC = () => {
  // Mock salary distribution data
  const salaryData: SalaryRange[] = [
    { range: '$20k - $30k', count: 15, min: 20000, max: 30000 },
    { range: '$30k - $40k', count: 25, min: 30000, max: 40000 },
    { range: '$40k - $50k', count: 35, min: 40000, max: 50000 },
    { range: '$50k - $60k', count: 20, min: 50000, max: 60000 },
    { range: '$60k - $70k', count: 12, min: 60000, max: 70000 },
    { range: '$70k+', count: 8, min: 70000, max: 100000 },
  ];

  const total = salaryData.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...salaryData.map(item => item.count));

  const renderSalaryRange = (item: SalaryRange, index: number) => {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    const barWidth = total > 0 ? (item.count / maxCount) * 100 : 0;
    
    return (
      <View key={index} style={styles.rangeContainer}>
        <View style={styles.rangeHeader}>
          <Text style={styles.rangeLabel}>{item.range}</Text>
          <Text style={styles.rangeCount}>{item.count}</Text>
        </View>
        <View style={styles.barContainer}>
          <View 
            style={[
              styles.barFill, 
              { 
                width: `${barWidth}%`,
                backgroundColor: getBarColor(index)
              }
            ]} 
          />
        </View>
        <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
      </View>
    );
  };

  const getBarColor = (index: number) => {
    const colors = ['#4a6da7', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];
    return colors[index % colors.length];
  };

  const averageSalary = salaryData.reduce((sum, item) => {
    const avgInRange = (item.min + item.max) / 2;
    return sum + (avgInRange * item.count);
  }, 0) / total;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Salary Distribution</Text>
        <Text style={styles.averageSalary}>
          Average Salary: ${averageSalary.toLocaleString()}
        </Text>
      </View>
      
      {salaryData.map(renderSalaryRange)}
      
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          Total Staff: {total} | 
          Range: ${Math.min(...salaryData.map(d => d.min)).toLocaleString()} - 
          ${Math.max(...salaryData.map(d => d.max)).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  summary: {
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  averageSalary: {
    fontSize: 14,
    color: '#4a6da7',
    fontWeight: '500',
  },
  rangeContainer: {
    marginBottom: 16,
  },
  rangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  rangeCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  barContainer: {
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  percentageText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  stats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default SalaryDistributionChart; 
