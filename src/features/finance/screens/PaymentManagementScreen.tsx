import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import financeApi, { Payment, PaymentFilters, Student } from '../services/financeApi';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../../../contexts/AuthContext';

interface PaymentManagementScreenProps {
  navigation: any;
}

const PaymentManagementScreen: React.FC<PaymentManagementScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // State management
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'overdue' | 'pending'>('all');
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPayments(),
        fetchStudents(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await financeApi.getPayments(filters);
      if (response.success) {
        setPayments(response.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await financeApi.getStudents({ limit: 100 });
      if (response.success) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handlePaymentSuccess = (newPayment: Payment) => {
    setPayments(prev => [newPayment, ...prev]);
    Alert.alert('Success', 'Payment created successfully!');
  };

  const handleTabChange = (tab: 'all' | 'recent' | 'overdue' | 'pending') => {
    setActiveTab(tab);
    let newFilters = { ...filters };
    
    switch (tab) {
      case 'recent':
        newFilters = { ...filters, sortBy: 'createdAt', sortOrder: 'desc' };
        break;
      case 'overdue':
        newFilters = { ...filters, status: 'OVERDUE' };
        break;
      case 'pending':
        newFilters = { ...filters, status: 'PENDING' };
        break;
      default:
        newFilters = { ...filters };
        delete newFilters.status;
    }
    
    setFilters(newFilters);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'OVERDUE': return '#ef4444';
      case 'PARTIALLY_PAID': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'Paid';
      case 'PENDING': return 'Pending';
      case 'OVERDUE': return 'Overdue';
      case 'PARTIALLY_PAID': return 'Partial';
      default: return 'Unknown';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'CASH': return 'cash';
      case 'CARD': return 'credit-card';
      case 'BANK_TRANSFER': return 'bank';
      case 'MOBILE_PAYMENT': return 'cellphone';
      default: return 'cash';
    }
  };

  const getStudentName = (payment: Payment) => {
    if (payment.student) {
      return `${payment.student.firstName} ${payment.student.lastName}`;
    }
    return payment.studentName || 'Unknown Student';
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading payment data...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Payment Management
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowPaymentModal(true)}
        >
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>New Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        {[
          { key: 'all', label: 'All', icon: 'list' },
          { key: 'recent', label: 'Recent', icon: 'schedule' },
          { key: 'overdue', label: 'Overdue', icon: 'warning' },
          { key: 'pending', label: 'Pending', icon: 'pending' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && { backgroundColor: colors.primary }
            ]}
            onPress={() => handleTabChange(tab.key as any)}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? 'white' : colors.text}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? 'white' : colors.text }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="payment" size={64} color={colors.text} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Payments Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text }]}>
              {activeTab === 'all' && 'No payments have been recorded yet.'}
              {activeTab === 'recent' && 'No recent payments found.'}
              {activeTab === 'overdue' && 'No overdue payments found.'}
              {activeTab === 'pending' && 'No pending payments found.'}
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowPaymentModal(true)}
            >
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={styles.createButtonText}>Create First Payment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={[styles.paymentCard, { backgroundColor: colors.card }]}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.studentName, { color: colors.text }]}>
                    {getStudentName(payment)}
                  </Text>
                  <Text style={[styles.paymentDate, { color: colors.text }]}>
                    {formatDate(payment.paymentDate)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status || payment.payment_status) }]}>
                  <Text style={styles.statusText}>
                    {getStatusText(payment.status || payment.payment_status)}
                  </Text>
                </View>
              </View>

              <View style={styles.paymentDetails}>
                <View style={styles.amountRow}>
                  <Text style={[styles.amountLabel, { color: colors.text }]}>Amount:</Text>
                  <Text style={[styles.amountValue, { color: colors.primary }]}>
                    {formatCurrency(payment.total || payment.amount)}
                  </Text>
                </View>

                <View style={styles.methodRow}>
                  <MaterialIcons
                    name={getMethodIcon(payment.method || payment.paymentMethod)}
                    size={16}
                    color={colors.text}
                  />
                  <Text style={[styles.methodText, { color: colors.text }]}>
                    {payment.method || payment.paymentMethod}
                  </Text>
                </View>

                {payment.remarks && (
                  <Text style={[styles.remarks, { color: colors.text }]}>
                    {payment.remarks}
                  </Text>
                )}

                {payment.receiptNumber && (
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: colors.text }]}>
                      Receipt: {payment.receiptNumber}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.paymentActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={() => {
                    // Handle view details
                    Alert.alert('Payment Details', `Payment ID: ${payment.id}`);
                  }}
                >
                  <MaterialIcons name="visibility" size={16} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={() => {
                    // Handle generate receipt
                    Alert.alert('Generate Receipt', 'Receipt generation feature coming soon');
                  }}
                >
                  <MaterialIcons name="receipt" size={16} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Receipt</Text>
                </TouchableOpacity>

                {(payment.status === 'PENDING' || payment.payment_status === 'pending') && (
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={() => {
                      // Handle mark as paid
                      Alert.alert('Mark as Paid', 'This feature will be implemented soon');
                    }}
                  >
                    <MaterialIcons name="check" size={16} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Mark Paid</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  tabText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  paymentCard: {
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  paymentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentDetails: {
    marginBottom: 15,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodText: {
    marginLeft: 5,
    fontSize: 14,
  },
  remarks: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 5,
  },
  receiptRow: {
    marginTop: 5,
  },
  receiptLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 5,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default PaymentManagementScreen; 
