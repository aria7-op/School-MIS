import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Exam } from '../services/examApi';
import { useExamStats, useExamAnalytics } from '../hooks/useExamApi';

interface ExamAnalyticsModalProps {
  visible: boolean;
  exam: Exam | null;
  onClose: () => void;
}

const ExamAnalyticsModal: React.FC<ExamAnalyticsModalProps> = ({
  visible,
  exam,
  onClose
}) => {
  const { colors } = useTheme();
  const { stats, loading: statsLoading } = useExamStats(exam?.id || '');
  const { analytics, loading: analyticsLoading } = useExamAnalytics(exam?.id || '');

  if (!exam) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Exam Analytics</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.analytics}>
            <Text style={[styles.examName, { color: colors.text }]}>{exam.name}</Text>
            
            {statsLoading || analyticsLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.text + '80' }]}>
                  Loading analytics...
                </Text>
              </View>
            ) : (
              <>
                {stats && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
                    
                    <View style={styles.statsGrid}>
                      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                          {stats.totalStudents}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                          Total Students
                        </Text>
                      </View>
                      
                      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                          {stats.averageMarks.toFixed(1)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                          Average Marks
                        </Text>
                      </View>
                      
                      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                          {stats.passRate.toFixed(1)}%
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                          Pass Rate
                        </Text>
                      </View>
                      
                      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                          {stats.highestMarks}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
                          Highest Score
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {analytics && (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance</Text>
                    
                    <View style={styles.performanceGrid}>
                      <View style={[styles.performanceCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.performanceLabel, { color: colors.text + '80' }]}>
                          Average Score
                        </Text>
                        <Text style={[styles.performanceValue, { color: colors.text }]}>
                          {analytics.performance.averageScore.toFixed(1)}
                        </Text>
                      </View>
                      
                      <View style={[styles.performanceCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.performanceLabel, { color: colors.text + '80' }]}>
                          Pass Rate
                        </Text>
                        <Text style={[styles.performanceValue, { color: '#10B981' }]}>
                          {analytics.performance.passRate.toFixed(1)}%
                        </Text>
                      </View>
                      
                      <View style={[styles.performanceCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.performanceLabel, { color: colors.text + '80' }]}>
                          Fail Rate
                        </Text>
                        <Text style={[styles.performanceValue, { color: '#EF4444' }]}>
                          {analytics.performance.failRate.toFixed(1)}%
                        </Text>
                      </View>
                      
                      <View style={[styles.performanceCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.performanceLabel, { color: colors.text + '80' }]}>
                          Absentee Rate
                        </Text>
                        <Text style={[styles.performanceValue, { color: '#F59E42' }]}>
                          {analytics.performance.absenteeRate.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Grade Distribution</Text>
                  
                  {stats?.gradeDistribution && Object.keys(stats.gradeDistribution).length > 0 ? (
                    <View style={styles.gradeDistribution}>
                      {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                        <View key={grade} style={[styles.gradeBar, { backgroundColor: colors.card }]}>
                          <Text style={[styles.gradeLabel, { color: colors.text }]}>{grade}</Text>
                          <View style={styles.gradeBarContainer}>
                            <View 
                              style={[
                                styles.gradeBarFill, 
                                { 
                                  backgroundColor: colors.primary,
                                  width: `${(count / (stats.totalStudents || 1)) * 100}%`
                                }
                              ]} 
                            />
                          </View>
                          <Text style={[styles.gradeCount, { color: colors.text + '80' }]}>{count}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.noDataText, { color: colors.text + '60' }]}>
                      No grade distribution data available
                    </Text>
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  analytics: {
    padding: 16,
  },
  examName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  performanceGrid: {
    gap: 12,
  },
  performanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  performanceLabel: {
    fontSize: 14,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gradeDistribution: {
    gap: 12,
  },
  gradeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  gradeLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 30,
  },
  gradeBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
  },
  gradeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  gradeCount: {
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },
  noDataText: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default ExamAnalyticsModal;