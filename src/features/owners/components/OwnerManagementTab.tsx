import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, TextInput, FlatList, Alert } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useRole } from '../../../contexts/RoleContext';
import { useUltraAdvancedAccessControl } from '../../../contexts/UltraAdvancedAccessControlContext';
import apiService from '../../../services/api';
import AdvancedRoleManagement from './AdvancedRoleManagement';
import AdvancedPermissionManagement from './AdvancedPermissionManagement';
import AdvancedPolicyManagement from './AdvancedPolicyManagement';
import AdvancedComponentAccessControl from './AdvancedComponentAccessControl';
import UltraAdvancedFeatureControl from './UltraAdvancedFeatureControl';
import UltraAdvancedRoleAssignment from './UltraAdvancedRoleAssignment';

const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'feature-control', label: 'Feature Control', icon: '🎛️' },
  { key: 'roles', label: 'Roles', icon: '👥' },
  { key: 'permissions', label: 'Permissions', icon: '🔒' },
  { key: 'policies', label: 'Policies', icon: '⚖️' },
  { key: 'components', label: 'Components', icon: '🔧' },
  { key: 'assignments', label: 'Assignments', icon: '🎭' },
  { key: 'analytics', label: 'Analytics', icon: '📈' }
];

const OwnerManagementTab: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState<any>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);

  // Only show to owner (SUPER_ADMIN)
  if (!user || (user.role !== 'owner' && user.role !== 'SUPER_ADMIN')) {
    return (
      <View style={styles.accessDenied}>
        <Text style={styles.accessDeniedText}>Access Denied: Owner Only</Text>
        <Text style={styles.accessDeniedSubtext}>This section requires owner privileges</Text>
      </View>
    );
  }

  useEffect(() => {
    if (activeTab === 'overview') {
      loadSystemStats();
      loadRecentActivity();
    }
  }, [activeTab]);

  const loadSystemStats = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/rbac/stats');
      setSystemStats(response.data || {});
    } catch (error) {
      setError('Failed to load system stats');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const response = await apiService.get('/rbac/activity');
      setRecentActivity(response.data || []);
    } catch (error) {
      
    }
  };

  const renderOverview = () => (
    <ScrollView style={styles.overviewContainer} showsVerticalScrollIndicator={false}>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('feature-control')}>
            <Text style={styles.quickActionIcon}>🎛️</Text>
            <Text style={styles.quickActionTitle}>Feature Control</Text>
            <Text style={styles.quickActionDesc}>Manage feature permissions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('assignments')}>
            <Text style={styles.quickActionIcon}>🎭</Text>
            <Text style={styles.quickActionTitle}>Role Assignment</Text>
            <Text style={styles.quickActionDesc}>Assign roles to users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('policies')}>
            <Text style={styles.quickActionIcon}>⚖️</Text>
            <Text style={styles.quickActionTitle}>ABAC Policies</Text>
            <Text style={styles.quickActionDesc}>Create access policies</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('analytics')}>
            <Text style={styles.quickActionIcon}>📈</Text>
            <Text style={styles.quickActionTitle}>Analytics</Text>
            <Text style={styles.quickActionDesc}>View system analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* System Health */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏥 System Health</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{systemStats.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{systemStats.activeRoles || 0}</Text>
            <Text style={styles.statLabel}>Active Roles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{systemStats.totalPolicies || 0}</Text>
            <Text style={styles.statLabel}>ABAC Policies</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{systemStats.activeSessions || 0}</Text>
            <Text style={styles.statLabel}>Active Sessions</Text>
          </View>
        </View>
      </View>

      {/* Security Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Security Overview</Text>
        <View style={styles.securityGrid}>
          <View style={[styles.securityCard, { backgroundColor: '#10B981' }]}>
            <Text style={styles.securityValue}>{systemStats.secureComponents || 0}</Text>
            <Text style={styles.securityLabel}>Secure Components</Text>
          </View>
          <View style={[styles.securityCard, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.securityValue}>{systemStats.pendingApprovals || 0}</Text>
            <Text style={styles.securityLabel}>Pending Approvals</Text>
          </View>
          <View style={[styles.securityCard, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.securityValue}>{systemStats.securityAlerts || 0}</Text>
            <Text style={styles.securityLabel}>Security Alerts</Text>
          </View>
        </View>
      </View>

      {/* Feature Access Matrix */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Feature Access Matrix</Text>
        <View style={styles.accessMatrix}>
          <View style={styles.matrixHeader}>
            <Text style={styles.matrixHeaderText}>Features</Text>
            <Text style={styles.matrixHeaderText}>Admin</Text>
            <Text style={styles.matrixHeaderText}>Teacher</Text>
            <Text style={styles.matrixHeaderText}>Staff</Text>
            <Text style={styles.matrixHeaderText}>Student</Text>
          </View>
          {['Dashboard', 'Students', 'Teachers', 'Finance', 'Reports'].map(feature => (
            <View key={feature} style={styles.matrixRow}>
              <Text style={styles.matrixFeature}>{feature}</Text>
              <View style={[styles.matrixCell, styles.accessAllowed]} />
              <View style={[styles.matrixCell, styles.accessPartial]} />
              <View style={[styles.matrixCell, styles.accessLimited]} />
              <View style={[styles.matrixCell, styles.accessDenied]} />
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Recent Activity</Text>
        <View style={styles.activityList}>
          {recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <Text style={styles.activityAction}>{activity.action}</Text>
              <Text style={styles.activityUser}>{activity.user}</Text>
              <Text style={styles.activityTime}>{activity.timestamp}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'feature-control':
        return <UltraAdvancedFeatureControl />;
      case 'roles':
        return <AdvancedRoleManagement />;
      case 'permissions':
        return <AdvancedPermissionManagement />;
      case 'policies':
        return <AdvancedPolicyManagement />;
      case 'components':
        return <AdvancedComponentAccessControl />;
      case 'assignments':
        return <UltraAdvancedRoleAssignment />;
      case 'analytics':
        return <SecurityAnalyticsTab />;
      default:
        return renderOverview();
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>👑 Ultra Advanced Owner Management</Text>
        <Text style={styles.subtitle}>Comprehensive RBAC + ABAC + Component-level control system</Text>
      </View>

      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          renderTabContent()
        )}
      </View>
    </ScrollView>
  );
};

// Placeholder component for analytics
const SecurityAnalyticsTab: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderTitle}>Security Analytics</Text>
    <Text style={styles.placeholderText}>Advanced security analytics and reporting coming soon...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  accessDeniedSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  overviewContainer: {
    flex: 1,
    padding: 20,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionDesc: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  securityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  securityCard: {
    borderRadius: 12,
    padding: 16,
    width: '32%',
    alignItems: 'center',
  },
  securityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  securityLabel: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
  },
  accessMatrix: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matrixHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  matrixHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  matrixFeature: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  matrixCell: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  accessAllowed: {
    backgroundColor: '#10B981',
  },
  accessPartial: {
    backgroundColor: '#F59E0B',
  },
  accessLimited: {
    backgroundColor: '#EF4444',
  },
  accessDenied: {
    backgroundColor: '#6B7280',
  },
  activityList: {
    maxHeight: 300,
  },
  activityItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  activityUser: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 8,
  },
  activityTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default OwnerManagementTab; 
