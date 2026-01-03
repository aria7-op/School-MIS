import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Switch,
  FlatList,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProgressChart, LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';

const { width } = Dimensions.get('window');

interface CacheTabProps {
  dummyData: any;
  chartConfig: any;
  renderChartCard: (title: string, children: React.ReactNode) => React.ReactNode;
}

const CacheTab: React.FC<CacheTabProps> = ({
  dummyData,
  chartConfig,
  renderChartCard,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Advanced Cache State
  const [cacheView, setCacheView] = useState<'overview' | 'detailed' | 'analytics' | 'management'>('overview');
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [cacheMonitoring, setCacheMonitoring] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  const [selectedCacheType, setSelectedCacheType] = useState('all');

  // Advanced Cache Data
  const cacheMetrics = {
    hitRate: 94.7,
    missRate: 5.3,
    memoryUsage: 1247,
    maxMemory: 2048,
    totalRequests: 15847,
    cacheSize: 8432,
    evictions: 234,
    avgResponseTime: 12.3,
    throughput: 1250,
    efficiency: 96.8,
  };

  const cacheTypes = [
    { type: 'Student Data', size: 2847, hitRate: 96.2, memory: 387, color: '#3b82f6' },
    { type: 'Class Info', size: 1923, hitRate: 94.8, memory: 245, color: '#10b981' },
    { type: 'Grade Records', size: 2156, hitRate: 92.1, memory: 312, color: '#f59e0b' },
    { type: 'Attendance', size: 1506, hitRate: 97.3, memory: 203, color: '#8b5cf6' },
    { type: 'Analytics', size: 987, hitRate: 89.5, memory: 156, color: '#ef4444' },
  ];

  const performanceHistory = {
    labels: ['1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h'],
    hitRate: [94, 95, 93, 96, 94, 97, 95, 94],
    responseTime: [15, 12, 18, 11, 13, 9, 14, 12],
    memoryUsage: [1150, 1200, 1180, 1250, 1220, 1280, 1260, 1247],
  };

  const cacheOperations = [
    { operation: 'GET', count: 12547, avgTime: 8.2, successRate: 98.7 },
    { operation: 'SET', count: 2834, avgTime: 15.6, successRate: 99.2 },
    { operation: 'DELETE', count: 456, avgTime: 12.1, successRate: 99.8 },
    { operation: 'FLUSH', count: 23, avgTime: 234.5, successRate: 100.0 },
  ];

  const cacheAlerts = [
    {
      id: 1,
      type: 'warning',
      message: 'Memory usage approaching 80% threshold',
      timestamp: '2024-01-15 14:23:45',
      severity: 'medium',
    },
    {
      id: 2,
      type: 'info',
      message: 'Cache optimization completed successfully',
      timestamp: '2024-01-15 13:15:22',
      severity: 'low',
    },
    {
      id: 3,
      type: 'error',
      message: 'Cache eviction rate higher than normal',
      timestamp: '2024-01-15 12:45:18',
      severity: 'high',
    },
  ];

  const cacheSettings = {
    maxMemory: 2048,
    evictionPolicy: 'LRU',
    ttl: 3600,
    compressionEnabled: true,
    persistenceEnabled: false,
    autoBackup: true,
    monitoringInterval: 60,
  };

  // Advanced Functions
  const handleCacheAction = (action: string) => {
    Alert.alert(
      'Cache Action',
      `Performing ${action} operation...`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => {
          Alert.alert('Success', `${action} operation completed successfully`);
        }},
      ]
    );
  };

  const handleBulkOperation = (operation: string) => {
    Alert.alert(
      'Bulk Operation',
      `This will ${operation} all cache entries. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: () => {
          Alert.alert('Processing', `Bulk ${operation} operation initiated...`);
        }},
      ]
    );
  };

  const renderCacheOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.overviewGrid}>
        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <MaterialIcons name="trending-up" size={32} color="#10b981" />
          <Text style={[styles.overviewValue, { color: colors.text }]}>{cacheMetrics.hitRate}%</Text>
          <Text style={[styles.overviewLabel, { color: colors.text + '80' }]}>Hit Rate</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <MaterialIcons name="memory" size={32} color="#3b82f6" />
          <Text style={[styles.overviewValue, { color: colors.text }]}>{cacheMetrics.memoryUsage}MB</Text>
          <Text style={[styles.overviewLabel, { color: colors.text + '80' }]}>Memory Usage</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <MaterialIcons name="storage" size={32} color="#f59e0b" />
          <Text style={[styles.overviewValue, { color: colors.text }]}>{cacheMetrics.cacheSize.toLocaleString()}</Text>
          <Text style={[styles.overviewLabel, { color: colors.text + '80' }]}>Cache Entries</Text>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
          <MaterialIcons name="speed" size={32} color="#8b5cf6" />
          <Text style={[styles.overviewValue, { color: colors.text }]}>{cacheMetrics.avgResponseTime}ms</Text>
          <Text style={[styles.overviewLabel, { color: colors.text + '80' }]}>Avg Response</Text>
        </View>
      </View>

      <View style={[styles.efficiencyCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.efficiencyTitle, { color: colors.text }]}>Cache Efficiency</Text>
        <Text style={[styles.efficiencyValue, { color: '#10b981' }]}>{cacheMetrics.efficiency}%</Text>
        <View style={styles.efficiencyBar}>
          <View
            style={[
              styles.efficiencyFill,
              {
                width: `${cacheMetrics.efficiency}%`,
                backgroundColor: '#10b981',
              }
            ]}
          />
        </View>
        <Text style={[styles.efficiencySubtitle, { color: colors.text + '80' }]}>
          {cacheMetrics.totalRequests.toLocaleString()} total requests processed
        </Text>
      </View>
    </View>
  );

  const renderCacheTypes = () => (
    <View style={[styles.typesContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Cache Types Analysis</Text>
      {cacheTypes.map((type, index) => (
        <TouchableOpacity
          key={index}
          style={styles.typeItem}
          onPress={() => Alert.alert('Cache Type Details', `Detailed analysis for ${type.type}`)}
        >
          <View style={styles.typeLeft}>
            <View style={[styles.typeIndicator, { backgroundColor: type.color }]} />
            <View>
              <Text style={[styles.typeName, { color: colors.text }]}>{type.type}</Text>
              <Text style={[styles.typeSize, { color: colors.text + '80' }]}>
                {type.size.toLocaleString()} entries • {type.memory}MB
              </Text>
            </View>
          </View>
          <View style={styles.typeRight}>
            <Text style={[styles.typeHitRate, { color: '#10b981' }]}>{type.hitRate}%</Text>
            <Text style={[styles.typeLabel, { color: colors.text + '60' }]}>Hit Rate</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOperationsStats = () => (
    <View style={[styles.operationsContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Operation Statistics</Text>
      {cacheOperations.map((op, index) => (
        <View key={index} style={styles.operationItem}>
          <View style={styles.operationLeft}>
            <Text style={[styles.operationName, { color: colors.text }]}>{op.operation}</Text>
            <Text style={[styles.operationCount, { color: colors.text + '80' }]}>
              {op.count.toLocaleString()} operations
            </Text>
          </View>
          <View style={styles.operationRight}>
            <Text style={[styles.operationTime, { color: '#3b82f6' }]}>{op.avgTime}ms</Text>
            <Text style={[styles.operationSuccess, { color: '#10b981' }]}>{op.successRate}%</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCacheAlerts = () => (
    <View style={[styles.alertsContainer, { backgroundColor: colors.card }]}>
      <View style={styles.alertsHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>System Alerts</Text>
        <Switch
          value={cacheMonitoring}
          onValueChange={setCacheMonitoring}
          trackColor={{ false: colors.border, true: colors.primary + '40' }}
          thumbColor={cacheMonitoring ? colors.primary : '#f4f3f4'}
        />
      </View>
      
      {cacheAlerts.map((alert) => (
        <View
          key={alert.id}
          style={[
            styles.alertItem,
            {
              backgroundColor: alert.severity === 'high' ? '#ef444420' :
                              alert.severity === 'medium' ? '#f59e0b20' : '#3b82f620',
              borderLeftColor: alert.severity === 'high' ? '#ef4444' :
                              alert.severity === 'medium' ? '#f59e0b' : '#3b82f6',
            }
          ]}
        >
          <MaterialIcons
            name={alert.type === 'error' ? 'error' : alert.type === 'warning' ? 'warning' : 'info'}
            size={20}
            color={alert.severity === 'high' ? '#ef4444' :
                   alert.severity === 'medium' ? '#f59e0b' : '#3b82f6'}
          />
          <View style={styles.alertContent}>
            <Text style={[styles.alertMessage, { color: colors.text }]}>{alert.message}</Text>
            <Text style={[styles.alertTime, { color: colors.text + '60' }]}>{alert.timestamp}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderAdvancedActions = () => (
    <View style={[styles.actionsContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Advanced Cache Operations</Text>
      
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#10b981' + '20' }]}
          onPress={() => handleCacheAction('refresh')}
        >
          <MaterialIcons name="refresh" size={32} color="#10b981" />
          <Text style={[styles.actionText, { color: '#10b981' }]}>Refresh Cache</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3b82f6' + '20' }]}
          onPress={() => handleCacheAction('optimize')}
        >
          <MaterialIcons name="tune" size={32} color="#3b82f6" />
          <Text style={[styles.actionText, { color: '#3b82f6' }]}>Optimize</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#f59e0b' + '20' }]}
          onPress={() => handleBulkOperation('clear')}
        >
          <MaterialIcons name="clear-all" size={32} color="#f59e0b" />
          <Text style={[styles.actionText, { color: '#f59e0b' }]}>Clear All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#8b5cf6' + '20' }]}
          onPress={() => handleCacheAction('backup')}
        >
          <MaterialIcons name="backup" size={32} color="#8b5cf6" />
          <Text style={[styles.actionText, { color: '#8b5cf6' }]}>Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ef4444' + '20' }]}
          onPress={() => setShowLogsModal(true)}
        >
          <MaterialIcons name="list-alt" size={32} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>View Logs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#06b6d4' + '20' }]}
          onPress={() => setShowSettingsModal(true)}
        >
          <MaterialIcons name="settings" size={32} color="#06b6d4" />
          <Text style={[styles.actionText, { color: '#06b6d4' }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Advanced Cache Header */}
      <View style={[styles.cacheHeader, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Cache Management Center</Text>
          <TouchableOpacity
            style={[styles.monitorButton, { backgroundColor: realTimeUpdates ? '#10b981' : colors.border }]}
            onPress={() => setRealTimeUpdates(!realTimeUpdates)}
          >
            <MaterialIcons 
              name="monitor" 
              size={20} 
              color={realTimeUpdates ? '#ffffff' : colors.text} 
            />
          </TouchableOpacity>
        </View>

        {/* View Mode Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewModeScroll}>
          {['overview', 'detailed', 'analytics', 'management'].map(view => (
            <TouchableOpacity
              key={view}
              style={[
                styles.viewModeButton,
                cacheView === view && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => setCacheView(view as any)}
            >
              <Text style={[
                styles.viewModeText,
                { color: cacheView === view ? colors.primary : colors.text }
              ]}>
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Advanced Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, autoOptimize && { backgroundColor: '#10b981' + '20' }]}
            onPress={() => setAutoOptimize(!autoOptimize)}
          >
            <MaterialIcons
              name="auto-awesome"
              size={20}
              color={autoOptimize ? '#10b981' : colors.text + '60'}
            />
            <Text style={[
              styles.controlButtonText,
              { color: autoOptimize ? '#10b981' : colors.text + '60' }
            ]}>
              Auto Optimize
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cache Overview */}
      {renderCacheOverview()}

      {/* Performance Charts */}
      {renderChartCard(
        'Cache Performance Trends',
        <LineChart
          data={{
            labels: performanceHistory.labels,
            datasets: [
              {
                data: performanceHistory.hitRate,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                strokeWidth: 3,
              },
              {
                data: performanceHistory.responseTime,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          }}
          width={width - 64}
          height={220}
          chartConfig={chartConfig}
          bezier
          withShadow
        />
      )}

      {/* Cache Types Distribution */}
      {renderChartCard(
        'Cache Types Distribution',
        <PieChart
          data={cacheTypes.map(type => ({
            name: type.type.split(' ')[0],
            population: type.size,
            color: type.color,
            legendFontColor: colors.text,
            legendFontSize: 12,
          }))}
          width={width - 64}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      )}

      {/* Cache Types Analysis */}
      {renderCacheTypes()}

      {/* Operations Statistics */}
      {renderOperationsStats()}

      {/* System Alerts */}
      {renderCacheAlerts()}

      {/* Advanced Actions */}
      {renderAdvancedActions()}

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Cache Settings</Text>
            
            <View style={styles.settingsList}>
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Max Memory (MB)</Text>
                <TextInput
                  style={[styles.settingInput, { backgroundColor: colors.background, color: colors.text }]}
                  value={cacheSettings.maxMemory.toString()}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>TTL (seconds)</Text>
                <TextInput
                  style={[styles.settingInput, { backgroundColor: colors.background, color: colors.text }]}
                  value={cacheSettings.ttl.toString()}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.settingToggle}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Compression</Text>
                <Switch
                  value={cacheSettings.compressionEnabled}
                  onValueChange={() => {}}
                  trackColor={{ false: colors.border, true: colors.primary + '40' }}
                  thumbColor={cacheSettings.compressionEnabled ? colors.primary : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingToggle}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Auto Backup</Text>
                <Switch
                  value={cacheSettings.autoBackup}
                  onValueChange={() => {}}
                  trackColor={{ false: colors.border, true: colors.primary + '40' }}
                  thumbColor={cacheSettings.autoBackup ? colors.primary : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Alert.alert('Settings Saved', 'Cache settings updated successfully');
                  setShowSettingsModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  cacheHeader: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  monitorButton: {
    padding: 8,
    borderRadius: 8,
  },
  viewModeScroll: {
    marginBottom: 16,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  overviewContainer: {
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  overviewCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  efficiencyCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  efficiencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  efficiencyValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  efficiencyBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  efficiencyFill: {
    height: '100%',
    borderRadius: 4,
  },
  efficiencySubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  typesContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  typeLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeSize: {
    fontSize: 12,
  },
  typeRight: {
    alignItems: 'flex-end',
  },
  typeHitRate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  operationsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  operationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  operationLeft: {
    flex: 1,
  },
  operationName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  operationCount: {
    fontSize: 12,
  },
  operationRight: {
    alignItems: 'flex-end',
  },
  operationTime: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  operationSuccess: {
    fontSize: 12,
    marginTop: 2,
  },
  alertsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
  },
  actionsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsList: {
    marginBottom: 20,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  settingInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CacheTab; 
