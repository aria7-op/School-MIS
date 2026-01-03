import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useNavigation, useRoute, useTheme } from '@react-navigation/native';

// Import the actual CRM components
import CustomerList from '../components/CustomerList';
import CustomerForm from '../components/CustomerForm';

// Import types
import { Customer, CustomerFilters } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const isLargeScreen = screenWidth >= 768;

const CustomerScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Main state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Mock data for testing - replace with actual API calls
  const mockCustomers: Customer[] = [
    {
      id: 1,
      name: 'John Doe',
      serialNumber: 'C001',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      street: 'Main St',
      city: 'New York',
      country: 'USA',
      purpose: 'Education',
      gender: 'MALE',
      source: 'Website',
      remark: 'Interested in courses',
      department: 'Academic',
      postal_code: '10001',
      occupation: 'Student',
      company: 'University',
      website: 'www.example.com',
      tags: ['education', 'student'],
      priority: 'HIGH',
      stage: 'LEAD',
      value: 5000,
      lead_score: 85,
      refered_to: '',
      referredTo: '',
      referredById: 0,
      metadata: {},
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      deletedAt: null,
      ownerId: 1,
      schoolId: 1,
      createdBy: 1,
      updatedBy: 1,
      userId: 1,
      totalSpent: 0,
      orderCount: 0,
      type: 'PROSPECT',
      status: 'active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      serialNumber: 'C002',
      email: 'jane@example.com',
      phone: '+1234567891',
      address: '456 Oak Ave',
      street: 'Oak Ave',
      city: 'Los Angeles',
      country: 'USA',
      purpose: 'Training',
      gender: 'FEMALE',
      source: 'Referral',
      remark: 'Professional development',
      department: 'Business',
      postal_code: '90210',
      occupation: 'Manager',
      company: 'Corporation',
      website: 'www.corp.com',
      tags: ['business', 'training'],
      priority: 'MEDIUM',
      stage: 'PROSPECT',
      value: 3000,
      lead_score: 70,
      refered_to: '',
      referredTo: '',
      referredById: 0,
      metadata: {},
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
      deletedAt: null,
      ownerId: 1,
      schoolId: 1,
      createdBy: 1,
      updatedBy: 1,
      userId: 1,
      totalSpent: 0,
      orderCount: 0,
      type: 'PROSPECT',
      status: 'active'
    }
  ];

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCustomers(mockCustomers);
      setTotalCustomers(mockCustomers.length);
      setError(null);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, []);

  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    // You can navigate to customer details or show a modal
    console.log('Customer selected:', customer);
  }, []);

  const handleCustomerEdit = useCallback(async (customerData: Partial<Customer>) => {
    try {
      // Simulate API call to update customer
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCustomers(prev => prev.map(c => 
        c.id === customerData.id ? { ...c, ...customerData } : c
      ));
      
      Alert.alert('Success', 'Customer updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to update customer');
      console.error('Error updating customer:', err);
    }
  }, []);

  const handleCustomerDelete = useCallback(async (customerId: number) => {
    try {
      // Simulate API call to delete customer
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      setTotalCustomers(prev => prev - 1);
      
      Alert.alert('Success', 'Customer deleted successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete customer');
      console.error('Error deleting customer:', err);
    }
  }, []);

  const handleAddCustomer = useCallback(async (customerData: Omit<Customer, 'id'>) => {
    try {
      // Simulate API call to create customer
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newCustomer: Customer = {
        ...customerData,
        id: Date.now(), // Generate unique ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        ownerId: 1,
        schoolId: 1,
        createdBy: 1,
        updatedBy: 1,
        userId: 1,
        totalSpent: 0,
        orderCount: 0
      };
      
      setCustomers(prev => [newCustomer, ...prev]);
      setTotalCustomers(prev => prev + 1);
      
      Alert.alert('Success', 'Customer added successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to add customer');
      console.error('Error adding customer:', err);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Load customers for the new page
    loadCustomers();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, handlePageChange]);

  if (loading && customers.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Side-by-side layout */}
      <View style={styles.contentContainer}>
        {/* Left side - Customer Form */}
        <View style={[styles.leftPanel, { backgroundColor: colors.card }]}>
          {selectedCustomer && (
            <View style={styles.formHeader}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSelectedCustomer(null)}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <CustomerForm
            initialValues={selectedCustomer || undefined}
            onSubmit={handleAddCustomer}
            loading={false}
            visible={true}
            onClose={() => {}}
            isInline={true}
          />
        </View>

        {/* Right side - Customer List */}
        <View style={styles.rightPanel}>
          <CustomerList
            customers={customers}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onCustomerEdit={handleCustomerEdit}
            onCustomerSelect={handleCustomerSelect}
            onCustomerDelete={handleCustomerDelete}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCustomers={totalCustomers}
            onPageChange={handlePageChange}
            onLoadMore={handleLoadMore}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    flexDirection: isLargeScreen ? 'row' : 'column',
    backgroundColor: '#ffffff',
  },
  leftPanel: {
    flex: isLargeScreen ? 0.8 : undefined,
    width: isLargeScreen ? undefined : '100%',
    minHeight: isLargeScreen ? undefined : 400,
    borderRightWidth: isLargeScreen ? 1 : 0,
    borderBottomWidth: isLargeScreen ? 0 : 1,
    borderColor: '#e2e8f0',
    padding: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rightPanel: {
    flex: isLargeScreen ? 1.2 : 1,
    width: isLargeScreen ? undefined : '100%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  buttonContainer: {
    padding: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addCustomerButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default CustomerScreen;
