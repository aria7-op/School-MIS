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
import { SimpleBarChart, SimplePieChart, SimpleLineChart } from '../../../components/charts/SimpleCharts';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

// Dummy data for fallback
const dummyAnalyticsData = {
  departmentDistribution: { 'IT': 30, 'HR': 25, 'Finance': 20, 'Marketing': 15, 'Operations': 10 },
  departmentGrowth: [
    { department: 'IT', growth: 15, retention: 92 },
    { department: 'HR', growth: 8, retention: 88 },
    { department: 'Finance', growth: 12, retention: 95 },
    { department: 'Marketing', growth: 20, retention: 85 },
    { department: 'Operations', growth: 5, retention: 90 },
  ],
  designationDistribution: { 'Manager': 20, 'Senior': 35, 'Junior': 45, 'Intern': 10 },
  designationSalary: [
    { designation: 'Manager', avgSalary: 65000, count: 20 },
    { designation: 'Senior', avgSalary: 45000, count: 35 },
    { designation: 'Junior', avgSalary: 35000, count: 45 },
    { designation: 'Intern', avgSalary: 25000, count: 10 },
  ],
  genderDistribution: { 'Male': 45, 'Female': 40, 'Other': 15 },
  genderSalaryGap: [
    { gender: 'Male', avgSalary: 48000, count: 45 },
    { gender: 'Female', avgSalary: 45000, count: 40 },
    { gender: 'Other', avgSalary: 46000, count: 15 },
  ],
  salaryDistribution: { '30-40k': 25, '40-50k': 35, '50-60k': 25, '60k+': 15 },
  salaryTrends: [
    { period: 'Q1 2023', avgSalary: 42000, totalPayroll: 2100000 },
    { period: 'Q2 2023', avgSalary: 44000, totalPayroll: 2200000 },
    { period: 'Q3 2023', avgSalary: 45000, totalPayroll: 2250000 },
    { period: 'Q4 2023', avgSalary: 46000, totalPayroll: 2300000 },
    { period: 'Q1 2024', avgSalary: 47000, totalPayroll: 2350000 },
  ],
  performanceMetrics: [
    { metric: 'Average Rating', value: 4.3, target: 4.5, trend: 'up' },
    { metric: 'Attendance Rate', value: 92, target: 95, trend: 'up' },
    { metric: 'Task Completion', value: 88, target: 90, trend: 'stable' },
    { metric: 'Training Hours', value: 24, target: 30, trend: 'down' },
  ],
  hiringTrends: [
    { month: 'Jan', hires: 12, departures: 3, netGrowth: 9 },
    { month: 'Feb', hires: 8, departures: 2, netGrowth: 6 },
    { month: 'Mar', hires: 15, departures: 5, netGrowth: 10 },
    { month: 'Apr', hires: 10, departures: 4, netGrowth: 6 },
    { month: 'May', hires: 18, departures: 6, netGrowth: 12 },
    { month: 'Jun', hires: 14, departures: 3, netGrowth: 11 },
  ],
  retentionData: [
    { year: '2020', retention: 85, turnover: 15 },
    { year: '2021', retention: 87, turnover: 13 },
    { year: '2022', retention: 89, turnover: 11 },
    { year: '2023', retention: 91, turnover: 9 },
    { year: '2024', retention: 93, turnover: 7 },
  ],
  skillsDistribution: [
    { skill: 'JavaScript', proficiency: 75, demand: 85 },
    { skill: 'Python', proficiency: 60, demand: 80 },
    { skill: 'React', proficiency: 70, demand: 90 },
    { skill: 'Node.js', proficiency: 65, demand: 75 },
    { skill: 'SQL', proficiency: 80, demand: 70 },
  ],
};

const StaffAnalytics: React.FC = () => {
  const { getStaffCountByDepartment, getStaffCountByDesignation, loading, error } = useStaffApi();
  const [timeRange, setTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [showDummyData, setShowDummyData] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      // Load various analytics data using the hook
      const [deptRes, desigRes] = await Promise.allSettled([
        getStaffCountByDepartment(),
        getStaffCountByDesignation(),
      ]);

      // Process and combine data
      const departmentData = deptRes.status === 'fulfilled' ? deptRes.value || [] : [];
      const designationData = desigRes.status === 'fulfilled' ? desigRes.value || [] : [];

      // Transform backend data to match our format
      const departmentDistribution = departmentData.reduce((acc: any, item: any) => {
        acc[item.departmentName || item.name || item.department] = item.count || item.total;
        return acc;
      }, {});

      const designationDistribution = designationData.reduce((acc: any, item: any) => {
        acc[item.designation || item.name] = item.count || item.total;
        return acc;
      }, {});

      setAnalyticsData({
        ...dummyAnalyticsData,
        departmentDistribution,
        designationDistribution,
      });
      setShowDummyData(false);
    } catch (error) {
      
      // Set dummy data on error
      setAnalyticsData(dummyAnalyticsData);
      setShowDummyData(true);
    }
  };

  const renderMetricCard = (title: string, value: string | number, subtitle: string, trend?: string, color: string = '#6366f1') => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        {trend && (
          <View style={[styles.trendIndicator, { backgroundColor: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#f59e0b' }]}>
            <MaterialIcons 
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'trending-flat'} 
              size={12} 
              color="#fff" 
            />
          </View>
        )}
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {['week', 'month', 'quarter', 'year'].map(range => (
        <TouchableOpacity
          key={range}
          style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange(range)}
        >
          <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
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
        <Text style={styles.headerTitle}>Staff Analytics</Text>
        <Text style={styles.headerSubtitle}>Comprehensive insights into staff performance and trends</Text>
      </View>

      {/* Time Range Selector */}
      {renderTimeRangeSelector()}

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        {analyticsData?.performanceMetrics?.map((metric: any, index: number) => (
          <View key={index} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>{metric.metric}</Text>
              <View style={[styles.trendIndicator, { backgroundColor: metric.trend === 'up' ? '#10b981' : metric.trend === 'down' ? '#ef4444' : '#f59e0b' }]}>
                <MaterialIcons 
                  name={metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'trending-flat'} 
                  size={12} 
                  color="#fff" 
                />
              </View>
            </View>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricSubtitle}>Target: {metric.target}</Text>
          </View>
        ))}
      </View>

      {/* Department Distribution */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Department Distribution</Text>
        <View style={styles.chartContainer}>
          <SimplePieChart
            data={Object.entries(analyticsData?.departmentDistribution || {}).map(([key, value]) => ({
              x: key,
              y: value as number,
            }))}
            title="Department Distribution"
            size={200}
          />
        </View>
      </View>

      {/* Salary Trends */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Salary Trends</Text>
        <View style={styles.chartContainer}>
          <SimpleLineChart
            data={analyticsData?.salaryTrends?.map((item: any) => ({
              x: item.period,
              y: item.avgSalary,
            })) || []}
            title="Salary Trends"
            height={200}
          />
        </View>
      </View>

      {/* Hiring Trends */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Hiring Trends</Text>
        <View style={styles.chartContainer}>
          <SimpleBarChart
            data={analyticsData?.hiringTrends?.map((item: any) => ({
              x: item.month,
              y: item.netGrowth,
            })) || []}
            title="Net Growth"
            height={200}
          />
        </View>
      </View>

      {/* Retention Data */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Retention Rate</Text>
        <View style={styles.chartContainer}>
          <SimpleLineChart
            data={analyticsData?.retentionData?.map((item: any) => ({
              x: item.year,
              y: item.retention,
            })) || []}
            title="Retention Rate"
            height={200}
          />
        </View>
      </View>

      {/* Skills Distribution */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Skills Distribution</Text>
        <View style={styles.chartContainer}>
          <SimpleBarChart
            data={analyticsData?.skillsDistribution?.map((item: any) => ({
              x: item.skill,
              y: item.proficiency,
            })) || []}
            title="Skills Proficiency"
            height={200}
          />
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
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#6366f1',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  timeRangeTextActive: {
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
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  trendIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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

export default StaffAnalytics; 
