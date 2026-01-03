import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import ownerService from '../services/ownerService';
import { Owner } from '../types';

const { width } = Dimensions.get('window');

interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  distribution: Record<string, number>;
  recentActivity: any[];
  topPerformers: Owner[];
  systemHealth: {
    status: string;
    uptime: number;
    memory: any;
  };
}

const AdvancedOwnersDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChart, setSelectedChart] = useState<'status' | 'activity' | 'performance'>('status');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple data sources
      const [statsResponse, healthResponse, ownersResponse] = await Promise.all([
        ownerService.getOwnerStats(),
        ownerService.healthCheck(),
        ownerService.getAllOwners({ limit: 100 })
      ]);

      const dashboardStats: DashboardStats = {
        total: statsResponse.data.total,
        active: statsResponse.data.active,
        inactive: statsResponse.data.inactive,
        suspended: statsResponse.data.suspended,
        distribution: statsResponse.data.distribution,
        recentActivity: [], // Will be populated from audit logs
        topPerformers: ownersResponse.data.slice(0, 5), // Top 5 owners
        systemHealth: {
          status: healthResponse.success ? 'healthy' : 'unhealthy',
          uptime: 0,
          memory: {}
        }
      };

      setStats(dashboardStats);
    } catch (error) {
      
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const renderStatusChart = () => {
    if (!stats) return null;

    const data = {
      labels: ['Active', 'Inactive', 'Suspended'],
      data: [
        stats.active / stats.total,
        stats.inactive / stats.total,
        stats.suspended / stats.total
      ]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Owner Status Distribution</Text>
        <PieChart
          data={[
            {
              name: 'Active',
              population: stats.active,
              color: '#4CAF50',
              legendFontColor: colors.text,
            },
            {
              name: 'Inactive',
              population: stats.inactive,
              color: '#FF9800',
              legendFontColor: colors.text,
            },
            {
              name: 'Suspended',
              population: stats.suspended,
              color: '#F44336',
              legendFontColor: colors.text,
            },
          ]}
          width={width - 40}
          height={200}
          chartConfig={{
            backgroundColor: colors.white,
            backgroundGradientFrom: colors.white,
            backgroundGradientTo: colors.white,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </View>
    );
  };

  const renderActivityChart = () => {
    if (!stats) return null;

    const data = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: [20, 45, 28, 80, 99, 43, 50],
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Activity</Text>
        <LineChart
          data={data}
          width={width - 40}
          height={200}
          chartConfig={{
            backgroundColor: colors.white,
            backgroundGradientFrom: colors.white,
            backgroundGradientTo: colors.white,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: colors.primary
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderPerformanceChart = () => {
    if (!stats) return null;

    const data = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          data: [0.8, 0.9, 0.7, 0.95]
        }
      ]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Quarterly Performance</Text>
        <ProgressChart
          data={data}
          width={width - 40}
          height={200}
          strokeWidth={16}
          radius={32}
          chartConfig={{
            backgroundColor: colors.white,
            backgroundGradientFrom: colors.white,
            backgroundGradientTo: colors.white,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          hideLegend={false}
        />
      </View>
    );
  };

  const renderStatCard = (title: string, value: number, icon: string, color: string, subtitle?: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <MaterialIcons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Add Owner', 'Navigate to add owner')}>
          <MaterialIcons name="person-add" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Add Owner</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Bulk Import', 'Open bulk import modal')}>
          <MaterialIcons name="upload-file" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Bulk Import</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Export Data', 'Export owners data')}>
          <MaterialIcons name="download" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Export</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowAnalytics(true)}>
          <MaterialIcons name="analytics" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Analytics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSystemHealth = () => (
    <View style={styles.healthContainer}>
      <Text style={styles.sectionTitle}>System Health</Text>
      <View style={styles.healthCard}>
        <View style={styles.healthItem}>
          <Text style={styles.healthLabel}>Status</Text>
          <View style={[styles.healthStatus, { backgroundColor: stats?.systemHealth.status === 'healthy' ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.healthStatusText}>{stats?.systemHealth.status}</Text>
          </View>
        </View>
        <View style={styles.healthItem}>
          <Text style={styles.healthLabel}>Total Owners</Text>
          <Text style={styles.healthValue}>{stats?.total || 0}</Text>
        </View>
        <View style={styles.healthItem}>
          <Text style={styles.healthLabel}>Active Sessions</Text>
          <Text style={styles.healthValue}>12</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Advanced Owners Dashboard</Text>
          <Text style={styles.subtitle}>Comprehensive overview and analytics</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <MaterialIcons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {renderStatCard('Total Owners', stats?.total || 0, 'people', colors.primary)}
        {renderStatCard('Active', stats?.active || 0, 'check-circle', '#4CAF50')}
        {renderStatCard('Inactive', stats?.inactive || 0, 'pause-circle', '#FF9800')}
        {renderStatCard('Suspended', stats?.suspended || 0, 'block', '#F44336')}
      </View>

      {/* Chart Selector */}
      <View style={styles.chartSelector}>
        <TouchableOpacity 
          style={[styles.chartTab, selectedChart === 'status' && styles.activeChartTab]}
          onPress={() => setSelectedChart('status')}
        >
          <Text style={[styles.chartTabText, selectedChart === 'status' && styles.activeChartTabText]}>Status</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.chartTab, selectedChart === 'activity' && styles.activeChartTab]}
          onPress={() => setSelectedChart('activity')}
        >
          <Text style={[styles.chartTabText, selectedChart === 'activity' && styles.activeChartTabText]}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.chartTab, selectedChart === 'performance' && styles.activeChartTab]}
          onPress={() => setSelectedChart('performance')}
        >
          <Text style={[styles.chartTabText, selectedChart === 'performance' && styles.activeChartTabText]}>Performance</Text>
        </TouchableOpacity>
      </View>

      {/* Charts */}
      {selectedChart === 'status' && renderStatusChart()}
      {selectedChart === 'activity' && renderActivityChart()}
      {selectedChart === 'performance' && renderPerformanceChart()}

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* System Health */}
      {renderSystemHealth()}

      {/* Analytics Modal */}
      <Modal
        visible={showAnalytics}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalytics(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Analytics</Text>
              <TouchableOpacity onPress={() => setShowAnalytics(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>Advanced analytics features coming soon...</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chartSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  chartTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  activeChartTab: {
    borderBottomColor: colors.primary,
  },
  chartTabText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeChartTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: colors.white,
    margin: 20,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  quickActionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  healthContainer: {
    padding: 20,
  },
  healthCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  healthLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  healthValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  healthStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthStatusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
  },
});

export default AdvancedOwnersDashboard; 
