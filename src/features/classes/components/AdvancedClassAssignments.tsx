import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import classService from '../services/classService';

const { width } = Dimensions.get('window');

interface AdvancedClassAssignmentsProps {
  selectedClass: any;
  onAssignmentAction: (action: string, assignmentId: number) => void;
}

const AdvancedClassAssignments: React.FC<AdvancedClassAssignmentsProps> = ({
  selectedClass,
  onAssignmentAction,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');

  const TABS = [
    { key: 'list', label: t('assignments'), icon: 'assignment' },
    { key: 'analytics', label: t('analytics'), icon: 'analytics' },
    { key: 'submissions', label: t('submissions'), icon: 'folder' },
  ];

  // Rich dummy assignments data
  const dummyAssignments = [
    {
      id: 1,
      title: 'Calculus Problem Set 1',
      subject: 'Advanced Mathematics',
      assignedBy: 'Dr. Sarah Johnson',
      dueDate: '2024-02-20',
      status: 'Active',
      type: 'Problem Set',
      totalMarks: 50,
      submittedCount: 25,
      averageScore: 42.3,
      description: 'Complete problems 1-10 from Chapter 3',
      instructions: 'Show all work, submit as PDF',
      attachments: ['problem_set_1.pdf'],
    },
    {
      id: 2,
      title: 'Physics Lab Report',
      subject: 'Physics Fundamentals',
      assignedBy: 'Prof. Michael Chen',
      dueDate: '2024-02-18',
      status: 'Active',
      type: 'Lab Report',
      totalMarks: 30,
      submittedCount: 28,
      averageScore: 26.8,
      description: 'Write report on mechanics experiment',
      instructions: 'Include graphs and analysis',
      attachments: ['lab_manual.pdf'],
    },
    {
      id: 3,
      title: 'Essay on Shakespeare',
      subject: 'English Literature',
      assignedBy: 'Ms. Emily Davis',
      dueDate: '2024-02-25',
      status: 'Active',
      type: 'Essay',
      totalMarks: 100,
      submittedCount: 20,
      averageScore: 0,
      description: 'Analyze themes in Hamlet',
      instructions: '1500 words, MLA format',
      attachments: ['essay_guidelines.pdf'],
    },
    {
      id: 4,
      title: 'Programming Project',
      subject: 'Computer Science',
      assignedBy: 'Dr. Robert Wilson',
      dueDate: '2024-02-15',
      status: 'Completed',
      type: 'Project',
      totalMarks: 80,
      submittedCount: 30,
      averageScore: 72.5,
      description: 'Build a simple web application',
      instructions: 'Use HTML, CSS, JavaScript',
      attachments: ['project_requirements.pdf'],
    },
    {
      id: 5,
      title: 'History Research Paper',
      subject: 'History & Culture',
      assignedBy: 'Prof. Lisa Anderson',
      dueDate: '2024-02-22',
      status: 'Active',
      type: 'Research Paper',
      totalMarks: 120,
      submittedCount: 18,
      averageScore: 0,
      description: 'Research on World War II',
      instructions: '2000 words, include citations',
      attachments: ['research_guidelines.pdf'],
    },
  ];

  // Rich dummy analytics data
  const dummyAnalytics = {
    totalAssignments: 5,
    activeAssignments: 4,
    completedAssignments: 1,
    averageScore: 47.2,
    submissionRate: 82.3,
    totalStudents: 142,
    assignmentTrends: [8, 12, 15, 10, 18, 14, 16, 20, 18, 22, 19, 25],
    subjectDistribution: [
      { subject: 'Mathematics', assignments: 1, avgScore: 42.3, submissions: 25 },
      { subject: 'Physics', assignments: 1, avgScore: 26.8, submissions: 28 },
      { subject: 'English', assignments: 1, avgScore: 0, submissions: 20 },
      { subject: 'Computer Science', assignments: 1, avgScore: 72.5, submissions: 30 },
      { subject: 'History', assignments: 1, avgScore: 0, submissions: 18 },
    ],
    typeDistribution: [
      { type: 'Problem Set', count: 1, percentage: 20 },
      { type: 'Lab Report', count: 1, percentage: 20 },
      { type: 'Essay', count: 1, percentage: 20 },
      { type: 'Project', count: 1, percentage: 20 },
      { type: 'Research Paper', count: 1, percentage: 20 },
    ],
    monthlyAssignments: [3, 5, 4, 6, 8, 7, 5, 9, 8, 10, 9, 12],
    teacherWorkload: [
      { teacher: 'Dr. Sarah Johnson', assignments: 1, avgScore: 42.3 },
      { teacher: 'Prof. Michael Chen', assignments: 1, avgScore: 26.8 },
      { teacher: 'Ms. Emily Davis', assignments: 1, avgScore: 0 },
      { teacher: 'Dr. Robert Wilson', assignments: 1, avgScore: 72.5 },
      { teacher: 'Prof. Lisa Anderson', assignments: 1, avgScore: 0 },
    ],
  };

  // Load assignments data
  const loadAssignments = useCallback(async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const data = await classService.getClassAssignments(selectedClass.id);
      setAssignments(data);
    } catch (error) {
      
      // Use dummy data on error
      setAssignments(dummyAssignments);
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
    loadAssignments();
  }, [loadAssignments]);

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
  const generateAssignmentTrendsData = () => {
    if (!analytics) return null;
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        data: analytics.assignmentTrends,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const generateSubjectPerformanceData = () => {
    if (!analytics?.subjectDistribution) return null;
    return {
      labels: analytics.subjectDistribution.map(item => item.subject),
      data: analytics.subjectDistribution.map(item => item.avgScore),
    };
  };

  const generateTypeDistributionData = () => {
    if (!analytics?.typeDistribution) return null;
    return analytics.typeDistribution.map(item => ({
      name: item.type,
      population: item.count,
      color: ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'][Math.floor(Math.random() * 5)],
      legendFontColor: colors.text,
    }));
  };

  // Filter and sort assignments
  const filteredAssignments = assignments
    .filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           assignment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           assignment.assignedBy.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = !filterSubject || assignment.subject === filterSubject;
      const matchesStatus = !filterStatus || assignment.status === filterStatus;
      return matchesSearch && matchesSubject && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'dueDate': return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'title': return a.title.localeCompare(b.title);
        case 'subject': return a.subject.localeCompare(b.subject);
        case 'score': return b.averageScore - a.averageScore;
        default: return 0;
      }
    });

  // Render assignment item
  const renderAssignmentItem = ({ item, index }) => (
    <View style={[styles.assignmentItem, { backgroundColor: colors.card }]}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentInfo}>
          <Text style={[styles.assignmentName, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.assignmentSubject, { color: colors.primary }]}>
            {item.subject}
          </Text>
          <Text style={[styles.assignmentTeacher, { color: colors.text + '80' }]}>
            {item.assignedBy}
          </Text>
        </View>
        <View style={[styles.assignmentStatus, { backgroundColor: item.status === 'Active' ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.assignmentStatusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.assignmentDetails}>
        <View style={styles.assignmentDetail}>
          <MaterialIcons name="event" size={16} color={colors.text + '80'} />
          <Text style={[styles.assignmentDetailText, { color: colors.text }]}>
            {t('dueDate')}: {item.dueDate}
          </Text>
        </View>
        <View style={styles.assignmentDetail}>
          <MaterialIcons name="category" size={16} color={colors.text + '80'} />
          <Text style={[styles.assignmentDetailText, { color: colors.text }]}>
            {item.type}
          </Text>
        </View>
        <View style={styles.assignmentDetail}>
          <MaterialIcons name="grade" size={16} color={colors.text + '80'} />
          <Text style={[styles.assignmentDetailText, { color: colors.text }]}>
            {t('totalMarks')}: {item.totalMarks}
          </Text>
        </View>
        {item.averageScore > 0 && (
          <View style={styles.assignmentDetail}>
            <MaterialIcons name="trending-up" size={16} color={colors.text + '80'} />
            <Text style={[styles.assignmentDetailText, { color: colors.text }]}>
              {t('avgScore')}: {item.averageScore}/{item.totalMarks} ({item.submittedCount} {t('submissions')})
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.assignmentActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => onAssignmentAction('view', item.id)}
        >
          <MaterialIcons name="visibility" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('view')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => onAssignmentAction('edit', item.id)}
        >
          <MaterialIcons name="edit" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('edit')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
          onPress={() => onAssignmentAction('delete', item.id)}
        >
          <MaterialIcons name="delete" size={16} color="white" />
          <Text style={styles.actionButtonText}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render assignments list
  const renderAssignmentsList = () => (
    <View style={styles.tabContent}>
      {/* Search and Filters */}
      <View style={[styles.searchSection, { backgroundColor: colors.card }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.text} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('searchAssignments')}
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
                {sortBy === 'dueDate' ? t('dueDate') : sortBy === 'title' ? t('title') : sortBy === 'subject' ? t('subject') : t('score')}
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
          onPress={() => Alert.alert(t('create'), t('createAssignmentComingSoon'))}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('createAssignment')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => Alert.alert(t('bulkAssign'), t('bulkAssignComingSoon'))}
        >
          <MaterialIcons name="group-add" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('bulkAssign')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => Alert.alert(t('templates'), t('assignmentTemplatesComingSoon'))}
        >
          <MaterialIcons name="template" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('templates')}</Text>
        </TouchableOpacity>
      </View>

      {/* Assignments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingAssignments')}...
          </Text>
        </View>
      ) : filteredAssignments.length > 0 ? (
        <FlatList
          data={filteredAssignments}
          renderItem={renderAssignmentItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.assignmentsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="assignment" size={48} color={colors.text + '50'} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            {t('noAssignmentsFound')}
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
              <MaterialIcons name="assignment" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.totalAssignments}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('totalAssignments')}
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
                {analytics.submissionRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('submissionRate')}
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

          {/* Assignment Trends */}
          {generateAssignmentTrendsData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('assignmentTrends')}
              </Text>
              <LineChart
                data={generateAssignmentTrendsData()}
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

          {/* Type Distribution */}
          {generateTypeDistributionData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('assignmentTypeDistribution')}
              </Text>
              <PieChart
                data={generateTypeDistributionData()}
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

  // Render submissions tab
  const renderSubmissionsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialIcons name="folder" size={48} color={colors.text + '50'} />
        <Text style={[styles.emptyStateText, { color: colors.text }]}>
          {t('submissionsViewComingSoon')}
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
      {activeTab === 'list' && renderAssignmentsList()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
      {activeTab === 'submissions' && renderSubmissionsTab()}
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
  assignmentsList: {
    paddingBottom: 20,
  },
  assignmentItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  assignmentSubject: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  assignmentTeacher: {
    fontSize: 12,
  },
  assignmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assignmentStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  assignmentDetails: {
    marginBottom: 12,
  },
  assignmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  assignmentDetailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  assignmentActions: {
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

export default AdvancedClassAssignments;
