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
import { useNavigation } from '@react-navigation/native';
import { StaffDashboard, StaffReport } from '../types';
import useStaffApi from './useStaffApi';
import StaffCharts from '../components/StaffCharts';

const { width } = Dimensions.get('window');

const StaffDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { 
    loading, 
    error, 
    getStaffStats, 
    generateStaffReport, 
    getStaffCountByDepartment,
    getStaffCountByDesignation 
  } = useStaffApi();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'reports'>('overview');
  const [dashboard, setDashboard] = useState<any>(null);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch staff statistics
      const stats = await getStaffStats(1); // Assuming staff ID 1 for demo
      
      // Fetch department and designation counts
      const [deptStats, designationStats] = await Promise.all([
        getStaffCountByDepartment(),
        getStaffCountByDesignation(),
      ]);

      setDashboard({
        overview: {
          totalStaff: stats.totalStaff,
          activeStaff: stats.activeStaff,
          newThisMonth: stats.joiningTrend[stats.joiningTrend.length - 1]?.count || 0,
          averageSalary: stats.averageSalary,
        },
        departmentStats: stats.departmentStats.map((dept: any) => ({
          department: dept.departmentName,
          count: dept.count,
          averageSalary: stats.averageSalary, // Using overall average for demo
        })),
        recentActivity: [
          {
            type: 'created',
            staff: { user: { firstName: 'John', lastName: 'Doe' } },
            timestamp: new Date().toISOString(),
          },
          {
            type: 'updated',
            staff: { user: { firstName: 'Jane', lastName: 'Smith' } },
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
        upcomingEvents: [
          {
            type: 'birthday',
            staff: { user: { firstName: 'Alice', lastName: 'Johnson' } },
            date: new Date(Date.now() + 86400000 * 3).toISOString(),
          },
          {
            type: 'anniversary',
            staff: { user: { firstName: 'Bob', lastName: 'Wilson' } },
            date: new Date(Date.now() + 86400000 * 7).toISOString(),
          },
        ],
        attendanceToday: {
          present: Math.floor(stats.activeStaff * 0.8),
          late: Math.floor(stats.activeStaff * 0.1),
          absent: Math.floor(stats.activeStaff * 0.1),
          total: stats.activeStaff,
        },
      });

      // Fetch staff report
      const staffReport = await generateStaffReport();
      setReport(staffReport);
    } catch (error) {
      
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderOverviewSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Overview</Text>
      
      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.overviewGradient}
          >
            <MaterialCommunityIcons name="account-group" size={32} color="#FFFFFF" />
            <Text style={styles.overviewValue}>{dashboard?.overview.totalStaff || 0}</Text>
            <Text style={styles.overviewLabel}>Total Staff</Text>
          </LinearGradient>
        </View>

        <View style={styles.overviewCard}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.overviewGradient}
          >
            <MaterialIcons name="check-circle" size={32} color="#FFFFFF" />
            <Text style={styles.overviewValue}>{dashboard?.overview.activeStaff || 0}</Text>
            <Text style={styles.overviewLabel}>Active Staff</Text>
          </LinearGradient>
        </View>

        <View style={styles.overviewCard}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.overviewGradient}
          >
            <MaterialIcons name="trending-up" size={32} color="#FFFFFF" />
            <Text style={styles.overviewValue}>{dashboard?.overview.newThisMonth || 0}</Text>
            <Text style={styles.overviewLabel}>New This Month</Text>
          </LinearGradient>
        </View>

        <View style={styles.overviewCard}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.overviewGradient}
          >
            <FontAwesome5 name="dollar-sign" size={24} color="#FFFFFF" />
            <Text style={styles.overviewValue}>
              ${((dashboard?.overview.averageSalary || 0) / 1000).toFixed(0)}k
            </Text>
            <Text style={styles.overviewLabel}>Avg Salary</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );

  const renderDepartmentStats = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Department Distribution</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.departmentList}>
        {dashboard?.departmentStats.map((dept, index) => (
          <View key={index} style={styles.departmentItem}>
            <View style={styles.departmentInfo}>
              <View style={styles.departmentIcon}>
                <MaterialCommunityIcons name="office-building" size={20} color="#3B82F6" />
              </View>
              <View style={styles.departmentDetails}>
                <Text style={styles.departmentName}>{dept.department}</Text>
                <Text style={styles.departmentCount}>{dept.count} staff members</Text>
              </View>
            </View>
            <View style={styles.departmentStats}>
              <Text style={styles.departmentSalary}>
                ${(dept.averageSalary / 1000).toFixed(0)}k avg
              </Text>
              <View style={styles.departmentBar}>
                <View 
                  style={[
                    styles.departmentBarFill,
                    { width: `${(dept.count / (dashboard?.overview.totalStaff || 1)) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.activityList}>
        {dashboard?.recentActivity.slice(0, 5).map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialIcons
                name={
                  activity.type === 'created' ? 'person-add' :
                  activity.type === 'updated' ? 'edit' : 'delete'
                }
                size={16}
                color={
                  activity.type === 'created' ? '#10B981' :
                  activity.type === 'updated' ? '#3B82F6' : '#EF4444'
                }
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                <Text style={styles.activityName}>
                  {activity.staff.user?.firstName} {activity.staff.user?.lastName}
                </Text>
                {' '}
                {activity.type === 'created' ? 'was added' :
                 activity.type === 'updated' ? 'was updated' : 'was removed'}
              </Text>
              <Text style={styles.activityTime}>
                {new Date(activity.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderUpcomingEvents = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      
      <View style={styles.eventsList}>
        {dashboard?.upcomingEvents.slice(0, 3).map((event, index) => (
          <View key={index} style={styles.eventItem}>
            <View style={styles.eventIcon}>
              <MaterialIcons
                name={
                  event.type === 'birthday' ? 'cake' :
                  event.type === 'anniversary' ? 'celebration' : 'event'
                }
                size={20}
                color="#F59E0B"
              />
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>
                {event.type === 'birthday' ? 'Birthday' :
                 event.type === 'anniversary' ? 'Work Anniversary' : 'Contract End'}
              </Text>
              <Text style={styles.eventName}>
                {event.staff.user?.firstName} {event.staff.user?.lastName}
              </Text>
              <Text style={styles.eventDate}>
                {new Date(event.date).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAttendanceToday = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Today's Attendance</Text>
      
      <View style={styles.attendanceContainer}>
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceIcon}>
            <MaterialIcons name="check-circle" size={24} color="#10B981" />
          </View>
          <Text style={styles.attendanceValue}>{dashboard?.attendanceToday.present || 0}</Text>
          <Text style={styles.attendanceLabel}>Present</Text>
        </View>

        <View style={styles.attendanceCard}>
          <View style={styles.attendanceIcon}>
            <MaterialIcons name="schedule" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.attendanceValue}>{dashboard?.attendanceToday.late || 0}</Text>
          <Text style={styles.attendanceLabel}>Late</Text>
        </View>

        <View style={styles.attendanceCard}>
          <View style={styles.attendanceIcon}>
            <MaterialIcons name="cancel" size={24} color="#EF4444" />
          </View>
          <Text style={styles.attendanceValue}>{dashboard?.attendanceToday.absent || 0}</Text>
          <Text style={styles.attendanceLabel}>Absent</Text>
        </View>

        <View style={styles.attendanceCard}>
          <View style={styles.attendanceIcon}>
            <MaterialIcons name="people" size={24} color="#6B7280" />
          </View>
          <Text style={styles.attendanceValue}>{dashboard?.attendanceToday.total || 0}</Text>
          <Text style={styles.attendanceLabel}>Total</Text>
        </View>
      </View>
    </View>
  );

  const renderAnalyticsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Analytics</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => setShowCharts(true)}
        >
          <Text style={styles.viewAllText}>View Charts</Text>
          <MaterialIcons name="bar-chart" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.analyticsGrid}>
        <TouchableOpacity 
          style={styles.analyticsCard}
          onPress={async () => {
            try {
              const deptStats = await getStaffCountByDepartment();

              // You can show department analytics in a modal or navigate to a screen
            } catch (error) {
              
            }
          }}
        >
          <Text style={styles.analyticsTitle}>Gender Distribution</Text>
          <View style={styles.analyticsContent}>
            <View style={styles.genderItem}>
              <View style={styles.genderIcon}>
                <FontAwesome5 name="mars" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.genderLabel}>Male</Text>
              <Text style={styles.genderValue}>65%</Text>
            </View>
            <View style={styles.genderItem}>
              <View style={styles.genderIcon}>
                <FontAwesome5 name="venus" size={16} color="#EC4899" />
              </View>
              <Text style={styles.genderLabel}>Female</Text>
              <Text style={styles.genderValue}>35%</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.analyticsCard}
          onPress={async () => {
            try {
              const stats = await getStaffStats(1);

              // You can show salary analytics in a modal or navigate to a screen
            } catch (error) {
              
            }
          }}
        >
          <Text style={styles.analyticsTitle}>Salary Distribution</Text>
          <View style={styles.analyticsContent}>
            <View style={styles.salaryItem}>
              <Text style={styles.salaryLabel}>Low</Text>
              <View style={styles.salaryBar}>
                <View style={[styles.salaryBarFill, { width: '30%', backgroundColor: '#EF4444' }]} />
              </View>
              <Text style={styles.salaryValue}>30%</Text>
            </View>
            <View style={styles.salaryItem}>
              <Text style={styles.salaryLabel}>Medium</Text>
              <View style={styles.salaryBar}>
                <View style={[styles.salaryBarFill, { width: '45%', backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={styles.salaryValue}>45%</Text>
            </View>
            <View style={styles.salaryItem}>
              <Text style={styles.salaryLabel}>High</Text>
              <View style={styles.salaryBar}>
                <View style={[styles.salaryBarFill, { width: '25%', backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.salaryValue}>25%</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReportsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Reports</Text>
      
      <View style={styles.reportsGrid}>
        <TouchableOpacity 
          style={styles.reportCard}
          onPress={async () => {
            try {
              const report = await generateStaffReport();

              // You can navigate to a detailed report screen here
            } catch (error) {
              
            }
          }}
        >
          <MaterialIcons name="assessment" size={32} color="#3B82F6" />
          <Text style={styles.reportTitle}>Staff Report</Text>
          <Text style={styles.reportDescription}>Comprehensive staff analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.reportCard}
          onPress={async () => {
            try {
              const deptStats = await getStaffCountByDepartment();

              // You can navigate to a department report screen here
            } catch (error) {
              
            }
          }}
        >
          <MaterialIcons name="trending-up" size={32} color="#10B981" />
          <Text style={styles.reportTitle}>Department Report</Text>
          <Text style={styles.reportDescription}>Department-wise analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.reportCard}
          onPress={async () => {
            try {
              const designationStats = await getStaffCountByDesignation();

              // You can navigate to a designation report screen here
            } catch (error) {
              
            }
          }}
        >
          <MaterialIcons name="account-balance" size={32} color="#F59E0B" />
          <Text style={styles.reportTitle}>Designation Report</Text>
          <Text style={styles.reportDescription}>Role-wise staff analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.reportCard}
          onPress={async () => {
            try {
              const stats = await getStaffStats(1);

              // You can navigate to a statistics screen here
            } catch (error) {
              
            }
          }}
        >
          <MaterialIcons name="schedule" size={32} color="#8B5CF6" />
          <Text style={styles.reportTitle}>Statistics Report</Text>
          <Text style={styles.reportDescription}>Detailed statistics overview</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Dashboard</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

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
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            Reports
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !dashboard ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'overview' && (
            <>
              {renderOverviewSection()}
              {renderDepartmentStats()}
              {renderAttendanceToday()}
              {renderRecentActivity()}
              {renderUpcomingEvents()}
            </>
          )}

          {activeTab === 'analytics' && (
            <>
              {renderAnalyticsSection()}
            </>
          )}

          {activeTab === 'reports' && (
            <>
              {renderReportsSection()}
            </>
          )}
        </ScrollView>
      )}

      {showCharts && (
        <StaffCharts
          analytics={{
            attendance: {
              daily: [],
              weekly: [],
              monthly: [],
            },
            payroll: {
              monthly: [],
              trends: [],
            },
            performance: {
              documents: [],
              bookIssues: [],
              overallScore: 0,
              grade: '',
              recommendations: [],
            },
          }}
          performance={{
            attendance: { currentMonth: 0, lastMonth: 0, trend: 0 },
            payroll: { totalEarnings: 0, averageSalary: 0, paymentCompliance: 0 },
            documents: { totalUploaded: 0, recentUploads: 0 },
            bookIssues: { totalIssued: 0, overdueBooks: 0, returnRate: 0 },
            experience: { yearsOfService: 0, department: '', designation: '' },
          }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerButton: {
    padding: 4,
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
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginRight: 4,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    width: (width - 48) / 2 - 8,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  overviewGradient: {
    padding: 16,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  departmentList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  departmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  departmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  departmentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  departmentDetails: {
    flex: 1,
  },
  departmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  departmentCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  departmentStats: {
    alignItems: 'flex-end',
  },
  departmentSalary: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  departmentBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  departmentBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  activityName: {
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  eventsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  eventName: {
    fontSize: 12,
    color: '#6B7280',
  },
  eventDate: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  attendanceContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  analyticsContent: {
    flex: 1,
  },
  genderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  genderIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  genderLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  genderValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  salaryItem: {
    marginBottom: 8,
  },
  salaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  salaryBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  salaryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  salaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  reportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reportCard: {
    width: (width - 48) / 2 - 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  reportDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    marginLeft: 12,
  },
  retryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default StaffDashboardScreen; 
