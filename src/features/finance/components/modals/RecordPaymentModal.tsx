import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../../contexts/TranslationContext';

interface RecordPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payment: any) => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    referenceNumber: '',
    description: '',
    isInstallment: false,
    installmentNumber: '',
    totalInstallments: '',
    notes: '',
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: 'money' },
    { id: 'card', label: 'Credit/Debit Card', icon: 'credit-card' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: 'account-balance' },
    { id: 'check', label: 'Check', icon: 'receipt' },
    { id: 'mobile_payment', label: 'Mobile Payment', icon: 'smartphone' },
    { id: 'online', label: 'Online Payment', icon: 'public' },
  ];

  const handleSave = () => {
    if (!formData.studentName.trim()) {
      Alert.alert('Validation Error', 'Please enter the student name.');
      return;
    }

    const amountNumber = Number(formData.amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    if (!formData.paymentDate.trim()) {
      Alert.alert('Validation Error', 'Please enter the payment date.');
      return;
    }

    if (formData.isInstallment) {
      if (!formData.installmentNumber || !formData.totalInstallments) {
        Alert.alert('Validation Error', 'Please enter installment details.');
        return;
      }
    }

    const paymentData = {
      ...formData,
      amount: amountNumber,
      installmentNumber: formData.isInstallment ? Number(formData.installmentNumber) : null,
      totalInstallments: formData.isInstallment ? Number(formData.totalInstallments) : null,
      recordedAt: new Date().toISOString(),
      status: 'completed',
    };

    onSave(paymentData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      studentName: '',
      studentId: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      referenceNumber: '',
      description: '',
      isInstallment: false,
      installmentNumber: '',
      totalInstallments: '',
      notes: '',
    });
    setSelectedPaymentMethod('cash');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const generateReferenceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `PAY-${year}${month}-${timestamp}`;
  };

  const renderPaymentMethod = (method: any) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethodCard,
        { backgroundColor: colors.card },
        selectedPaymentMethod === method.id && { borderColor: '#10b981', borderWidth: 2 }
      ]}
      onPress={() => {
        setSelectedPaymentMethod(method.id);
        setFormData({ ...formData, paymentMethod: method.id });
      }}
    >
      <Icon 
        name={method.icon} 
        size={24} 
        color={selectedPaymentMethod === method.id ? '#10b981' : colors.text} 
      />
      <Text style={[
        styles.paymentMethodLabel,
        { color: colors.text },
        selectedPaymentMethod === method.id && { color: '#10b981', fontWeight: '600' }
      ]}>
        {method.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Record Payment</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Student Information */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Student Information</Text>
              
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Student Name *"
                placeholderTextColor={colors.text + '80'}
                value={formData.studentName}
                onChangeText={(text) => setFormData({ ...formData, studentName: text })}
              />
              
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Student ID (Optional)"
                placeholderTextColor={colors.text + '80'}
                value={formData.studentId}
                onChangeText={(text) => setFormData({ ...formData, studentId: text })}
              />
            </View>

            {/* Payment Details */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Details</Text>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Amount *"
                    placeholderTextColor={colors.text + '80'}
                    value={formData.amount}
                    onChangeText={(text) => setFormData({ ...formData, amount: text })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                    placeholder="Payment Date *"
                    placeholderTextColor={colors.text + '80'}
                    value={formData.paymentDate}
                    onChangeText={(text) => setFormData({ ...formData, paymentDate: text })}
                  />
                </View>
              </View>
              
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Description (Optional)"
                placeholderTextColor={colors.text + '80'}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
            </View>

            {/* Payment Method */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
              <View style={styles.paymentMethodsGrid}>
                {paymentMethods.map(renderPaymentMethod)}
              </View>
            </View>

            {/* Reference Number */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Reference Information</Text>
              
              <View style={styles.referenceRow}>
                <TextInput
                  style={[styles.referenceInput, { borderColor: colors.border, color: colors.text }]}
                  placeholder="Reference Number"
                  placeholderTextColor={colors.text + '80'}
                  value={formData.referenceNumber}
                  onChangeText={(text) => setFormData({ ...formData, referenceNumber: text })}
                />
                <TouchableOpacity 
                  style={styles.generateButton}
                  onPress={() => setFormData({ ...formData, referenceNumber: generateReferenceNumber() })}
                >
                  <Text style={styles.generateButtonText}>Generate</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Installment Options */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Installment Options</Text>
              
              <View style={styles.installmentRow}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Is this an installment payment?</Text>
                <Switch
                  value={formData.isInstallment}
                  onValueChange={(value) => setFormData({ ...formData, isInstallment: value })}
                  trackColor={{ false: '#767577', true: '#10b981' }}
                  thumbColor={formData.isInstallment ? '#fff' : '#f4f3f4'}
                />
              </View>
              
              {formData.isInstallment && (
                <View style={styles.installmentDetails}>
                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                        placeholder="Installment Number"
                        placeholderTextColor={colors.text + '80'}
                        value={formData.installmentNumber}
                        onChangeText={(text) => setFormData({ ...formData, installmentNumber: text })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.halfWidth}>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                        placeholder="Total Installments"
                        placeholderTextColor={colors.text + '80'}
                        value={formData.totalInstallments}
                        onChangeText={(text) => setFormData({ ...formData, totalInstallments: text })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Text>
              <TextInput
                style={[styles.notesInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Any additional notes or comments..."
                placeholderTextColor={colors.text + '80'}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    maxHeight: '90%',
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paymentMethodCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentMethodLabel: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referenceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 12,
  },
  generateButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  installmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  installmentDetails: {
    marginTop: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RecordPaymentModal; 
