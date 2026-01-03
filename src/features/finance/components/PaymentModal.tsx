import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import financeApi, { Student, FeeStructure, FeeItem, Installment, CreatePaymentData } from '../services/financeApi';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess: (payment: any) => void;
}

interface PaymentFormData {
  studentId: string;
  feeStructureId: string;
  installmentId?: string;
  paymentDate: string;
  dueDate: string;
  method: string;
  type: string;
  amount: number;
  discount: number;
  fine: number;
  total: number;
  remarks: string;
  month?: string;
  year?: string;
  items: PaymentItemData[];
}

interface PaymentItemData {
  feeItemId: string;
  name: string;
  amount: number;
  discount: number;
  fine: number;
  total: number;
  isOptional: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  onPaymentSuccess,
}) => {
  const { colors } = useTheme();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [showFeeStructureSelector, setShowFeeStructureSelector] = useState(false);
  const [showInstallmentSelector, setShowInstallmentSelector] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    studentId: '',
    feeStructureId: '',
    installmentId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    method: 'CASH',
    type: 'TUITION_FEE',
    amount: 0,
    discount: 0,
    fine: 0,
    total: 0,
    remarks: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    year: new Date().getFullYear().toString(),
    items: [],
  });

  // Load data on modal open
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Test basic connectivity first
      try {
        const testResponse = await fetch('https://khwanzay.school/api/students?limit=1');
        if (testResponse.ok) {
          const testData = await testResponse.text();
          console.log('🌐 Direct fetch test successful:', testData);
        }
      } catch (fetchError) {
        console.error('🌐 Direct fetch test failed:', fetchError);
      }
      
      await Promise.all([
        loadStudents(),
        loadFeeStructures(),
        // loadInstallments(), // Temporarily disabled due to 500 error
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await financeApi.getStudents({ limit: 100 });
      
      if (response && response.success) {
        setStudents(response.data || []);
      } else {
        console.log('No students data received');
      }
    } catch (error) {
      console.error('❌ Error loading students:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
  };

  const loadFeeStructures = async () => {
    try {
      const response = await financeApi.getFeeStructures();
      
      if (response && response.success) {
        setFeeStructures(response.data || []);
      } else {
        console.log('No fee structures data received');
      }
    } catch (error) {
      console.error('❌ Error loading fee structures:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
  };

  const loadInstallments = async () => {
    try {
      const response = await financeApi.getInstallments({ limit: 50 });
      if (response.success) {
        setInstallments(response.data);
      } else {
        console.log('No installments data received');
      }
    } catch (error) {
      console.error('❌ Error loading installments:', error);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setPaymentForm(prev => ({
      ...prev,
      studentId: student.id,
    }));
    setShowStudentSelector(false);
    setStudentSearchQuery(''); // Clear search when selecting
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    if (!studentSearchQuery.trim()) return true;
    
    const query = studentSearchQuery.toLowerCase();
    const fullName = `${student.user.firstName} ${student.user.lastName}`.toLowerCase();
    const admissionNo = student.admissionNo.toLowerCase();
    const className = student.class?.name?.toLowerCase() || '';
    
    return fullName.includes(query) || 
           admissionNo.includes(query) || 
           className.includes(query);
  });

  const handleFeeStructureSelect = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure);
    setPaymentForm(prev => ({
      ...prev,
      feeStructureId: feeStructure.id,
      items: feeStructure.items.map(item => ({
        feeItemId: item.id,
        name: item.name,
        amount: Number(item.amount),
        discount: 0,
        fine: 0,
        total: Number(item.amount),
        isOptional: item.isOptional,
      })),
    }));
    setShowFeeStructureSelector(false);
    calculateTotal();
  };

  const handleInstallmentSelect = (installment: Installment) => {
    setSelectedInstallment(installment);
    setPaymentForm(prev => ({
      ...prev,
      installmentId: installment.id,
      amount: installment.amount,
      dueDate: installment.dueDate,
    }));
    setShowInstallmentSelector(false);
    calculateTotal();
  };

  const calculateTotal = () => {
    const itemsTotal = paymentForm.items.reduce((sum, item) => sum + item.total, 0);
    const baseAmount = paymentForm.amount || itemsTotal;
    const total = baseAmount + paymentForm.fine - paymentForm.discount;
    setPaymentForm(prev => ({ ...prev, total }));
  };

  const updateItemAmount = (index: number, field: keyof PaymentItemData, value: number) => {
    const newItems = [...paymentForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate item total
    newItems[index].total = newItems[index].amount + newItems[index].fine - newItems[index].discount;
    
    setPaymentForm(prev => ({ ...prev, items: newItems }));
    calculateTotal();
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      Alert.alert('Error', 'Please select a student');
      return;
    }

    if (!selectedFeeStructure && paymentForm.amount <= 0) {
      Alert.alert('Error', 'Please select a fee structure or enter a payment amount');
      return;
    }

    if (paymentForm.total <= 0) {
      Alert.alert('Error', 'Total amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);

      const paymentData: CreatePaymentData = {
        amount: paymentForm.amount || paymentForm.items.reduce((sum, item) => sum + item.amount, 0),
        discount: paymentForm.discount,
        fine: paymentForm.fine,
        total: paymentForm.total,
        paymentDate: paymentForm.paymentDate,
        dueDate: paymentForm.dueDate,
        status: 'PAID',
        method: paymentForm.method,
        type: paymentForm.type,
        remarks: `${paymentForm.remarks}${paymentForm.month ? ` | Month: ${paymentForm.month}` : ''}`.trim(),
        studentId: selectedStudent.id,
        parentId: selectedStudent.parent?.id,
        feeStructureId: selectedFeeStructure?.id,
        // installmentId: selectedInstallment?.id, // Not supported by backend schema
        // month: paymentForm.month, // Not supported by backend schema  
        // year: paymentForm.year, // Not supported by backend schema
        items: paymentForm.items.map(item => ({
          feeItemId: item.feeItemId,
          amount: item.amount,
          discount: item.discount,
          fine: item.fine,
          total: item.total,
          description: item.name,
        })),
      };

      const response = await financeApi.createPayment(paymentData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Payment created successfully!',
          [
            {
              text: 'View Receipt',
              onPress: () => handleViewReceipt(response.data),
            },
            {
              text: 'OK',
              onPress: () => {
                onPaymentSuccess(response.data);
                handleClose();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      Alert.alert('Error', 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (payment: any) => {
    try {
      const response = await financeApi.generatePaymentReport({
        paymentId: payment.id,
        format: 'pdf',
      });
      
      if (response.success) {
        // Handle PDF display - you can use react-native-pdf or similar
        Alert.alert('Receipt Generated', 'Receipt has been generated successfully');
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      Alert.alert('Error', 'Failed to generate receipt');
    }
  };

  const handleClose = () => {
    setSelectedStudent(null);
    setSelectedFeeStructure(null);
    setPaymentForm({
      studentId: '',
      feeStructureId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      method: 'CASH',
      type: 'TUITION_FEE',
      remarks: '',
      items: [],
      total: 0,
      discount: 0,
      fine: 0,
    });
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return `Afg ${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.background }]}>
          <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading payment data...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal visible={visible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Create Payment
              </Text>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Student Selection */}
              <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Student Information
                </Text>
                
                <TouchableOpacity
                  style={[styles.selectorButton, { borderColor: colors.border }]}
                  onPress={() => setShowStudentSelector(true)}
                >
                  {selectedStudent ? (
                    <View style={styles.selectedItem}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {selectedStudent.user.firstName[0]}{selectedStudent.user.lastName[0]}
                        </Text>
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.text }]}>
                          {selectedStudent.user.firstName} {selectedStudent.user.lastName}
                        </Text>
                        <Text style={[styles.itemSubtext, { color: colors.text }]}>
                          {selectedStudent.admissionNo} • {selectedStudent.class?.name}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.placeholder}>
                      <MaterialIcons name="person" size={24} color={colors.text} />
                      <Text style={[styles.placeholderText, { color: colors.text }]}>
                        Select Student
                      </Text>
                    </View>
                  )}
                  <MaterialIcons name="chevron-right" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Payment Details */}
              {(selectedStudent || selectedFeeStructure || selectedInstallment) && (
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Payment Details
                  </Text>

                  {/* Payment Method - Fixed to CASH */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Payment Method
                    </Text>
                    <View style={[styles.methodDisplay, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                      <MaterialIcons name="money" size={20} color={colors.primary} />
                      <Text style={[styles.methodDisplayText, { color: colors.primary }]}>
                        CASH PAYMENT
                      </Text>
                    </View>
                  </View>

                  {/* Payment Amount */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Payment Amount (Afg)
                    </Text>
                    <TextInput
                      style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
                      value={paymentForm.amount.toString()}
                      onChangeText={(text) => {
                        const amount = parseFloat(text) || 0;
                        setPaymentForm(prev => ({ ...prev, amount }));
                        calculateTotal();
                      }}
                      placeholder="Enter payment amount"
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Payment Date */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Payment Date
                    </Text>
                    <TextInput
                      style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
                      value={paymentForm.paymentDate}
                      onChangeText={(text) => setPaymentForm(prev => ({ ...prev, paymentDate: text }))}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>

                  {/* Total Amount */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Total Amount
                    </Text>
                    <View style={[styles.totalContainer, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.totalText, { color: colors.primary }]}>
                        Afg {paymentForm.total.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Remarks */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Remarks
                    </Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea, { borderColor: colors.border, color: colors.text }]}
                      value={paymentForm.remarks}
                      onChangeText={(text) => setPaymentForm(prev => ({ ...prev, remarks: text }))}
                      placeholder="Enter payment remarks or notes"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Student Selector Modal */}
      <Modal visible={showStudentSelector} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => {
              setShowStudentSelector(false);
              setStudentSearchQuery('');
            }}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Select Student ({filteredStudents.length})
            </Text>
            <View style={{ width: 24 }} />
          </View>
          
          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <MaterialIcons name="search" size={20} color={colors.text} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name, admission number, or class..."
              placeholderTextColor={colors.text + '80'}
              value={studentSearchQuery}
              onChangeText={setStudentSearchQuery}
              autoCapitalize="none"
            />
            {studentSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setStudentSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.content}>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={[styles.studentCard, { backgroundColor: colors.card }]}
                onPress={() => handleStudentSelect(student)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {student.user.firstName[0]}{student.user.lastName[0]}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: colors.text }]}>
                    {student.user.firstName} {student.user.lastName}
                  </Text>
                  <Text style={[styles.studentDetails, { color: colors.text }]}>
                    {student.admissionNo} • {student.class?.name}
                  </Text>
                  <Text style={[styles.studentEmail, { color: colors.text }]}>
                    {student.user.email}
                  </Text>
                </View>
              </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={48} color={colors.text} />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  {studentSearchQuery.trim() ? 'No students found matching your search' : 'No students available'}
                </Text>
                {studentSearchQuery.trim() && (
                  <TouchableOpacity 
                    onPress={() => setStudentSearchQuery('')}
                    style={[styles.clearSearchButton, { borderColor: colors.primary }]}
                  >
                    <Text style={[styles.clearSearchButtonText, { color: colors.primary }]}>
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 10,
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeholderText: {
    marginLeft: 10,
    fontSize: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemInfo: {
    marginLeft: 15,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalContainer: {
    padding: 15,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  methodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  methodDisplayText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  studentInfo: {
    marginLeft: 15,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  studentEmail: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 10,
    opacity: 0.7,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    padding: 0,
  },
  clearSearchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 10,
  },
  clearSearchButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PaymentModal;
