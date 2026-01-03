import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../contexts/TranslationContext';
import { Payroll } from '../services/financeApi';
import { Payroll as PayrollType } from '../../../types/payroll';

interface AddPayrollModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payroll: Partial<PayrollType>) => void;
}

const AddPayrollModal: React.FC<AddPayrollModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    employeeName: '',
    basicSalary: '',
    allowances: '',
    deductions: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const { colors } = useTheme();
  const { t, lang } = useTranslation();

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const calculateNetSalary = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    return basic + allowances - deductions;
  };

  const handleSave = () => {
    if (!formData.employeeName || !formData.basicSalary) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const basicSalary = parseFloat(formData.basicSalary);
    const allowances = parseFloat(formData.allowances) || 0;
    const deductions = parseFloat(formData.deductions) || 0;

    if (isNaN(basicSalary) || basicSalary <= 0) {
      Alert.alert('Error', 'Please enter a valid basic salary');
      return;
    }

    const newPayroll: Partial<PayrollType> = {
      employeeName: formData.employeeName,
      basicSalary: basicSalary,
      allowances: allowances,
      deductions: deductions,
      netSalary: calculateNetSalary(),
      month: formData.month.toString().padStart(2, '0'),
      year: formData.year.toString(),
      status: 'pending',
    };

    onSave(newPayroll);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      employeeName: '',
      basicSalary: '',
      allowances: '',
      deductions: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('add_payroll')}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('employee_name')} *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={formData.employeeName}
                onChangeText={(text) => setFormData({ ...formData, employeeName: text })}
                placeholder={t('enter_employee_name')}
                placeholderTextColor={colors.text + '80'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('basic_salary')} *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={formData.basicSalary}
                onChangeText={(text) => setFormData({ ...formData, basicSalary: text })}
                placeholder="0.00"
                placeholderTextColor={colors.text + '80'}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('allowances')}
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={formData.allowances}
                onChangeText={(text) => setFormData({ ...formData, allowances: text })}
                placeholder="0.00"
                placeholderTextColor={colors.text + '80'}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('deductions')}
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={formData.deductions}
                onChangeText={(text) => setFormData({ ...formData, deductions: text })}
                placeholder="0.00"
                placeholderTextColor={colors.text + '80'}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('month')}
              </Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
                {months.map((month) => (
                  <TouchableOpacity
                    key={month.value}
                    style={[
                      styles.monthOption,
                      formData.month === month.value && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setFormData({ ...formData, month: month.value })}
                  >
                    <Text style={[
                      styles.monthText,
                      { color: formData.month === month.value ? 'white' : colors.text }
                    ]}>
                      {month.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('year')}
              </Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearOption,
                      formData.year === year && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setFormData({ ...formData, year })}
                  >
                    <Text style={[
                      styles.yearText,
                      { color: formData.year === year ? 'white' : colors.text }
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                {t('salary_summary')}
              </Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text }]}>
                  {t('basic_salary')}:
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  Afg {parseFloat(formData.basicSalary) || 0}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text }]}>
                  {t('allowances')}:
                </Text>
                <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                  +Afg {parseFloat(formData.allowances) || 0}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text }]}>
                  {t('deductions')}:
                </Text>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                  -Afg {parseFloat(formData.deductions) || 0}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.netSalaryRow]}>
                <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '600' }]}>
                  {t('net_salary')}:
                </Text>
                <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: '600' }]}>
                  Afg {calculateNetSalary()}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>
                {t('save')}
              </Text>
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
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: 8,
    padding: 8,
    maxHeight: 200,
  },
  monthOption: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  monthText: {
    fontSize: 14,
    textAlign: 'center',
  },
  yearOption: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  yearText: {
    fontSize: 14,
    textAlign: 'center',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  netSalaryRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 8,
    paddingTop: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddPayrollModal; 
