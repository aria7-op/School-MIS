import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import RtlView from '../../../components/ui/RtlView';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import classService from '../services/classService';

const { width } = Dimensions.get('window');

interface AdvancedClassAnalyticsProps {
  selectedClass: any;
  onAnalyticsAction: (action: string, data: any) => void;
}

const AdvancedClassAnalytics: React.FC<AdvancedClassAnalyticsProps> = ({
  selectedClass,
  onAnalyticsAction,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('month');

  const TABS = [
    { key: 'overview', label: t('overview'), icon: 'dashboard' },
    { key: 'performance', label: t('performance'), icon: 'trending-up' },
    { key: 'attendance', label: t('attendance'), icon: 'check-circle' },
    { key: 'engagement', label: t('engagement'), icon: 'people' },
  ];

  // Rich dummy analytics data
  const dummyAnalytics = {
    overview: {
      totalStudents: 28,
      averageGrade: 78.5,
      attendanceRate: 92.3,
      completionRate: 87.6,
      activeAssignments: 5,
      upcomingExams: 2,
      recentActivity: 15,
    },
    performance: {
      gradeDistribution: [
        { grade: 'A+', count: 3, percentage: 10.7 },
        { grade: 'A', count: 5, percentage: 17.9 },
        { grade: 'B+', count: 8, percentage: 28.6 },
        { grade: 'B', count: 6, percentage: 21.4 },
        { grade: 'C+', count: 4, percentage: 14.3 },
        { grade: 'C', count: 2, percentage: 7.1 },
      ],
      subjectPerformance: [
        { subject: 'Mathematics', avgGrade: 82.3, improvement: 5.2 },
        { subject: 'Physics', avgGrade: 78.9, improvement: 3.1 },
        { subject: 'English', avgGrade: 75.4, improvement: 2.8 },
        { subject: 'Computer Science', avgGrade: 81.7, improvement: 6.5 },
      ],
      gradeTrends: [72, 75, 78, 76, 79, 82, 80, 83, 81, 85, 83, 87],
      monthlyPerformance: [75, 78, 82, 79, 85, 88, 86, 89, 87, 90, 88, 92],
    },
    attendance: {
      overallRate: 92.3,
      presentCount: 258,
      absentCount: 22,
      lateCount: 15,
      excusedCount: 8,
      attendanceTrends: [88, 90, 92, 89, 93, 91, 94, 92, 95, 93, 96, 94],
      subjectAttendance: [
        { subject: 'Mathematics', rate: 94.2, present: 85, absent: 5 },
        { subject: 'Physics', rate: 91.8, present: 78, absent: 7 },
        { subject: 'English', rate: 89.5, present: 68, absent: 8 },
        { subject: 'Computer Science', rate: 93.1, present: 81, absent: 6 },
      ],
      studentAttendance: [
        { student: 'John Smith', present: 25, absent: 0, rate: 100 },
        { student: 'Emma Johnson', present: 24, absent: 1, rate: 96 },
        { student: 'Michael Brown', present: 23, absent: 2, rate: 92 },
        { student: 'Sarah Davis', present: 25, absent: 0, rate: 100 },
      ],
    },
    engagement: {
      participationRate: 85.7,
      assignmentCompletion: 87.6,
      discussionParticipation: 82.3,
      resourceUtilization: 78.9,
      engagementTrends: [80, 82, 85, 83, 87, 85, 88, 86, 90, 88, 92, 90],
      activityBreakdown: [
        { activity: 'Assignments', participation: 87.6, improvement: 4.2 },
        { activity: 'Discussions', participation: 82.3, improvement: 3.1 },
        { activity: 'Resources', participation: 78.9, improvement: 2.8 },
        { activity: 'Collaboration', participation: 85.4, improvement: 5.6 },
      ],
      studentEngagement: [
        { student: 'John Smith', score: 92, level: 'High' },
        { student: 'Emma Johnson', score: 88, level: 'High' },
        { student: 'Michael Brown', score: 75, level: 'Medium' },
        { student: 'Sarah Davis', score: 95, level: 'High' },
      ],
    },
  };

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalytics(dummyAnalytics);
    } catch (error) {
      
      setAnalytics(dummyAnalytics);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Chart configurations
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
  };

  // Generate chart data
  const generateGradeDistributionData = () => {
    if (!analytics?.performance?.gradeDistribution) return null;
    return analytics.performance.gradeDistribution.map(item => ({
      name: item.grade,
      population: item.count,
      color: item.grade.includes('A') ? '#4CAF50' : 
             item.grade.includes('B') ? '#2196F3' : 
             item.grade.includes('C') ? '#FF9800' : '#F44336',
      legendFontColor: colors.text,
    }));
  };

  const generateSubjectPerformanceData = () => {
    if (!analytics?.performance?.subjectPerformance) return null;
    return {
      labels: analytics.performance.subjectPerformance.map(item => item.subject),
      data: analytics.performance.subjectPerformance.map(item => item.avgGrade),
    };
  };

  const generateGradeTrendsData = () => {
    if (!analytics?.performance?.gradeTrends) return null;
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        data: analytics.performance.gradeTrends,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const generateAttendanceTrendsData = () => {
    if (!analytics?.attendance?.attendanceTrends) return null;
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        data: analytics.attendance.attendanceTrends,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const generateSubjectAttendanceData = () => {
    if (!analytics?.attendance?.subjectAttendance) return null;
    return {
      labels: analytics.attendance.subjectAttendance.map(item => item.subject),
      data: analytics.attendance.subjectAttendance.map(item => item.rate),
    };
  };

  const generateEngagementTrendsData = () => {
    if (!analytics?.engagement?.engagementTrends) return null;
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        data: analytics.engagement.engagementTrends,
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  // Render overview tab
  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {analytics ? (
        <>
          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="people" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.overview.totalStudents}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('totalStudents')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="grade" size={24} color="#4CAF50" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.overview.averageGrade}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('averageGrade')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="check-circle" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.overview.attendanceRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('attendanceRate')}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="assignment-turned-in" size={24} color="#FF9800" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.overview.completionRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('completionRate')}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={[styles.quickStatsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t('quickStats')}
            </Text>
            <View style={styles.quickStatsGrid}>
              <View style={styles.quickStat}>
                <MaterialIcons name="assignment" size={20} color="#4CAF50" />
                <Text style={[styles.quickStatValue, { color: colors.text }]}>
                  {analytics.overview.activeAssignments}
                </Text>
                <Text style={[styles.quickStatLabel, { color: colors.text + '80' }]}>
                  {t('activeAssignments')}
                </Text>
              </View>
              
              <View style={styles.quickStat}>
                <MaterialIcons name="event" size={20} color="#FF9800" />
                <Text style={[styles.quickStatValue, { color: colors.text }]}>
                  {analytics.overview.upcomingExams}
                </Text>
                <Text style={[styles.quickStatLabel, { color: colors.text + '80' }]}>
                  {t('upcomingExams')}
                </Text>
              </View>
              
              <View style={styles.quickStat}>
                <MaterialIcons name="notifications" size={20} color="#2196F3" />
                <Text style={[styles.quickStatValue, { color: colors.text }]}>
                  {analytics.overview.recentActivity}
                </Text>
                <Text style={[styles.quickStatLabel, { color: colors.text + '80' }]}>
                  {t('recentActivity')}
                </Text>
              </View>
            </View>
          </View>

          {/* Performance Trends */}
          {generateGradeTrendsData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('gradeTrends')}
              </Text>
              <LineChart
                data={generateGradeTrendsData()}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          )}
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingAnalytics')}...
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // Render performance tab
  const renderPerformanceTab = () => (
    <ScrollView style={styles.tabContent}>
      {analytics ? (
        <>
          {/* Grade Distribution */}
          {generateGradeDistributionData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('gradeDistribution')}
              </Text>
              <PieChart
                data={generateGradeDistributionData()}
                width={width - 32}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          )}

          {/* Subject Performance */}
          {generateSubjectPerformanceData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('subjectPerformance')}
              </Text>
              <BarChart
                data={generateSubjectPerformanceData()}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            </View>
          )}

          {/* Subject Performance Details */}
          <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t('subjectDetails')}
            </Text>
            {analytics.performance.subjectPerformance.map((subject, index) => (
              <View key={index} style={styles.subjectDetail}>
                <View style={styles.subjectInfo}>
                  <Text style={[styles.subjectName, { color: colors.text }]}>
                    {subject.subject}
                  </Text>
                  <Text style={[styles.subjectGrade, { color: colors.primary }]}>
                    {subject.avgGrade}%
                  </Text>
                </View>
                <View style={styles.improvementBadge}>
                  <MaterialIcons name="trending-up" size={16} color="#4CAF50" />
                  <Text style={[styles.improvementText, { color: '#4CAF50' }]}>
                    +{subject.improvement}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingPerformance')}...
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // Render attendance tab
  const renderAttendanceTab = () => (
    <ScrollView style={styles.tabContent}>
      {analytics ? (
        <>
          {/* Attendance Overview */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.attendance.overallRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('overallRate')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="people" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.attendance.presentCount}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('present')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="cancel" size={24} color="#F44336" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.attendance.absentCount}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('absent')}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="schedule" size={24} color="#FF9800" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.attendance.lateCount}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('late')}
              </Text>
            </View>
          </View>

          {/* Attendance Trends */}
          {generateAttendanceTrendsData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('attendanceTrends')}
              </Text>
              <LineChart
                data={generateAttendanceTrendsData()}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {/* Subject Attendance */}
          {generateSubjectAttendanceData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('subjectAttendance')}
              </Text>
              <BarChart
                data={generateSubjectAttendanceData()}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            </View>
          )}
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingAttendance')}...
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // Render engagement tab
  const renderEngagementTab = () => (
    <ScrollView style={styles.tabContent}>
      {analytics ? (
        <>
          {/* Engagement Overview */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="people" size={24} color="#4CAF50" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.engagement.participationRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('participationRate')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="assignment-turned-in" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.engagement.assignmentCompletion}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('assignmentCompletion')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="forum" size={24} color="#FF9800" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.engagement.discussionParticipation}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('discussionParticipation')}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="library-books" size={24} color="#9C27B0" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.engagement.resourceUtilization}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('resourceUtilization')}
              </Text>
            </View>
          </View>

          {/* Engagement Trends */}
          {generateEngagementTrendsData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('engagementTrends')}
              </Text>
              <LineChart
                data={generateEngagementTrendsData()}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {/* Activity Breakdown */}
          <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t('activityBreakdown')}
            </Text>
            {analytics.engagement.activityBreakdown.map((activity, index) => (
              <View key={index} style={styles.activityDetail}>
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityName, { color: colors.text }]}>
                    {activity.activity}
                  </Text>
                  <Text style={[styles.activityRate, { color: colors.primary }]}>
                    {activity.participation}%
                  </Text>
                </View>
                <View style={styles.improvementBadge}>
                  <MaterialIcons name="trending-up" size={16} color="#4CAF50" />
                  <Text style={[styles.improvementText, { color: '#4CAF50' }]}>
                    +{activity.improvement}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingEngagement')}...
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <RtlView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? colors.primary : colors.text}
              />
              <Text style={[
                styles.tabButtonText,
                { color: activeTab === tab.key ? colors.primary : colors.text }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'performance' && renderPerformanceTab()}
      {activeTab === 'attendance' && renderAttendanceTab()}
      {activeTab === 'engagement' && renderEngagementTab()}
    </RtlView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  quickStatsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  subjectDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
  },
  subjectGrade: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  activityDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityRate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdvancedClassAnalytics; 
