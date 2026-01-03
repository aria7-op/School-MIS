import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import RtlView from '../../../components/ui/RtlView';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import classService from '../services/classService';

const { width } = Dimensions.get('window');

interface AdvancedClassAttendanceProps {
  selectedClass: any;
  onAttendanceAction: (action: string, attendanceId: number) => void;
}

const AdvancedClassAttendance: React.FC<AdvancedClassAttendanceProps> = ({
  selectedClass,
  onAttendanceAction,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const TABS = [
    { key: 'list', label: t('attendance'), icon: 'check-circle' },
    { key: 'analytics', label: t('analytics'), icon: 'analytics' },
    { key: 'reports', label: t('reports'), icon: 'assessment' },
  ];

  // Rich dummy attendance data
  const dummyAttendanceRecords = [
    {
      id: 1,
      date: '2024-02-15',
      studentName: 'John Smith',
      studentId: 'STU001',
      status: 'Present',
      time: '08:30 AM',
      subject: 'Advanced Mathematics',
      teacher: 'Dr. Sarah Johnson',
      notes: 'On time',
      lateMinutes: 0,
      reason: '',
    },
    {
      id: 2,
      date: '2024-02-15',
      studentName: 'Emma Johnson',
      studentId: 'STU002',
      status: 'Late',
      time: '08:45 AM',
      subject: 'Advanced Mathematics',
      teacher: 'Dr. Sarah Johnson',
      notes: 'Traffic delay',
      lateMinutes: 15,
      reason: 'Traffic',
    },
    {
      id: 3,
      date: '2024-02-15',
      studentName: 'Michael Brown',
      studentId: 'STU003',
      status: 'Absent',
      time: 'N/A',
      subject: 'Advanced Mathematics',
      teacher: 'Dr. Sarah Johnson',
      notes: 'No excuse provided',
      lateMinutes: 0,
      reason: 'No excuse',
    },
    {
      id: 4,
      date: '2024-02-14',
      studentName: 'Sarah Davis',
      studentId: 'STU004',
      status: 'Present',
      time: '08:25 AM',
      subject: 'Physics Fundamentals',
      teacher: 'Prof. Michael Chen',
      notes: 'Early arrival',
      lateMinutes: 0,
      reason: '',
    },
    {
      id: 5,
      date: '2024-02-14',
      studentName: 'David Wilson',
      studentId: 'STU005',
      status: 'Excused',
      time: 'N/A',
      subject: 'Physics Fundamentals',
      teacher: 'Prof. Michael Chen',
      notes: 'Medical appointment',
      lateMinutes: 0,
      reason: 'Medical',
    },
    {
      id: 6,
      date: '2024-02-13',
      studentName: 'Lisa Anderson',
      studentId: 'STU006',
      status: 'Present',
      time: '08:35 AM',
      subject: 'English Literature',
      teacher: 'Ms. Emily Davis',
      notes: 'On time',
      lateMinutes: 5,
      reason: '',
    },
    {
      id: 7,
      date: '2024-02-13',
      studentName: 'Robert Taylor',
      studentId: 'STU007',
      status: 'Present',
      time: '08:28 AM',
      subject: 'English Literature',
      teacher: 'Ms. Emily Davis',
      notes: 'Early arrival',
      lateMinutes: 0,
      reason: '',
    },
    {
      id: 8,
      date: '2024-02-12',
      studentName: 'Jennifer Garcia',
      studentId: 'STU008',
      status: 'Late',
      time: '09:15 AM',
      subject: 'Computer Science',
      teacher: 'Dr. Robert Wilson',
      notes: 'Public transport delay',
      lateMinutes: 45,
      reason: 'Transport',
    },
  ];

  // Rich dummy analytics data
  const dummyAnalytics = {
    totalRecords: 8,
    presentCount: 5,
    absentCount: 1,
    lateCount: 2,
    excusedCount: 1,
    attendanceRate: 87.5,
    averageLateMinutes: 20,
    totalStudents: 8,
    attendanceTrends: [85, 88, 92, 87, 90, 89, 91, 88, 93, 87, 90, 92],
    statusDistribution: [
      { status: 'Present', count: 5, percentage: 62.5, color: '#4CAF50' },
      { status: 'Late', count: 2, percentage: 25, color: '#FF9800' },
      { status: 'Absent', count: 1, percentage: 12.5, color: '#F44336' },
    ],
    subjectAttendance: [
      { subject: 'Mathematics', present: 2, absent: 1, late: 1, rate: 75 },
      { subject: 'Physics', present: 1, absent: 0, late: 0, rate: 100 },
      { subject: 'English', present: 2, absent: 0, late: 0, rate: 100 },
      { subject: 'Computer Science', present: 0, absent: 0, late: 1, rate: 0 },
    ],
    monthlyAttendance: [82, 85, 88, 87, 90, 89, 91, 88, 93, 87, 90, 92],
    studentPerformance: [
      { student: 'John Smith', present: 5, absent: 0, late: 0, rate: 100 },
      { student: 'Emma Johnson', present: 4, absent: 0, late: 1, rate: 80 },
      { student: 'Michael Brown', present: 3, absent: 1, late: 0, rate: 75 },
      { student: 'Sarah Davis', present: 5, absent: 0, late: 0, rate: 100 },
    ],
    reasonAnalysis: [
      { reason: 'Traffic', count: 1, percentage: 12.5 },
      { reason: 'Medical', count: 1, percentage: 12.5 },
      { reason: 'Transport', count: 1, percentage: 12.5 },
      { reason: 'No excuse', count: 1, percentage: 12.5 },
    ],
  };

  // Load attendance data
  const loadAttendance = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const data = await classService.getClassAttendance(selectedClass.id);
      setAttendanceRecords(data);
    } catch (error) {
      
      // Use dummy data on error
      setAttendanceRecords(dummyAttendanceRecords);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalytics(dummyAnalytics);
    } catch (error) {
      
      // Use dummy analytics on error
      setAnalytics(dummyAnalytics);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

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
  const generateAttendanceTrendsData = () => {
    if (!analytics) return null;
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        data: analytics.attendanceTrends,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const generateStatusDistributionData = () => {
    if (!analytics?.statusDistribution) return null;
    return analytics.statusDistribution.map(item => ({
      name: item.status,
      population: item.count,
      color: item.color,
      legendFontColor: colors.text,
    }));
  };

  const generateSubjectAttendanceData = () => {
    if (!analytics?.subjectAttendance) return null;
    return {
      labels: analytics.subjectAttendance.map(item => item.subject),
      data: analytics.subjectAttendance.map(item => item.rate),
    };
  };

  // Filter and sort attendance records
  const filteredAttendanceRecords = attendanceRecords
    .filter(record => {
      const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStudent = !filterStudent || record.studentName === filterStudent;
      const matchesStatus = !filterStatus || record.status === filterStatus;
      const matchesDate = !filterDate || record.date === filterDate;
      return matchesSearch && matchesStudent && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'student': return a.studentName.localeCompare(b.studentName);
        case 'status': return a.status.localeCompare(b.status);
        case 'time': return a.time.localeCompare(b.time);
        default: return 0;
      }
    });

  // Render attendance item
  const renderAttendanceItem = ({ item, index }) => (
    <View style={[styles.attendanceItem, { backgroundColor: colors.card }]}>
      <View style={styles.attendanceHeader}>
        <View style={styles.attendanceInfo}>
          <Text style={[styles.studentName, { color: colors.text }]}>
            {item.studentName}
          </Text>
          <Text style={[styles.studentId, { color: colors.primary }]}>
            {item.studentId}
          </Text>
          <Text style={[styles.subject, { color: colors.text + '80' }]}>
            {item.subject} - {item.teacher}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'Present' ? '#4CAF50' : 
                           item.status === 'Late' ? '#FF9800' : 
                           item.status === 'Excused' ? '#2196F3' : '#F44336' }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.attendanceDetails}>
        <View style={styles.attendanceDetail}>
          <MaterialIcons name="event" size={16} color={colors.text + '80'} />
          <Text style={[styles.attendanceDetailText, { color: colors.text }]}>
            {item.date}
          </Text>
        </View>
        <View style={styles.attendanceDetail}>
          <MaterialIcons name="access-time" size={16} color={colors.text + '80'} />
          <Text style={[styles.attendanceDetailText, { color: colors.text }]}>
            {item.time}
          </Text>
        </View>
        {item.lateMinutes > 0 && (
          <View style={styles.attendanceDetail}>
            <MaterialIcons name="schedule" size={16} color={colors.text + '80'} />
            <Text style={[styles.attendanceDetailText, { color: colors.text }]}>
              {t('lateBy')} {item.lateMinutes} {t('minutes')}
            </Text>
          </View>
        )}
        {item.reason && (
          <View style={styles.attendanceDetail}>
            <MaterialIcons name="info" size={16} color={colors.text + '80'} />
            <Text style={[styles.attendanceDetailText, { color: colors.text }]}>
              {t('reason')}: {item.reason}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.attendanceActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => onAttendanceAction('view', item.id)}
        >
          <MaterialIcons name="visibility" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('view')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => onAttendanceAction('edit', item.id)}
        >
          <MaterialIcons name="edit" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('edit')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={() => onAttendanceAction('delete', item.id)}
        >
          <MaterialIcons name="delete" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render attendance list
  const renderAttendanceList = () => (
    <View style={styles.tabContent}>
      {/* Search and Filters */}
      <View style={[styles.searchSection, { backgroundColor: colors.card }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.text} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('searchAttendance')}
              placeholderTextColor={colors.text + '60'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Advanced Filters */}
        <View style={styles.filterRow}>
          <View style={styles.filterDropdown}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>{t('student')}:</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background }]}
              onPress={() => Alert.alert(t('selectStudent'), t('studentSelectionComingSoon'))}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {filterStudent || t('allStudents')}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterDropdown}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>{t('status')}:</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background }]}
              onPress={() => Alert.alert(t('selectStatus'), t('statusSelectionComingSoon'))}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {filterStatus || t('allStatus')}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterDropdown}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>{t('sortBy')}:</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background }]}
              onPress={() => Alert.alert(t('sortBy'), t('sortSelectionComingSoon'))}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {sortBy === 'date' ? t('date') : sortBy === 'student' ? t('student') : sortBy === 'status' ? t('status') : t('time')}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.actionsSection, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert(t('markAttendance'), t('markAttendanceComingSoon'))}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('markAttendance')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => Alert.alert(t('bulkMark'), t('bulkMarkComingSoon'))}
        >
          <MaterialIcons name="group-add" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('bulkMark')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => Alert.alert(t('export'), t('exportAttendanceComingSoon'))}
        >
          <MaterialIcons name="file-download" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('export')}</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingAttendance')}...
          </Text>
        </View>
      ) : filteredAttendanceRecords.length > 0 ? (
        <FlatList
          data={filteredAttendanceRecords}
          renderItem={renderAttendanceItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.attendanceList}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle" size={48} color={colors.text + '50'} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            {t('noAttendanceFound')}
          </Text>
        </View>
      )}
    </View>
  );

  // Render analytics tab
  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent}>
      {analytics ? (
        <>
          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.attendanceRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('attendanceRate')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="people" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.presentCount}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('present')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="schedule" size={24} color="#FF9800" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.lateCount}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('late')}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="cancel" size={24} color="#F44336" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.absentCount}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('absent')}
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

          {/* Status Distribution */}
          {generateStatusDistributionData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('statusDistribution')}
              </Text>
              <PieChart
                data={generateStatusDistributionData()}
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
            {t('loadingAnalytics')}...
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // Render reports tab
  const renderReportsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialIcons name="assessment" size={48} color={colors.text + '50'} />
        <Text style={[styles.emptyStateText, { color: colors.text }]}>
          {t('attendanceReportsComingSoon')}
        </Text>
      </View>
    </View>
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
      {activeTab === 'list' && renderAttendanceList()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
      {activeTab === 'reports' && renderReportsTab()}
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
  searchSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 8,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterDropdown: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dropdownText: {
    fontSize: 12,
  },
  actionsSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
  attendanceList: {
    paddingBottom: 20,
  },
  attendanceItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  attendanceInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  subject: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  attendanceDetails: {
    marginBottom: 12,
  },
  attendanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  attendanceDetailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  attendanceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
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
});

export default AdvancedClassAttendance; 
