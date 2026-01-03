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
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import classService from '../services/classService';

const { width } = Dimensions.get('window');

interface AdvancedClassStudentsProps {
  selectedClass: any;
  onStudentAction: (action: string, studentId: number) => void;
}

const AdvancedClassStudents: React.FC<AdvancedClassStudentsProps> = ({
  selectedClass,
  onStudentAction,
}) => {
  const { colors, dark } = useTheme();
  const { t, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isRtl = lang === 'fa' || lang === 'ps';

  const TABS = [
    { key: 'list', label: t('students'), icon: 'people' },
    { key: 'analytics', label: t('analytics'), icon: 'analytics' },
    { key: 'attendance', label: t('attendance'), icon: 'event-available' },
    { key: 'performance', label: t('performance'), icon: 'trending-up' },
  ];

  // ======================
  // LOAD DATA
  // ======================
  
  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      const data = await classService.getClassStudents(selectedClass.id, {
        include: 'grades,attendance,performance',
      });
      setStudents(data);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  const loadAnalytics = useCallback(async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      // Mock analytics data - replace with real API call
      const mockAnalytics = {
        totalStudents: students.length,
        averageGrade: 85.5,
        attendanceRate: 92.3,
        performanceTrend: [75, 78, 82, 85, 88, 90],
        gradeDistribution: [
          { grade: 'A', count: 15, percentage: 30 },
          { grade: 'B', count: 20, percentage: 40 },
          { grade: 'C', count: 10, percentage: 20 },
          { grade: 'D', count: 3, percentage: 6 },
          { grade: 'F', count: 2, percentage: 4 },
        ],
        attendanceTrend: [88, 90, 92, 91, 93, 92],
      };
      setAnalytics(mockAnalytics);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  }, [selectedClass, students.length]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

  // ======================
  // CHART DATA
  // ======================
  
  const generatePerformanceChartData = () => {
    if (!analytics) return null;
    
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          data: analytics.performanceTrend,
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const generateAttendanceChartData = () => {
    if (!analytics) return null;
    
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          data: analytics.attendanceTrend,
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const generateGradeChartData = () => {
    if (!analytics?.gradeDistribution) return null;
    
    return {
      labels: analytics.gradeDistribution.map(item => item.grade),
      data: analytics.gradeDistribution.map(item => item.count),
      colors: ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'],
    };
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  // ======================
  // RENDER STUDENT LIST
  // ======================
  
  const renderStudentItem = ({ item, index }) => (
    <View style={[styles.studentItem, { backgroundColor: colors.card }]}>
      <View style={styles.studentAvatar}>
        <MaterialIcons name="person" size={24} color={colors.primary} />
      </View>
      
      <View style={styles.studentInfo}>
        <Text style={[styles.studentName, { color: colors.text }]}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={[styles.studentId, { color: colors.text + '80' }]}>
          {item.studentId}
        </Text>
        <Text style={[styles.studentEmail, { color: colors.text + '80' }]}>
          {item.email}
        </Text>
      </View>
      
      <View style={styles.studentStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
            {t('grade')}
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {item.grade || 'N/A'}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
            {t('attendance')}
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {item.attendanceRate || 'N/A'}%
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.studentActions}
        onPress={() => Alert.alert(t('studentActions'), t('studentActionsComingSoon'))}
      >
        <MaterialIcons name="more-vert" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderStudentsTab = () => (
    <View style={styles.tabContent}>
      {/* Search and Actions */}
      <View style={[styles.searchSection, { backgroundColor: colors.card }]}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.text} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('searchStudents')}
            placeholderTextColor={colors.text + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="person-add" size={20} color="white" />
          <Text style={styles.addButtonText}>{t('addStudent')}</Text>
        </TouchableOpacity>
      </View>

      {/* Students List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingStudents')}...
          </Text>
        </View>
      ) : students.length > 0 ? (
        <FlatList
          data={students.filter(student =>
            student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.studentsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="people" size={48} color={colors.text + '50'} />
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            {t('noStudentsInClass')}
          </Text>
        </View>
      )}
    </View>
  );

  // ======================
  // RENDER ANALYTICS TAB
  // ======================
  
  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent}>
      {analytics ? (
        <>
          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="people" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.totalStudents}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('totalStudents')}
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
              <MaterialIcons name="event-available" size={24} color="#FF9800" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {analytics.attendanceRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('attendanceRate')}
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

          {/* Attendance Trend */}
          {generateAttendanceChartData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('attendanceTrend')}
              </Text>
              <LineChart
                data={generateAttendanceChartData()}
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
                data={generateGradeChartData().data.map((value, index) => ({
                  name: generateGradeChartData().labels[index],
                  population: value,
                  color: generateGradeChartData().colors[index],
                  legendFontColor: colors.text,
                }))}
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

  // ======================
  // RENDER ATTENDANCE TAB
  // ======================
  
  const renderAttendanceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialIcons name="event-available" size={48} color={colors.text + '50'} />
        <Text style={[styles.emptyStateText, { color: colors.text }]}>
          {t('attendanceManagementComingSoon')}
        </Text>
      </View>
    </View>
  );

  // ======================
  // RENDER PERFORMANCE TAB
  // ======================
  
  const renderPerformanceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <MaterialIcons name="trending-up" size={48} color={colors.text + '50'} />
        <Text style={[styles.emptyStateText, { color: colors.text }]}>
          {t('performanceManagementComingSoon')}
        </Text>
      </View>
    </View>
  );

  // ======================
  // RENDER ADD STUDENT MODAL
  // ======================
  
  const renderAddStudentModal = () => (
    <Modal
      visible={showAddModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t('addStudent')}
          </Text>
          <Text style={[styles.modalMessage, { color: colors.text }]}>
            {t('addStudentComingSoon')}
          </Text>
          
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(false)}
          >
            <Text style={styles.modalButtonText}>{t('ok')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
      {activeTab === 'list' && renderStudentsTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
      {activeTab === 'attendance' && renderAttendanceTab()}
      {activeTab === 'performance' && renderPerformanceTab()}

      {/* Modals */}
      {renderAddStudentModal()}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
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
  studentsList: {
    paddingBottom: 20,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 14,
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 12,
  },
  studentStats: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  studentActions: {
    padding: 8,
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default AdvancedClassStudents; 
