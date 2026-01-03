import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Text, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

interface StudentPerformance {
  id: string;
  name: string;
  grade: string;
  gpa: number;
  attendance: number;
  completedAssignments: number;
  totalAssignments: number;
  lastActivity: string;
  performanceHistory: number[];
  subjects: Array<{
    name: string;
    grade: number;
    progress: number;
    status: 'excellent' | 'good' | 'needsImprovement';
  }>;
  achievements: string[];
  extracurriculars: string[];
  status: 'active' | 'inactive' | 'graduated' | 'onLeave';
}

interface EnrollmentTrend {
  month: string;
  newEnrollments: number;
  totalStudents: number;
  graduations: number;
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

const Searchbar = ({ placeholder, value, onChangeText, style, ...props }: any) => (
  <View style={[styles.searchbarContainer, style]}>
    <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
    <TextInput
      style={styles.searchbarInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const ProgressBar = ({ progress, color, style, ...props }: any) => (
  <View style={[styles.progressBarContainer, style]} {...props}>
    <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
  </View>
);

const StudentMetrics: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('3m');
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState<{ field: string; ascending: boolean }>({ field: 'gpa', ascending: false });
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Simulated data - replace with actual API calls
  const students: StudentPerformance[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      grade: '12th',
      gpa: 3.95,
      attendance: 98,
      completedAssignments: 45,
      totalAssignments: 48,
      lastActivity: '2024-01-15',
      performanceHistory: [3.8, 3.85, 3.9, 3.92, 3.95, 3.95],
      subjects: [
        { name: 'Mathematics', grade: 95, progress: 92, status: 'excellent' },
        { name: 'Physics', grade: 88, progress: 85, status: 'good' },
        { name: 'Literature', grade: 92, progress: 88, status: 'excellent' }
      ],
      achievements: ['Honor Roll', 'Science Fair Winner', 'Perfect Attendance'],
      extracurriculars: ['Debate Club', 'Math Team', 'Student Council'],
      status: 'active'
    },
    // Add more students...
  ];

  const enrollmentTrends: EnrollmentTrend[] = [
    {
      month: 'Jan',
      newEnrollments: 25,
      totalStudents: 450,
      graduations: 0
    },
    // Add more months...
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return '#007AFF';
      case 'good':
        return '#4CAF50';
      case 'needsImprovement':
        return '#F44336';
      default:
        return '#007AFF';
    }
  };

  const getStudentStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'inactive':
        return '#FF9800';
      case 'graduated':
        return '#007AFF';
      case 'onLeave':
        return '#9E9E9E';
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

  const renderEnrollmentTrends = () => {
    const screenWidth = Dimensions.get('window').width - 40;
    const chartHeight = 220;

    const data = {
      labels: enrollmentTrends.map(trend => trend.month),
      datasets: [
        {
          data: enrollmentTrends.map(trend => trend.newEnrollments),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: enrollmentTrends.map(trend => trend.graduations),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Enrollment Trends</Text>
        <LineChart
          data={data}
          width={screenWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          legend={['New Enrollments', 'Graduations']}
        />
      </View>
    );
  };

  const renderPerformanceDistribution = () => {
    const screenWidth = Dimensions.get('window').width - 40;
    const chartHeight = 220;

    const performanceRanges = [
      { name: '3.5-4.0', count: students.filter(s => s.gpa >= 3.5).length },
      { name: '3.0-3.49', count: students.filter(s => s.gpa >= 3.0 && s.gpa < 3.5).length },
      { name: '2.5-2.99', count: students.filter(s => s.gpa >= 2.5 && s.gpa < 3.0).length },
      { name: '2.0-2.49', count: students.filter(s => s.gpa >= 2.0 && s.gpa < 2.5).length },
      { name: 'Below 2.0', count: students.filter(s => s.gpa < 2.0).length }
    ];

    const data = {
      labels: performanceRanges.map(range => range.name),
      datasets: [{
        data: performanceRanges.map(range => range.count)
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>GPA Distribution</Text>
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

  const renderStudentModal = () => {
    if (!selectedStudent) return null;

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
                  <Text style={styles.modalTitle}>{selectedStudent.name}</Text>
                  <Text style={styles.modalSubtitle}>{selectedStudent.grade} Grade</Text>
                </View>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setShowModal(false)}
                />
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{selectedStudent.gpa.toFixed(2)}</Text>
                  <Text style={styles.statLabel}>GPA</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{selectedStudent.attendance}%</Text>
                  <Text style={styles.statLabel}>Attendance</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{selectedStudent.completedAssignments}/{selectedStudent.totalAssignments}</Text>
                  <Text style={styles.statLabel}>Assignments</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{selectedStudent.subjects.length}</Text>
                  <Text style={styles.statLabel}>Subjects</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Subject Performance</Text>
                {selectedStudent.subjects.map((subject, index) => (
                  <View key={index} style={styles.subjectItem}>
                    <View style={styles.subjectHeader}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={styles.subjectGrade}>{subject.grade}%</Text>
                    </View>
                    <ProgressBar progress={subject.progress / 100} color={getStatusColor(subject.status)} />
                    <Chip mode="flat" style={[styles.statusChip, { backgroundColor: getStatusColor(subject.status) }]}>
                      {subject.status}
                    </Chip>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <View style={styles.achievementsList}>
                  {selectedStudent.achievements.map((achievement, index) => (
                    <Chip key={index} mode="flat" style={styles.achievementChip}>
                      {achievement}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Extracurricular Activities</Text>
                <View style={styles.extracurricularsList}>
                  {selectedStudent.extracurriculars.map((activity, index) => (
                    <Chip key={index} mode="outlined" style={styles.extracurricularChip}>
                      {activity}
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
              <Text style={styles.title}>Student Performance Metrics</Text>
              <Text style={styles.subtitle}>Comprehensive student analytics and insights</Text>
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
                  console.log('Refresh student metrics');
                }}
              />
            </View>
          </View>
          
          <Searchbar
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
          />
        </CardContent>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="people" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>{students.length}</Text>
            </View>
            <Text style={styles.statLabel}>Total Students</Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="star" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>
                {(students.reduce((sum, s) => sum + s.gpa, 0) / students.length).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.statLabel}>Average GPA</Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="school" size={24} color="#9C27B0" />
              <Text style={styles.statNumber}>
                {students.filter(s => s.status === 'active').length}
              </Text>
            </View>
            <Text style={styles.statLabel}>Active Students</Text>
          </CardContent>
        </Card>
      </View>

      <Card style={styles.chartCard}>
        <CardContent>
          {renderEnrollmentTrends()}
        </CardContent>
      </Card>

      <Card style={styles.chartCard}>
        <CardContent>
          {renderPerformanceDistribution()}
        </CardContent>
      </Card>

      <Card style={styles.studentsCard}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Performing Students</Text>
            <Button mode="outlined" size="small" onPress={() => {
              // TODO: Implement view all students functionality
              console.log('View all students');
            }}>
              View All
            </Button>
          </View>
          
          <ScrollView style={styles.studentsList}>
            {students.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={styles.studentItem}
                onPress={() => {
                  setSelectedStudent(student);
                  setShowModal(true);
                }}
              >
                <View style={styles.studentHeader}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentGrade}>{student.grade} Grade</Text>
                  </View>
                  <View style={styles.studentGPA}>
                    <Text style={styles.gpaText}>{student.gpa.toFixed(2)}</Text>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                  </View>
                </View>
                
                <View style={styles.studentStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statItemLabel}>Attendance</Text>
                    <ProgressBar progress={student.attendance / 100} color="#4CAF50" />
                    <Text style={styles.statItemValue}>{student.attendance}%</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statItemLabel}>Assignments</Text>
                    <ProgressBar progress={student.completedAssignments / student.totalAssignments} color="#007AFF" />
                    <Text style={styles.statItemValue}>{student.completedAssignments}/{student.totalAssignments}</Text>
                  </View>
                </View>
                
                <Chip mode="flat" style={[styles.statusChip, { backgroundColor: getStudentStatusColor(student.status) }]}>
                  {student.status}
                </Chip>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </CardContent>
      </Card>

      {renderStudentModal()}
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
    marginBottom: 16,
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
  searchBar: {
    marginTop: 8,
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
  studentsCard: {
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
  studentsList: {
    maxHeight: 400,
  },
  studentItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  studentGrade: {
    fontSize: 14,
    color: '#666',
  },
  studentGPA: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  studentStats: {
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
  modalSubtitle: {
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
  subjectItem: {
    marginBottom: 16,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  subjectGrade: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  achievementChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  extracurricularsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  extracurricularChip: {
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
  searchbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchbarInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
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

export default StudentMetrics;
