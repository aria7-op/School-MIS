import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { AdminAnalytics } from '../types';

const { width } = Dimensions.get('window');

interface AnalyticsDashboardProps {
  data?: AdminAnalytics;
  loading?: boolean;
  style?: any;
}

// Custom styled components
const Card = ({ children, style, ...props }: any) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

const CardContent = ({ children, style, ...props }: any) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

const IconButton = ({ icon, size = 24, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[styles.iconButton, style]}
    onPress={onPress}
    {...props}
  >
    <MaterialIcons name={icon} size={size} color="#666" />
  </TouchableOpacity>
);

const Chip = ({ children, mode = 'outlined', onPress, style, textStyle, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.chip,
      mode === 'flat' && styles.chipFlat,
      mode === 'outlined' && styles.chipOutlined,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    <Text style={[
      styles.chipText,
      textStyle,
      mode === 'flat' && styles.chipTextFlat,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const Surface = ({ children, style, elevation = 1, ...props }: any) => (
  <View 
    style={[
      styles.surface,
      { 
        shadowOpacity: elevation * 0.1,
        shadowRadius: elevation * 2,
        elevation: elevation,
      },
      style
    ]} 
    {...props}
  >
    {children}
  </View>
);

const ProgressBar = ({ progress, color = '#007AFF', style, ...props }: any) => (
  <View style={[styles.progressBarContainer, style]} {...props}>
    <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
  </View>
);

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  loading = false,
  style,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // Mock data for demonstration
  const mockData: AdminAnalytics = {
    overview: {
      totalSchools: 0,
      totalClasses: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalStaff: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      systemHealth: 0,
      criticalIssues: 0,
      pendingApprovals: 0,
      upcomingEvents: 0,
      unreadMessages: 0,
      lowStockItems: 0,
      pendingPayments: 0,
      systemUptime: 0,
      lastBackup: '',
    },
    trends: {
      userGrowth: [],
      revenueGrowth: [],
      systemPerformance: [],
    },
  };

  const analyticsData = data || mockData;

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
  };

  const renderMetricCard = (title: string, value: string | number, subtitle: string, icon: string, color: string, trend?: number) => (
    <Surface style={styles.metricCard} elevation={2}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          <MaterialIcons name={icon} size={20} color={color} />
        </View>
        {trend !== undefined && (
          <Chip
            mode="flat"
            textStyle={{ fontSize: 10 }}
            style={[
              styles.trendChip,
              { backgroundColor: trend >= 0 ? '#4CAF50' : '#F44336' }
            ]}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </Chip>
        )}
      </View>
      <Text style={styles.metricValue}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text style={styles.metricTitle}>
        {title}
      </Text>
      <Text style={styles.metricSubtitle}>
        {subtitle}
      </Text>
    </Surface>
  );

  const renderChartCard = (title: string, children: React.ReactNode) => (
    <Card style={styles.chartCard}>
      <CardContent>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>
            {title}
          </Text>
          <View style={styles.periodSelector}>
            {(['day', 'week', 'month', 'year'] as const).map((period) => (
              <Chip
                key={period}
                mode={selectedPeriod === period ? 'flat' : 'outlined'}
                textStyle={{ fontSize: 10 }}
                onPress={() => setSelectedPeriod(period)}
                style={styles.periodChip}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Chip>
            ))}
          </View>
        </View>
        {children}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card style={[styles.container, style]}>
        <CardContent>
          <Text>Loading analytics...</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Key Metrics */}
      <Card style={styles.metricsCard}>
        <CardContent>
          <View style={styles.metricsHeader}>
            <Text style={styles.sectionTitle}>
              Key Metrics
            </Text>
            <IconButton
              icon="refresh"
              size={20}
              onPress={() => {
                // Refresh analytics data
                // This could call a refresh function or trigger a re-fetch
              }}
            />
          </View>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Users',
              analyticsData.overview.totalUsers,
              'Active accounts',
              'people',
              '#2196F3',
              12
            )}
            {renderMetricCard(
              'Total Revenue',
              `$${(analyticsData.overview.totalRevenue / 1000).toFixed(0)}K`,
              'This month',
              'attach-money',
              '#4CAF50',
              8.5
            )}
            {renderMetricCard(
              'System Health',
              `${analyticsData.overview.systemHealth}%`,
              'Uptime status',
              'health-and-safety',
              '#FF9800',
              2.1
            )}
            {renderMetricCard(
              'Pending Actions',
              analyticsData.overview.pendingApprovals,
              'Require attention',
              'warning',
              '#F44336'
            )}
          </View>
        </CardContent>
      </Card>

      {/* Charts */}
      <View style={styles.chartsContainer}>
        {renderChartCard(
          'User Growth Trend',
          <LineChart
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [
                {
                  data: analyticsData.trends.userGrowth.slice(0, 6),
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={width - 80}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        )}

        {renderChartCard(
          'Revenue Overview',
          <BarChart
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [
                {
                  data: analyticsData.trends.revenueGrowth.slice(0, 6).map(v => v / 1000),
                },
              ],
            }}
            width={width - 80}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            yLabelsOffset={10}
            xLabelsOffset={-10}
            segments={4}
          />
        )}
      </View>

      {/* Detailed Stats */}
      <Card style={styles.statsCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Detailed Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Active Users</Text>
              <Text style={styles.statValue}>{analyticsData.overview.activeUsers}</Text>
              <ProgressBar progress={analyticsData.overview.activeUsers / analyticsData.overview.totalUsers} />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>System Uptime</Text>
              <Text style={styles.statValue}>{analyticsData.overview.systemUptime}%</Text>
              <ProgressBar progress={analyticsData.overview.systemUptime / 100} color="#4CAF50" />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Critical Issues</Text>
              <Text style={styles.statValue}>{analyticsData.overview.criticalIssues}</Text>
              <ProgressBar progress={analyticsData.overview.criticalIssues / 10} color="#F44336" />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Pending Payments</Text>
              <Text style={styles.statValue}>{analyticsData.overview.pendingPayments}</Text>
              <ProgressBar progress={analyticsData.overview.pendingPayments / 100} color="#FF9800" />
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  metricsCard: {
    marginBottom: 16,
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  chartsContainer: {
    marginBottom: 16,
  },
  chartCard: {
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  periodSelector: {
    flexDirection: 'row',
  },
  periodChip: {
    marginLeft: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  // Custom component styles
  iconButton: {
    padding: 4,
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipFlat: {
    backgroundColor: '#007AFF',
  },
  chipOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  chipTextFlat: {
    color: '#fff',
  },
  surface: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
});

export default AnalyticsDashboard; 
