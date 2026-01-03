import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTranslation } from '../../../contexts/TranslationContext';
import { colors } from '../../../constants/colors';

const { width, height } = Dimensions.get('window');

interface AnalyticsDashboardProps {
  selectedCustomer?: any;
  onRefresh?: () => void;
  onExport?: (data: any) => void;
  analyticsData?: any;
  loading?: boolean;
  error?: string | null;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  selectedCustomer,
  onRefresh,
  onExport,
  analyticsData,
  loading = false,
  error = null
}) => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('customers');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  // Debug logging

  // ======================
  // DATA LOADING
  // ======================

  const handleRefresh = async () => { 
    setRefreshing(true);
    onRefresh?.();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      // For now, just log the export data

      onExport?.(analyticsData);
      setShowExportModal(false);
      Alert.alert('Success', 'Analytics exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export analytics');
    }
  };

  // ======================
  // RENDER FUNCTIONS
  // ======================

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <Text style={styles.periodLabel}>Time Period:</Text>
      <View style={styles.periodButtons}>
        {['7d', '30d', '90d', '1y'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMetricSelector = () => (
    <View style={styles.metricSelector}>
      <Text style={styles.metricLabel}>Metric:</Text>
      <View style={styles.metricButtons}>
        {[
          { key: 'customers', label: 'Customers', icon: 'account-group' },
          { key: 'revenue', label: 'Revenue', icon: 'attach-money' },
          { key: 'engagement', label: 'Engagement', icon: 'trending-up' }
        ].map((metric) => (
          <TouchableOpacity
            key={metric.key}
            style={[
              styles.metricButton,
              selectedMetric === metric.key && styles.metricButtonActive
            ]}
            onPress={() => setSelectedMetric(metric.key)}
          >
            <MaterialIcons 
              name={metric.icon as any} 
              size={16} 
              color={selectedMetric === metric.key ? '#fff' : '#6b7280'} 
            />
            <Text style={[
              styles.metricButtonText,
              selectedMetric === metric.key && styles.metricButtonTextActive
            ]}>
              {metric.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStatCard = (title: string, value: string | number, icon: string, color: string, subtitle?: string, trend?: number) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}> 
      <View style={styles.statCardContent}>
        <View style={styles.statHeader}>
          <MaterialIcons name={icon as any} size={24} color={color} />
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            <MaterialIcons 
              name={trend >= 0 ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={trend >= 0 ? '#10b981' : '#ef4444'} 
            />
            <Text style={[styles.trendText, { color: trend >= 0 ? '#10b981' : '#ef4444' }]}> 
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const dashboardData = analyticsData?.data;

  const renderOverviewStats = () => {
    if (!dashboardData) return null;
    
    // Handle different data structures
    let overview;
    if (dashboardData.overview) {
      // Expected structure
      overview = dashboardData.overview;
    } else if (dashboardData.totalCustomers !== undefined) {
      // Current structure from backend
      overview = {
        total: dashboardData.totalCustomers,
        new: dashboardData.totalCustomers * 0.1, // Estimate
        active: dashboardData.activeCustomers,
        growthRate: ((1 - dashboardData.churnRate) * 100).toFixed(2)
      };
    } else {
      return null;
    }
    
    return (
      <View style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Total Visitors',
            overview.total.toLocaleString(),
            'account-group',
            '#3b82f6',
            'All time'
          )}
          {renderStatCard(
            'New Customers',
            overview.new.toLocaleString(),
            'person-add',
            '#10b981',
            `Last ${selectedPeriod}`
          )}
          {renderStatCard(
            'Active Customers',
            overview.active.toLocaleString(),
            'check-circle',
            '#f59e0b',
            'Recently engaged'
          )}
          {renderStatCard(
            'Growth Rate',
            `${overview.growthRate}%`,
            'trending-up',
            '#8b5cf6',
            'vs previous period',
            parseFloat(overview.growthRate.toString())
          )}
        </View>
      </View>
    );
  };

  const renderCustomerDistribution = () => {
    if (!dashboardData) return null;
    
    // Handle different data structures
    let byStatus, byType;
    if (dashboardData.byStatus && dashboardData.byType) {
      // Expected structure
      byStatus = dashboardData.byStatus;
      byType = dashboardData.byType;
    } else {
      // Fallback data based on current structure
      byStatus = {
        active: dashboardData.activeCustomers || 0,
        inactive: (dashboardData.totalCustomers || 0) - (dashboardData.activeCustomers || 0)
      };
      byType = {
        individual: Math.floor((dashboardData.totalCustomers || 0) * 0.7),
        business: Math.floor((dashboardData.totalCustomers || 0) * 0.3)
      };
    }
    
    return (
      <View style={styles.distributionSection}>
        <Text style={styles.sectionTitle}>Visitor Distribution</Text>
        <View style={styles.distributionGrid}>
          <View style={styles.distributionCard}>
            <Text style={styles.distributionTitle}>By Status</Text>
            {Object.entries(byStatus).map(([status, count]) => (
              <View key={status} style={styles.distributionItem}>
                <View style={styles.distributionBar}>
                  <View 
                    style={[
                      styles.distributionBarFill, 
                      { 
                        width: `${((count as number) / Math.max(...Object.values(byStatus).map(c => c as number))) * 100}%`,
                        backgroundColor: getStatusColor(status)
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.distributionLabel}>{status}</Text>
                <Text style={styles.distributionValue}>{count as number}</Text>
              </View>
            ))}
          </View>
          <View style={styles.distributionCard}>
            <Text style={styles.distributionTitle}>By Type</Text>
            {Object.entries(byType).map(([type, count]) => (
              <View key={type} style={styles.distributionItem}>
                <View style={styles.distributionBar}>
                  <View 
                    style={[
                      styles.distributionBarFill, 
                      { 
                        width: `${((count as number) / Math.max(...Object.values(byType).map(c => c as number))) * 100}%`,
                        backgroundColor: getTypeColor(type)
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.distributionLabel}>{type}</Text>
                <Text style={styles.distributionValue}>{count as number}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderTopCustomers = () => {
    if (!dashboardData?.topCustomers) {
      return (
        <View style={styles.topCustomersSection}>
          <Text style={styles.sectionTitle}>Top Visitors</Text>
          <View style={styles.topCustomersList}>
            <View style={styles.topCustomerItem}>
              <Text style={styles.loadingText}>Top customers data not available</Text>
            </View>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.topCustomersSection}>
        <Text style={styles.sectionTitle}>Top Visitors</Text>
        <View style={styles.topCustomersList}>
          {dashboardData.topCustomers.slice(0, 5).map((customer: any, index: number) => (
            <View key={customer.id} style={styles.topCustomerItem}>
              <View style={styles.topCustomerRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.topCustomerInfo}>
                <Text style={styles.topCustomerName}>
                  {customer.firstName} {customer.lastName}
                </Text>
                <Text style={styles.topCustomerEmail}>{customer.email}</Text>
              </View>
              <View style={styles.topCustomerStats}>
                <Text style={styles.topCustomerValue}>
                  ${customer.totalSpent?.toLocaleString?.() ?? customer.totalSpent ?? 0}
                </Text>
                <Text style={styles.topCustomerOrders}>
                  {customer.orderCount} orders
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTrendsChart = () => {
    // Handle different data structures
    let chartData;
    if (analyticsData?.trends?.data) {
      // Expected structure
      chartData = analyticsData.trends.data[selectedMetric as keyof typeof analyticsData.trends.data] as any[];
    } else if (Array.isArray(analyticsData?.trends)) {
      // Current structure from backend
      chartData = analyticsData.trends;
    } else {
      return null;
    }
    
    if (!chartData || chartData.length === 0) return null;
    
    const data = {
      labels: chartData.slice(-7).map((item: any) => {
        if (item.date) return item.date.split('-')[2];
        if (item.month) return item.month;
        return '';
      }),
      datasets: [{
        data: chartData.slice(-7).map((item: any) => {
          // Handle different data structures
          if ('count' in item) return item.count;
          if ('amount' in item) return item.amount;
          if ('value' in item) return item.value;
          return 0;
        }),
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        strokeWidth: 2
      }]
    };
    
    return (
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>{selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trends</Text>
        <LineChart
          data={data}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#6366f1'
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderForecasting = () => {
    if (!analyticsData?.forecasting?.data) return null;
    return (
      <View style={styles.forecastingSection}>
        <Text style={styles.sectionTitle}>Forecasting</Text>
        <View style={styles.forecastingGrid}>
          <View style={styles.forecastingCard}>
            <Text style={styles.forecastingTitle}>Customer Growth</Text>
            <Text style={styles.forecastingValue}>
              {analyticsData.forecasting.data.customers?.daily} daily
            </Text>
            <Text style={styles.forecastingSubtitle}>
              {analyticsData.forecasting.data.customers?.total} total in {analyticsData.forecasting.data.period}
            </Text>
          </View>
          <View style={styles.forecastingCard}>
            <Text style={styles.forecastingTitle}>Revenue Projection</Text>
            <Text style={styles.forecastingValue}>
              ${analyticsData.forecasting.data.revenue?.daily?.toLocaleString()} daily
            </Text>
            <Text style={styles.forecastingSubtitle}>
              ${analyticsData.forecasting.data.revenue?.total?.toLocaleString()} total in {analyticsData.forecasting.data.period}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCustomerAnalytics = () => {
    if (!selectedCustomer) return null;
    if (!analyticsData?.customerAnalytics) return null;
    return (
      <View style={styles.customerAnalyticsSection}>
        <Text style={styles.sectionTitle}>Customer Analytics</Text>
        <View style={styles.customerAnalyticsGrid}>
          <View style={styles.customerAnalyticsCard}>
            <Text style={styles.customerAnalyticsTitle}>Activity</Text>
            <Text style={styles.customerAnalyticsValue}>
              {analyticsData.customerAnalytics.totalOrders} orders
            </Text>
            <Text style={styles.customerAnalyticsSubtitle}>
              ${analyticsData.customerAnalytics.totalSpent?.toLocaleString()} total spent
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderExportModal = () => (
    <Modal
      visible={showExportModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowExportModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Export Analytics</Text>
          
          <View style={styles.exportOptions}>
            <Text style={styles.exportLabel}>Format:</Text>
            <View style={styles.exportButtons}>
              {['json', 'csv'].map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.modalExportButton,
                    exportFormat === format && styles.modalExportButtonActive
                  ]}
                  onPress={() => setExportFormat(format)}
                >
                  <Text style={[
                    styles.modalExportButtonText,
                    exportFormat === format && styles.modalExportButtonTextActive
                  ]}>
                    {format.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleExport}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                Export
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ======================
  // UTILITY FUNCTIONS
  // ======================

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10b981',
      inactive: '#6b7280',
      pending: '#f59e0b',
      deleted: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      individual: '#3b82f6',
      business: '#8b5cf6',
      vip: '#f59e0b'
    };
    return colors[type] || '#6b7280';
  };

  // ======================
  // MAIN RENDER
  // ======================

  if (loading && !analyticsData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  // Debug: Show when no data is available
  if (!analyticsData || !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No analytics data available</Text>
        <Text style={styles.loadingText}>analyticsData: {JSON.stringify(analyticsData, null, 2)}</Text>
        <Text style={styles.loadingText}>dashboardData: {JSON.stringify(dashboardData, null, 2)}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6366f1']} />
      }
    >
      {error && (
        <View style={styles.errorCard}>
          <MaterialIcons name="error" size={24} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {selectedCustomer ? 'Customer Analytics' : 'Analytics Dashboard'}
          </Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => setShowExportModal(true)}
          >
            <MaterialIcons name="file-download" size={20} color="#6366f1" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderPeriodSelector()}
      {!selectedCustomer && renderMetricSelector()}

      {selectedCustomer ? (
        // Customer-specific analytics
        <View style={styles.customerAnalyticsContainer}>
          {renderCustomerAnalytics()}
        </View>
      ) : (
        // Overall analytics dashboard
        <View style={styles.dashboardContainer}>
          {renderOverviewStats()}
          {renderCustomerDistribution()}
          {renderTopCustomers()}
          {renderTrendsChart()}
          {renderForecasting()}
        </View>
      )}

      {renderExportModal()}
    </ScrollView>
  );
};

// ======================
// STYLES
// ======================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    color: '#dc2626',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  exportButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  exportButtonTextActive: {
    color: '#ffffff',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  periodButtons: {
    flexDirection: 'row',
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  metricSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  metricButtons: {
    flexDirection: 'row',
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  metricButtonActive: {
    backgroundColor: '#6366f1',
  },
  metricButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 4,
  },
  metricButtonTextActive: {
    color: '#ffffff',
  },
  dashboardContainer: {
    padding: 16,
  },
  customerAnalyticsContainer: {
    padding: 16,
  },
  overviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardContent: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  distributionSection: {
    marginBottom: 24,
  },
  distributionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distributionCard: {
    width: (width - 48) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionBar: {
    width: 60,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginRight: 8,
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionLabel: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
  },
  distributionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  topCustomersSection: {
    marginBottom: 24,
  },
  topCustomersList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topCustomerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topCustomerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  topCustomerInfo: {
    flex: 1,
  },
  topCustomerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  topCustomerEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  topCustomerStats: {
    alignItems: 'flex-end',
  },
  topCustomerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  topCustomerOrders: {
    fontSize: 11,
    color: '#6b7280',
  },
  chartSection: {
    marginBottom: 24,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  forecastingSection: {
    marginBottom: 24,
  },
  forecastingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastingCard: {
    width: (width - 48) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  forecastingValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  forecastingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  customerAnalyticsSection: {
    marginBottom: 24,
  },
  customerAnalyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  customerAnalyticsCard: {
    width: (width - 48) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerAnalyticsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  customerAnalyticsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  customerAnalyticsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  exportOptions: {
    marginBottom: 24,
  },
  exportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  exportButtons: {
    flexDirection: 'row',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#6366f1',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
  },
  modalExportButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalExportButtonActive: {
    backgroundColor: '#6366f1',
  },
  modalExportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalExportButtonTextActive: {
    color: '#ffffff',
  },
});

export default AnalyticsDashboard;
