import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import { Customer } from './models';
import { useTranslation } from '../../contexts/TranslationContext';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width >= 768;

interface CustomerFormProps {
  initialValues?: Customer;
  onSubmit: (data: Customer) => void;
  loading: boolean;
  visible: boolean;
  onClose: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialValues,
  onSubmit,
  loading,
  visible,
  onClose
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<Customer>({
    id: initialValues?.id || 0,
    phone: initialValues?.phone || '',
    mobile: initialValues?.mobile || '',
    name: initialValues?.name || '',
    purpose: initialValues?.purpose || '',
    gender: initialValues?.gender || 'male',
    source: initialValues?.source || '',
    remark: initialValues?.remark || '',
    added_by: initialValues?.added_by || 1,
    department: initialValues?.department || '',
    status: initialValues?.status || 'active',
  });

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleChange = (name: keyof Customer, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    if (!formData.phone && !formData.mobile) {
      shakeAnimation();
      Alert.alert(t('error'), t('enter_phone_or_mobile'));
      return;
    }
    if (!formData.name) {
      shakeAnimation();
      Alert.alert(t('error'), t('enter_customer_name'));
      return;
    }
    
    // Map mobile to phone if phone is empty (since database only has phone field)
    const submitData = {
      ...formData,
      phone: formData.phone || formData.mobile
    };
    
    onSubmit(submitData);
  };

  const shakeAnimation = () => {
    const shake = new Animated.Value(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
    return shake;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalContent, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {initialValues ? t('edit_customer') : t('add_customer')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={[
              styles.contentContainer,
              isLargeScreen && styles.contentContainerLarge
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formHeader}>
              <Text style={styles.formSubtitle}>
                {initialValues ? t('update_customer_details') : t('fill_customer_info')}
              </Text>
            </View>

            <View style={styles.formGrid}>
              {/* Phone Field */}
              <View style={[styles.formGroup, styles.phoneField]}>
                <Text style={styles.label}>{t('phone_number')} *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call" size={14} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => handleChange('phone', text)}
                    placeholder={t('phone_placeholder')}
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Mobile Field */}
              <View style={[styles.formGroup, styles.mobileField]}>
                <Text style={styles.label}>{t('mobile_number')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="phone-portrait" size={14} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.mobile}
                    onChangeText={(text) => handleChange('mobile', text)}
                    placeholder={t('mobile_placeholder')}
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Name Field */}
              <View style={[styles.formGroup, styles.nameField]}>
                <Text style={styles.label}>{t('full_name')} *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={14} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => handleChange('name', text)}
                    placeholder={t('name_placeholder')}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              {/* Purpose Field */}
              <View style={[styles.formGroup, styles.purposeField]}>
                <Text style={styles.label}>{t('purpose')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="briefcase" size={14} color="#64748b" style={styles.inputIcon} />
                  <RNPickerSelect
                    onValueChange={(value) => handleChange('purpose', value)}
                    items={[
                      { label: t('sales_inquiry'), value: 'sales' },
                      { label: t('support'), value: 'support' },
                      { label: t('feedback'), value: 'feedback' },
                      { label: t('complaint'), value: 'complaint' },
                      { label: t('other'), value: 'other' },
                    ]}
                    value={formData.purpose}
                    placeholder={{ label: t('select_purpose'), value: null }}
                    style={pickerSelectStyles}
                  />
                </View>
              </View>

              {/* Gender Field */}
              <View style={[styles.formGroup, styles.genderField]}>
                <Text style={styles.label}>{t('gender')}</Text>
                <View style={styles.radioGroup}>
                  {[t('male'), t('female'), t('other')].map((g, idx) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.radioButton,
                        formData.gender === ['male','female','other'][idx] && styles.radioButtonSelected
                      ]}
                      onPress={() => handleChange('gender', ['male','female','other'][idx])}
                    >
                      <Text style={styles.radioLabel}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Source Field */}
              <View style={[styles.formGroup, styles.sourceField]}>
                <Text style={styles.label}>{t('source')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="compass" size={14} color="#64748b" style={styles.inputIcon} />
                  <RNPickerSelect
                    onValueChange={(value) => handleChange('source', value)}
                    items={[
                      { label: t('website'), value: 'website' },
                      { label: t('referral'), value: 'referral' },
                      { label: t('advertisement'), value: 'advertisement' },
                      { label: t('social_media'), value: 'social' },
                      { label: t('walkin'), value: 'walkin' },
                    ]}
                    value={formData.source}
                    placeholder={{ label: t('select_source'), value: null }}
                    style={pickerSelectStyles}
                  />
                </View>
              </View>

              {/* Department Field */}
              <View style={[styles.formGroup, styles.departmentField]}>
                <Text style={styles.label}>{t('department')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business" size={14} color="#64748b" style={styles.inputIcon} />
                  <RNPickerSelect
                    onValueChange={(value) => handleChange('department', value)}
                    items={[
                      { label: t('sales'), value: 'sales' },
                      { label: t('support'), value: 'support' },
                      { label: t('marketing'), value: 'marketing' },
                      { label: t('finance_department'), value: 'finance' },
                      { label: t('hr'), value: 'hr' },
                    ]}
                    value={formData.department}
                    placeholder={{ label: t('select_department'), value: null }}
                    style={pickerSelectStyles}
                  />
                </View>
              </View>

              {/* Status Field */}
              <View style={[styles.formGroup, styles.statusField]}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.statusGroup}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      formData.status === 'active' && styles.statusButtonActive
                    ]}
                    onPress={() => handleChange('status', 'active')}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.statusIndicator,
                      formData.status === 'active' ? styles.statusIndicatorActive : styles.statusIndicatorInactive
                    ]} />
                    <Text style={[
                      styles.statusLabel,
                      formData.status === 'active' && styles.statusLabelActive
                    ]}>
                      Active
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      formData.status === 'inactive' && styles.statusButtonInactive
                    ]}
                    onPress={() => handleChange('status', 'inactive')}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.statusIndicator,
                      formData.status === 'inactive' ? styles.statusIndicatorInactive : styles.statusIndicatorActive
                    ]} />
                    <Text style={[
                      styles.statusLabel,
                      formData.status === 'inactive' && styles.statusLabelInactive
                    ]}>
                      Inactive
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Remarks Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('remark')}</Text>
              <View style={styles.remarksContainer}>
                <Ionicons name="document-text" size={14} color="#64748b" style={styles.remarksIcon} />
                <TextInput
                  style={styles.remarksInput}
                  value={formData.remark}
                  onChangeText={(text) => handleChange('remark', text)}
                  placeholder={t('remark_placeholder')}
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* Spacer to ensure button is visible */}
            <View style={{ height: 30, marginTop: 20 }} />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons 
                      name={initialValues ? "save" : "add-circle"} 
                      size={22} 
                      color="#fff" 
                      style={styles.submitIcon} 
                    />
                    <Text style={styles.submitButtonText}>
                      {initialValues ? t('update_customer_button') : t('add_customer_button')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    paddingLeft: 36,
    color: '#0f172a',
    backgroundColor: 'transparent',
  },
  inputAndroid: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingLeft: 36,
    color: '#0f172a',
    backgroundColor: 'transparent',
  },
  inputWeb: {
    width:350,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#0f172a',
    borderRadius: 4,
    backgroundColor: '#fff',
    boxShadow: 'none', 
    overflow:'hidden',
    '::placeholder': { 
      color: 'red',
      fontSize: 12
    }
  },
  placeholder: {
    color: '#94a3b8',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  contentContainerLarge: {
    // paddingHorizontal: 24,
  },
  formHeader: {
    marginBottom: 18,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  formGrid: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  formGroup: {
    marginBottom: 16,
  },
  nameField: {
    width: isLargeScreen ? '100%' : '100%',
  },
  phoneField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  mobileField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  purposeField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  genderField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  sourceField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  departmentField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  statusField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 35,
    fontSize: 12,
    color: '#0f172a',
    paddingVertical: 14,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  radioLabelSelected: {
    color: '#6366f1',
  },
  statusGroup: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 4,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#eef2ff',
  },
  statusButtonInactive: {
    backgroundColor: '#fef2f2',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusIndicatorActive: {
    backgroundColor: '#22c55e',
  },
  statusIndicatorInactive: {
    backgroundColor: '#ef4444',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  statusLabelActive: {
    color: '#4338ca',
  },
  statusLabelInactive: {
    color: '#b91c1c',
  },
  remarksContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  remarksIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  remarksInput: {
    flex: 1,
    minHeight: 100,
    fontSize: 16,
    color: '#0f172a',
    textAlignVertical: 'top',
    paddingBottom: 14,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 10,
    minHeight: 50,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 140,
  },
  submitButtonDisabled: { 
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  submitIcon: {
    marginRight: 8,
  },
   modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: isLargeScreen ? '50%' : '90%',
    maxWidth: 600,
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomerForm;
