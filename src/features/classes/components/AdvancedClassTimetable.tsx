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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import RtlView from '../../../components/ui/RtlView';
import { LineChart, BarChart } from 'react-native-chart-kit';
import classService from '../services/classService';

const { width } = Dimensions.get('window');

interface AdvancedClassTimetableProps {
  selectedClass: any;
  onTimetableAction: (action: string, timetableId: number) => void;
}

const AdvancedClassTimetable: React.FC<AdvancedClassTimetableProps> = ({
  selectedClass,
  onTimetableAction,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('schedule');
  const [loading, setLoading] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');

  const TABS = [
    { key: 'schedule', label: t('schedule'), icon: 'schedule' },
    { key: 'calendar', label: t('calendar'), icon: 'calendar-today' },
    { key: 'analytics', label: t('analytics'), icon: 'analytics' },
  ];

  const DAYS = [
    { key: 'monday', label: t('monday'), short: t('mon') },
    { key: 'tuesday', label: t('tuesday'), short: t('tue') },
    { key: 'wednesday', label: t('wednesday'), short: t('wed') },
    { key: 'thursday', label: t('thursday'), short: t('thu') },
    { key: 'friday', label: t('friday'), short: t('fri') },
    { key: 'saturday', label: t('saturday'), short: t('sat') },
    { key: 'sunday', label: t('sunday'), short: t('sun') },
  ];

  const TIME_SLOTS = [
    { time: '08:00-09:00', label: '8:00 AM' },
    { time: '09:00-10:00', label: '9:00 AM' },
    { time: '10:00-11:00', label: '10:00 AM' },
    { time: '11:00-12:00', label: '11:00 AM' },
    { time: '12:00-13:00', label: '12:00 PM' },
    { time: '13:00-14:00', label: '1:00 PM' },
    { time: '14:00-15:00', label: '2:00 PM' },
    { time: '15:00-16:00', label: '3:00 PM' },
  ];

  // Rich dummy timetable data
  const dummyTimetable = [
    {
      id: 1,
      day: 'monday',
      timeSlot: '08:00-09:00',
      subjectName: 'Advanced Mathematics',
      teacherName: 'Dr. Sarah Johnson',
      room: 'Room 201',
      duration: 60,
      type: 'Lecture',
      students: 28,
      status: 'Active',
    },
    {
      id: 2,
      day: 'monday',
      timeSlot: '09:00-10:00',
      subjectName: 'Physics Fundamentals',
      teacherName: 'Prof. Michael Chen',
      room: 'Lab 105',
      duration: 60,
      type: 'Lab',
      students: 32,
      status: 'Active',
    },
    {
      id: 3,
      day: 'tuesday',
      timeSlot: '10:00-11:00',
      subjectName: 'English Literature',
      teacherName: 'Ms. Emily Davis',
      room: 'Room 305',
      duration: 60,
      type: 'Discussion',
      students: 25,
      status: 'Active',
    },
    {
      id: 4,
      day: 'wednesday',
      timeSlot: '13:00-14:00',
      subjectName: 'Computer Science',
      teacherName: 'Dr. Robert Wilson',
      room: 'Computer Lab 401',
      duration: 60,
      type: 'Practical',
      students: 30,
      status: 'Active',
    },
    {
      id: 5,
      day: 'thursday',
      timeSlot: '14:00-15:00',
      subjectName: 'History & Culture',
      teacherName: 'Prof. Lisa Anderson',
      room: 'Room 208',
      duration: 60,
      type: 'Lecture',
      students: 27,
      status: 'Active',
    },
  ];

  // Rich dummy analytics data
  const dummyAnalytics = {
    totalHours: 35,
    averageHoursPerDay: 7,
    utilizationRate: 87.5,
    conflicts: 2,
    weeklyDistribution: [7, 8, 6, 7, 7, 0, 0],
    subjectDistribution: [
      { subject: 'Mathematics', hours: 8, percentage: 22.9 },
      { subject: 'Physics', hours: 6, percentage: 17.1 },
      { subject: 'English', hours: 5, percentage: 14.3 },
      { subject: 'Computer Science', hours: 4, percentage: 11.4 },
      { subject: 'History', hours: 3, percentage: 8.6 },
      { subject: 'Other', hours: 9, percentage: 25.7 },
    ],
    teacherWorkload: [
      { teacher: 'Dr. Sarah Johnson', hours: 8, subjects: 1 },
      { teacher: 'Prof. Michael Chen', hours: 6, subjects: 1 },
      { teacher: 'Ms. Emily Davis', hours: 5, subjects: 1 },
      { teacher: 'Dr. Robert Wilson', hours: 4, subjects: 1 },
      { teacher: 'Prof. Lisa Anderson', hours: 3, subjects: 1 },
    ],
    roomUtilization: [
      { room: 'Room 201', hours: 8, utilization: 80 },
      { room: 'Lab 105', hours: 6, utilization: 60 },
      { room: 'Room 305', hours: 5, utilization: 50 },
      { room: 'Computer Lab 401', hours: 4, utilization: 40 },
      { room: 'Room 208', hours: 3, utilization: 30 },
    ],
  };

  // Load timetable data
  const loadTimetable = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const data = await classService.getClassTimetable(selectedClass.id);
      setTimetable(data);
    } catch (error) {
      
      // Use dummy data on error
      setTimetable(dummyTimetable);
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
    loadTimetable();
  }, [loadTimetable]);

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
  const generateWeeklyChartData = () => {
    if (!analytics) return null;
    return {
      labels: DAYS.map(day => day.short),
      datasets: [{
        data: analytics.weeklyDistribution,
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const generateSubjectChartData = () => {
    if (!analytics?.subjectDistribution) return null;
    return {
      labels: analytics.subjectDistribution.map(item => item.subject),
      data: analytics.subjectDistribution.map(item => item.hours),
    };
  };

  // Get subject for time slot
  const getSubjectForTimeSlot = (day: string, timeSlot: string) => {
    return timetable.find(item => 
      item.day === day && item.timeSlot === timeSlot
    );
  };

  // Filter timetable
  const filteredTimetable = timetable.filter(item => {
    const matchesSubject = !filterSubject || item.subjectName.includes(filterSubject);
    const matchesTeacher = !filterTeacher || item.teacherName.includes(filterTeacher);
    return matchesSubject && matchesTeacher;
  });

  // Render time slot
  const renderTimeSlot = ({ item }) => {
    const subject = getSubjectForTimeSlot(selectedDay, item.time);
    
    return (
      <View style={[styles.timeSlot, { backgroundColor: colors.card }]}>
        <View style={styles.timeHeader}>
          <Text style={[styles.timeLabel, { color: colors.text }]}>
            {item.label}
          </Text>
          <Text style={[styles.timeRange, { color: colors.text + '80' }]}>
            {item.time}
          </Text>
        </View>
        
        {subject ? (
          <View style={styles.subjectInfo}>
            <View style={styles.subjectHeader}>
              <Text style={[styles.subjectName, { color: colors.text }]}>
                {subject.subjectName}
              </Text>
              <View style={[styles.subjectBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.subjectBadgeText, { color: colors.primary }]}>
                  {subject.teacherName}
                </Text>
              </View>
            </View>
            <View style={styles.subjectDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="room" size={16} color={colors.text + '80'} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {subject.room}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={16} color={colors.text + '80'} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {subject.duration} {t('minutes')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="category" size={16} color={colors.text + '80'} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  {subject.type}
                </Text>
              </View>
            </View>
            
            <View style={styles.subjectActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => onTimetableAction('view', subject.id)}
              >
                <MaterialIcons name="visibility" size={14} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                onPress={() => onTimetableAction('edit', subject.id)}
              >
                <MaterialIcons name="edit" size={14} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                onPress={() => onTimetableAction('remove', subject.id)}
              >
                <MaterialIcons name="delete" size={14} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.emptySlot, { borderColor: colors.text + '30' }]}
            onPress={() => {
              setSelectedTimeSlot(item);
              Alert.alert(t('addSubject'), t('addSubjectToSlotComingSoon'));
            }}
          >
            <MaterialIcons name="add" size={24} color={colors.text + '50'} />
            <Text style={[styles.emptySlotText, { color: colors.text + '50' }]}>
              {t('addSubject')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render schedule tab
  const renderScheduleTab = () => (
    <View style={styles.tabContent}>
      {/* Day Selector */}
      <View style={[styles.daySelector, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day.key}
              style={[
                styles.dayButton,
                selectedDay === day.key && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => setSelectedDay(day.key)}
            >
              <Text style={[
                styles.dayButtonText,
                { color: selectedDay === day.key ? colors.primary : colors.text }
              ]}>
                {day.short}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filters */}
      <View style={[styles.filterSection, { backgroundColor: colors.card }]}>
        <View style={styles.filterRow}>
          <View style={styles.filterDropdown}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>{t('subject')}:</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background }]}
              onPress={() => Alert.alert(t('selectSubject'), t('subjectSelectionComingSoon'))}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {filterSubject || t('allSubjects')}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterDropdown}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>{t('teacher')}:</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background }]}
              onPress={() => Alert.alert(t('selectTeacher'), t('teacherSelectionComingSoon'))}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {filterTeacher || t('allTeachers')}
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
          onPress={() => Alert.alert(t('generate'), t('generateTimetableComingSoon'))}
        >
          <MaterialIcons name="auto-fix-high" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('generateTimetable')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => Alert.alert(t('export'), t('exportTimetableComingSoon'))}
        >
          <MaterialIcons name="file-download" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('exportTimetable')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => Alert.alert(t('optimize'), t('optimizeTimetableComingSoon'))}
        >
          <MaterialIcons name="tune" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('optimize')}</Text>
        </TouchableOpacity>
      </View>

      {/* Time Slots */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingTimetable')}...
          </Text>
        </View>
      ) : (
        <FlatList
          data={TIME_SLOTS}
          renderItem={renderTimeSlot}
          keyExtractor={(item) => item.time}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.timeSlotsList}
        />
      )}
    </View>
  );

  // Render calendar tab
  const renderCalendarTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialIcons name="calendar-today" size={48} color={colors.text + '50'} />
        <Text style={[styles.emptyStateText, { color: colors.text }]}>
          {t('calendarViewComingSoon')}
        </Text>
      </View>
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
              <MaterialIcons name="schedule" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.totalHours}h
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('totalHours')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.utilizationRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('utilizationRate')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="warning" size={24} color="#FF9800" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.conflicts}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('conflicts')}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="event" size={24} color="#9C27B0" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.averageHoursPerDay}h
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('avgHoursPerDay')}
              </Text>
            </View>
          </View>

          {/* Weekly Distribution */}
          {generateWeeklyChartData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('weeklyHoursDistribution')}
              </Text>
              <BarChart
                data={generateWeeklyChartData()}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            </View>
          )}

          {/* Subject Distribution */}
          {generateSubjectChartData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('subjectHoursDistribution')}
              </Text>
              <BarChart
                data={generateSubjectChartData()}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            </View>
          )}

          {/* Teacher Workload */}
          {analytics.teacherWorkload && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('teacherWorkload')}
              </Text>
              <BarChart
                data={{
                  labels: analytics.teacherWorkload.map(t => t.teacher.split(' ')[1]),
                  data: analytics.teacherWorkload.map(t => t.hours),
                }}
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
      {activeTab === 'schedule' && renderScheduleTab()}
      {activeTab === 'calendar' && renderCalendarTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
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
  daySelector: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  timeSlotsList: {
    paddingBottom: 20,
  },
  timeSlot: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeRange: {
    fontSize: 14,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subjectDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  subjectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptySlot: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 14,
    marginTop: 8,
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

export default AdvancedClassTimetable; 
