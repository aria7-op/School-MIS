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
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isLargeScreen = width >= 768;

interface ClassData {
  id: string;
  class_name: string;
  class_code: string;
  room_num: string;
  students_amount: string;
  enrolled_students: string;
  students_type: string;
  timing: string;
}

type Props = {
  visible: boolean;
  classItem: ClassData | null;
  onClose: () => void;
  onSave: (updatedClass: ClassData) => void;
};

const EditClassModal: React.FC<Props> = ({ visible, classItem, onClose, onSave }) => {
  const [editedClass, setEditedClass] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  const { colors } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (classItem) {
      setEditedClass({ ...classItem });
    }
  }, [classItem]);

  useEffect(() => {
    if (visible) {
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
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [visible]);

  const handleInputChange = (field: keyof ClassData, value: string): void => {
    if (editedClass) {
      setEditedClass({
        ...editedClass,
        [field]: value,
      });
    }
  };

  const handleSave = async () => {
    if (!editedClass) return;

    if (!editedClass.class_name.trim()) {
      shakeAnimation();
      Alert.alert(t('validationError'), t('enterClassName'));
      return;
    }
    if (!editedClass.class_code.trim()) {
      shakeAnimation();
      Alert.alert(t('validationError'), t('enterClassCode'));
      return;
    }

    setIsLoading(true);
    try {
      onSave(editedClass);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update class');
      
    } finally {
      setIsLoading(false);
    }
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

  if (!editedClass) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <ScrollView 
            contentContainerStyle={[
              styles.contentContainer,
              isLargeScreen && styles.contentContainerLarge
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{t('editClass')}</Text>
              <Text style={styles.formSubtitle}>{t('updateClassInfo')}</Text>
            </View>

            <View style={styles.formGrid}>
              {/* Class Name Field */}
              <View style={[styles.formGroup, styles.nameField]}>
                <Text style={styles.label}>{t('className')} *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="school" size={14} color={colors.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={editedClass.class_name}
                    onChangeText={(text: string) => handleInputChange('class_name', text)}
                    placeholder={t('classNamePlaceholder')}
                    placeholderTextColor={colors.text}
                  />
                </View>
              </View>

              {/* Class Code Field */}
              <View style={[styles.formGroup, styles.codeField]}>
                <Text style={styles.label}>{t('classCode')} *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="code" size={14} color={colors.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={editedClass.class_code}
                    onChangeText={(text: string) => handleInputChange('class_code', text)}
                    placeholder={t('classCodePlaceholder')}
                    placeholderTextColor={colors.text}
                  />
                </View>
              </View>

              {/* Room Number Field */}
              <View style={[styles.formGroup, styles.roomField]}>
                <Text style={styles.label}>{t('roomNumber')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location" size={14} color={colors.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={editedClass.room_num}
                    onChangeText={(text: string) => handleInputChange('room_num', text)}
                    placeholder={t('roomNumberPlaceholder')}
                    placeholderTextColor={colors.text}
                  />
                </View>
              </View>

              {/* Timing Field */}
              <View style={[styles.formGroup, styles.timingField]}>
                <Text style={styles.label}>{t('classTiming')}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="time" size={14} color={colors.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={editedClass.timing}
                    onChangeText={(text: string) => handleInputChange('timing', text)}
                    placeholder={t('classTimingPlaceholder')}
                    placeholderTextColor={colors.text}
                  />
                </View>
              </View>

              {/* Student Type Field */}
              <View style={[styles.formGroup, styles.typeField]}>
                <Text style={styles.label}>{t('studentType')}</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      editedClass.students_type?.toLowerCase() === 'undergraduate' && styles.radioButtonSelected
                    ]}
                    onPress={() => handleInputChange('students_type', 'Undergraduate')}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="school" 
                      size={16} 
                      color={editedClass.students_type?.toLowerCase() === 'undergraduate' ? colors.primary : colors.text} 
                    />
                    <Text style={[
                      styles.radioLabel,
                      editedClass.students_type?.toLowerCase() === 'undergraduate' && styles.radioLabelSelected
                    ]}>
                      {t('undergraduate')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      editedClass.students_type?.toLowerCase() === 'graduate' && styles.radioButtonSelected
                    ]}
                    onPress={() => handleInputChange('students_type', 'Graduate')}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="school" 
                      size={16} 
                      color={editedClass.students_type?.toLowerCase() === 'graduate' ? colors.primary : colors.text} 
                    />
                    <Text style={[
                      styles.radioLabel,
                      editedClass.students_type?.toLowerCase() === 'graduate' && styles.radioLabelSelected
                    ]}>
                      {t('graduate')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Capacity Fields */}
              <View style={[styles.formGroup, styles.capacityField]}>
                <Text style={styles.label}>{t('classCapacity')}</Text>
                <View style={styles.capacityRow}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                    <Ionicons name="people" size={14} color={colors.text} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={editedClass.students_amount}
                      onChangeText={(text: string) => handleInputChange('students_amount', text)}
                      placeholder={t('totalStudentsPlaceholder')}
                      placeholderTextColor={colors.text}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Ionicons name="person-add" size={14} color={colors.text} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={editedClass.enrolled_students}
                      onChangeText={(text: string) => handleInputChange('enrolled_students', text)}
                      placeholder={t('enrolledStudentsPlaceholder')}
                      placeholderTextColor={colors.text}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <Text style={styles.capacityHint}>{t('totalEnrolledHint')}</Text>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isLoading && styles.submitButtonDisabled
                ]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons 
                      name="save" 
                      size={20} 
                      color="#fff" 
                      style={styles.submitIcon} 
                    />
                    <Text style={styles.submitButtonText}>
                      Update Class
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '60%',
    maxHeight: '90%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 20,
  },
  contentContainerLarge: {
    // padding:20
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  formGrid: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  formGroup: {
    marginBottom: 20,
  },
  nameField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  codeField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  roomField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  timingField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  typeField: {
    width: isLargeScreen ? '48%' : '100%',
  },
  capacityField: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingLeft: 36,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal:8
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
    paddingVertical: 12,
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
  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capacityHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'right',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
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
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonDisabled: { 
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  submitIcon: {
    marginRight: 8,
  },
});

export default EditClassModal;
