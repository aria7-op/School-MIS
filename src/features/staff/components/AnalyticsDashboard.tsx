import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import useStaffApi, { 
  StaffStats, 
  StaffAnalytics, 
  StaffPerformance, 
  StaffDashboard,
  StaffReport,
  StaffComparison,
  CacheStats
} from '../hooks/useStaffApi';
import DepartmentChart from './charts/DepartmentChart';
import DesignationChart from './charts/DesignationChart';
import SalaryDistributionChart from './charts/SalaryDistributionChart';
import JoiningTrendChart from './charts/JoiningTrendChart';
import StaffPerformanceChart from './charts/StaffPerformanceChart';

interface AnalyticsDashboardProps {
  staffStats?: StaffStats | null;
  departmentStats?: any;
  designationStats?: any;
  cacheStats?: CacheStats | null;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  staffStats,
  departmentStats,
  designationStats,
  cacheStats
}) => {
  const {
    loading,
    error,
    getStaffStats,
    getStaffAnalytics,
    getStaffPerformance,
    getStaffDashboard,
    generateStaffReport,
    compareStaff,
    getCacheStats,
    warmCache,
    clearCache,
    getStaffCountByDepartment,
    getStaffCountByDesignation,
    getStaffBySchool,
    getStaffByDepartment
  } = useStaffApi();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [staffAnalytics, setStaffAnalytics] = useState<StaffAnalytics | null>(null);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance | null>(null);
  const [staffDashboard, setStaffDashboard] = useState<StaffDashboard | null>(null);
  const [staffReport, setStaffReport] = useState<StaffReport | null>(null);
  const [staffComparison, setStaffComparison] = useState<StaffComparison | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (selectedStaffId) {
      loadStaffDetails(selectedStaffId);
    }
  }, [selectedStaffId]);

  const loadStaffDetails = async (staffId: number) => {
    try {
      const [analytics, performance, dashboard] = await Promise.all([
        getStaffAnalytics(staffId, '30d'),
        getStaffPerformance(staffId),
        getStaffDashboard(staffId)
      ]);
      
      setStaffAnalytics(analytics);
      setStaffPerformance(performance);
      setStaffDashboard(dashboard);
    } catch (err) {
      
    }
  };

  const handleGenerateReport = async () => {
    try {
      const report = await generateStaffReport({
        status: 'ACTIVE',
        joiningDateAfter: '2023-01-01'
      });
      setStaffReport(report);
      setShowReport(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleCompareStaff = async () => {
    try {
      // Example: Compare first 3 staff members
      const staffIds = [1, 2, 3];
      const comparison = await compareStaff(staffIds);
      setStaffComparison(comparison);
      setShowComparison(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleWarmCache = async () => {
    try {
      await warmCache({ schoolId: 1 });
      Alert.alert('Success', 'Cache warmed successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Confirm Clear Cache',
      'Are you sure you want to clear all cache?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.container}>
      {/* Quick Stats Cards */}
      {staffStats && (
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content>
              <View style={styles.statHeader}>
                <MaterialIcons name="people" size={24} color="#2196F3" />
                <Text style={styles.statNumber}>{staffStats.totalStaff}</Text>
              </View>
              <Text style={styles.statLabel}>Total Staff</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <View style={styles.statHeader}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>{staffStats.activeStaff}</Text>
              </View>
              <Text style={styles.statLabel}>Active Staff</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <View style={styles.statHeader}>
                <MaterialIcons name="attach-money" size={24} color="#FF9800" />
                <Text style={styles.statNumber}>${staffStats.averageSalary.toLocaleString()}</Text>
              </View>
              <Text style={styles.statLabel}>Average Salary</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <View style={styles.statHeader}>
                <MaterialIcons name="cached" size={24} color="#9C27B0" />
                <Text style={styles.statNumber}>{cacheStats?.hitRate || 0}%</Text>
              </View>
              <Text style={styles.statLabel}>Cache Hit Rate</Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Charts Section */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Department Distribution</Text>
          <DepartmentChart data={departmentStats || []} />
        </Card.Content>
      </Card>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Designation Breakdown</Text>
          <DesignationChart data={designationStats || []} />
        </Card.Content>
      </Card>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Salary Distribution</Text>
          <SalaryDistributionChart data={staffStats?.salaryDistribution || []} />
        </Card.Content>
      </Card>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={styles.chartTitle}>Joining Trends</Text>
          <JoiningTrendChart data={staffStats?.joiningTrend || []} />
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleGenerateReport}
          icon="file-chart"
          style={styles.actionButton}
        >
          Generate Report
        </Button>
        <Button
          mode="contained"
          onPress={handleCompareStaff}
          icon="compare"
          style={styles.actionButton}
        >
          Compare Staff
        </Button>
      </View>
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView style={styles.container}>
      {selectedStaffId ? (
        <>
          {staffPerformance && (
            <Card style={styles.performanceCard}>
              <Card.Content>
                <Text style={styles.performanceTitle}>Performance Overview</Text>
                <View style={styles.performanceGrid}>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceNumber}>{staffPerformance.overallRating}</Text>
                    <Text style={styles.performanceLabel}>Overall Rating</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceNumber}>{staffPerformance.attendanceScore}</Text>
                    <Text style={styles.performanceLabel}>Attendance</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceNumber}>{staffPerformance.taskCompletionRate}%</Text>
                    <Text style={styles.performanceLabel}>Task Completion</Text>
                  </View>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceNumber}>{staffPerformance.feedbackScore}</Text>
                    <Text style={styles.performanceLabel}>Feedback Score</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          {staffAnalytics && (
            <Card style={styles.analyticsCard}>
              <Card.Content>
                <Text style={styles.analyticsTitle}>Analytics</Text>
                <View style={styles.analyticsGrid}>
                  <View style={styles.analyticsItem}>
                    <Text style={styles.analyticsNumber}>{staffAnalytics.attendanceRate}%</Text>
                    <Text style={styles.analyticsLabel}>Attendance Rate</Text>
                  </View>
                  <View style={styles.analyticsItem}>
                    <Text style={styles.analyticsNumber}>{staffAnalytics.averageWorkingHours}h</Text>
                    <Text style={styles.analyticsLabel}>Avg Working Hours</Text>
                  </View>
                  <View style={styles.analyticsItem}>
                    <Text style={styles.analyticsNumber}>{staffAnalytics.performanceScore}</Text>
                    <Text style={styles.analyticsLabel}>Performance Score</Text>
                  </View>
                  <View style={styles.analyticsItem}>
                    <Text style={styles.analyticsNumber}>{staffAnalytics.salaryGrowth}%</Text>
                    <Text style={styles.analyticsLabel}>Salary Growth</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          <Card style={styles.chartCard}>
            <Card.Content>
              <Text style={styles.chartTitle}>Performance Chart</Text>
              <StaffPerformanceChart 
                performance={staffPerformance}
                analytics={staffAnalytics}
              />
            </Card.Content>
          </Card>
        </>
      ) : (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>Select a staff member to view performance analytics</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );

  const renderCacheTab = () => (
    <ScrollView style={styles.container}>
      {cacheStats && (
        <Card style={styles.cacheCard}>
          <Card.Content>
            <Text style={styles.cacheTitle}>Cache Statistics</Text>
            <View style={styles.cacheGrid}>
              <View style={styles.cacheItem}>
                <Text style={styles.cacheNumber}>{cacheStats.totalKeys}</Text>
                <Text style={styles.cacheLabel}>Total Keys</Text>
              </View>
              <View style={styles.cacheItem}>
                <Text style={styles.cacheNumber}>{cacheStats.hitRate}%</Text>
                <Text style={styles.cacheLabel}>Hit Rate</Text>
              </View>
              <View style={styles.cacheItem}>
                <Text style={styles.cacheNumber}>{cacheStats.missRate}%</Text>
                <Text style={styles.cacheLabel}>Miss Rate</Text>
              </View>
              <View style={styles.cacheItem}>
                <Text style={styles.cacheNumber}>{cacheStats.memoryUsage}MB</Text>
                <Text style={styles.cacheLabel}>Memory Usage</Text>
              </View>
            </View>
            <Text style={styles.cacheLastWarmed}>
              Last Warmed: {new Date(cacheStats.lastWarmed).toLocaleString()}
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.cacheActions}>
        <Button
          mode="contained"
          onPress={handleWarmCache}
          icon="cached"
          style={styles.cacheButton}
        >
          Warm Cache
        </Button>
        <Button
          mode="contained"
          onPress={handleClearCache}
          icon="clear"
          style={[styles.cacheButton, styles.clearButton]}
        >
          Clear Cache
        </Button>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'overview', label: 'Overview', icon: 'chart-line' },
            { value: 'performance', label: 'Performance', icon: 'account-star' },
            { value: 'cache', label: 'Cache', icon: 'cached' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.content}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'cache' && renderCacheTab()}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text>Loading analytics...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  chartCard: {
    margin: 16,
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  performanceCard: {
    margin: 16,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  analyticsCard: {
    margin: 16,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyCard: {
    margin: 16,
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  cacheCard: {
    margin: 16,
  },
  cacheTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cacheGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cacheItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  cacheNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  cacheLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cacheLastWarmed: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  cacheActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  cacheButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f44336',
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AnalyticsDashboard;
