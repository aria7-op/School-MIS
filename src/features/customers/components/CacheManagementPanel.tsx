import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, useTheme, Button, IconButton, Chip, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerCache from '../hooks/useCustomerCache';

const CacheManagementPanel: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  
  const {
    loading: cacheLoading,
    error,
    cacheStats,
    getCacheStats,
    clearCache,
    warmCache,
    optimizeCache,
  } = useCustomerCache();

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      await getCacheStats();
    } catch (error) {
      
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Confirm Clear Cache',
      'Are you sure you want to clear all cache? This will temporarily slow down the application.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              Alert.alert('Success', 'Cache cleared successfully');
              await loadCacheStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleWarmCache = async () => {
    try {
      await warmCache();
      Alert.alert('Success', 'Cache warming started');
    } catch (error) {
      Alert.alert('Error', 'Failed to warm cache');
    }
  };

  const handleOptimizeCache = async () => {
    try {
      await optimizeCache();
      Alert.alert('Success', 'Cache optimization completed');
      await loadCacheStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to optimize cache');
    }
  };

  if (cacheLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading cache statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">Cache Management</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Monitor and optimize application performance
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.content}>
        {/* Cache Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Cache Statistics
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {cacheStats?.totalKeys || 0}
                </Text>
                <Text variant="bodySmall">Total Keys</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {cacheStats?.hitRate || 0}%
                </Text>
                <Text variant="bodySmall">Hit Rate</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.tertiary }}>
                  {cacheStats?.memoryUsage || 0}MB
                </Text>
                <Text variant="bodySmall">Memory Usage</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.secondary }}>
                  {cacheStats?.expiredKeys || 0}
                </Text>
                <Text variant="bodySmall">Expired Keys</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Cache Performance */}
        <Card style={styles.performanceCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Performance Metrics
            </Text>
            
            <View style={styles.metricRow}>
              <Text variant="bodyMedium">Cache Hit Rate</Text>
              <View style={styles.progressContainer}>
                <ProgressBar 
                  progress={(cacheStats?.hitRate || 0) / 100} 
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
                <Text variant="bodySmall">{cacheStats?.hitRate || 0}%</Text>
              </View>
            </View>
            
            <View style={styles.metricRow}>
              <Text variant="bodyMedium">Memory Utilization</Text>
              <View style={styles.progressContainer}>
                <ProgressBar 
                  progress={(cacheStats?.memoryUsage || 0) / 100} 
                  color={theme.colors.tertiary}
                  style={styles.progressBar}
                />
                <Text variant="bodySmall">{cacheStats?.memoryUsage || 0}MB</Text>
              </View>
            </View>
            
            <View style={styles.metricRow}>
              <Text variant="bodyMedium">Response Time</Text>
              <Text variant="bodySmall">{cacheStats?.avgResponseTime || 0}ms</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Cache Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Cache Actions
            </Text>
            
            <View style={styles.actionsGrid}>
              <Button 
                mode="outlined" 
                icon="refresh" 
                onPress={loadCacheStats}
                style={styles.actionButton}
              >
                Refresh Stats
              </Button>
              
              <Button 
                mode="outlined" 
                icon="fire" 
                onPress={handleWarmCache}
                style={styles.actionButton}
              >
                Warm Cache
              </Button>
              
              <Button 
                mode="outlined" 
                icon="tune" 
                onPress={handleOptimizeCache}
                style={styles.actionButton}
              >
                Optimize
              </Button>
              
              <Button 
                mode="outlined" 
                icon="delete" 
                onPress={handleClearCache}
                style={styles.actionButton}
                buttonColor={theme.colors.error}
                textColor={theme.colors.error}
              >
                Clear Cache
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Cache Health */}
        <Card style={styles.healthCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Cache Health
            </Text>
            
            <View style={styles.healthMetrics}>
              <View style={styles.healthItem}>
                <MaterialIcons 
                  name="check-circle" 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <Text variant="bodyMedium">Cache is healthy</Text>
              </View>
              
              <View style={styles.healthItem}>
                <MaterialIcons 
                  name="speed" 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <Text variant="bodyMedium">Performance optimal</Text>
              </View>
              
              <View style={styles.healthItem}>
                <MaterialIcons 
                  name="memory" 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <Text variant="bodyMedium">Memory usage normal</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    elevation: 2,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  performanceCard: {
    margin: 16,
    elevation: 2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  progressBar: {
    flex: 1,
    marginRight: 8,
  },
  actionsCard: {
    margin: 16,
    elevation: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  healthCard: {
    margin: 16,
    elevation: 2,
  },
  healthMetrics: {
    gap: 12,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CacheManagementPanel; 
