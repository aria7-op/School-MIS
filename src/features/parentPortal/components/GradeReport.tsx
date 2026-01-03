import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../../theme';

interface Grade {
  id: string;
  subject: string;
  assignment: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  date: string;
  type: 'assignment' | 'quiz' | 'exam' | 'project';
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  class: string;
  status: string;
}

interface GradeReportProps {
  student?: Student;
  parentData?: any;
}

const GradeReport: React.FC<GradeReportProps> = ({ student, parentData }) => {
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return theme.colors.success;
    if (percentage >= 80) return theme.colors.primary;
    if (percentage >= 70) return theme.colors.warning;
    if (percentage >= 60) return theme.colors.info;
    return theme.colors.error;
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'assignment';
      case 'quiz':
        return 'quiz';
      case 'exam':
        return 'school';
      case 'project':
        return 'work';
      default:
        return 'grade';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return theme.colors.primary;
      case 'quiz':
        return theme.colors.info;
      case 'exam':
        return theme.colors.warning;
      case 'project':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  // Mock grade data - in real app, this would come from props or API
  const mockGrades: Grade[] = [
    {
      id: '1',
      subject: 'Mathematics',
      assignment: 'Algebra Quiz 1',
      score: 18,
      maxScore: 20,
      percentage: 90,
      grade: 'A',
      date: '2024-02-15',
      type: 'quiz'
    },
    {
      id: '2',
      subject: 'Physics',
      assignment: 'Mechanics Lab Report',
      score: 45,
      maxScore: 50,
      percentage: 90,
      grade: 'A',
      date: '2024-02-10',
      type: 'project'
    },
    {
      id: '3',
      subject: 'English',
      assignment: 'Essay Writing',
      score: 38,
      maxScore: 40,
      percentage: 95,
      grade: 'A',
      date: '2024-02-08',
      type: 'assignment'
    },
    {
      id: '4',
      subject: 'History',
      assignment: 'Mid-Term Exam',
      score: 42,
      maxScore: 50,
      percentage: 84,
      grade: 'B',
      date: '2024-02-05',
      type: 'exam'
    },
    {
      id: '5',
      subject: 'Chemistry',
      assignment: 'Chemical Reactions',
      score: 16,
      maxScore: 20,
      percentage: 80,
      grade: 'B',
      date: '2024-02-01',
      type: 'quiz'
    }
  ];

  const grades = mockGrades; // Use mock data for now

  const calculateOverallAverage = () => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((sum, grade) => sum + grade.percentage, 0);
    return Math.round(total / grades.length);
  };

  const getSubjectGrades = (subject: string) => {
    return grades.filter(grade => grade.subject === subject);
  };

  const getSubjectAverage = (subject: string) => {
    const subjectGrades = getSubjectGrades(subject);
    if (subjectGrades.length === 0) return 0;
    const total = subjectGrades.reduce((sum, grade) => sum + grade.percentage, 0);
    return Math.round(total / subjectGrades.length);
  };

  const uniqueSubjects = [...new Set(grades.map(grade => grade.subject))];

  const GradeCard = ({ grade }: { grade: Grade }) => (
    <TouchableOpacity style={styles.gradeCard}>
      <View style={styles.gradeHeader}>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName}>{grade.subject}</Text>
          <Text style={styles.assignmentName}>{grade.assignment}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: getGradeColor(grade.percentage) }]}>
            {grade.score}/{grade.maxScore}
          </Text>
          <Text style={[styles.percentage, { color: getGradeColor(grade.percentage) }]}>
            {grade.percentage}%
          </Text>
        </View>
      </View>
      
      <View style={styles.gradeFooter}>
        <View style={styles.typeBadge}>
          <MaterialIcons 
            name={getTypeIcon(grade.type) as any} 
            size={16} 
            color={getTypeColor(grade.type)} 
          />
          <Text style={[styles.typeText, { color: getTypeColor(grade.type) }]}>
            {grade.type.charAt(0).toUpperCase() + grade.type.slice(1)}
          </Text>
        </View>
        
        <View style={styles.gradeBadge}>
          <Text style={[styles.gradeLetter, { color: getGradeColor(grade.percentage) }]}>
            {grade.grade}
          </Text>
        </View>
        
        <Text style={styles.dateText}>{grade.date}</Text>
      </View>
    </TouchableOpacity>
  );

  const SubjectSummary = ({ subject }: { subject: string }) => {
    const subjectGrades = getSubjectGrades(subject);
    const average = getSubjectAverage(subject);
    
    return (
      <View style={styles.subjectSummary}>
        <View style={styles.subjectHeader}>
          <Text style={styles.subjectTitle}>{subject}</Text>
          <View style={styles.averageContainer}>
            <Text style={[styles.averageScore, { color: getGradeColor(average) }]}>
              {average}%
            </Text>
            <Text style={styles.averageLabel}>Average</Text>
          </View>
        </View>
        
        <View style={styles.gradesList}>
          {subjectGrades.map((grade) => (
            <GradeCard key={grade.id} grade={grade} />
          ))}
        </View>
      </View>
    );
  };

  const overallAverage = calculateOverallAverage();

  return (
    <View style={styles.container}>
      {/* Overall Performance Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Overall Performance</Text>
        <View style={styles.summaryContent}>
          <View style={styles.averageDisplay}>
            <Text style={[styles.overallAverage, { color: getGradeColor(overallAverage) }]}>
              {overallAverage}%
            </Text>
            <Text style={styles.overallLabel}>Class Average</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{grades.length}</Text>
              <Text style={styles.statLabel}>Total Grades</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{uniqueSubjects.length}</Text>
              <Text style={styles.statLabel}>Subjects</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {grades.filter(g => g.percentage >= 80).length}
              </Text>
              <Text style={styles.statLabel}>A's & B's</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Subject-wise Grades */}
      <View style={styles.subjectsSection}>
        <Text style={styles.sectionTitle}>Subject Performance</Text>
        {uniqueSubjects.map((subject) => (
          <SubjectSummary key={subject} subject={subject} />
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="analytics" size={24} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>View Detailed Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="trending-up" size={24} color={theme.colors.success} />
          <Text style={styles.actionButtonText}>Progress Trends</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageDisplay: {
    alignItems: 'center',
    marginRight: 24,
  },
  overallAverage: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overallLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statsGrid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  subjectsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  subjectSummary: {
    marginBottom: 20,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageScore: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  averageLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  gradesList: {
    gap: 8,
  },
  gradeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 12,
    elevation: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  assignmentName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '500',
  },
  gradeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },
  gradeLetter: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginLeft: 8,
  },
});

export default GradeReport; 