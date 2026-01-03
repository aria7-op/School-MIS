import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface AnalyticsProps {
  analyticsData?: any;
  customers?: any[];
  tasksHook?: any;
}

const Analytics: React.FC<AnalyticsProps> = (props) => {
  const { colors } = useTheme();

  // Use customers from props first, then fall back to analyticsData
  let customers = [];
  if (props.customers && Array.isArray(props.customers)) {
    customers = props.customers;
  } else if (props.analyticsData) {
    // Handle API response structure
    if (props.analyticsData.success && Array.isArray(props.analyticsData.data)) {
      customers = props.analyticsData.data;
    } else if (Array.isArray(props.analyticsData)) {
      customers = props.analyticsData;
    }
  }

  // Handle undefined/null data
  if (!customers || customers.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          {props.customers ? 'No customers available' : 'No analytics data provided'}
        </Text>
      </View>
    );
  }

  // Calculate analytics metrics
  const totalCustomers = customers.length;
  const customersWithEmail = customers.filter(c => c.email).length;
  const customersWithPhone = customers.filter(c => c.phone).length;
  const customersWithSpending = customers.filter(c => c.totalSpent && c.totalSpent > 0).length;
  const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const avgSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

  // Generate chart data
  const customerTypeData = [
    { name: 'With Email', population: customersWithEmail, color: colors.primary, legendFontColor: colors.text, legendFontSize: 12 },
    { name: 'With Phone', population: customersWithPhone, color: colors.success, legendFontColor: colors.text, legendFontSize: 12 },
    { name: 'With Spending', population: customersWithSpending, color: colors.warning, legendFontColor: colors.text, legendFontSize: 12 },
    { name: 'Basic', population: totalCustomers - Math.max(customersWithEmail, customersWithPhone, customersWithSpending), color: colors.gray, legendFontColor: colors.text, legendFontSize: 12 }
  ];

  const spendingData = {
    labels: ['$0', '$100', '$500', '$1000+'],
    data: [
      customers.filter(c => !c.totalSpent || c.totalSpent === 0).length,
      customers.filter(c => c.totalSpent && c.totalSpent > 0 && c.totalSpent <= 100).length,
      customers.filter(c => c.totalSpent && c.totalSpent > 100 && c.totalSpent <= 500).length,
      customers.filter(c => c.totalSpent && c.totalSpent > 500).length
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.text,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
  };

  const renderMetricCard = (title: string, value: string | number, subtitle: string, icon: string, color: string) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <MaterialIcons name={icon as any} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Visitor Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Comprehensive insights and performance metrics</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        {renderMetricCard('Total Visitors', totalCustomers.toLocaleString(), 'Active accounts', 'people', colors.primary)}
        {renderMetricCard('With Email', customersWithEmail, 'Contact info', 'email', colors.success)}
        {renderMetricCard('Total Spent', `$${totalSpent.toLocaleString()}`, 'Lifetime value', 'attach-money', colors.warning)}
        {renderMetricCard('Avg Spent', `$${avgSpent.toFixed(2)}`, 'Per customer', 'trending-up', colors.secondary)}
      </View>

      {/* Charts Row 1 */}
      <View style={styles.chartsRow}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Visitor Distribution</Text>
          <PieChart
            data={customerTypeData}
            width={width * 0.4}
            height={180}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend
          />
        </View>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Spending Distribution</Text>
          <BarChart
            data={{
              labels: spendingData.labels,
              datasets: [{ data: spendingData.data }]
            }}
            width={width * 0.4}
            height={180}
            chartConfig={chartConfig}
            style={styles.chart}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withInnerLines={false}
            showBarTops={true}
            showValuesOnTopOfBars={true}
          />
        </View>
      </View>

      {/* Customer List */}
      <View style={styles.customerSection}>
        <Text style={styles.sectionTitle}>Visitor Details</Text>
        {customers.map((customer: any, index: number) => (
          <View key={customer.id || index} style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <View style={styles.customerAvatar}>
                <MaterialIcons name="person" size={24} color={colors.primary} />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name || 'Unknown'}</Text>
                <Text style={styles.customerEmail}>{customer.email || 'No email'}</Text>
                <Text style={styles.customerSerial}>ID: {customer.serialNumber}</Text>
              </View>
              <View style={styles.customerStats}>
                {customer.totalSpent && (
                  <Text style={styles.customerSpent}>${customer.totalSpent.toLocaleString()}</Text>
                )}
                {customer.orderCount && (
                  <Text style={styles.customerOrders}>{customer.orderCount} orders</Text>
                )}
              </View>
            </View>
            <View style={styles.customerDetails}>
              {customer.phone && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="phone" size={16} color={colors.gray} />
                  <Text style={styles.detailText}>{customer.phone}</Text>
                </View>
              )}
              {customer.type && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="category" size={16} color={colors.gray} />
                  <Text style={styles.detailText}>{customer.type}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    width: (width - 48) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
  },
  chartsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  customerSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  customerEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  customerSerial: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  customerStats: {
    alignItems: 'flex-end',
  },
  customerSpent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  customerOrders: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  customerDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default Analytics; 
