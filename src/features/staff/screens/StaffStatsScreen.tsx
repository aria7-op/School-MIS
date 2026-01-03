import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StaffStats, StaffAnalytics, StaffPerformance } from '../types';
import { useStaff } from '../hooks/useStaffApi';
import StaffCharts from '../components/StaffCharts';

const { width } = Dimensions.get('window');

const StaffStatsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { staffId } = route.params as { staffId: number };
  
  const { fetchStaffStats, fetchStaffAnalytics, fetchStaffPerformance } = useStaff();
  
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [analytics, setAnalytics] = useState<StaffAnalytics | null>(null);
  const [performance, setPerformance] = useState<StaffPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'payroll' | 'performance'>('overview');

  useEffect(() => {
    loadStatsData();
  }, [staffId]);

  const loadStatsData = async () => {
    try {
      setLoading(true);
      const [statsData, analyticsData, performanceData] = await Promise.all([
        fetchStaffStats(staffId),
        fetchStaffAnalytics(staffId),
        fetchStaffPerformance(staffId),
      ]);
      
      setStats(statsData);
      setAnalytics(analyticsData);
      setPerformance(performanceData);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatsData();
    setRefreshing(false);
  };

  const formatPercentage = (value: number) => `${Math.round(value)}%`;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Staff Statistics</Text>
            <Text style={styles.headerSubtitle}>
              {stats?.staff.name} • {stats?.staff.employeeId}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.chartsButton}
            onPress={() => setShowCharts(true)}
          >
            <MaterialIcons name="bar-chart" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
          Overview
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}
        onPress={() => setActiveTab('attendance')}
      >
        <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>
          Attendance
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'payroll' && styles.activeTab]}
        onPress={() => setActiveTab('payroll')}
      >
        <Text style={[styles.tabText, activeTab === 'payroll' && styles.activeTabText]}>
          Payroll
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'performance' && styles.activeTab]}
        onPress={() => setActiveTab('performance')}
      >
        <Text style={[styles.tabText, activeTab === 'performance' && styles.activeTabText]}>
          Performance
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Overall Performance Score */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Performance</Text>
        <View style={styles.performanceScore}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>
              {analytics?.performance.overallScore || 0}
            </Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
          <View style={styles.scoreDetails}>
            <Text style={styles.gradeText}>
              Grade: <Text style={{ color: getPerformanceColor(analytics?.performance.overallScore || 0) }}>
                {getPerformanceGrade(analytics?.performance.overallScore || 0)}
              </Text>
            </Text>
            <Text style={styles.recommendationsTitle}>Recommendations:</Text>
            {analytics?.performance.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendation}>
                • {rec}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons name="schedule" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>
              {formatPercentage(stats?.attendance.attendanceRate || 0)}
            </Text>
            <Text style={styles.statLabel}>Attendance Rate</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <FontAwesome5 name="dollar-sign" size={16} color="#10B981" />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(stats?.payroll.averageSalary || 0)}
            </Text>
            <Text style={styles.statLabel}>Avg Salary</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons name="description" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>
              {stats?.performance.totalDocuments || 0}
            </Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialIcons name="book" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>
              {stats?.performance.totalBookIssues || 0}
            </Text>
            <Text style={styles.statLabel}>Books Issued</Text>
          </View>
        </View>
      </View>

      {/* Experience & Department */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience & Department</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Years of Service</Text>
            <Text style={styles.infoValue}>{stats?.performance.experience || 0} years</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="office-building" size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{stats?.department?.name || 'N/A'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAttendanceTab = () => (
    <View style={styles.tabContent}>
      {/* Attendance Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        <View style={styles.attendanceSummary}>
          <View style={styles.attendanceCard}>
            <View style={styles.attendanceIcon}>
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.attendanceValue}>{stats?.attendance.presentDays || 0}</Text>
            <Text style={styles.attendanceLabel}>Present Days</Text>
          </View>

          <View style={styles.attendanceCard}>
            <View style={styles.attendanceIcon}>
              <MaterialIcons name="cancel" size={24} color="#EF4444" />
            </View>
            <Text style={styles.attendanceValue}>{stats?.attendance.absentDays || 0}</Text>
            <Text style={styles.attendanceLabel}>Absent Days</Text>
          </View>

          <View style={styles.attendanceCard}>
            <View style={styles.attendanceIcon}>
              <MaterialIcons name="schedule" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.attendanceValue}>{stats?.attendance.lateDays || 0}</Text>
            <Text style={styles.attendanceLabel}>Late Days</Text>
          </View>

          <View style={styles.attendanceCard}>
            <View style={styles.attendanceIcon}>
              <MaterialIcons name="people" size={24} color="#6B7280" />
            </View>
            <Text style={styles.attendanceValue}>{stats?.attendance.totalDays || 0}</Text>
            <Text style={styles.attendanceLabel}>Total Days</Text>
          </View>
        </View>
      </View>

      {/* Attendance Trends */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Trends</Text>
        <View style={styles.trendsContainer}>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Current Month</Text>
            <Text style={styles.trendValue}>
              {formatPercentage(performance?.attendance.currentMonth || 0)}
            </Text>
            <View style={styles.trendIndicator}>
              <MaterialIcons
                name={performance?.attendance.trend && performance.attendance.trend > 0 ? 'trending-up' : 'trending-down'}
                size={16}
                color={performance?.attendance.trend && performance.attendance.trend > 0 ? '#10B981' : '#EF4444'}
              />
              <Text
                style={[
                  styles.trendChange,
                  { color: performance?.attendance.trend && performance.attendance.trend > 0 ? '#10B981' : '#EF4444' }
                ]}
              >
                {Math.abs(performance?.attendance.trend || 0)}%
              </Text>
            </View>
          </View>

          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Last Month</Text>
            <Text style={styles.trendValue}>
              {formatPercentage(performance?.attendance.lastMonth || 0)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPayrollTab = () => (
    <View style={styles.tabContent}>
      {/* Payroll Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payroll Summary</Text>
        <View style={styles.payrollSummary}>
          <View style={styles.payrollCard}>
            <View style={styles.payrollIcon}>
              <FontAwesome5 name="dollar-sign" size={20} color="#10B981" />
            </View>
            <Text style={styles.payrollValue}>
              {formatCurrency(stats?.payroll.totalPaid || 0)}
            </Text>
            <Text style={styles.payrollLabel}>Total Paid</Text>
          </View>

          <View style={styles.payrollCard}>
            <View style={styles.payrollIcon}>
              <MaterialIcons name="pending" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.payrollValue}>
              {stats?.payroll.pendingPayrolls || 0}
            </Text>
            <Text style={styles.payrollLabel}>Pending</Text>
          </View>

          <View style={styles.payrollCard}>
            <View style={styles.payrollIcon}>
              <MaterialIcons name="assessment" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.payrollValue}>
              {stats?.payroll.totalPayrolls || 0}
            </Text>
            <Text style={styles.payrollLabel}>Total Payrolls</Text>
          </View>
        </View>
      </View>

      {/* Salary Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary Information</Text>
        <View style={styles.salaryInfo}>
          <View style={styles.salaryItem}>
            <Text style={styles.salaryLabel}>Average Salary</Text>
            <Text style={styles.salaryValue}>
              {formatCurrency(stats?.payroll.averageSalary || 0)}
            </Text>
          </View>
          <View style={styles.salaryItem}>
            <Text style={styles.salaryLabel}>Total Earnings</Text>
            <Text style={styles.salaryValue}>
              {formatCurrency(performance?.payroll.totalEarnings || 0)}
            </Text>
          </View>
          <View style={styles.salaryItem}>
            <Text style={styles.salaryLabel}>Payment Compliance</Text>
            <Text style={styles.salaryValue}>
              {formatPercentage(performance?.payroll.paymentCompliance || 0)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPerformanceTab = () => (
    <View style={styles.tabContent}>
      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.performanceMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Documents Uploaded</Text>
            <View style={styles.metricBar}>
              <View 
                style={[
                  styles.metricBarFill,
                  { 
                    width: `${Math.min((performance?.documents.totalUploaded || 0) / 10 * 100, 100)}%`,
                    backgroundColor: '#3B82F6'
                  }
                ]} 
              />
            </View>
            <Text style={styles.metricValue}>{performance?.documents.totalUploaded || 0}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Books Issued</Text>
            <View style={styles.metricBar}>
              <View 
                style={[
                  styles.metricBarFill,
                  { 
                    width: `${Math.min((performance?.bookIssues.totalIssued || 0) / 5 * 100, 100)}%`,
                    backgroundColor: '#10B981'
                  }
                ]} 
              />
            </View>
            <Text style={styles.metricValue}>{performance?.bookIssues.totalIssued || 0}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Return Rate</Text>
            <View style={styles.metricBar}>
              <View 
                style={[
                  styles.metricBarFill,
                  { 
                    width: `${performance?.bookIssues.returnRate || 0}%`,
                    backgroundColor: '#F59E0B'
                  }
                ]} 
              />
            </View>
            <Text style={styles.metricValue}>{formatPercentage(performance?.bookIssues.returnRate || 0)}</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialIcons name="description" size={16} color="#3B82F6" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                {performance?.documents.recentUploads || 0} new documents uploaded
              </Text>
              <Text style={styles.activityTime}>This month</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialIcons name="book" size={16} color="#10B981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                {performance?.bookIssues.overdueBooks || 0} books overdue
              </Text>
              <Text style={styles.activityTime}>Requires attention</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={48} color="#6B7280" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'attendance' && renderAttendanceTab()}
        {activeTab === 'payroll' && renderPayrollTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
      </ScrollView>

      {showCharts && analytics && performance && (
        <StaffCharts
          analytics={analytics}
          performance={performance}
          onClose={() => setShowCharts(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  chartsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  performanceScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  scoreDetails: {
    flex: 1,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  recommendation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 64) / 2 - 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  attendanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceCard: {
    flex: 1,
    alignItems: 'center',
  },
  attendanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  trendsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendChange: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  payrollSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payrollCard: {
    flex: 1,
    alignItems: 'center',
  },
  payrollIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  payrollValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  payrollLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  salaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  salaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  salaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  salaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  performanceMetrics: {
    marginTop: 8,
  },
  metricItem: {
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  metricBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityList: {
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});

export default StaffStatsScreen; 
