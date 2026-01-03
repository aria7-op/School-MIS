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
import { useTranslation } from '../../../contexts/TranslationContext';
import { useTheme } from '@react-navigation/native';
import { Customer } from '../types';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width >= 768;



interface CustomerFormProps {
  initialValues?: Customer;
  onSubmit: (data: Customer) => void;
  loading: boolean;
  visible: boolean;
  onClose: () => void;
  isInline?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialValues,
  onSubmit,
  loading,
  visible,
  onClose,
  isInline = false
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [formData, setFormData] = useState<Customer>({
    id: initialValues?.id || 0,
    name: initialValues?.name || '',
    phone: initialValues?.phone || '',
    mobile: initialValues?.mobile || '',
    purpose: initialValues?.purpose || '',
    gender: initialValues?.gender || 'MALE',
    source: initialValues?.source || '',
    remark: initialValues?.remark || '',
    department: initialValues?.department || '',
    priority: initialValues?.priority || 'MEDIUM',
    type: initialValues?.type || 'PROSPECT',
    refered_to: initialValues?.refered_to || '',
    referredTo: initialValues?.referredTo || 'OWNER',
    referredById: initialValues?.referredById || 10,
    metadata: initialValues?.metadata || {},
    createdAt: initialValues?.createdAt || new Date().toISOString(),
    updatedAt: initialValues?.updatedAt || new Date().toISOString(),
    deletedAt: initialValues?.deletedAt || null,
    ownerId: initialValues?.ownerId || 2,
    schoolId: initialValues?.schoolId || 1,
    createdBy: initialValues?.createdBy || 3,
    updatedBy: initialValues?.updatedBy || 4,
    userId: initialValues?.userId || 5,
    type: initialValues?.type || 'STUDENT',
    // pipelineStageId: initialValues?.pipelineStageId || 7,
  });

  const [metadataPairs, setMetadataPairs] = useState<Array<{key: string, value: string}>>([]);
  // Remove tagsInput and metadataPairs if not used elsewhere

  // Initialize metadata pairs from existing metadata
  useEffect(() => {
    if (initialValues?.metadata) {
      const pairs = Object.entries(initialValues.metadata)
        .map(([key, value]) => ({ key, value: String(value) }));
      setMetadataPairs(pairs);
    }
  }, [initialValues]);

  // Update metadata when pairs change
  useEffect(() => {
    const metadata: any = {};
    metadataPairs.forEach(pair => {
      if (pair.key.trim()) {
        metadata[pair.key.trim()] = pair.value;
      }
    });
    handleChange('metadata', metadata);
  }, [metadataPairs]);

  // Update tags when tagsInput changes
  // useEffect(() => {
  //   const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  //   handleChange('tags', tags);
  // }, [tagsInput]);

  const addMetadataPair = () => {
    setMetadataPairs([...metadataPairs, { key: '', value: '' }]);
  };

  const removeMetadataPair = (index: number) => {
    setMetadataPairs(metadataPairs.filter((_, i) => i !== index));
  };

  const updateMetadataPair = (index: number, field: 'key' | 'value', value: string) => {
    const newPairs = [...metadataPairs];
    newPairs[index][field] = value;
    setMetadataPairs(newPairs);
  };

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      })
    ]).start();
  }, []);

  const handleChange = (name: keyof Customer, value: any) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      shakeAnimation();
      Alert.alert(t('error'), t('enter_customer_name'));
      return;
    }
    if (!formData.phone) {
      shakeAnimation();
      Alert.alert(t('error'), t('enter_mobile_number'));
      return;
    }
    onSubmit(formData);
  };

  const shakeAnimation = () => {
    const shake = new Animated.Value(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: false }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: false }),
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: false }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: false })
    ]).start();
    return shake;
  };

  if (!visible) return null;

  const formContent = (
    <>
      {/* Header - only show if not inline */}
      {!isInline && (
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {initialValues ? t('edit_customer') : t('add_customer')}
          </Text>
          <View style={styles.headerControls}>
            {/* Minimize button */}
          <TouchableOpacity
              style={styles.windowControlButton}
              onPress={() => {
                // Minimize functionality - will be handled by parent
                Alert.alert('Info', 'Minimize functionality - will minimize to bottom tray');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="remove-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            {/* Maximize button */}
            <TouchableOpacity
              style={styles.windowControlButton}
              onPress={() => {
                Alert.alert('Info', 'Maximize functionality - will expand to fullscreen');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="expand-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            {/* Close button */}
            <TouchableOpacity
              style={[styles.windowControlButton, styles.closeControlButton]}
            onPress={onClose}
            activeOpacity={0.7}
          >
              <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={[
          styles.contentContainer,
          isLargeScreen && styles.contentContainerLarge
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >


            {/* Basic Information Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>

            {/* Three Column Layout */}
            <View style={styles.formGridThreeCol}>
              {/* Column 1 */}
              <View style={styles.column}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('full_name')} *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => handleChange('name', text)}
                    placeholder={t('name_placeholder')}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              </View>

                <View style={styles.formGroup}>
                <Text style={styles.label}>{t('gender')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <RNPickerSelect
                    onValueChange={(value) => handleChange('gender', value)}
                    items={[
                      { label: t('male'), value: 'MALE' },
                      { label: t('female'), value: 'FEMALE' },
                      { label: t('other'), value: 'OTHER' },
                      { label: t('prefer_not_to_say'), value: 'PREFER_NOT_TO_SAY' },
                    ]}
                    value={formData.gender}
                    placeholder={{ label: t('select_gender'), value: null, color: '#9ca3af' }}
                    style={pickerSelectStyles}
                  />
                </View>
              </View>

              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('department')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business" size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <RNPickerSelect
                    onValueChange={(value) => handleChange('department', value)}
                    items={[
                      { label: t('academic'), value: 'ACADEMIC' },
                      // { label: t('administration'), value: 'ADMINISTRATION' },
                      // { label: t('admissions'), value: 'ADMISSIONS' },
                      { label: t('finance'), value: 'FINANCE' },
                      // { label: t('it'), value: 'IT' },
                      // { label: t('marketing'), value: 'MARKETING' },
                      // { label: t('student_services'), value: 'STUDENT_SERVICES' },
                      // { label: t('other'), value: 'OTHER' },
                    ]}
                    value={formData.department}
                    placeholder={{ label: t('select_department'), value: null, color: '#9ca3af' }}
                    style={pickerSelectStyles}
                  />
                </View>
              </View>

              </View>
              </View>

              {/* Column 2 */}
              <View style={styles.column}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('phone')}</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call" size={14} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.phone}
                      onChangeText={(text) => handleChange('phone', text)}
                      placeholder="+2348012345678"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('type')}</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-circle" size={14} color={colors.textSecondary} style={styles.inputIcon} />
                    <RNPickerSelect
                      onValueChange={(value) => handleChange('type', value)}
                      items={[
                        { label: t('student'), value: 'STUDENT' },
                        { label: t('parent'), value: 'PARENT' },
                        { label: t('teacher'), value: 'TEACHER' },
                        { label: t('staff'), value: 'STAFF' },
                      ]}
                      value={formData.type}
                      placeholder={{ label: t('select_type'), value: null, color: '#9ca3af' }}
                      style={pickerSelectStyles}
                    />
                  </View>
                </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('source')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="share-social" size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <RNPickerSelect
                    onValueChange={(value) => handleChange('source', value)}
                    items={[
                      { label: t('facebook'), value: 'FACEBOOK' },
                      { label: t('instagram'), value: 'INSTAGRAM' },
                      { label: t('website'), value: 'WEBSITE' },
                      { label: t('referral'), value: 'REFERRAL' },
                      { label: t('other'), value: 'OTHER' },
                    ]}
                    value={formData.source}
                    placeholder={{ label: t('select_source'), value: null, color: '#9ca3af' }}
                    style={pickerSelectStyles}
                  />
                  </View>
                </View>
              </View>

              {/* Column 3 */}
              <View style={styles.column}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('purpose')}</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="flag" size={14} color={colors.textSecondary} style={styles.inputIcon} />
                    <RNPickerSelect
                      onValueChange={(value) => handleChange('purpose', value)}
                      items={[
                        { label: t('enrollment'), value: 'ENROLLMENT' },
                        { label: t('information'), value: 'INFORMATION' },
                        { label: t('course'), value: 'Course' },
                        { label: t('other'), value: 'OTHER' },
                      ]}
                      value={formData.purpose}
                      placeholder={{ label: t('select_purpose'), value: null, color: '#9ca3af' }}
                      style={pickerSelectStyles}
                    />
                  </View>
                </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('priority')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="flag" size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <RNPickerSelect
                    onValueChange={(value) => handleChange('priority', value)}
                    items={[
                      { label: t('low'), value: 'LOW' },
                      { label: t('medium'), value: 'MEDIUM' },
                      { label: t('high'), value: 'HIGH' },
                      { label: t('urgent'), value: 'URGENT' },
                    ]}
                    value={formData.priority}
                    placeholder={{ label: t('select_priority'), value: null, color: '#9ca3af' }}
                    style={pickerSelectStyles}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('referred_to')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-add" size={14} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.referredTo}
                    onChangeText={(text) => handleChange('referredTo', text)}
                    placeholder={t('enter_referred_to')}
                    placeholderTextColor="#9ca3af"
                  />
                  </View>
                </View>
              </View>
            </View>

            {/* Remark Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('remarks')}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.remark}
                  onChangeText={(text) => handleChange('remark', text)}
                  placeholder={t('remarks_placeholder')}
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Metadata Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('custom_fields')}</Text>
            </View>
            <View style={styles.metadataSection}>
              {/* Custom Metadata Pairs */}
              {metadataPairs.map((pair, index) => (
                <View key={index} style={styles.metadataPair}>
                  <View style={styles.metadataInputs}>
                    <View style={styles.metadataKeyContainer}>
                      <TextInput
                        style={styles.metadataInput}
                        value={pair.key}
                        onChangeText={(text) => updateMetadataPair(index, 'key', text)}
                        placeholder={t('field_name_placeholder')}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <View style={styles.metadataValueContainer}>
                      <TextInput
                        style={styles.metadataInput}
                        value={pair.value}
                        onChangeText={(text) => updateMetadataPair(index, 'value', text)}
                        placeholder={t('field_value_placeholder')}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.removeMetadataButton}
                      onPress={() => removeMetadataPair(index)}
                    >
                      <Ionicons name="trash" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addMetadataButton}
                onPress={addMetadataPair}
              >
                <Ionicons name="add-circle" size={20} color={colors.primary} />
                <Text style={styles.addMetadataText}>{t('add_custom_field')}</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="white" />
                  <Text style={styles.submitButtonText}>
                    {initialValues ? t('update_customer') : t('add_customer')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </>
      );

      // If inline, return just the form content
      if (isInline) {
        return formContent;
      }

      // If modal, wrap in modal
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
              {formContent}
            </Animated.View>
          </View>
        </Modal>
      );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    flex: 1,
    fontSize: 12,
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
    width: 350,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#0f172a',
    borderRadius: 4,
    backgroundColor: '#fff',
    boxShadow: 'none', 
    overflow: 'hidden',
    borderWidth:0,
  },
  placeholder: {
    color: '#888',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  contentContainerLarge: {
    // paddingHorizontal: 16,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formGridTwoCol: {
    // 2 columns for small/medium screens
    gap: 8,
  },
  formGridThreeCol: {
    // Always use 3 columns
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  formGridTwoCol: {
    // Keep for backward compatibility but not used
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formGroup: {
    width: '100%',
    marginBottom: 16,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
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
    height: 30,
    fontSize: 12,
    color: '#0f172a',
    paddingVertical: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap:10
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
    marginBottom: 20,
    minHeight: 60,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 100,
    alignSelf: 'flex-end',
  },
  submitButtonDisabled: { 
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 6,
  },
  submitIcon: {
    marginRight: 8,
  },
   modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: isLargeScreen ? 1000 : '95%',
    maxWidth: 1200,
    maxHeight: '90%',
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
    backgroundColor: '#eeeeee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'black',
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
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  windowControlButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeControlButton: {
    backgroundColor: '#ef4444',
  },
  metadataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
  },
  metadataKeyContainer: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metadataKeyInput: {
    fontSize: 14,
    color: '#0f172a',
  },
  metadataValueContainer: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metadataValueInput: {
    fontSize: 14,
    color: '#0f172a',
  },
  removeButton: {
    padding: 4,
  },
  emptyMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  emptyMetadataText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  metadataSection: {
    marginBottom: 16,
  },
  metadataPair: {
    marginBottom: 8,
  },
  metadataInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataInput: {
    flex: 1,
    marginRight: 8,
  },
  removeMetadataButton: {
    padding: 4,
  },
  addMetadataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  addMetadataText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  submitSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  textArea: {
    height: 100,
  },
});

export default CustomerForm;
