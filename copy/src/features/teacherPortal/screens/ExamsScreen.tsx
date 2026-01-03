import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 400;

const ExamsScreen: React.FC = () => {
  const [selectedExamType, setSelectedExamType] = useState('all');

  const dummyExams = [
    { id: '1', title: 'Advanced Mathematics Midterm', subject: 'Advanced Mathematics', date: '2024-01-25', time: '10:00 AM', duration: '2 hours', status: 'scheduled', totalStudents: 32, examType: 'midterm' },
    { id: '2', title: 'Quantum Physics Final', subject: 'Quantum Physics', date: '2024-02-15', time: '2:00 PM', duration: '3 hours', status: 'scheduled', totalStudents: 28, examType: 'final' },
    { id: '3', title: 'World Literature Quiz 1', subject: 'World Literature', date: '2024-01-20', time: '9:00 AM', duration: '45 minutes', status: 'completed', totalStudents: 35, examType: 'quiz' },
    { id: '4', title: 'Data Science Project Defense', subject: 'Data Science & AI', date: '2024-02-10', time: '1:00 PM', duration: '1 hour', status: 'scheduled', totalStudents: 30, examType: 'project' },
    { id: '5', title: 'Environmental Science Lab Test', subject: 'Environmental Science', date: '2024-01-30', time: '11:00 AM', duration: '1.5 hours', status: 'completed', totalStudents: 33, examType: 'lab' }
  ];

  const dummyExamStats = [
    { id: '1', name: 'Total Exams', count: 12, icon: 'quiz', color: '#6366f1' },
    { id: '2', name: 'Scheduled', count: 5, icon: 'schedule', color: '#f59e0b' },
    { id: '3', name: 'Completed', count: 7, icon: 'check-circle', color: '#10b981' },
    { id: '4', name: 'Pending Results', count: 3, icon: 'pending', color: '#8b5cf6' }
  ];

  const filteredExams = selectedExamType === 'all' 
    ? dummyExams 
    : dummyExams.filter(exam => exam.examType === selectedExamType);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'pending': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'midterm': return '#3b82f6';
      case 'final': return '#ef4444';
      case 'quiz': return '#10b981';
      case 'project': return '#8b5cf6';
      case 'lab': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getExamTypeText = (type: string) => {
    switch (type) {
      case 'midterm': return 'Midterm';
      case 'final': return 'Final';
      case 'quiz': return 'Quiz';
      case 'project': return 'Project';
      case 'lab': return 'Lab Test';
      default: return type;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, isSmallScreen && styles.titleSmall]}>Exam Management</Text>
        <Text style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}>
          Schedule, monitor, and manage all examinations
        </Text>
      </View>

      <View style={styles.statsContainer}>
        {dummyExamStats.map((stat) => (
          <View key={stat.id} style={styles.statCard}>
            <MaterialIcons name={stat.icon as any} size={isSmallScreen ? 20 : 24} color={stat.color} />
            <Text style={[styles.statValue, isSmallScreen && styles.statValueSmall]}>{stat.count}</Text>
            <Text style={[styles.statLabel, isSmallScreen && styles.statLabelSmall]}>{stat.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.filterContainer}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Filter by Type</Text>
        <View style={styles.filterButtons}>
          {['all', 'midterm', 'final', 'quiz', 'project', 'lab'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                selectedExamType === type && styles.filterButtonActive
              ]}
              onPress={() => setSelectedExamType(type)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedExamType === type && styles.filterButtonTextActive
              ]}>
                {type === 'all' ? 'All' : getExamTypeText(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.examsList}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Examinations</Text>
        {filteredExams.map((exam) => (
          <View key={exam.id} style={[styles.examCard, isSmallScreen && styles.examCardSmall]}>
            <View style={styles.examHeader}>
              <View style={styles.examInfo}>
                <Text style={[styles.examTitle, isSmallScreen && styles.examTitleSmall]}>
                  {exam.title}
                </Text>
                <Text style={[styles.examSubject, isSmallScreen && styles.examSubjectSmall]}>
                  {exam.subject}
                </Text>
              </View>
              <View style={styles.examBadges}>
                <View style={[styles.typeBadge, { backgroundColor: getExamTypeColor(exam.examType) }]}>
                  <Text style={styles.badgeText}>{getExamTypeText(exam.examType)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(exam.status) }]}>
                  <Text style={styles.badgeText}>{getStatusText(exam.status)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.examDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <MaterialIcons name="event" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{exam.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="schedule" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{exam.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialIcons name="timer" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{exam.duration}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <MaterialIcons name="people" size={16} color="#6b7280" />
                  <Text style={styles.detailText}>{exam.totalStudents} students</Text>
                </View>
              </View>
            </View>

            <View style={styles.examActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="edit" size={16} color="#6366f1" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="visibility" size={16} color="#10b981" />
                <Text style={styles.actionText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="grade" size={16} color="#f59e0b" />
                <Text style={styles.actionText}>Grade</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="notifications" size={16} color="#8b5cf6" />
                <Text style={styles.actionText}>Notify</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.upcomingExams}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Upcoming Exams</Text>
        <View style={styles.upcomingGrid}>
          {dummyExams.filter(exam => exam.status === 'scheduled').slice(0, 3).map((exam) => (
            <View key={exam.id} style={[styles.upcomingCard, isSmallScreen && styles.upcomingCardSmall]}>
              <View style={[styles.upcomingBadge, { backgroundColor: getExamTypeColor(exam.examType) }]}>
                <Text style={styles.upcomingBadgeText}>{getExamTypeText(exam.examType)}</Text>
              </View>
              <Text style={[styles.upcomingTitle, isSmallScreen && styles.upcomingTitleSmall]}>{exam.title}</Text>
              <Text style={[styles.upcomingDate, isSmallScreen && styles.upcomingDateSmall]}>{exam.date} at {exam.time}</Text>
              <Text style={[styles.upcomingDuration, isSmallScreen && styles.upcomingDurationSmall]}>{exam.duration}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Quick Actions</Text>
        <View style={[styles.actionGrid, isSmallScreen && styles.actionGridSmall]}>
          <TouchableOpacity style={[styles.quickActionButton, isSmallScreen && styles.quickActionButtonSmall]}>
            <MaterialIcons name="add" size={isSmallScreen ? 20 : 24} color="#6366f1" />
            <Text style={[styles.actionText, isSmallScreen && styles.actionTextSmall]}>New Exam</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, isSmallScreen && styles.quickActionButtonSmall]}>
            <MaterialIcons name="schedule" size={isSmallScreen ? 20 : 24} color="#10b981" />
            <Text style={[styles.actionText, isSmallScreen && styles.actionTextSmall]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, isSmallScreen && styles.quickActionButtonSmall]}>
            <MaterialIcons name="notifications" size={isSmallScreen ? 20 : 24} color="#f59e0b" />
            <Text style={[styles.actionText, isSmallScreen && styles.actionTextSmall]}>Send Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, isSmallScreen && styles.quickActionButtonSmall]}>
            <MaterialIcons name="file-download" size={isSmallScreen ? 20 : 24} color="#8b5cf6" />
            <Text style={[styles.actionText, isSmallScreen && styles.actionTextSmall]}>Export Results</Text>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    minWidth: 80,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statValueSmall: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statLabelSmall: {
    fontSize: 12,
  },
  filterContainer: {
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
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  examsList: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  examCard: {
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
  examCardSmall: {
    padding: 12,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examInfo: {
    flex: 1,
    marginRight: 12,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  examTitleSmall: {
    fontSize: 16,
  },
  examSubject: {
    fontSize: 16,
    color: '#6b7280',
  },
  examSubjectSmall: {
    fontSize: 14,
  },
  examBadges: {
    alignItems: 'flex-end',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  examDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  examActions: {
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
  upcomingExams: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  upcomingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  upcomingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  upcomingCardSmall: {
    padding: 12,
    width: '30%',
  },
  upcomingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  upcomingBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  upcomingTitleSmall: {
    fontSize: 12,
  },
  upcomingDate: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  upcomingDateSmall: {
    fontSize: 10,
  },
  upcomingDuration: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  upcomingDurationSmall: {
    fontSize: 10,
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

export default ExamsScreen;
