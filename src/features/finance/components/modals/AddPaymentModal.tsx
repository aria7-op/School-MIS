import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../../../contexts/TranslationContext';

interface AddPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (paymentData: PaymentFormData) => void;
  students?: Array<{ id: number; firstName: string; lastName: string; class?: { class_name: string } }>;
  isLoading?: boolean;
}

interface PaymentFormData {
  student_id: number;
  amount: string;
  payment_method: string;
  payment_type: string;
  payment_date: string;
  fees: string;
  notes?: string;
  receipt_url?: string;
  payment_status: string;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  students = [],
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PaymentFormData>({
    student_id: 0,
    amount: '',
    payment_method: 'cash',
    payment_type: 'TUITION_FEE',
    payment_date: new Date().toISOString().split('T')[0],
    fees: '',
    notes: '',
    receipt_url: '',
    payment_status: 'completed',
  });

  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: 'money' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: 'account-balance' },
    { value: 'credit_card', label: 'Credit Card', icon: 'credit-card' },
    { value: 'mobile_money', label: 'Mobile Money', icon: 'smartphone' },
    { value: 'check', label: 'Check', icon: 'receipt' },
    { value: 'online', label: 'Online Payment', icon: 'public' },
  ];

  const paymentTypes = [
    { value: 'TUITION_FEE', label: 'Tuition Fee' },
    { value: 'TRANSPORT_FEE', label: 'Transport Fee' },
    { value: 'LIBRARY_FEE', label: 'Library Fee' },
    { value: 'LABORATORY_FEE', label: 'Laboratory Fee' },
    { value: 'SPORTS_FEE', label: 'Sports Fee' },
    { value: 'EXAM_FEE', label: 'Exam Fee' },
    { value: 'UNIFORM_FEE', label: 'Uniform Fee' },
    { value: 'MEAL_FEE', label: 'Meal Fee' },
    { value: 'HOSTEL_FEE', label: 'Hostel Fee' },
    { value: 'OTHER', label: 'Other' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    if (!formData.student_id) {
      newErrors.student_id = 'Student is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment date is required';
    }

    if (!formData.fees) {
      newErrors.fees = 'Fees type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    } else {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: 0,
      amount: '',
      payment_method: 'cash',
      payment_type: 'TUITION_FEE',
      payment_date: new Date().toISOString().split('T')[0],
      fees: '',
      notes: '',
      receipt_url: '',
      payment_status: 'completed',
    });
    setErrors({});
  };

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const renderField = (
    label: string,
    field: keyof PaymentFormData,
    placeholder: string,
    keyboardType: 'default' | 'numeric' | 'email' | 'phone-pad' = 'default',
    multiline = false,
    required = true
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textArea,
          errors[field] && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={formData[field] as string}
        onChangeText={(text) => {
          setFormData(prev => ({ ...prev, [field]: text }));
          if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
          }
        }}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderSelectField = (
    label: string,
    field: keyof PaymentFormData,
    options: Array<{ value: string; label: string; icon?: string }>,
    required = true
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.selectContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              formData[field] === option.value && styles.selectOptionActive,
            ]}
            onPress={() => {
              setFormData(prev => ({ ...prev, [field]: option.value }));
              if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: undefined }));
              }
            }}
          >
            {option.icon && (
              <MaterialIcons
                name={option.icon as any}
                size={16}
                color={formData[field] === option.value ? '#4f46e5' : '#6b7280'}
              />
            )}
            <Text
              style={[
                styles.selectOptionText,
                formData[field] === option.value && styles.selectOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderStudentSelect = () => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        Student <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.studentSelectContainer}>
        {students.map((student) => (
          <TouchableOpacity
            key={student.id}
            style={[
              styles.studentOption,
              formData.student_id === student.id && styles.studentOptionActive,
            ]}
            onPress={() => {
              setFormData(prev => ({ ...prev, student_id: student.id }));
              if (errors.student_id) {
                setErrors(prev => ({ ...prev, student_id: undefined }));
              }
            }}
          >
            <View style={styles.studentInfo}>
              <Text
                style={[
                  styles.studentName,
                  formData.student_id === student.id && styles.studentNameActive,
                ]}
              >
                {student.firstName} {student.lastName}
              </Text>
              {student.class && (
                <Text style={styles.studentClass}>{student.class.class_name}</Text>
              )}
            </View>
            {formData.student_id === student.id && (
              <MaterialIcons name="check-circle" size={20} color="#4f46e5" />
            )}
          </TouchableOpacity>
        ))}
      </View>
      {errors.student_id && <Text style={styles.errorText}>{errors.student_id}</Text>}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <MaterialIcons name="payment" size={24} color="#4f46e5" />
              <Text style={styles.modalTitle}>Add New Payment</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Student Selection */}
            {renderStudentSelect()}

            {/* Amount */}
            {renderField('Amount (Afg)', 'amount', 'Enter amount', 'numeric', false, true)}

            {/* Payment Method */}
            {renderSelectField('Payment Method', 'payment_method', paymentMethods, true)}

            {/* Payment Type */}
            {renderSelectField('Payment Type', 'payment_type', paymentTypes, true)}

            {/* Fees */}
            {renderField('Fees Description', 'fees', 'e.g., Tuition Fee for January 2024', 'default', false, true)}

            {/* Payment Date */}
            {renderField('Payment Date', 'payment_date', 'YYYY-MM-DD', 'default', false, true)}

            {/* Notes */}
            {renderField('Notes', 'notes', 'Additional notes (optional)', 'default', true, false)}

            {/* Receipt URL */}
            {renderField('Receipt URL', 'receipt_url', 'Receipt file path (optional)', 'default', false, false)}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Add Payment</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
    maxHeight: 500,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  selectOptionActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectOptionTextActive: {
    color: '#4f46e5',
    fontWeight: '500',
  },
  studentSelectContainer: {
    maxHeight: 200,
  },
  studentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  studentOptionActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  studentNameActive: {
    color: '#4f46e5',
  },
  studentClass: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default AddPaymentModal; 
