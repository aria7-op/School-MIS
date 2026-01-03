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
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import RtlView from '../../../components/ui/RtlView';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import classService from '../services/classService';

const { width } = Dimensions.get('window');

interface AdvancedClassSubjectsProps {
  selectedClass: any;
  onSubjectAction: (action: string, subjectId: number) => void;
}

const AdvancedClassSubjects: React.FC<AdvancedClassSubjectsProps> = ({
  selectedClass,
  onSubjectAction,
}) => {
  const { colors, dark } = useTheme();
  const { t, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const TABS = [
    { key: 'list', label: t('subjects'), icon: 'book' },
    { key: 'analytics', label: t('analytics'), icon: 'analytics' },
    { key: 'performance', label: t('performance'), icon: 'trending-up' },
    { key: 'schedule', label: t('schedule'), icon: 'schedule' },
  ];

  // Rich dummy data for subjects
  const dummySubjects = [
    {
      id: 1,
      name: 'Advanced Mathematics',
      code: 'MATH101',
      teacher: 'Dr. Sarah Johnson',
      credits: 4,
      level: 'Advanced',
      status: 'Active',
      students: 28,
      averageGrade: 85.2,
      completionRate: 92.5,
      lastUpdated: '2024-01-15',
      description: 'Advanced mathematical concepts including calculus and linear algebra',
      schedule: 'Mon, Wed, Fri 9:00 AM',
      room: 'Room 201',
      prerequisites: ['Basic Math', 'Algebra'],
      materials: ['Textbook', 'Calculator', 'Software'],
    },
    {
      id: 2,
      name: 'Physics Fundamentals',
      code: 'PHYS102',
      teacher: 'Prof. Michael Chen',
      credits: 3,
      level: 'Intermediate',
      status: 'Active',
      students: 32,
      averageGrade: 78.9,
      completionRate: 88.3,
      lastUpdated: '2024-01-14',
      description: 'Core physics principles and laboratory experiments',
      schedule: 'Tue, Thu 10:30 AM',
      room: 'Lab 105',
      prerequisites: ['Mathematics'],
      materials: ['Lab Manual', 'Safety Equipment'],
    },
    {
      id: 3,
      name: 'English Literature',
      code: 'ENG201',
      teacher: 'Ms. Emily Davis',
      credits: 3,
      level: 'Advanced',
      status: 'Active',
      students: 25,
      averageGrade: 82.1,
      completionRate: 95.0,
      lastUpdated: '2024-01-13',
      description: 'Study of classic and contemporary literature',
      schedule: 'Mon, Wed 2:00 PM',
      room: 'Room 305',
      prerequisites: ['English Composition'],
      materials: ['Anthology', 'Novels'],
    },
    {
      id: 4,
      name: 'Computer Science',
      code: 'CS301',
      teacher: 'Dr. Robert Wilson',
      credits: 4,
      level: 'Advanced',
      status: 'Active',
      students: 30,
      averageGrade: 87.5,
      completionRate: 90.2,
      lastUpdated: '2024-01-12',
      description: 'Programming fundamentals and software development',
      schedule: 'Tue, Thu, Fri 1:00 PM',
      room: 'Computer Lab 401',
      prerequisites: ['Basic Programming'],
      materials: ['Laptop', 'Development Tools'],
    },
    {
      id: 5,
      name: 'History & Culture',
      code: 'HIST202',
      teacher: 'Prof. Lisa Anderson',
      credits: 3,
      level: 'Intermediate',
      status: 'Active',
      students: 27,
      averageGrade: 79.8,
      completionRate: 85.7,
      lastUpdated: '2024-01-11',
      description: 'World history and cultural studies',
      schedule: 'Wed, Fri 11:00 AM',
      room: 'Room 208',
      prerequisites: ['World History'],
      materials: ['Textbook', 'Primary Sources'],
    },
  ];

  // Rich dummy analytics data
  const dummyAnalytics = {
    totalSubjects: 5,
    averageGrade: 82.7,
    completionRate: 90.3,
    totalStudents: 142,
    performanceTrend: [75, 78, 82, 85, 88, 90, 87, 89, 91, 88, 90, 92],
    gradeDistribution: [
      { grade: 'A', count: 45, percentage: 31.7, color: '#4CAF50' },
      { grade: 'B', count: 52, percentage: 36.6, color: '#2196F3' },
      { grade: 'C', count: 28, percentage: 19.7, color: '#FF9800' },
      { grade: 'D', count: 12, percentage: 8.5, color: '#F44336' },
      { grade: 'F', count: 5, percentage: 3.5, color: '#9C27B0' },
    ],
    subjectPerformance: [
      { subject: 'Mathematics', average: 85.2, students: 28, trend: [82, 84, 86, 85, 87] },
      { subject: 'Physics', average: 78.9, students: 32, trend: [75, 77, 79, 78, 80] },
      { subject: 'English', average: 82.1, students: 25, trend: [80, 81, 83, 82, 84] },
      { subject: 'Computer Science', average: 87.5, students: 30, trend: [85, 86, 88, 87, 89] },
      { subject: 'History', average: 79.8, students: 27, trend: [77, 78, 80, 79, 81] },
    ],
    monthlyProgress: [65, 70, 75, 80, 85, 90, 88, 92, 89, 91, 93, 95],
    teacherPerformance: [
      { teacher: 'Dr. Sarah Johnson', subjects: 1, avgGrade: 85.2, students: 28 },
      { teacher: 'Prof. Michael Chen', subjects: 1, avgGrade: 78.9, students: 32 },
      { teacher: 'Ms. Emily Davis', subjects: 1, avgGrade: 82.1, students: 25 },
      { teacher: 'Dr. Robert Wilson', subjects: 1, avgGrade: 87.5, students: 30 },
      { teacher: 'Prof. Lisa Anderson', subjects: 1, avgGrade: 79.8, students: 27 },
    ],
  };

  // Load subjects data
  const loadSubjects = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const data = await classService.getClassSubjects(selectedClass.id);
      setSubjects(data);
    } catch (error) {
      
      // Use dummy data on error
      setSubjects(dummySubjects);
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
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'performance') {
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
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  // Generate chart data
  const generatePerformanceChartData = () => {
    if (!analytics) return null;
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        data: analytics.performanceTrend,
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const generateGradeChartData = () => {
    if (!analytics?.gradeDistribution) return null;
    return analytics.gradeDistribution.map(item => ({
      name: item.grade,
      population: item.count,
      color: item.color,
      legendFontColor: colors.text,
    }));
  };

  const generateSubjectPerformanceData = () => {
    if (!analytics?.subjectPerformance) return null;
    return {
      labels: analytics.subjectPerformance.map(item => item.subject),
      data: analytics.subjectPerformance.map(item => item.average),
    };
  };

  // Filter and sort subjects
  const filteredSubjects = subjects
    .filter(subject => {
      const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           subject.teacher.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = !filterLevel || subject.level === filterLevel;
      const matchesTeacher = !filterTeacher || subject.teacher === filterTeacher;
      return matchesSearch && matchesLevel && matchesTeacher;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'teacher': return a.teacher.localeCompare(b.teacher);
        case 'credits': return b.credits - a.credits;
        case 'grade': return b.averageGrade - a.averageGrade;
        default: return 0;
      }
    });

  // Render subject item
  const renderSubjectItem = ({ item, index }) => (
    <View style={[styles.subjectItem, { backgroundColor: colors.card }]}>
      <View style={styles.subjectHeader}>
        <View style={styles.subjectInfo}>
          <Text style={[styles.subjectName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.subjectCode, { color: colors.primary }]}>
            {item.code}
          </Text>
          <Text style={[styles.subjectTeacher, { color: colors.text + '80' }]}>
            {item.teacher}
          </Text>
        </View>
        <View style={styles.subjectStats}>
          <View style={[styles.statBadge, { backgroundColor: colors.primary + '20' }]}>
            <MaterialIcons name="school" size={16} color={colors.primary} />
            <Text style={[styles.statText, { color: colors.primary }]}>
              {item.credits} {t('credits')}
            </Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: '#4CAF50' + '20' }]}>
            <MaterialIcons name="people" size={16} color="#4CAF50" />
            <Text style={[styles.statText, { color: '#4CAF50' }]}>
              {item.students} {t('students')}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.subjectDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="schedule" size={16} color={colors.text + '80'} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.schedule}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="room" size={16} color={colors.text + '80'} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {item.room}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="grade" size={16} color={colors.text + '80'} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {t('avgGrade')}: {item.averageGrade}%
          </Text>
        </View>
      </View>
      
      <View style={styles.subjectActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => onSubjectAction('view', item.id)}
        >
          <MaterialIcons name="visibility" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('view')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => onSubjectAction('edit', item.id)}
        >
          <MaterialIcons name="edit" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('edit')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={() => onSubjectAction('remove', item.id)}
        >
          <MaterialIcons name="delete" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('remove')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render subjects list tab
  const renderSubjectsTab = () => (
    <View style={styles.tabContent}>
      {/* Search and Filters */}
      <View style={[styles.searchSection, { backgroundColor: colors.card }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.text} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('searchSubjects')}
              placeholderTextColor={colors.text + '60'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert(t('filters'), t('advancedFiltersComingSoon'))}
          >
            <MaterialIcons name="filter-list" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Advanced Filters */}
        <View style={styles.filterRow}>
          <View style={styles.filterDropdown}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>{t('level')}:</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background }]}
              onPress={() => Alert.alert(t('selectLevel'), t('levelSelectionComingSoon'))}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {filterLevel || t('allLevels')}
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

          <View style={styles.filterDropdown}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>{t('sortBy')}:</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background }]}
              onPress={() => Alert.alert(t('sortBy'), t('sortSelectionComingSoon'))}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {sortBy === 'name' ? t('name') : sortBy === 'teacher' ? t('teacher') : sortBy === 'credits' ? t('credits') : t('grade')}
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
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('assignSubject')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => Alert.alert(t('create'), t('createSubjectComingSoon'))}
        >
          <MaterialIcons name="create" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('createSubject')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => Alert.alert(t('bulk'), t('bulkOperationsComingSoon'))}
        >
          <MaterialIcons name="group-work" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('bulkOps')}</Text>
        </TouchableOpacity>
      </View>

      {/* Subjects List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingSubjects')}...
          </Text>
        </View>
      ) : filteredSubjects.length > 0 ? (
        <FlatList
          data={filteredSubjects}
          renderItem={renderSubjectItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.subjectsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="book" size={48} color={colors.text + '50'} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            {t('noSubjectsFound')}
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
              <MaterialIcons name="book" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.totalSubjects}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('totalSubjects')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="grade" size={24} color="#4CAF50" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.averageGrade}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('averageGrade')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="check-circle" size={24} color="#FF9800" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.completionRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('completionRate')}
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

          {/* Performance Trend */}
          {generatePerformanceChartData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('performanceTrend')}
              </Text>
              <LineChart
                data={generatePerformanceChartData()}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {/* Grade Distribution */}
          {generateGradeChartData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('gradeDistribution')}
              </Text>
              <PieChart
                data={generateGradeChartData()}
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
          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              {t('monthlyProgress')}
            </Text>
            <LineChart
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                  data: analytics.monthlyProgress,
                  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                  strokeWidth: 3,
                }],
              }}
              width={width - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              {t('teacherPerformance')}
            </Text>
            <BarChart
              data={{
                labels: analytics.teacherPerformance.map(t => t.teacher.split(' ')[1]),
                data: analytics.teacherPerformance.map(t => t.avgGrade),
              }}
              width={width - 32}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
            />
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

  // Render schedule tab
  const renderScheduleTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialIcons name="schedule" size={48} color={colors.text + '50'} />
        <Text style={[styles.emptyStateText, { color: colors.text }]}>
          {t('scheduleViewComingSoon')}
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
      {activeTab === 'list' && renderSubjectsTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
      {activeTab === 'performance' && renderPerformanceTab()}
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
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
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
  subjectsList: {
    paddingBottom: 20,
  },
  subjectItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  subjectTeacher: {
    fontSize: 12,
  },
  subjectStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statText: {
    fontSize: 12,
    marginLeft: 2,
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

export default AdvancedClassSubjects; 
