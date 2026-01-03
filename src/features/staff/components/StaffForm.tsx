import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Staff, CreateStaffData, UpdateStaffData } from '../hooks/useStaffApi';

interface StaffFormProps {
  onSubmit: (data: CreateStaffData | UpdateStaffData) => void;
  onCancel: () => void;
  initialData?: Staff | null;
  mode?: 'create' | 'edit';
}

const StaffForm: React.FC<StaffFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<CreateStaffData>({
    username: '',
    email: '',
    phone: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    displayName: '',
    gender: 'MALE',
    birthDate: '',
    avatar: '',
    bio: '',
    employeeId: '',
    departmentId: 1,
    designation: '',
    joiningDate: '',
    salary: 0,
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    schoolId: 1,
    timezone: 'UTC',
    locale: 'en',
    metadata: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        username: initialData.username || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        password: '', // Don't populate password for edit
        firstName: initialData.firstName || '',
        middleName: initialData.middleName || '',
        lastName: initialData.lastName || '',
        displayName: initialData.displayName || '',
        gender: initialData.gender || 'MALE',
        birthDate: initialData.birthDate || '',
        avatar: initialData.avatar || '',
        bio: initialData.bio || '',
        employeeId: initialData.employeeId || '',
        departmentId: initialData.departmentId || 1,
        designation: initialData.designation || '',
        joiningDate: initialData.joiningDate || '',
        salary: initialData.salary || 0,
        accountNumber: initialData.accountNumber || '',
        bankName: initialData.bankName || '',
        ifscCode: initialData.ifscCode || '',
        schoolId: initialData.schoolId || 1,
        timezone: initialData.timezone || 'UTC',
        locale: initialData.locale || 'en',
        metadata: initialData.metadata || {},
      });
    }
  }, [initialData, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }
    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }
    if (!formData.joiningDate.trim()) {
      newErrors.joiningDate = 'Joining date is required';
    }
    if (formData.salary <= 0) {
      newErrors.salary = 'Salary must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'edit' && initialData) {
        const updateData: UpdateStaffData = {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          displayName: formData.displayName,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          birthDate: formData.birthDate,
          avatar: formData.avatar,
          bio: formData.bio,
          designation: formData.designation,
          salary: formData.salary,
          accountNumber: formData.accountNumber,
          bankName: formData.bankName,
          ifscCode: formData.ifscCode,
          timezone: formData.timezone,
          locale: formData.locale,
          metadata: formData.metadata,
        };
        await onSubmit(updateData);
      } else {
        await onSubmit(formData);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CreateStaffData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderField = (
    label: string,
    field: keyof CreateStaffData,
    placeholder: string,
    type: 'text' | 'email' | 'number' | 'date' = 'text',
    required: boolean = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        placeholder={placeholder}
        value={formData[field] as string}
        onChangeText={(value) => updateField(field, value)}
        keyboardType={type === 'email' ? 'email-address' : type === 'number' ? 'numeric' : 'default'}
        autoCapitalize={type === 'email' ? 'none' : 'words'}
        autoCorrect={false}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderPicker = (
    label: string,
    field: keyof CreateStaffData,
    options: { label: string; value: any }[],
    required: boolean = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={[styles.pickerContainer, errors[field] && styles.inputError]}>
        <Picker
          selectedValue={formData[field]}
          onValueChange={(value) => updateField(field, value)}
          style={styles.picker}
        >
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {mode === 'create' ? 'Add New Staff Member' : 'Edit Staff Member'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'create' 
            ? 'Fill in the details to create a new staff member' 
            : 'Update the staff member information'
          }
        </Text>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.row}>
          {renderField('First Name', 'firstName', 'Enter first name', 'text', true)}
          {renderField('Last Name', 'lastName', 'Enter last name', 'text', true)}
        </View>
        
        {renderField('Middle Name', 'middleName', 'Enter middle name (optional)', 'text')}
        {renderField('Display Name', 'displayName', 'Enter display name', 'text')}
        
        <View style={styles.row}>
          {renderField('Email', 'email', 'Enter email address', 'email', true)}
          {renderField('Phone', 'phone', 'Enter phone number', 'text', true)}
        </View>

        {renderPicker('Gender', 'gender', [
          { label: 'Male', value: 'MALE' },
          { label: 'Female', value: 'FEMALE' },
          { label: 'Other', value: 'OTHER' },
        ])}

        {renderField('Birth Date', 'birthDate', 'YYYY-MM-DD', 'date')}
        {renderField('Bio', 'bio', 'Enter bio (optional)', 'text')}
      </View>

      {/* Employment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employment Information</Text>
        
        {renderField('Employee ID', 'employeeId', 'Enter employee ID', 'text', true)}
        {renderField('Designation', 'designation', 'Enter designation', 'text', true)}
        {renderField('Joining Date', 'joiningDate', 'YYYY-MM-DD', 'date', true)}
        {renderField('Salary', 'salary', 'Enter salary', 'number', true)}
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        {renderField('Username', 'username', 'Enter username', 'text', mode === 'create')}
        {mode === 'create' && renderField('Password', 'password', 'Enter password', 'text', true)}
      </View>

      {/* Banking Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Banking Information (Optional)</Text>
        
        {renderField('Account Number', 'accountNumber', 'Enter account number', 'text')}
        {renderField('Bank Name', 'bankName', 'Enter bank name', 'text')}
        {renderField('IFSC Code', 'ifscCode', 'Enter IFSC code', 'text')}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        {renderField('Timezone', 'timezone', 'Enter timezone', 'text')}
        {renderField('Locale', 'locale', 'Enter locale', 'text')}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.submitButtonText}>Saving...</Text>
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'create' ? 'Create Staff' : 'Update Staff'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldContainer: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6366f1',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
});

export default StaffForm;
