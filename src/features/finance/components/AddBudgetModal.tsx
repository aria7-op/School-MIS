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

type AddBudgetModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (budget: { name: string; allocated: number }) => void;
};

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const [name, setName] = useState<string>('');
  const [allocated, setAllocated] = useState<string>('');

  const handleSave = () => {
    if (!name || name.trim().length === 0) {
      Alert.alert('Validation Error', 'Please enter a budget name.');
      return;
    }
    const allocatedNumber = Number(allocated);
    if (isNaN(allocatedNumber) || allocatedNumber <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid allocated amount.');
      return;
    }
    onSave({ name: name.trim(), allocated: allocatedNumber });
    setName('');
    setAllocated('');
  };

  const handleClose = () => {
    setName('');
    setAllocated('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Add New Budget</Text>

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Budget Name"
            placeholderTextColor={colors.text + '99'}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Allocated Amount"
            placeholderTextColor={colors.text + '99'}
            value={allocated}
            onChangeText={setAllocated}
            keyboardType="numeric"
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

export default AddBudgetModal;
