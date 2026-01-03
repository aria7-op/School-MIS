import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useCustomerApi, Customer, ConversionAnalytics } from '../hooks/useCustomerApi';
import { useStudentApi } from '../hooks/useStudentApi';
import AddStudentModal from './AddStudentModal';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface CustomerManagementProps {
  onCustomerConverted?: (customer: Customer, student: any) => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ onCustomerConverted }) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'analytics' | 'conversions'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [analytics, setAnalytics] = useState<ConversionAnalytics | null>(null);
  const [conversionHistory, setConversionHistory] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { colors } = useTheme();
  const { t } = useTranslation();
  const { 
    loading, 
    getUnconvertedCustomers, 
    getConversionAnalytics, 
    getConversionHistory,
    convertCustomerToStudent 
  } = useCustomerApi();
  const { createStudent } = useStudentApi();

  // Load unconverted customers on component mount
  useEffect(() => {
    loadUnconvertedCustomers(1);
  }, []);

  // Load unconverted customers
  const loadUnconvertedCustomers = async (page = 1) => {
    try {
      // Call the real API
      const result = await getUnconvertedCustomers(page, 10);
      if (result?.customers) {
        setCustomers(result.customers);
        setCurrentPage(result.page || page);
        setTotalPages(result.totalPages || 1);
        } else {
        setCustomers([]);
        setCurrentPage(1);
        setTotalPages(1);
      }
      
      if (page === 1) {
        setCustomers(result.customers || testCustomers);
      } else {
        setCustomers(prev => [...prev, ...(result.customers || [])]);
      }
      setCurrentPage(result.page || 1);
      setTotalPages(result.totalPages || 1);
      
      } catch (error) {
      console.error('❌ CustomerManagement - Failed to load customers:', error);
    }
  };

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const analyticsData = await getConversionAnalytics('30d');
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // Load conversion history
  const loadConversionHistory = async () => {
    try {
      const result = await getConversionHistory(1, 10);
      setConversionHistory(result.conversions);
    } catch (error) {
      console.error('Failed to load conversion history:', error);
    }
  };

  // Handle customer conversion
  const handleConvertCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowAddStudentModal(true);
  };

  // Handle student creation from customer
  const handleCreateStudentFromCustomer = async (studentData: any) => {
    if (!selectedCustomer) return;

    try {
      const conversionData = {
        conversionReason: 'Enrolled in course',
        admissionNo: studentData.admissionNo || `STU-${Date.now()}`,
        user: {
          firstName: studentData.user.firstName,
          lastName: studentData.user.lastName,
          email: studentData.user.email,
          phone: studentData.user.phone,
        }
      };

      const result = await convertCustomerToStudent(selectedCustomer.id, conversionData);
      
      // Refresh data
      await Promise.all([
        loadUnconvertedCustomers(1),
        loadAnalytics(),
        loadConversionHistory()
      ]);

      setShowAddStudentModal(false);
      setSelectedCustomer(null);
      
      if (onCustomerConverted) {
        onCustomerConverted(selectedCustomer, result);
      }
    } catch (error) {
      console.error('Failed to convert customer:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadUnconvertedCustomers(1),
        loadAnalytics(),
        loadConversionHistory()
      ]);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load data on mount and tab change
  useEffect(() => {
    loadUnconvertedCustomers(1);
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'conversions') {
      loadConversionHistory();
    }
  }, [activeTab]);

  const renderCustomerItem = (customer: Customer) => (
    <View key={customer.id} style={[styles.customerItem, { backgroundColor: colors.card }]}>
      <View style={styles.customerInfo}>
        <Text style={[styles.customerName, { color: colors.text }]}>
          {customer.name}
        </Text>
        <Text style={[styles.customerEmail, { color: colors.text + '80' }]}>
          {customer.email}
        </Text>
        <Text style={[styles.customerPhone, { color: colors.text + '80' }]}>
          {customer.phone}
        </Text>
        <View style={styles.customerMeta}>
          <Text style={[styles.customerType, { color: colors.primary }]}>
            {customer.type}
          </Text>
          {customer.convertedToStudent && (
            <Text style={[styles.customerPriority, { color: '#4CAF50' }]}>
              CONVERTED
            </Text>
          )}
          {customer.priority && !customer.convertedToStudent && (
            <Text style={[styles.customerPriority, { color: colors.primary }]}>
              {customer.priority}
            </Text>
          )}
        </View>
      </View>
      {!customer.convertedToStudent && (
        <TouchableOpacity
          style={[styles.convertButton, { backgroundColor: colors.primary }]}
          onPress={() => handleConvertCustomer(customer)}
        >
          <Icon name="person-add" size={20} color="white" />
          <Text style={styles.convertButtonText}>Convert</Text>
        </TouchableOpacity>
      )}
      {customer.convertedToStudent && (
        <View style={[styles.convertButton, { backgroundColor: '#4CAF50' }]}>
          <Icon name="check-circle" size={20} color="white" />
          <Text style={styles.convertButtonText}>Converted</Text>
        </View>
      )}
    </View>
  );

  const renderAnalytics = () => {
    if (!analytics) return null;

    const chartData = {
      labels: analytics.conversionTrend.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [{
        data: analytics.conversionTrend.map(item => item.conversions)
      }]
    };

    const pieData = [
      {
        name: 'Converted',
        population: analytics.convertedCustomers,
        color: '#4CAF50',
        legendFontColor: colors.text,
      },
      {
        name: 'Unconverted',
        population: analytics.unconvertedCustomers,
        color: '#FF9800',
        legendFontColor: colors.text,
      }
    ];

    return (
      <ScrollView style={styles.analyticsContainer}>
        <View style={[styles.statsGrid, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {analytics.totalCustomers}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
              Total Visitors
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {analytics.convertedCustomers}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
              Converted
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF9800' }]}>
              {analytics.unconvertedCustomers}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
              Unconverted
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {analytics.conversionRate.toFixed(1)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.text + '80' }]}>
              Conversion Rate
            </Text>
          </View>
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Conversion Trend (30 Days)
          </Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.text + '80',
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Visitor Distribution
          </Text>
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => colors.text,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>
      </ScrollView>
    );
  };

  const renderConversionHistory = () => (
    <ScrollView style={styles.conversionHistoryContainer}>
      {conversionHistory.map((conversion, index) => (
        <View key={index} style={[styles.conversionItem, { backgroundColor: colors.card }]}>
          <View style={styles.conversionInfo}>
            <Text style={[styles.conversionCustomer, { color: colors.text }]}>
              {conversion.customer.name}
            </Text>
            <Text style={[styles.conversionStudent, { color: colors.text + '80' }]}>
              → {conversion.student.user.displayName}
            </Text>
            <Text style={[styles.conversionDate, { color: colors.text + '60' }]}>
              {new Date(conversion.conversionDate).toLocaleDateString()}
            </Text>
            <Text style={[styles.conversionReason, { color: colors.text + '80' }]}>
              {conversion.conversionReason}
            </Text>
          </View>
          <Icon name="check-circle" size={24} color="#4CAF50" />
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('customers')}
        >
          <Text style={[styles.tabText, activeTab === 'customers' && { color: 'white' }]}>
            Unconverted ({customers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && { color: 'white' }]}>
            Analytics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'conversions' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('conversions')}
        >
          <Text style={[styles.tabText, activeTab === 'conversions' && { color: 'white' }]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'customers' && (
          <View style={styles.customersContainer}>
            {}
            {loading && (
              <View style={styles.loadingState}>
                <Icon name="hourglass-empty" size={48} color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text + '80' }]}>
                  Loading customers...
                </Text>
              </View>
            )}
            {!loading && customers.map(renderCustomerItem)}
            {customers.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Icon name="people" size={48} color={colors.text + '40'} />
                <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                  {customers.length === 0 ? 'No customers found' : 'No unconverted customers found'}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'conversions' && renderConversionHistory()}
      </ScrollView>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => {
          setShowAddStudentModal(false);
          setSelectedCustomer(null);
        }}
        onSave={handleCreateStudentFromCustomer}
        loading={loading}
        classes={[]}
        sections={[]}
        parents={[]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  customersContainer: {
    padding: 16,
  },
  customerItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    marginBottom: 4,
  },
  customerMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  customerType: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  customerPriority: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  convertButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  analyticsContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  conversionHistoryContainer: {
    padding: 16,
  },
  conversionItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  conversionInfo: {
    flex: 1,
  },
  conversionCustomer: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  conversionStudent: {
    fontSize: 14,
    marginBottom: 2,
  },
  conversionDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  conversionReason: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
});

export default CustomerManagement; 