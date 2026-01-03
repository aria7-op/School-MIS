import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// Victory charts removed due to dependency issues - using mock data instead
import SystemMonitor from './SystemMonitor';
import AdvancedSystemInfo from './AdvancedSystemInfo';
import { useSystemMonitor } from '../hooks/useSystemMonitor';

interface DashboardMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkSpeed: number;
  batteryLevel: number;
  temperature: number;
  storageUsage: number;
}

const SystemMonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'monitor' | 'advanced' | 'analytics'>('overview');
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    networkSpeed: 0,
    batteryLevel: 0,
    temperature: 0,
    storageUsage: 0,
  });
  const [isRealTimeMode, setIsRealTimeMode] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(1000);

  const { systemMetrics, performanceHistory } = useSystemMonitor();

  useEffect(() => {
    if (isRealTimeMode && systemMetrics) {
      const interval = setInterval(() => {
        updateDashboardMetrics();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [isRealTimeMode, refreshInterval, systemMetrics]);

  const updateDashboardMetrics = () => {
    if (!systemMetrics) return;

    setDashboardMetrics({
      cpuUsage: systemMetrics.performance.cpuUsage,
      memoryUsage: systemMetrics.performance.memoryUsage,
      networkSpeed: systemMetrics.performance.networkSpeed,
      batteryLevel: systemMetrics.battery.batteryLevel * 100,
      temperature: 20 + Math.random() * 40, // Simulated temperature
      storageUsage: ((systemMetrics.storage.usedSpace / systemMetrics.storage.totalSpace) * 100) || 0,
    });
  };

  const getMetricColor = (value: number, type: 'cpu' | 'memory' | 'network' | 'battery' | 'temperature' | 'storage') => {
    switch (type) {
      case 'cpu':
      case 'memory':
      case 'network':
        return value > 80 ? '#ff6b6b' : value > 60 ? '#ffa726' : '#4caf50';
      case 'battery':
        return value < 20 ? '#ff6b6b' : value < 50 ? '#ffa726' : '#4caf50';
      case 'temperature':
        return value > 50 ? '#ff6b6b' : value > 35 ? '#ffa726' : '#4caf50';
      case 'storage':
        return value > 90 ? '#ff6b6b' : value > 70 ? '#ffa726' : '#4caf50';
      default:
        return '#4caf50';
    }
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.overviewGrid}>
        {/* CPU Usage Card */}
        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.cardGradient}
          >
            <MaterialCommunityIcons name="cpu-64-bit" size={24} color="white" />
            <Text style={styles.cardTitle}>CPU Usage</Text>
            <Text style={[styles.cardValue, { color: getMetricColor(dashboardMetrics.cpuUsage, 'cpu') }]}>
              {dashboardMetrics.cpuUsage.toFixed(1)}%
            </Text>
          </LinearGradient>
        </View>

        {/* Memory Usage Card */}
        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.cardGradient}
          >
            <MaterialIcons name="memory" size={24} color="white" />
            <Text style={styles.cardTitle}>Memory Usage</Text>
            <Text style={[styles.cardValue, { color: getMetricColor(dashboardMetrics.memoryUsage, 'memory') }]}>
              {dashboardMetrics.memoryUsage.toFixed(1)}%
            </Text>
          </LinearGradient>
        </View>

        {/* Network Speed Card */}
        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#43e97b', '#38f9d7']}
            style={styles.cardGradient}
          >
            <MaterialIcons name="wifi" size={24} color="white" />
            <Text style={styles.cardTitle}>Network Speed</Text>
            <Text style={[styles.cardValue, { color: getMetricColor(dashboardMetrics.networkSpeed, 'network') }]}>
              {dashboardMetrics.networkSpeed.toFixed(1)}%
            </Text>
          </LinearGradient>
        </View>

        {/* Battery Level Card */}
        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={styles.cardGradient}
          >
            <Ionicons name="battery-charging" size={24} color="white" />
            <Text style={styles.cardTitle}>Battery Level</Text>
            <Text style={[styles.cardValue, { color: getMetricColor(dashboardMetrics.batteryLevel, 'battery') }]}>
              {dashboardMetrics.batteryLevel.toFixed(1)}%
            </Text>
          </LinearGradient>
        </View>

        {/* Temperature Card */}
        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#ff6b6b', '#ffa726']}
            style={styles.cardGradient}
          >
            <Ionicons name="thermometer" size={24} color="white" />
            <Text style={styles.cardTitle}>Temperature</Text>
            <Text style={[styles.cardValue, { color: getMetricColor(dashboardMetrics.temperature, 'temperature') }]}>
              {dashboardMetrics.temperature.toFixed(1)}°C
            </Text>
          </LinearGradient>
        </View>

        {/* Storage Usage Card */}
        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#a8edea', '#fed6e3']}
            style={styles.cardGradient}
          >
            <MaterialIcons name="storage" size={24} color="white" />
            <Text style={styles.cardTitle}>Storage Usage</Text>
            <Text style={[styles.cardValue, { color: getMetricColor(dashboardMetrics.storageUsage, 'storage') }]}>
              {dashboardMetrics.storageUsage.toFixed(1)}%
            </Text>
          </LinearGradient>
        </View>
      </View>

      {/* Performance Overview */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Real-time Performance Overview</Text>
        <View style={styles.performanceOverview}>
          <Text style={styles.performanceText}>
            Memory: {dashboardMetrics.memoryUsage.toFixed(1)}% | 
            CPU: {dashboardMetrics.cpuUsage.toFixed(1)}% | 
            Network: {dashboardMetrics.networkSpeed.toFixed(1)}%
          </Text>
          <Text style={styles.performanceText}>
            Battery: {dashboardMetrics.batteryLevel.toFixed(1)}% | 
            Temperature: {dashboardMetrics.temperature.toFixed(1)}°C | 
            Storage: {dashboardMetrics.storageUsage.toFixed(1)}%
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderMonitorTab = () => (
    <View style={styles.tabContent}>
      <SystemMonitor />
    </View>
  );

  const renderAdvancedTab = () => (
    <View style={styles.tabContent}>
      <AdvancedSystemInfo />
    </View>
  );

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.analyticsContainer}>
        <Text style={styles.analyticsTitle}>System Analytics</Text>
        
        {/* Performance Distribution */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>Performance Distribution</Text>
          <View style={styles.performanceDistribution}>
            <View style={styles.distributionItem}>
              <Text style={[styles.distributionLabel, { color: '#667eea' }]}>CPU</Text>
              <Text style={styles.distributionValue}>{dashboardMetrics.cpuUsage.toFixed(1)}%</Text>
            </View>
            <View style={styles.distributionItem}>
              <Text style={[styles.distributionLabel, { color: '#f093fb' }]}>Memory</Text>
              <Text style={styles.distributionValue}>{dashboardMetrics.memoryUsage.toFixed(1)}%</Text>
            </View>
            <View style={styles.distributionItem}>
              <Text style={[styles.distributionLabel, { color: '#43e97b' }]}>Network</Text>
              <Text style={styles.distributionValue}>{dashboardMetrics.networkSpeed.toFixed(1)}%</Text>
            </View>
            <View style={styles.distributionItem}>
              <Text style={[styles.distributionLabel, { color: '#ff6b6b' }]}>Storage</Text>
              <Text style={styles.distributionValue}>{dashboardMetrics.storageUsage.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* System Health Score */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>System Health Score</Text>
          <View style={styles.healthScoreContainer}>
            <View>
              <View style={styles.healthScoreCircle}>
                <Text style={styles.healthScoreText}>
                  {Math.round(100 - (dashboardMetrics.cpuUsage + dashboardMetrics.memoryUsage) / 2)}%
                </Text>
                <Text style={styles.healthScoreLabel}>Health Score</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Trends */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardTitle}>Performance Trends</Text>
          <View style={styles.trendsContainer}>
            <Text style={styles.trendsText}>
              CPU Trend: {performanceHistory.length > 0 ? 
                performanceHistory[performanceHistory.length - 1].cpuUsage.toFixed(1) : 0}%
            </Text>
            <Text style={styles.trendsText}>
              Memory Trend: {performanceHistory.length > 0 ? 
                performanceHistory[performanceHistory.length - 1].memoryUsage.toFixed(1) : 0}%
            </Text>
            <Text style={styles.trendsText}>
              Network Trend: {performanceHistory.length > 0 ? 
                performanceHistory[performanceHistory.length - 1].networkSpeed.toFixed(1) : 0}%
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'monitor':
        return renderMonitorTab();
      case 'advanced':
        return renderAdvancedTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Advanced System Monitoring</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isRealTimeMode ? '#4CAF50' : '#666' }]}
            onPress={() => setIsRealTimeMode(!isRealTimeMode)}
          >
            <MaterialIcons name="refresh" size={20} color="white" />
            <Text style={styles.controlButtonText}>
              {isRealTimeMode ? 'Real-time' : 'Manual'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Overview', icon: 'dashboard' },
          { key: 'monitor', label: 'Monitor', icon: 'speedometer' },
          { key: 'advanced', label: 'Advanced', icon: 'memory' },
          { key: 'analytics', label: 'Analytics', icon: 'analytics' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? '#667eea' : '#666'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.activeTabButtonText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  controlButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#f0f4ff',
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  activeTabButtonText: {
    color: '#667eea',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
  },
  metricCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  analyticsContainer: {
    padding: 20,
  },
  analyticsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  analyticsCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  healthScoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  healthScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  healthScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  healthScoreLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  performanceOverview: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  performanceText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  performanceDistribution: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  distributionItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  distributionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  distributionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  trendsContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  trendsText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
});

export default SystemMonitoringDashboard; 
