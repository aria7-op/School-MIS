import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Text, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';

interface TeacherPerformance {
  id: string;
  name: string;
  department: string;
  rating: number;
  studentSatisfaction: number;
  attendanceRate: number;
  coursesCount: number;
  activeStudents: number;
  completionRate: number;
  averageGrade: number;
  lastEvaluation: string;
  performanceHistory: number[];
  achievements: string[];
  specializations: string[];
  status: 'excellent' | 'good' | 'average' | 'needsImprovement';
}

interface DepartmentPerformance {
  name: string;
  averageRating: number;
  teacherCount: number;
  studentCount: number;
  courseCount: number;
  performanceHistory: number[];
}

// Custom styled components
const Card = ({ children, style, ...props }: any) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

const CardContent = ({ children, style, ...props }: any) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

const Button = ({ children, mode = 'contained', size = 'medium', icon, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'contained' && styles.buttonContained,
      mode === 'outlined' && styles.buttonOutlined,
      size === 'small' && styles.buttonSmall,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    {icon && <MaterialIcons name={icon} size={16} color={mode === 'contained' ? '#fff' : '#007AFF'} style={styles.buttonIcon} />}
    <Text style={[
      styles.buttonText,
      mode === 'contained' && styles.buttonTextContained,
      mode === 'outlined' && styles.buttonTextOutlined,
      size === 'small' && styles.buttonTextSmall,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const IconButton = ({ icon, size = 24, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[styles.iconButton, style]}
    onPress={onPress}
    {...props}
  >
    <MaterialIcons name={icon} size={size} color="#666" />
  </TouchableOpacity>
);

const Chip = ({ children, mode = 'outlined', textStyle, style, ...props }: any) => (
  <View
    style={[
      styles.chip,
      mode === 'outlined' && styles.chipOutlined,
      mode === 'flat' && styles.chipFlat,
      style,
    ]}
    {...props}
  >
    <Text style={[
      styles.chipText,
      textStyle,
      mode === 'flat' && styles.chipTextFlat,
    ]}>
      {children}
    </Text>
  </View>
);

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const ProgressBar = ({ progress, color, style, ...props }: any) => (
  <View style={[styles.progressBarContainer, style]} {...props}>
    <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
  </View>
);

const TeacherMetrics: React.FC = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherPerformance | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState<{ field: string; ascending: boolean }>({ field: 'rating', ascending: false });
  const [page, setPage] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Simulated data - replace with actual API calls
  const teachers: TeacherPerformance[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      department: 'Mathematics',
      rating: 4.8,
      studentSatisfaction: 92,
      attendanceRate: 95,
      coursesCount: 4,
      activeStudents: 120,
      completionRate: 94,
      averageGrade: 85,
      lastEvaluation: '2023-12-01',
      performanceHistory: [4.5, 4.6, 4.7, 4.8, 4.8, 4.9],
      achievements: ['Best Teacher 2023', 'Research Excellence Award'],
      specializations: ['Calculus', 'Linear Algebra', 'Statistics'],
      status: 'excellent'
    },
    // Add more teachers...
  ];

  const departments: DepartmentPerformance[] = [
    {
      name: 'Mathematics',
      averageRating: 4.5,
      teacherCount: 12,
      studentCount: 450,
      courseCount: 25,
      performanceHistory: [4.3, 4.4, 4.5, 4.5, 4.6, 4.5]
    },
    // Add more departments...
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return '#007AFF';
      case 'good':
        return '#4CAF50';
      case 'average':
        return '#FF9800';
      case 'needsImprovement':
        return '#F44336';
      default:
        return '#007AFF';
    }
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const renderPerformanceChart = (teacher: TeacherPerformance) => {
    const screenWidth = Dimensions.get('window').width - 40;
    const chartHeight = 220;

    const data = {
      labels: ['6m ago', '5m ago', '4m ago', '3m ago', '2m ago', '1m ago'],
      datasets: [{
        data: teacher.performanceHistory,
        color: (opacity = 1) => getStatusColor(teacher.status),
        strokeWidth: 2
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Performance Trend</Text>
        <LineChart
          data={data}
          width={screenWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderDepartmentChart = () => {
    const screenWidth = Dimensions.get('window').width - 40;
    const chartHeight = 220;

    const data = {
      labels: departments.map(d => d.name),
      datasets: [{
        data: departments.map(d => d.averageRating)
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Department Performance</Text>
        <BarChart
          data={data}
          width={screenWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>
    );
  };

  const renderTeacherModal = () => {
    if (!selectedTeacher) return null;

    return (
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedTeacher.name}</Text>
                  <Text style={styles.department}>
                    {selectedTeacher.department}
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setShowModal(false)}
                />
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{selectedTeacher.rating.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Overall Rating</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{`${selectedTeacher.studentSatisfaction}%`}</Text>
                  <Text style={styles.statLabel}>Student Satisfaction</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{selectedTeacher.activeStudents}</Text>
                  <Text style={styles.statLabel}>Active Students</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{`${selectedTeacher.completionRate}%`}</Text>
                  <Text style={styles.statLabel}>Completion Rate</Text>
                </View>
              </View>

              {renderPerformanceChart(selectedTeacher)}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <View style={styles.achievementsList}>
                  {selectedTeacher.achievements.map((achievement, index) => (
                    <Chip key={index} mode="flat" style={styles.achievementChip}>
                      {achievement}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Specializations</Text>
                <View style={styles.specializationsList}>
                  {selectedTeacher.specializations.map((spec, index) => (
                    <Chip key={index} mode="outlined" style={styles.specializationChip}>
                      {spec}
                    </Chip>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <CardContent>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Teacher Performance Metrics</Text>
              <Text style={styles.subtitle}>Comprehensive teacher evaluation and analytics</Text>
            </View>
            <View style={styles.headerActions}>
              <IconButton
                icon="filter-list"
                size={24}
                onPress={() => setMenuVisible(!menuVisible)}
              />
              <IconButton
                icon="refresh"
                size={24}
                onPress={() => {
                  // TODO: Implement refresh functionality
                  console.log('Refresh teacher metrics');
                }}
              />
            </View>
          </View>
        </CardContent>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="people" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>{teachers.length}</Text>
            </View>
            <Text style={styles.statLabel}>Total Teachers</Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="star" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>
                {(teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length).toFixed(1)}
              </Text>
            </View>
            <Text style={styles.statLabel}>Average Rating</Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="school" size={24} color="#9C27B0" />
              <Text style={styles.statNumber}>{departments.length}</Text>
            </View>
            <Text style={styles.statLabel}>Departments</Text>
          </CardContent>
        </Card>
      </View>

      <Card style={styles.chartCard}>
        <CardContent>
          {renderDepartmentChart()}
        </CardContent>
      </Card>

      <Card style={styles.teachersCard}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Performing Teachers</Text>
            <Button mode="outlined" size="small" onPress={() => {
              // TODO: Implement view all teachers functionality
              console.log('View all teachers');
            }}>
              View All
            </Button>
          </View>
          
          <ScrollView style={styles.teachersList}>
            {teachers.map((teacher) => (
              <TouchableOpacity
                key={teacher.id}
                style={styles.teacherItem}
                onPress={() => {
                  setSelectedTeacher(teacher);
                  setShowModal(true);
                }}
              >
                <View style={styles.teacherHeader}>
                  <View style={styles.teacherInfo}>
                    <Text style={styles.teacherName}>{teacher.name}</Text>
                    <Text style={styles.teacherDepartment}>{teacher.department}</Text>
                  </View>
                  <View style={styles.teacherRating}>
                    <Text style={styles.ratingText}>{teacher.rating.toFixed(1)}</Text>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                  </View>
                </View>
                
                <View style={styles.teacherStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statItemLabel}>Satisfaction</Text>
                    <ProgressBar progress={teacher.studentSatisfaction / 100} color="#4CAF50" />
                    <Text style={styles.statItemValue}>{teacher.studentSatisfaction}%</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statItemLabel}>Completion</Text>
                    <ProgressBar progress={teacher.completionRate / 100} color="#007AFF" />
                    <Text style={styles.statItemValue}>{teacher.completionRate}%</Text>
                  </View>
                </View>
                
                <Chip mode="flat" style={[styles.statusChip, { backgroundColor: getStatusColor(teacher.status) }]}>
                  {teacher.status}
                </Chip>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </CardContent>
      </Card>

      {renderTeacherModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  teachersCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#333',
  },
  teachersList: {
    maxHeight: 400,
  },
  teacherItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teacherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  teacherDepartment: {
    fontSize: 14,
    color: '#666',
  },
  teacherRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  teacherStats: {
    marginBottom: 12,
  },
  statItem: {
    marginBottom: 8,
  },
  statItemLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  department: {
    fontSize: 16,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  achievementChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  specializationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specializationChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  // Custom component styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minHeight: 36,
  },
  buttonContained: {
    backgroundColor: '#007AFF',
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextContained: {
    color: '#fff',
  },
  buttonTextOutlined: {
    color: '#007AFF',
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  buttonIcon: {
    marginRight: 4,
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  chipOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  chipFlat: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextFlat: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default TeacherMetrics;
