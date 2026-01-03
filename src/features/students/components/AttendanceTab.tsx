import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Switch,
  FlatList,
  Calendar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, PieChart, BarChart, ProgressChart, ContributionGraph } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';

const { width } = Dimensions.get('window');

interface AttendanceTabProps {
  data: any;
  loading: boolean;
  error: string | null;
  chartConfig: any;
  renderChartCard: (title: string, children: React.ReactNode) => React.ReactNode;
  realDataLoading?: boolean;
  realDataError?: string | null;
  onRefreshData?: () => Promise<void>;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({
  data,
  loading,
  error,
  chartConfig,
  renderChartCard,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (loading) return <Text>Loading attendance...</Text>;
  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;
  if (!data) return <Text>No attendance data available.</Text>;

  // Advanced Attendance State
  const [attendanceView, setAttendanceView] = useState<'overview' | 'detailed' | 'patterns' | 'alerts'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [realTimeTracking, setRealTimeTracking] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [attendanceFilters, setAttendanceFilters] = useState({
    attendanceRate: 'all',
    tardiness: 'all',
    absenceType: 'all',
    riskLevel: 'all',
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Advanced Attendance Data
  const attendanceOverview = {
    totalStudents: 250,
    presentToday: 238,
    absentToday: 12,
    tardyToday: 15,
    averageRate: 95.2,
    weeklyTrend: 2.3,
    monthlyTrend: 1.8,
  };

  const attendancePatterns = [
    { day: 'Monday', present: 235, absent: 15, tardy: 18, rate: 94.0 },
    { day: 'Tuesday', present: 240, absent: 10, tardy: 12, rate: 96.0 },
    { day: 'Wednesday', present: 238, absent: 12, tardy: 14, rate: 95.2 },
    { day: 'Thursday', present: 232, absent: 18, tardy: 20, rate: 92.8 },
    { day: 'Friday', present: 228, absent: 22, tardy: 25, rate: 91.2 },
  ];

  const monthlyAttendance = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    present: [238, 241, 235, 239, 242, 238, 240, 237, 241, 239, 236, 240],
    absent: [12, 9, 15, 11, 8, 12, 10, 13, 9, 11, 14, 10],
    tardy: [15, 12, 18, 14, 11, 16, 13, 17, 12, 15, 19, 13],
  };

  const absenceReasons = [
    { reason: 'Illness', count: 45, percentage: 38.5, color: '#ef4444' },
    { reason: 'Family Emergency', count: 28, percentage: 23.9, color: '#f59e0b' },
    { reason: 'Medical Appointment', count: 22, percentage: 18.8, color: '#3b82f6' },
    { reason: 'Personal/Family', count: 15, percentage: 12.8, color: '#8b5cf6' },
    { reason: 'Other', count: 7, percentage: 6.0, color: '#6b7280' },
  ];

  const attendanceAlerts = [
    {
      id: 1,
      student: 'John Doe',
      type: 'chronic_absence',
      message: 'Absent for 3 consecutive days',
      severity: 'high',
      date: '2024-01-15',
      action: 'parent_contact',
    },
    {
      id: 2,
      student: 'Jane Smith',
      type: 'tardiness_pattern',
      message: 'Late 4 times this week',
      severity: 'medium',
      date: '2024-01-14',
      action: 'counselor_meeting',
    },
    {
      id: 3,
      student: 'Mike Johnson',
      type: 'attendance_drop',
      message: 'Attendance rate dropped below 85%',
      severity: 'high',
      date: '2024-01-13',
      action: 'intervention_plan',
    },
  ];

  const classAttendanceComparison = [
    { class: 'Grade 10A', rate: 96.2, present: 28, absent: 1, tardy: 2 },
    { class: 'Grade 10B', rate: 94.8, present: 26, absent: 2, tardy: 3 },
    { class: 'Grade 9A', rate: 95.5, present: 29, absent: 1, tardy: 2 },
    { class: 'Grade 9B', rate: 93.1, present: 27, absent: 2, tardy: 4 },
    { class: 'Grade 8A', rate: 97.1, present: 31, absent: 1, tardy: 1 },
  ];

  const attendancePredictions = [
    { student: 'Alice Johnson', currentRate: 92.5, predictedRate: 89.2, riskLevel: 'medium', confidence: 78.5 },
    { student: 'Bob Smith', currentRate: 88.1, predictedRate: 85.3, riskLevel: 'high', confidence: 82.1 },
    { student: 'Charlie Brown', currentRate: 96.8, predictedRate: 95.2, riskLevel: 'low', confidence: 91.3 },
    { student: 'Diana Prince', currentRate: 94.2, predictedRate: 92.8, riskLevel: 'low', confidence: 86.7 },
  ];

  const tardinessTrends = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [{
      data: [12, 15, 18, 14, 16, 13],
      color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
      strokeWidth: 3,
    }],
  };

  const attendanceHeatmapData = [
    { date: '2024-01-01', count: 4 },
    { date: '2024-01-02', count: 2 },
    { date: '2024-01-03', count: 1 },
    { date: '2024-01-04', count: 3 },
    { date: '2024-01-05', count: 5 },
    // More data...
  ];

  // Advanced Functions
  const handleMarkAttendance = (studentId: string, status: 'present' | 'absent' | 'tardy') => {
    Alert.alert(
      'Attendance Marked',
      `Student marked as ${status}`,
      [
        { text: 'Undo', onPress: () => {
          // TODO: Implement undo functionality
          console.log('Undo attendance mark');
        }},
        { text: 'OK', onPress: () => {
          // TODO: Implement OK functionality
          console.log('OK button pressed');
        }},
      ]
    );
  };

  const handleSendAlert = (alertId: number) => {
    Alert.alert(
      'Send Alert',
      'Send notification to parents and counselors?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => Alert.alert('Alert Sent', 'Notification sent successfully') },
      ]
    );
  };

  const generateAttendanceReport = (type: string) => {
    Alert.alert('Report Generated', `${type} report is being generated and will be available shortly.`);
  };

  // Render Functions
  const renderAttendanceOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.overviewGrid}>
        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <MaterialIcons name="school" size={32} color="#3b82f6" />
          <Text style={[styles.overviewValue, { color: colors.text }]}>{data.overview?.totalStudents}</Text>
          <Text style={[styles.overviewLabel, { color: colors.text + '80' }]}>Total Students</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <MaterialIcons name="check-circle" size={32} color="#10b981" />
          <Text style={[styles.overviewValue, { color: colors.text }]}>{data.overview?.presentToday}</Text>
          <Text style={[styles.overviewLabel, { color: colors.text + '80' }]}>Present Today</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <MaterialIcons name="cancel" size={32} color="#ef4444" />
          <Text style={[styles.overviewValue, { color: colors.text }]}>{data.overview?.absentToday}</Text>
          <Text style={[styles.overviewLabel, { color: colors.text + '80' }]}>Absent Today</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <MaterialIcons name="schedule" size={32} color="#f59e0b" />
          <Text style={[styles.overviewValue, { color: colors.text }]}>{data.overview?.tardyToday}</Text>
          <Text style={[styles.overviewLabel, { color: colors.text + '80' }]}>Tardy Today</Text>
        </View>
      </View>

      <View style={[styles.rateCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.rateTitle, { color: colors.text }]}>Overall Attendance Rate</Text>
        <Text style={[styles.rateValue, { color: '#10b981' }]}>{data.overview?.averageRate}%</Text>
        <View style={styles.trendContainer}>
          <MaterialIcons name="trending-up" size={20} color="#10b981" />
          <Text style={[styles.trendText, { color: '#10b981' }]}>+{data.overview?.weeklyTrend}% this week</Text>
        </View>
      </View>
    </View>
  );

  const renderWeeklyPatterns = () => (
    <View style={[styles.patternsContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Attendance Patterns</Text>
      {data.patterns.map((pattern: any, index: number) => (
        <TouchableOpacity
          key={index}
          style={styles.patternItem}
          onPress={() => Alert.alert('Day Details', `Detailed attendance for ${pattern.day}`)}
        >
          <Text style={[styles.patternDay, { color: colors.text }]}>{pattern.day}</Text>
          <View style={styles.patternMetrics}>
            <View style={styles.patternMetric}>
              <MaterialIcons name="check-circle" size={16} color="#10b981" />
              <Text style={[styles.patternValue, { color: '#10b981' }]}>{pattern.present}</Text>
            </View>
            <View style={styles.patternMetric}>
              <MaterialIcons name="cancel" size={16} color="#ef4444" />
              <Text style={[styles.patternValue, { color: '#ef4444' }]}>{pattern.absent}</Text>
            </View>
            <View style={styles.patternMetric}>
              <MaterialIcons name="schedule" size={16} color="#f59e0b" />
              <Text style={[styles.patternValue, { color: '#f59e0b' }]}>{pattern.tardy}</Text>
            </View>
          </View>
          <Text style={[styles.patternRate, { color: colors.text }]}>{pattern.rate}%</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAttendanceAlerts = () => (
    <View style={[styles.alertsContainer, { backgroundColor: colors.card }]}>
      <View style={styles.alertsHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance Alerts</Text>
        <Switch
          value={alertsEnabled}
          onValueChange={setAlertsEnabled}
          trackColor={{ false: colors.border, true: colors.primary + '40' }}
          thumbColor={alertsEnabled ? colors.primary : '#f4f3f4'}
        />
      </View>
      
      {data.alerts.map((alert: any) => (
        <View
          key={alert.id}
          style={[
            styles.alertItem,
            {
              backgroundColor: alert.severity === 'high' ? '#ef444420' : '#f59e0b20',
              borderLeftColor: alert.severity === 'high' ? '#ef4444' : '#f59e0b',
            }
          ]}
        >
          <View style={styles.alertContent}>
            <Text style={[styles.alertStudent, { color: colors.text }]}>{alert.student}</Text>
            <Text style={[styles.alertMessage, { color: colors.text + '80' }]}>{alert.message}</Text>
            <Text style={[styles.alertDate, { color: colors.text + '60' }]}>{alert.date}</Text>
          </View>
          <TouchableOpacity
            style={[styles.alertAction, { backgroundColor: colors.primary }]}
            onPress={() => handleSendAlert(alert.id)}
          >
            <MaterialIcons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderClassComparison = () => (
    <View style={[styles.comparisonContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Class Attendance Comparison</Text>
      {data.classComparison.map((classData: any, index: number) => (
        <TouchableOpacity
          key={index}
          style={styles.classItem}
          onPress={() => Alert.alert('Class Details', `Detailed attendance for ${classData.class}`)}
        >
          <View style={styles.classLeft}>
            <Text style={[styles.className, { color: colors.text }]}>{classData.class}</Text>
            <View style={styles.classMetrics}>
              <Text style={[styles.classMetric, { color: '#10b981' }]}>P: {classData.present}</Text>
              <Text style={[styles.classMetric, { color: '#ef4444' }]}>A: {classData.absent}</Text>
              <Text style={[styles.classMetric, { color: '#f59e0b' }]}>T: {classData.tardy}</Text>
            </View>
          </View>
          <View style={styles.classRight}>
            <Text style={[styles.classRate, { color: '#10b981' }]}>{classData.rate}%</Text>
            <View style={styles.rateBar}>
              <View
                style={[
                  styles.rateFill,
                  {
                    width: `${classData.rate}%`,
                    backgroundColor: classData.rate > 95 ? '#10b981' : classData.rate > 90 ? '#f59e0b' : '#ef4444',
                  }
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPredictiveAnalysis = () => (
    <View style={[styles.predictiveContainer, { backgroundColor: colors.card }]}>
      <View style={styles.predictiveHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance Risk Prediction</Text>
        <MaterialIcons name="auto-awesome" size={24} color="#f59e0b" />
      </View>
      
      {data.predictions.map((prediction: any, index: number) => (
        <View key={index} style={styles.predictionItem}>
          <View style={styles.predictionLeft}>
            <Text style={[styles.predictionStudent, { color: colors.text }]}>{prediction.student}</Text>
            <View style={styles.predictionRates}>
              <Text style={[styles.predictionRate, { color: colors.text }]}>
                Current: {prediction.currentRate}%
              </Text>
              <Text style={[styles.predictionRate, { color: '#f59e0b' }]}>
                Predicted: {prediction.predictedRate}%
              </Text>
            </View>
          </View>
          <View style={styles.predictionRight}>
            <View style={[
              styles.riskBadge,
              {
                backgroundColor: prediction.riskLevel === 'low' ? '#10b981' :
                                prediction.riskLevel === 'medium' ? '#f59e0b' : '#ef4444'
              }
            ]}>
              <Text style={styles.riskText}>{prediction.riskLevel.toUpperCase()}</Text>
            </View>
            <Text style={[styles.confidenceText, { color: colors.text + '60' }]}>
              {prediction.confidence}% confidence
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderQuickActions = () => (
    <View style={[styles.quickActionsContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3b82f6' + '20' }]}
          onPress={() => Alert.alert('Mark Attendance', 'Opening attendance marking interface...')}
        >
          <MaterialIcons name="how-to-reg" size={32} color="#3b82f6" />
          <Text style={[styles.actionText, { color: '#3b82f6' }]}>Mark Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#10b981' + '20' }]}
          onPress={() => generateAttendanceReport('Daily')}
        >
          <MaterialIcons name="assessment" size={32} color="#10b981" />
          <Text style={[styles.actionText, { color: '#10b981' }]}>Daily Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#f59e0b' + '20' }]}
          onPress={() => Alert.alert('Send Notifications', 'Sending absence notifications to parents...')}
        >
          <MaterialIcons name="notifications" size={32} color="#f59e0b" />
          <Text style={[styles.actionText, { color: '#f59e0b' }]}>Send Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#8b5cf6' + '20' }]}
          onPress={() => setShowCalendar(true)}
        >
          <MaterialIcons name="calendar-today" size={32} color="#8b5cf6" />
          <Text style={[styles.actionText, { color: '#8b5cf6' }]}>View Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Advanced Attendance Header */}
      <View style={[styles.attendanceHeader, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Attendance Management Center</Text>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowExportModal(true)}
          >
            <MaterialIcons name="file-download" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* View Mode Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewModeScroll}>
          {['overview', 'detailed', 'patterns', 'alerts'].map(view => (
            <TouchableOpacity
              key={view}
              style={[
                styles.viewModeButton,
                attendanceView === view && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => setAttendanceView(view as any)}
            >
              <Text style={[
                styles.viewModeText,
                { color: attendanceView === view ? colors.primary : colors.text }
              ]}>
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Advanced Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, realTimeTracking && { backgroundColor: '#10b981' + '20' }]}
            onPress={() => setRealTimeTracking(!realTimeTracking)}
          >
            <MaterialIcons
              name="update"
              size={20}
              color={realTimeTracking ? '#10b981' : colors.text + '60'}
            />
            <Text style={[
              styles.controlButtonText,
              { color: realTimeTracking ? '#10b981' : colors.text + '60' }
            ]}>
              Live Tracking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, showPredictions && { backgroundColor: colors.primary + '20' }]}
            onPress={() => setShowPredictions(!showPredictions)}
          >
            <MaterialIcons
              name="auto-awesome"
              size={20}
              color={showPredictions ? colors.primary : colors.text + '60'}
            />
            <Text style={[
              styles.controlButtonText,
              { color: showPredictions ? colors.primary : colors.text + '60' }
            ]}>
              Predictions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, showCalendar && { backgroundColor: '#8b5cf6' + '20' }]}
            onPress={() => setShowCalendar(!showCalendar)}
          >
            <MaterialIcons
              name="calendar-today"
              size={20}
              color={showCalendar ? '#8b5cf6' : colors.text + '60'}
            />
            <Text style={[
              styles.controlButtonText,
              { color: showCalendar ? '#8b5cf6' : colors.text + '60' }
            ]}>
              Calendar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Attendance Overview */}
      {renderAttendanceOverview()}

      {/* Weekly Patterns */}
      {renderWeeklyPatterns()}

      {/* Monthly Trends Chart */}
      {renderChartCard(
        'Monthly Attendance Trends',
        <LineChart
          data={{
            labels: data.monthly.labels,
            datasets: [
              {
                data: data.monthly.present,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                strokeWidth: 3,
              },
              {
                data: data.monthly.absent.map(val => 250 - val), // Invert for better visualization
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          }}
          width={width - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          withShadow
        />
      )}

      {/* Absence Reasons */}
      {renderChartCard(
        'Absence Reasons Distribution',
        <PieChart
          data={data.absenceReasons.map((reason: any) => ({
            name: reason.reason,
            population: reason.count,
            color: reason.color,
            legendFontColor: colors.text,
            legendFontSize: 12,
          }))}
          width={width - 64}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      )}

      {/* Tardiness Trends */}
      {renderChartCard(
        'Tardiness Trends',
        <LineChart
          data={tardinessTrends}
          width={width - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          withShadow
        />
      )}

      {/* Class Comparison */}
      {renderClassComparison()}

      {/* Attendance Alerts */}
      {renderAttendanceAlerts()}

      {/* Predictive Analysis */}
      {showPredictions && renderPredictiveAnalysis()}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Export Attendance Data</Text>
            
            <View style={styles.exportOptions}>
              {['Daily Report', 'Weekly Summary', 'Monthly Analysis', 'Student Records', 'Parent Notifications'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.exportOption, { backgroundColor: colors.background }]}
                  onPress={() => {
                    generateAttendanceReport(option);
                    setShowExportModal(false);
                  }}
                >
                  <MaterialIcons name="file-download" size={24} color={colors.primary} />
                  <Text style={[styles.exportOptionText, { color: colors.text }]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  attendanceHeader: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  exportButton: {
    padding: 8,
    borderRadius: 8,
  },
  viewModeScroll: {
    marginBottom: 16,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  overviewContainer: {
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  overviewCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  rateCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  rateValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  patternsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  patternDay: {
    fontSize: 14,
    fontWeight: '600',
    width: 80,
  },
  patternMetrics: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  patternMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternValue: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  patternRate: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 50,
    textAlign: 'right',
  },
  alertsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  alertContent: {
    flex: 1,
  },
  alertStudent: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    marginBottom: 2,
  },
  alertDate: {
    fontSize: 10,
  },
  alertAction: {
    padding: 8,
    borderRadius: 6,
  },
  comparisonContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  classLeft: {
    flex: 1,
  },
  className: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  classMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  classMetric: {
    fontSize: 12,
    fontWeight: '600',
  },
  classRight: {
    alignItems: 'flex-end',
    width: 80,
  },
  classRate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rateBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  rateFill: {
    height: '100%',
    borderRadius: 3,
  },
  predictiveContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  predictiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  predictionLeft: {
    flex: 1,
  },
  predictionStudent: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  predictionRates: {
    flexDirection: 'row',
    gap: 16,
  },
  predictionRate: {
    fontSize: 12,
    fontWeight: '600',
  },
  predictionRight: {
    alignItems: 'flex-end',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  riskText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  confidenceText: {
    fontSize: 10,
  },
  quickActionsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '47%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  exportOptions: {
    gap: 12,
    marginBottom: 20,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  exportOptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttendanceTab; 
