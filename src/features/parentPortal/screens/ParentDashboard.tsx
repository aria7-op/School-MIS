import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../theme';
import { Card, CardContent } from '../../../components/ui/cards/Card';
import { Button } from '../../../components/ui/buttons/Button';
import { Icon } from '../../../components/ui/Icon';
import { LoadingSpinner } from '../../../components/ui/loaders/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useParentData } from '../hooks/useParentData';

const { width } = Dimensions.get('window');

interface ChildSummary {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  attendance: number;
  averageGrade: number;
  recentActivity: string;
  photo?: string;
}

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { getParentChildren, getParentNotifications } = useParentData();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const childrenData = await getParentChildren();
      if (childrenData.success) {
        setChildren(childrenData.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleQuickAction = (action: string, childId?: string) => {
    // Navigate to appropriate screen based on action
    switch (action) {
      case 'attendance':
        // Navigate to attendance screen
        break;
      case 'grades':
        // Navigate to grades screen
        break;
      case 'fees':
        // Navigate to fees screen
        break;
      case 'messages':
        // Navigate to messaging screen
        break;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Hero Header */}
      <LinearGradient
        colors={[theme.colors.primary, '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.firstName || 'Parent'}! 👋
          </Text>
          <Text style={styles.subtitleText}>
            Here's what's happening with your children today
          </Text>
          
          {/* Quick Stats in Header */}
          <View style={styles.headerStats}>
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatNumber}>{children.length}</Text>
              <Text style={styles.headerStatLabel}>Children</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatNumber}>
                {children.length > 0 ? Math.round(children.reduce((sum, child) => sum + (child.attendance || 0), 0) / children.length) : 0}%
              </Text>
              <Text style={styles.headerStatLabel}>Avg Attendance</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatNumber}>
                {children.length > 0 ? Math.round(children.reduce((sum, child) => sum + (child.averageGrade || 0), 0) / children.length) : 0}%
              </Text>
              <Text style={styles.headerStatLabel}>Avg Grade</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Children Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Children</Text>
            <Text style={styles.sectionSubtitle}>Monitor their progress and activities</Text>
          </View>
          
          {children.length === 0 ? (
            <EmptyState
              icon="school-outline"
              title="No Children Found"
              message="Contact the school administration to link your account with your children."
            />
          ) : (
            children.map((child) => (
              <Card key={child.id} style={styles.childCard}>
                <CardContent>
                  <View style={styles.childHeader}>
                    <View style={styles.childAvatar}>
                      <Text style={styles.childAvatarText}>
                        {child.firstName?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>
                        {child.firstName || ''} {child.lastName || ''}
                      </Text>
                      <Text style={styles.childDetails}>
                        Grade {child.grade || 'N/A'} • Section {child.section || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.childStats}>
                      <View style={[styles.statBadge, { backgroundColor: theme.colors.success + '20' }]}>
                        <Text style={[styles.statBadgeText, { color: theme.colors.success }]}>
                          {child.attendance || 0}%
                        </Text>
                        <Text style={styles.statBadgeLabel}>Attendance</Text>
                      </View>
                      <View style={[styles.statBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Text style={[styles.statBadgeText, { color: theme.colors.primary }]}>
                          {child.averageGrade || 0}%
                        </Text>
                        <Text style={styles.statBadgeLabel}>Grade</Text>
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.recentActivity}>
                    📚 {child.recentActivity || 'No recent activity'}
                  </Text>
                  
                  <View style={styles.childActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleQuickAction('attendance', child.id)}
                    >
                      <Icon name="calendar-check" size={16} color={theme.colors.primary} />
                      <Text style={styles.actionText}>Attendance</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleQuickAction('grades', child.id)}
                    >
                      <Icon name="chart-line" size={16} color={theme.colors.primary} />
                      <Text style={styles.actionText}>Grades</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleQuickAction('fees', child.id)}
                    >
                      <Icon name="credit-card" size={16} color={theme.colors.primary} />
                      <Text style={styles.actionText}>Fees</Text>
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>Access important features instantly</Text>
          </View>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('messages')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#e3f2fd' }]}>
                <Icon name="message-circle" size={28} color="#1976d2" />
              </View>
              <Text style={styles.quickActionText}>Messages</Text>
              <Text style={styles.quickActionSubtext}>Chat with teachers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('attendance')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#e8f5e8' }]}>
                <Icon name="calendar" size={28} color="#388e3c" />
              </View>
              <Text style={styles.quickActionText}>Attendance</Text>
              <Text style={styles.quickActionSubtext}>Track daily presence</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('grades')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#fff3e0' }]}>
                <Icon name="award" size={28} color="#f57c00" />
              </View>
              <Text style={styles.quickActionText}>Grades</Text>
              <Text style={styles.quickActionSubtext}>View performance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('fees')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#f3e5f5' }]}>
                <Icon name="dollar-sign" size={28} color="#7b1fa2" />
              </View>
              <Text style={styles.quickActionText}>Fees</Text>
              <Text style={styles.quickActionSubtext}>Manage payments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <Text style={styles.sectionSubtitle}>Stay updated with school news</Text>
          </View>
          
          <Card style={styles.notificationCard}>
            <CardContent>
              <View style={styles.notificationContent}>
                <Icon name="bell" size={24} color={theme.colors.info} />
                <Text style={styles.notificationText}>
                  No new notifications at this time. You're all caught up! 🎉
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 25,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: 12,
    color: theme.colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  childCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  childAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  childStats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  statBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  statBadgeLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  recentActivity: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    fontStyle: 'italic',
    paddingHorizontal: 5,
  },
  childActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
    marginLeft: 6,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  quickActionCard: {
    width: (width - 70) / 2,
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: theme.colors.info + '10',
    borderColor: theme.colors.info + '30',
    borderWidth: 1,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
});

export default ParentDashboard; 