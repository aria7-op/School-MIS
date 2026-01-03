import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

interface ReportData {
  id: string;
  title: string;
  type: 'academic' | 'attendance' | 'behavior' | 'financial';
  date: string;
  summary: string;
  details: any;
  studentId?: string;
}

const ParentReportsScreen: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics'>('reports');

  // Mock data for reports
  const mockReports: ReportData[] = [
    {
      id: '1',
      title: 'Academic Progress Report',
      type: 'academic',
      date: '2024-01-15',
      summary: 'Excellent progress in Mathematics and Science',
      details: {
        subjects: ['Mathematics', 'Science', 'English', 'History'],
        grades: [85, 92, 78, 88],
        attendance: 95,
        behavior: 'Excellent'
      },
      studentId: 'student1'
    },
    {
      id: '2',
      title: 'Attendance Summary',
      type: 'attendance',
      date: '2024-01-10',
      summary: '95% attendance rate for the month',
      details: {
        totalDays: 20,
        presentDays: 19,
        absentDays: 1,
        lateDays: 0
      },
      studentId: 'student1'
    },
    {
      id: '3',
      title: 'Behavior Assessment',
      type: 'behavior',
      date: '2024-01-08',
      summary: 'Positive behavior with room for improvement in focus',
      details: {
        cooperation: 'Excellent',
        respect: 'Good',
        focus: 'Needs Improvement',
        responsibility: 'Excellent'
      },
      studentId: 'student1'
    },
    {
      id: '4',
      title: 'Financial Statement',
      type: 'financial',
      date: '2024-01-05',
      summary: 'All fees paid up to date',
      details: {
        totalFees: 5000,
        paidFees: 5000,
        outstandingFees: 0,
        nextDueDate: '2024-02-01'
      },
      studentId: 'student1'
    }
  ];

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await apiService.getParentReports(user?.id);
      // setReports(response.data);
      
      // For now, use mock data
      setReports(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'academic':
        return 'school';
      case 'attendance':
        return 'calendar';
      case 'behavior':
        return 'happy';
      case 'financial':
        return 'card';
      default:
        return 'document';
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'academic':
        return '#3498db';
      case 'attendance':
        return '#2ecc71';
      case 'behavior':
        return '#f39c12';
      case 'financial':
        return '#9b59b6';
      default:
        return '#95a5a6';
    }
  };

  const renderReportItem = (report: ReportData) => (
    <TouchableOpacity
      key={report.id}
      style={[styles.reportItem, { borderLeftColor: getReportTypeColor(report.type) }]}
      onPress={() => setSelectedReport(report)}
    >
      <View style={styles.reportHeader}>
        <Ionicons
          name={getReportTypeIcon(report.type) as any}
          size={24}
          color={getReportTypeColor(report.type)}
        />
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportDate}>{new Date(report.date).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.reportTypeBadge, { backgroundColor: getReportTypeColor(report.type) }]}>
          <Text style={styles.reportTypeText}>{report.type.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.reportSummary}>{report.summary}</Text>
    </TouchableOpacity>
  );

  const renderReportDetails = (report: ReportData) => {
    switch (report.type) {
      case 'academic':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Academic Performance</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: report.details.subjects,
                  datasets: [{
                    data: report.details.grades
                  }]
                }}
                width={Dimensions.get('window').width - 60}
                height={200}
                yAxisSuffix="%"
                chartConfig={{
                  backgroundColor: theme.colors.white,
                  backgroundGradientFrom: theme.colors.white,
                  backgroundGradientTo: theme.colors.white,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  }
                }}
                style={styles.chart}
              />
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Attendance</Text>
                <Text style={styles.statValue}>{report.details.attendance}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Behavior</Text>
                <Text style={styles.statValue}>{report.details.behavior}</Text>
              </View>
            </View>
          </View>
        );
      
      case 'attendance':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Attendance Details</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Days</Text>
                <Text style={styles.statValue}>{report.details.totalDays}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Present</Text>
                <Text style={styles.statValue}>{report.details.presentDays}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Absent</Text>
                <Text style={styles.statValue}>{report.details.absentDays}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Late</Text>
                <Text style={styles.statValue}>{report.details.lateDays}</Text>
              </View>
            </View>
          </View>
        );
      
      case 'behavior':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Behavior Assessment</Text>
            <View style={styles.behaviorContainer}>
              {Object.entries(report.details).map(([key, value]) => (
                <View key={key} style={styles.behaviorItem}>
                  <Text style={styles.behaviorLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text style={[styles.behaviorValue, { color: value === 'Excellent' ? '#2ecc71' : value === 'Good' ? '#f39c12' : '#e74c3c' }]}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      
      case 'financial':
        return (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Financial Summary</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Fees</Text>
                <Text style={styles.statValue}>${report.details.totalFees}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Paid</Text>
                <Text style={styles.statValue}>${report.details.paidFees}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Outstanding</Text>
                <Text style={styles.statValue}>${report.details.outstandingFees}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Next Due</Text>
                <Text style={styles.statValue}>{new Date(report.details.nextDueDate).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <Text style={styles.headerSubtitle}>View detailed reports about your child's progress</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            Reports
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
      </View>

      {activeTab === 'reports' ? (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {reports.map(renderReportItem)}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.analyticsContainer}>
            <Text style={styles.analyticsTitle}>Academic Performance Overview</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    data: [85, 88, 92, 87, 90, 93]
                  }]
                }}
                width={Dimensions.get('window').width - 60}
                height={200}
                yAxisSuffix="%"
                chartConfig={{
                  backgroundColor: theme.colors.white,
                  backgroundGradientFrom: theme.colors.white,
                  backgroundGradientTo: theme.colors.white,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  }
                }}
                style={styles.chart}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {selectedReport && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedReport.title}</Text>
              <TouchableOpacity
                onPress={() => setSelectedReport(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {renderReportDetails(selectedReport)}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.gray,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  reportItem: {
    backgroundColor: theme.colors.white,
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportInfo: {
    flex: 1,
    marginLeft: 15,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  reportDate: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  reportTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportTypeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportSummary: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  analyticsContainer: {
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: theme.colors.background,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.gray,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  behaviorContainer: {
    backgroundColor: theme.colors.background,
    padding: 15,
    borderRadius: 8,
  },
  behaviorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
  },
  behaviorLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  behaviorValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ParentReportsScreen; 