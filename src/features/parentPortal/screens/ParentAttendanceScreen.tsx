import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../theme';
import { Card, CardContent } from '../../../components/ui/cards/Card';
import { Button } from '../../../components/ui/buttons/Button';
import { Icon } from '../../../components/ui/Icon';
import { LoadingSpinner } from '../../../components/ui/loaders/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useParentData } from '../hooks/useParentData';
import { LineChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  subject?: string;
  period?: string;
  remarks?: string;
}

interface AttendanceSummary {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
  currentStreak: number;
  longestStreak: number;
}

interface MonthlyData {
  month: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

const ParentAttendanceScreen: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester'>('month');
  
  const { getParentChildren, getStudentAttendance } = useParentData();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadAttendanceData();
    }
  }, [selectedStudent, selectedPeriod]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await getParentChildren();
      if (studentsData.success) {
        setStudents(studentsData.data);
        if (studentsData.data.length > 0) {
          setSelectedStudent(studentsData.data[0].id);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load students data');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    if (!selectedStudent) return;
    
    try {
      const attendanceData = await getStudentAttendance(selectedStudent, selectedPeriod);
      if (attendanceData.success) {
        setAttendanceRecords(attendanceData.data.records);
        setAttendanceSummary(attendanceData.data.summary);
        setMonthlyData(attendanceData.data.monthlyData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load attendance data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    if (selectedStudent) {
      await loadAttendanceData();
    }
    setRefreshing(false);
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
  };

  const handlePeriodChange = (period: 'week' | 'month' | 'semester') => {
    setSelectedPeriod(period);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return theme.colors.success;
      case 'absent':
        return theme.colors.error;
      case 'late':
        return theme.colors.warning;
      case 'excused':
        return theme.colors.info;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return 'check-circle';
      case 'absent':
        return 'x-circle';
      case 'late':
        return 'clock';
      case 'excused':
        return 'help-circle';
      default:
        return 'minus-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon="school-outline"
        title="No Students Found"
        message="Contact the school administration to link your account with your children."
      />
    );
  }

  const currentStudent = students.find(s => s.id === selectedStudent);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSubtitle}>
          Monitor your children's attendance and patterns
        </Text>
      </View>

      {/* Student Selector */}
      {students.length > 1 && (
        <View style={styles.studentSelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorContent}
          >
            {students.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={[
                  styles.studentOption,
                  selectedStudent === student.id && styles.studentOptionSelected
                ]}
                onPress={() => handleStudentSelect(student.id)}
              >
                <Text style={[
                  styles.studentOptionText,
                  selectedStudent === student.id && styles.studentOptionTextSelected
                ]}>
                  {student.firstName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {currentStudent && (
        <View style={styles.content}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'week' && styles.periodButtonActive
              ]}
              onPress={() => handlePeriodChange('week')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'week' && styles.periodButtonTextActive
              ]}>
                Week
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' && styles.periodButtonActive
              ]}
              onPress={() => handlePeriodChange('month')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'month' && styles.periodButtonTextActive
              ]}>
                Month
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'semester' && styles.periodButtonActive
              ]}
              onPress={() => handlePeriodChange('semester')}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === 'semester' && styles.periodButtonTextActive
              ]}>
                Semester
              </Text>
            </TouchableOpacity>
          </View>

          {/* Attendance Summary */}
          {attendanceSummary && (
            <Card style={styles.summaryCard}>
              <CardContent>
                <Text style={styles.cardTitle}>Attendance Summary</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>{attendanceSummary.attendancePercentage}%</Text>
                    <Text style={styles.summaryLabel}>Overall</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>{attendanceSummary.presentDays}</Text>
                    <Text style={styles.summaryLabel}>Present</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>{attendanceSummary.absentDays}</Text>
                    <Text style={styles.summaryLabel}>Absent</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryNumber}>{attendanceSummary.currentStreak}</Text>
                    <Text style={styles.summaryLabel}>Current Streak</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}

          {/* Attendance Chart */}
          {monthlyData.length > 0 && (
            <Card style={styles.chartCard}>
              <CardContent>
                <Text style={styles.cardTitle}>Monthly Attendance Trend</Text>
                <BarChart
                  data={{
                    labels: monthlyData.map(d => d.month),
                    datasets: [
                      {
                        data: monthlyData.map(d => d.present),
                        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={width - 80}
                  height={220}
                  chartConfig={{
                    backgroundColor: theme.colors.white,
                    backgroundGradientFrom: theme.colors.white,
                    backgroundGradientTo: theme.colors.white,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    barPercentage: 0.7,
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Recent Attendance Records */}
          <Card style={styles.recordsCard}>
            <CardContent>
              <Text style={styles.cardTitle}>Recent Attendance</Text>
              {attendanceRecords.length === 0 ? (
                <Text style={styles.noRecordsText}>No attendance records found for this period.</Text>
              ) : (
                attendanceRecords.map((record) => (
                  <View key={record.id} style={styles.recordItem}>
                    <View style={styles.recordLeft}>
                      <Icon
                        name={getStatusIcon(record.status)}
                        size={20}
                        color={getStatusColor(record.status)}
                      />
                      <View style={styles.recordInfo}>
                        <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                        {record.subject && (
                          <Text style={styles.recordSubject}>{record.subject}</Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.recordRight}>
                      <Text style={[
                        styles.recordStatus,
                        { color: getStatusColor(record.status) }
                      ]}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Text>
                      {record.remarks && (
                        <Text style={styles.recordRemarks}>{record.remarks}</Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </CardContent>
          </Card>

          {/* Attendance Insights */}
          <Card style={styles.insightsCard}>
            <CardContent>
              <Text style={styles.cardTitle}>Insights</Text>
              <View style={styles.insightItem}>
                <Icon name="trending-up" size={20} color={theme.colors.success} />
                <Text style={styles.insightText}>
                  {attendanceSummary?.attendancePercentage >= 90 
                    ? 'Excellent attendance! Keep up the good work.'
                    : attendanceSummary?.attendancePercentage >= 80
                    ? 'Good attendance. Room for improvement.'
                    : 'Attendance needs attention. Consider discussing with your child.'
                  }
                </Text>
              </View>
              
              {attendanceSummary && attendanceSummary.currentStreak > 0 && (
                <View style={styles.insightItem}>
                  <Icon name="fire" size={20} color={theme.colors.warning} />
                  <Text style={styles.insightText}>
                    Current streak: {attendanceSummary.currentStreak} days
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
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
    opacity: 0.9,
  },
  studentSelector: {
    backgroundColor: theme.colors.white,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectorContent: {
    paddingHorizontal: 20,
  },
  studentOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: theme.colors.background,
  },
  studentOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  studentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  studentOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  periodButtonTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: 20,
  },
  recordsCard: {
    marginBottom: 20,
  },
  noRecordsText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordInfo: {
    marginLeft: 12,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  recordSubject: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordRemarks: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  insightsCard: {
    marginBottom: 20,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
  },
});

export default ParentAttendanceScreen; 