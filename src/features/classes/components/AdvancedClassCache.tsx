import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import RtlView from '../../../components/ui/RtlView';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import classService from '../services/classService';

interface AdvancedClassCacheProps {
  selectedClass: any;
  onCacheAction: (action: string, data: any) => void;
}

const AdvancedClassCache: React.FC<AdvancedClassCacheProps> = ({
  selectedClass,
  onCacheAction,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);
  const [cacheItems, setCacheItems] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  const TABS = [
    { key: 'overview', label: t('overview'), icon: 'dashboard' },
    { key: 'items', label: t('cacheItems'), icon: 'storage' },
    { key: 'settings', label: t('settings'), icon: 'settings' },
  ];

  // Rich dummy cache statistics
  const dummyCacheStats = {
    overview: {
      totalSize: '45.2 MB',
      totalItems: 1247,
      hitRate: 87.3,
      missRate: 12.7,
      averageResponseTime: 12.5,
      memoryUsage: 78.4,
      diskUsage: 45.2,
    },
    performance: {
      hitRateTrends: [82, 85, 88, 86, 89, 87, 90, 88, 92, 90, 89, 91],
      responseTimeTrends: [15, 14, 13, 12, 11, 12, 11, 10, 9, 10, 11, 12],
      memoryUsageTrends: [75, 76, 77, 78, 79, 78, 77, 76, 75, 76, 77, 78],
      cacheSizeTrends: [40, 41, 42, 43, 44, 43, 44, 45, 44, 45, 46, 45],
    },
    distribution: {
      byType: [
        { type: 'Students', size: 15.2, items: 450, percentage: 33.6 },
        { type: 'Assignments', size: 8.7, items: 280, percentage: 22.5 },
        { type: 'Grades', size: 12.3, items: 320, percentage: 25.7 },
        { type: 'Attendance', size: 6.8, items: 197, percentage: 15.8 },
      ],
      byStatus: [
        { status: 'Active', count: 1150, percentage: 92.2 },
        { status: 'Expired', count: 97, percentage: 7.8 },
      ],
    },
    topItems: [
      { key: 'students_list', type: 'Students', size: '2.3 MB', hits: 1250, lastAccess: '2 min ago' },
      { key: 'assignments_active', type: 'Assignments', size: '1.8 MB', hits: 890, lastAccess: '5 min ago' },
      { key: 'grades_recent', type: 'Grades', size: '3.1 MB', hits: 756, lastAccess: '1 min ago' },
      { key: 'attendance_today', type: 'Attendance', size: '0.9 MB', hits: 634, lastAccess: '3 min ago' },
      { key: 'subjects_list', type: 'Subjects', size: '0.5 MB', hits: 445, lastAccess: '10 min ago' },
    ],
  };

  // Rich dummy cache items
  const dummyCacheItems = [
    {
      id: 1,
      key: 'students_list',
      type: 'Students',
      size: '2.3 MB',
      status: 'Active',
      hits: 1250,
      misses: 45,
      hitRate: 96.5,
      lastAccess: '2024-02-15 14:30:25',
      expiresAt: '2024-02-15 16:30:25',
      ttl: 7200,
    },
    {
      id: 2,
      key: 'assignments_active',
      type: 'Assignments',
      size: '1.8 MB',
      status: 'Active',
      hits: 890,
      misses: 67,
      hitRate: 93.0,
      lastAccess: '2024-02-15 14:25:10',
      expiresAt: '2024-02-15 15:25:10',
      ttl: 3600,
    },
    {
      id: 3,
      key: 'grades_recent',
      type: 'Grades',
      size: '3.1 MB',
      status: 'Active',
      hits: 756,
      misses: 23,
      hitRate: 97.0,
      lastAccess: '2024-02-15 14:29:45',
      expiresAt: '2024-02-15 17:29:45',
      ttl: 10800,
    },
    {
      id: 4,
      key: 'attendance_today',
      type: 'Attendance',
      size: '0.9 MB',
      status: 'Active',
      hits: 634,
      misses: 89,
      hitRate: 87.7,
      lastAccess: '2024-02-15 14:27:30',
      expiresAt: '2024-02-15 16:27:30',
      ttl: 7200,
    },
    {
      id: 5,
      key: 'subjects_list',
      type: 'Subjects',
      size: '0.5 MB',
      status: 'Expired',
      hits: 445,
      misses: 12,
      hitRate: 97.4,
      lastAccess: '2024-02-15 13:45:20',
      expiresAt: '2024-02-15 14:45:20',
      ttl: 3600,
    },
    {
      id: 6,
      key: 'timetable_week',
      type: 'Timetable',
      size: '1.2 MB',
      status: 'Active',
      hits: 567,
      misses: 34,
      hitRate: 94.3,
      lastAccess: '2024-02-15 14:20:15',
      expiresAt: '2024-02-15 18:20:15',
      ttl: 14400,
    },
  ];

  useEffect(() => {
    loadCacheStats();
    if (activeTab === 'items') {
      loadCacheItems();
    }
  }, [activeTab]);

  const loadCacheStats = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCacheStats(dummyCacheStats);
    } catch (error) {
      
      setCacheStats(dummyCacheStats);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCacheItems = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setCacheItems(dummyCacheItems);
    } catch (error) {
      
      setCacheItems(dummyCacheItems);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chart configurations
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
  };

  // Generate chart data
  const generateHitRateTrendsData = () => {
    if (!cacheStats?.performance?.hitRateTrends) return null;
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        data: cacheStats.performance.hitRateTrends,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const generateResponseTimeTrendsData = () => {
    if (!cacheStats?.performance?.responseTimeTrends) return null;
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        data: cacheStats.performance.responseTimeTrends,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const generateTypeDistributionData = () => {
    if (!cacheStats?.distribution?.byType) return null;
    return cacheStats.distribution.byType.map(item => ({
      name: item.type,
      population: item.items,
      color: item.type === 'Students' ? '#4CAF50' : 
             item.type === 'Assignments' ? '#2196F3' : 
             item.type === 'Grades' ? '#FF9800' : '#9C27B0',
      legendFontColor: colors.text,
    }));
  };

  const generateStatusDistributionData = () => {
    if (!cacheStats?.distribution?.byStatus) return null;
    return cacheStats.distribution.byStatus.map(item => ({
      name: item.status,
      population: item.count,
      color: item.status === 'Active' ? '#4CAF50' : '#F44336',
      legendFontColor: colors.text,
    }));
  };

  // Handle cache operations
  const handleCacheOperation = (operation: string, itemId?: number) => {
    const items = itemId ? [itemId] : selectedItems;
    
    if (operation !== 'clear' && items.length === 0) {
      Alert.alert(t('noSelection'), t('pleaseSelectItems'));
      return;
    }

    Alert.alert(
      t('confirmOperation'),
      t('confirmCacheOperation', { operation, count: items.length }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: () => {
            onCacheAction(operation, { items, type: activeTab });
            if (operation === 'clear') {
              setSelectedItems([]);
            }
          }
        }
      ]
    );
  };

  // Handle item selection
  const handleItemSelection = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Render overview tab
  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {cacheStats ? (
        <>
          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="storage" size={24} color="#2196F3" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {cacheStats.overview.totalSize}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('totalSize')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="list" size={24} color="#4CAF50" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {cacheStats.overview.totalItems}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('totalItems')}
              </Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="trending-up" size={24} color="#FF9800" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {cacheStats.overview.hitRate}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('hitRate')}
              </Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="speed" size={24} color="#9C27B0" />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {cacheStats.overview.averageResponseTime}ms
              </Text>
              <Text style={[styles.metricLabel, { color: colors.text + '80' }]}>
                {t('avgResponseTime')}
              </Text>
            </View>
          </View>

          {/* Performance Charts */}
          {generateHitRateTrendsData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('hitRateTrends')}
              </Text>
              <LineChart
                data={generateHitRateTrendsData()}
                width={350}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {generateResponseTimeTrendsData() && (
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                {t('responseTimeTrends')}
              </Text>
              <LineChart
                data={generateResponseTimeTrendsData()}
                width={350}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {/* Distribution Charts */}
          <View style={styles.chartsRow}>
            {generateTypeDistributionData() && (
              <View style={[styles.chartCard, { backgroundColor: colors.card, flex: 1, marginRight: 8 }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  {t('typeDistribution')}
                </Text>
                <PieChart
                  data={generateTypeDistributionData()}
                  width={160}
                  height={160}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            )}

            {generateStatusDistributionData() && (
              <View style={[styles.chartCard, { backgroundColor: colors.card, flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  {t('statusDistribution')}
                </Text>
                <PieChart
                  data={generateStatusDistributionData()}
                  width={160}
                  height={160}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            )}
          </View>

          {/* Top Items */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('topCacheItems')}
            </Text>
            {cacheStats.topItems.map((item, index) => (
              <View key={index} style={styles.topItem}>
                <View style={styles.topItemInfo}>
                  <Text style={[styles.topItemKey, { color: colors.text }]}>
                    {item.key}
                  </Text>
                  <Text style={[styles.topItemType, { color: colors.text + '80' }]}>
                    {item.type} • {item.size}
                  </Text>
                </View>
                <View style={styles.topItemStats}>
                  <Text style={[styles.topItemHits, { color: colors.primary }]}>
                    {item.hits} {t('hits')}
                  </Text>
                  <Text style={[styles.topItemAccess, { color: colors.text + '80' }]}>
                    {item.lastAccess}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingCacheStats')}...
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // Render items tab
  const renderItemsTab = () => (
    <View style={styles.tabContent}>
      {/* Actions */}
      <View style={[styles.actionsSection, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => handleCacheOperation('refresh')}
        >
          <MaterialIcons name="refresh" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('refresh')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => handleCacheOperation('clear')}
        >
          <MaterialIcons name="clear-all" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('clearAll')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => handleCacheOperation('clearSelected')}
        >
          <MaterialIcons name="delete-sweep" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('clearSelected')}</Text>
        </TouchableOpacity>
      </View>

      {/* Cache Items List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('loadingCacheItems')}...
          </Text>
        </View>
      ) : (
        <FlatList
          data={cacheItems}
          renderItem={({ item }) => (
            <View style={[styles.cacheItemCard, { backgroundColor: colors.card }]}>
              <View style={styles.cacheItemHeader}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => handleItemSelection(item.id)}
                >
                  <MaterialIcons
                    name={selectedItems.includes(item.id) ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={selectedItems.includes(item.id) ? colors.primary : colors.text}
                  />
                </TouchableOpacity>
                
                <View style={styles.cacheItemInfo}>
                  <Text style={[styles.cacheItemKey, { color: colors.text }]}>
                    {item.key}
                  </Text>
                  <Text style={[styles.cacheItemType, { color: colors.text + '80' }]}>
                    {item.type} • {item.size}
                  </Text>
                </View>
                
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: item.status === 'Active' ? '#4CAF50' : '#F44336' }
                ]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              
              <View style={styles.cacheItemStats}>
                <View style={styles.statItem}>
                  <MaterialIcons name="trending-up" size={16} color={colors.text + '80'} />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {item.hits} {t('hits')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="trending-down" size={16} color={colors.text + '80'} />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {item.misses} {t('misses')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="speed" size={16} color={colors.text + '80'} />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {item.hitRate}% {t('hitRate')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="access-time" size={16} color={colors.text + '80'} />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {item.lastAccess}
                  </Text>
                </View>
              </View>

              <View style={styles.cacheItemActions}>
                <TouchableOpacity
                  style={[styles.itemActionButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleCacheOperation('refresh', item.id)}
                >
                  <MaterialIcons name="refresh" size={16} color="white" />
                  <Text style={styles.itemActionButtonText}>{t('refresh')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.itemActionButton, { backgroundColor: '#FF9800' }]}
                  onPress={() => handleCacheOperation('view', item.id)}
                >
                  <MaterialIcons name="visibility" size={16} color="white" />
                  <Text style={styles.itemActionButtonText}>{t('view')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.itemActionButton, { backgroundColor: '#F44336' }]}
                  onPress={() => handleCacheOperation('delete', item.id)}
                >
                  <MaterialIcons name="delete" size={16} color="white" />
                  <Text style={styles.itemActionButtonText}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cacheItemsList}
        />
      )}
    </View>
  );

  // Render settings tab
  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('cacheSettings')}
        </Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('autoRefresh')}
            </Text>
            <Text style={[styles.settingDescription, { color: colors.text + '80' }]}>
              {t('autoRefreshDesc')}
            </Text>
          </View>
          <Switch
            value={autoRefresh}
            onValueChange={setAutoRefresh}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={autoRefresh ? '#f4f3f4' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('maxCacheSize')}
            </Text>
            <Text style={[styles.settingDescription, { color: colors.text + '80' }]}>
              {t('maxCacheSizeDesc')}
            </Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.primary }]}>
            100 MB
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('defaultTTL')}
            </Text>
            <Text style={[styles.settingDescription, { color: colors.text + '80' }]}>
              {t('defaultTTLDesc')}
            </Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.primary }]}>
            1 hour
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('compression')}
            </Text>
            <Text style={[styles.settingDescription, { color: colors.text + '80' }]}>
              {t('compressionDesc')}
            </Text>
          </View>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{ false: '#767577', true: colors.primary }}
            thumbColor={'#f4f3f4'}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('cacheActions')}
        </Text>
        
        <TouchableOpacity
          style={[styles.settingAction, { backgroundColor: colors.background }]}
          onPress={() => handleCacheOperation('optimize')}
        >
          <MaterialIcons name="build" size={24} color={colors.primary} />
          <View style={styles.settingActionInfo}>
            <Text style={[styles.settingActionLabel, { color: colors.text }]}>
              {t('optimizeCache')}
            </Text>
            <Text style={[styles.settingActionDescription, { color: colors.text + '80' }]}>
              {t('optimizeCacheDesc')}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingAction, { backgroundColor: colors.background }]}
          onPress={() => handleCacheOperation('backup')}
        >
          <MaterialIcons name="backup" size={24} color={colors.primary} />
          <View style={styles.settingActionInfo}>
            <Text style={[styles.settingActionLabel, { color: colors.text }]}>
              {t('backupCache')}
            </Text>
            <Text style={[styles.settingActionDescription, { color: colors.text + '80' }]}>
              {t('backupCacheDesc')}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingAction, { backgroundColor: colors.background }]}
          onPress={() => handleCacheOperation('restore')}
        >
          <MaterialIcons name="restore" size={24} color={colors.primary} />
          <View style={styles.settingActionInfo}>
            <Text style={[styles.settingActionLabel, { color: colors.text }]}>
              {t('restoreCache')}
            </Text>
            <Text style={[styles.settingActionDescription, { color: colors.text + '80' }]}>
              {t('restoreCacheDesc')}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <RtlView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? colors.primary : colors.text}
              />
              <Text style={[
                styles.tabButtonText,
                { color: activeTab === tab.key ? colors.primary : colors.text }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'items' && renderItemsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
    </RtlView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  topItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  topItemInfo: {
    flex: 1,
  },
  topItemKey: {
    fontSize: 14,
    fontWeight: '500',
  },
  topItemType: {
    fontSize: 12,
  },
  topItemStats: {
    alignItems: 'flex-end',
  },
  topItemHits: {
    fontSize: 14,
    fontWeight: '500',
  },
  topItemAccess: {
    fontSize: 12,
  },
  actionsSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  cacheItemsList: {
    paddingBottom: 20,
  },
  cacheItemCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cacheItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  cacheItemInfo: {
    flex: 1,
  },
  cacheItemKey: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cacheItemType: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  cacheItemStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  cacheItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  itemActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemActionButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingActionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingActionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingActionDescription: {
    fontSize: 14,
  },
});

export default AdvancedClassCache; 
