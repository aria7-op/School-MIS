import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';
import useStudentApi from '../hooks/useStudentApi';

interface BehaviorTabProps {
  studentId: number;
  selectedStudent?: any;
}

const { width } = Dimensions.get('window');

const BehaviorTab: React.FC<BehaviorTabProps> = ({ studentId, selectedStudent }) => {
  const { colors } = useTheme();
  const { getStudentBehavior } = useStudentApi();
  const [behavior, setBehavior] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [behaviorAnalytics, setBehaviorAnalytics] = useState<any>(null);

  // 

  useEffect(() => {
    // 
    if (!studentId || studentId === 0) {
      // 
      return;
    }
    setLoading(true);
    setError(null);
    // 
    getStudentBehavior(studentId)
      .then((data) => {
        // 
        const behaviorData = Array.isArray(data) ? data : (data?.records || []);
        setBehavior(behaviorData);
        
        // Generate analytics from behavior data
        generateBehaviorAnalytics(behaviorData);
      })
      .catch((err) => {
        // 
        setError('Failed to load behavior data');
        
      })
      .finally(() => {
        // 
        setLoading(false);
      });
  }, [studentId]);

  const generateBehaviorAnalytics = (behaviorData: any[]) => {
    if (!behaviorData || behaviorData.length === 0) {
      setBehaviorAnalytics(null);
      return;
    }

    // Categorize behavior types
    const behaviorTypes = behaviorData.reduce((acc: any, record: any) => {
      const type = record.type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Calculate trends over time
    const monthlyTrends = behaviorData.reduce((acc: any, record: any) => {
      const date = new Date(record.date || record.createdAt);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // Calculate severity distribution
    const severityDistribution = behaviorData.reduce((acc: any, record: any) => {
      const severity = record.severity || 'Medium';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    setBehaviorAnalytics({
      totalRecords: behaviorData.length,
      behaviorTypes,
      monthlyTrends,
      severityDistribution,
      recentBehavior: behaviorData.slice(0, 5),
      positiveBehavior: behaviorData.filter((b: any) => b.type === 'Positive' || b.impact === 'POSITIVE'),
      negativeBehavior: behaviorData.filter((b: any) => b.type === 'Negative' || b.impact === 'NEGATIVE'),
      averageScore: behaviorData.reduce((sum: number, b: any) => sum + (b.score || 0), 0) / behaviorData.length || 0
    });
  };

  const renderBehaviorCard = (record: any, index: number) => (
    <View key={index} style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.behaviorType, { color: colors.text }]}>
          {record.type || 'Behavior Event'}
        </Text>
        <View style={[
          styles.severityBadge,
          { backgroundColor: getSeverityColor(record.severity) + '20' }
        ]}>
          <Text style={[styles.severityText, { color: getSeverityColor(record.severity) }]}>
            {record.severity || 'Medium'}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.description, { color: colors.text }]}>
        {record.description || 'No description available'}
      </Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.date}>
          {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
        </Text>
        {record.score && (
          <Text style={[styles.score, { color: colors.primary }]}>
            Score: {record.score}
          </Text>
        )}
      </View>
    </View>
  );

  const renderAnalytics = () => {
    if (!behaviorAnalytics) return null;

    const chartConfig = {
      backgroundColor: colors.card,
      backgroundGradientFrom: colors.card,
      backgroundGradientTo: colors.card,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: colors.primary,
      },
    };

    return (
      <View style={styles.analyticsContainer}>
        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {behaviorAnalytics.totalRecords}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Total Records</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {behaviorAnalytics.positiveBehavior.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Positive</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>
              {behaviorAnalytics.negativeBehavior.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Negative</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>
              {Math.round(behaviorAnalytics.averageScore)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Avg Score</Text>
          </View>
        </View>

        {/* Behavior Types Summary */}
        {Object.keys(behaviorAnalytics.behaviorTypes).length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Behavior Types</Text>
            {Object.entries(behaviorAnalytics.behaviorTypes).map(([type, count], index) => (
              <View key={type} style={styles.behaviorTypeItem}>
                <Text style={[styles.behaviorTypeText, { color: getChartColor(index) }]}>
                  {type}
                </Text>
                <Text style={[styles.behaviorTypeCount, { color: colors.text }]}>
                  {count as number}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Monthly Trends Summary */}
        {Object.keys(behaviorAnalytics.monthlyTrends).length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Monthly Trends</Text>
            {Object.entries(behaviorAnalytics.monthlyTrends).map(([month, count]) => (
              <View key={month} style={styles.trendItem}>
                <Text style={[styles.trendMonth, { color: colors.text }]}>
                  {month}
                </Text>
                <Text style={[styles.trendCount, { color: colors.primary }]}>
                  {count as number} events
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading behavior data...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
      </View>
    );
  }

  if (!selectedStudent) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.noDataText, { color: colors.text }]}>
          Please select a student to view behavior data
        </Text>
        <Text style={[styles.noDataText, { color: colors.text + '80', fontSize: 14, marginTop: 8 }]}>
          Debug: No student selected (studentId: {studentId})
        </Text>
      </View>
    );
  }

  if (!behavior || behavior.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.noDataText, { color: colors.text }]}>
          No behavior records found for {selectedStudent?.user?.firstName || selectedStudent?.firstName || 'this student'}
        </Text>
        <Text style={[styles.noDataText, { color: colors.text + '80', fontSize: 14, marginTop: 8 }]}>
          This could be because the backend server is not running or there's no behavior data for this student.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={behavior}
      keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Behavior Analysis
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
              {selectedStudent.user?.firstName || selectedStudent.firstName} {selectedStudent.user?.lastName || selectedStudent.lastName}
            </Text>
          </View>
          {renderAnalytics()}
        </View>
      }
      renderItem={({ item, index }) => renderBehaviorCard(item, index)}
    />
  );
};

const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'high':
    case 'critical':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    default:
      return '#6b7280';
  }
};

const getChartColor = (index: number) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  header: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  analyticsContainer: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  behaviorTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  behaviorTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  behaviorTypeCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trendMonth: {
    fontSize: 14,
    fontWeight: '500',
  },
  trendCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  behaviorType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  score: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default BehaviorTab; 
