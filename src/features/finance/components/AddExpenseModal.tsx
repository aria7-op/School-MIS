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
} from 'react-native';
import { useTheme } from '@react-navigation/native';

type AddExpenseModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (expense: {
    description: string;
    amount: number;
    category: string;
    expenseDate: string;
  }) => void;
};

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Rent');
  const [expenseDate, setExpenseDate] = useState<string>('');

  const handleSave = () => {
    if (!description || (description as string).trim().length === 0) {
      Alert.alert('Validation Error', 'Please enter the expense description.');
      return;
    }
    const amountNumber = Number(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }
    if (!expenseDate || (expenseDate as string).trim().length === 0) {
      Alert.alert('Validation Error', 'Please enter the expense date.');
      return;
    }
    onSave({
      description: (description as string).trim(),
      amount: amountNumber,
      category,
      expenseDate: (expenseDate as string).trim(),
    });
    setDescription('');
    setAmount('');
    setCategory('Rent');
    setExpenseDate('');
  };

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setCategory('Rent');
    setExpenseDate('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Add New Expense</Text>

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Description"
            placeholderTextColor={colors.text + '99'}
            value={description}
            onChangeText={setDescription}
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
            placeholder="Category (e.g., Rent, Utilities)"
            placeholderTextColor={colors.text + '99'}
            value={category}
            onChangeText={setCategory}
          />

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Expense Date (YYYY-MM-DD)"
            placeholderTextColor={colors.text + '99'}
            value={expenseDate}
            onChangeText={setExpenseDate}
          />

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
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

export default AddExpenseModal;
