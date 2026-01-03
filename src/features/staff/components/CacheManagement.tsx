import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Card, Button, ProgressBar, SegmentedButtons, Chip } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import useStaffApi, { CacheStats } from '../hooks/useStaffApi';

interface CacheManagementProps {
  cacheStats?: CacheStats | null;
  onWarmCache: () => Promise<void>;
  onClearCache: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

const CacheManagement: React.FC<CacheManagementProps> = ({
  cacheStats,
  onWarmCache,
  onClearCache,
  onRefresh
}) => {
  const {
    loading,
    error,
    getCacheStats,
    warmCache,
    clearCache,
    getStaffStats,
    getStaffCountByDepartment,
    getStaffCountByDesignation
  } = useStaffApi();

  const [activeTab, setActiveTab] = useState('overview');
  const [cachePerformance, setCachePerformance] = useState({
    hitRate: 0,
    missRate: 0,
    memoryUsage: 0,
    totalKeys: 0
  });
  const [warmProgress, setWarmProgress] = useState(0);
  const [isWarming, setIsWarming] = useState(false);
  const [cacheHistory, setCacheHistory] = useState<any[]>([]);

  useEffect(() => {
    if (cacheStats) {
      setCachePerformance({
        hitRate: cacheStats.hitRate,
        missRate: cacheStats.missRate,
        memoryUsage: cacheStats.memoryUsage,
        totalKeys: cacheStats.totalKeys
      });
    }
  }, [cacheStats]);

  const handleWarmCache = async () => {
    setIsWarming(true);
    setWarmProgress(0);
    
    try {
      // Simulate warming different cache sections
      const warmingSteps = [
        { name: 'Staff Statistics', progress: 20 },
        { name: 'Department Stats', progress: 40 },
        { name: 'Designation Stats', progress: 60 },
        { name: 'Staff Analytics', progress: 80 },
        { name: 'Cache Optimization', progress: 100 }
      ];

      for (const step of warmingSteps) {
        setWarmProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
        
        // Actually warm the cache
        await warmCache({ schoolId: 1 });
      }

      await onWarmCache();
      Alert.alert('Success', 'Cache warmed successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsWarming(false);
      setWarmProgress(0);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Confirm Clear Cache',
      'This will clear all cached data. Performance may be temporarily affected. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await onClearCache();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const handleRefreshStats = async () => {
    try {
      await onRefresh();
      Alert.alert('Success', 'Cache statistics refreshed');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleWarmSpecificCache = async (type: string) => {
    try {
      switch (type) {
        case 'staff':
          await getStaffStats(1);
          break;
        case 'department':
          await getStaffCountByDepartment();
          break;
        case 'designation':
          await getStaffCountByDesignation();
          break;
        default:
          await warmCache({ schoolId: 1 });
      }
      Alert.alert('Success', `${type} cache warmed successfully`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const getCacheHealthColor = (hitRate: number) => {
    if (hitRate >= 80) return '#4CAF50';
    if (hitRate >= 60) return '#FF9800';
    return '#f44336';
  };

  const getCacheHealthStatus = (hitRate: number) => {
    if (hitRate >= 80) return 'Excellent';
    if (hitRate >= 60) return 'Good';
    return 'Poor';
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.container}>
      {/* Cache Health Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Cache Health</Text>
          <View style={styles.healthSection}>
            <View style={styles.healthIndicator}>
              <MaterialIcons 
                name="cached" 
                size={48} 
                color={getCacheHealthColor(cachePerformance.hitRate)} 
              />
              <Text style={styles.healthStatus}>
                {getCacheHealthStatus(cachePerformance.hitRate)}
              </Text>
            </View>
            <View style={styles.healthStats}>
              <Text style={styles.healthNumber}>{cachePerformance.hitRate}%</Text>
              <Text style={styles.healthLabel}>Hit Rate</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Cache Statistics */}
      {cacheStats && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Cache Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="key" size={24} color="#2196F3" />
                <Text style={styles.statNumber}>{cacheStats.totalKeys}</Text>
                <Text style={styles.statLabel}>Total Keys</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="memory" size={24} color="#FF9800" />
                <Text style={styles.statNumber}>{cacheStats.memoryUsage}MB</Text>
                <Text style={styles.statLabel}>Memory Usage</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>{cacheStats.hitRate}%</Text>
                <Text style={styles.statLabel}>Hit Rate</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="error" size={24} color="#f44336" />
                <Text style={styles.statNumber}>{cacheStats.missRate}%</Text>
                <Text style={styles.statLabel}>Miss Rate</Text>
              </View>
            </View>
            
            <Text style={styles.lastWarmed}>
              Last Warmed: {new Date(cacheStats.lastWarmed).toLocaleString()}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Performance Metrics</Text>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Hit Rate</Text>
            <ProgressBar 
              progress={cachePerformance.hitRate / 100} 
              color={getCacheHealthColor(cachePerformance.hitRate)}
              style={styles.progressBar}
            />
            <Text style={styles.metricValue}>{cachePerformance.hitRate}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Memory Usage</Text>
            <ProgressBar 
              progress={Math.min(cachePerformance.memoryUsage / 100, 1)} 
              color="#FF9800"
              style={styles.progressBar}
            />
            <Text style={styles.metricValue}>{cachePerformance.memoryUsage}MB</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              onPress={() => handleWarmSpecificCache('staff')}
              icon="account-group"
              style={styles.quickButton}
            >
              Warm Staff Cache
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleWarmSpecificCache('department')}
              icon="domain"
              style={styles.quickButton}
            >
              Warm Department Cache
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderWarmingTab = () => (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Cache Warming</Text>
          <Text style={styles.cardSubtitle}>
            Warm up the cache to improve performance by pre-loading frequently accessed data
          </Text>

          {isWarming && (
            <View style={styles.warmingSection}>
              <Text style={styles.warmingTitle}>Warming Cache...</Text>
              <ProgressBar 
                progress={warmProgress / 100} 
                color="#2196F3"
                style={styles.warmingProgress}
              />
              <Text style={styles.warmingProgress}>{warmProgress}%</Text>
            </View>
          )}

          <View style={styles.warmingOptions}>
            <Text style={styles.sectionTitle}>Warming Options:</Text>
            <View style={styles.chipGroup}>
              <Chip
                selected={true}
                style={styles.chip}
              >
                Staff Statistics
              </Chip>
              <Chip
                selected={true}
                style={styles.chip}
              >
                Department Stats
              </Chip>
              <Chip
                selected={true}
                style={styles.chip}
              >
                Designation Stats
              </Chip>
              <Chip
                selected={true}
                style={styles.chip}
              >
                Analytics Data
              </Chip>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleWarmCache}
            loading={isWarming}
            disabled={isWarming}
            icon="cached"
            style={styles.warmButton}
          >
            {isWarming ? 'Warming Cache...' : 'Warm Cache'}
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Warming History</Text>
          <View style={styles.historyList}>
            {cacheHistory.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <MaterialIcons name="cached" size={20} color="#2196F3" />
                <Text style={styles.historyText}>
                  {item.type} - {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
            {cacheHistory.length === 0 && (
              <Text style={styles.emptyText}>No warming history available</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderMaintenanceTab = () => (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Cache Maintenance</Text>
          <Text style={styles.cardSubtitle}>
            Manage cache performance and storage
          </Text>

          <View style={styles.maintenanceSection}>
            <Text style={styles.sectionTitle}>Maintenance Actions:</Text>
            
            <Button
              mode="outlined"
              onPress={handleRefreshStats}
              icon="refresh"
              style={styles.maintenanceButton}
            >
              Refresh Statistics
            </Button>

            <Button
              mode="outlined"
              onPress={handleClearCache}
              icon="clear"
              style={[styles.maintenanceButton, styles.clearButton]}
            >
              Clear All Cache
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Cache Recommendations</Text>
          <View style={styles.recommendations}>
            {cachePerformance.hitRate < 60 && (
              <View style={styles.recommendation}>
                <MaterialIcons name="warning" size={20} color="#FF9800" />
                <Text style={styles.recommendationText}>
                  Low hit rate detected. Consider warming the cache.
                </Text>
              </View>
            )}
            {cachePerformance.memoryUsage > 80 && (
              <View style={styles.recommendation}>
                <MaterialIcons name="memory" size={20} color="#f44336" />
                <Text style={styles.recommendationText}>
                  High memory usage. Consider clearing old cache entries.
                </Text>
              </View>
            )}
            {cachePerformance.hitRate >= 80 && (
              <View style={styles.recommendation}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.recommendationText}>
                  Cache performance is excellent!
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'overview', label: 'Overview', icon: 'dashboard' },
            { value: 'warming', label: 'Warming', icon: 'cached' },
            { value: 'maintenance', label: 'Maintenance', icon: 'build' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.content}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'warming' && renderWarmingTab()}
        {activeTab === 'maintenance' && renderMaintenanceTab()}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text>Loading cache data...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  healthSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthIndicator: {
    alignItems: 'center',
  },
  healthStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  healthStats: {
    alignItems: 'center',
  },
  healthNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  healthLabel: {
    fontSize: 12,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  lastWarmed: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  metricItem: {
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  warmingSection: {
    marginBottom: 20,
  },
  warmingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warmingProgress: {
    marginBottom: 8,
  },
  warmingOptions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  warmButton: {
    marginTop: 8,
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  maintenanceSection: {
    marginBottom: 20,
  },
  maintenanceButton: {
    marginBottom: 12,
  },
  clearButton: {
    borderColor: '#f44336',
  },
  recommendations: {
    marginTop: 8,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f44336',
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CacheManagement; 
