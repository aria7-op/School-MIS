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

interface AdvancedClassExamsProps {
  selectedClass: any;
  onExamAction: (action: string, examId: number) => void;
}

const AdvancedClassExams: React.FC<AdvancedClassExamsProps> = ({
  selectedClass,
  onExamAction,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const TABS = [
    { key: 'upcoming', label: t('upcoming'), icon: 'event' },
    { key: 'past', label: t('past'), icon: 'history' },
    { key: 'analytics', label: t('analytics'), icon: 'analytics' },
    { key: 'schedule', label: t('schedule'), icon: 'schedule' },
  ];

  // Rich dummy exams data
  const dummyExams = [
    {
      id: 1,
      name: 'Midterm Mathematics',
      subject: 'Advanced Mathematics',
      teacher: 'Dr. Sarah Johnson',
      date: '2024-02-15',
      time: '09:00 AM',
      duration: 120,
      type: 'Midterm',
      status: 'Scheduled',
      room: 'Room 201',
      students: 28,
      totalMarks: 100,
      averageScore: 78.5,
      passRate: 85.7,
      description: 'Covers chapters 1-5 including calculus fundamentals',
      instructions: 'Bring calculator, no phones allowed',
      materials: ['Calculator', 'Pencil', 'Eraser'],
    },
    {
      id: 2,
      name: 'Physics Lab Practical',
      subject: 'Physics Fundamentals',
      teacher: 'Prof. Michael Chen',
      date: '2024-02-18',
      time: '02:00 PM',
      duration: 90,
      type: 'Practical',
      status: 'Scheduled',
      room: 'Lab 105',
      students: 32,
      totalMarks: 50,
      averageScore: 42.3,
      passRate: 78.1,
      description: 'Laboratory experiments on mechanics',
      instructions: 'Lab coat required, safety equipment provided',
      materials: ['Lab Manual', 'Safety Equipment'],
    },
    {
      id: 3,
      name: 'English Literature Final',
      subject: 'English Literature',
      teacher: 'Ms. Emily Davis',
      date: '2024-02-20',
      time: '10:30 AM',
      duration: 180,
      type: 'Final',
      status: 'Scheduled',
      room: 'Room 305',
      students: 25,
      totalMarks: 150,
      averageScore: 0,
      passRate: 0,
      description: 'Comprehensive final examination',
      instructions: 'Essay format, bring blue books',
      materials: ['Blue Books', 'Pen'],
    },
    {
      id: 4,
      name: 'Programming Assignment',
      subject: 'Computer Science',
      teacher: 'Dr. Robert Wilson',
      date: '2024-02-12',
      time: '11:00 AM',
      duration: 60,
      type: 'Assignment',
      status: 'Completed',
      room: 'Computer Lab 401',
      students: 30,
      totalMarks: 30,
      averageScore: 26.8,
      passRate: 93.3,
      description: 'Coding project submission',
      instructions: 'Submit via online platform',
      materials: ['Laptop', 'Development Tools'],
    },
    {
      id: 5,
      name: 'History Quiz',
      subject: 'History & Culture',
      teacher: 'Prof. Lisa Anderson',
      date: '2024-02-10',
      time: '01:00 PM',
      duration: 45,
      type: 'Quiz',
      status: 'Completed',
      room: 'Room 208',
      students: 27,
      totalMarks: 20,
      averageScore: 16.2,
      passRate: 88.9,
      description: 'Short quiz on recent topics',
      instructions: 'Multiple choice format',
      materials: ['Pencil', 'Scantron'],
    },
  ];

  // Rich dummy analytics data
  const dummyAnalytics = {
    totalExams: 5,
    upcomingExams: 3,
    completedExams: 2,
    averageScore: 65.9,
    passRate: 85.2,
    totalStudents: 142,
    examTrends: [75, 78, 82, 79, 85, 88, 86, 89, 87, 90, 88, 92],
    subjectPerformance: [
      { subject: 'Mathematics', avgScore: 78.5, passRate: 85.7, exams: 1 },
      { subject: 'Physics', avgScore: 42.3, passRate: 78.1, exams: 1 },
      { subject: 'English', avgScore: 0, passRate: 0, exams: 1 },
      { subject: 'Computer Science', avgScore: 26.8, passRate: 93.3, exams: 1 },
      { subject: 'History', avgScore: 16.2, passRate: 88.9, exams: 1 },
    ],
    examTypeDistribution: [
      { type: 'Midterm', count: 1, percentage: 20 },
      { type: 'Final', count: 1, percentage: 20 },
      { type: 'Quiz', count: 1, percentage: 20 },
      { type: 'Assignment', count: 1, percentage: 20 },
      { type: 'Practical', count: 1, percentage: 20 },
    ],
    monthlyExams: [2, 3, 1, 2, 4, 3, 2, 1, 3, 2, 4, 3],
    teacherWorkload: [
      { teacher: 'Dr. Sarah Johnson', exams: 1, avgScore: 78.5 },
      { teacher: 'Prof. Michael Chen', exams: 1, avgScore: 42.3 },
      { teacher: 'Ms. Emily Davis', exams: 1, avgScore: 0 },
      { teacher: 'Dr. Robert Wilson', exams: 1, avgScore: 26.8 },
      { teacher: 'Prof. Lisa Anderson', exams: 1, avgScore: 16.2 },
    ],
  };

  // Load exams data
  const loadExams = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const data = await classService.getClassExams(selectedClass.id);
      setExams(data);
    } catch (error) {
      
      // Use dummy data on error
      setExams(dummyExams);
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
    loadExams();
  }, [loadExams]);

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
  const generateExamTrendsData = () => {
    if (!analytics) return null;
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        data: analytics.examTrends,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const generateSubjectPerformanceData = () => {
    if (!analytics?.subjectPerformance) return null;
    return {
      labels: analytics.subjectPerformance.map(item => item.subject),
      data: analytics.subjectPerformance.map(item => item.avgScore),
    };
  };

  const generateExamTypeData = () => {
    if (!analytics?.examTypeDistribution) return null;
    return analytics.examTypeDistribution.map(item => ({
      name: item.type,
      population: item.count,
      color: ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'][Math.floor(Math.random() * 5)],
      legendFontColor: colors.text,
    }));
  };

  // Filter and sort exams
  const filteredExams = exams
    .filter(exam => {
      const matchesSearch = exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           exam.teacher.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = !filterSubject || exam.subject === filterSubject;
      const matchesStatus = !filterStatus || exam.status === filterStatus;
      const matchesTab = activeTab === 'upcoming' ? exam.status === 'Scheduled' : exam.status === 'Completed';
      return matchesSearch && matchesSubject && matchesStatus && matchesTab;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'name': return a.name.localeCompare(b.name);
        case 'subject': return a.subject.localeCompare(b.subject);
        case 'score': return b.averageScore - a.averageScore;
        default: return 0;
      }
    });

  // Render exam item
  const renderExamItem = ({ item, index }) => (
    <View style={[styles.examItem, { backgroundColor: colors.card }]}>
      <View style={styles.examHeader}>
        <View style={styles.examInfo}>
          <Text style={[styles.examName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.examSubject, { color: colors.primary }]}>
            {item.subject}
          </Text>
          <Text style={[styles.examTeacher, { color: colors.text + '80' }]}>
            {item.teacher}
          </Text>
        </View>
        <View style={[styles.examStatus, { backgroundColor: item.status === 'Scheduled' ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.examStatusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.examDetails}>
        <View style={styles.examDetail}>
          <MaterialIcons name="event" size={16} color={colors.text + '80'} />
          <Text style={[styles.examDetailText, { color: colors.text }]}>
            {item.date} - {item.time}
          </Text>
        </View>
        <View style={styles.examDetail}>
          <MaterialIcons name="access-time" size={16} color={colors.text + '80'} />
          <Text style={[styles.examDetailText, { color: colors.text }]}>
            {item.duration} {t('minutes')}
          </Text>
        </View>
        <View style={styles.examDetail}>
          <MaterialIcons name="room" size={16} color={colors.text + '80'} />
          <Text style={[styles.examDetailText, { color: colors.text }]}>
            {item.room}
          </Text>
        </View>
        {item.averageScore > 0 && (
          <View style={styles.examDetail}>
            <MaterialIcons name="grade" size={16} color={colors.text + '80'} />
            <Text style={[styles.examDetailText, { color: colors.text }]}>
              {t('avgScore')}: {item.averageScore}/{item.totalMarks} ({item.passRate}% {t('passRate')})
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.examActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => onExamAction('view', item.id)}
        >
          <MaterialIcons name="visibility" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('view')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => onExamAction('edit', item.id)}
        >
          <MaterialIcons name="edit" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('edit')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={() => onExamAction('delete', item.id)}
        >
          <MaterialIcons name="delete" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render exams list
  const renderExamsList = () => (
    <View style={styles.tabContent}>
      {/* Search and Filters */}
      <View style={[styles.searchSection, { backgroundColor: colors.card }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.text} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('searchExams')}
              placeholderTextColor={colors.text + '60'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Advanced Filters */}
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
                {sortBy === 'date' ? t('date') : sortBy === 'name' ? t('name') : sortBy === 'subject' ? t('subject') : t('score')}
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
          onPress={() => Alert.alert(t('create'), t('createExamComingSoon'))}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('createExam')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => Alert.alert(t('schedule'), t('scheduleExamComingSoon'))}
        >
          <MaterialIcons name="schedule" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('scheduleExam')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => Alert.alert(t('bulk'), t('bulkOperationsComingSoon'))}
        >
          <MaterialIcons name="group-work" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('bulkOps')}</Text>
        </TouchableOpacity>
      </View>

      {/* Exams List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingExams')}...
          </Text>
        </View>
      ) : filteredExams.length > 0 ? (
        <FlatList
          data={filteredExams}
          renderItem={renderExamItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.examsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="event" size={48} color={colors.text + '50'} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            {t('noExamsFound')}
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
              <MaterialIcons name="event" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.totalExams}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('totalExams')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="grade" size={24} color="#4CAF50" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.averageScore}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('averageScore')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="check-circle" size={24} color="#FF9800" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.passRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('passRate')}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="people" size={24} color="#9C27B0" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.totalStudents}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('totalStudents')}
              </Text>
            </View>
          </View>

          {/* Exam Trends */}
          {generateExamTrendsData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('examTrends')}
              </Text>
              <LineChart
                data={generateExamTrendsData()}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
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

          {/* Exam Type Distribution */}
          {generateExamTypeData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('examTypeDistribution')}
              </Text>
              <PieChart
                data={generateExamTypeData()}
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

  // Render schedule tab
  const renderScheduleTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialIcons name="schedule" size={48} color={colors.text + '50'} />
        <Text style={[styles.emptyStateText, { color: colors.text }]}>
          {t('examScheduleViewComingSoon')}
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
      {(activeTab === 'upcoming' || activeTab === 'past') && renderExamsList()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
      {activeTab === 'schedule' && renderScheduleTab()}
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
  examsList: {
    paddingBottom: 20,
  },
  examItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  examSubject: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  examTeacher: {
    fontSize: 12,
  },
  examStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  examStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  examDetails: {
    marginBottom: 12,
  },
  examDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  examDetailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  examActions: {
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

export default AdvancedClassExams; 
