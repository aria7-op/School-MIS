import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';

interface Payment {
  id: number | string;
  final_amount?: string;
  total?: string;
  payment_status?: string;
  status?: string;
  payment_date?: string;
  paymentDate?: string;
  dueDate?: string;
  discount?: string;
  fine?: string;
  remarks?: string;
  student?: {
    firstName?: string;
    lastName?: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    phone?: string;
    class?: { class_name: string };
  };
  fees?: string;
  payment_method?: string;
  method?: string;
  overdue?: boolean;
  d_path?: string;
  file_path?: string;
  payment_type?: string;
}

interface AllPaymentsModalProps {
  visible: boolean;
  onClose: () => void;
  payments: Payment[];
  onViewPayment?: (payment: Payment) => void;
}

const { width } = Dimensions.get('window');

const AllPaymentsModal: React.FC<AllPaymentsModalProps> = ({
  visible,
  onClose,
  payments,
  onViewPayment,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'pending' | 'overdue' | 'failed'>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation();

  const getStudentName = (payment: Payment): string => {
    const firstName = payment.student?.user?.firstName || payment.student?.firstName || '';
    const lastName = payment.student?.user?.lastName || payment.student?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Student';
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  const handleClosePaymentDetails = () => {
    setShowPaymentDetails(false);
    setSelectedPayment(null);
  };

  const filteredPayments = payments.filter(payment => {
    const studentName = getStudentName(payment).toLowerCase();
    const studentPhone = payment.student?.phone || '';
    const matchesSearch = studentName.includes(searchText.toLowerCase()) || studentPhone.includes(searchText);
    
    let matchesStatusFilter = true;
    if (selectedFilter === 'completed') {
      matchesStatusFilter = (payment.status || payment.payment_status)?.toLowerCase() === 'paid' || (payment.status || payment.payment_status)?.toLowerCase() === 'completed';
    } else if (selectedFilter === 'pending') {
      matchesStatusFilter = (payment.status || payment.payment_status)?.toLowerCase() === 'pending';
    } else if (selectedFilter === 'overdue') {
      matchesStatusFilter = payment.overdue || false;
    } else if (selectedFilter === 'failed') {
      matchesStatusFilter = (payment.status || payment.payment_status)?.toLowerCase() === 'failed';
    }
    
    return matchesSearch && matchesStatusFilter;
  });

  const totalPayments = filteredPayments.length;
  const totalAmount = filteredPayments.reduce((sum, p) => sum + parseFloat(p.total || p.final_amount || '0'), 0);
  const completedPayments = filteredPayments.filter(p => (p.status || p.payment_status)?.toLowerCase() === 'paid' || (p.status || p.payment_status)?.toLowerCase() === 'completed').length;
  const pendingPayments = filteredPayments.filter(p => (p.status || p.payment_status)?.toLowerCase() === 'pending').length;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>All Payments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Payments</Text>
              <Text style={styles.summaryValue}>{totalPayments}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>Afg {totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Completed</Text>
              <Text style={styles.summaryValue}>{completedPayments}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryValue}>{pendingPayments}</Text>
            </View>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by student name or phone..."
                placeholderTextColor="#9ca3af"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            
            <View style={styles.filterButtons}>
              {['all', 'completed', 'pending', 'overdue', 'failed'].map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedFilter(filter as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    selectedFilter === filter && styles.filterButtonTextActive
                  ]}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView style={styles.paymentsList} showsVerticalScrollIndicator={false}>
            {filteredPayments.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="receipt-long" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No payments found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try adjusting your search or filter criteria
                </Text>
              </View>
            ) : (
              filteredPayments.map((payment) => (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.paymentHeader}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{getStudentName(payment)}</Text>
                      <Text style={styles.studentClass}>
                        {payment.student?.class?.class_name || 'No Class'}
                      </Text>
                    </View>
                    <View style={styles.paymentAmount}>
                      <Text style={styles.amountText}>Afg {payment.total || payment.final_amount || '0'}</Text>
                      <View style={[
                        styles.statusBadge,
                        styles[`status${(payment.status || payment.payment_status || 'unknown')?.toLowerCase()}`]
                      ]}>
                        <Text style={styles.statusText}>
                          {payment.status || payment.payment_status || 'Unknown'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.paymentDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>
                        {moment(payment.paymentDate || payment.payment_date).format('MMM DD, YYYY')}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Method:</Text>
                      <Text style={styles.detailValue}>{payment.method || payment.payment_method || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Amount:</Text>
                      <Text style={styles.detailValue}>Afg {payment.total || payment.final_amount || '0'}</Text>
                    </View>
                    {payment.overdue && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueText}>Overdue</Text>
                      </View>
                    )}
                  </View>

                                     <View style={styles.actionButtons}>
                     <TouchableOpacity
                       style={[styles.actionButton, styles.viewButton]}
                       onPress={() => handleViewPayment(payment)}
                     >
                       <MaterialIcons name="visibility" size={16} color="#3b82f6" />
                       <Text style={styles.actionButtonText}>View</Text>
                     </TouchableOpacity>
                   </View>
                </View>
              ))
            )}
                     </ScrollView>
         </View>
       </View>

       {/* Payment Details Modal */}
       {showPaymentDetails && selectedPayment && (
         <Modal
           visible={showPaymentDetails}
           transparent={true}
           animationType="slide"
           onRequestClose={handleClosePaymentDetails}
         >
           <View style={styles.modalOverlay}>
             <View style={styles.modalContainer}>
               <View style={styles.header}>
                 <Text style={styles.modalTitle}>Payment Details</Text>
                 <TouchableOpacity onPress={handleClosePaymentDetails} style={styles.closeButton}>
                   <MaterialIcons name="close" size={24} color="#6b7280" />
                 </TouchableOpacity>
               </View>

               <ScrollView style={styles.paymentDetailsScroll}>
                 {/* Student Information */}
                 <View style={styles.detailSection}>
                   <Text style={styles.sectionTitle}>Student Information</Text>
                   <View style={styles.detailCard}>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Name:</Text>
                       <Text style={styles.detailValue}>{getStudentName(selectedPayment)}</Text>
                     </View>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Class:</Text>
                       <Text style={styles.detailValue}>{selectedPayment.student?.class?.class_name || 'No Class'}</Text>
                     </View>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Phone:</Text>
                       <Text style={styles.detailValue}>{selectedPayment.student?.phone || 'N/A'}</Text>
                     </View>
                   </View>
                 </View>

                 {/* Payment Information */}
                 <View style={styles.detailSection}>
                   <Text style={styles.sectionTitle}>Payment Information</Text>
                   <View style={styles.detailCard}>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Payment ID:</Text>
                       <Text style={styles.detailValue}>{selectedPayment.id}</Text>
                     </View>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Amount:</Text>
                       <Text style={styles.detailValue}>Afg {selectedPayment.total || selectedPayment.final_amount || '0'}</Text>
                     </View>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Status:</Text>
                       <View style={[
                         styles.statusBadge,
                         styles[`status${(selectedPayment.status || selectedPayment.payment_status || 'unknown')?.toLowerCase()}`]
                       ]}>
                         <Text style={styles.statusText}>
                           {selectedPayment.status || selectedPayment.payment_status || 'Unknown'}
                         </Text>
                       </View>
                     </View>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Method:</Text>
                       <Text style={styles.detailValue}>{selectedPayment.method || selectedPayment.payment_method || 'N/A'}</Text>
                     </View>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Payment Date:</Text>
                       <Text style={styles.detailValue}>
                         {moment(selectedPayment.paymentDate || selectedPayment.payment_date).format('MMM DD, YYYY')}
                       </Text>
                     </View>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Due Date:</Text>
                       <Text style={styles.detailValue}>
                         {moment(selectedPayment.dueDate || selectedPayment.payment_date).format('MMM DD, YYYY')}
                       </Text>
                     </View>
                   </View>
                 </View>

                 {/* Additional Details */}
                 <View style={styles.detailSection}>
                   <Text style={styles.sectionTitle}>Additional Details</Text>
                   <View style={styles.detailCard}>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Discount:</Text>
                       <Text style={styles.detailValue}>Afg {selectedPayment.discount || '0'}</Text>
                     </View>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Fine:</Text>
                       <Text style={styles.detailValue}>Afg {selectedPayment.fine || '0'}</Text>
                     </View>
                     <View style={styles.detailRow}>
                       <Text style={styles.detailLabel}>Remarks:</Text>
                       <Text style={styles.detailValue}>{selectedPayment.remarks || 'No remarks'}</Text>
                     </View>
                   </View>
                 </View>

                                   {/* Action Buttons */}
                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.closeButton]}
                      onPress={handleClosePaymentDetails}
                    >
                      <MaterialIcons name="close" size={16} color="#6b7280" />
                      <Text style={styles.actionButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
               </ScrollView>
             </View>
           </View>
         </Modal>
       )}
     </Modal>
   );
 };

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width > 768 ? '80%' : '95%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: 120,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  paymentsList: {
    flex: 1,
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statuspaid: {
    backgroundColor: '#d1fae5',
  },
  statuscompleted: {
    backgroundColor: '#d1fae5',
  },
  statuspending: {
    backgroundColor: '#fef3c7',
  },
  statusfailed: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  paymentDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  overdueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  overdueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewButton: {
    backgroundColor: '#dbeafe',
  },
  editButton: {
    backgroundColor: '#fef3c7',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Payment Details Modal Styles
  paymentDetailsScroll: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
});

export default AllPaymentsModal;
