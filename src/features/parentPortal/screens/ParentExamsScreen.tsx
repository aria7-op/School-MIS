import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { theme } from '../../../theme';
import ExamSchedule from '../components/ExamSchedule';
import GradeReport from '../components/GradeReport';

const { width } = Dimensions.get('window');

interface ParentExamsScreenProps {
  parentData?: any;
  onRefresh?: () => void;
}

const ParentExamsScreen: React.FC<ParentExamsScreenProps> = ({ 
  parentData, 
  onRefresh 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('upcoming');

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleExamDetails = (examId: string) => {
    Alert.alert(
      'Exam Details',
      'Detailed exam information will be displayed here.',
      [{ text: 'OK' }]
    );
  };

  // Mock data for demonstration
  const mockParentData = {
    students: [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        grade: '10th Grade',
        class: 'Class A',
        status: 'Active'
      }
    ]
  };

  const data = parentData || mockParentData;

  const periods = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'recent', label: 'Recent' },
    { key: 'completed', label: 'Completed' }
  ];

  // Mock exam data
  const mockExamData = {
    upcomingExams: [
      {
        id: '1',
        subject: 'Mathematics',
        examType: 'Mid-Term',
        date: '2024-02-20',
        time: '9:00 AM',
        duration: '2 hours',
        room: 'Room 101',
        status: 'Scheduled'
      },
      {
        id: '2',
        subject: 'Physics',
        examType: 'Unit Test',
        date: '2024-02-25',
        time: '10:30 AM',
        duration: '1 hour',
        room: 'Lab 2',
        status: 'Scheduled'
      }
    ],
    recentExams: [
      {
        id: '3',
        subject: 'English',
        examType: 'Quiz',
        date: '2024-02-10',
        time: '11:00 AM',
        duration: '45 minutes',
        room: 'Room 105',
        status: 'Completed',
        score: 85,
        totalMarks: 100
      }
    ],
    completedExams: [
      {
        id: '4',
        subject: 'History',
        examType: 'Final',
        date: '2024-01-15',
        time: '2:00 PM',
        duration: '3 hours',
        room: 'Room 103',
        status: 'Completed',
        score: 92,
        totalMarks: 100
      },
      {
        id: '5',
        subject: 'Chemistry',
        examType: 'Lab Test',
        date: '2024-01-10',
        time: '1:00 PM',
        duration: '2 hours',
        room: 'Lab 1',
        status: 'Completed',
        score: 88,
        totalMarks: 100
      }
    ]
  };

  const getExamData = () => {
    switch (selectedPeriod) {
      case 'upcoming':
        return mockExamData.upcomingExams;
      case 'recent':
        return mockExamData.recentExams;
      case 'completed':
        return mockExamData.completedExams;
      default:
        return [];
    }
  };

  const getAverageScore = () => {
    const completedExams = mockExamData.completedExams;
    if (completedExams.length === 0) return 0;
    
    const totalScore = completedExams.reduce((sum, exam) => sum + exam.score, 0);
    return Math.round(totalScore / completedExams.length);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Academic Performance</Text>
        <Text style={styles.headerSubtitle}>Track your child's exams and grades</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Student Selection */}
        <View style={styles.studentSelector}>
          <Text style={styles.sectionTitle}>Select Student</Text>
          {data.students.map((student: any) => (
            <TouchableOpacity
              key={student.id}
              style={[
                styles.studentCard,
                selectedStudent === student.id && styles.selectedStudentCard
              ]}
              onPress={() => handleStudentSelect(student.id)}
            >
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>
                  {student.firstName} {student.lastName}
                </Text>
                <Text style={styles.studentDetails}>
                  {student.grade} • {student.class}
                </Text>
                <Text style={styles.studentStatus}>{student.status}</Text>
              </View>
              {selectedStudent === student.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Academic Overview */}
        {selectedStudent && (
          <View style={styles.academicOverview}>
            <Text style={styles.sectionTitle}>Academic Overview</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewNumber}>{mockExamData.completedExams.length}</Text>
                <Text style={styles.overviewLabel}>Exams Taken</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewNumber}>{mockExamData.upcomingExams.length}</Text>
                <Text style={styles.overviewLabel}>Upcoming</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewNumber}>{getAverageScore()}%</Text>
                <Text style={styles.overviewLabel}>Average Score</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewNumber}>A</Text>
                <Text style={styles.overviewLabel}>Current Grade</Text>
              </View>
            </View>
          </View>
        )}

        {/* Period Selection */}
        {selectedStudent && (
          <View style={styles.periodSelector}>
            <Text style={styles.sectionTitle}>Select Period</Text>
            <View style={styles.periodButtons}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.key && styles.selectedPeriodButton
                  ]}
                  onPress={() => handlePeriodSelect(period.key)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period.key && styles.selectedPeriodButtonText
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Exam List */}
        {selectedStudent && (
          <View style={styles.examListSection}>
            <Text style={styles.sectionTitle}>
              {selectedPeriod === 'upcoming' ? 'Upcoming Exams' : 
               selectedPeriod === 'recent' ? 'Recent Exams' : 'Completed Exams'}
            </Text>
            {getExamData().map((exam) => (
              <TouchableOpacity
                key={exam.id}
                style={styles.examCard}
                onPress={() => handleExamDetails(exam.id)}
              >
                <View style={styles.examHeader}>
                  <View style={styles.examSubject}>
                    <Text style={styles.subjectText}>{exam.subject}</Text>
                    <Text style={styles.examTypeText}>{exam.examType}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    exam.status === 'Completed' ? styles.completedBadge : 
                    exam.status === 'Scheduled' ? styles.scheduledBadge : styles.recentBadge
                  ]}>
                    <Text style={styles.statusBadgeText}>{exam.status}</Text>
                  </View>
                </View>
                
                <View style={styles.examDetails}>
                  <View style={styles.examDetailItem}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{exam.date}</Text>
                  </View>
                  <View style={styles.examDetailItem}>
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>{exam.time}</Text>
                  </View>
                  <View style={styles.examDetailItem}>
                    <Text style={styles.detailLabel}>Duration:</Text>
                    <Text style={styles.detailValue}>{exam.duration}</Text>
                  </View>
                  <View style={styles.examDetailItem}>
                    <Text style={styles.detailLabel}>Room:</Text>
                    <Text style={styles.detailValue}>{exam.room}</Text>
                  </View>
                </View>

                {exam.status === 'Completed' && exam.score !== undefined && (
                  <View style={styles.scoreSection}>
                    <Text style={styles.scoreLabel}>Score:</Text>
                    <Text style={styles.scoreValue}>
                      {exam.score}/{exam.totalMarks} ({Math.round((exam.score / exam.totalMarks) * 100)}%)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Exam Schedule Component */}
        {selectedStudent && (
          <View style={styles.examScheduleSection}>
            <Text style={styles.sectionTitle}>Exam Calendar</Text>
            <ExamSchedule
              student={data.students.find((s: any) => s.id === selectedStudent)}
              parentData={data}
            />
          </View>
        )}

        {/* Grade Report Component */}
        {selectedStudent && (
          <View style={styles.gradeReportSection}>
            <Text style={styles.sectionTitle}>Grade Report</Text>
            <GradeReport
              student={data.students.find((s: any) => s.id === selectedStudent)}
              parentData={data}
            />
          </View>
        )}

        {/* Study Tips */}
        <View style={styles.studyTipsSection}>
          <Text style={styles.sectionTitle}>Study Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>📚</Text>
              <Text style={styles.tipTitle}>Create a Study Schedule</Text>
              <Text style={styles.tipDescription}>
                Plan your study time in advance and stick to a consistent routine.
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>🧠</Text>
              <Text style={styles.tipTitle}>Practice Active Recall</Text>
              <Text style={styles.tipDescription}>
                Test yourself regularly instead of just re-reading material.
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>⏰</Text>
              <Text style={styles.tipTitle}>Take Regular Breaks</Text>
              <Text style={styles.tipDescription}>
                Study in focused 25-minute sessions with 5-minute breaks.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  studentSelector: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: theme.colors.text,
  },
  studentCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedStudentCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: theme.colors.text,
  },
  studentDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 3,
  },
  studentStatus: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '500',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  academicOverview: {
    padding: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  overviewLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  periodSelector: {
    padding: 20,
  },
  periodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: 'white',
  },
  examListSection: {
    padding: 20,
  },
  examCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  examSubject: {
    flex: 1,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 3,
  },
  examTypeText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scheduledBadge: {
    backgroundColor: theme.colors.warning,
  },
  recentBadge: {
    backgroundColor: theme.colors.info,
  },
  completedBadge: {
    backgroundColor: theme.colors.success,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  examDetails: {
    marginBottom: 15,
  },
  examDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  scoreSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  examScheduleSection: {
    padding: 20,
  },
  gradeReportSection: {
    padding: 20,
  },
  studyTipsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  tipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tipCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  tipDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ParentExamsScreen; 