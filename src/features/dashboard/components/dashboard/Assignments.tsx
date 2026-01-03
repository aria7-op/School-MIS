import React, { useState } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';
import Card from '../shared/Card';
import SectionTitle from '../shared/SectionTitle';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import { useTranslation } from '../../../../contexts/TranslationContext';

const { width } = Dimensions.get('window');
const chartWidth = width - 40;

type Role = 'teacher' | 'student';

interface AssignmentsProps {
  data: any[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  role?: Role;
}

const Assignments: React.FC<AssignmentsProps> = ({ 
  data = [], 
  loading = false, 
  error = null,
  onRefresh,
  role: initialRole = 'teacher' 
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [role, setRole] = useState<Role>(initialRole);
  const [activeTab, setActiveTab] = useState<'stats' | 'list'>('stats');

  const assignmentStats = {
    labels: [t('math'), t('science'), t('history'), t('english')],
    datasets: [
      {
        data: [85, 92, 78, 88],
        colors: [
          (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
          (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
        ],
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(${colors.text.replace(/^#/, '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${colors.text.replace(/^#/, '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <View style={styles.container}>
      <SectionTitle title={t('assignments_dashboard')} />
      {/* Role Selector */}
      <View style={styles.roleSelector}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'teacher' && styles.activeRole]}
          onPress={() => setRole('teacher')}
        >
          <Text style={[styles.roleText, role === 'teacher' && { color: colors.text }]}>{t('teacher_view')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'student' && styles.activeRole]}
          onPress={() => setRole('student')}
        >
          <Text style={[styles.roleText, role === 'student' && { color: colors.text }]}>{t('student_view')}</Text>
        </TouchableOpacity>
      </View>

      <Card>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
          >
            <Text style={[styles.tabText, activeTab === 'stats' && { color: colors.primary }]}>{t('statistics')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'list' && styles.activeTab]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.tabText, activeTab === 'list' && { color: colors.primary }]}>{t('assignments')}</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'stats' ? (
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>{role === 'teacher' ? t('class_performance') : t('your_grades')}</Text>
            <BarChart
              data={assignmentStats}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              fromZero
              showBarTops={false}
              withCustomBarColorFromData
              flatColor
              style={styles.barChart}
            />
          </View>
        ) : (
          <View style={styles.listContainer}>
            {loading ? (
              <Text style={{ textAlign: 'center', marginVertical: 20 }}>{t('loading_assignments')}</Text>
            ) : error ? (
              <Text style={{ color: 'red', textAlign: 'center', marginVertical: 20 }}>{error}</Text>
            ) : !data.length ? (
              <Text style={{ textAlign: 'center', marginVertical: 20 }}>{t('no_assignments')}</Text>
            ) : (
              data.map((assignment) => (
                <View key={assignment.id} style={[styles.assignmentCard, { borderColor: colors.border }]}> 
                  <View style={styles.assignmentHeader}>
                    <Text style={[styles.assignmentTitle, { color: colors.text }]}> 
                      {assignment.title}
                    </Text>
                    <Text style={[styles.dueDate, { color: colors.notification }]}> 
                      {t('due')}: {assignment.close_date || assignment.dueDate}
                    </Text>
                  </View>
                  {role === 'teacher' ? (
                    <View style={styles.teacherActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Icon name="edit" size={18} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>{t('edit')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Icon name="grade" size={18} color={colors.primary} />
                        <Text style={[styles.actionText, { color: colors.primary }]}>{t('grade')}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.studentStatus}>
                      {(() => {
                        const dueDate = assignment.close_date || assignment.dueDate;
                        const isPastDue = dueDate && moment().isAfter(moment(dueDate, 'YYYY-MM-DD'));
                        return (
                          <TouchableOpacity
                            style={[styles.submitButton, isPastDue && { backgroundColor: '#eee', borderColor: '#ccc' }]}
                            disabled={isPastDue}
                          >
                            <Text style={[styles.submitText, { color: isPastDue ? '#aaa' : colors.primary }]}> 
                              {isPastDue ? t('submission_closed') : t('submit_assignment')}
                            </Text>
                            <Icon name={isPastDue ? 'lock' : 'send'} size={18} color={isPastDue ? '#aaa' : colors.primary} />
                          </TouchableOpacity>
                        );
                      })()}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-end',
    backgroundColor: '#F0F0F0',
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeRole: {
    backgroundColor: '#E0E7FF',
  },
  roleText: {
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6200EE',
  },
  tabText: {
    fontWeight: '500',
    color:'#6366f1'
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  barChart: {
    borderRadius: 8,
  },
  listContainer: {
    paddingHorizontal: 8,
  },
  assignmentCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  dueDate: {
    fontSize: 14,
  },
  teacherActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  studentStatus: {
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6200EE',
  },
  submitText: {
    marginRight: 6,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Assignments;

