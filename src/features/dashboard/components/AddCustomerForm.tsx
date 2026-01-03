import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TextInput, 
  Modal, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { addCustomer } from './apiService';
import Card from './shared/Card';
import SectionTitle from './shared/SectionTitle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../../../contexts/TranslationContext';

interface AddCustomerFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCustomerForm: React.FC<AddCustomerFormProps> = ({ 
  visible, 
  onClose, 
  onSuccess 
}) => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    gender: 'male', // Changed to lowercase to match backend validation
    mobile: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('1');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) setUserId(id);
      } catch (error) {
        
      }
    };
    fetchUserId();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name || !formData.mobile) {
      Alert.alert('Validation Error', 'Name and Mobile are required fields');
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      await addCustomer({
        ...formData,
        added_by: userId
      });
      Alert.alert('Success', 'Customer added successfully', [
        { text: 'OK', onPress: () => {
          onSuccess();
          onClose();
          setFormData({
            name: '',
            purpose: '',
            gender: 'male',
            mobile: '',
            department: '',
          });
        }}
      ]);
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Transform backend errors into a more user-friendly format
        const formattedErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          formattedErrors[field] = (messages as string[]).join(', ');
        });
        setErrors(formattedErrors);
      } else {
        Alert.alert('Error', error.message || 'Failed to add customer');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Card style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <SectionTitle title={t('add_customer')} />
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons 
                name="close" 
                size={24} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContainer}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('full_name')} *</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    color: colors.text, 
                    borderColor: errors.name ? colors.notification : colors.border,
                    backgroundColor: colors.background
                  }
                ]}
                placeholder={t('name_placeholder')}
                placeholderTextColor={colors.text}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  setErrors(prev => ({ ...prev, name: '' }));
                }}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('mobile_number')} *</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    color: colors.text, 
                    borderColor: errors.mobile ? colors.notification : colors.border,
                    backgroundColor: colors.background
                  }
                ]}
                placeholder={t('mobile_placeholder')}
                placeholderTextColor={colors.text}
                keyboardType="phone-pad"
                value={formData.mobile}
                onChangeText={(text) => {
                  setFormData({ ...formData, mobile: text });
                  setErrors(prev => ({ ...prev, mobile: '' }));
                }}
              />
              {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('purpose')}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background
                  }
                ]}
                placeholder={t('purpose')}
                placeholderTextColor={colors.text}
                value={formData.purpose}
                onChangeText={(text) => setFormData({ ...formData, purpose: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('department')}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background
                  }
                ]}
                placeholder={t('department')}
                placeholderTextColor={colors.text}
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>{t('gender')} *</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={styles.radioButton}
                  onPress={() => {
                    setFormData({ ...formData, gender: 'male' });
                    setErrors(prev => ({ ...prev, gender: '' }));
                  }}
                >
                  <MaterialCommunityIcons 
                    name={formData.gender === 'male' ? 'radiobox-marked' : 'radiobox-blank'} 
                    size={20} 
                    color={colors.primary} 
                  />
                  <Text style={[styles.radioLabel, { color: colors.text }]}>{t('male')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.radioButton, { marginLeft: 15 }]}
                  onPress={() => {
                    setFormData({ ...formData, gender: 'female' });
                    setErrors(prev => ({ ...prev, gender: '' }));
                  }}
                >
                  <MaterialCommunityIcons 
                    name={formData.gender === 'female' ? 'radiobox-marked' : 'radiobox-blank'} 
                    size={20} 
                    color={colors.primary} 
                  />
                  <Text style={[styles.radioLabel, { color: colors.text }]}>{t('female')}</Text>
                </TouchableOpacity>
              </View>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
            </View>
            
            {errors.added_by && (
              <Text style={styles.errorText}>
                User authentication error. Please try again.
              </Text>
            )}
          </ScrollView>

          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.cancelButton,
                { borderColor: colors.primary }
              ]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.submitButton, 
                { 
                  backgroundColor: colors.primary,
                  opacity: loading ? 0.7 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>{t('add_customer_button')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  scrollContainer: {
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 5,
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: 5,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    marginLeft: 5,
    fontSize: 14,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 10,
  },
  submitButton: {
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default AddCustomerForm;
