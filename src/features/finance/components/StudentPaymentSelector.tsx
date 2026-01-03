import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import api from '../../../services/api/api';

interface Student {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  status: string;
  class?: {
    id: number;
    class_name: string;
  };
  parent?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface PaymentHistory {
  id: number;
  amount: number;
  total: number;
  discount: number;
  fine: number;
  paymentDate: string;
  status: string;
  method: string;
  type: string;
  receiptNumber: string;
  remarks?: string;
}

interface StudentPaymentSelectorProps {
  visible: boolean;
  onClose: () => void;
  onStudentSelect: (student: Student) => void;
  onGenerateBill: (student: Student, paymentData: any) => void;
}

const StudentPaymentSelector: React.FC<StudentPaymentSelectorProps> = ({
  visible,
  onClose,
  onStudentSelect,
  onGenerateBill,
}) => {
  const { colors } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    discount: '',
    method: 'CASH',
    type: 'TUITION_FEE',
    remarks: '',
    dueDate: new Date().toISOString().split('T')[0],
  });

  // Fetch students on component mount
  useEffect(() => {
    if (visible) {
      fetchStudents();
    }
  }, [visible]);

  // Filter students based on search text
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchText.toLowerCase()) ||
        student.phone.includes(searchText) ||
        student.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.class?.class_name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchText, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.getStudents('');
      if (response.success) {
        setStudents(response.data || []);
        setFilteredStudents(response.data || []);
      }
    } catch (error) {
      
      Alert.alert('Error', 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (studentId: number) => {
    try {
      setLoading(true);
      // This would be implemented in your backend
      const response = await fetch(`/api/payments/student/Afg {studentId}`, {
        headers: {
          'Authorization': `Bearer Afg {await getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.data || []);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    // Implement your token retrieval logic
    return '';
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    fetchPaymentHistory(student.id);
    setShowPaymentForm(true);
  };

  const handleGenerateBill = () => {
    if (!selectedStudent) return;

    const amount = parseFloat(paymentData.amount);
    const discount = parseFloat(paymentData.discount) || 0;
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const billData = {
      student: selectedStudent,
      payment: {
        ...paymentData,
        amount,
        discount,
        total: amount - discount,
        studentId: selectedStudent.id,
        parentId: selectedStudent.parent?.id,
      }
    };

    onGenerateBill(selectedStudent, billData);
    handleClose();
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setSearchText('');
    setPaymentData({
      amount: '',
      discount: '',
      method: 'CASH',
      type: 'TUITION_FEE',
      remarks: '',
      dueDate: new Date().toISOString().split('T')[0],
    });
    setShowPaymentForm(false);
    setShowHistory(false);
    setPaymentHistory([]);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return '#10b981';
      case 'UNPAID': return '#ef4444';
      case 'PARTIALLY_PAID': return '#f59e0b';
      case 'OVERDUE': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return 'cash';
      case 'CARD': return 'credit-card';
      case 'BANK_TRANSFER': return 'bank';
      case 'MOBILE_PAYMENT': return 'cellphone';
      default: return 'cash';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {showPaymentForm ? 'Payment Entry' : 'Select Student'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {!showPaymentForm ? (
            // Student Selection View
            <View style={styles.studentSelectionContainer}>
              <TextInput
                style={[styles.searchInput, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background
                }]}
                placeholder="Search students by name, phone, email, or class..."
                placeholderTextColor={colors.text + '80'}
                value={searchText}
                onChangeText={setSearchText}
              />

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading students...
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.studentList}>
                  {filteredStudents.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons 
                        name="account-search" 
                        size={48} 
                        color={colors.text + '40'} 
                      />
                      <Text style={[styles.emptyStateText, { color: colors.text }]}>
                        {searchText ? 'No students found' : 'No students available'}
                      </Text>
                    </View>
                  ) : (
                    filteredStudents.map((student) => (
                      <TouchableOpacity
                        key={student.id}
                        style={[styles.studentItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleStudentSelect(student)}
                      >
                        <View style={styles.studentAvatar}>
                          <MaterialCommunityIcons 
                            name="account" 
                            size={24} 
                            color={colors.primary} 
                          />
                        </View>
                        <View style={styles.studentInfo}>
                          <Text style={[styles.studentName, { color: colors.text }]}>
                            {student.firstName} {student.lastName}
                          </Text>
                          <Text style={[styles.studentDetail, { color: colors.text + '80' }]}>
                            Class: {student.class?.class_name || 'N/A'} | Phone: {student.phone}
                          </Text>
                          <Text style={[styles.studentStatus, { 
                            color: student.status === 'ACTIVE' ? '#10b981' : '#ef4444' 
                          }]}>
                            {student.status}
                          </Text>
                        </View>
                        <MaterialIcons 
                          name="chevron-right" 
                          size={24} 
                          color={colors.text + '60'} 
                        />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}
            </View>
          ) : (
            // Payment Form View
            <ScrollView style={styles.paymentForm}>
              {/* Student Summary */}
              <View style={[styles.studentSummaryCard, { backgroundColor: colors.background }]}>
                <View style={styles.studentSummaryHeader}>
                  <View style={styles.studentAvatar}>
                    <MaterialCommunityIcons 
                      name="account" 
                      size={32} 
                      color={colors.primary} 
                    />
                  </View>
                  <View style={styles.studentSummaryInfo}>
                    <Text style={[styles.studentSummaryName, { color: colors.text }]}>
                      {selectedStudent?.firstName} {selectedStudent?.lastName}
                    </Text>
                    <Text style={[styles.studentSummaryDetail, { color: colors.text + '80' }]}>
                      Class: {selectedStudent?.class?.class_name || 'N/A'}
                    </Text>
                    <Text style={[styles.studentSummaryDetail, { color: colors.text + '80' }]}>
                      Phone: {selectedStudent?.phone}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.historyButton, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => setShowHistory(true)}
                  >
                    <MaterialIcons name="history" size={20} color={colors.primary} />
                    <Text style={[styles.historyButtonText, { color: colors.primary }]}>
                      History
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Payment Form */}
              <View style={[styles.paymentFormCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Payment Details
                </Text>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Amount</Text>
                  <TextInput
                    style={[styles.formInput, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.card
                    }]}
                    placeholder="Enter amount"
                    placeholderTextColor={colors.text + '60'}
                    keyboardType="numeric"
                    value={paymentData.amount}
                    onChangeText={(text) => setPaymentData({...paymentData, amount: text})}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Discount</Text>
                  <TextInput
                    style={[styles.formInput, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.card
                    }]}
                    placeholder="Enter discount (optional)"
                    placeholderTextColor={colors.text + '60'}
                    keyboardType="numeric"
                    value={paymentData.discount}
                    onChangeText={(text) => setPaymentData({...paymentData, discount: text})}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Payment Method</Text>
                  <View style={styles.methodButtons}>
                    {['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'].map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.methodButton,
                          paymentData.method === method && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setPaymentData({...paymentData, method})}
                      >
                        <MaterialCommunityIcons 
                          name={getMethodIcon(method)} 
                          size={16} 
                          color={paymentData.method === method ? 'white' : colors.text} 
                        />
                        <Text style={[
                          styles.methodButtonText,
                          { color: paymentData.method === method ? 'white' : colors.text }
                        ]}>
                          {method.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Payment Type</Text>
                  <View style={styles.typeButtons}>
                    {['TUITION_FEE', 'TRANSPORT_FEE', 'LIBRARY_FEE', 'LABORATORY_FEE', 'SPORTS_FEE', 'EXAM_FEE', 'UNIFORM_FEE', 'MEAL_FEE', 'HOSTEL_FEE', 'OTHER'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          paymentData.type === type && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setPaymentData({...paymentData, type})}
                      >
                        <Text style={[
                          styles.typeButtonText,
                          { color: paymentData.type === type ? 'white' : colors.text }
                        ]}>
                          {type.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Due Date</Text>
                  <TextInput
                    style={[styles.formInput, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.card
                    }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.text + '60'}
                    value={paymentData.dueDate}
                    onChangeText={(text) => setPaymentData({...paymentData, dueDate: text})}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>Remarks</Text>
                  <TextInput
                    style={[styles.formInput, styles.remarksInput, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.card
                    }]}
                    placeholder="Additional notes..."
                    placeholderTextColor={colors.text + '60'}
                    multiline
                    numberOfLines={3}
                    value={paymentData.remarks}
                    onChangeText={(text) => setPaymentData({...paymentData, remarks: text})}
                  />
                </View>
              </View>

              {/* Payment Summary */}
              <View style={[styles.paymentSummaryCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Payment Summary
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text + '80' }]}>Amount:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    Afg {paymentData.amount || '0.00'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text + '80' }]}>Discount:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    Afg {paymentData.discount || '0.00'}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={[styles.summaryLabel, styles.totalLabel, { color: colors.text }]}>
                    Total:
                  </Text>
                  <Text style={[styles.summaryValue, styles.totalValue, { color: colors.primary }]}>
                    Afg {((parseFloat(paymentData.amount) || 0) - (parseFloat(paymentData.discount) || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.backButton, { borderColor: colors.border }]}
                  onPress={() => setShowPaymentForm(false)}
                >
                  <MaterialIcons name="arrow-back" size={20} color={colors.text} />
                  <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.generateButton, { backgroundColor: colors.primary }]}
                  onPress={handleGenerateBill}
                >
                  <MaterialIcons name="receipt" size={20} color="white" />
                  <Text style={styles.generateButtonText}>Generate Bill</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* Payment History Modal */}
          <Modal
            visible={showHistory}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowHistory(false)}
          >
            <View style={styles.historyModalOverlay}>
              <View style={[styles.historyModalContainer, { backgroundColor: colors.card }]}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyTitle, { color: colors.text }]}>
                    Payment History
                  </Text>
                  <TouchableOpacity onPress={() => setShowHistory(false)}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.historyList}>
                  {paymentHistory.length === 0 ? (
                    <View style={styles.emptyHistory}>
                      <MaterialCommunityIcons 
                        name="receipt-text" 
                        size={48} 
                        color={colors.text + '40'} 
                      />
                      <Text style={[styles.emptyHistoryText, { color: colors.text }]}>
                        No payment history found
                      </Text>
                    </View>
                  ) : (
                    paymentHistory.map((payment) => (
                      <View key={payment.id} style={[styles.historyItem, { backgroundColor: colors.background }]}>
                        <View style={styles.historyItemHeader}>
                          <Text style={[styles.historyItemDate, { color: colors.text }]}>
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </Text>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                              {payment.status}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.historyItemDetails}>
                          <Text style={[styles.historyItemAmount, { color: colors.primary }]}>
                            Afg {payment.total.toFixed(2)}
                          </Text>
                          <View style={styles.historyItemMethod}>
                            <MaterialCommunityIcons 
                              name={getMethodIcon(payment.method)} 
                              size={16} 
                              color={colors.text + '60'} 
                            />
                            <Text style={[styles.historyItemMethodText, { color: colors.text + '60' }]}>
                              {payment.method.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                        {payment.remarks && (
                          <Text style={[styles.historyItemRemarks, { color: colors.text + '80' }]}>
                            {payment.remarks}
                          </Text>
                        )}
                        <Text style={[styles.historyItemReceipt, { color: colors.text + '60' }]}>
                          Receipt: {payment.receiptNumber}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
    fontWeight: '700',
  },
  studentSelectionContainer: {
    flex: 1,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  studentList: {
    maxHeight: 400,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  studentDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  studentStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  paymentForm: {
    flex: 1,
  },
  studentSummaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  studentSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentSummaryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  studentSummaryName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  studentSummaryDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  historyButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  paymentFormCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  formRow: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  remarksInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  methodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 100,
    justifyContent: 'center',
  },
  methodButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 100,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentSummaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  historyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyModalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  historyList: {
    maxHeight: 400,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 40,
  },
  emptyHistoryText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  historyItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyItemMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemMethodText: {
    marginLeft: 4,
    fontSize: 12,
  },
  historyItemRemarks: {
    fontSize: 12,
    marginBottom: 4,
  },
  historyItemReceipt: {
    fontSize: 11,
  },
});

export default StudentPaymentSelector; 
