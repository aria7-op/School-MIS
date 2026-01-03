import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, Text as PaperText, ProgressBar, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerCache from '../hooks/useCustomerCache';

interface CacheStats {
  totalEntries: number;
  memoryUsage: number;
  hitRate: number;
  lastUpdated: string;
  cacheSize: number;
}

const CacheManagement: React.FC = () => {
  const {
    loading,
    error,
    cacheStats,
    getCacheStats,
    clearCache,
    warmCache,
    optimizeCache,
  } = useCustomerCache();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      await getCacheStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to load cache stats');
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all customer cache? This will force fresh data to be loaded.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              Alert.alert('Success', 'Cache cleared successfully');
              loadCacheStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleRefreshCache = async () => {
    try {
      setRefreshing(true);
      await warmCache({});
      Alert.alert('Success', 'Cache refreshed successfully');
      loadCacheStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh cache');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOptimizeCache = async () => {
    try {
      await optimizeCache();
      Alert.alert('Success', 'Cache optimized successfully');
      loadCacheStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to optimize cache');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getHitRateColor = (hitRate: number): string => {
    if (hitRate >= 80) return '#4CAF50';
    if (hitRate >= 60) return '#FF9800';
    return '#F44336';
  };

  const renderCacheStats = () => {
    if (!cacheStats) return null;
    return (
      <Card style={styles.statsCard}>
        <Card.Content>
          <View style={styles.statsHeader}>
            <MaterialIcons name="analytics" size={24} color="#2196F3" />
            <Text style={styles.statsTitle}>Cache Statistics</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Entries</Text>
              <Text style={styles.statValue}>{cacheStats.totalEntries?.toLocaleString?.() ?? '-'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Memory Usage</Text>
              <Text style={styles.statValue}>{formatBytes(cacheStats.memoryUsage ?? 0)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Cache Size</Text>
              <Text style={styles.statValue}>{formatBytes(cacheStats.cacheSize ?? 0)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Last Updated</Text>
              <Text style={styles.statValue}>{cacheStats.lastUpdated ? formatDate(cacheStats.lastUpdated) : '-'}</Text>
            </View>
          </View>
          <View style={styles.hitRateSection}>
            <Text style={styles.hitRateLabel}>Cache Hit Rate</Text>
            <View style={styles.hitRateContainer}>
              <ProgressBar
                progress={(cacheStats.hitRate ?? 0) / 100}
                color={getHitRateColor(cacheStats.hitRate ?? 0)}
                style={styles.hitRateBar}
              />
              <Text style={[styles.hitRateText, { color: getHitRateColor(cacheStats.hitRate ?? 0) }]}> 
                {cacheStats.hitRate?.toFixed?.(1) ?? '-'}%
              </Text>
            </View>
            <View style={styles.hitRateLegend}>
              <Chip style={[styles.legendChip, { backgroundColor: '#4CAF50' }]}>Excellent (≥80%)</Chip>
              <Chip style={[styles.legendChip, { backgroundColor: '#FF9800' }]}>Good (60-79%)</Chip>
              <Chip style={[styles.legendChip, { backgroundColor: '#F44336' }]}>Poor (&lt;60%)</Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderCacheActions = () => (
    <Card style={styles.actionsCard}>
      <Card.Content>
        <Text style={styles.actionsTitle}>Cache Management</Text>
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleRefreshCache}
            loading={refreshing}
            style={styles.actionButton}
            icon="refresh"
          >
            Refresh Cache
          </Button>
          <Button
            mode="outlined"
            onPress={handleClearCache}
            loading={loading}
            style={styles.actionButton}
            icon="delete-sweep"
          >
            Clear Cache
          </Button>
          <Button
            mode="outlined"
            onPress={handleOptimizeCache}
            loading={loading}
            style={styles.actionButton}
            icon="tune"
          >
            Optimize Cache
          </Button>
        </View>
        <View style={styles.actionInfo}>
          <Text style={styles.infoText}>• Refresh Cache: Updates cache with latest data from server</Text>
          <Text style={styles.infoText}>• Clear Cache: Removes all cached data (forces fresh load)</Text>
          <Text style={styles.infoText}>• Optimize Cache: Cleans and optimizes cache for best performance</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderPerformanceTips = () => (
    <Card style={styles.tipsCard}>
      <Card.Content>
        <Text style={styles.tipsTitle}>Performance Tips</Text>
        <Text style={styles.tip}>• Regularly refresh cache to keep data up to date.</Text>
        <Text style={styles.tip}>• Clear cache if you notice stale or incorrect data.</Text>
        <Text style={styles.tip}>• Optimize cache periodically for best performance.</Text>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      {loading && <ActivityIndicator style={{ margin: 16 }} />}
      {error && <Text style={{ color: 'red', margin: 16 }}>{error}</Text>}
      {renderCacheStats()}
      {renderCacheActions()}
      {renderPerformanceTips()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  hitRateSection: {
    marginTop: 8,
  },
  hitRateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  hitRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  hitRateBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  hitRateText: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 50,
  },
  hitRateLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendChip: {
    height: 24,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  actionInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tipsCard: {
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tip: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
});

export default CacheManagement; 
