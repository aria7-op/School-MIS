import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 400;

const GradesScreen: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState('1');

  const dummySubjects = [
    { id: '1', name: 'Advanced Mathematics', totalStudents: 32, avgGrade: 87.5, highestGrade: 98, lowestGrade: 72, gradeDistribution: { A: 8, B: 12, C: 8, D: 3, F: 1 } },
    { id: '2', name: 'Quantum Physics', totalStudents: 28, avgGrade: 84.2, highestGrade: 96, lowestGrade: 68, gradeDistribution: { A: 6, B: 10, C: 9, D: 2, F: 1 } },
    { id: '3', name: 'World Literature', totalStudents: 35, avgGrade: 89.1, highestGrade: 97, lowestGrade: 75, gradeDistribution: { A: 10, B: 15, C: 7, D: 2, F: 1 } },
    { id: '4', name: 'Data Science & AI', totalStudents: 30, avgGrade: 86.8, highestGrade: 99, lowestGrade: 70, gradeDistribution: { A: 7, B: 11, C: 8, D: 3, F: 1 } },
    { id: '5', name: 'Environmental Science', totalStudents: 33, avgGrade: 82.9, highestGrade: 95, lowestGrade: 65, gradeDistribution: { A: 5, B: 12, C: 10, D: 4, F: 2 } }
  ];

  const dummyGradeCategories = [
    { id: '1', name: 'Homework Assignments', weight: 30, avgScore: 88.5, totalItems: 12 },
    { id: '2', name: 'Midterm Exams', weight: 25, avgScore: 85.2, totalItems: 2 },
    { id: '3', name: 'Final Project', weight: 20, avgScore: 91.8, totalItems: 1 },
    { id: '4', name: 'Class Participation', weight: 15, avgScore: 87.3, totalItems: 15 },
    { id: '5', name: 'Quizzes', weight: 10, avgScore: 83.7, totalItems: 8 }
  ];

  const selectedSubjectData = dummySubjects.find(s => s.id === selectedSubject);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#10b981';
      case 'B': return '#3b82f6';
      case 'C': return '#f59e0b';
      case 'D': return '#f97316';
      case 'F': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getGradeRange = (grade: string) => {
    switch (grade) {
      case 'A': return '90-100%';
      case 'B': return '80-89%';
      case 'C': return '70-79%';
      case 'D': return '60-69%';
      case 'F': return 'Below 60%';
      default: return '';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, isSmallScreen && styles.titleSmall]}>Grades Overview</Text>
        <Text style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}>
          Comprehensive view of student performance across all subjects
        </Text>
      </View>

      <View style={styles.subjectSelector}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Select Subject</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dummySubjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[styles.subjectCard, selectedSubject === subject.id && styles.subjectCardSelected]}
              onPress={() => setSelectedSubject(subject.id)}
            >
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={styles.subjectStats}>{subject.totalStudents} students</Text>
              <Text style={styles.avgGrade}>{subject.avgGrade}% avg</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedSubjectData && (
        <>
          <View style={styles.gradesSummary}>
            <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Subject Performance</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <MaterialIcons name="people" size={isSmallScreen ? 20 : 24} color="#6366f1" />
                <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>{selectedSubjectData.totalStudents}</Text>
                <Text style={[styles.summaryLabel, isSmallScreen && styles.summaryLabelSmall]}>Students</Text>
              </View>
              <View style={styles.summaryCard}>
                <MaterialIcons name="trending-up" size={isSmallScreen ? 20 : 24} color="#10b981" />
                <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>{selectedSubjectData.avgGrade}%</Text>
                <Text style={[styles.summaryLabel, isSmallScreen && styles.summaryLabelSmall]}>Average</Text>
              </View>
              <View style={styles.summaryCard}>
                <MaterialIcons name="star" size={isSmallScreen ? 20 : 24} color="#f59e0b" />
                <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>{selectedSubjectData.highestGrade}%</Text>
                <Text style={[styles.summaryLabel, isSmallScreen && styles.summaryLabelSmall]}>Highest</Text>
              </View>
              <View style={styles.summaryCard}>
                <MaterialIcons name="info" size={isSmallScreen ? 20 : 24} color="#ef4444" />
                <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>{selectedSubjectData.lowestGrade}%</Text>
                <Text style={[styles.summaryLabel, isSmallScreen && styles.summaryLabelSmall]}>Lowest</Text>
              </View>
            </View>
          </View>

          <View style={styles.gradeDistribution}>
            <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Grade Distribution</Text>
            <View style={styles.distributionGrid}>
              {Object.entries(selectedSubjectData.gradeDistribution).map(([grade, count]) => (
                <View key={grade} style={styles.distributionCard}>
                  <View style={[styles.gradeCircle, { backgroundColor: getGradeColor(grade) }]}>
                    <Text style={styles.gradeLetter}>{grade}</Text>
                  </View>
                  <Text style={[styles.gradeCount, isSmallScreen && styles.gradeCountSmall]}>{count}</Text>
                  <Text style={[styles.gradeRange, isSmallScreen && styles.gradeRangeSmall]}>{getGradeRange(grade)}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <View style={styles.gradeCategories}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Grade Categories</Text>
        {dummyGradeCategories.map((category) => (
          <View key={category.id} style={[styles.categoryCard, isSmallScreen && styles.categoryCardSmall]}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, isSmallScreen && styles.categoryNameSmall]}>{category.name}</Text>
                <Text style={[styles.categoryWeight, isSmallScreen && styles.categoryWeightSmall]}>Weight: {category.weight}%</Text>
              </View>
              <View style={styles.categoryScore}>
                <Text style={[styles.scoreValue, isSmallScreen && styles.scoreValueSmall]}>{category.avgScore}%</Text>
                <Text style={[styles.scoreLabel, isSmallScreen && styles.scoreLabelSmall]}>Average</Text>
              </View>
            </View>
            <View style={styles.categoryDetails}>
              <View style={styles.detailItem}>
                <MaterialIcons name="assignment" size={16} color="#6b7280" />
                <Text style={styles.detailText}>{category.totalItems} items</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${category.avgScore}%`, backgroundColor: getGradeColor(category.avgScore >= 90 ? 'A' : category.avgScore >= 80 ? 'B' : category.avgScore >= 70 ? 'C' : 'D') }]} />
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
            <Text style={[styles.actionText, isSmallScreen && styles.actionTextSmall]}>Grade Settings</Text>
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
  subjectSelector: {
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
  subjectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 180,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  subjectCardSelected: {
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  subjectStats: {
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
  gradeDistribution: {
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
  distributionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  distributionCard: {
    alignItems: 'center',
  },
  gradeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradeLetter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gradeCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  gradeCountSmall: {
    fontSize: 16,
  },
  gradeRange: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  gradeRangeSmall: {
    fontSize: 10,
  },
  gradeCategories: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  categoryCard: {
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
  categoryCardSmall: {
    padding: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  categoryNameSmall: {
    fontSize: 16,
  },
  categoryWeight: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryWeightSmall: {
    fontSize: 12,
  },
  categoryScore: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  scoreValueSmall: {
    fontSize: 18,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  scoreLabelSmall: {
    fontSize: 10,
  },
  categoryDetails: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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

export default GradesScreen;
