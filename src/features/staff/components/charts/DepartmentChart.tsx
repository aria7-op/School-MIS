import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';

interface DepartmentData {
  name: string;
  count: number;
}

interface DepartmentChartProps {
  data?: DepartmentData[];
  detailed?: boolean;
}

const DepartmentChart: React.FC<DepartmentChartProps> = ({ data = [], detailed = false }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...data.map(item => item.count), 1);

  const renderBar = (item: DepartmentData, index: number) => {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    const barWidth = total > 0 ? (item.count / maxCount) * 100 : 0;
    
    return (
      <View key={index} style={styles.barContainer}>
        <View style={styles.barHeader}>
          <Text style={styles.barLabel}>{item.name}</Text>
          <Text style={styles.barCount}>{item.count}</Text>
        </View>
        <View style={styles.barBackground}>
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
        {detailed && (
          <Text style={styles.barPercentage}>{percentage.toFixed(1)}%</Text>
        )}
      </View>
    );
  };

  const getBarColor = (index: number) => {
    const colors = ['#4a6da7', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];
    return colors[index % colors.length];
  };

  if (!data || data.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.noDataText}>No department data available</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {data.map(renderBar)}
      {detailed && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total Staff: {total}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  barContainer: {
    marginBottom: 16,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  barCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  barBackground: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barPercentage: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  summary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});

export default DepartmentChart; 
