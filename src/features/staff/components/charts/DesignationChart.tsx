import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';

interface DesignationData {
  name: string;
  count: number;
}

interface DesignationChartProps {
  data?: DesignationData[];
}

const DesignationChart: React.FC<DesignationChartProps> = ({ data = [] }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const renderDesignation = (item: DesignationData, index: number) => {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    
    return (
      <View key={index} style={styles.designationItem}>
        <View style={styles.designationHeader}>
          <View style={[styles.colorDot, { backgroundColor: getColor(index) }]} />
          <Text style={styles.designationName}>{item.name}</Text>
          <Text style={styles.designationCount}>{item.count}</Text>
        </View>
        <View style={styles.percentageBar}>
          <View 
            style={[
              styles.percentageFill, 
              { 
                width: `${percentage}%`,
                backgroundColor: getColor(index)
              }
            ]} 
          />
        </View>
        <Text style={styles.percentageText}>{percentage.toFixed(1)}%</Text>
      </View>
    );
  };

  const getColor = (index: number) => {
    const colors = ['#4a6da7', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'];
    return colors[index % colors.length];
  };

  if (!data || data.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.noDataText}>No designation data available</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {data.map(renderDesignation)}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Total Staff: {total}
        </Text>
      </View>
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
  designationItem: {
    marginBottom: 16,
  },
  designationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  designationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  designationCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  percentageBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  percentageFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 12,
    color: '#666',
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

export default DesignationChart; 
