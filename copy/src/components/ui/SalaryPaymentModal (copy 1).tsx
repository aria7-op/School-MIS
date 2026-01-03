// SalaryPaymentModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StaffMember {
  id: number;
  name: string;
  position: string;
  salary: number; // Assuming salary is a number
  avatar?: string;
}

interface SalaryPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (paymentData: any) => void;
  staffMembers: StaffMember[];
}

const SalaryPaymentModal: React.FC<SalaryPaymentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  staffMembers
}) => {
  const { colors } = useTheme();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (staffMembers.length > 0) {
      // Set the selected staff member only if it's currently null or if the staffMembers list has changed
      // This prevents resetting the selection if the modal is just re-rendered with the same staff list
      if (!selectedStaff || !staffMembers.find(staff => staff.id === selectedStaff.id)) {
         setSelectedStaff(staffMembers[0]);
      }
    } else {
        setSelectedStaff(null); // Clear selected staff if the list is empty
    }
  }, [staffMembers, selectedStaff]); // Added selectedStaff to dependency array

  const handleSubmit = async () => {
    if (!selectedStaff) {
      Alert.alert('Error', 'Please select a staff member');
      return;
    }

    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    const paymentData = {
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      amount: parseFloat(amount),
      paymentMethod,
      paymentDate,
      notes,
      timestamp: new Date().toISOString()
    };

    try {
      // Save payment to AsyncStorage (you would replace this with your actual API call)
      const existingPayments = await AsyncStorage.getItem('salaryPayments');
      const payments = existingPayments ? JSON.parse(existingPayments) : [];
      payments.push(paymentData);
      await AsyncStorage.setItem('salaryPayments', JSON.stringify(payments));

      onSubmit(paymentData);
      resetForm();
    } catch (error) {
      
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    // Keep the currently selected staff member if they are still in the list, otherwise default to the first
    const currentSelectedStaffInList = staffMembers.find(staff => staff.id === selectedStaff?.id);
    setSelectedStaff(currentSelectedStaffInList || (staffMembers.length > 0 ? staffMembers[0] : null));
    setAmount('');
    setPaymentMethod('bank');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Pay Salary</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Staff Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Staff Member</Text>
              <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                <Picker
                  selectedValue={selectedStaff?.id}
                  onValueChange={(itemValue) => {
                    const staff = staffMembers.find(m => m.id === itemValue);
                    setSelectedStaff(staff || null);
                  }}
                  style={[styles.picker, { color: colors.text }]}
                  dropdownIconColor={colors.text}
                >
                   {staffMembers.length > 0 ? (
                    staffMembers.map((staff) => (
                      <Picker.Item
                        key={staff.id}
                        label={`${staff.name} (${staff.position})`}
                        value={staff.id}
                      />
                    ))
                  ) : (
                    <Picker.Item label="No staff available" value={null} />
                  )}
                </Picker>
              </View>
            </View>

            {/* Salary Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Amount</Text>
              <View style={[styles.amountInputContainer, { borderColor: colors.border }]}>
                <Text style={[styles.currencySymbol, { color: colors.text }]}>$</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                {selectedStaff?.salary !== undefined && selectedStaff?.salary !== null && !isNaN(selectedStaff.salary) && (
                  <TouchableOpacity
                    style={styles.fullSalaryButton}
                    onPress={() => setAmount(selectedStaff.salary.toString())}
                  >
                    <Text style={styles.fullSalaryButtonText}>Full Salary</Text>
                  </TouchableOpacity>
                )}
              </View>
              {selectedStaff && (
                <Text style={[styles.salaryInfo, { color: colors.text }]}>
                  Monthly Salary: {selectedStaff.salary !== undefined && selectedStaff.salary !== null && !isNaN(selectedStaff.salary)
                    ? `$${selectedStaff.salary.toFixed(2)}`
                    : 'N/A'}
                </Text>
              )}
            </View>

            {/* Payment Method */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Method</Text>
              <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                <Picker
                  selectedValue={paymentMethod}
                  onValueChange={setPaymentMethod}
                  style={[styles.picker, { color: colors.text }]}
                  dropdownIconColor={colors.text}
                >
                  <Picker.Item label="Bank Transfer" value="bank" />
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="Check" value="check" />
                  <Picker.Item label="Digital Wallet" value="digital" />
                </Picker>
              </View>
            </View>

            {/* Payment Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Date</Text>
              <View style={[styles.dateInputContainer, { borderColor: colors.border }]}>
                <Icon name="event" size={20} color={colors.text} style={styles.dateIcon} />
                <TextInput
                  style={[styles.dateInput, { color: colors.text }]}
                  value={paymentDate}
                  onChangeText={setPaymentDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Notes</Text>
              <TextInput
                style={[styles.notesInput, {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background
                }]}
                multiline
                numberOfLines={3}
                placeholder="Additional notes..."
                placeholderTextColor="#999"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.notification }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: '#4CAF50' }]}
              onPress={handleSubmit}
              disabled={isProcessing || !selectedStaff || !amount || isNaN(parseFloat(amount))} // Disable if no staff selected or amount is invalid
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="attach-money" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Process Payment</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    marginRight: 8,
    fontWeight: 'bold',
  },
  amountInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  fullSalaryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  fullSalaryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  salaryInfo: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SalaryPaymentModal;
