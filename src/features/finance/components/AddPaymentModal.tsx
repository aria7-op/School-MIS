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
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import ComprehensiveFinanceApiService from '../services/comprehensiveFinanceApi';

type AddPaymentModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (payment: {
    studentName: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  }) => void;
};

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const [studentName, setStudentName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentType, setPaymentType] = useState<string>('TUITION_FEE');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!studentName || studentName.trim().length === 0) {
      Alert.alert('Validation Error', 'Please enter the student name.');
      return;
    }
    const amountNumber = Number(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }
    if (!paymentDate || paymentDate.trim().length === 0) {
      Alert.alert('Validation Error', 'Please enter the payment date.');
      return;
    }
    setLoading(true);
    try {
      const payment = await ComprehensiveFinanceApiService.createPayment({
        studentName: studentName.trim(),
        amount: amountNumber,
        paymentDate: paymentDate.trim(),
        paymentMethod,
        paymentType,
        payment_status: 'paid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setStudentName('');
      setAmount('');
      setPaymentDate('');
      setPaymentMethod('cash');
      onSave(payment);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStudentName('');
    setAmount('');
    setPaymentDate('');
    setPaymentMethod('cash');
    setPaymentType('TUITION_FEE');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Add New Payment</Text>

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Student Name"
            placeholderTextColor={colors.text + '99'}
            value={studentName}
            onChangeText={setStudentName}
          />

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Amount"
            placeholderTextColor={colors.text + '99'}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Payment Date (YYYY-MM-DD)"
            placeholderTextColor={colors.text + '99'}
            value={paymentDate}
            onChangeText={setPaymentDate}
          />

          <View style={styles.pickerContainer}>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Payment Method</Text>
            <View style={styles.methodButtons}>
              {['cash', 'card', 'bank-transfer'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodButton,
                    paymentMethod === method && { backgroundColor: '#6200EE' },
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.methodButtonText,
                      paymentMethod === method && { color: 'white' },
                    ]}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1).replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={{ color: colors.text, marginBottom: 4 }}>Payment Type</Text>
            <View style={styles.typeButtons}>
              {['TUITION_FEE', 'TRANSPORT_FEE', 'LIBRARY_FEE', 'LABORATORY_FEE', 'SPORTS_FEE', 'EXAM_FEE', 'UNIFORM_FEE', 'MEAL_FEE', 'HOSTEL_FEE', 'OTHER'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    paymentType === type && { backgroundColor: '#6200EE' },
                  ]}
                  onPress={() => setPaymentType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: paymentType === type ? 'white' : '#6200EE' },
                    ]}
                  >
                    {type.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#6200EE" style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
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
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  methodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6200EE',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  methodButtonText: {
    color: '#6200EE',
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
    borderColor: '#6200EE',
    minWidth: 100,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#6200EE',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AddPaymentModal;
