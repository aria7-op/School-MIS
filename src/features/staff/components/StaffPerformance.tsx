import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import useStaffApi from '../hooks/useStaffApi';
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from '../../../components/charts/SimpleCharts';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

// Dummy data for fallback
const dummyPerformanceData = {
  overallMetrics: {
    averageRating: 4.3,
    totalReviews: 150,
    highPerformers: 38,
    needsImprovement: 15,
    onTrack: 97,
  },
  performanceDistribution: [
    { rating: '5 Stars', count: 45, percentage: 30 },
    { rating: '4 Stars', count: 60, percentage: 40 },
    { rating: '3 Stars', count: 30, percentage: 20 },
    { rating: '2 Stars', count: 10, percentage: 7 },
    { rating: '1 Star', count: 5, percentage: 3 },
  ],
  departmentPerformance: [
    { department: 'IT', avgRating: 4.5, completionRate: 95, attendance: 92 },
    { department: 'HR', avgRating: 4.2, completionRate: 88, attendance: 94 },
    { department: 'Finance', avgRating: 4.4, completionRate: 92, attendance: 96 },
    { department: 'Marketing', avgRating: 4.1, completionRate: 85, attendance: 90 },
    { department: 'Operations', avgRating: 4.3, completionRate: 90, attendance: 93 },
  ],
  performanceTrends: [
    { month: 'Jan', avgRating: 4.1, taskCompletion: 85, attendance: 90 },
    { month: 'Feb', avgRating: 4.2, taskCompletion: 87, attendance: 91 },
    { month: 'Mar', avgRating: 4.3, taskCompletion: 89, attendance: 92 },
    { month: 'Apr', avgRating: 4.2, taskCompletion: 88, attendance: 93 },
    { month: 'May', avgRating: 4.4, taskCompletion: 91, attendance: 94 },
    { month: 'Jun', avgRating: 4.3, taskCompletion: 90, attendance: 93 },
  ],
  kpiMetrics: [
    { kpi: 'Task Completion', current: 90, target: 95, trend: 'up' },
    { kpi: 'Attendance Rate', current: 93, target: 95, trend: 'up' },
    { kpi: 'Quality Score', current: 4.3, target: 4.5, trend: 'stable' },
    { kpi: 'Training Hours', current: 24, target: 30, trend: 'down' },
    { kpi: 'Innovation Score', current: 3.8, target: 4.0, trend: 'up' },
    { kpi: 'Team Collaboration', current: 4.2, target: 4.3, trend: 'up' },
  ],
  recentReviews: [
    { id: 1, staffName: 'John Doe', rating: 4.5, comment: 'Excellent work on the project', date: '2024-01-15' },
    { id: 2, staffName: 'Sarah Johnson', rating: 4.2, comment: 'Good performance, needs improvement in communication', date: '2024-01-14' },
    { id: 3, staffName: 'Mike Wilson', rating: 4.8, comment: 'Outstanding contribution to the team', date: '2024-01-13' },
    { id: 4, staffName: 'Lisa Brown', rating: 3.9, comment: 'Meeting expectations, room for growth', date: '2024-01-12' },
  ],
  performanceCategories: [
    { category: 'Technical Skills', avgScore: 4.4, weight: 30 },
    { category: 'Communication', avgScore: 4.1, weight: 20 },
    { category: 'Leadership', avgScore: 4.2, weight: 25 },
    { category: 'Innovation', avgScore: 3.8, weight: 15 },
    { category: 'Teamwork', avgScore: 4.3, weight: 10 },
  ],
  goalAchievement: [
    { goal: 'Complete Training', achieved: 85, target: 100, status: 'in-progress' },
    { goal: 'Project Delivery', achieved: 92, target: 90, status: 'completed' },
    { goal: 'Client Satisfaction', achieved: 88, target: 85, status: 'completed' },
    { goal: 'Process Improvement', achieved: 75, target: 80, status: 'in-progress' },
  ],
};

const StaffPerformance: React.FC = () => {
  const { getStaffPerformance, loading, error } = useStaffApi();
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showDummyData, setShowDummyData] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, [selectedPeriod]);

  const loadPerformanceData = async () => {
    try {
      // Try to load performance data for a sample staff member (ID: 1)
      const performance = await getStaffPerformance(1);
      
      // Transform backend data to match our format
      const transformedData = {
        ...dummyPerformanceData,
        // Override with real data if available
        overallMetrics: {
          averageRating: performance?.overallRating || dummyPerformanceData.overallMetrics.averageRating,
          totalReviews: performance?.totalReviews || dummyPerformanceData.overallMetrics.totalReviews,
          highPerformers: performance?.highPerformers || dummyPerformanceData.overallMetrics.highPerformers,
          needsImprovement: performance?.needsImprovement || dummyPerformanceData.overallMetrics.needsImprovement,
          onTrack: performance?.onTrack || dummyPerformanceData.overallMetrics.onTrack,
        },
      };
      
      setPerformanceData(transformedData);
      setShowDummyData(false);
    } catch (error) {
      
      // Set dummy data on error
      setPerformanceData(dummyPerformanceData);
      setShowDummyData(true);
    }
  };

  const renderMetricCard = (title: string, value: string | number, subtitle: string, color: string = '#6366f1') => (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderKPIItem = (kpi: any) => {
    const getTrendColor = (trend: string) => {
      switch (trend) {
        case 'up': return '#10b981';
        case 'down': return '#ef4444';
        default: return '#f59e0b';
      }
    };

    const getProgressColor = (current: number, target: number) => {
      const percentage = (current / target) * 100;
      if (percentage >= 100) return '#10b981';
      if (percentage >= 80) return '#f59e0b';
      return '#ef4444';
    };

    return (
      <View key={kpi.kpi} style={styles.kpiCard}>
        <View style={styles.kpiHeader}>
          <Text style={styles.kpiTitle}>{kpi.kpi}</Text>
          <View style={[styles.trendIndicator, { backgroundColor: getTrendColor(kpi.trend) }]}>
            <MaterialIcons 
              name={kpi.trend === 'up' ? 'trending-up' : kpi.trend === 'down' ? 'trending-down' : 'trending-flat'} 
              size={12} 
              color="#fff" 
            />
          </View>
        </View>
        <View style={styles.kpiProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%`,
                  backgroundColor: getProgressColor(kpi.current, kpi.target)
                }
              ]} 
            />
          </View>
          <Text style={styles.kpiValues}>
            {kpi.current}/{kpi.target}
          </Text>
        </View>
      </View>
    );
  };

  const renderReviewItem = (review: any) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewName}>{review.staffName}</Text>
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={16} color="#f59e0b" />
          <Text style={styles.ratingText}>{review.rating}</Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
      <Text style={styles.reviewDate}>{review.date}</Text>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodContainer}>
      {['week', 'month', 'quarter', 'year'].map(period => (
        <TouchableOpacity
          key={period}
          style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading performance data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {showDummyData && (
        <View style={styles.warningBanner}>
          <MaterialIcons name="warning" size={16} color="#f59e0b" />
          <Text style={styles.warningText}>Showing dummy data due to API error</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Performance</Text>
        <Text style={styles.headerSubtitle}>Comprehensive performance metrics and analytics</Text>
      </View>

      {/* Period Selector */}
      {renderPeriodSelector()}

      {/* Overall Metrics */}
      <View style={styles.metricsGrid}>
        {renderMetricCard('Average Rating', performanceData?.overallMetrics?.averageRating || 0, 'Overall performance')}
        {renderMetricCard('Total Reviews', performanceData?.overallMetrics?.totalReviews || 0, 'Performance reviews')}
        {renderMetricCard('High Performers', performanceData?.overallMetrics?.highPerformers || 0, 'Top 25%')}
        {renderMetricCard('Needs Improvement', performanceData?.overallMetrics?.needsImprovement || 0, 'Bottom 10%')}
      </View>

      {/* Performance Distribution */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Performance Distribution</Text>
        <View style={styles.chartContainer}>
          <SimplePieChart
            data={performanceData?.performanceDistribution?.map((item: any) => ({
              x: item.rating,
              y: item.count,
            })) || []}
            title="Performance Distribution"
            size={200}
          />
        </View>
      </View>

      {/* Performance Trends */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Performance Trends</Text>
        <View style={styles.chartContainer}>
          <SimpleLineChart
            data={performanceData?.performanceTrends?.map((item: any) => ({
              x: item.month,
              y: item.avgRating,
            })) || []}
            title="Average Rating Trend"
            height={200}
          />
        </View>
      </View>

      {/* Department Performance */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Department Performance</Text>
        <View style={styles.chartContainer}>
          <SimpleBarChart
            data={performanceData?.departmentPerformance?.map((item: any) => ({
              x: item.department,
              y: item.avgRating,
            })) || []}
            title="Average Rating by Department"
            height={200}
          />
        </View>
      </View>

      {/* KPI Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KPI Metrics</Text>
        <View style={styles.kpiGrid}>
          {performanceData?.kpiMetrics?.map(renderKPIItem)}
        </View>
      </View>

      {/* Recent Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        <View style={styles.reviewsContainer}>
          {performanceData?.recentReviews?.slice(0, 3).map(renderReviewItem)}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
  },
  periodText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#fff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: isLargeScreen ? '48%' : '100%',
    marginRight: isLargeScreen ? '2%' : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  metricTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  chartSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiGrid: {
    gap: 12,
  },
  kpiCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  trendIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  kpiValues: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    minWidth: 40,
  },
  reviewsContainer: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  reviewComment: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
});

export default StaffPerformance; 
