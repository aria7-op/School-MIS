import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';

interface PerformanceData {
  category: string;
  score: number;
  maxScore: number;
  color: string;
}

const StaffPerformanceChart: React.FC = () => {
  // Mock performance data
  const performanceData: PerformanceData[] = [
    { category: 'Attendance', score: 85, maxScore: 100, color: '#4a6da7' },
    { category: 'Productivity', score: 78, maxScore: 100, color: '#28a745' },
    { category: 'Teamwork', score: 92, maxScore: 100, color: '#ffc107' },
    { category: 'Communication', score: 88, maxScore: 100, color: '#dc3545' },
    { category: 'Leadership', score: 75, maxScore: 100, color: '#6f42c1' },
    { category: 'Innovation', score: 82, maxScore: 100, color: '#fd7e14' },
  ];

  const overallScore = performanceData.reduce((sum, item) => sum + item.score, 0) / performanceData.length;
  const getGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    return 'D';
  };

  const renderPerformanceBar = (item: PerformanceData, index: number) => {
    const percentage = (item.score / item.maxScore) * 100;
    
    return (
      <View key={index} style={styles.performanceItem}>
        <View style={styles.performanceHeader}>
          <Text style={styles.categoryLabel}>{item.category}</Text>
          <Text style={styles.scoreLabel}>{item.score}/{item.maxScore}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${percentage}%`,
                backgroundColor: item.color
              }
            ]} 
          />
        </View>
        <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff Performance Overview</Text>
        <View style={styles.overallScore}>
          <Text style={styles.scoreNumber}>{overallScore.toFixed(1)}</Text>
          <Text style={styles.scoreGrade}>{getGrade(overallScore)}</Text>
        </View>
      </View>
      
      {performanceData.map(renderPerformanceBar)}
      
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Strongest Area:</Text>
          <Text style={styles.summaryValue}>
            {performanceData.reduce((max, item) => item.score > max.score ? item : max).category}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Needs Improvement:</Text>
          <Text style={styles.summaryValue}>
            {performanceData.reduce((min, item) => item.score < min.score ? item : min).category}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  overallScore: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  scoreGrade: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  performanceItem: {
    marginBottom: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  progressContainer: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
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
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default StaffPerformanceChart; 
