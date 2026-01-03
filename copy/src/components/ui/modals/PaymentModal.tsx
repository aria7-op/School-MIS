import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import secureApiService from '../../../services/secureApiService';
import jsPDF from 'jspdf';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import PaymentBill from './PaymentBill';
import DiscountRequest from './DiscountRequest';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  students: any[];
  onSubmit: (paymentData: any) => void;
  isLoadingStudents: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  visible, 
  onClose, 
  students, 
  onSubmit,
  isLoadingStudents 
}) => {
  const { colors } = useTheme();
  const [filteredStudents, setFilteredStudents] = useState<any[]>(students);
  const [searchText, setSearchText] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  // Dummy: get total due from class or use a fallback
  const totalDue = selectedStudent?.class?.students_amount ? parseFloat(selectedStudent.class.students_amount) : 100;

  const [showHistory, setShowHistory] = useState(false);
  const [showDiscountRequest, setShowDiscountRequest] = useState(false);
  const [lastDiscountData, setLastDiscountData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentData, setPaymentData] = useState({
    amount_paid: '',
    discount: '0',
    notes: '',
  });

  const amountPaid = parseFloat(paymentData.amount_paid || '0');
  const discount = parseFloat(paymentData.discount || '0');
  const outstanding = (totalDue - amountPaid - discount).toFixed(2);
  const finalAmount = (amountPaid - discount).toFixed(2);

  const [showPaymentBill, setShowPaymentBill] = useState(false);
  const [lastPaymentData, setLastPaymentData] = useState<any>(null);

  useEffect(() => {
    setFilteredStudents(students);
  }, [students]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchText.toLowerCase()) ||
        student.phone.includes(searchText)
      );
      setFilteredStudents(filtered);
    }
  }, [searchText, students]);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setPaymentData({
        ...paymentData,
        payment_date: date.toISOString().split('T')[0]
      });
    }
  };

  const processPayment = async (paymentData: any) => {
    try {
      setLoading(true);
      const response = await secureApiService.post('/payments', paymentData);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to process payment');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to process payment');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      Alert.alert('Error', 'Please select a student');
      return;
    }
    if (!paymentData.amount_paid || isNaN(parseFloat(paymentData.amount_paid))) {
      Alert.alert('Error', 'Please enter a valid amount paid');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const discountValue = parseFloat(paymentData.discount || '0');
      const finalAmount = (parseFloat(paymentData.amount_paid || '0') - discountValue).toFixed(2);
      const nowDate = new Date().toLocaleDateString();
      if (discountValue > 0) {
        // Generate PDF
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Discount Request', 20, 20);
        doc.setFontSize(12);
        doc.text(`Student: ${selectedStudent.firstName} ${selectedStudent.lastName}`, 20, 35);
        doc.text(`Class: ${selectedStudent.class?.class_name || 'N/A'}`, 20, 45);
        doc.text(`Date: ${nowDate}`, 20, 55);
        doc.text(`Total Amount: $${totalDue.toFixed(2)}`, 20, 65);
        doc.text(`Discount: $${paymentData.discount}`, 20, 75);
        doc.text(`Final Amount: $${finalAmount}`, 20, 85);
        doc.text(`Reason: ${paymentData.notes || '-'}`, 20, 95);
        doc.text('Status: pending', 20, 105);
        doc.text('Signature: ____________________', 20, 120);
        doc.text('Thank you for your request!', 20, 135);
        doc.text('Powered by Tailoring App', 20, 145);
        const pdfBlob = doc.output('blob');
        const formData = new FormData();
        formData.append('student_id', String(selectedStudent.id));
        formData.append('class_fee', String(totalDue.toFixed(2)));
        formData.append('amount_paid', String(paymentData.amount_paid));
        formData.append('discount', String(paymentData.discount || '0.00'));
        formData.append('notes', paymentData.notes || '');
        formData.append('d_path', pdfBlob, 'discount_request.pdf');
        // const token = await AsyncStorage.getItem('token'); // Uncomment if needed
        try {
          await secureApiService.post('/payments', formData);
        } catch (err) {
          alert('Failed to create payment with discount PDF');
          setLoading(false);
          return;
        }
        setLastDiscountData({
          student: selectedStudent,
          amount: totalDue.toFixed(2),
          amount_paid: paymentData.amount_paid,
          discount: paymentData.discount,
          final_amount: finalAmount,
          reason: paymentData.notes,
          date: nowDate,
          payment_status: 'pending',
        });
        setShowDiscountRequest(true);
      } else {
        // No discount: send JSON as before
        const payload = {
          student_id: selectedStudent.id,
          class_fee: totalDue.toFixed(2),
          amount_paid: paymentData.amount_paid,
          discount: paymentData.discount || '0.00',
          notes: paymentData.notes,
        };
        await onSubmit(payload);
        setLastPaymentData({
          student: selectedStudent,
          amount: totalDue.toFixed(2),
          amount_paid: paymentData.amount_paid,
          discount: paymentData.discount,
          final_amount: finalAmount,
          notes: paymentData.notes,
          date: nowDate,
          payment_status: 'completed',
        });
        setShowPaymentBill(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {!selectedStudent ? (
            <View style={styles.studentSelectionContainer}>
              <Text style={styles.sectionTitle}>Select Student</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                placeholderTextColor={colors.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
              
              {isLoadingStudents ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading students...</Text>
                </View>
              ) : (
                <ScrollView style={styles.studentList}>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <TouchableOpacity
                        key={student.id}
                        style={styles.studentItem}
                        onPress={() => setSelectedStudent(student)}
                      >
                        <View style={styles.studentAvatar}>
                          <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>
                            {student.firstName} {student.lastName}
                          </Text>
                          <Text style={styles.studentDetail}>{student.phone}</Text>
                          <Text style={styles.studentDetail}>{student.class?.class_name || 'No class'}</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noResultsText}>No students found</Text>
                  )}
                </ScrollView>
              )}
            </View>
          ) : (
            <ScrollView style={styles.paymentForm}>
              {/* Student Summary Card */}
              <View style={styles.studentSummaryCard}>
                {selectedStudent.photo && (
                  <View style={styles.studentPhotoWrapper}>
                    <MaterialCommunityIcons name="account" size={48} color={colors.primary} />
                  </View>
                )}
                <View style={styles.studentSummaryInfo}>
                  <Text style={styles.studentSummaryName}>{selectedStudent.firstName} {selectedStudent.lastName}</Text>
                  <Text style={styles.studentSummaryDetail}>Class: {selectedStudent.class?.class_name || 'N/A'}</Text>
                  <Text style={styles.studentSummaryDetail}>Phone: {selectedStudent.phone}</Text>
                  <Text style={styles.studentSummaryDetail}>Status: {selectedStudent.status}</Text>
                </View>
                <TouchableOpacity style={styles.historyButton} onPress={() => setShowHistory(true)}>
                  <MaterialIcons name="history" size={22} color={colors.primary} />
                  <Text style={styles.historyButtonText}>View History</Text>
                </TouchableOpacity>
              </View>

              {/* History Modal */}
              {showHistory && (
                <Modal
                  visible={showHistory}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowHistory(false)}
                >
                  <View style={styles.historyModalOverlay}>
                    <View style={styles.historyModalContainer}>
                      <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Payment History</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}>
                          <MaterialIcons name="close" size={22} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                      <ScrollView style={styles.historyList}>
                        {/* Dummy history data */}
                        {[{date: '2024-05-01', amount: 100, month: 'May', method: 'Cash', notes: 'Paid in full'},
                          {date: '2024-04-01', amount: 90, month: 'April', method: 'Bank Transfer', notes: 'Discounted'},
                          {date: '2024-03-01', amount: 100, month: 'March', method: 'Card', notes: ''}].map((item, idx) => (
                          <View key={idx} style={styles.historyItem}>
                            <Text style={styles.historyItemDate}>{item.date} ({item.month})</Text>
                            <Text style={styles.historyItemAmount}>${(typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || 0))).toFixed ? (typeof item.amount === 'number' ? item.amount.toFixed(2) : parseFloat(String(item.amount || 0)).toFixed(2)) : String(item.amount)}</Text>
                            <Text style={styles.historyItemMethod}>{item.method}</Text>
                            {item.notes ? <Text style={styles.historyItemNotes}>{item.notes}</Text> : null}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </Modal>
              )}

              {/* Payment Breakdown Section */}
              <View style={styles.paymentBreakdownCard}>
                <Text style={styles.paymentBreakdownTitle}>Payment Entry</Text>
                <View style={styles.paymentBreakdownRow}>
                  <Text style={styles.paymentBreakdownLabel}>Class Fee</Text>
                  <Text style={styles.paymentBreakdownValue}>${totalDue}</Text>
                </View>
                <View style={styles.paymentBreakdownRow}>
                  <Text style={styles.paymentBreakdownLabel}>Amount Paid</Text>
                  <TextInput
                    style={[styles.input, styles.amountInput]}
                    keyboardType="numeric"
                    value={paymentData.amount_paid}
                    onChangeText={text => setPaymentData({...paymentData, amount_paid: text})}
                    placeholder="Enter amount paid"
                  />
                </View>
                <View style={styles.paymentBreakdownRow}>
                  <Text style={styles.paymentBreakdownLabel}>Discount</Text>
                  <TextInput
                    style={[styles.input, styles.amountInput]}
                    keyboardType="numeric"
                    value={paymentData.discount}
                    onChangeText={text => setPaymentData({...paymentData, discount: text})}
                    placeholder="Enter discount (optional)"
                  />
                </View>
                <View style={styles.paymentBreakdownRow}>
                  <Text style={styles.paymentBreakdownLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, { height: 40, minHeight: 40, maxHeight: 80, flex: 1 }]}
                    value={paymentData.notes}
                    onChangeText={text => setPaymentData({...paymentData, notes: text})}
                    placeholder="Additional notes..."
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>

              {/* Payment Summary Card */}
              <View style={styles.paymentSummaryCard}>
                <Text style={styles.paymentSummaryTitle}>Payment Summary</Text>
                <Text style={styles.paymentSummaryDetail}>Student: {selectedStudent.firstName} {selectedStudent.lastName}</Text>
                <Text style={styles.paymentSummaryDetail}>Class: {selectedStudent.class?.class_name || 'N/A'}</Text>
                <Text style={styles.paymentSummaryDetail}>Month: {selectedMonth}</Text>
                <Text style={styles.paymentSummaryDetail}>Total Due: ${totalDue}</Text>
                <Text style={styles.paymentSummaryDetail}>Amount Paid: ${paymentData.amount_paid}</Text>
                <Text style={styles.paymentSummaryDetail}>Discount: ${paymentData.discount}</Text>
                <Text style={styles.paymentSummaryDetail}>Outstanding: ${outstanding}</Text>
                <Text style={styles.paymentSummaryDetail}>Final Amount: ${finalAmount}</Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[styles.backButton, { flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => setSelectedStudent(null)}
                  >
                    <MaterialIcons name="arrow-back" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>{loading ? 'Recording...' : 'Record Payment'}</Text>
                </TouchableOpacity>
              </View>
              {error && <Text style={{ color: '#ef4444', marginTop: 8 }}>{error}</Text>}

              {/* Discount Request Modal */}
              <DiscountRequest
                visible={showDiscountRequest && !!lastDiscountData}
                data={lastDiscountData}
                onClose={() => {
                  setShowDiscountRequest(false);
                  setLastDiscountData(null);
                }}
                onPrint={() => { if (typeof window !== 'undefined' && window.print) window.print(); }}
              />

              {/* Payment Bill Modal */}
              <PaymentBill
                visible={showPaymentBill && !!lastPaymentData}
                data={lastPaymentData}
                onClose={() => {
                  setShowPaymentBill(false);
                  setLastPaymentData(null);
                }}
                onPrint={() => { if (typeof window !== 'undefined' && window.print) window.print(); }}
              />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '65%',
    maxHeight: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  studentSelectionContainer: {
    flex: 1,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 14,
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  studentList: {
    maxHeight: 300,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  studentDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  paymentForm: {
    flex: 1,
  },
  studentSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  studentPhotoWrapper: {
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  studentSummaryInfo: {
    flex: 1,
  },
  studentSummaryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  studentSummaryDetail: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 1,
  },
  monthDropdownWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 4,
    marginTop: 4,
    marginBottom: 12,
  },
  monthDropdown: {
    width: '100%',
    padding: 8,
    fontSize: 15,
    borderRadius: 8,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#111827',
  },
  paymentStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  paymentStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  paymentStatLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  paymentStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  finalAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
    marginLeft: 8,
  },
  paymentSummaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  paymentSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 8,
  },
  paymentSummaryDetail: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backButton: {
    flex:1,
    padding:12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    textAlign:'center',
    justifyContent:'center',
    marginRight: 8,
  },
  backButtonText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  historyButtonText: {
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
  },
  historyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyModalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6366f1',
  },
  historyList: {
    maxHeight: 300,
  },
  historyItem: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  historyItemDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  historyItemAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  historyItemMethod: {
    fontSize: 13,
    color: '#6366f1',
    marginTop: 2,
  },
  historyItemNotes: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  paymentBreakdownCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  paymentBreakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 10,
  },
  paymentBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentBreakdownLabel: {
    fontSize: 14,
    color: '#374151',
  },
  paymentBreakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
  },
  input: {
    height: 48,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 14,
    color: '#111827',
  },
  amountInput: {
    width: '40%',
  },
});

export default PaymentModal;
