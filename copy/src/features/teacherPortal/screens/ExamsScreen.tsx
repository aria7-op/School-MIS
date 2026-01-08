import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import secureApiService from '../../../services/secureApiService';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 400;

const ExamsScreen: React.FC = () => {
  const { user, managedContext } = useAuth();
  const teacherId = (user?.teacherId || localStorage.getItem('teacherId') || '') as string;
  
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch exams based on managedContext
  useEffect(() => {
    const fetchExams = async () => {
      if (!teacherId) {
        console.warn('⚠️ No teacher ID found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching exams with context:', managedContext);
        
        // Build query params with managedContext filters
        const params: any = { 
          teacherId: teacherId,
          include: 'class,subject',
          limit: 100 
        };
        
        // Add context filters (same pattern as ClassManagement and AttendanceManagement)
        if (managedContext?.schoolId) params.schoolId = managedContext.schoolId;
        if (managedContext?.branchId) params.branchId = managedContext.branchId;
        if (managedContext?.courseId) params.courseId = managedContext.courseId;
        
        console.log('📤 Fetching exams with params:', params);
        
        // Fetch exams from API
        const response = await secureApiService.get('/exams', { params });
        
        console.log('✅ Exams response:', response.data);
        
        // Extract exams array from response
        const examsData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.exams || response.data?.data || [];
        
        setExams(examsData);
      } catch (err: any) {
        console.error('❌ Error fetching exams:', err);
        setError(err.message || 'Failed to fetch exams');
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [teacherId, managedContext?.schoolId, managedContext?.branchId, managedContext?.courseId]);

  // Calculate stats from real data
  const examStats = [
    { 
      id: '1', 
      name: 'Total Exams', 
      count: exams.length, 
      icon: 'quiz', 
      color: '#6366f1' 
    },
    { 
      id: '2', 
      name: 'Scheduled', 
      count: exams.filter(e => e.status === 'scheduled' || new Date(e.date) > new Date()).length, 
      icon: 'schedule', 
      color: '#f59e0b' 
    },
    { 
      id: '3', 
      name: 'Completed', 
      count: exams.filter(e => e.status === 'completed' || new Date(e.date) < new Date()).length, 
      icon: 'check-circle', 
      color: '#10b981' 
    },
    { 
      id: '4', 
      name: 'Pending Results', 
      count: exams.filter(e => e.status === 'pending' || e.status === 'grading').length, 
      icon: 'pending', 
      color: '#8b5cf6' 
    }
  ];

  const filteredExams = selectedExamType === 'all' 
    ? exams 
    : exams.filter(exam => (exam.type || exam.examType) === selectedExamType);

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

  // Show loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={48} color="#9CA3AF" />
        <Text style={styles.loadingText}>Loading exams...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, isSmallScreen && styles.titleSmall]}>Exam Management</Text>
        <Text style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}>
          Schedule, monitor, and manage all examinations
        </Text>
      </View>

      <View style={styles.statsContainer}>
        {examStats.map((stat) => (
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
        {filteredExams.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="event-note" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No exams found</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedExamType === 'all' 
                ? 'No exams have been scheduled yet' 
                : `No ${selectedExamType} exams found`}
            </Text>
          </View>
        ) : (
          filteredExams.map((exam) => (
            <View key={exam.id} style={[styles.examCard, isSmallScreen && styles.examCardSmall]}>
              <View style={styles.examHeader}>
                <View style={styles.examInfo}>
                  <Text style={[styles.examTitle, isSmallScreen && styles.examTitleSmall]}>
                    {exam.title || exam.name || 'Untitled Exam'}
                  </Text>
                  <Text style={[styles.examSubject, isSmallScreen && styles.examSubjectSmall]}>
                    {exam.subject?.name || exam.subjectName || exam.class?.name || 'N/A'}
                  </Text>
                </View>
                <View style={styles.examBadges}>
                  <View style={[styles.typeBadge, { backgroundColor: getExamTypeColor(exam.type || exam.examType || 'quiz') }]}>
                    <Text style={styles.badgeText}>{getExamTypeText(exam.type || exam.examType || 'quiz')}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(exam.status || 'scheduled') }]}>
                    <Text style={styles.badgeText}>{getStatusText(exam.status || 'scheduled')}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.examDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="event" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {exam.date ? new Date(exam.date).toLocaleDateString() : 'Date TBD'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="schedule" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {exam.time || exam.startTime || 'Time TBD'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="timer" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {exam.duration || exam.durationMinutes ? `${exam.duration || exam.durationMinutes} min` : 'Duration TBD'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="people" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {exam.totalStudents || exam.class?._count?.students || 0} students
                    </Text>
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
          ))
        )}
      </View>

      <View style={styles.upcomingExams}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>Upcoming Exams</Text>
        <View style={styles.upcomingGrid}>
          {exams.filter(exam => exam.status === 'scheduled' || new Date(exam.date) > new Date()).slice(0, 3).map((exam) => (
            <View key={exam.id} style={[styles.upcomingCard, isSmallScreen && styles.upcomingCardSmall]}>
              <View style={[styles.upcomingBadge, { backgroundColor: getExamTypeColor(exam.type || exam.examType || 'quiz') }]}>
                <Text style={styles.upcomingBadgeText}>{getExamTypeText(exam.type || exam.examType || 'quiz')}</Text>
              </View>
              <Text style={[styles.upcomingTitle, isSmallScreen && styles.upcomingTitleSmall]}>
                {exam.title || exam.name || 'Untitled'}
              </Text>
              <Text style={[styles.upcomingDate, isSmallScreen && styles.upcomingDateSmall]}>
                {exam.date ? new Date(exam.date).toLocaleDateString() : 'TBD'}
                {exam.time || exam.startTime ? ` at ${exam.time || exam.startTime}` : ''}
              </Text>
              <Text style={[styles.upcomingDuration, isSmallScreen && styles.upcomingDurationSmall]}>
                {exam.duration || exam.durationMinutes ? `${exam.duration || exam.durationMinutes} minutes` : 'Duration TBD'}
              </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
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
