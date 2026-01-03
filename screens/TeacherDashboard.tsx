import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TeacherDashboardProps {
  data: any;
  classes: any[];
  students: any[];
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ data, classes, students }) => {
  const totalClasses = classes?.length || 0;
  const totalStudents = students?.length || 0;
  const totalAssignments = data?.totalAssignments || 0;
  const totalExams = data?.totalExams || 0;

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statLeft}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <MaterialIcons name={icon as any} size={24} color={color} />
        </View>
      </View>
    </View>
  );

  const renderRecentActivity = (title: string, description: string, time: string, icon: string) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <MaterialIcons name={icon as any} size={20} color="#3B82F6" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDescription}>{description}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome to Your Dashboard</Text>
        <Text style={styles.welcomeSubtitle}>
          Here's an overview of your teaching activities
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard('Total Classes', totalClasses, 'class', '#3B82F6')}
        {renderStatCard('Total Students', totalStudents, 'people', '#10B981')}
        {renderStatCard('Assignments', totalAssignments, 'assignment', '#F59E0B')}
        {renderStatCard('Exams', totalExams, 'quiz', '#EF4444')}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="add" size={24} color="#3B82F6" />
            <Text style={styles.actionText}>New Assignment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="quiz" size={24} color="#10B981" />
            <Text style={styles.actionText}>Create Exam</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="check-circle" size={24} color="#F59E0B" />
            <Text style={styles.actionText}>Mark Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="grade" size={24} color="#EF4444" />
            <Text style={styles.actionText}>Grade Papers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <View style={styles.activitiesList}>
          {renderRecentActivity(
            'Assignment Submitted',
            'Math homework submitted by 15 students',
            '2 hours ago',
            'assignment'
          )}
          {renderRecentActivity(
            'Exam Created',
            'Science midterm exam scheduled for next week',
            '1 day ago',
            'quiz'
          )}
          {renderRecentActivity(
            'Attendance Marked',
            'Attendance marked for Grade 5A',
            '2 days ago',
            'check-circle'
          )}
          {renderRecentActivity(
            'Grades Updated',
            'Updated grades for Math quiz',
            '3 days ago',
            'grade'
          )}
        </View>
      </View>

      {/* Class Overview */}
      {classes && classes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Classes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {classes.slice(0, 5).map((cls, index) => (
              <View key={index} style={styles.classCard}>
                <Text style={styles.className}>{cls.name}</Text>
                <Text style={styles.classInfo}>{cls.students?.length || 0} students</Text>
                <Text style={styles.classInfo}>{cls.subject}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLeft: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  activitiesList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F620',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  classInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default TeacherDashboard; 