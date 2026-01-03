import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 400;

const GradesManagement: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('1');

  const dummyClasses = [
    { id: '1', name: 'Advanced Mathematics', totalStudents: 32, avgGrade: 87.5, highestGrade: 98, lowestGrade: 72 },
    { id: '2', name: 'Quantum Physics', totalStudents: 28, avgGrade: 84.2, highestGrade: 96, lowestGrade: 68 },
    { id: '3', name: 'World Literature', totalStudents: 35, avgGrade: 89.1, highestGrade: 97, lowestGrade: 75 },
    { id: '4', name: 'Data Science & AI', totalStudents: 30, avgGrade: 86.8, highestGrade: 99, lowestGrade: 70 },
    { id: '5', name: 'Environmental Science', totalStudents: 33, avgGrade: 82.9, highestGrade: 95, lowestGrade: 65 }
  ];

  const dummyStudents = [
    { id: '1', name: 'Sarah Chen', rollNo: '001', assignments: [92, 88, 95, 89, 91], avgGrade: 91.0, status: 'excellent' },
    { id: '2', name: 'Michael Rodriguez', rollNo: '002', assignments: [85, 82, 88, 90, 87], avgGrade: 86.4, status: 'good' },
    { id: '3', name: 'Emily Watson', rollNo: '003', assignments: [78, 85, 82, 88, 85], avgGrade: 83.6, status: 'good' },
    { id: '4', name: 'David Kim', rollNo: '004', assignments: [95, 92, 89, 94, 96], avgGrade: 93.2, status: 'excellent' },
    { id: '5', name: 'Lisa Thompson', rollNo: '005', assignments: [72, 75, 78, 80, 76], avgGrade: 76.2, status: 'needs_improvement' }
  ];

  const selectedClassData = dummyClasses.find(c => c.id === selectedClass);

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return '#10b981';
    if (grade >= 80) return '#3b82f6';
    if (grade >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'needs_improvement': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'needs_improvement': return 'Needs Improvement';
      default: return status;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, isSmallScreen && styles.titleSmall]}>Grades Management</Text>
        <Text style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}>
          Track and manage student grades across all classes
        </Text>
      </View>

      <View style={styles.classSelector}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Select Class</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dummyClasses.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={[styles.classCard, selectedClass === classItem.id && styles.classCardSelected]}
              onPress={() => setSelectedClass(classItem.id)}
            >
              <Text style={styles.className}>{classItem.name}</Text>
              <Text style={styles.classStats}>{classItem.totalStudents} students</Text>
              <Text style={styles.avgGrade}>{classItem.avgGrade}% avg</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedClassData && (
        <View style={styles.gradesSummary}>
          <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Class Performance</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <MaterialIcons name="people" size={isSmallScreen ? 20 : 24} color="#6366f1" />
              <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>{selectedClassData.totalStudents}</Text>
              <Text style={[styles.summaryLabel, isSmallScreen && styles.summaryLabelSmall]}>Students</Text>
            </View>
            <View style={styles.summaryCard}>
              <MaterialIcons name="trending-up" size={isSmallScreen ? 20 : 24} color="#10b981" />
              <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>{selectedClassData.avgGrade}%</Text>
              <Text style={[styles.summaryLabel, isSmallScreen && styles.summaryLabelSmall]}>Average</Text>
            </View>
            <View style={styles.summaryCard}>
              <MaterialIcons name="star" size={isSmallScreen ? 20 : 24} color="#f59e0b" />
              <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>{selectedClassData.highestGrade}%</Text>
              <Text style={[styles.summaryLabel, isSmallScreen && styles.summaryLabelSmall]}>Highest</Text>
            </View>
            <View style={styles.summaryCard}>
              <MaterialIcons name="info" size={isSmallScreen ? 20 : 24} color="#ef4444" />
              <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>{selectedClassData.lowestGrade}%</Text>
              <Text style={[styles.summaryLabel, isSmallScreen && styles.summaryLabelSmall]}>Lowest</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.studentsList}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Student Grades</Text>
        {dummyStudents.map((student) => (
          <View key={student.id} style={[styles.studentCard, isSmallScreen && styles.studentCardSmall]}>
            <View style={styles.studentHeader}>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, isSmallScreen && styles.studentNameSmall]}>{student.name}</Text>
                <Text style={[styles.studentRoll, isSmallScreen && styles.studentRollSmall]}>Roll: {student.rollNo}</Text>
              </View>
              <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(student.avgGrade) }]}>
                <Text style={styles.gradeText}>{student.avgGrade}%</Text>
              </View>
            </View>
            
            <View style={styles.assignmentsRow}>
              <Text style={styles.assignmentsLabel}>Assignments:</Text>
              <View style={styles.gradePills}>
                {student.assignments.map((grade, index) => (
                  <View key={index} style={[styles.gradePill, { backgroundColor: getGradeColor(grade) }]}>
                    <Text style={styles.gradePillText}>{grade}%</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.studentFooter}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(student.status) }]}>
                <Text style={styles.statusText}>{getStatusText(student.status)}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="edit" size={16} color="#6366f1" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="visibility" size={16} color="#10b981" />
                  <Text style={styles.actionText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="notifications" size={16} color="#f59e0b" />
                  <Text style={styles.actionText}>Notify</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Quick Actions</Text>
        <View style={[styles.actionGrid, isSmallScreen && styles.actionGridSmall]}>
          <TouchableOpacity style={[styles.quickActionButton, isSmallScreen && styles.quickActionButtonSmall]}>
            <MaterialIcons name="file-download" size={isSmallScreen ? 20 : 24} color="#6366f1" />
            <Text style={[styles.actionText, isSmallScreen && styles.actionTextSmall]}>Export Grades</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, isSmallScreen && styles.quickActionButtonSmall]}>
            <MaterialIcons name="assessment" size={isSmallScreen ? 20 : 24} color="#10b981" />
            <Text style={[styles.actionText, isSmallScreen && styles.actionTextSmall]}>Generate Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, isSmallScreen && styles.quickActionButtonSmall]}>
            <MaterialIcons name="notifications" size={isSmallScreen ? 20 : 24} color="#f59e0b" />
            <Text style={[styles.actionText, isSmallScreen && styles.actionTextSmall]}>Send Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, isSmallScreen && styles.quickActionButtonSmall]}>
            <MaterialIcons name="settings" size={isSmallScreen ? 20 : 24} color="#8b5cf6" />
            <Text style={[styles.actionText, isSmallScreen && styles.actionTextSmall]}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  titleSmall: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 26,
  },
  subtitleSmall: {
    fontSize: 16,
  },
  classSelector: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  sectionTitleSmall: {
    fontSize: 18,
  },
  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 180,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  classCardSelected: {
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  classStats: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  avgGrade: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  gradesSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  summaryCard: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  summaryValueSmall: {
    fontSize: 20,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryLabelSmall: {
    fontSize: 12,
  },
  studentsList: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  studentCardSmall: {
    padding: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  studentNameSmall: {
    fontSize: 16,
  },
  studentRoll: {
    fontSize: 14,
    color: '#6B7280',
  },
  studentRollSmall: {
    fontSize: 12,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  assignmentsRow: {
    marginBottom: 12,
  },
  assignmentsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  gradePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gradePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  studentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 4,
  },
  quickActions: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  actionGridSmall: {
    flexDirection: 'column',
  },
  quickActionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    width: '45%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionButtonSmall: {
    width: '100%',
    margin: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  actionTextSmall: {
    fontSize: 12,
  },
});

export default GradesManagement;
