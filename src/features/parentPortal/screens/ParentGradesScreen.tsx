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
import AcademicProgress from '../components/AcademicProgress';

const { width } = Dimensions.get('window');

interface ParentGradesScreenProps {
  parentData?: any;
  onRefresh?: () => void;
}

const ParentGradesScreen: React.FC<ParentGradesScreenProps> = ({ 
  parentData, 
  onRefresh 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Academic Performance</Text>
        <Text style={styles.headerSubtitle}>Monitor your child's academic progress</Text>
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

        {/* Academic Progress */}
        {selectedStudent && (
          <View style={styles.academicSection}>
            <Text style={styles.sectionTitle}>Academic Progress</Text>
            <AcademicProgress
              student={data.students.find((s: any) => s.id === selectedStudent)}
              parentData={data}
            />
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>85%</Text>
              <Text style={styles.statLabel}>Overall Grade</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>92%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Subjects</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>A-</Text>
              <Text style={styles.statLabel}>Current Rank</Text>
            </View>
          </View>
        </View>

        {/* Recent Grades */}
        <View style={styles.recentGradesSection}>
          <Text style={styles.sectionTitle}>Recent Grades</Text>
          <View style={styles.gradeItem}>
            <View style={styles.subjectInfo}>
              <Text style={styles.subjectName}>Mathematics</Text>
              <Text style={styles.assignmentName}>Midterm Exam</Text>
            </View>
            <View style={styles.gradeInfo}>
              <Text style={styles.gradeScore}>92/100</Text>
              <Text style={styles.gradeLetter}>A-</Text>
            </View>
          </View>
          <View style={styles.gradeItem}>
            <View style={styles.subjectInfo}>
              <Text style={styles.subjectName}>English</Text>
              <Text style={styles.assignmentName}>Essay Assignment</Text>
            </View>
            <View style={styles.gradeInfo}>
              <Text style={styles.gradeScore}>88/100</Text>
              <Text style={styles.gradeLetter}>B+</Text>
            </View>
          </View>
          <View style={styles.gradeItem}>
            <View style={styles.subjectInfo}>
              <Text style={styles.subjectName}>Science</Text>
              <Text style={styles.assignmentName}>Lab Report</Text>
            </View>
            <View style={styles.gradeInfo}>
              <Text style={styles.gradeScore}>95/100</Text>
              <Text style={styles.gradeLetter}>A</Text>
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
  academicSection: {
    padding: 20,
  },
  statsSection: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  recentGradesSection: {
    padding: 20,
    paddingBottom: 40,
  },
  gradeItem: {
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
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
    color: theme.colors.text,
  },
  assignmentName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  gradeInfo: {
    alignItems: 'flex-end',
  },
  gradeScore: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 3,
  },
  gradeLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});

export default ParentGradesScreen; 