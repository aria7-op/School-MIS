import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useTheme } from '@react-navigation/native';
import { Customer } from '../types';
import { useWindowManager } from './WindowManager';
import { draftStorage } from '../utils/draftStorage';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

interface CustomerFormWindowProps {
  initialValues?: Customer;
  onSubmit: (data: Customer) => void;
  loading: boolean;
  windowId: string;
  onClose: () => void;
}

const CustomerFormWindow: React.FC<CustomerFormWindowProps> = ({
  initialValues,
  onSubmit,
  loading,
  windowId,
  onClose,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

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
  });

  const [metadataPairs, setMetadataPairs] = useState<Array<{key: string, value: string}>>([]);

  // Load draft on mount if exists
  useEffect(() => {
    const loadDraft = async () => {
      if (!initialValues?.id) {
        const draft = await draftStorage.getDraft(windowId);
        if (draft && draft.formData) {
          setFormData(draft.formData);
          if (draft.formData.metadata) {
            const pairs = Object.entries(draft.formData.metadata)
              .map(([key, value]) => ({ key, value: String(value) }));
            setMetadataPairs(pairs);
          }
        }
      }
    };
    loadDraft();
  }, [windowId, initialValues]);

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

  // Auto-save draft
  const saveDraft = useCallback(async (data: Customer) => {
    if (initialValues?.id) return; // Don't save drafts for edit mode
    
    try {
      await draftStorage.saveDraft(windowId, { ...data, metadataPairs });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [windowId, initialValues, metadataPairs]);

  // Debounced auto-save
  const handleChange = useCallback((name: keyof Customer, value: any) => {
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    setHasUnsavedChanges(true);

    // Clear existing timeout
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds after last change)
    draftSaveTimeoutRef.current = setTimeout(() => {
      saveDraft(newFormData);
    }, 2000);
  }, [formData, saveDraft]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, []);

  const addMetadataPair = () => {
    setMetadataPairs([...metadataPairs, { key: '', value: '' }]);
    setHasUnsavedChanges(true);
  };

  const removeMetadataPair = (index: number) => {
    setMetadataPairs(metadataPairs.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const updateMetadataPair = (index: number, field: 'key' | 'value', value: string) => {
    const newPairs = [...metadataPairs];
    newPairs[index][field] = value;
    setMetadataPairs(newPairs);
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert(t('error'), t('enter_customer_name'));
      return;
    }
    if (!formData.phone) {
      Alert.alert(t('error'), t('enter_mobile_number'));
      return;
    }
    
    // Delete draft on successful submit
    await draftStorage.deleteDraft(windowId);
    onSubmit(formData);
  };

  const handleClose = async () => {
    if (hasUnsavedChanges && !initialValues?.id) {
      Alert.alert(
        t('unsaved_changes') || 'Unsaved Changes',
        t('save_draft_before_closing') || 'Do you want to save your draft before closing?',
        [
          {
            text: t('discard') || 'Discard',
            style: 'destructive',
            onPress: async () => {
              await draftStorage.deleteDraft(windowId);
              onClose();
            },
          },
          {
            text: t('save_draft') || 'Save Draft',
            onPress: async () => {
              await saveDraft(formData);
              onClose();
            },
          },
          {
            text: t('cancel') || 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <View style={styles.container}>
      {/* Draft indicator */}
      {draftSaved && (
        <View style={styles.draftIndicator}>
          <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
          <Text style={styles.draftIndicatorText}>{t('draft_saved') || 'Draft saved'}</Text>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>

        {/* Three Column Grid */}
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('department')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business" size={14} color={colors.textSecondary} style={styles.inputIcon} />
                <RNPickerSelect
                  onValueChange={(value) => handleChange('department', value)}
                  items={[
                    { label: t('academic'), value: 'ACADEMIC' },
                    { label: t('finance'), value: 'FINANCE' },
                  ]}
                  value={formData.department}
                  placeholder={{ label: t('select_department'), value: null, color: '#9ca3af' }}
                  style={pickerSelectStyles}
                />
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

        {/* Remark Field - Full Width */}
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
                  <Ionicons name="trash" size={16} color={colors.error || '#ef4444'} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addMetadataButton}
            onPress={addMetadataPair}
          >
            <Ionicons name="add-circle" size={20} color={colors.primary || '#6366f1'} />
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
    </View>
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
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#0f172a',
    borderRadius: 4,
    backgroundColor: '#fff',
    boxShadow: 'none',
    overflow: 'hidden',
    borderWidth: 0,
  },
  placeholder: {
    color: '#888',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  draftIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  draftIndicatorText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  formGridThreeCol: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  formGroup: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  metadataKeyContainer: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metadataValueContainer: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metadataInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
});

export default CustomerFormWindow;

