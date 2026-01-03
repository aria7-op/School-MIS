import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme';

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paidAmount: number;
  category: 'tuition' | 'transport' | 'library' | 'sports' | 'other';
  description?: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'online';
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  feeItemId: string;
}

interface FeeSummary {
  totalFees: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  nextDueDate: string;
  nextDueAmount: number;
}

interface FeeManagementProps {
  feeItems: FeeItem[];
  paymentHistory: PaymentRecord[];
  summary: FeeSummary;
  onMakePayment?: (feeItem: FeeItem) => void;
  onViewPaymentDetails?: (paymentId: string) => void;
  onDownloadReceipt?: (paymentId: string) => void;
}

const FeeManagement: React.FC<FeeManagementProps> = ({
  feeItems,
  paymentHistory,
  summary,
  onMakePayment,
  onViewPaymentDetails,
  onDownloadReceipt,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return theme.colors.success;
      case 'pending': return theme.colors.warning;
      case 'overdue': return theme.colors.error;
      case 'partial': return theme.colors.info;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'check-circle';
      case 'pending': return 'schedule';
      case 'overdue': return 'warning';
      case 'partial': return 'info';
      default: return 'help';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      case 'partial': return 'Partial';
      default: return 'Unknown';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tuition': return 'school';
      case 'transport': return 'directions-bus';
      case 'library': return 'local-library';
      case 'sports': return 'sports-soccer';
      case 'other': return 'more-horiz';
      default: return 'help';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getFilteredFees = () => {
    if (selectedFilter === 'all') return feeItems;
    return feeItems.filter(fee => fee.status === selectedFilter);
  };

  const SummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <MaterialIcons name="account-balance-wallet" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalFees)}</Text>
          <Text style={styles.summaryLabel}>Total Fees</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <MaterialIcons name="check-circle" size={24} color={theme.colors.success} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalPaid)}</Text>
          <Text style={styles.summaryLabel}>Total Paid</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <MaterialIcons name="schedule" size={24} color={theme.colors.warning} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalPending)}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <MaterialIcons name="warning" size={24} color={theme.colors.error} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalOverdue)}</Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>
      </View>
    </View>
  );

  const NextPayment = () => (
    <View style={styles.nextPaymentContainer}>
      <Text style={styles.sectionTitle}>Next Payment Due</Text>
      <View style={styles.nextPaymentCard}>
        <View style={styles.nextPaymentInfo}>
          <Text style={styles.nextPaymentDate}>{formatDate(summary.nextDueDate)}</Text>
          <Text style={styles.nextPaymentAmount}>{formatCurrency(summary.nextDueAmount)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.payNowButton}
          onPress={() => {
            const nextFee = feeItems.find(fee => fee.dueDate === summary.nextDueDate);
            if (nextFee) onMakePayment?.(nextFee);
          }}
        >
          <Text style={styles.payNowButtonText}>Pay Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const FilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'all' && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'all' && styles.filterTabTextActive
          ]}>
            All ({feeItems.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'pending' && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter('pending')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'pending' && styles.filterTabTextActive
          ]}>
            Pending ({feeItems.filter(f => f.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'paid' && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter('paid')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'paid' && styles.filterTabTextActive
          ]}>
            Paid ({feeItems.filter(f => f.status === 'paid').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTab,
            selectedFilter === 'overdue' && styles.filterTabActive
          ]}
          onPress={() => setSelectedFilter('overdue')}
        >
          <Text style={[
            styles.filterTabText,
            selectedFilter === 'overdue' && styles.filterTabTextActive
          ]}>
            Overdue ({feeItems.filter(f => f.status === 'overdue').length})
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const FeeItemsList = () => (
    <View style={styles.feeItemsSection}>
      <Text style={styles.sectionTitle}>Fee Items</Text>
      {getFilteredFees().map((fee) => (
        <View key={fee.id} style={styles.feeItemCard}>
          <View style={styles.feeItemHeader}>
            <View style={styles.feeItemInfo}>
              <View style={styles.feeItemTitle}>
                <MaterialIcons name={getCategoryIcon(fee.category) as any} size={20} color={theme.colors.primary} />
                <Text style={styles.feeItemName}>{fee.name}</Text>
              </View>
              <Text style={styles.feeItemDescription}>{fee.description}</Text>
            </View>
            <View style={styles.feeItemStatus}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fee.status) }]}>
                <MaterialIcons name={getStatusIcon(fee.status) as any} size={16} color={theme.colors.white} />
                <Text style={styles.statusBadgeText}>{getStatusText(fee.status)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.feeItemDetails}>
            <View style={styles.feeDetailRow}>
              <Text style={styles.feeDetailLabel}>Amount:</Text>
              <Text style={styles.feeDetailValue}>{formatCurrency(fee.amount)}</Text>
            </View>
            
            {fee.status === 'partial' && (
              <View style={styles.feeDetailRow}>
                <Text style={styles.feeDetailLabel}>Paid:</Text>
                <Text style={styles.feeDetailValue}>{formatCurrency(fee.paidAmount)}</Text>
              </View>
            )}
            
            <View style={styles.feeDetailRow}>
              <Text style={styles.feeDetailLabel}>Due Date:</Text>
              <Text style={[
                styles.feeDetailValue,
                fee.status === 'overdue' && styles.overdueText
              ]}>
                {formatDate(fee.dueDate)}
              </Text>
            </View>
          </View>

          {fee.status !== 'paid' && (
            <TouchableOpacity 
              style={styles.payButton}
              onPress={() => onMakePayment?.(fee)}
            >
              <MaterialIcons name="payment" size={16} color={theme.colors.white} />
              <Text style={styles.payButtonText}>
                {fee.status === 'partial' ? 'Pay Remaining' : 'Pay Now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const PaymentHistory = () => (
    <View style={styles.paymentHistorySection}>
      <Text style={styles.sectionTitle}>Payment History</Text>
      {paymentHistory.slice(0, 5).map((payment) => (
        <TouchableOpacity
          key={payment.id}
          style={styles.paymentRecordCard}
          onPress={() => onViewPaymentDetails?.(payment.id)}
        >
          <View style={styles.paymentRecordHeader}>
            <View style={styles.paymentRecordInfo}>
              <Text style={styles.paymentRecordDate}>{formatDate(payment.date)}</Text>
              <Text style={styles.paymentRecordAmount}>{formatCurrency(payment.amount)}</Text>
            </View>
            <View style={styles.paymentRecordActions}>
              <View style={[
                styles.paymentStatusBadge,
                { backgroundColor: payment.status === 'completed' ? theme.colors.success : 
                  payment.status === 'pending' ? theme.colors.warning : theme.colors.error }
              ]}>
                <Text style={styles.paymentStatusText}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => onDownloadReceipt?.(payment.id)}
              >
                <MaterialIcons name="download" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.paymentRecordDetails}>
            <Text style={styles.paymentMethod}>Method: {payment.method.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.paymentReference}>Ref: {payment.reference}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SummaryCards />
      
      <NextPayment />
      
      <FilterTabs />
      
      <FeeItemsList />
      
      <PaymentHistory />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  summaryCard: {
    width: (Dimensions.get('window').width - 48) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  nextPaymentContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  nextPaymentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPaymentInfo: {
    flex: 1,
  },
  nextPaymentDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  nextPaymentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  payNowButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payNowButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: theme.colors.white,
  },
  feeItemsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  feeItemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  feeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  feeItemInfo: {
    flex: 1,
  },
  feeItemTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  feeItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  feeItemDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 28,
  },
  feeItemStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  feeItemDetails: {
    marginBottom: 12,
  },
  feeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  feeDetailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  feeDetailValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  overdueText: {
    color: theme.colors.error,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  payButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  paymentHistorySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  paymentRecordCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentRecordInfo: {
    flex: 1,
  },
  paymentRecordDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  paymentRecordAmount: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  paymentRecordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  paymentStatusText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '500',
  },
  downloadButton: {
    padding: 8,
  },
  paymentRecordDetails: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
  },
  paymentMethod: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  paymentReference: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default FeeManagement; 