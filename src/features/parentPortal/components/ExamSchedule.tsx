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

interface Exam {
  id: string;
  subject: string;
  examType: string;
  date: string;
  time: string;
  duration: string;
  room: string;
  status: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  class: string;
  status: string;
}

interface ExamScheduleProps {
  student?: Student;
  parentData?: any;
}

const ExamSchedule: React.FC<ExamScheduleProps> = ({ student, parentData }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return theme.colors.primary;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      case 'postponed':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'schedule';
      case 'completed':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      case 'postponed':
        return 'schedule';
      default:
        return 'info';
    }
  };

  // Mock exam data - in real app, this would come from props or API
  const mockExams: Exam[] = [
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
    },
    {
      id: '3',
      subject: 'English',
      examType: 'Final Exam',
      date: '2024-03-01',
      time: '2:00 PM',
      duration: '3 hours',
      room: 'Room 205',
      status: 'Scheduled'
    },
    {
      id: '4',
      subject: 'History',
      examType: 'Chapter Test',
      date: '2024-01-15',
      time: '11:00 AM',
      duration: '1 hour',
      room: 'Room 103',
      status: 'Completed'
    }
  ];

  const exams = mockExams; // Use mock data for now

  const upcomingExams = exams.filter(exam => 
    new Date(exam.date) > new Date() && exam.status === 'Scheduled'
  );

  const recentExams = exams.filter(exam => 
    new Date(exam.date) <= new Date() && exam.status === 'Completed'
  );

  const ExamCard = ({ exam }: { exam: Exam }) => (
    <TouchableOpacity style={styles.examCard}>
      <View style={styles.examHeader}>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName}>{exam.subject}</Text>
          <Text style={styles.examType}>{exam.examType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(exam.status) }]}>
          <MaterialIcons 
            name={getStatusIcon(exam.status) as any} 
            size={16} 
            color="white" 
          />
          <Text style={styles.statusText}>{exam.status}</Text>
        </View>
      </View>
      
      <View style={styles.examDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="event" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{formatDate(exam.date)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons name="access-time" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{formatTime(exam.time)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons name="timer" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{exam.duration}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="door-open" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{exam.room}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Upcoming Exams */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Exams</Text>
        {upcomingExams.length > 0 ? (
          upcomingExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="event-available" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyStateText}>No upcoming exams</Text>
            <Text style={styles.emptyStateSubtext}>Check back later for new exam schedules</Text>
          </View>
        )}
      </View>

      {/* Recent Exams */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Exams</Text>
        {recentExams.length > 0 ? (
          recentExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="history" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyStateText}>No recent exams</Text>
            <Text style={styles.emptyStateSubtext}>Completed exams will appear here</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="calendar-today" size={24} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>View Full Calendar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="notifications" size={24} color={theme.colors.warning} />
          <Text style={styles.actionButtonText}>Set Reminders</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  examCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  examType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  examDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
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

export default ExamSchedule; 