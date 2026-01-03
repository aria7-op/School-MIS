import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { theme } from '../../../theme';
import FeeCalculator from '../components/FeeCalculator';

const { width } = Dimensions.get('window');

interface ParentFeesScreenProps {
  parentData?: any;
  onRefresh?: () => void;
}

const ParentFeesScreen: React.FC<ParentFeesScreenProps> = ({ 
  parentData, 
  onRefresh 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
  };

  const handlePayment = (invoiceId: string) => {
    Alert.alert(
      'Payment',
      'Payment functionality will be integrated with your payment gateway.',
      [{ text: 'OK' }]
    );
  };

  // Mock data for demonstration
  const mockParentData = {
    students: [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        grade: '10th Grade',
        class: 'Class A',
        status: 'Active'
      }
    ]
  };

  const data = parentData || mockParentData;

  // Mock fee data
  const mockFeeData = {
    totalFees: 2500,
    paidAmount: 1800,
    remainingAmount: 700,
    dueDate: '2024-02-15',
    paymentHistory: [
      {
        id: '1',
        date: '2024-01-15',
        amount: 900,
        method: 'Credit Card',
        status: 'Completed',
        invoiceId: 'INV-001'
      },
      {
        id: '2',
        date: '2024-01-01',
        amount: 900,
        method: 'Bank Transfer',
        status: 'Completed',
        invoiceId: 'INV-002'
      }
    ],
    upcomingPayments: [
      {
        id: '1',
        dueDate: '2024-02-15',
        amount: 700,
        description: 'Second Semester Fees',
        status: 'Pending'
      }
    ]
  };

  const periods = [
    { key: 'current', label: 'Current' },
    { key: 'previous', label: 'Previous' },
    { key: 'upcoming', label: 'Upcoming' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fee Management</Text>
        <Text style={styles.headerSubtitle}>Manage your child's fees and payments</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Student Selection */}
        <View style={styles.studentSelector}>
          <Text style={styles.sectionTitle}>Select Student</Text>
          {data.students.map((student: any) => (
            <TouchableOpacity
              key={student.id}
              style={[
                styles.studentCard,
                selectedStudent === student.id && styles.selectedStudentCard
              ]}
              onPress={() => handleStudentSelect(student.id)}
            >
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>
                  {student.firstName} {student.lastName}
                </Text>
                <Text style={styles.studentDetails}>
                  {student.grade} • {student.class}
                </Text>
                <Text style={styles.studentStatus}>{student.status}</Text>
              </View>
              {selectedStudent === student.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Fee Overview */}
        {selectedStudent && (
          <View style={styles.feeOverview}>
            <Text style={styles.sectionTitle}>Fee Overview</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewNumber}>${mockFeeData.totalFees}</Text>
                <Text style={styles.overviewLabel}>Total Fees</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewNumber}>${mockFeeData.paidAmount}</Text>
                <Text style={styles.overviewLabel}>Paid Amount</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewNumber}>${mockFeeData.remainingAmount}</Text>
                <Text style={styles.overviewLabel}>Remaining</Text>
              </View>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewNumber}>15 Feb</Text>
                <Text style={styles.overviewLabel}>Due Date</Text>
              </View>
            </View>
            
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Payment Progress</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(mockFeeData.paidAmount / mockFeeData.totalFees) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((mockFeeData.paidAmount / mockFeeData.totalFees) * 100)}% Complete
              </Text>
            </View>
          </View>
        )}

        {/* Period Selection */}
        {selectedStudent && (
          <View style={styles.periodSelector}>
            <Text style={styles.sectionTitle}>Select Period</Text>
            <View style={styles.periodButtons}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.key && styles.selectedPeriodButton
                  ]}
                  onPress={() => handlePeriodSelect(period.key)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period.key && styles.selectedPeriodButtonText
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Payment History */}
        {selectedStudent && selectedPeriod === 'previous' && (
          <View style={styles.paymentHistorySection}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {mockFeeData.paymentHistory.map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>{payment.date}</Text>
                  <Text style={styles.paymentMethod}>{payment.method}</Text>
                  <Text style={styles.paymentInvoice}>Invoice: {payment.invoiceId}</Text>
                </View>
                <View style={styles.paymentAmount}>
                  <Text style={styles.amountText}>${payment.amount}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{payment.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Payments */}
        {selectedStudent && selectedPeriod === 'upcoming' && (
          <View style={styles.upcomingPaymentsSection}>
            <Text style={styles.sectionTitle}>Upcoming Payments</Text>
            {mockFeeData.upcomingPayments.map((payment) => (
              <View key={payment.id} style={styles.upcomingPaymentItem}>
                <View style={styles.upcomingPaymentInfo}>
                  <Text style={styles.upcomingPaymentDate}>Due: {payment.dueDate}</Text>
                  <Text style={styles.upcomingPaymentDescription}>{payment.description}</Text>
                </View>
                <View style={styles.upcomingPaymentActions}>
                  <Text style={styles.upcomingPaymentAmount}>${payment.amount}</Text>
                  <TouchableOpacity
                    style={styles.payNowButton}
                    onPress={() => handlePayment(payment.id)}
                  >
                    <Text style={styles.payNowButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Current Fees */}
        {selectedStudent && selectedPeriod === 'current' && (
          <View style={styles.currentFeesSection}>
            <Text style={styles.sectionTitle}>Current Fees</Text>
            <View style={styles.feeBreakdown}>
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Tuition Fee</Text>
                <Text style={styles.feeAmount}>$1500</Text>
              </View>
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Library Fee</Text>
                <Text style={styles.feeAmount}>$200</Text>
              </View>
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Laboratory Fee</Text>
                <Text style={styles.feeAmount}>$300</Text>
              </View>
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Sports Fee</Text>
                <Text style={styles.feeAmount}>$200</Text>
              </View>
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Transportation</Text>
                <Text style={styles.feeAmount}>$300</Text>
              </View>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${mockFeeData.totalFees}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.payAllButton}
              onPress={() => handlePayment('all')}
            >
              <Text style={styles.payAllButtonText}>Pay All Fees</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Fee Calculator Component */}
        {selectedStudent && (
          <View style={styles.feeCalculatorSection}>
            <Text style={styles.sectionTitle}>Fee Calculator</Text>
            <FeeCalculator
              student={data.students.find((s: any) => s.id === selectedStudent)}
              parentData={data}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  studentSelector: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: theme.colors.text,
  },
  studentCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedStudentCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: theme.colors.text,
  },
  studentDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 3,
  },
  studentStatus: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '500',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  feeOverview: {
    padding: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  overviewLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: theme.colors.text,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  periodSelector: {
    padding: 20,
  },
  periodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: 'white',
  },
  paymentHistorySection: {
    padding: 20,
  },
  paymentItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
    color: theme.colors.text,
  },
  paymentMethod: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 3,
  },
  paymentInvoice: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  statusBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  upcomingPaymentsSection: {
    padding: 20,
  },
  upcomingPaymentItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upcomingPaymentInfo: {
    flex: 1,
  },
  upcomingPaymentDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
    color: theme.colors.text,
  },
  upcomingPaymentDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  upcomingPaymentActions: {
    alignItems: 'flex-end',
  },
  upcomingPaymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
  },
  payNowButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  payNowButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  currentFeesSection: {
    padding: 20,
  },
  feeBreakdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  feeLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  payAllButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  payAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  feeCalculatorSection: {
    padding: 20,
    paddingBottom: 40,
  },
});

export default ParentFeesScreen; 