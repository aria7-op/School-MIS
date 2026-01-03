import React, { useState } from 'react';
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

interface Subject {
  id: string;
  name: string;
  code: string;
  teacher: string;
  currentGrade: string;
  previousGrade: string;
  assignments: number;
  completedAssignments: number;
  tests: number;
  completedTests: number;
  attendance: number;
  totalClasses: number;
}

interface AcademicProgressProps {
  subjects: Subject[];
  onViewSubjectDetails?: (subjectId: string) => void;
  onViewAssignments?: (subjectId: string) => void;
  onViewGrades?: (subjectId: string) => void;
}

const AcademicProgress: React.FC<AcademicProgressProps> = ({
  subjects,
  onViewSubjectDetails,
  onViewAssignments,
  onViewGrades,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous' | 'overall'>('current');

  const getGradeColor = (grade: string) => {
    const gradeValue = parseFloat(grade);
    if (gradeValue >= 90) return theme.colors.success;
    if (gradeValue >= 80) return theme.colors.info;
    if (gradeValue >= 70) return theme.colors.warning;
    return theme.colors.error;
  };

  const getGradeIcon = (grade: string) => {
    const gradeValue = parseFloat(grade);
    if (gradeValue >= 90) return 'star';
    if (gradeValue >= 80) return 'trending-up';
    if (gradeValue >= 70) return 'check-circle';
    return 'warning';
  };

  const calculateProgress = (completed: number, total: number) => {
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const SubjectCard = ({ subject }: { subject: Subject }) => (
    <View style={styles.subjectCard}>
      <View style={styles.subjectHeader}>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Text style={styles.subjectCode}>{subject.code}</Text>
          <Text style={styles.teacherName}>Teacher: {subject.teacher}</Text>
        </View>
        <View style={styles.gradeSection}>
          <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(subject.currentGrade) }]}>
            <MaterialIcons name={getGradeIcon(subject.currentGrade) as any} size={16} color={theme.colors.white} />
            <Text style={styles.gradeText}>{subject.currentGrade}%</Text>
          </View>
          {subject.previousGrade && (
            <Text style={styles.previousGrade}>Prev: {subject.previousGrade}%</Text>
          )}
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Assignments</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${calculateProgress(subject.completedAssignments, subject.assignments)}%`,
                  backgroundColor: theme.colors.primary
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {subject.completedAssignments}/{subject.assignments}
          </Text>
        </View>

        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Tests</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${calculateProgress(subject.completedTests, subject.tests)}%`,
                  backgroundColor: theme.colors.warning
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {subject.completedTests}/{subject.tests}
          </Text>
        </View>

        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>Attendance</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${calculateProgress(subject.attendance, subject.totalClasses)}%`,
                  backgroundColor: theme.colors.success
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {subject.attendance}/{subject.totalClasses}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onViewSubjectDetails?.(subject.id)}
        >
          <MaterialIcons name="info" size={16} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onViewAssignments?.(subject.id)}
        >
          <MaterialIcons name="assignment" size={16} color={theme.colors.warning} />
          <Text style={styles.actionButtonText}>Assignments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onViewGrades?.(subject.id)}
        >
          <MaterialIcons name="grade" size={16} color={theme.colors.info} />
          <Text style={styles.actionButtonText}>Grades</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'current' && styles.periodButtonActive
        ]}
        onPress={() => setSelectedPeriod('current')}
      >
        <Text style={[
          styles.periodButtonText,
          selectedPeriod === 'current' && styles.periodButtonTextActive
        ]}>
          Current Term
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'previous' && styles.periodButtonActive
        ]}
        onPress={() => setSelectedPeriod('previous')}
      >
        <Text style={[
          styles.periodButtonText,
          selectedPeriod === 'previous' && styles.periodButtonTextActive
        ]}>
          Previous Term
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'overall' && styles.periodButtonActive
        ]}
        onPress={() => setSelectedPeriod('overall')}
      >
        <Text style={[
          styles.periodButtonText,
          selectedPeriod === 'overall' && styles.periodButtonTextActive
        ]}>
          Overall
        </Text>
      </TouchableOpacity>
    </View>
  );

  const OverallStats = () => {
    const totalSubjects = subjects.length;
    const averageGrade = subjects.reduce((sum, subject) => sum + parseFloat(subject.currentGrade), 0) / totalSubjects;
    const improvingSubjects = subjects.filter(subject => 
      parseFloat(subject.currentGrade) > parseFloat(subject.previousGrade || '0')
    ).length;
    const completedAssignments = subjects.reduce((sum, subject) => sum + subject.completedAssignments, 0);
    const totalAssignments = subjects.reduce((sum, subject) => sum + subject.assignments, 0);

    return (
      <View style={styles.overallStats}>
        <Text style={styles.overallStatsTitle}>Overall Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{averageGrade.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Average Grade</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{improvingSubjects}</Text>
            <Text style={styles.statLabel}>Improving</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <PeriodSelector />
      
      <OverallStats />
      
      <View style={styles.subjectsSection}>
        <Text style={styles.sectionTitle}>Subject Performance</Text>
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: theme.colors.white,
  },
  overallStats: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  overallStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  subjectsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  subjectCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  gradeSection: {
    alignItems: 'flex-end',
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  gradeText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  previousGrade: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    width: 80,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    width: 40,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  actionButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
});

export default AcademicProgress; 