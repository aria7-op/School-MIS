import React, { useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../../contexts/TranslationContext';

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  bonus: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
}

interface ProcessPayrollModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payroll: any) => void;
}

const ProcessPayrollModal: React.FC<ProcessPayrollModalProps> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  
  const [formData, setFormData] = useState({
    payrollPeriod: new Date().getMonth() + 1,
    payrollYear: new Date().getFullYear(),
    payDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: '',
      employeeId: '',
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      overtime: 0,
      bonus: 0,
      netSalary: 0,
      status: 'pending',
    }
  ]);

  const [totalPayroll, setTotalPayroll] = useState(0);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

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

  useEffect(() => {
    const total = employees.reduce((sum, emp) => sum + emp.netSalary, 0);
    setTotalPayroll(total);
  }, [employees]);

  const calculateNetSalary = (employee: Employee) => {
    const basic = employee.basicSalary || 0;
    const allowances = employee.allowances || 0;
    const deductions = employee.deductions || 0;
    const overtime = employee.overtime || 0;
    const bonus = employee.bonus || 0;
    return basic + allowances + overtime + bonus - deductions;
  };

  const addEmployee = () => {
    const newEmployee: Employee = {
      id: Date.now().toString(),
      name: '',
      employeeId: '',
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      overtime: 0,
      bonus: 0,
      netSalary: 0,
      status: 'pending',
    };
    setEmployees([...employees, newEmployee]);
  };

  const removeEmployee = (id: string) => {
    if (employees.length > 1) {
      setEmployees(employees.filter(emp => emp.id !== id));
      setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
    }
  };

  const updateEmployee = (id: string, field: keyof Employee, value: string | number) => {
    setEmployees(employees.map(emp => {
      if (emp.id === id) {
        const updatedEmployee = { ...emp, [field]: value };
        if (field === 'basicSalary' || field === 'allowances' || field === 'deductions' || field === 'overtime' || field === 'bonus') {
          updatedEmployee.netSalary = calculateNetSalary(updatedEmployee);
        }
        return updatedEmployee;
      }
      return emp;
    }));
  };

  const toggleEmployeeSelection = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) 
        ? prev.filter(empId => empId !== id)
        : [...prev, id]
    );
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const deselectAllEmployees = () => {
    setSelectedEmployees([]);
  };

  const handleSave = () => {
    if (selectedEmployees.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one employee.');
      return;
    }

    const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.id));
    const hasInvalidEmployees = selectedEmployeeData.some(emp => !emp.name.trim() || emp.basicSalary <= 0);

    if (hasInvalidEmployees) {
      Alert.alert('Validation Error', 'Please ensure all selected employees have valid names and salaries.');
      return;
    }

    const payrollData = {
      ...formData,
      employees: selectedEmployeeData,
      totalPayroll,
      processedDate: new Date().toISOString(),
      status: 'processed',
    };

    onSave(payrollData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      payrollPeriod: new Date().getMonth() + 1,
      payrollYear: new Date().getFullYear(),
      payDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      notes: '',
    });
    setEmployees([{
      id: '1',
      name: '',
      employeeId: '',
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      overtime: 0,
      bonus: 0,
      netSalary: 0,
      status: 'pending',
    }]);
    setSelectedEmployees([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderEmployee = ({ item, index }: { item: Employee; index: number }) => (
    <View style={[styles.employeeContainer, { backgroundColor: colors.card }]}>
      <View style={styles.employeeHeader}>
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => toggleEmployeeSelection(item.id)}
        >
          <Icon 
            name={selectedEmployees.includes(item.id) ? "check-box" : "check-box-outline-blank"} 
            size={24} 
            color={selectedEmployees.includes(item.id) ? "#10b981" : colors.text} 
          />
        </TouchableOpacity>
        <Text style={[styles.employeeNumber, { color: colors.text }]}>Employee {index + 1}</Text>
        {employees.length > 1 && (
          <TouchableOpacity onPress={() => removeEmployee(item.id)} style={styles.removeButton}>
            <Icon name="delete" size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.employeeRow}>
        <View style={styles.halfWidth}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Employee Name *"
            placeholderTextColor={colors.text + '80'}
            value={item.name}
            onChangeText={(text) => updateEmployee(item.id, 'name', text)}
          />
        </View>
        <View style={styles.halfWidth}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="Employee ID"
            placeholderTextColor={colors.text + '80'}
            value={item.employeeId}
            onChangeText={(text) => updateEmployee(item.id, 'employeeId', text)}
          />
        </View>
      </View>
      
      <View style={styles.salaryRow}>
        <View style={styles.salaryColumn}>
          <Text style={[styles.label, { color: colors.text }]}>Basic Salary *</Text>
          <TextInput
            style={[styles.salaryInput, { borderColor: colors.border, color: colors.text }]}
            value={item.basicSalary.toString()}
            onChangeText={(text) => updateEmployee(item.id, 'basicSalary', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.text + '80'}
          />
        </View>
        <View style={styles.salaryColumn}>
          <Text style={[styles.label, { color: colors.text }]}>Allowances</Text>
          <TextInput
            style={[styles.salaryInput, { borderColor: colors.border, color: colors.text }]}
            value={item.allowances.toString()}
            onChangeText={(text) => updateEmployee(item.id, 'allowances', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.text + '80'}
          />
        </View>
        <View style={styles.salaryColumn}>
          <Text style={[styles.label, { color: colors.text }]}>Overtime</Text>
          <TextInput
            style={[styles.salaryInput, { borderColor: colors.border, color: colors.text }]}
            value={item.overtime.toString()}
            onChangeText={(text) => updateEmployee(item.id, 'overtime', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.text + '80'}
          />
        </View>
      </View>
      
      <View style={styles.salaryRow}>
        <View style={styles.salaryColumn}>
          <Text style={[styles.label, { color: colors.text }]}>Bonus</Text>
          <TextInput
            style={[styles.salaryInput, { borderColor: colors.border, color: colors.text }]}
            value={item.bonus.toString()}
            onChangeText={(text) => updateEmployee(item.id, 'bonus', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.text + '80'}
          />
        </View>
        <View style={styles.salaryColumn}>
          <Text style={[styles.label, { color: colors.text }]}>Deductions</Text>
          <TextInput
            style={[styles.salaryInput, { borderColor: colors.border, color: colors.text }]}
            value={item.deductions.toString()}
            onChangeText={(text) => updateEmployee(item.id, 'deductions', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.text + '80'}
          />
        </View>
        <View style={styles.salaryColumn}>
          <Text style={[styles.label, { color: colors.text }]}>Net Salary</Text>
          <Text style={[styles.netSalaryText, { color: colors.text }]}>
                              Afg ${item.netSalary.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Process Payroll</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Payroll Period */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payroll Period</Text>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={[styles.label, { color: colors.text }]}>Month</Text>
                  <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                    <Text style={[styles.pickerText, { color: colors.text }]}>
                      {months.find(m => m.value === formData.payrollPeriod)?.label}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color={colors.text} />
                  </View>
                </View>
                <View style={styles.halfWidth}>
                  <Text style={[styles.label, { color: colors.text }]}>Year</Text>
                  <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                    <Text style={[styles.pickerText, { color: colors.text }]}>
                      {formData.payrollYear}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color={colors.text} />
                  </View>
                </View>
              </View>
              
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Pay Date (YYYY-MM-DD)"
                placeholderTextColor={colors.text + '80'}
                value={formData.payDate}
                onChangeText={(text) => setFormData({ ...formData, payDate: text })}
              />
            </View>

            {/* Employee Selection */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Employees</Text>
                <View style={styles.selectionButtons}>
                  <TouchableOpacity onPress={selectAllEmployees} style={styles.selectionButton}>
                    <Text style={styles.selectionButtonText}>Select All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={deselectAllEmployees} style={styles.selectionButton}>
                    <Text style={styles.selectionButtonText}>Deselect All</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity onPress={addEmployee} style={styles.addEmployeeButton}>
                <Icon name="person-add" size={20} color="#fff" />
                <Text style={styles.addEmployeeButtonText}>Add Employee</Text>
              </TouchableOpacity>
              
              <FlatList
                data={employees}
                renderItem={renderEmployee}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>

            {/* Payment Method */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
              
              <View style={styles.paymentMethods}>
                {['bank_transfer', 'check', 'cash'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentMethodButton,
                      formData.paymentMethod === method && { backgroundColor: '#10b981' },
                    ]}
                    onPress={() => setFormData({ ...formData, paymentMethod: method })}
                  >
                    <Text
                      style={[
                        styles.paymentMethodText,
                        formData.paymentMethod === method && { color: 'white' },
                      ]}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Summary */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payroll Summary</Text>
              
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Selected Employees:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {selectedEmployees.length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Payroll:</Text>
                  <Text style={[styles.summaryValue, { color: '#10b981', fontWeight: '700' }]}>
                    Afg ${totalPayroll.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
              <TextInput
                style={[styles.notesInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Additional notes..."
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
              <Text style={styles.buttonText}>Process Payroll</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addEmployeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  addEmployeeButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  employeeContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 8,
  },
  employeeNumber: {
    flex: 1,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  employeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  salaryColumn: {
    width: '30%',
  },
  salaryInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  netSalaryText: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 6,
    textAlign: 'center',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentMethodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  paymentMethodText: {
    color: '#10b981',
    fontWeight: '600',
  },
  summaryContainer: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
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

export default ProcessPayrollModal; 
